/* ZIH V4 · 网页播放助手 */
(function () {
  'use strict';
  let currentObjectUrl = '';
  let currentItem = null;

  function qs(id) { return document.getElementById(id); }
  function revokeCurrentUrl() {
    if (currentObjectUrl) { URL.revokeObjectURL(currentObjectUrl); currentObjectUrl = ''; }
  }
  function setInfo(text) { const el = qs('webPlayerInfo'); if (el) el.textContent = text; }
  function renderMedia(src, name, mime) {
    const screen = qs('webPlayerScreen');
    if (!screen || !src) return;
    screen.innerHTML = '';
    const isAudio = (mime || '').startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)(?:$|\?)/i.test(name || '');
    const el = document.createElement(isAudio ? 'audio' : 'video');
    el.controls = true;
    el.autoplay = false;
    el.playsInline = true;
    el.preload = 'metadata';
    el.src = src;
    if (mime) el.setAttribute('type', mime);
    el.addEventListener('error', function () {
      setInfo('⚠️ 浏览器无法解码这个文件。建议使用 MP4（H.264 + AAC）或 WebM；这不是播放器助手连接问题。');
    });
    el.addEventListener('loadedmetadata', function () { setInfo('▶ 已加载：' + (name || '媒体文件')); });
    screen.appendChild(el);
    el.play().catch(function () {});
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
    const modal = qs('cloudModal');
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    currentItem = item;
    revokeCurrentUrl();
    let src = item.url || '';
    if (item.localFile && window.getLocalFileUrl) {
      try { src = await window.getLocalFileUrl(item); } catch (_) { src = ''; }
    }
    if (!src) { setInfo('⚠️ 无法读取这个文件，请重新连接本地云盘。'); return; }
    renderMedia(src, item.title || item.fileName || '媒体文件', item.mime || '');
    setInfo('☁️ ' + (item.localFile ? '本地云盘文件已载入当前浏览器。' : '远程媒体已载入。') + ' 不需要 Windows 播放助手。');
    const box = qs('webPlayerBox');
    if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  }
  window.openWebPlayerForItem = playItem;
  window.clearWebPlayer = clearPlayer;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
