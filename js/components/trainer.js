/* trainer.js – "אימון": בוחן קצר עם ניקוד, הסבר אחרי כל תשובה ושיא אישי */
(function () {
  const { h } = DOM;
  const st = { i: 0, score: 0, answered: null, order: null };

  /** ערבוב סדר השאלות בכל סבב */
  const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const reset = () => { st.i = 0; st.score = 0; st.answered = null; st.order = shuffle(QUIZ.map((_, i) => i)); };

  /** מסך סיום */
  function finish(rerender) {
    const best = Math.max(Store.get('quizBest') || 0, st.score);
    if (best !== Store.get('quizBest')) Store.set({ quizBest: best });
    const pct = Math.round((st.score / QUIZ.length) * 100);
    const again = h('button', { type: 'button', class: 'btn btn-primary' }, 'סבב נוסף');
    again.addEventListener('click', () => { reset(); rerender(); });
    return h('section', { class: 'card quiz-end' },
      h('div', { class: 'ring', style: { '--p': pct } }, h('b', null, `${st.score}/${QUIZ.length}`)),
      h('h2', null, pct >= 80 ? 'מוכנים למשמרת!' : pct >= 50 ? 'כמעט. עוד סבב אחד?' : 'כדאי לעבור שוב על "למה כללית"'),
      h('p', null, `השיא שלך: ${best}/${QUIZ.length}`), again);
  }

  /** שאלה נוכחית */
  function question(rerender) {
    const q = QUIZ[st.order[st.i]];
    const opts = h('div', { class: 'quiz-opts' }, q.o.map((txt, k) => {
      const cls = st.answered == null ? '' : k === q.a ? 'is-right' : k === st.answered ? 'is-wrong' : 'is-dim';
      const b = h('button', { type: 'button', class: `quiz-opt ${cls}`, disabled: st.answered != null }, txt);
      b.addEventListener('click', () => { st.answered = k; if (k === q.a) st.score += 1; rerender(); });
      return b;
    }));
    const next = h('button', { type: 'button', class: 'btn btn-primary' }, st.i + 1 < QUIZ.length ? 'לשאלה הבאה ←' : 'לתוצאה');
    next.addEventListener('click', () => { st.i += 1; st.answered = null; rerender(); });
    return h('section', { class: 'card quiz' },
      h('div', { class: 'quiz-top' }, h('span', { class: 'kicker' }, `שאלה ${st.i + 1} מתוך ${QUIZ.length}`), h('span', { class: 'pill pill-cool' }, `ניקוד: ${st.score}`)),
      h('div', { class: 'meter' }, h('i', { style: { width: ((st.i + (st.answered != null ? 1 : 0)) / QUIZ.length) * 100 + '%' } })),
      h('h2', { class: 'quiz-q' }, q.q), opts,
      st.answered != null ? h('div', { class: 'quiz-why' }, h('p', null, (st.answered === q.a ? '✓ נכון. ' : '✗ לא בדיוק. ') + q.why), next) : null);
  }

  Router.register({
    id: 'train', title: 'אימון', icon: '🎯', color: 'pink',
    render(el) {
      if (!st.order) reset();
      const rerender = () => { DOM.clear(el); this.render(el); };
      el.append(
        UI.viewHead('🎯 אימון', 'עשר שאלות לפני משמרת', 'כל העובדות כאן מופיעות בערכה. שיא אישי נשמר בדפדפן שלך.'),
        st.i >= QUIZ.length ? finish(rerender) : question(rerender));
    }
  });
})();
