/* router.js – ניתוב לפי #hash בין מסכי האפליקציה */
(function () {
  const views = [];
  let host = null;

  /** רישום מסך: {id, title, icon, color, render(el)} */
  function register(view) { views.push(view); }

  /** מסך לפי ה-hash הנוכחי, או הראשון */
  function current() {
    const id = location.hash.replace('#', '');
    return views.find((v) => v.id === id) || views[0];
  }

  /** מציג את המסך הנוכחי ומעדכן את הניווט */
  function show() {
    const v = current();
    DOM.clear(host);
    host.dataset.view = v.id;
    document.documentElement.style.setProperty('--view-accent', `var(--${v.color})`);
    // צבע טקסט כהה יותר מצבע ההדגשה, לניגודיות 4.5:1 (הצהוב צריך הכהיה חזקה יותר)
    document.documentElement.style.setProperty('--view-ink', `color-mix(in srgb, var(--${v.color}) ${v.color === 'sun' ? 55 : 80}%, var(--ink-text))`);
    v.render(host);
    document.querySelectorAll('[data-nav]').forEach((a) => a.setAttribute('aria-current', a.dataset.nav === v.id ? 'page' : 'false'));
    host.focus({ preventScroll: true });
    Analytics.page(v.id, v.title);
  }

  /** מעבר יזום למסך */
  function go(id) {
    if (location.hash === '#' + id) show();
    else location.hash = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function start(el) { host = el; window.addEventListener('hashchange', show); show(); }

  window.Router = { register, start, go, list: () => views };
})();
