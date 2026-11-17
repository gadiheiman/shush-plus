/* main.js – נקודת הפתיחה: בונה את המסגרת ומפעיל את הניתוב (המסכים נרשמו בקבצי הרכיבים) */
(function () {
  const root = document.getElementById('app');
  const main = Shell.mount(root);
  Router.start(main);
})();
