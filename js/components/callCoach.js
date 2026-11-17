/* callCoach.js – "מאמן שיחה": בוחרים ערוץ, קופה, קהל וכאבים ומקבלים תסריט חי עם שעון */
(function () {
  const { h } = DOM;
  // מצב מקומי למסך (לא נשמר)
  const local = { audience: 'family', pains: ['far', 'night'] };
  let timer = null, started = 0;

  /** שעון שיחה */
  function callTimer() {
    const out = h('output', { class: 'timer-out', 'aria-live': 'off' }, '00:00');
    const btn = h('button', { type: 'button', class: 'btn btn-primary btn-sm' }, '▶ התחלת שיחה');
    const tick = () => {
      const s = Math.floor((Date.now() - started) / 1000);
      out.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      out.classList.toggle('timer-long', s > 180);
    };
    // אם שיחה כבר רצה (המסך נבנה מחדש באמצע שיחה) – ממשיכים לספור באותו שעון
    if (timer) { clearInterval(timer); timer = setInterval(tick, 1000); tick(); btn.textContent = '■ סיום'; }
    btn.addEventListener('click', () => {
      if (timer) { clearInterval(timer); timer = null; btn.textContent = '▶ שיחה חדשה'; return; }
      started = Date.now(); tick(); timer = setInterval(tick, 1000); btn.textContent = '■ סיום';
    });
    return h('div', { class: 'timer' }, out, btn, h('small', null, 'יעד: עד 3 דקות'));
  }

  /** צעדי התסריט כציר זמן */
  function scriptView(res) {
    return h('ol', { class: 'steps' }, res.steps.map((s) => h('li', { class: 'step' },
      h('span', { class: 'step-k', 'aria-hidden': 'true' }, s.k),
      h('div', { class: 'step-body' },
        h('h3', null, s.title),
        s.lines.map((l) => h('p', null, l)),
        s.tip ? h('p', { class: 'tip' }, '💡 ', s.tip) : null))));
  }

  Router.register({
    id: 'call', title: 'תסריט שיחה למוקד הטלפוני', icon: '🎧', color: 'coral',
    render(el) {
      const out = h('div', { class: 'call-out' });
      const draw = () => {
        const res = ScriptBuilder.build({ channel: Store.get('channel'), fund: Store.get('fund'), audience: local.audience, pains: local.pains, town: Store.get('town') });
        DOM.clear(out).append(
          h('div', { class: 'card-row' }, h('h2', { class: 'card-title' }, `תסריט: ${Store.get('town')} · ${U.FUND_NAMES[Store.get('fund')]}`), callTimer()),
          scriptView(res),
          h('section', { class: 'card msg' },
            h('div', { class: 'card-row' }, h('h2', { class: 'card-title' }, '📲 הודעת המשך למבוטח'), DOM.copyBtn(res.message, 'העתקת ההודעה')),
            h('pre', { class: 'msg-text' }, res.message),
            h('p', { class: 'fine' }, 'שולחים רק למי שהסכים לקבל הודעה.')));
      };
      const rerender = () => { DOM.clear(el); this.render(el); };

      el.append(
        UI.viewHead('🎧 גיוס · תסריט שיחה למוקד הטלפוני', 'תסריט שנבנה לפי המבוטח שמולך', 'ארבע בחירות, וחמישה צעדים מוכנים מהפתיחה ועד התאריך.'),
        h('div', { class: 'coach' },
          h('aside', { class: 'card coach-pick' },
            h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'אני:'),
              UI.chips({ label: 'ערוץ', value: Store.get('channel'),
                items: Object.entries(SCRIPTS.channels).map(([id, c]) => ({ id, name: c.name, icon: c.icon })),
                onChange: (id) => { Store.set({ channel: id }); rerender(); } })),
            UI.townPicker(draw, 'call-town'),
            UI.fundPicker(rerender),
            h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'מי המבוטח?'),
              UI.chips({ label: 'קהל', items: SCRIPTS.audiences, value: local.audience, onChange: (id) => { local.audience = id; rerender(); } })),
            h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'מה מפריע לו? (עד 3)'),
              UI.chips({ label: 'כאבים', multi: true, max: 3, items: SCRIPTS.pains, value: local.pains, onChange: (ids) => { local.pains = ids; rerender(); } })),
            h('details', { class: 'rules' }, h('summary', null, 'כללי הגינות'),
              h('ul', null, SCRIPTS.rules.map(([a, b]) => h('li', null, h('strong', null, a + ': '), b))))),
          out));
      draw();
    }
  });
})();
