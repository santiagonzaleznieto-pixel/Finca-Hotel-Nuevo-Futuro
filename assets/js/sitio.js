/* ==========================================================================
   Estructura común del sitio: cabecera, pie, textos editables (CMS),
   bienvenida, menú móvil, enlaces de WhatsApp y respaldo de animaciones.
   ========================================================================== */
(function () {
  'use strict';
  var U = window.NF.util;
  var pagina = document.body.getAttribute('data-pagina') || '';

  var ICONOS = {
    flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    izq: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    abajo: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    mensaje: '<path d="M4 5h16v11H9l-5 4z"/>',
    personas: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5"/><circle cx="17" cy="9" r="2.3"/><path d="M15.5 14.3c2.3.2 4 1.8 4.6 4.2"/>',
    cama: '<path d="M3 18V8M21 18v-5H3M3 13h18M7 13v-2.5A1.5 1.5 0 0 1 8.5 9h3A1.5 1.5 0 0 1 13 10.5V13"/>',
    agua: '<path d="M2 16c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 20c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M8 13V5a2 2 0 0 1 4 0M16 13V5a2 2 0 0 0-4 0M8 8h8"/>',
    fuego: '<path d="M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-7.5zM5 21h14"/>',
    hoja: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7"/>',
    casa: '<path d="M3 10l9-6 9 6M5 10v10h14V10M9 20v-5h6v5"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    estrella: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>'
  };
  function icono(n, tam) { return '<svg aria-hidden="true" viewBox="0 0 24 24" width="' + (tam || 20) + '" height="' + (tam || 20) + '" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + (ICONOS[n] || '') + '</svg>'; }

  var LOGO = '<svg aria-hidden="true" viewBox="0 0 339 189"><g fill="#F2F0EA"><rect x="117" y="0" width="35" height="189"/><rect x="185" y="0" width="36" height="189"/><polygon points="152,101 152,124 185,157 185,134"/><rect x="53" y="44" width="35" height="145"/><rect x="251" y="44" width="35" height="145"/><rect x="23" y="44" width="65" height="36"/><rect x="251" y="44" width="65" height="36"/></g><g fill="#C9A54A"><rect x="0" y="0" width="88" height="35"/><rect x="250" y="0" width="89" height="35"/></g></svg>';

  var NAV = [['habitaciones', 'Habitaciones'], ['planes', 'Planes'], ['experiencias', 'Experiencias'], ['la-finca', 'La finca'], ['eventos', 'Eventos'], ['galeria', 'Galería'], ['ubicacion', 'Ubicación']];

  function cabecera() {
    var solida = document.body.hasAttribute('data-cabecera-solida');
    var links = NAV.map(function (n) { return '<a href="/' + n[0] + '.html"' + (pagina === n[0] ? ' aria-current="page"' : '') + '>' + n[1] + '</a>'; }).join('');
    return '<a class="saltar" href="#contenido">Saltar al contenido</a>' +
      '<header class="cabecera nf-hdr' + (solida ? ' cabecera--solida' : '') + '">' +
      '<div class="cabecera__barra">' +
      '<a class="logo nf-logo" href="/index.html" aria-label="Nuevo Futuro Finca Hotel, ir al inicio">' + LOGO + '<span class="logo__texto"><span class="logo__nombre">NUEVO FUTURO</span><span class="logo__sub">FINCA HOTEL</span></span></a>' +
      '<nav class="nav nf-nav" aria-label="Principal">' + links + '</nav>' +
      '<div class="cabecera__acciones"><a class="enlace-claro nf-lnk" href="/contacto.html">Contacto</a><a class="btn nf-btn" href="/reservar.html">Reservar</a>' +
      '<button class="menu-boton" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu-movil">' + icono('menu', 22) + '</button></div>' +
      '</div></header>' +
      '<div class="menu-movil" id="menu-movil" role="dialog" aria-label="Menú"><button class="boton-icono cerrar" type="button" aria-label="Cerrar menú">' + icono('cerrar') + '</button>' +
      '<a href="/index.html">Inicio</a>' + NAV.map(function (n) { return '<a href="/' + n[0] + '.html">' + n[1] + '</a>'; }).join('') +
      '<a href="/preguntas.html">Preguntas</a><a href="/contacto.html">Contacto</a><a class="btn btn--oro" style="margin-top:24px;font-family:var(--sans);font-size:13px" href="/reservar.html">Reservar</a></div>';
  }

  function pie() {
    return '<footer class="pie"><div class="contenedor">' +
      '<div class="pie__rejilla">' +
      '<div class="col"><a class="logo" href="/index.html" aria-label="Nuevo Futuro Finca Hotel">' + LOGO + '<span class="logo__texto"><span class="logo__nombre">NUEVO FUTURO</span><span class="logo__sub">FINCA HOTEL</span></span></a>' +
      '<p style="margin-top:10px" data-cms="pie.frase">Una finca para descansar en grupo entre montañas y cafetales.</p></div>' +
      '<nav aria-label="Explora"><h3>Explora</h3><a class="nf-lnk" href="/habitaciones.html">Habitaciones</a><a class="nf-lnk" href="/planes.html">Planes y tarifas</a><a class="nf-lnk" href="/experiencias.html">Experiencias</a><a class="nf-lnk" href="/eventos.html">Eventos y pasadías</a><a class="nf-lnk" href="/galeria.html">Galería</a></nav>' +
      '<div class="col"><h3>Contacto</h3><a class="nf-lnk" href="/ubicacion.html" data-global="global.direccion"></a><a class="nf-lnk" data-wa href="/contacto.html">WhatsApp <span data-global="global.whatsapp_visible"></span></a><a class="nf-lnk" data-correo href="/contacto.html" data-global="global.correo"></a><span data-global="global.horario"></span></div>' +
      '<div class="col"><h3>La finca</h3><a class="nf-lnk" href="/preguntas.html">Preguntas frecuentes</a><a class="nf-lnk" href="/planes.html#condiciones">Condiciones y cancelación</a><a class="nf-lnk" href="/contacto.html#datos">Tratamiento de datos</a><a class="nf-lnk" data-red="global.instagram" href="#" hidden>Instagram</a><a class="nf-lnk" data-red="global.facebook" href="#" hidden>Facebook</a></div>' +
      '</div>' +
      '<div class="pie__base"><span>© ' + new Date().getFullYear() + ' Finca Hotel Nuevo Futuro · Circasia, Quindío<span data-fila> · RNT <span data-global="global.rnt"></span></span></span>' +
      '<span style="max-width:620px">Rechazamos la explotación sexual comercial de niñas, niños y adolescentes (Ley 1336 de 2009).</span></div>' +
      '</div></footer>' +
      '<a class="wa-flotante nf-halo" data-wa href="/contacto.html" aria-label="Escribir por WhatsApp">' + icono('mensaje', 26) + '</a>';
  }

  /* --- Montaje --- */
  var hueco = document.getElementById('nf-cabecera');
  if (hueco) hueco.outerHTML = cabecera();
  var huecoPie = document.getElementById('nf-pie');
  if (huecoPie) huecoPie.outerHTML = pie();
  if (!document.querySelector('.nf-progreso')) document.body.insertAdjacentHTML('afterbegin', '<div class="nf-progreso" aria-hidden="true"></div>');

  // Menú móvil
  var menu = document.getElementById('menu-movil'), botonMenu = document.querySelector('.menu-boton');
  function cerrarMenu() { if (!menu) return; menu.classList.remove('abierto'); botonMenu && botonMenu.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  if (botonMenu && menu) {
    botonMenu.addEventListener('click', function () { menu.classList.add('abierto'); botonMenu.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; var c = menu.querySelector('.cerrar'); c && c.focus(); });
    menu.querySelector('.cerrar').addEventListener('click', cerrarMenu);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });
  }

  // Bienvenida (solo Inicio, una vez por visita)
  var intro = document.querySelector('.nf-intro');
  if (intro) {
    var real = window.matchMedia('(max-height: 1699px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (real) { try { sessionStorage.setItem('nf-intro', '1'); } catch (e) {} }
    intro.addEventListener('click', function () { intro.remove(); document.documentElement.classList.add('sin-intro'); });
    setTimeout(function () { if (intro.isConnected) intro.remove(); }, 5200);
  }

  // Respaldo de animaciones de scroll
  var sinScrollCss = !(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'));
  var io = null;
  if (sinScrollCss && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('io');
    io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
  }
  function observar(raiz) { if (!io) return; (raiz || document).querySelectorAll('.nf-rv:not(.visto), .nf-revela:not(.visto)').forEach(function (el) { io.observe(el); }); }
  observar();

  /* --- Datos editables --- */
  var ajustesPromesa = window.NF.ajustes().catch(function (e) { console.warn('No se pudieron leer los ajustes', e); return {}; });

  function waUrl(aj, texto) {
    var n = String(aj['global.whatsapp'] || '').replace(/\D/g, '');
    if (!n) return '/contacto.html';
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(texto || aj['global.mensaje_whatsapp'] || 'Hola, quiero información sobre la Finca Hotel Nuevo Futuro.');
  }

  // Un dato vacío o de relleno ("Por definir") no se muestra: se oculta su fila completa ([data-fila]) o el elemento
  var RELLENO = /^\s*(por (definir|confirmar|publicar|registrar)|pendiente)\.?\s*$/i;
  function sinDato(t) { t = String(t == null ? '' : t); return !t.trim() || RELLENO.test(t); }
  function ocultar(el) { (el.closest('[data-fila]') || el).hidden = true; }
  function aplicar(aj) {
    document.querySelectorAll('[data-cms]').forEach(function (el) { var v = aj[el.getAttribute('data-cms')]; if (v != null && String(v).trim() !== '') el.innerHTML = U.formatear(v); if (sinDato(el.textContent)) ocultar(el); });
    document.querySelectorAll('[data-cms-img]').forEach(function (el) { var v = aj[el.getAttribute('data-cms-img')]; if (v) el.src = v; });
    document.querySelectorAll('[data-cms-lista]').forEach(function (el) {
      var v = aj[el.getAttribute('data-cms-lista')]; if (!v) return;
      var tpl = el.getAttribute('data-plantilla') || '<li>{t}</li>';
      el.innerHTML = U.textoListas(v).map(function (t) { return tpl.replace('{t}', U.formatear(t)); }).join('');
    });
    var wn = String(aj['global.whatsapp'] || '').replace(/\D/g, '');
    aj['global.whatsapp_visible'] = wn ? '+' + wn.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3 $4') : '';
    document.querySelectorAll('[data-global]').forEach(function (el) {
      var v = aj[el.getAttribute('data-global')];
      if (!sinDato(v)) el.textContent = v; else ocultar(el);
    });
    // Sin número de WhatsApp cargado, los botones y enlaces de WhatsApp no se muestran
    document.querySelectorAll('[data-wa]').forEach(function (a) { if (!wn) { ocultar(a); return; } a.href = waUrl(aj, a.getAttribute('data-wa-texto')); a.target = '_blank'; a.rel = 'noopener'; });
    document.querySelectorAll('[data-correo]').forEach(function (a) { if (aj['global.correo']) a.href = 'mailto:' + aj['global.correo']; });
    document.querySelectorAll('[data-tel]').forEach(function (a) { if (aj['global.telefono']) a.href = 'tel:' + String(aj['global.telefono']).replace(/[^\d+]/g, ''); });
    document.querySelectorAll('[data-red]').forEach(function (a) { var v = aj[a.getAttribute('data-red')]; if (v) { a.href = v; a.hidden = false; a.target = '_blank'; a.rel = 'noopener'; } });
    document.querySelectorAll('[data-maps]').forEach(function (a) { if (aj['global.maps_url']) { a.href = aj['global.maps_url']; a.target = '_blank'; a.rel = 'noopener'; } });
  }
  ajustesPromesa.then(aplicar);

  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 4200);
  }

  window.NFsitio = { pagina: pagina, ajustes: ajustesPromesa, waUrl: waUrl, icono: icono, observar: observar, toast: toast, aplicar: aplicar, sinDato: sinDato };
})();
