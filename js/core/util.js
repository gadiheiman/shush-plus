/* util.js – פורמט מספרים ותאריכים, מקורות ומועדי מעבר */
(function () {
  const nf = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  const df = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  const dShort = new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const FUND_NAMES = { mac: 'מכבי', meu: 'מאוחדת', leu: 'לאומית', unk: 'הקופה הנוכחית' };

  /** מספר בפורמט עברי */
  const num = (n) => nf.format(n);
  /** כסף בשקלים, שתי ספרות */
  const money = (n) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n);

  /** ממיר 'YYYY-MM-DD' לתאריך מקומי בחצות */
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const longDate = (d) => df.format(typeof d === 'string' ? parseISO(d) : d);
  const shortDate = (d) => dShort.format(typeof d === 'string' ? parseISO(d) : d);

  /** ימים שלמים מהיום ועד תאריך (כולל היום) */
  function daysUntil(d) {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round(((typeof d === 'string' ? parseISO(d) : d) - t) / 86400000);
  }

  /** ימי עבודה (א'–ה', בלי חגים) מהיום ועד תאריך, כולל שני הקצוות */
  function workDaysUntil(d) {
    const end = typeof d === 'string' ? parseISO(d) : d;
    const off = new Set((window.HOLIDAYS || []).map((x) => x[0]));
    const cur = new Date(); cur.setHours(0, 0, 0, 0);
    let n = 0;
    while (cur <= end) {
      const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      if (cur.getDay() <= 4 && !off.has(iso)) n += 1; // 0=ראשון … 4=חמישי
      cur.setDate(cur.getDate() + 1);
    }
    return n;
  }

  /** מחזיר את חלון ההגשה הפעיל היום: {from, deadline, effective} */
  function currentWindow(today = new Date()) {
    const t = new Date(today); t.setHours(0, 0, 0, 0);
    const list = (window.SWITCH_WINDOWS || []).map(([f, d, e]) => ({ from: f, deadline: d, effective: e }));
    return list.find((w) => t >= parseISO(w.from) && t <= parseISO(w.deadline)) || list[list.length - 1];
  }

  /** קישור למקור לפי מזהה */
  function srcLink(id, label) {
    const s = window.SOURCES[id];
    if (!s) return null;
    return DOM.h('a', { class: 'src', href: s.u, target: '_blank', rel: 'noopener', title: s.t }, label || 'מקור');
  }

  window.U = { num, money, parseISO, longDate, shortDate, daysUntil, workDaysUntil, currentWindow, srcLink, FUND_NAMES };
})();
