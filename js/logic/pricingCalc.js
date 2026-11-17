/* pricingCalc.js – חישוב עלות ביטוח משלים למשפחה לפי גילים */
(function () {
  /** מחיר לנפש לפי רצועות גיל */
  function priceForAge(bands, age) {
    const band = bands.find(([max]) => age <= max);
    return band ? band[1] : bands[bands.length - 1][1];
  }

  /**
   * עלות חודשית למשפחה.
   * @param {string} fund  clalit | maccabi | meuhedet
   * @param {'basic'|'top'} tier
   * @param {number[]} ages גילי בני המשפחה
   * @returns {{total:number, plan:string, lines:Array}|null}
   */
  function familyCost(fund, tier, ages) {
    const plan = PRICING.funds[fund] && PRICING.funds[fund][tier];
    if (!plan) return null;
    // ילדים מסודרים מהמבוגר לצעיר, כדי לזהות את "הילד הרביעי ומעלה"
    const kids = ages.filter((a) => a <= 18).sort((a, b) => b - a);
    let childNo = 0;
    const lines = ages.slice().sort((a, b) => b - a).map((age) => {
      let p = priceForAge(plan.bands, age);
      if (age <= 18 && kids.includes(age)) {
        childNo += 1;
        if (plan.freeFromChild && childNo >= plan.freeFromChild) p = 0;
      }
      return { age, price: p };
    });
    const total = lines.reduce((s, l) => s + l.price, 0);
    return { total, plan: plan.name, lines, src: plan.src };
  }

  window.PricingCalc = { familyCost, priceForAge };
})();
