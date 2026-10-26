// Se ejecuta antes de pintar la página para evitar un "parpadeo" del tema equivocado.
// Archivo externo (no script inline) para respetar la Content-Security-Policy.
(function () {
  var tema = 'oscuro';
  try { tema = JSON.parse(localStorage.getItem('voltec.tema')) || 'oscuro'; } catch (e) { /* sin almacenamiento */ }
  if (tema === 'oscuro') document.documentElement.classList.add('dark');
})();
