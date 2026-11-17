/* clinicView.js – מסך "שיוך למרפאה": חיפוש מרפאת כללית הקרובה לכתובת המבוטח */
(function () {
  const { h } = DOM;

  Router.register({
    id: 'clinic', title: 'שיוך למרפאה', icon: '📍', color: 'teal',
    render(el) {
      const box = h('section', { class: 'card card-finder' });
      el.append(
        UI.viewHead('📍 שימור ושירות · שיוך למרפאה', 'מרפאת כללית הקרובה לכתובת של המבוטח', 'בוחרים יישוב, רחוב ומספר בית ולוחצים "חיפוש". מקבלים את המרפאות, בתי המרקחת, המוקדים וטיפות החלב הקרובים, עם המלצה.'),
        box);
      ClinicFinder.mount(box);
    }
  });
})();
