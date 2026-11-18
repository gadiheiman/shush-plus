/* recommender.js – ספירת הרופאים ביחידה (לכרטיסי התוצאות ולחלון שמות הרופאים).
   הדירוג עצמו נמצא ב-primaryRanker.js, ורק במרפאות ראשוניות. */
(function () {
  const F = () => ClalitData.F;

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

  window.Recommender = { doctors, isPhysicianField };
})();
