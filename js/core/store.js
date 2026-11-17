/* store.js – מצב משותף בין המסכים (יישוב וקופה נבחרים), נשמר בדפדפן אם אפשר */
(function () {
  const KEY = 'clalit-kit-v1';
  const subs = new Set();
  let state = { town: 'נתניה', fund: 'mac', channel: 'phone', quizBest: 0 };

  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* אין אחסון – ממשיכים בזיכרון */ }

  /** קריאת ערך */
  const get = (k) => state[k];

  /** עדכון ערכים והודעה למנויים */
  function set(patch) {
    state = { ...state, ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* מתעלמים */ }
    subs.forEach((fn) => fn(state, patch));
  }

  /** הרשמה לשינויים; מחזיר פונקציית ביטול */
  function on(fn) { subs.add(fn); return () => subs.delete(fn); }

  window.Store = { get, set, on };
})();
