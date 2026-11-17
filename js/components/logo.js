/* logo.js – הלוגו של שו״ש פלוס (קונספט ב: "הגרשיים שהפכו לפלוס").
   ריבוע מעוגל בכחול-סגול, האות ש' בלבן ופלוס כתום במקום הגרשיים. */
(function () {
  let seq = 0;

  /** מחרוזת ה-SVG של הסמל. gid – מזהה ייחודי לגרדיאנט */
  function markSvg(size, gid) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="שו״ש פלוס">
<defs><linearGradient id="${gid}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b5ed7"/><stop offset="1" stop-color="#6d4cf0"/></linearGradient></defs>
<rect x="2" y="2" width="96" height="96" rx="26" fill="url(#${gid})"/>
<text x="56" y="76" text-anchor="middle" font-family="Secular One, Rubik, Arial, sans-serif" font-weight="700" font-size="64" fill="#ffffff">ש</text>
<rect x="15" y="21" width="9" height="27" rx="4.5" fill="#f2643d"/><rect x="6" y="30" width="27" height="9" rx="4.5" fill="#f2643d"/></svg>`;
  }

  /** סמל כאלמנט, לשימוש בממשק */
  function mark(size = 40) {
    const span = document.createElement('span');
    span.className = 'logo-mark';
    span.innerHTML = markSvg(size, 'lg' + (++seq));
    return span;
  }

  /** מגדיר את הסמל גם כאייקון של לשונית הדפדפן */
  function setFavicon() {
    const link = document.querySelector('link[rel="icon"]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon' }));
    link.type = 'image/svg+xml';
    link.href = 'data:image/svg+xml,' + encodeURIComponent(markSvg(64, 'fav'));
  }

  window.Logo = { mark, setFavicon };
})();
