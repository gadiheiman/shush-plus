/* analytics.js – מדידת שימוש אנונימית עם GoatCounter (בלי עוגיות ובלי מידע אישי).
   סופר מעבר בין מסכים ופעולות מרכזיות. לעולם לא נשלחים כתובת מלאה, טלפון או פרטי מבוטח.
   לוח המדידה: https://shoshplus.goatcounter.com */
(function () {
  const ENDPOINT = 'https://shoshplus.goatcounter.com/count';
  const SCRIPT = 'https://gc.zgo.at/count.js';
  const queue = [];          // פעולות שקרו לפני שהסקריפט נטען
  let ready = false;

  /** האם המדידה פעילה: רק באתר המפורסם, לא בבדיקות מקומיות */
  const enabled = () => /^https:/.test(location.protocol) && !/localhost|127\.0\.0\.1/.test(location.hostname);

  /** טוען את הסקריפט של GoatCounter, בלי ספירה אוטומטית (האפליקציה סופרת בעצמה לפי מסך) */
  function load() {
    if (!enabled()) return;
    window.goatcounter = { no_onload: true };
    const s = document.createElement('script');
    s.async = true;
    s.src = SCRIPT;
    s.dataset.goatcounter = ENDPOINT;
    s.onload = () => { ready = true; queue.splice(0).forEach(send); };
    document.head.appendChild(s);
  }

  /** שליחה בפועל (או המתנה בתור עד שהסקריפט נטען) */
  function send(item) {
    if (!enabled()) return;
    if (!ready || !window.goatcounter || !window.goatcounter.count) { queue.push(item); return; }
    try { window.goatcounter.count(item); } catch (e) { /* מדידה לא תשבור את האפליקציה */ }
  }

  /** צפייה במסך */
  const page = (id, title) => send({ path: '/' + id, title: title || id });

  /** פעולה: שם קצר ופרט (למשל יישוב או נושא) */
  const event = (name, detail) => send({ path: detail ? `${name}/${detail}` : name, title: detail || name, event: true });

  window.Analytics = { load, page, event };
})();
