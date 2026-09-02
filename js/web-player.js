/* ZIH V4 · 网页播放助手（直连版） */
(function () {
  'use strict';
  let currentObjectUrl = '';
  let currentItem = null;
  let directOverlay = null;

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
          <div><strong>🎬 网页播放助手</strong><span id="webDirectTitle">上传完成，正在播放…</span></div>
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
  function renderMedia(src, name, mime, target) {
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
      setInfo('⚠️ 浏览器无法解码这个文件。建议使用 MP4（H.264 + AAC）或 WebM。');
    });
    el.addEventListener('loadedmetadata', function () { setInfo('▶ 正在播放：' + (name || '媒体文件')); });
    screen.appendChild(el);
    el.play().catch(function () {});
    return el;
  }
  async function playFile(file) {
    if (!file) return;
    revokeCurrentUrl();
    currentItem = null;
    currentObjectUrl = URL.createObjectURL(file);
    renderMedia(currentObjectUrl, file.name, file.type);
    setInfo('📁 本地文件：' + file.name + ' · 仅在当前浏览器播放，不会上传。');
  }
  async function playItem(item) {
    if (!item) return;
    currentItem = item;
    revokeCurrentUrl();
    let src = item.url || '';
    if (item.localFile && window.getLocalFileUrl) {
      try { src = await window.getLocalFileUrl(item); } catch (_) { src = ''; }
    }
    if (!src) {
      alert('无法读取这个视频。请重新连接本地云盘文件夹，并确认文件没有被移动或删除。');
      return;
    }
    const overlay = ensureDirectOverlay();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    const title = document.getElementById('webDirectTitle');
    if (title) title.textContent = item.title || item.fileName || '视频';
    const screen = document.getElementById('webDirectScreen');
    const mime = item.mimeType || item.mime || '';
    renderMedia(src, item.title || item.fileName || '媒体文件', mime, screen);
    setInfo('🎬 已直接播放：' + (item.title || item.fileName || '媒体文件') + ' · 网页播放助手');
  }
  function openWebPlayerForItemById(id) {
    const list = typeof window.getImages === 'function' ? window.getImages() : [];
    const item = list.find(i => Number(i.id) === Number(id));
    if (!item) { alert('找不到这个视频，请刷新页面后重试。'); return; }
    if (item.type !== 'video') return;
    return playItem(item);
  }
  function closeDirectPlayer() {
    const overlay = document.getElementById('webPlayerDirectOverlay');
    if (!overlay) return;
    const v = overlay.querySelector('video,audio');
    if (v) { try { v.pause(); } catch (_) {} v.removeAttribute('src'); try { v.load(); } catch (_) {} }
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    revokeCurrentUrl();
    currentItem = null;
  }
  function playUrl() {
    const input = qs('webPlayerUrlInput');
    const src = input && input.value.trim();
    if (!src) { setInfo('请输入媒体直链。'); return; }
    revokeCurrentUrl(); currentItem = null;
    renderMedia(src, src, '');
    setInfo('🔗 已加载网络媒体：' + src);
  }
  function clearPlayer() {
    revokeCurrentUrl(); currentItem = null;
    const screen = qs('webPlayerScreen');
    if (screen) screen.innerHTML = '<div class="web-player-empty">🎬<br><span>选择文件或粘贴直链开始播放</span></div>';
    const url = qs('webPlayerUrlInput'); if (url) url.value = '';
    setInfo('不会上传文件；选择本地文件后，仅在当前浏览器中读取。');
  }
  function bind() {
    const file = qs('webPlayerFileInput');
    const urlBtn = qs('webPlayerUrlBtn');
    const clear = qs('webPlayerClearBtn');
    if (file) file.addEventListener('change', function () { playFile(this.files && this.files[0]); this.value = ''; });
    if (urlBtn) urlBtn.addEventListener('click', playUrl);
    if (clear) clear.addEventListener('click', clearPlayer);
    const input = qs('webPlayerUrlInput');
    if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') playUrl(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDirectPlayer(); });
  }
  window.openWebPlayerForItem = playItem;
  window.openWebPlayerForItemById = openWebPlayerForItemById;
  window.closeWebDirectPlayer = closeDirectPlayer;
  window.clearWebPlayer = clearPlayer;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
