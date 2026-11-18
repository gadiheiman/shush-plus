/* primaryRanker.js – דירוג מרפאות ראשוניות לפי שקלול: מרחק אווירי, מרחק נסיעה וציון סקר יהלום.
   המשקלים ניתנים לשינוי במסך ונשמרים בדפדפן. ברירת מחדל: 40% / 40% / 20%. */
(function () {
  const DEFAULT = { air: 40, drive: 40, survey: 20 };
  const KEYS = ['air', 'drive', 'survey'];
  const LABELS = { air: 'מרחק אווירי', drive: 'מרחק נסיעה', survey: 'סקר יהלום' };

  /** המשקלים הנוכחיים (תמיד מסתכמים ל-100) */
  function weights() {
    const w = Store.get('weights');
    return w && KEYS.every((k) => typeof w[k] === 'number') ? w : { ...DEFAULT };
  }

  /**
   * משנה משקל אחד ומחלק את השארית בין השניים האחרים לפי היחס ביניהם, כך שהסכום נשאר 100
   * @returns {{air:number, drive:number, survey:number}}
   */
  function setWeight(key, value) {
    const cur = weights();
    const v = Math.max(0, Math.min(100, Math.round(value)));
    const others = KEYS.filter((k) => k !== key);
    const rest = 100 - v;
    const sumOthers = others.reduce((s, k) => s + cur[k], 0);
    const next = { [key]: v };
    others.forEach((k) => { next[k] = sumOthers ? Math.round((cur[k] / sumOthers) * rest) : Math.round(rest / 2); });
    // תיקון עיגול: ההפרש הולך לשני
    next[others[1]] = 100 - v - next[others[0]];
    Store.set({ weights: next });
    return next;
  }

  const reset = () => { Store.set({ weights: { ...DEFAULT } }); return { ...DEFAULT }; };

  /** ציון סקר יהלום של יחידה, או null */
  const survey = (u) => {
    const s = (window.CLALIT_SURVEY || {}).scores || {};
    const v = s[u[ClalitData.F.code]];
    return typeof v === 'number' ? v : null;
  };

  /** ציון "קרוב יותר = טוב יותר": הקרובה מקבלת 1, האחרות יחסית אליה */
  const closeness = (v, best) => Math.max(best, 0.2) / Math.max(v, 0.2);

  /**
   * מדרג רשימת מועמדות
   * @param {Array<{u, km, drive?:{km, min}}>} list מועמדות עם מרחק אווירי ומרחק נסיעה (אם ידוע)
   * @returns {Array} הרשימה ממוינת מהגבוה לנמוך, לכל אחת score (0–100), parts וציון סקר
   */
  function rank(list) {
    const w = weights();
    const rows = list.map((x) => ({ ...x, px: survey(x.u), dKm: x.drive ? x.drive.km : GeoCalc.roadEstimate(x.km).km }));
    const bestAir = Math.min(...rows.map((r) => r.km));
    const bestDrive = Math.min(...rows.map((r) => r.dKm));
    // סקר: מנרמלים בין הנמוך לגבוה מבין המועמדות; מרפאה בלי נתון מקבלת את הממוצע (ניטרלי)
    const known = rows.map((r) => r.px).filter((v) => v !== null);
    const lo = Math.min(...known), hi = Math.max(...known);
    const avg = known.length ? known.reduce((a, b) => a + b, 0) / known.length : null;
    const surveyPart = (v) => {
      if (!known.length) return 0.5;
      const x = v === null ? avg : v;
      return hi > lo ? (x - lo) / (hi - lo) : 1;
    };
    rows.forEach((r) => {
      r.parts = { air: closeness(r.km, bestAir), drive: closeness(r.dKm, bestDrive), survey: surveyPart(r.px) };
      r.score = Math.round(KEYS.reduce((s, k) => s + (w[k] / 100) * r.parts[k], 0) * 100);
    });
    return rows.sort((a, b) => b.score - a.score || a.km - b.km);
  }

  /** משפט קצר: למה המרפאה במקום הראשון */
  function why(r) {
    const parts = [`${U.num(Math.round(r.km * 10) / 10)} ק"מ באוויר`, `${U.num(Math.round(r.dKm * 10) / 10)} ק"מ נסיעה`];
    if (r.px !== null) parts.push(`יהלום ${r.px.toFixed(1)}`);
    return `ציון משוקלל ${r.score} · ` + parts.join(' · ');
  }

  window.PrimaryRanker = { DEFAULT, KEYS, LABELS, weights, setWeight, reset, rank, why, survey };
})();
