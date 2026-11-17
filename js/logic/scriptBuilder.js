/* scriptBuilder.js – מרכיב תסריט שיחה מותאם: ערוץ + קופה + קהל + כאבים + יישוב */
(function () {
  const byId = (list, id) => list.find((x) => x.id === id);

  /** משלים את [יישוב] בשם היישוב שנבחר */
  const fill = (s, town) => s.replaceAll('[יישוב]', town).replaceAll('[יישוב/אירוע]', town);

  /**
   * @param {{channel:string, fund:string, audience:string, pains:string[], town:string}} o
   * @returns {{steps:Array<{k:string,title:string,lines:string[],tip?:string}>, message:string}}
   */
  function build(o) {
    const S = window.SCRIPTS;
    const ch = S.channels[o.channel];
    const aud = byId(S.audiences, o.audience);
    const pains = o.pains.map((p) => byId(S.pains, p)).filter(Boolean);
    const ins = TownInsights.analyze(o.town, o.fund);
    const fundName = U.FUND_NAMES[o.fund];
    const w = U.currentWindow();

    const steps = [];
    steps.push({ k: '1', title: 'פתיחה', lines: [fill(ch.open, o.town)], tip: 'מחייכים גם בטלפון. שואלים לשמו ומשתמשים בו.' });

    steps.push({ k: '2', title: 'שאלה שפותחת', lines: [
      ins ? ins.opener : '',
      ...pains.map((p) => p.q)
    ].filter(Boolean), tip: 'שואלים ושותקים. נותנים לו לספר.' });

    const facts = [];
    if (aud) facts.push(aud.hook);
    if (ins) facts.push(...ins.bullets.slice(0, 3));
    steps.push({ k: '3', title: 'עובדה אחת חדה', lines: facts, tip: `בוחרים עובדה אחת שמתחברת למה שסיפר. מקור: מיפוי ${fundName === 'הקופה הנוכחית' ? 'הקופות' : fundName}.` });

    const offers = pains.map((p) => p.offer);
    if (aud) offers.push(...aud.push);
    steps.push({ k: '4', title: 'מה יש אצלנו', lines: offers.length ? offers : ['מציגים את מרפאת כללית הקרובה ואת השירותים בה.'], tip: 'מראים, לא רק מספרים: כתובת, שעות, תור פנוי.' });

    steps.push({ k: '5', title: 'סגירה עם תאריך', lines: [
      `מי שמגיש עד ${U.longDate(w.deadline)} עובר לכללית ב-${U.longDate(w.effective)}.`,
      'בביטוח המשלים: מצטרפים תוך 90 יום ברובד מקביל, והוותק נשמר.',
      ch.close
    ], tip: 'מסיימים בצעד הבא ובמועד ברור, גם אם עוד לא אמר כן.' });

    const message = [
      'שלום, כאן [השם שלי] מכללית מחוז שרון-שומרון 🙂',
      'כמו שדיברנו, אלה הפרטים:',
      ins ? `• ${ins.bullets[0]}` : '',
      `• מגישים בקשת מעבר באתר ביטוח לאומי: btl.gov.il`,
      `• הגשה עד ${U.shortDate(w.deadline)} – המעבר נכנס לתוקף ב-${U.shortDate(w.effective)}`,
      '• ביטוח משלים: מצטרפים תוך 90 יום ברובד מקביל והוותק נשמר',
      'אשמח לעזור בכל שאלה.'
    ].filter(Boolean).join('\n');

    return { steps, message, insights: ins };
  }

  window.ScriptBuilder = { build };
})();
