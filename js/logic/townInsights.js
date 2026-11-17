/* townInsights.js – הופך את נתוני המיפוי של יישוב לטיעונים לשיחה, לפי הקופה של המבוטח */
(function () {
  const km = (x) => (x == null ? '' : `${U.num(Math.round(x * 10) / 10)} ק"מ`);

  /** מאתר יישוב לפי שם */
  const findTown = (name) => (window.TOWNS || []).find((t) => t.n === name);

  /** תובנות מכבי */
  function maccabi(t) {
    const m = t.mac, b = [];
    let level = 'low';
    if (m.pts === 0) {
      level = 'high';
      b.push(`אין למכבי אף נקודת שירות ב${t.n}.` + (m.nc ? ` המרכז הקרוב שלה ב${m.nc[0]}, ${km(m.nc[1])} מכאן.` : ''));
    } else if (m.c === 0) {
      level = 'high';
      b.push(`אין מרכז רפואי של מכבי ב${t.n}. רשומים ${m.d} רופאים עצמאיים.` + (m.nc ? ` המרכז הקרוב ב${m.nc[0]}.` : ''));
    } else {
      b.push(`רקע: למכבי ${m.c} ${m.c === 1 ? 'מרכז' : 'מרכזים'} ו-${m.d} רופאים ב${t.n}.`);
    }
    if (m.l === 0 && m.pts > 0) b.push(`אין למכבי נקודת מעבדה ב${t.n}.`);
    if (m.u === 0) {
      if (level === 'low') level = 'mid';
      b.push(`אין מוקד רפואה דחופה של מכבי ב${t.n}.` + (m.nu ? ` הקרוב ב${m.nu[0]}, ${km(m.nu[1])}.` : ''));
    } else if (m.uo && m.uo.every((o) => o === 'בהסדר')) {
      b.push(`המוקד של מכבי ב${t.n} הוא מוקד בהסדר, לא מוקד של מכבי.`);
    }
    (t.macW || []).filter((w) => w[1] >= 45).slice(0, 3).forEach((w) => {
      if (level === 'low') level = 'mid';
      b.push(`חציון ההמתנה ל${w[0]} במכבי ב${t.n}: ${w[1]} ימים.`);
    });
    return { level, bullets: b, src: 'mapMac' };
  }

  /** תובנות מאוחדת */
  function meuhedet(t) {
    const m = t.meu, b = [];
    let level = 'low';
    if (m.c === 0) {
      level = 'high';
      b.push(`אין למאוחדת מרפאה ב${t.n}.` + (m.d ? ` במאגר שלה ${m.d} רופאים ביישוב.` : ''));
    } else {
      b.push(`רקע: למאוחדת ${m.c} ${m.c === 1 ? 'מרפאה' : 'מרפאות'} ו-${m.d} רופאים ב${t.n}.`);
      if (m.l === 0) b.push(`אין למאוחדת מעבדה ב${t.n}.`);
    }
    if (!m.ph) { b.push(`אין בית מרקחת של מאוחדת ב${t.n}.`); if (level === 'low') level = 'mid'; }
    if (!m.u) { b.push(`אין מוקד רפואה דחופה של מאוחדת ב${t.n}.`); if (level === 'low') level = 'mid'; }
    b.push('לפי אתר מאוחדת אין לה מכון MRI במחוז.');
    return { level, bullets: b, src: 'mapMeu' };
  }

  /** תובנות לאומית (לפי קבוצות היעד מהמיפוי) */
  function leumit(t) {
    const g = t.leu != null ? window.LEUMIT_GAPS[t.leu] : null;
    const L = t.leuC || { c: 0 };
    if (!g) {
      if (!L.c) return { level: 'high', src: 'mapLeu', bullets: [`אין ללאומית מרכז רפואי ב${t.n}.`, FACTS.district.leu.extra] };
      return { level: 'low', src: 'mapLeu',
        bullets: [`רקע: ללאומית ${L.c === 1 ? 'מרכז אחד' : L.c + ' מרכזים'}${L.d ? ` ו-${L.d} רופאים` : ''} ב${t.n}.`,
          L.u ? null : `אין ללאומית מוקד רפואה דחופה ב${t.n}.`,
          'היתרון שלנו: רשת בתי החולים ותיק רפואי אחד.', FACTS.district.leu.extra].filter(Boolean) };
    }
    const level = g.t === 'nocenter' ? 'high' : 'mid';
    return { level, src: 'mapLeu', bullets: [...g.g, g.h] };
  }

  /** קופה לא ידועה: שורה מכל קופה */
  function unknown(t) {
    const parts = [maccabi(t), meuhedet(t), leumit(t)];
    const rank = { high: 2, mid: 1, low: 0 };
    const level = parts.reduce((a, p) => (rank[p.level] > rank[a] ? p.level : a), 'low');
    return { level, src: 'mapMac', bullets: [parts[0].bullets[0], parts[1].bullets[0], parts[2].bullets[0]] };
  }

  /** מה יש לכללית ביישוב – משפט קצר לפתיחה */
  function clalitHere(t) {
    if (!window.ClalitData) return null;
    const n = ClalitData.countByGroup(ClalitData.unitsInTown(t.n)).primary;
    if (n) return `לכללית יש ${n === 1 ? 'מרפאה' : n + ' מרפאות'} כאן ב${t.n}`;
    const c = GEO.center[t.n], near = c && GeoCalc.nearest(c, 'primary', 1)[0];
    return near ? `מרפאת כללית הקרובה נמצאת ב${near.u[ClalitData.F.city]}, כ-${Math.round(near.km * 10) / 10} ק"מ מכאן` : null;
  }

  /** משפט פתיחה מותאם */
  function opener(t, fund, res) {
    const name = U.FUND_NAMES[fund];
    const ours = clalitHere(t);
    if (res.level === 'high') return `גרים ב${t.n}? שאלה קטנה: לאן אתם נוסעים היום לרופא? ל${name} אין כאן מרפאה` + (ours ? `, ו${ours}.` : '.');
    if (res.level === 'mid') return `ב${t.n} יש ל${name} שירות, אבל מה קורה בערב או כשצריך מומחה? ` + (ours ? `${ours}. ` : '') + 'בוא נבדוק יחד מה יש לנו.';
    return `ב${t.n} יש ל${name} נוכחות, אז מדברים על מה שרק כללית נותנת: בית חולים משלה, תיק אחד וביטוח משלים זול יותר.`;
  }

  /** נקודת כניסה: תובנות ליישוב ולקופה */
  function analyze(townName, fund) {
    const t = findTown(townName);
    if (!t) return null;
    const res = fund === 'mac' ? maccabi(t) : fund === 'meu' ? meuhedet(t) : fund === 'leu' ? leumit(t) : unknown(t);
    return { town: t, ...res, opener: opener(t, fund, res) };
  }

  /** ציון פער (0–2) ליישוב מול קופה – למפת החום */
  function gapLevel(t, fund) {
    const r = fund === 'mac' ? maccabi(t) : fund === 'meu' ? meuhedet(t) : fund === 'leu' ? leumit(t) : unknown(t);
    return { high: 2, mid: 1, low: 0 }[r.level];
  }

  window.TownInsights = { analyze, gapLevel, findTown };
})();
