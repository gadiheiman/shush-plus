/* recommender.js – בוחר "מרפאה מומלצת" מתוך הקרובות, לפי מרחק, מספר הרופאים ושעות הפתיחה.
   אין מקור ציבורי לאורך תור או לעומס לכל מרפאה, ולכן ההמלצה מבוססת על זמינות: כמה רופאים וכמה שעות. */
(function () {
  const F = () => ClalitData.F;

  /** שעות פתיחה שבועיות של יחידה */
  function weeklyHours(u) {
    let min = 0;
    (u[F().hours] || []).forEach((d) => { for (let i = 1; i + 1 < d.length; i += 2) min += d[i + 1] - d[i]; });
    return min / 60;
  }

  /** מספר רופאים רלוונטיים ביחידה (לפי צוות המרפאה באתר כללית) */
  /* מקצועות שאינם רופאים (פרא-רפואיים, סיעוד, בדיקות) */
  const PARA = /תזונה|עבודה סוציאלית|ייעוץ|פיזיותרפיה|ריפוי ב|קלינאות|פסיכולוג|פסיכותרפ|סיעוד|אחות|רוקחות|דיאטה|מאמן|בדיקת|אולטרסאונד|סקירת|שקיפות|צילום|הריון|BRCA|פאפ|דופלר|אורתופטיקה|חיסונים|מעבדה/;
  const isPhysicianField = (f) => !PARA.test(f);

  function doctors(u, group) {
    const s = (window.CLALIT_STAFF || {})[u[F().code]];
    if (!s) return null;
    if (group === 'primary') return (s['רפואת משפחה'] || 0) + (s['ילדים'] || 0);
    // ביועצת ובמוקד: כל אנשי הצוות שהם רופאים (תחום רפואי שאינו מקצוע פרא-רפואי)
    return Object.entries(s).filter(([k]) => isPhysicianField(k)).reduce((a, [, v]) => a + v, 0);
  }

  /**
   * מוסיף ציון לכל תוצאה ומסמן את המומלצת.
   * @param {Array<{u, km}>} list תוצאות ממוינות לפי מרחק
   * @param {string} group קבוצת היחידות
   * @returns {{list: Array, best: object|null}}
   */
  function rank(list, group) {
    if (list.length < 2) return { list: list.map((x) => ({ ...x, hrs: weeklyHours(x.u), docs: doctors(x.u, group) })), best: null };
    const near = list[0].km;
    const rows = list.map((x) => ({ ...x, hrs: weeklyHours(x.u), docs: doctors(x.u, group) }));
    // מועמדות: עד 3 ק"מ מעבר לקרובה ביותר, כדי לא להמליץ על מרפאה רחוקה
    const cands = rows.filter((r) => r.km <= near + 3);
    const maxH = Math.max(...cands.map((r) => r.hrs), 1);
    const hasDocs = cands.some((r) => r.docs);
    const maxD = Math.max(...cands.map((r) => r.docs || 0), 1);
    cands.forEach((r) => {
      const d = Math.max(near, 0.2) / Math.max(r.km, 0.2);
      r.score = hasDocs ? 0.45 * d + 0.35 * ((r.docs || 0) / maxD) + 0.2 * (r.hrs / maxH) : 0.6 * d + 0.4 * (r.hrs / maxH);
    });
    const best = cands.reduce((a, b) => (b.score > a.score ? b : a));
    return { list: rows, best };
  }

  /** הסבר קצר להמלצה */
  function why(r, group) {
    const parts = [`${U.num(Math.round(r.km * 10) / 10)} ק"מ`];
    if (r.docs) parts.push(group === 'primary' ? `${r.docs} רופאי משפחה וילדים` : `${r.docs} רופאים`);
    return parts.join(' · ');
  }

  window.Recommender = { rank, why, weeklyHours, doctors, isPhysicianField };
})();
