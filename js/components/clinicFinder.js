/* clinicFinder.js – "המרפאה הקרובה": יישוב → רחוב → מספר בית, כפתורי חיפוש ואיפוס,
   ריבועי סוגי יחידות, ורשימת היחידות הקרובות. לחיצה על שם יחידה פותחת את שעות הפתיחה בחלון קופץ. */
(function () {
  const { h } = DOM;

  /* הגדרת הריבועים: קבוצה, כותרת, כמה תוצאות */
  const TILES = [
    { g: 'primary', name: 'מרפאה ראשונית', icon: '🩺', k: 5 },
    { g: 'expert', name: 'מרפאה יועצת', icon: '👩‍⚕️', k: 3 },
    { g: 'pharm', name: 'בית מרקחת', icon: '💊', k: 5 },
    { g: 'urgent', name: 'מוקד רפואה דחופה', icon: '🚑', k: 3 },
    { g: 'tipat', name: 'טיפת חלב', icon: '🍼', k: 5 }
  ];

  // מצב: מה מוקלד בשדות (form), מה נחפש בפועל (query), והריבוע הנבחר
  const st = { form: { town: '', street: '', num: '' }, query: null, tile: 'primary' };

  /** מספר טלפון בפורמט ישראלי (המאגר שומר בלי 0 מוביל) */
  function phone(p) {
    const d = String(p || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length === 9 && /^[57]/.test(d)) return `0${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length === 8) return `0${d[0]}-${d.slice(1)}`;
    return d.startsWith('0') || d.startsWith('1') ? d : '0' + d;
  }

  /** תוצאות לריבוע */
  function resultsFor(tile, p) {
    return GeoCalc.nearest(p, tile.g, tile.k);
  }

  /** קישור לדף היחידה בספר השירות של כללית */
  const clalitUrl = (u) => `https://www.clalit.co.il/he/sefersherut/pages/clinicdetails.aspx?ddeptcode=${u[ClalitData.F.code]}`;

  /* אייקון לכל סוג שירות (לפי מילת מפתח) */
  const SVC_ICONS = [[/משפחה/, '👨‍⚕️'], [/ילדים/, '🧒'], [/נשים|גינקולוג|הריון/, '🤰'], [/מעבדה|דם/, '🧪'], [/סיעוד|אחיות/, '💉'],
    [/חיסון/, '💉'], [/רוקחות|מרקחת/, '💊'], [/אק"?ג|EKG|לב/, '❤️'], [/תזונה|דיאט/, '🥗'], [/סוכר|גלוקומטר/, '🩸'], [/פיזיותרפיה/, '🦵'],
    [/סוציאלית|פסיכו|נפש/, '🧠'], [/אונקולוג/, '🎗️'], [/ביקור בית/, '🏠'], [/עיניים|אופטומטר/, '👁️'], [/שיניים/, '🦷'], [/אורתופד/, '🦴'], [/עור/, '🧴']];
  const svcIcon = (t) => (SVC_ICONS.find(([re]) => re.test(t)) || [0, '✔️'])[1];

  /** כל השירותים ביחידה: מ"כללית קרובה אליי" ומעמוד המרפאה בספר השירות, בלי כפילויות */
  function allServices(u) {
    const extra = (window.CLINIC_SERVICES || {})[u[ClalitData.F.code]] || [];
    return [...new Set([...ClalitData.services(u), ...extra])];
  }

  /** תג ציון סקר יהלום, בצבע לפי היעד */
  function surveyTag(v) {
    const S = window.CLALIT_SURVEY || {};
    const st = v >= S.target ? 'ok' : v >= S.target - 1.5 ? 'mid' : 'low';
    return h('span', { class: 'px-tag px-' + st, title: `סקר יהלום, ${S.metric}, ${S.period}. יעד ${S.target}` }, `💎 יהלום ${v.toFixed(1)}`);
  }

  /** חלון קופץ: שירותי היחידה, שעות פתיחה, ציון סקר וקישור לאתר כללית */
  function showUnit(u) {
    const F = ClalitData.F, today = new Date().getDay();
    const rows = ClalitData.DAYS.map((d, i) => h('tr', { class: i === today ? 'row-now' : '' },
      h('th', null, `יום ${d}`), h('td', null, h('bdi', { dir: 'ltr' }, ClalitData.dayText(u, i)))));
    const svcs = allServices(u);
    const px = PrimaryRanker.survey(u);
    Modal.open(u[F.name],
      h('div', { class: 'u-head' },
        h('p', null, `${ClalitData.catName(u)} · ${u[F.addr]}, ${u[F.city]}`, u[F.phone] ? [' · ☎ ', h('bdi', { dir: 'ltr' }, phone(u[F.phone]))] : null),
        h('div', { class: 'u-head-act' },
          px !== null ? surveyTag(px) : null,
          h('a', { class: 'btn btn-primary btn-sm', href: clalitUrl(u), target: '_blank', rel: 'noopener' }, '🔗 לדף המרפאה באתר כללית'))),
      h('section', { class: 'svc-box' },
        h('h3', null, `🩺 שירותים ביחידה (${svcs.length})`),
        svcs.length
          ? h('ul', { class: 'svc-grid' }, svcs.map((t) => h('li', null, h('span', { 'aria-hidden': 'true' }, svcIcon(t)), h('span', null, t))))
          : h('p', { class: 'fine' }, 'אין פירוט שירותים במאגר. אפשר לבדוק בדף המרפאה באתר כללית.')),
      h('h3', { class: 'sec-sub' }, '🕘 שעות פתיחה'),
      (u[F.hours] || []).length
        ? h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('thead', null, h('tr', null, h('th', null, 'יום'), h('th', null, 'שעות פתיחה'))), h('tbody', null, rows)))
        : h('p', { class: 'fine' }, 'אין שעות פתיחה במאגר של כללית ליחידה הזו. כדאי להתקשר לבדוק.'),
      h('p', { class: 'fine' }, 'מקור: ', U.srcLink('clalitNear', 'כללית קרובה אליי'), ' וספר השירות של כללית. שעות עשויות להשתנות בחגים.'));
  }

  /** מה סופר "רופאים" לפי סוג היחידה */
  const tileLabelDocs = (group) => (group === 'primary' ? 'רופאי משפחה וילדים' : 'רופאים');

  /** חלון: שמות הרופאים במרפאה (מעמוד המרפאה בספר השירות של כללית) */
  function showDoctors(u, group) {
    const F = ClalitData.F;
    const all = (window.CLALIT_DOCTORS || {})[u[F.code]] || [];
    const isDoc = (f) => (group === 'primary' ? /רפואת משפחה|ילדים/.test(f) : Recommender.isPhysicianField(f));
    const docs = all.filter(([, f]) => isDoc(f));
    const others = all.filter(([, f]) => !isDoc(f));
    // קיבוץ לפי תחום
    const byField = (list) => Object.entries(list.reduce((m, [n, f]) => ((m[f] = m[f] || []).push(n), m), {}));
    const section = (title, list) => h('section', { class: 'doc-sec' }, h('h3', null, title),
      byField(list).map(([f, names]) => h('div', { class: 'doc-field' }, h('b', null, `${f} (${names.length})`),
        h('ul', { class: 'doc-list' }, names.map((n) => h('li', null, n))))));
    Modal.open(`👩‍⚕️ הצוות ב${u[F.name]}`,
      h('p', { class: 'fine' }, group === 'primary'
        ? 'המספר בכרטיס סופר את רופאי המשפחה ורופאי הילדים שרשומים למרפאה.'
        : 'המספר בכרטיס סופר את הרופאים שרשומים ליחידה, בלי מקצועות פרא-רפואיים.'),
      docs.length ? section('רופאים', docs) : h('p', { class: 'empty' }, 'אין רשימת רופאים במאגר.'),
      others.length ? h('details', { class: 'doc-more' }, h('summary', null, `אנשי צוות נוספים (${others.length})`), section('צוות נוסף', others)) : null,
      h('p', { class: 'fine' }, 'מקור: ', h('a', { href: clalitUrl(u), target: '_blank', rel: 'noopener' }, 'דף המרפאה בספר השירות של כללית'), '. הרשימה עשויה להשתנות.'));
  }

  /** תג הציון המשוקלל: לחיצה מסבירה איך חושב */
  function scoreBtn(r) {
    const b = h('button', { type: 'button', class: 'score-badge', title: 'ציון התאמה משוקלל – לחצו להסבר' }, `🏅 התאמה ${r.score}/100`);
    b.addEventListener('click', () => showScore(r));
    return b;
  }

  /** חלון: פירוק הציון המשוקלל לפי המשקלים */
  function showScore(r) {
    const w = PrimaryRanker.weights();
    const rows = PrimaryRanker.KEYS.map((k) => {
      const val = { air: `${U.num(Math.round(r.km * 10) / 10)} ק"מ`, drive: `${U.num(Math.round(r.dKm * 10) / 10)} ק"מ`, survey: r.px !== null ? r.px.toFixed(1) : 'אין נתון (ממוצע)' }[k];
      const pts = Math.round(r.parts[k] * 100);
      return h('tr', null, h('th', null, PrimaryRanker.LABELS[k]), h('td', null, val), h('td', null, `${pts}/100`), h('td', null, `${w[k]}%`), h('td', null, h('b', null, U.num(Math.round(r.parts[k] * w[k])))));
    });
    Modal.open(`🏅 ציון התאמה: ${r.score}/100`,
      h('p', null, 'הציון קובע את סדר המרפאות הראשוניות ברשימה. הוא משקלל שלושה רכיבים לפי המשקלים שנבחרו מעל הרשימה. 100 = הכי טובה בכל רכיב מבין המרפאות שנבדקו.'),
      h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
        h('thead', null, h('tr', null, h('th', null, 'רכיב'), h('th', null, 'נתון'), h('th', null, 'ציון'), h('th', null, 'משקל'), h('th', null, 'תרומה'))),
        h('tbody', null, rows))),
      h('p', { class: 'fine' }, 'מרחק: הקרובה ביותר מקבלת 100, והאחרות יחסית אליה. סקר יהלום: הגבוה מבין המרפאות שנבדקו מקבל 100 והנמוך 0.'));
  }

  /** שורת תוצאה: שם לחיץ, כתובת, מרחק, נתוני זמינות וכפתורי ניווט.
      בנויה קומפקטית כדי שתיראה טוב גם בנייד */
  function resultRow({ u, km, docs, drive, px, score, parts, dKm }, origin, rec, group = 'primary') {
    const F = ClalitData.F;
    const est = GeoCalc.roadEstimate(km);
    const nav = GeoCalc.navLinks(origin, [u[F.lat], u[F.lon]]);
    const name = h('button', { type: 'button', class: 'unit-name', title: 'שירותים ושעות פתיחה' }, u[F.name].trim());
    name.addEventListener('click', () => showUnit(u));
    const r1 = (x) => U.num(Math.round(x * 10) / 10);
    // נסיעה: מסלול אמיתי אם חושב, אחרת הערכה (~)
    const driveTxt = drive ? `🚗 ${r1(drive.km)} ק"מ · ${drive.min} דק׳` : `🚗 ~${est.min} דק׳ נסיעה`;
    // רופאים: לחיצה פותחת את שמות הרופאים במרפאה
    let docBtn = null;
    if (docs) {
      docBtn = h('button', { type: 'button', class: 'chip-btn', title: 'רשימת הרופאים במרפאה' }, `👩‍⚕️ ${docs} ${tileLabelDocs(group)}`);
      docBtn.addEventListener('click', () => showDoctors(u, group));
    }
    const facts = [h('span', null, driveTxt), px !== undefined && px !== null ? surveyTag(px) : null, docBtn].filter(Boolean);
    const navBtn = (href, ic, label, primary) => h('a', { class: `nav-btn ${primary ? 'nav-btn-main' : ''}`, href, target: '_blank', rel: 'noopener', 'aria-label': label },
      h('span', { 'aria-hidden': 'true' }, ic), h('span', null, label));
    const site = h('a', { class: 'site-link', href: clalitUrl(u), target: '_blank', rel: 'noopener', 'aria-label': 'דף המרפאה באתר כללית', title: 'דף המרפאה באתר כללית' }, '🔗');
    return h('article', { class: `unit ${rec ? 'unit-rec' : ''}` },
      h('div', { class: 'unit-top' },
        h('div', { class: 'unit-id' },
          h('div', { class: 'unit-badges' }, rec ? h('span', { class: 'rec-badge', title: rec }, '⭐ מומלצת') : null,
            score !== undefined ? scoreBtn({ u, km, score, parts, dKm, px }) : null),
          h('div', { class: 'unit-name-row' }, name, site),
          h('p', { class: 'fine' }, `${u[F.addr]}, ${u[F.city]}`),
          u[F.phone] ? h('a', { class: 'unit-phone', href: 'tel:' + phone(u[F.phone]).replace(/\D/g, '') }, '☎ ', h('bdi', { dir: 'ltr' }, phone(u[F.phone]))) : null),
        h('div', { class: 'unit-dist', title: 'מרחק אווירי' }, h('b', null, r1(km)), h('span', null, 'ק"מ'))),
      h('div', { class: 'unit-facts' }, facts),
      h('div', { class: 'unit-nav' },
        navBtn(nav.drive, '🚗', 'נסיעה', true), navBtn(nav.transit, '🚌', 'תח״צ'), navBtn(nav.walk, '🚶', 'הליכה'), navBtn(nav.waze, '🧭', 'Waze')));
  }

  /** רשימה לשאר סוגי היחידות: לפי מרחק בלבד, בלי ציון ובלי המלצה */
  function nearestList(cur, origin) {
    if (!cur.res.length) return h('p', { class: 'empty' }, 'לא נמצאו יחידות מהסוג הזה באזור.');
    return cur.res.map((x) => resultRow({ ...x, docs: Recommender.doctors(x.u, cur.t.g) }, origin, null, cur.t.g));
  }

  /* מרפאות ראשוניות: כמה מועמדות נבדקות בשקלול, וכמה מוצגות */
  const PRIMARY_POOL = 10;
  const PRIMARY_SHOW = 5;

  /**
   * רשימת המרפאות הראשוניות לפי המשקלים: מרחק אווירי, מרחק נסיעה וסקר יהלום.
   * מוצגת מיד עם הערכת נסיעה, ומתעדכנת כשמגיעים מרחקי המסלול האמיתיים.
   */
  function primaryList(p, origin) {
    const pool = GeoCalc.nearest(p, 'primary', PRIMARY_POOL).map((x) => ({ ...x, docs: Recommender.doctors(x.u, 'primary') }));
    if (!pool.length) return h('p', { class: 'empty' }, 'לא נמצאו מרפאות ראשוניות באזור.');
    const list = h('div', { class: 'unit-grid' });
    const status = h('p', { class: 'fine route-status' }, '🚗 מחשב מרחקי נסיעה בכביש…');
    let drives = null;
    const draw = () => {
      const ranked = PrimaryRanker.rank(pool.map((x, i) => ({ ...x, drive: drives && drives[i] ? drives[i] : null })));
      DOM.clear(list).append(...ranked.slice(0, PRIMARY_SHOW).map((r, i) => resultRow(r, origin, i === 0 ? PrimaryRanker.why(r) : null)));
    };
    draw();
    Routing.drive(p, pool.map((x) => [x.u[ClalitData.F.lat], x.u[ClalitData.F.lon]])).then((res) => {
      if (res && res.some(Boolean)) { drives = res; status.textContent = '🚗 מרחק הנסיעה מחושב לפי מסלול בכביש (OpenStreetMap).'; }
      else status.textContent = '🚗 שירות המסלולים לא זמין כרגע, ולכן מרחק הנסיעה הוא הערכה: מרחק אווירי × 1.3.';
      draw();
    });
    return h('div', { class: 'primary-res' }, WeightsPanel.render(draw), status, list,
      h('p', { class: 'fine' }, `🏅 = ציון התאמה (0–100) לפי המשקלים; לחיצה עליו מסבירה את החישוב. 💎 סקר יהלום: מדד "${window.CLALIT_SURVEY.metric}", ${window.CLALIT_SURVEY.period}. מרפאה בלי נתון סקר מקבלת ציון ממוצע. נבדקות ${PRIMARY_POOL} המרפאות הקרובות, ומוצגות ${PRIMARY_SHOW} עם הציון המשוקלל הגבוה. מקורות: `,
        U.srcLink('yahalom', 'סקר יהלום'), ' · ', U.srcLink('osrm', 'OSRM')));
  }

  /** אזור התוצאות: ריבועים + רשימת הריבוע הנבחר */
  function results(redraw) {
    const q = st.query;
    if (!q) return h('p', { class: 'fine' }, 'בחרו יישוב (ורצוי גם רחוב ומספר בית) ולחצו "חיפוש".');
    const loc = GeoCalc.locate(q.town, q.street, q.num);
    if (!loc) return h('p', { class: 'empty' }, 'לא נמצא מיקום ליישוב הזה. בחרו יישוב מהרשימה.');
    const origin = [q.street, q.num, q.town].filter(Boolean).join(' ');
    const all = TILES.map((t) => ({ t, res: resultsFor(t, loc.p) }));
    const cur = all.find((x) => x.t.g === st.tile);

    const tiles = h('div', { class: 'f-tiles', role: 'tablist' }, all.map(({ t, res }) => {
      const b = h('button', { type: 'button', class: 'f-tile', role: 'tab', 'aria-selected': String(t.g === st.tile) },
        h('span', { class: 'f-ic', 'aria-hidden': 'true' }, t.icon),
        h('strong', null, t.name),
        h('small', null, res[0] ? `${U.num(Math.round(res[0].km * 10) / 10)} ק"מ` : 'אין באזור'));
      b.addEventListener('click', () => { st.tile = t.g; redraw(); });
      return b;
    }));

    return h('div', { class: 'finder-res' },
      tiles,
      h('h3', { class: 'sec-sub' }, cur.t.g === 'primary' ? `${cur.t.icon} ${cur.t.name} · ${PRIMARY_SHOW} המובילות בשקלול` : `${cur.t.icon} ${cur.t.name} · ${cur.res.length} הקרובים`),
      cur.t.g === 'primary' ? primaryList(loc.p, origin) : nearestList(cur, origin),
      h('details', { class: 'f-note' }, h('summary', null, 'ℹ️ איך נבחרת המומלצת ומאיפה הנתונים'), h('p', { class: 'fine' }, '⭐ במרפאות ראשוניות הסדר נקבע לפי ציון ההתאמה, לפי המשקלים שמעל הרשימה. בשאר סוגי היחידות הרשימה מסודרת לפי מרחק אווירי בלבד. לחיצה על שם היחידה מציגה את שעות הפתיחה. מרחק בכביש וזמן נסיעה הם הערכה; למסלול מדויק ולתחבורה ציבורית – כפתורי הניווט. מקורות: ',
        U.srcLink('clalitNear', 'כללית קרובה אליי'), ' · ', U.srcLink('osm', 'OpenStreetMap'))));
  }

  /** פס הכתובת אחרי חיפוש: הכתובת, רמת הדיוק, העתקה ו"שינוי" (פותח את הטופס שוב) */
  function addressBar(onEdit) {
    const q = st.query;
    const loc = GeoCalc.locate(q.town, q.street, q.num);
    const origin = [q.street, q.num].filter(Boolean).join(' ');
    const where = origin ? `${origin}, ${q.town}` : q.town;
    const first = loc ? GeoCalc.nearest(loc.p, 'primary', 1)[0] : null;
    const F = ClalitData.F;
    const summary = first ? `המרפאה הקרובה של כללית ל${where}: ${first.u[F.name]}, ${U.num(Math.round(first.km * 10) / 10)} ק"מ באוויר. ${first.u[F.addr]}, ${first.u[F.city]}.` : '';
    const edit = h('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, '✎ שינוי');
    edit.addEventListener('click', onEdit);
    const precClass = loc ? { house: 'ok', 'near-house': 'ok', street: 'mid', town: 'low' }[loc.precision] : 'low';
    return h('div', { class: 'addr-bar' },
      h('span', { class: 'addr-ic', 'aria-hidden': 'true' }, '📍'),
      h('div', { class: 'addr-txt' }, h('strong', null, where), loc ? h('small', { class: 'prec-' + precClass }, loc.note) : null),
      h('div', { class: 'addr-act' }, summary ? DOM.copyBtn(summary, 'העתקה') : null, edit));
  }

  /** טופס החיפוש: שדות, חיפוש ואיפוס */
  function form(onSearch, onReset) {
    const f = st.form;
    const mk = (id, label, ph) => {
      const inp = h('input', { id, class: 'input', value: f[id.slice(3)], autocomplete: 'off', placeholder: ph });
      return [inp, h('div', { class: 'field' }, h('label', { class: 'field-label', for: id }, label), inp)];
    };
    const [town, townF] = mk('cf-town', '1. יישוב', 'למשל: נתניה');
    const [street, streetF] = mk('cf-street', '2. רחוב', 'בחרו רחוב');
    const [num, numF] = mk('cf-num', '3. מספר בית', 'למשל: 12');
    num.inputMode = 'numeric';

    /* היישוב והרחוב שנבחרו בפועל (רק ערכים שקיימים ברשימות) */
    const curTown = () => (GEO.center[town.value.trim()] ? town.value.trim() : '');
    const curStreet = () => { const t = curTown(); return t && (GEO.streets[t] || {})[street.value.trim()] !== undefined ? street.value.trim() : ''; };
    /** מאפשר רחוב רק אחרי יישוב, ומספר רק אחרי רחוב */
    const refresh = () => { street.disabled = !curTown(); num.disabled = !curStreet(); };

    // השלמה אוטומטית (עובדת גם בנייד). אחרי בחירה עוברים לשדה הבא
    Autocomplete.attach(town, () => GeoCalc.towns(), () => street.focus());
    Autocomplete.attach(street, () => (curTown() ? GeoCalc.streets(curTown()) : []), () => num.focus(), { openEmpty: true });
    Autocomplete.attach(num, () => (curStreet() ? GeoCalc.houseNums(curTown(), curStreet()).map(String) : []), null, { prefixOnly: true, openEmpty: true });
    town.addEventListener('input', () => { street.value = ''; num.value = ''; refresh(); });
    street.addEventListener('input', () => { num.value = ''; refresh(); });
    refresh();

    const go = h('button', { type: 'submit', class: 'btn btn-primary' }, '🔍 חיפוש');
    const reset = h('button', { type: 'button', class: 'btn btn-ghost' }, '↺ איפוס');
    const err = h('p', { class: 'field-err', 'aria-live': 'polite' });
    reset.addEventListener('click', onReset);
    const el = h('form', { class: 'finder-form' }, townF, streetF, numF, h('div', { class: 'f-btns' }, go, reset), err);
    el.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = town.value.trim();
      if (!GEO.center[t]) { err.textContent = 'בחרו יישוב מהרשימה.'; town.focus(); return; }
      const s = (GEO.streets[t] || {})[street.value.trim()] !== undefined ? street.value.trim() : '';
      if (street.value.trim() && !s) { err.textContent = 'הרחוב לא נמצא ברשימה. בחרו רחוב מהרשימה או השאירו ריק.'; street.focus(); return; }
      err.textContent = '';
      onSearch({ town: t, street: s, num: s ? num.value.replace(/\D/g, '') : '' });
    });
    return el;
  }

  /** בונה את רכיב החיפוש בתוך מיכל */
  function mount(host) {
    const out = h('div');
    let editing = false;   // אחרי חיפוש הטופס מוסתר, עד שלוחצים "שינוי"
    const redraw = () => {
      DOM.clear(out).append(results(redraw));
      // בנייד הריבועים בפס נגלל – מביאים את הנבחר לתצוגה
      const sel = out.querySelector('.f-tile[aria-selected="true"]');
      if (sel && sel.parentElement.scrollWidth > sel.parentElement.clientWidth) sel.parentElement.scrollLeft += sel.getBoundingClientRect().left - sel.parentElement.getBoundingClientRect().left - 4;
    };
    const draw = () => {
      const showForm = !st.query || editing;
      DOM.clear(host).append(
        h('div', { class: 'card-row' }, h('h2', { class: 'card-title' }, '🔍 חיפוש לפי כתובת'), h('span', { class: 'fine f-count-all' }, `${U.num(ClalitData.all().length)} יחידות כללית באזור`)),
        showForm
          ? form((q) => { st.form = { ...q }; st.query = q; editing = false; draw(); },
              () => { st.form = { town: '', street: '', num: '' }; st.query = null; st.tile = 'primary'; editing = false; draw(); })
          : addressBar(() => { editing = true; draw(); host.querySelector('#cf-town')?.focus(); }),
        out);
      redraw();
    };
    draw();
  }

  window.ClinicFinder = { mount, showHours: showUnit, showUnit, phone };
})();
