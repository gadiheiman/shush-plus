/* geoCalc.js – איתור כתובת, מרחק אווירי, הערכת דרך, ומרפאות קרובות */
(function () {
  const F = () => ClalitData.F;

  /** מרחק אווירי בק"מ (נוסחת הברסין) */
  function km(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLa = (b[0] - a[0]) * rad, dLo = (b[1] - a[1]) * rad;
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /** יישובים שיש להם מיקום (לרשימת הבחירה) */
  const towns = () => Object.keys(GEO.center).sort((a, b) => a.localeCompare(b, 'he'));
  /** רחובות ביישוב, ממוינים */
  const streets = (town) => Object.keys(GEO.streets[town] || {}).sort((a, b) => a.localeCompare(b, 'he'));
  /** מספרי בתים ידועים ברחוב */
  const houseNums = (town, street) => Object.keys(((GEO.houses[town] || {})[street]) || {}).map(Number).sort((a, b) => a - b);

  /**
   * ממיר כתובת לנקודה. רמת הדיוק: house (מספר בית מדויק), near-house (מספר בית סמוך), street, town
   * @returns {{p:number[], precision:string, note:string}|null}
   */
  function locate(town, street, num) {
    const c = GEO.center[town];
    if (!c) return null;
    const h = ((GEO.houses[town] || {})[street]) || {};
    const n = parseInt(num, 10);
    if (street && n && h[n]) return { p: h[n], precision: 'house', note: 'מיקום לפי מספר הבית' };
    if (street && n) {
      const nums = Object.keys(h).map(Number);
      if (nums.length) {
        const best = nums.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
        if (Math.abs(best - n) <= 10) return { p: h[best], precision: 'near-house', note: `מיקום לפי בית מספר ${best} באותו רחוב` };
      }
    }
    const s = street && (GEO.streets[town] || {})[street];
    if (s) return { p: s, precision: 'street', note: 'מיקום לפי אמצע הרחוב' };
    return { p: c, precision: 'town', note: 'מיקום לפי מרכז היישוב (הרחוב לא ממופה)' };
  }

  /** k היחידות הקרובות ביותר מקבוצה, עם מרחק */
  function nearest(p, group, k = 3) {
    const f = F();
    return ClalitData.all()
      .filter((u) => ClalitData.inGroup(u, group))
      .map((u) => ({ u, km: km(p, [u[f.lat], u[f.lon]]) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, k);
  }

  /** הערכה גסה של מרחק נסיעה ודקות (מקדם פיתול 1.3; מהירות ממוצעת לפי אורך) – רק להמחשה */
  function roadEstimate(airKm) {
    const road = airKm * 1.3;
    const speed = road < 3 ? 22 : road < 10 ? 32 : 50;
    return { km: road, min: Math.max(3, Math.round((road / speed) * 60) + 2) };
  }

  /** קישורי ניווט חיצוניים (נפתחים מחוץ לאפליקציה) */
  function navLinks(originText, dest) {
    const o = encodeURIComponent(originText), d = `${dest[0]},${dest[1]}`;
    const g = (mode) => `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=${mode}`;
    return {
      drive: g('driving'), transit: g('transit'), walk: g('walking'),
      waze: `https://waze.com/ul?ll=${d}&navigate=yes`
    };
  }

  window.GeoCalc = { km, towns, streets, houseNums, locate, nearest, roadEstimate, navLinks };
})();
