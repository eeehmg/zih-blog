/* ZIH GitHub Pages 登录状态辅助 */
window.ZIHAuth={
  get(){try{return JSON.parse(localStorage.getItem('zih_session_v1')||'null')}catch(e){return null}},
  logout(){localStorage.removeItem('zih_session_v1');location.href='login.html'},
  isLoggedIn(){return !!this.get()},
  isAdmin(){const s=this.get();return !!s&&s.role==='admin'}
};