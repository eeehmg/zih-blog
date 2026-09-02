/* ZIH 导航/移动端点击修复补丁
 * 独立于 app.js 工作：即使原页面某个旧功能初始化失败，基础导航仍可用。
 */
(function () {
  'use strict';

  const SESSION_KEY = 'zih_session_v1';

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (_) { return null; }
  }

  // 1) 基础 Tab 切换：不依赖 app.js 的 showTab。
  function activateTab(tab) {
    const ids = ['blog-content', 'gallery', 'personal', 'about', 'links'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('active', id === (tab === 'blog' ? 'blog-content' : tab));
    });

    document.querySelectorAll('.toplinks [data-tab], .bottom-nav [data-tab]').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab);
    });

    // 调用原项目的渲染函数（如果 app.js 已成功加载）。
    try {
      if (tab === 'gallery' && typeof window.renderGallery === 'function') window.renderGallery();
      if (tab === 'personal') {
        if (typeof window.renderComments === 'function') window.renderComments();
        if (typeof window.renderTieba === 'function') window.renderTieba();
        if (typeof window.renderGroups === 'function') window.renderGroups();
        if (typeof window.renderChatList === 'function') window.renderChatList();
        if (typeof window.renderActiveChat === 'function') window.renderActiveChat();
      }
      if (tab === 'about' && typeof window.renderContacts === 'function') window.renderContacts();
      if (tab === 'links' && typeof window.renderFriendLinks === 'function') window.renderFriendLinks();
    } catch (_) {}

    // 页面内部使用 hash 保存当前页，刷新后仍能回到当前 Tab。
    try { history.replaceState(null, '', '#' + tab); } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function routeFromHash() {
    const tab = (location.hash || '').replace('#', '').split('?')[0];
    if (['blog', 'gallery', 'personal', 'about', 'links'].includes(tab)) activateTab(tab);
  }

  // 2) 委托监听：电脑顶部导航 + 手机底部导航统一处理。
  document.addEventListener('click', function (e) {
    const target = e.target.closest && e.target.closest('[data-tab]');
    if (target) {
      const tab = target.dataset.tab;
      if (tab && ['blog', 'gallery', 'personal', 'about', 'links'].includes(tab)) {
        e.preventDefault();
        e.stopPropagation();
        activateTab(tab);
        return;
      }
    }
  }, true);

  // 3) 右下角齿轮：直接控制面板，避免旧初始化失效时按钮失灵。
  function setupGear() {
    const btn = document.getElementById('railSettingsBtn');
    const panel = document.getElementById('railSettingsPanel');
    if (!btn || !panel) return;

    btn.style.pointerEvents = 'auto';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      panel.classList.toggle('open');
      panel.setAttribute('aria-hidden', panel.classList.contains('open') ? 'false' : 'true');
    }, true);

    const close = document.getElementById('closeRailSettings');
    close && close.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    }, true);
  }

  // 4) 登录门卫：未登录访问内容页时自动进入 login.html；login 后返回首页。
  function setupLoginGuard() {
    const page = location.pathname.split('/').pop() || 'index.html';
    if (page !== 'index.html' && page !== '') return;
    if (!getSession()) {
      const returnTo = encodeURIComponent(location.pathname + location.search + location.hash);
      location.replace('login.html?returnTo=' + returnTo);
    }
  }

  // 5) 管理员快捷入口：登录后给顶部品牌区域增加一个轻量入口，不改变原布局。
  function setupAdminEntry() {
    const s = getSession();
    if (!s || s.role !== 'admin') return;
    const brand = document.querySelector('.brand');
    if (!brand || document.getElementById('zihAdminLink')) return;
    const a = document.createElement('a');
    a.id = 'zihAdminLink';
    a.href = 'admin.html';
    a.textContent = '后台';
    a.style.cssText = 'margin-left:8px;font-size:12px;color:var(--teal);text-decoration:none;white-space:nowrap;';
    brand.appendChild(a);
  }

  function init() {
    // 先让导航可点击，再做登录跳转。
    setupGear();
    routeFromHash();
    setupAdminEntry();
    setupLoginGuard();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('hashchange', routeFromHash);
})();
