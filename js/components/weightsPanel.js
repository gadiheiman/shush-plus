/* weightsPanel.js – שורת "לפי מה מדורג" מעל תוצאות המרפאות הראשוניות, עם אפשרות לשנות את המשקלים.
   שינוי משקל אחד מחלק את השארית בין השניים האחרים, כך שהסכום תמיד 100%. */
(function () {
  const { h } = DOM;
  const ICONS = { air: '📍', drive: '🚗', survey: '💎' };

  /** שורת הסיכום: שלושת המשקלים */
  function summaryText(w) {
    return PrimaryRanker.KEYS.map((k) => `${ICONS[k]} ${PrimaryRanker.LABELS[k]} ${w[k]}%`).join(' · ');
  }

  /**
   * בונה את הפאנל
   * @param {() => void} onChange נקרא אחרי כל שינוי משקל (לדירוג מחדש)
   */
  function render(onChange) {
    let open = false;
    const summary = h('span', { class: 'w-sum' });
    const toggle = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-expanded': 'false' }, '⚙️ שינוי');
    const sliders = {};
    const vals = {};

    // סליידר לכל משקל
    const rows = PrimaryRanker.KEYS.map((k) => {
      const id = 'w-' + k;
      vals[k] = h('output', { class: 'w-val', for: id });
      sliders[k] = h('input', { id, type: 'range', min: '0', max: '100', step: '5', class: 'w-range' });
      sliders[k].addEventListener('input', () => { PrimaryRanker.setWeight(k, +sliders[k].value); sync(); onChange(); });
      sliders[k].addEventListener('change', () => Analytics.event('weights-change', k));
      return h('div', { class: 'w-row' },
        h('label', { for: id }, `${ICONS[k]} ${PrimaryRanker.LABELS[k]}`), sliders[k], vals[k]);
    });
    const reset = h('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, '↺ חזרה ל-40/40/20');
    reset.addEventListener('click', () => { PrimaryRanker.reset(); sync(); onChange(); Analytics.event('weights-reset'); });
    const panel = h('div', { class: 'w-panel', hidden: true }, rows,
      h('div', { class: 'w-foot' }, h('span', { class: 'fine' }, 'הזזת משקל אחד מעדכנת את האחרים, כך שהסכום תמיד 100%.'), reset));

    /** מעדכן את התצוגה לפי המשקלים השמורים */
    function sync() {
      const w = PrimaryRanker.weights();
      summary.textContent = summaryText(w);
      PrimaryRanker.KEYS.forEach((k) => { sliders[k].value = w[k]; vals[k].textContent = w[k] + '%'; });
    }

    toggle.addEventListener('click', () => {
      open = !open;
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? '✓ סגירה' : '⚙️ שינוי';
    });
    sync();
    return h('div', { class: 'w-box' },
      h('div', { class: 'w-head' }, h('div', null, h('b', null, '⚖️ סדר התוצאות לפי משקלים'), summary), toggle),
      panel);
  }

  window.WeightsPanel = { render };
})();
