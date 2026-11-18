/* routing.js – מרחק נסיעה אמיתי בכביש, משרת המסלולים הציבורי של OSRM (על בסיס OpenStreetMap).
   בקשה אחת מחזירה את המרחק והזמן מהכתובת לכמה יחידות. אם השרת לא זמין, מחזירים null
   והאפליקציה עוברת להערכה (מרחק אווירי × 1.3). */
(function () {
  const URL_BASE = 'https://router.project-osrm.org/table/v1/driving/';
  const TIMEOUT_MS = 7000;
  const cache = new Map();

  /** מפתח מטמון לפי מוצא ויעדים */
  const keyOf = (origin, dests) => [origin, ...dests].map((p) => p[0].toFixed(5) + ',' + p[1].toFixed(5)).join('|');

  /**
   * מרחקי נסיעה מהמוצא לכל יעד
   * @param {[number, number]} origin [lat, lon]
   * @param {Array<[number, number]>} dests [[lat, lon], ...]
   * @returns {Promise<Array<{km:number, min:number}|null>|null>} null אם השירות לא זמין
   */
  async function drive(origin, dests) {
    if (!dests.length) return [];
    const key = keyOf(origin, dests);
    if (cache.has(key)) return cache.get(key);
    // OSRM מקבל lon,lat
    const coords = [origin, ...dests].map((p) => `${p[1]},${p[0]}`).join(';');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${URL_BASE}${coords}?sources=0&annotations=distance,duration`, { signal: ctrl.signal });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.code !== 'Ok') return null;
      const out = dests.map((_, i) => {
        const m = data.distances[0][i + 1], s = data.durations[0][i + 1];
        return m == null ? null : { km: m / 1000, min: Math.max(1, Math.round(s / 60)) };
      });
      cache.set(key, out);
      return out;
    } catch (e) {
      return null;   // אין רשת, חסימה או זמן תגובה ארוך
    } finally {
      clearTimeout(timer);
    }
  }

  window.Routing = { drive };
})();
