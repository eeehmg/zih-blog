/* ZIH V4.3 · 网页播放助手 + 浏览器兼容转码
 * 如果浏览器不能直接解码上传的视频（常见于 HEVC/H.265、部分 MOV/手机视频），
 * 会在浏览器本机用 ffmpeg.js 转成 MP4/H.264/AAC，再播放。
 * 原视频不会上传到服务器；转码在当前设备完成。
 */
(function () {
  'use strict';
  let currentObjectUrl = '';
  let currentItem = null;
  let directOverlay = null;
  let transcodeBusy = false;
  let transcodeWorker = null;
  const CACHE_DB = 'ZIH_WebVideoCache_v1';
  const CACHE_STORE = 'videos';
  const WORKER_CDNS = [
    'https://cdn.jsdelivr.net/npm/ffmpeg.js@4.2.9003/ffmpeg-worker-mp4.js',
    'https://unpkg.com/ffmpeg.js@4.2.9003/ffmpeg-worker-mp4.js'
  ];

  function qs(id) { return document.getElementById(id); }
  function revokeCurrentUrl() {
    if (currentObjectUrl) { URL.revokeObjectURL(currentObjectUrl); currentObjectUrl = ''; }
  }
  function ensureDirectOverlay() {
    if (directOverlay && directOverlay.isConnected) return directOverlay;
    directOverlay = document.createElement('div');
    directOverlay.id = 'webPlayerDirectOverlay';
    directOverlay.innerHTML = `
      <div class="web-direct-backdrop"></div>
      <div class="web-direct-dialog" role="dialog" aria-modal="true" aria-label="网页播放助手">
        <div class="web-direct-head">
          <div><strong>🎬 网页播放助手</strong><span id="webDirectTitle">正在播放…</span></div>
          <button type="button" id="webDirectClose" aria-label="关闭">✕</button>
        </div>
        <div class="web-direct-screen" id="webDirectScreen">
          <div class="web-player-empty">🎬<br><span>正在准备播放…</span></div>
        </div>
        <div class="web-direct-foot" id="webDirectInfo">浏览器内直接播放 · 不需要 Windows 播放助手</div>
      </div>`;
    document.body.appendChild(directOverlay);
    directOverlay.querySelector('#webDirectClose').addEventListener('click', closeDirectPlayer);
    directOverlay.querySelector('.web-direct-backdrop').addEventListener('click', closeDirectPlayer);
    return directOverlay;
  }
  function setInfo(text) {
    const el = qs('webPlayerInfo'); if (el) el.textContent = text;
    const de = document.getElementById('webDirectInfo'); if (de) de.textContent = text;
  }
  function setPlayerStatus(text) {
    const de = document.getElementById('webDirectInfo'); if (de) de.textContent = text;
    const el = qs('webPlayerInfo'); if (el) el.textContent = text;
  }
  function renderMedia(src, name, mime, target, onError) {
    const screen = target || qs('webPlayerScreen');
    if (!screen || !src) return null;
    screen.innerHTML = '';
    const isAudio = (mime || '').startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)(?:$|\?)/i.test(name || '');
    const el = document.createElement(isAudio ? 'audio' : 'video');
    el.controls = true;
    el.autoplay = true;
    el.playsInline = true;
    el.preload = 'metadata';
    el.src = src;
    if (mime) el.setAttribute('type', mime);
    el.addEventListener('error', function () {
      if (typeof onError === 'function') onError(el);
      else setPlayerStatus('⚠️ 浏览器无法解码这个文件。建议使用 MP4（H.264 + AAC）或 WebM。');
    }, { once: true });
    el.addEventListener('loadedmetadata', function () { setPlayerStatus('▶ 正在播放：' + (name || '媒体文件')); });
    screen.appendChild(el);
    el.play().catch(function () {});
    return el;
  }

  function openCacheDb() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('当前浏览器不支持本地缓存'));
      const req = indexedDB.open(CACHE_DB, 1);
      req.onupgradeneeded = function () {
        const db = req.result;
        if (!db.objectStoreNames.contains(CACHE_STORE)) db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IndexedDB 打开失败'));
    });
  }
  async function getCachedVideo(key) {
    try {
      const db = await openCacheDb();
      return await new Promise((resolve, reject) => {
        const req = db.transaction(CACHE_STORE, 'readonly').objectStore(CACHE_STORE).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (_) { return null; }
  }
  async function putCachedVideo(key, blob, meta) {
    try {
      const db = await openCacheDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(CACHE_STORE, 'readwrite');
        tx.objectStore(CACHE_STORE).put({ key, blob, name: meta.name, size: meta.size, sourceSize: meta.sourceSize, savedAt: Date.now() });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}
  }
  function cacheKey(item) {
    if (!item) return '';
    return [String(item.id || ''), String(item.fileName || item.title || ''), String(item.size || ''), String(item.mimeType || item.mime || '')].join('|');
  }

  async function resolveItemBlob(item, src) {
    if (item && item.localFile && window.getLocalFile) {
      try {
        const f = await window.getLocalFile(item);
        if (f) return f;
      } catch (_) {}
    }
    if (src) {
      try {
        const r = await fetch(src);
        if (r.ok) return await r.blob();
      } catch (_) {}
    }
    return null;
  }

  function makeWorkerBlob() {
    const code = `
      try {
        importScripts(${JSON.stringify(WORKER_CDNS[0])});
      } catch (e1) {
        try { importScripts(${JSON.stringify(WORKER_CDNS[1])}); }
        catch (e2) { self.postMessage({type:'zih-worker-error', data:String(e2 && e2.message || e2)}); }
      }
    `;
    return URL.createObjectURL(new Blob([code], { type: 'application/javascript' }));
  }

  function stopTranscodeWorker() {
    if (transcodeWorker) { try { transcodeWorker.terminate(); } catch (_) {} transcodeWorker = null; }
    transcodeBusy = false;
  }

  async function transcodeToBrowserMp4(blob, item) {
    if (transcodeBusy) throw new Error('已有视频正在转换，请稍候');
    if (!window.Worker || !window.Blob || !window.URL) throw new Error('当前浏览器不支持网页转码');
    if (blob.size > 1024 * 1024 * 1024) throw new Error('视频超过浏览器网页转码的安全上限（1GB）');

    transcodeBusy = true;
    setPlayerStatus('🛠️ 浏览器不能直接解码，正在本机转换为 MP4 / H.264…');
    const workerUrl = makeWorkerBlob();
    try {
      const worker = new Worker(workerUrl);
      transcodeWorker = worker;
      return await new Promise((resolve, reject) => {
        let finished = false;
        const inputName = 'input' + (String(item && (item.fileName || item.title) || 'video').match(/\.[^.]+$/) || ['.mp4'])[0];
        const outputName = 'zih-browser-compatible.mp4';
        const bytesPromise = blob.arrayBuffer();
        const cleanup = () => { if (transcodeWorker === worker) transcodeWorker = null; try { worker.terminate(); } catch (_) {} try { URL.revokeObjectURL(workerUrl); } catch (_) {} transcodeBusy = false; };
        const fail = (err) => { if (finished) return; finished = true; cleanup(); reject(err instanceof Error ? err : new Error(String(err || '转换失败'))); };
        worker.onerror = (e) => fail(new Error(e.message || '网页转码助手加载失败'));
        worker.onmessage = function (e) {
          const msg = e.data || {};
          if (msg.type === 'ready') {
            bytesPromise.then(buf => {
              worker.postMessage({
                type: 'run',
                TOTAL_MEMORY: 536870912,
                MEMFS: [{ name: inputName, data: buf }],
                arguments: ['-y', '-i', inputName, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outputName]
              });
            }).catch(fail);
          } else if (msg.type === 'stderr' || msg.type === 'stdout') {
            const line = String(msg.data || '');
            if (/error|invalid|failed/i.test(line) && line.length < 500) setPlayerStatus('🛠️ 正在转换：' + line);
            else if (/frame=|time=|speed=/i.test(line)) setPlayerStatus('🛠️ 正在转换视频，请稍候…');
          } else if (msg.type === 'done') {
            const list = msg.data && msg.data.MEMFS || [];
            const out = list.find(x => x && x.name === outputName) || list.find(x => x && /\.mp4$/i.test(x.name || ''));
            if (!out || !out.data) return fail(new Error('转换完成但没有得到 MP4 文件'));
            finished = true;
            const outBlob = new Blob([out.data], { type: 'video/mp4' });
            cleanup();
            resolve(outBlob);
          } else if (msg.type === 'error' || msg.type === 'abort' || msg.type === 'zih-worker-error') {
            fail(new Error(msg.data || '网页转码失败'));
          }
        };
      });
    } catch (e) {
      try { URL.revokeObjectURL(workerUrl); } catch (_) {}
      transcodeBusy = false;
      throw e;
    }
  }

  async function recoverDecodeFailure(item, originalSrc, mediaEl) {
    if (transcodeBusy) return;
    const overlay = ensureDirectOverlay();
    setPlayerStatus('⚠️ 当前视频编码不是浏览器原生支持的格式，正在尝试自动兼容转换…');
    try {
      const key = cacheKey(item);
      const cached = key ? await getCachedVideo(key) : null;
      let blob = cached && cached.blob ? cached.blob : null;
      if (!blob) {
        const sourceBlob = await resolveItemBlob(item, originalSrc);
        if (!sourceBlob) throw new Error('无法读取原视频文件');
        blob = await transcodeToBrowserMp4(sourceBlob, item);
        if (key) await putCachedVideo(key, blob, { name: item.fileName || item.title || 'video.mp4', size: blob.size, sourceSize: sourceBlob.size });
      } else {
        setPlayerStatus('⚡ 已找到上次转换好的兼容版本，直接播放…');
      }
      revokeCurrentUrl();
      currentObjectUrl = URL.createObjectURL(blob);
      if (mediaEl) { try { mediaEl.pause(); } catch (_) {} }
      const screen = document.getElementById('webDirectScreen');
      const name = (item.title || item.fileName || '视频') + '（兼容版）';
      renderMedia(currentObjectUrl, name, 'video/mp4', screen, function () {
        setPlayerStatus('❌ 自动转换后的 MP4 仍无法播放，请更换浏览器或重新导出视频。');
      });
      setPlayerStatus('▶ 已转换为浏览器兼容 MP4（H.264 + AAC），正在播放。');
    } catch (err) {
      setPlayerStatus('❌ 自动兼容转换失败：' + (err.message || err) + '。请尝试 Chrome / Edge，或先把视频导出为 MP4（H.264 + AAC）。');
    }
  }

  async function playFile(file) {
    if (!file) return;
    revokeCurrentUrl(); currentItem = null;
    currentObjectUrl = URL.createObjectURL(file);
    const overlay = ensureDirectOverlay();
    overlay.classList.add('active'); document.body.style.overflow = 'hidden';
    const title = document.getElementById('webDirectTitle'); if (title) title.textContent = file.name || '本地文件';
    const screen = document.getElementById('webDirectScreen');
    renderMedia(currentObjectUrl, file.name, file.type, screen, function (el) {
      recoverDecodeFailure({ id: 'file-' + file.name + '-' + file.size, title: file.name, fileName: file.name, size: file.size, mimeType: file.type }, currentObjectUrl, el);
    });
    setInfo('📁 本地文件：' + file.name + ' · 如编码不兼容，将自动在本机转换。');
  }

  async function playItem(item) {
    if (!item) return;
    currentItem = item; revokeCurrentUrl();
    let src = item.url || '';
    if (item.localFile && window.getLocalFileUrl) {
      try { src = await window.getLocalFileUrl(item); } catch (_) { src = ''; }
    }
    if (!src) { alert('无法读取这个视频。请重新连接本地云盘文件夹，并确认文件没有被移动或删除。'); return; }
    const overlay = ensureDirectOverlay(); overlay.classList.add('active'); document.body.style.overflow = 'hidden';
    const oldMedia = overlay.querySelector('#webDirectScreen video, #webDirectScreen audio');
    if (oldMedia) { try { oldMedia.pause(); } catch (_) {} oldMedia.removeAttribute('src'); try { oldMedia.load(); } catch (_) {} }
    const title = document.getElementById('webDirectTitle'); if (title) title.textContent = item.title || item.fileName || '视频';
    const screen = document.getElementById('webDirectScreen');
    const mime = item.mimeType || item.mime || '';
    renderMedia(src, item.title || item.fileName || '媒体文件', mime, screen, function (el) { recoverDecodeFailure(item, src, el); });
    setInfo('🎬 已直接播放：' + (item.title || item.fileName || '媒体文件') + ' · 网页播放助手');
  }

  function openWebPlayerForItemById(id) {
    let list = [];
    try {
      if (typeof window.getImages === 'function') list = window.getImages() || [];
      if (!Array.isArray(list) || !list.length) {
        const raw = localStorage.getItem('ZIH_gallery'); list = raw ? JSON.parse(raw) : [];
      }
    } catch (_) { list = []; }
    const item = list.find(i => Number(i.id) === Number(id));
    if (!item) { alert('找不到这个视频，请刷新页面后重试。'); return; }
    if (item.type !== 'video') return;
    return playItem(item);
  }
  function closeDirectPlayer() {
    stopTranscodeWorker();
    const overlay = document.getElementById('webPlayerDirectOverlay'); if (!overlay) return;
    const v = overlay.querySelector('video,audio');
    if (v) { try { v.pause(); } catch (_) {} v.removeAttribute('src'); try { v.load(); } catch (_) {} }
    overlay.classList.remove('active'); document.body.style.overflow = '';
    revokeCurrentUrl(); currentItem = null;
  }
  function playUrl() {
    const input = qs('webPlayerUrlInput'); const src = input && input.value.trim();
    if (!src) { setInfo('请输入媒体直链。'); return; }
    revokeCurrentUrl(); currentItem = null; renderMedia(src, src, '', null, function () { setInfo('⚠️ 网络视频无法解码。请使用浏览器支持的 MP4/H.264、WebM 等格式。'); }); setInfo('🔗 已加载网络媒体：' + src);
  }
  function clearPlayer() {
    stopTranscodeWorker(); revokeCurrentUrl(); currentItem = null;
    const screen = qs('webPlayerScreen'); if (screen) screen.innerHTML = '<div class="web-player-empty">🎬<br><span>选择文件或粘贴直链开始播放</span></div>';
    const url = qs('webPlayerUrlInput'); if (url) url.value = '';
    setInfo('不会上传文件；编码不兼容时，会在当前设备本机转换为 MP4。');
  }
  function bind() {
    const file = qs('webPlayerFileInput'), urlBtn = qs('webPlayerUrlBtn'), clear = qs('webPlayerClearBtn');
    if (file) file.addEventListener('change', function () { playFile(this.files && this.files[0]); this.value = ''; });
    if (urlBtn) urlBtn.addEventListener('click', playUrl);
    if (clear) clear.addEventListener('click', clearPlayer);
    const input = qs('webPlayerUrlInput'); if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') playUrl(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDirectPlayer(); });
  }
  window.openWebPlayerForItem = playItem;
  window.openWebPlayerForItemById = openWebPlayerForItemById;
  window.closeWebDirectPlayer = closeDirectPlayer;
  window.clearWebPlayer = clearPlayer;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
