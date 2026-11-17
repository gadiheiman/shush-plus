/* dom.js – עזרי DOM קטנים: יצירת אלמנטים, ניקוי והעתקה ללוח */
(function () {
  /** יוצר אלמנט. attrs: class, on* (אירועים), style (אובייקט או מחרוזת), וכל מאפיין אחר */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') {
          // משתני CSS (--x) חייבים setProperty; Object.assign מתעלם מהם
          for (const [sk, sv] of Object.entries(v)) sk.startsWith('--') ? el.style.setProperty(sk, sv) : (el.style[sk] = sv);
        }
        else if (k === 'html') el.innerHTML = v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    append(el, kids);
    return el;
  }

  /** מוסיף ילדים (מחרוזות, אלמנטים או מערכים) */
  function append(el, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k == null || k === false) continue;
      el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
    }
    return el;
  }

  /** מרוקן אלמנט ומחזיר אותו */
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

  /** מעתיק טקסט ללוח ומשנה זמנית את תווית הכפתור */
  async function copyText(text, btn) {
    const label = btn ? btn.textContent : '';
    try {
      await navigator.clipboard.writeText(text);
      if (btn) btn.textContent = '✓ הועתק';
    } catch (e) {
      if (btn) btn.textContent = 'לא הועתק – סמנו ידנית';
    }
    if (btn) setTimeout(() => { btn.textContent = label; }, 1800);
  }

  /** כפתור העתקה מוכן */
  function copyBtn(getText, label = 'העתקה') {
    const b = h('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, label);
    b.addEventListener('click', () => copyText(typeof getText === 'function' ? getText() : getText, b));
    return b;
  }

  window.DOM = { h, append, clear, copyText, copyBtn };
})();
