/* switchGuide.js – "איך עוברים": שלבים, מועדים ותנאי סף */
(function () {
  const { h } = DOM;

  const STEPS = [
    ['מגישים בקשה', 'באתר ביטוח לאומי, או בטופס מעבר בסניף הדואר עם תעודת זהות. ב-2025 כ-73% מהמעברים נעשו באינטרנט.', 'btlMove'],
    ['ממתינים למועד', 'המעבר נכנס לתוקף באחד משישה מועדים בשנה, לפי תאריך ההגשה.', 'kz'],
    ['נרשמים במרפאה', 'משלימים רישום במרפאת כללית ומקבלים כרטיס מגנטי.', 'kz'],
    ['מצטרפים למושלם', 'תוך 90 יום ברובד מקביל: הוותק נשמר ואין תקופת המתנה.', 'kz']
  ];

  /** טבלת מועדים, החלון הפעיל מודגש */
  function windowsTable() {
    const cur = U.currentWindow();
    // חלונות שהמועד שלהם כבר עבר לא מוצגים
    const upcoming = SWITCH_WINDOWS.filter(([, d]) => d >= cur.deadline);
    return h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
      h('thead', null, h('tr', null, h('th', null, 'הגשה מ-'), h('th', null, 'הגשה עד'), h('th', null, 'עוברים ב-'))),
      h('tbody', null, upcoming.map(([f, d, e]) => h('tr', { class: d === cur.deadline ? 'row-now' : '' },
        h('td', null, U.shortDate(f)), h('td', null, U.shortDate(d), d === cur.deadline ? h('span', { class: 'pill pill-hot' }, 'עכשיו') : null), h('td', null, h('strong', null, U.shortDate(e))))))));
  }

  Router.register({
    id: 'switch', title: 'איך עוברים', icon: '🔄', color: 'ink',
    render(el) {
      const w = U.currentWindow();
      const msg = `מעבר לכללית: מגישים באתר ביטוח לאומי (btl.gov.il). הגשה עד ${U.shortDate(w.deadline)} – המעבר נכנס לתוקף ב-${U.shortDate(w.effective)}. בביטוח המשלים מצטרפים תוך 90 יום ברובד מקביל והוותק נשמר.`;
      el.append(
        UI.viewHead('🔄 גיוס · איך עוברים', 'ארבעה צעדים, ותאריך ברור', `המועד הקרוב: מי שמגיש עד ${U.longDate(w.deadline)} עובר ב-${U.longDate(w.effective)}.`),
        h('ol', { class: 'path' }, STEPS.map(([t, p, s], i) => h('li', { class: 'path-step' },
          h('span', { class: 'path-n' }, i + 1), h('h3', null, t), h('p', null, p), U.srcLink(s)))),
        h('div', { class: 'split' },
          UI.card('📅 מועדי המעבר', windowsTable(), U.srcLink('mapLeu', 'לפי טבלת המועדים במיפוי לאומית')),
          UI.card('📌 תנאי סף ודגשים',
            h('ul', { class: 'facts' },
              h('li', null, 'חצי שנה לפחות בקופה הנוכחית לפני מעבר.'),
              h('li', null, 'עד שני מעברים ב-12 חודשים.'),
              h('li', null, 'המבוטח מגיש בעצמו. אנחנו מסבירים ומלווים.'),
              h('li', null, 'הקופה הקודמת מעבירה את המידע הרפואי.')),
            U.srcLink('kz', 'כל זכות'),
            h('div', { class: 'opener' }, h('span', { class: 'kicker' }, 'הודעה מוכנה'), h('p', null, msg), DOM.copyBtn(msg, 'העתקת ההודעה')))));
    }
  });
})();
