/* clalitData.js – עבודה עם יחידות כללית: קבוצות סוגים, שעות פעילות, יחידות לפי יישוב */
(function () {
  const C = window.CLALIT;
  // אינדקסים לשדות היחידה
  const F = { code: 0, name: 1, cat: 2, city: 3, addr: 4, lat: 5, lon: 6, phone: 7, hours: 8, svc: 9, acc: 10 };

  /* קבוצות סוגי יחידות, לפי קודי הקטגוריה של כללית */
  const GROUPS = {
    primary: { name: 'מרפאה ראשונית', cats: [101, 102, 103, 107], icon: '🩺' },
    expert:  { name: 'מרפאה יועצת', cats: [104], icon: '👩‍⚕️' },
    urgent:  { name: 'מוקד רפואה דחופה', cats: [303], icon: '🚑' },
    lab:     { name: 'מעבדה', cats: [9], svc: 515, icon: '🧪' },
    pharm:   { name: 'בית מרקחת', cats: [401], icon: '💊' },
    tipat:   { name: 'טיפת חלב', cats: [916], icon: '🍼' },
    inst:    { name: 'מכון', cats: [202, 203, 204, 205, 207, 208, 209, 212], icon: '🏥' },
    centers: { name: 'מרכז בריאות', cats: [501, 502, 503], icon: '🌿' },
    hosp:    { name: 'בית חולים', cats: [60], icon: '🏨' },
    indep:   { name: 'רופא/ה עצמאי/ת בהסדר', cats: [112], icon: '🧑‍⚕️' }
  };

  /** האם היחידה שייכת לקבוצה */
  function inGroup(u, g) {
    const G = GROUPS[g];
    return G.cats.includes(u[F.cat]) || (G.svc && (u[F.svc] || []).includes(G.svc));
  }

  /** נרמול שמות יישובים (כמו בבניית הנתונים) */
  const norm = (s) => (s || '').replace(/ע'/g, 'ע').replace(/ג'/g, 'ג').replace(/[\s\-–־'"״׳`.(),]/g, '');
  const ALIAS = {
    'באקה': ["באקה אל ע'רביה"], 'באקה אל-גרביה': ["באקה אל ע'רביה"],
    'בנימינה': ['בנימינה גבעת עדה'], 'גבעת עדה': ['בנימינה גבעת עדה'],
    'קדימה': ['קדימה צורן'], 'צורן': ['קדימה צורן'], 'כוכב יאיר': ['כוכב יאיר-צור יגאל'], 'צור יגאל': ['כוכב יאיר-צור יגאל'],
    'גבעת חיים (מאוחד)': ['גבעת חיים מאוחד'], 'גבעת חיים (איחוד)': ['גבעת חיים איחוד']
  };

  /** יחידות כללית שכתובתן ביישוב */
  function unitsInTown(town) {
    const keys = new Set([town, ...(ALIAS[town] || [])].map(norm));
    return C.u.filter((u) => keys.has(norm(u[F.city])));
  }

  /** ספירת יחידות לפי קבוצה */
  function countByGroup(units) {
    const out = {};
    Object.keys(GROUPS).forEach((g) => { out[g] = units.filter((u) => inGroup(u, g)).length; });
    return out;
  }

  /* ---- שעות פעילות ---- */
  const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  /** טווחי שעות ליום: [[מ-, עד-], ...] */
  function rangesFor(u, day) {
    const d = (u[F.hours] || []).find((x) => x[0] === day);
    if (!d) return [];
    const r = [];
    for (let i = 1; i + 1 < d.length; i += 2) r.push([d[i], d[i + 1]]);
    return r;
  }
  /** טקסט שעות ליום */
  const dayText = (u, day) => rangesFor(u, day).map(([a, b]) => `${hhmm(a)}–${hhmm(b)}`).join(', ') || 'סגור';
  /** פתוח עכשיו? null אם אין נתוני שעות */
  function openNow(u, now = new Date()) {
    if (!(u[F.hours] || []).length) return null;
    const m = now.getHours() * 60 + now.getMinutes();
    return rangesFor(u, now.getDay()).some(([a, b]) => m >= a && m < b);
  }
  /** תגיות שעות: ערב (אחרי 19:00), שישי, שבת */
  function hourTags(u) {
    const all = u[F.hours] || [];
    return {
      evening: all.some((d) => d[0] <= 4 && rangesFor(u, d[0]).some(([, b]) => b >= 19 * 60)),
      friday: rangesFor(u, 5).length > 0,
      saturday: rangesFor(u, 6).length > 0,
      known: all.length > 0
    };
  }

  /** שמות שירותים ונגישות */
  const services = (u) => (u[F.svc] || []).map((s) => C.svc[s]).filter(Boolean);
  const access = (u) => (u[F.acc] || []).map((s) => (C.acc[s] || '').trim()).filter(Boolean);
  const catName = (u) => C.cat[u[F.cat]] || '';

  window.ClalitData = { F, GROUPS, inGroup, unitsInTown, countByGroup, DAYS, dayText, openNow, hourTags, services, access, catName, all: () => C.u };
})();
