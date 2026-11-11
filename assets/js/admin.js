/* ==========================================================================
   Panel de administración · Finca Hotel Nuevo Futuro
   Reservas, calendario, solicitudes, contenido del sitio y datos generales.
   Usa window.NF (datos.js): funciona con Supabase o en modo prueba.
   ========================================================================== */
(function () {
  'use strict';
  var NF = window.NF, A = NF.admin, U = NF.util, E = U.escapar;
  var app = document.getElementById('app');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var LOGO = '<svg aria-hidden="true" viewBox="0 0 339 189"><g fill="#F2F0EA"><rect x="117" y="0" width="35" height="189"/><rect x="185" y="0" width="36" height="189"/><polygon points="152,101 152,124 185,157 185,134"/><rect x="53" y="44" width="35" height="145"/><rect x="251" y="44" width="35" height="145"/><rect x="23" y="44" width="65" height="36"/><rect x="251" y="44" width="65" height="36"/></g><g fill="#C9A54A"><rect x="0" y="0" width="88" height="35"/><rect x="250" y="0" width="89" height="35"/></g></svg>';
  var LOGO_OSCURO = LOGO.replace(/#F2F0EA/g, '#1E2B24');
  var IC = {
    resumen: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    reservas: '<rect x="5" y="4" width="14" height="17" rx="1"/><path d="M9 4V2h6v2M9 10h6M9 14h6"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    solicitudes: '<path d="M4 5h16v11H8l-4 4z"/>',
    cama: '<path d="M3 18v-6h18v6M3 12V7M21 12v-2a2 2 0 0 0-2-2h-7v4M3 18v2M21 18v2"/>',
    estrella: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    foto: '<rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
    texto: '<path d="M4 6h16M4 12h10M4 18h14"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    lista: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    prueba: '<path d="M9 3h6M10 3v6l-5 10a1 1 0 0 0 1 1.5h12a1 1 0 0 0 1-1.5l-5-10V3"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
    arriba: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    abajo: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    ojo: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    ojoNo: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.3-.5 4.6-1.2"/>',
    borrar: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    externo: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    izq: '<path d="M15 6l-6 6 6 6"/>', der: '<path d="M9 6l6 6-6 6"/>'
  };
  function ic(n, t) { return '<svg aria-hidden="true" viewBox="0 0 24 24" width="' + (t || 18) + '" height="' + (t || 18) + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (IC[n] || '') + '</svg>'; }

  var ESTADOS_RES = [['pendiente', 'Pendiente'], ['confirmada', 'Confirmada'], ['completada', 'Completada'], ['cancelada', 'Cancelada']];
  var ESTADOS_SOL = [['nueva', 'Nueva'], ['en_proceso', 'En proceso'], ['respondida', 'Respondida'], ['archivada', 'Archivada']];
  var TIPOS_SOL = { contacto: 'Mensaje de contacto', evento: 'Cotización de evento' };
  var ORDEN_COL = ['habitaciones', 'experiencias', 'planes', 'temporadas', 'eventos', 'espacios', 'instalaciones', 'normas', 'lugares', 'galeria', 'preguntas', 'opiniones'];
  var ICONO_COL = { habitaciones: 'cama', experiencias: 'estrella', galeria: 'foto', preguntas: 'solicitudes', opiniones: 'estrella' };
  var DESC_COL = {
    habitaciones: 'Aparecen en Habitaciones, en la ficha de cada una, en Reservar y (las marcadas) en el Inicio. La "Finca completa" es una habitación de tipo Finca completa: al reservarla se bloquean todas.',
    experiencias: 'Aparecen en Experiencias. Las que tienen hora forman la línea "Un día en la finca"; las marcadas salen en el Inicio.',
    planes: 'Tarjetas de la página Planes y tarifas.',
    temporadas: 'Tabla de temporadas en Planes y tarifas. Si no hay ninguna, la tabla se oculta.',
    eventos: 'Tipos de evento de la página Eventos y opciones del cotizador.',
    espacios: 'Lista de espacios en la página Eventos.',
    instalaciones: 'Mosaico de instalaciones en La finca.',
    normas: 'Normas de la casa en La finca. Si no hay ninguna, la sección se oculta.',
    lugares: 'Lugares cercanos en Ubicación.',
    galeria: 'Fotos de la Galería. La categoría define el filtro.',
    preguntas: 'Preguntas frecuentes, agrupadas por tema.',
    opiniones: 'Opiniones de huéspedes en el Inicio. Si no hay ninguna, la sección no aparece. Publica solo opiniones reales y con permiso.'
  };

  /* ---------- Utilidades ---------- */
  function opcionesDe(lista, sel) { return lista.map(function (o) { return '<option value="' + E(o[0]) + '"' + (String(o[0]) === String(sel) ? ' selected' : '') + '>' + E(o[1]) + '</option>'; }).join(''); }
  function etiqueta(lista, v) { var o = lista.filter(function (x) { return x[0] === v; })[0]; return o ? o[1] : v; }
  function estado(v, lista) { return '<span class="estado e-' + E(v || 'nueva') + '">' + E(etiqueta(lista, v)) + '</span>'; }
  function hoy() { var d = new Date(); d.setHours(0, 0, 0, 0); return U.iso(d); }
  function sumarDias(s, n) { var d = U.deIso(s); d.setDate(d.getDate() + n); return U.iso(d); }
  function telWa(t) { var n = String(t || '').replace(/\D/g, ''); if (n.length === 10 && n[0] === '3') n = '57' + n; return n; }
  function waA(t, txt) { var n = telWa(t); return n ? 'https://wa.me/' + n + '?text=' + encodeURIComponent(txt || '') : ''; }
  function fechaHora(s) { if (!s) return ''; var d = new Date(s); return isNaN(d) ? s : d.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function toast(msg, error) { var t = document.createElement('div'); t.className = 'toast' + (error ? ' toast--error' : ''); t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, error ? 6500 : 3200); }
  function mal(e) { console.error(e); toast('Error: ' + (e && (e.message || e.details) || e), true); }
  function descargar(nombre, texto, tipo) { var b = new Blob([texto], { type: tipo || 'text/plain' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }

  var cacheHabs = null, cacheAjustes = null;
  function habs(forzar) { if (!cacheHabs || forzar) cacheHabs = A.listar('habitaciones'); return cacheHabs; }
  function ajustes(forzar) { if (!cacheAjustes || forzar) cacheAjustes = NF.ajustes(); return cacheAjustes; }

  /* Ventana lateral */
  function modal(titulo, cuerpo, pie) {
    var m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = '<div class="modal__caja" role="dialog" aria-modal="true" aria-label="' + E(titulo) + '"><div class="modal__cab"><h2>' + E(titulo) + '</h2><button type="button" class="bt bt--sec bt--icono" data-cerrar aria-label="Cerrar">' + ic('cerrar') + '</button></div>' +
      '<div class="modal__cuerpo">' + cuerpo + '</div>' + (pie ? '<div class="modal__pie">' + pie + '</div>' : '') + '</div>';
    var previo = document.activeElement;
    function cerrar() { m.remove(); document.removeEventListener('keydown', tecla); document.body.style.overflow = ''; previo && previo.focus && previo.focus(); }
    function tecla(e) { if (e.key === 'Escape') cerrar(); }
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-cerrar]')) cerrar(); });
    document.addEventListener('keydown', tecla);
    document.body.appendChild(m); document.body.style.overflow = 'hidden';
    var f = $('input, select, textarea', m) || $('[data-cerrar]', m); f && f.focus();
    return { el: m, cerrar: cerrar };
  }

  /* ---------- Acceso ---------- */
  function login(msg) {
    var prueba = NF.modo === 'prueba';
    app.innerHTML = '<main class="acceso"><form id="f-login" novalidate>' +
      '<div class="marca">' + LOGO_OSCURO + '</div><h1>Panel de la finca</h1>' +
      (prueba ? '<p class="aviso aviso--prueba"><b>Modo prueba.</b> La base de datos aún no está conectada. Entra con la clave <b>nuevofuturo</b>. Los cambios se guardan solo en este navegador.</p>' : '<p class="suave">Entra con el correo y la clave de administrador.</p>') +
      (msg ? '<p class="aviso aviso--error">' + E(msg) + '</p>' : '') +
      '<label class="campo"' + (prueba ? ' hidden' : '') + '>Correo<input type="email" name="correo" autocomplete="username"' + (prueba ? '' : ' required') + '></label>' +
      '<label class="campo">Clave<input type="password" name="clave" autocomplete="current-password" required></label>' +
      '<button class="bt bt--oro" type="submit" style="min-height:46px">Entrar</button>' +
      '<a href="/index.html" class="suave" style="text-align:center">← Volver al sitio</a></form></main>';
    var f = $('#f-login');
    (prueba ? f.clave : f.correo).focus();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var b = $('button', f); b.disabled = true; b.textContent = 'Entrando…';
      A.entrar(f.correo.value.trim(), f.clave.value).then(arrancar).catch(function (err) { login(err.message); });
    });
  }
  function noAdmin(s) {
    app.innerHTML = '<main class="acceso"><div style="width:min(560px,100%);background:var(--papel);padding:36px;display:flex;flex-direction:column;gap:16px">' +
      '<h1 style="font:500 32px var(--serif)">Tu usuario no es administrador</h1>' +
      '<p>Entraste como <b>' + E(s.correo) + '</b>, pero ese usuario no está en la lista de administradores.</p>' +
      '<p class="suave">Para darle acceso, abre Supabase → SQL Editor y ejecuta:</p>' +
      '<pre style="background:#fff;border:1px solid var(--linea);padding:12px;white-space:pre-wrap;font-size:13px">insert into public.admins (user_id) values (\'' + E(s.id) + '\');</pre>' +
      '<div class="fila-bt"><button class="bt" id="reintentar">Ya lo hice, reintentar</button><button class="bt bt--sec" id="salir">Salir</button></div></div></main>';
    $('#reintentar').onclick = arrancar;
    $('#salir').onclick = function () { A.salir().then(function () { login(); }); };
  }
  function arrancar() {
    A.sesion().then(function (s) {
      if (!s) return login();
      return A.esAdmin().then(function (ok) { if (ok) montar(s); else noAdmin(s); });
    }).catch(function (e) { console.error(e); login('No se pudo verificar la sesión: ' + e.message); });
  }

  /* ---------- Estructura ---------- */
  var RUTAS = {};
  function montar(s) {
    var col = ORDEN_COL.map(function (t) { return '<a href="#/c/' + t + '" data-ruta="c/' + t + '">' + ic(ICONO_COL[t] || 'lista') + E(NF.ESQUEMAS[t].titulo) + '</a>'; }).join('');
    app.innerHTML = '<div class="barra-movil"><button type="button" id="abrir-menu" aria-label="Abrir menú">' + ic('menu', 22) + ' Menú</button><span style="font-size:12px;letter-spacing:.24em">NUEVO FUTURO</span></div>' +
      '<div class="panel"><aside class="lateral" id="lateral"><a class="lateral__marca" href="#/resumen">' + LOGO + '<span><b>NUEVO FUTURO</b><small>PANEL</small></span></a><nav aria-label="Secciones del panel">' +
      '<h4>Operación</h4><a href="#/resumen" data-ruta="resumen">' + ic('resumen') + 'Resumen</a><a href="#/reservas" data-ruta="reservas">' + ic('reservas') + 'Reservas<span class="num" id="n-res" hidden></span></a>' +
      '<a href="#/calendario" data-ruta="calendario">' + ic('calendario') + 'Calendario</a><a href="#/solicitudes" data-ruta="solicitudes">' + ic('solicitudes') + 'Solicitudes<span class="num" id="n-sol" hidden></span></a>' +
      '<h4>Contenido del sitio</h4>' + col +
      '<h4>Páginas y datos</h4><a href="#/textos" data-ruta="textos">' + ic('texto') + 'Textos y fotos de páginas</a><a href="#/datos" data-ruta="datos">' + ic('ajustes') + 'Datos generales</a><a href="#/ayuda" data-ruta="ayuda">' + ic(NF.modo === 'prueba' ? 'prueba' : 'lista') + (NF.modo === 'prueba' ? 'Modo prueba y ayuda' : 'Ayuda') + '</a>' +
      '</nav><div class="lateral__pie"><span>' + E(s.correo) + '</span><a href="/index.html" target="_blank" rel="noopener">Ver el sitio ↗</a><button type="button" id="salir">Salir</button></div></aside>' +
      '<main class="contenido" id="vista" tabindex="-1"></main></div>';
    $('#salir').onclick = function () { A.salir().then(function () { location.hash = ''; login(); }); };
    var lat = $('#lateral');
    $('#abrir-menu').onclick = function () { lat.classList.add('abierta'); };
    lat.addEventListener('click', function (e) { if (e.target.closest('a')) lat.classList.remove('abierta'); });
    document.addEventListener('click', function (e) { if (lat.classList.contains('abierta') && !lat.contains(e.target) && !e.target.closest('#abrir-menu')) lat.classList.remove('abierta'); });
    window.onhashchange = ruta;
    ruta(); conteos();
  }
  function ruta() {
    var r = (location.hash.replace(/^#\/?/, '').split('?')[0] || 'resumen');
    $$('#lateral nav a').forEach(function (a) { if (a.getAttribute('data-ruta') === r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var v = $('#vista'); v.onclick = null; v.innerHTML = '<p class="cargando">Cargando…</p>';
    var fn = r.indexOf('c/') === 0 ? function () { vistaColeccion(r.slice(2)); } : RUTAS[r];
    if (!fn || (r.indexOf('c/') === 0 && !NF.ESQUEMAS[r.slice(2)])) { location.hash = '#/resumen'; return; }
    window.scrollTo(0, 0);
    try { fn(); } catch (e) { mal(e); }
  }
  function conteos() {
    A.reservas().then(function (l) { var n = l.filter(function (r) { return r.estado === 'pendiente'; }).length, el = $('#n-res'); if (el) { el.textContent = n; el.hidden = !n; } }).catch(function () {});
    A.solicitudes().then(function (l) { var n = l.filter(function (r) { return (r.estado || 'nueva') === 'nueva'; }).length, el = $('#n-sol'); if (el) { el.textContent = n; el.hidden = !n; } }).catch(function () {});
  }
  function cabeza(titulo, texto, acciones) {
    return '<div class="cabeza"><div><h1>' + E(titulo) + '</h1>' + (texto ? '<p>' + texto + '</p>' : '') + '</div>' + (acciones ? '<div class="fila-bt">' + acciones + '</div>' : '') + '</div>';
  }
  var AVISO_PRUEBA = NF.modo === 'prueba' ? '<p class="aviso aviso--prueba"><b>Modo prueba:</b> los cambios y las reservas se guardan solo en este navegador; los visitantes no los ven. Para trabajar en serio, conecta Supabase (ver <a href="#/ayuda">Modo prueba y ayuda</a>).</p>' : '';

  /* ---------- Resumen ---------- */
  RUTAS.resumen = function () {
    Promise.all([A.reservas(), A.solicitudes()]).then(function (r) {
      var res = r[0], sol = r[1], h = hoy(), en7 = sumarDias(h, 7);
      var activas = res.filter(function (x) { return x.estado === 'pendiente' || x.estado === 'confirmada'; });
      var pend = res.filter(function (x) { return x.estado === 'pendiente'; });
      var llegan = activas.filter(function (x) { return x.llegada >= h && x.llegada <= en7; });
      var dentro = activas.filter(function (x) { return x.llegada <= h && x.salida > h; });
      var nuevas = sol.filter(function (x) { return (x.estado || 'nueva') === 'nueva'; });
      var prox = activas.filter(function (x) { return x.salida >= h; }).slice(0, 8);
      $('#vista').innerHTML = cabeza('Resumen', 'Esto es lo que pasa en la finca hoy, ' + new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) + '.', '<a class="bt" href="#/reservas?nueva">' + ic('mas') + 'Nueva reserva</a>') + AVISO_PRUEBA +
        '<div class="cuadros"><a class="cuadro" href="#/reservas"><b>' + pend.length + '</b><span>Reservas por confirmar</span></a><a class="cuadro" href="#/calendario"><b>' + llegan.length + '</b><span>Llegadas en los próximos 7 días</span></a>' +
        '<a class="cuadro" href="#/calendario"><b>' + dentro.reduce(function (s, x) { return s + (Number(x.adultos) || 0) + (Number(x.ninos) || 0); }, 0) + '</b><span>Huéspedes en la finca hoy</span></a><a class="cuadro" href="#/solicitudes"><b>' + nuevas.length + '</b><span>Solicitudes sin responder</span></a></div>' +
        '<section class="caja"><h2>Próximas estadías</h2>' + (prox.length ? tablaReservas(prox) : '<p class="vacio">No hay estadías próximas.</p>') + '</section>' +
        (nuevas.length ? '<section class="caja"><h2>Solicitudes nuevas</h2><div class="tarjetas">' + nuevas.slice(0, 4).map(tarjetaSolicitud).join('') + '</div></section>' : '');
      enlazarTablaReservas(res);
      enlazarSolicitudes();
    }).catch(mal);
  };

  /* ---------- Reservas ---------- */
  function tablaReservas(lista) {
    return '<div class="tabla-env"><table class="tabla"><thead><tr><th>Código</th><th>Huésped</th><th>Habitación</th><th>Llegada</th><th>Salida</th><th>Personas</th><th>Total</th><th>Abonado</th><th>Estado</th></tr></thead><tbody>' +
      lista.map(function (r) {
        return '<tr data-id="' + E(r.id) + '" tabindex="0"><td class="cod">' + E(r.codigo || '') + '</td><td><b>' + E(r.nombre || '—') + '</b><br><span class="suave">' + E(r.telefono || '') + '</span></td><td>' + E(r.habitacion_nombre || '') + '</td>' +
          '<td>' + U.fechaCorta(r.llegada) + '</td><td>' + U.fechaCorta(r.salida) + '</td><td>' + ((Number(r.adultos) || 0) + (Number(r.ninos) || 0)) + (r.mascota ? ' 🐾' : '') + '</td>' +
          '<td>' + (Number(r.total) ? U.pesos(r.total) : '—') + '</td><td>' + (Number(r.anticipo_pagado) ? U.pesos(r.anticipo_pagado) : '—') + '</td><td>' + estado(r.estado, ESTADOS_RES) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function enlazarTablaReservas(lista) {
    $$('#vista .tabla tbody tr[data-id]').forEach(function (tr) {
      function abrir() { var r = lista.filter(function (x) { return x.id === tr.getAttribute('data-id'); })[0]; if (r) editarReserva(r); }
      tr.addEventListener('click', abrir);
      tr.addEventListener('keydown', function (e) { if (e.key === 'Enter') abrir(); });
    });
  }
  RUTAS.reservas = function () {
    var nueva = /nueva/.test(location.hash);
    var filtro = { estado: 'activas', cuando: 'proximas', q: '' };
    A.reservas().then(function (todas) {
      $('#vista').innerHTML = cabeza('Reservas', 'Las reservas de la web llegan como <b>pendientes</b>. Confírmalas cuando recibas el anticipo.', '<button class="bt bt--sec" id="csv">Descargar Excel (CSV)</button><button class="bt" id="nueva">' + ic('mas') + 'Nueva reserva</button>') + AVISO_PRUEBA +
        '<div class="filtros"><div class="pestanas" id="f-estado">' + [['activas', 'Activas'], ['pendiente', 'Pendientes'], ['confirmada', 'Confirmadas'], ['completada', 'Completadas'], ['cancelada', 'Canceladas'], ['todas', 'Todas']].map(function (o) { return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === filtro.estado) + '">' + o[1] + '</button>'; }).join('') + '</div>' +
        '<select id="f-cuando" aria-label="Fechas"><option value="proximas">Próximas y en curso</option><option value="pasadas">Pasadas</option><option value="todas">Todas las fechas</option></select>' +
        '<input type="search" id="f-q" placeholder="Buscar por nombre, teléfono o código" aria-label="Buscar"></div><div id="lista-res"></div>';
      function filtradas() {
        var h = hoy(), q = filtro.q.toLowerCase();
        return todas.filter(function (r) {
          if (filtro.estado === 'activas' && !(r.estado === 'pendiente' || r.estado === 'confirmada')) return false;
          if (filtro.estado !== 'activas' && filtro.estado !== 'todas' && r.estado !== filtro.estado) return false;
          if (filtro.cuando === 'proximas' && r.salida < h) return false;
          if (filtro.cuando === 'pasadas' && r.salida >= h) return false;
          if (q && [r.nombre, r.telefono, r.codigo, r.correo, r.habitacion_nombre].join(' ').toLowerCase().indexOf(q) === -1) return false;
          return true;
        });
      }
      function pintar() {
        var l = filtradas();
        if (filtro.cuando === 'pasadas') l = l.slice().reverse();
        $('#lista-res').innerHTML = l.length ? tablaReservas(l) : '<p class="vacio">No hay reservas con estos filtros.</p>';
        enlazarTablaReservas(todas);
      }
      $('#f-estado').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; filtro.estado = b.getAttribute('data-v'); $$('#f-estado button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); pintar(); });
      $('#f-cuando').onchange = function () { filtro.cuando = this.value; pintar(); };
      $('#f-q').oninput = function () { filtro.q = this.value; pintar(); };
      $('#nueva').onclick = function () { editarReserva(null); };
      $('#csv').onclick = function () {
        var cols = ['codigo', 'estado', 'nombre', 'telefono', 'correo', 'ciudad', 'habitacion_nombre', 'llegada', 'salida', 'adultos', 'ninos', 'mascota', 'desayuno', 'total', 'anticipo_pagado', 'hora_llegada', 'comentarios', 'notas', 'origen', 'creado'];
        var csv = '﻿' + cols.join(';') + '\n' + filtradas().map(function (r) { return cols.map(function (c) { var v = r[c]; v = v == null ? '' : String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';'); }).join('\n');
        descargar('reservas-nuevo-futuro-' + hoy() + '.csv', csv, 'text/csv;charset=utf-8');
      };
      pintar();
      if (nueva) { history.replaceState(null, '', '#/reservas'); editarReserva(null); }
    }).catch(mal);
  };

  var CAMPOS_RES = ['id', 'codigo', 'creado', 'estado', 'habitacion_id', 'habitacion_nombre', 'llegada', 'salida', 'adultos', 'ninos', 'mascota', 'desayuno', 'nombre', 'telefono', 'correo', 'ciudad', 'hora_llegada', 'comentarios', 'total', 'anticipo_pagado', 'notas', 'origen'];
  function conflictos(r, reservas, bloqueos, listaHabs) {
    var fincas = listaHabs.filter(function (h) { return h.tipo === 'finca'; }).map(function (h) { return h.id; });
    var esFinca = fincas.indexOf(r.habitacion_id) !== -1;
    function choca(id) { return esFinca || !id || id === r.habitacion_id || fincas.indexOf(id) !== -1; }
    var c = reservas.filter(function (x) { return x.id !== r.id && (x.estado === 'pendiente' || x.estado === 'confirmada') && x.llegada < r.salida && x.salida > r.llegada && choca(x.habitacion_id); })
      .map(function (x) { return 'Reserva ' + x.codigo + ' (' + (x.nombre || '') + ', ' + x.habitacion_nombre + ', ' + U.fechaCorta(x.llegada) + ' → ' + U.fechaCorta(x.salida) + ')'; });
    bloqueos.filter(function (b) { return b.desde < r.salida && b.hasta > r.llegada && (esFinca || !b.habitacion_id || b.habitacion_id === r.habitacion_id || fincas.indexOf(b.habitacion_id) !== -1); })
      .forEach(function (b) { c.push('Fechas bloqueadas' + (b.motivo ? ' (' + b.motivo + ')' : '') + ': ' + U.fechaCorta(b.desde) + ' → ' + U.fechaCorta(sumarDias(b.hasta, -1))); });
    return c;
  }
  function editarReserva(r) {
    var nueva = !r;
    r = Object.assign({ estado: 'confirmada', adultos: 2, ninos: 0, origen: 'manual' }, r || {});
    Promise.all([habs(), ajustes()]).then(function (x) {
      var lh = x[0], aj = x[1];
      var opH = [['', 'Elige…']].concat(lh.map(function (h) { return [h.id, h.nombre + (h.activo === false ? ' (oculta)' : '')]; }));
      if (r.habitacion_id && !lh.some(function (h) { return h.id === r.habitacion_id; })) opH.push([r.habitacion_id, (r.habitacion_nombre || 'Habitación') + ' (borrada)']);
      var cuerpo = (nueva ? '' : '<p class="suave">Código <b class="cod">' + E(r.codigo) + '</b> · creada ' + E(fechaHora(r.creado)) + ' · origen: ' + E(r.origen || 'web') + '</p>') +
        '<form class="form" id="f-res" novalidate>' +
        '<label class="campo">Estado<select name="estado">' + opcionesDe(ESTADOS_RES, r.estado) + '</select></label>' +
        '<label class="campo">Habitación<select name="habitacion_id" required>' + opcionesDe(opH, r.habitacion_id || '') + '</select></label>' +
        '<label class="campo">Llegada<input type="date" name="llegada" value="' + E(r.llegada || '') + '" required></label>' +
        '<label class="campo">Salida<input type="date" name="salida" value="' + E(r.salida || '') + '" required></label>' +
        '<label class="campo">Adultos<input type="number" name="adultos" min="1" max="60" value="' + E(r.adultos) + '"></label>' +
        '<label class="campo">Niños<input type="number" name="ninos" min="0" max="40" value="' + E(r.ninos || 0) + '"></label>' +
        '<label class="check"><input type="checkbox" name="mascota"' + (r.mascota ? ' checked' : '') + '> Viene con mascota</label>' +
        '<label class="check"><input type="checkbox" name="desayuno"' + (r.desayuno ? ' checked' : '') + '> Con desayuno</label>' +
        '<label class="campo">Nombre del huésped<input name="nombre" value="' + E(r.nombre || '') + '" required></label>' +
        '<label class="campo">Celular / WhatsApp<input type="tel" name="telefono" value="' + E(r.telefono || '') + '"></label>' +
        '<label class="campo">Correo<input type="email" name="correo" value="' + E(r.correo || '') + '"></label>' +
        '<label class="campo">Ciudad<input name="ciudad" value="' + E(r.ciudad || '') + '"></label>' +
        '<label class="campo">Hora de llegada<input name="hora_llegada" value="' + E(r.hora_llegada || '') + '"></label>' +
        '<label class="campo">Total (pesos)<span style="display:flex;gap:6px"><input type="number" name="total" min="0" step="1000" value="' + E(r.total || '') + '"><button type="button" class="bt bt--sec bt--mini" id="calc">Calcular</button></span></label>' +
        '<label class="campo">Anticipo recibido (pesos)<input type="number" name="anticipo_pagado" min="0" step="1000" value="' + E(r.anticipo_pagado || '') + '"></label>' +
        '<label class="campo campo--ancho">Comentarios del huésped<textarea name="comentarios">' + E(r.comentarios || '') + '</textarea></label>' +
        '<label class="campo campo--ancho">Notas internas (solo las ve el equipo)<textarea name="notas">' + E(r.notas || '') + '</textarea></label>' +
        '</form><div id="res-aviso"></div>';
      var pie = '<div class="fila-bt">' + (nueva ? '' : '<button type="button" class="bt bt--peligro" id="borrar">' + ic('borrar') + 'Borrar</button>') + '<a class="bt bt--sec" id="wa" target="_blank" rel="noopener" hidden>WhatsApp al huésped</a></div>' +
        '<div class="fila-bt"><button type="button" class="bt bt--sec" data-cerrar>Cancelar</button><button type="button" class="bt" id="guardar">Guardar</button></div>';
      var m = modal(nueva ? 'Nueva reserva' : 'Reserva de ' + (r.nombre || ''), cuerpo, pie), f = $('#f-res', m.el);
      function datos() {
        var d = Object.assign({}, r);
        ['estado', 'habitacion_id', 'llegada', 'salida', 'nombre', 'telefono', 'correo', 'ciudad', 'hora_llegada', 'comentarios', 'notas'].forEach(function (k) { d[k] = f[k].value.trim(); });
        d.adultos = Number(f.adultos.value) || 1; d.ninos = Number(f.ninos.value) || 0; d.mascota = f.mascota.checked; d.desayuno = f.desayuno.checked;
        d.total = Number(f.total.value) || 0; d.anticipo_pagado = Number(f.anticipo_pagado.value) || 0;
        var h = lh.filter(function (x) { return x.id === d.habitacion_id; })[0]; if (h) d.habitacion_nombre = h.nombre;
        return d;
      }
      function waLink() {
        var d = datos(), a = $('#wa', m.el), url = waA(d.telefono, 'Hola ' + (d.nombre || '').split(' ')[0] + ', te escribimos de Finca Hotel Nuevo Futuro sobre tu reserva ' + (d.codigo || '') + ' (' + U.fechaCorta(d.llegada) + ' → ' + U.fechaCorta(d.salida) + ').');
        if (url) { a.href = url; a.hidden = false; } else a.hidden = true;
      }
      f.addEventListener('input', waLink); waLink();
      $('#calc', m.el).onclick = function () {
        var d = datos(), h = lh.filter(function (x) { return x.id === d.habitacion_id; })[0];
        if (!h || !d.llegada || !d.salida || d.salida <= d.llegada) return toast('Elige habitación y fechas válidas primero.', true);
        if (!Number(h.precio)) return toast('Esa habitación no tiene precio cargado.', true);
        f.total.value = U.calcularTotal(h, U.noches(d.llegada, d.salida), d.adultos + d.ninos, d.desayuno, aj['global.precio_desayuno']);
      };
      $('#guardar', m.el).onclick = function () {
        if (!f.checkValidity()) { f.reportValidity(); return; }
        var d = datos();
        if (d.salida <= d.llegada) return toast('La salida debe ser después de la llegada.', true);
        var b = this; b.disabled = true;
        Promise.all([A.reservas(), A.bloqueos()]).then(function (y) {
          var c = (d.estado === 'pendiente' || d.estado === 'confirmada') ? conflictos(d, y[0], y[1], lh) : [];
          if (c.length && !confirm('Atención: estas fechas se cruzan con:\n\n• ' + c.join('\n• ') + '\n\n¿Guardar de todas formas?')) { b.disabled = false; return; }
          var limpio = {}; CAMPOS_RES.forEach(function (k) { if (d[k] !== undefined) limpio[k] = d[k]; });
          return A.guardarReserva(limpio).then(function () { toast('Reserva guardada'); m.cerrar(); conteos(); ruta(); });
        }).catch(function (e) {
          b.disabled = false;
          if (/reservas_sin_cruce|conflicting key|exclusion/i.test(e.message || '')) toast('Esa habitación ya está ocupada en esas fechas.', true); else mal(e);
        });
      };
      var bb = $('#borrar', m.el);
      if (bb) bb.onclick = function () {
        if (!confirm('¿Borrar definitivamente la reserva ' + r.codigo + '? Si solo se cayó, mejor cámbiala a "Cancelada" para conservar el historial.')) return;
        A.borrarReserva(r.id).then(function () { toast('Reserva borrada'); m.cerrar(); conteos(); ruta(); }).catch(mal);
      };
    }).catch(mal);
  }

  /* ---------- Calendario ---------- */
  var mesCal = null;
  RUTAS.calendario = function () {
    if (!mesCal) { mesCal = new Date(); mesCal.setDate(1); mesCal.setHours(0, 0, 0, 0); }
    Promise.all([habs(true), A.reservas(), A.bloqueos()]).then(function (x) {
      var lh = x[0], res = x[1].filter(function (r) { return r.estado === 'pendiente' || r.estado === 'confirmada'; }), bl = x[2];
      var y = mesCal.getFullYear(), m = mesCal.getMonth(), dias = new Date(y, m + 1, 0).getDate(), h = hoy();
      var fechas = []; for (var d = 1; d <= dias; d++) fechas.push(U.iso(new Date(y, m, d)));
      var cab = fechas.map(function (f) { var dd = U.deIso(f), w = dd.getDay(); return '<th class="' + (w === 0 || w === 6 ? 'finde ' : '') + (f === h ? 'hoy' : '') + '"><span style="display:block;font-size:9.5px;font-weight:500">' + 'DLMMJVS'[w] + '</span>' + dd.getDate() + '</th>'; }).join('');
      function fila(hab) {
        return '<tr><th>' + E(hab.nombre) + (hab.activo === false ? ' <span class="suave">(oculta)</span>' : '') + '</th>' + fechas.map(function (f) {
          var r = res.filter(function (x) { return x.habitacion_id === hab.id && x.llegada <= f && x.salida > f; })[0];
          if (r) return '<td class="o-' + r.estado + '"><button type="button" data-res="' + E(r.id) + '" title="' + E(r.codigo + ' · ' + (r.nombre || '') + ' · ' + etiqueta(ESTADOS_RES, r.estado)) + '">' + E((r.nombre || '').slice(0, 1)) + '</button></td>';
          var b = bl.filter(function (x) { return (!x.habitacion_id || x.habitacion_id === hab.id) && x.desde <= f && x.hasta > f; })[0];
          if (b) return '<td class="o-bloqueo"><button type="button" data-bl="' + E(b.id) + '" title="' + E('Bloqueado' + (b.motivo ? ': ' + b.motivo : '')) + '">·</button></td>';
          return '<td class="o-libre"></td>';
        }).join('') + '</tr>';
      }
      var opH = [['', 'Toda la finca']].concat(lh.map(function (hh) { return [hh.id, hh.nombre]; }));
      $('#vista').innerHTML = cabeza('Calendario de ocupación', 'Cada fila es una habitación y cada columna una noche. Haz clic en una reserva para abrirla.', '<button class="bt" id="nueva">' + ic('mas') + 'Nueva reserva</button>') + AVISO_PRUEBA +
        '<div class="filtros" style="justify-content:space-between"><div class="fila-bt"><button class="bt bt--sec bt--icono" id="ant" aria-label="Mes anterior">' + ic('izq') + '</button><b style="font:500 26px var(--serif);min-width:200px;text-align:center">' + (function (t) { return t.charAt(0).toUpperCase() + t.slice(1); })(mesCal.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })) + '</b><button class="bt bt--sec bt--icono" id="sig" aria-label="Mes siguiente">' + ic('der') + '</button><button class="bt bt--sec bt--mini" id="hoy">Hoy</button></div>' +
        '<div class="leyenda"><span><i style="background:#8DB89D"></i>Confirmada</span><span><i style="background:#F0D9A6"></i>Pendiente</span><span><i style="background:repeating-linear-gradient(135deg,#B9B3A6 0 4px,#D3CEC3 4px 8px)"></i>Bloqueada</span></div></div>' +
        (lh.length ? '<div class="ocupacion"><table><thead><tr><th style="text-align:left;padding-left:12px">Habitación</th>' + cab + '</tr></thead><tbody>' + lh.map(fila).join('') + '</tbody></table></div>' : '<p class="vacio">Primero crea las habitaciones en <a href="#/c/habitaciones">Habitaciones</a>.</p>') +
        '<p class="suave">Si alguien reserva la <b>Finca completa</b>, la web no deja reservar ninguna otra habitación en esas noches (y al revés).</p>' +
        '<section class="caja"><h2>Bloquear fechas</h2><p class="suave" style="margin-bottom:14px">Para mantenimiento, uso de la familia o reservas hechas por fuera. Las fechas bloqueadas no se pueden reservar desde la web.</p>' +
        '<form class="form" id="f-bl"><label class="campo">Qué se bloquea<select name="habitacion_id">' + opcionesDe(opH, '') + '</select></label><label class="campo">Desde (primera noche)<input type="date" name="desde" required></label><label class="campo">Hasta (última noche)<input type="date" name="hasta" required></label><label class="campo">Motivo (opcional)<input name="motivo" placeholder="Ej.: mantenimiento"></label><div class="campo--ancho"><button class="bt" type="submit">Bloquear</button></div></form>' +
        (bl.length ? '<div class="items" style="margin-top:18px">' + bl.slice().sort(function (a, b) { return a.desde < b.desde ? -1 : 1; }).map(function (b) {
          var hn = b.habitacion_id ? ((lh.filter(function (hh) { return hh.id === b.habitacion_id; })[0] || {}).nombre || 'Habitación borrada') : 'Toda la finca';
          return '<div class="item"><div class="item__txt"><b>' + E(hn) + ' · ' + U.fechaCorta(b.desde) + ' → ' + U.fechaCorta(sumarDias(b.hasta, -1)) + '</b><span>' + E(b.motivo || 'Sin motivo') + '</span></div><div class="fila-bt"><button class="bt bt--peligro bt--mini" data-quitar="' + E(b.id) + '">Quitar bloqueo</button></div></div>';
        }).join('') + '</div>' : '') + '</section>';
      $('#ant').onclick = function () { mesCal.setMonth(mesCal.getMonth() - 1); RUTAS.calendario(); };
      $('#sig').onclick = function () { mesCal.setMonth(mesCal.getMonth() + 1); RUTAS.calendario(); };
      $('#hoy').onclick = function () { mesCal = null; RUTAS.calendario(); };
      $('#nueva').onclick = function () { editarReserva(null); };
      $('#vista').onclick = function (e) {
        var b = e.target.closest('[data-res]'); if (b) { var r = x[1].filter(function (z) { return z.id === b.getAttribute('data-res'); })[0]; if (r) editarReserva(r); return; }
        var q = e.target.closest('[data-quitar], [data-bl]');
        if (q) { var id = q.getAttribute('data-quitar') || q.getAttribute('data-bl'); if (confirm('¿Quitar este bloqueo de fechas?')) A.borrarBloqueo(id).then(function () { toast('Bloqueo quitado'); RUTAS.calendario(); }).catch(mal); }
      };
      $('#f-bl').addEventListener('submit', function (e) {
        e.preventDefault(); var f = this;
        if (!f.checkValidity()) { f.reportValidity(); return; }
        if (f.hasta.value < f.desde.value) return toast('La última noche no puede ser antes de la primera.', true);
        A.guardarBloqueo({ habitacion_id: f.habitacion_id.value || null, desde: f.desde.value, hasta: sumarDias(f.hasta.value, 1), motivo: f.motivo.value.trim() })
          .then(function () { toast('Fechas bloqueadas'); RUTAS.calendario(); }).catch(mal);
      });
    }).catch(mal);
  };

  /* ---------- Solicitudes ---------- */
  function tarjetaSolicitud(s) {
    var wa = waA(s.telefono, 'Hola ' + (s.nombre || '').split(' ')[0] + ', te escribimos de Finca Hotel Nuevo Futuro por tu ' + (s.tipo === 'evento' ? 'cotización de evento' : 'mensaje') + '.');
    return '<article class="sol" data-id="' + E(s.id) + '"><div class="sol__cab"><div><b>' + E(s.nombre || 'Sin nombre') + '</b><div class="suave">' + E(TIPOS_SOL[s.tipo] || s.tipo || '') + ' · ' + E(fechaHora(s.creado)) + '</div></div>' + estado(s.estado || 'nueva', ESTADOS_SOL) + '</div>' +
      '<dl>' + (s.asunto ? '<dt>' + (s.tipo === 'evento' ? 'Evento' : 'Asunto') + '</dt><dd>' + E(s.asunto) + '</dd>' : '') + (s.fecha ? '<dt>Fecha</dt><dd>' + U.fechaCorta(s.fecha) + '</dd>' : '') + (s.personas ? '<dt>Personas</dt><dd>' + E(s.personas) + '</dd>' : '') +
      (s.telefono ? '<dt>Celular</dt><dd>' + E(s.telefono) + '</dd>' : '') + (s.correo ? '<dt>Correo</dt><dd><a href="mailto:' + E(s.correo) + '">' + E(s.correo) + '</a></dd>' : '') + '</dl>' +
      (s.mensaje ? '<p>' + E(s.mensaje) + '</p>' : '') +
      '<div class="fila-bt" style="justify-content:space-between"><select data-estado aria-label="Estado de la solicitud" style="min-height:34px;border:1px solid rgba(30,43,36,.25);padding:0 8px">' + opcionesDe(ESTADOS_SOL, s.estado || 'nueva') + '</select>' +
      (wa ? '<a class="bt bt--mini" href="' + E(wa) + '" target="_blank" rel="noopener">Responder por WhatsApp</a>' : '') + '</div></article>';
  }
  function enlazarSolicitudes() {
    $$('#vista .sol [data-estado]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var id = sel.closest('.sol').getAttribute('data-id');
        A.estadoSolicitud(id, sel.value).then(function () { toast('Estado actualizado'); conteos(); var e = $('.estado', sel.closest('.sol')); e.outerHTML = estado(sel.value, ESTADOS_SOL); }).catch(mal);
      });
    });
  }
  RUTAS.solicitudes = function () {
    var filtro = 'abiertas';
    A.solicitudes().then(function (todas) {
      $('#vista').innerHTML = cabeza('Solicitudes', 'Mensajes del formulario de contacto y cotizaciones de eventos. Cambia el estado a medida que respondes.') + AVISO_PRUEBA +
        '<div class="pestanas" id="f-sol">' + [['abiertas', 'Por atender'], ['nueva', 'Nuevas'], ['en_proceso', 'En proceso'], ['respondida', 'Respondidas'], ['archivada', 'Archivadas'], ['todas', 'Todas']].map(function (o) { return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === filtro) + '">' + o[1] + '</button>'; }).join('') + '</div><div id="lista-sol"></div>';
      function pintar() {
        var l = todas.filter(function (s) { var e = s.estado || 'nueva'; return filtro === 'todas' || (filtro === 'abiertas' ? (e === 'nueva' || e === 'en_proceso') : e === filtro); });
        $('#lista-sol').innerHTML = l.length ? '<div class="tarjetas">' + l.map(tarjetaSolicitud).join('') + '</div>' : '<p class="vacio">No hay solicitudes aquí.</p>';
        enlazarSolicitudes();
      }
      $('#f-sol').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; filtro = b.getAttribute('data-v'); $$('#f-sol button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); pintar(); });
      pintar();
    }).catch(mal);
  };

  /* ---------- Colecciones (contenido del sitio) ---------- */
  function tituloItem(tipo, it) { var c = NF.ESQUEMAS[tipo].campos.filter(function (x) { return x.req; })[0] || NF.ESQUEMAS[tipo].campos[0]; return it[c.k] || '(sin título)'; }
  function subtituloItem(tipo, it) {
    var esq = NF.ESQUEMAS[tipo];
    function op(k) { var c = esq.campos.filter(function (x) { return x.k === k; })[0]; return c && c.op ? etiqueta(c.op, it[k]) : it[k]; }
    switch (tipo) {
      case 'habitaciones': return [it.grupo, op('tipo'), it.capacidad ? it.capacidad + ' personas' : '', Number(it.precio) ? U.pesos(it.precio) + (it.modo_precio === 'persona' ? ' / persona' : ' / noche') : 'Sin precio', it.destacada ? '★ En el Inicio' : ''].filter(Boolean).join(' · ');
      case 'experiencias': return [it.hora, it.destacada ? '★ En el Inicio' : ''].filter(Boolean).join(' · ') || String(it.descripcion || '').slice(0, 90);
      case 'planes': return (Number(it.precio) ? U.pesos(it.precio) : 'Sin precio') + ' ' + (it.unidad || '');
      case 'temporadas': return it.fechas || '';
      case 'galeria': return op('categoria') || '';
      case 'preguntas': return op('tema') || '';
      case 'lugares': return [it.distancia, it.descripcion].filter(Boolean).join(' · ');
      case 'opiniones': return [it.ciudad, it.fecha].filter(Boolean).join(' · ');
      default: var k = esq.campos[1] && esq.campos[1].k; return k ? String(it[k] || '').slice(0, 100) : '';
    }
  }
  function fotoItem(it) { return it.foto || U.textoListas(it.fotos)[0] || ''; }

  function vistaColeccion(tipo) {
    var esq = NF.ESQUEMAS[tipo];
    A.listar(tipo).then(function (lista) {
      var conFoto = esq.campos.some(function (c) { return c.t === 'foto' || c.t === 'fotos'; });
      $('#vista').innerHTML = cabeza(esq.titulo, E(DESC_COL[tipo] || ''), '<button class="bt" id="agregar">' + ic('mas') + 'Agregar ' + E(esq.singular) + '</button>') + AVISO_PRUEBA +
        (lista.length ? '<div class="items" id="items">' + lista.map(function (it, i) {
          var f = fotoItem(it);
          return '<div class="item' + (it.activo ? '' : ' inactivo') + '" data-id="' + E(it.id) + '">' + (conFoto ? (f ? '<img class="item__foto" src="' + E(f) + '" alt="">' : '<span class="item__foto">Sin foto</span>') : '') +
            '<div class="item__txt"><b>' + E(tituloItem(tipo, it)) + (it.activo ? '' : ' · oculto') + '</b><span>' + E(subtituloItem(tipo, it)) + '</span></div>' +
            '<div class="fila-bt"><button class="bt bt--sec bt--icono" data-acc="subir" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>' + ic('arriba', 16) + '</button><button class="bt bt--sec bt--icono" data-acc="bajar" aria-label="Bajar"' + (i === lista.length - 1 ? ' disabled' : '') + '>' + ic('abajo', 16) + '</button>' +
            '<button class="bt bt--sec bt--icono" data-acc="ver" aria-label="' + (it.activo ? 'Ocultar del sitio' : 'Mostrar en el sitio') + '" title="' + (it.activo ? 'Visible en el sitio. Clic para ocultar' : 'Oculto. Clic para mostrar') + '">' + ic(it.activo ? 'ojo' : 'ojoNo', 16) + '</button>' +
            '<button class="bt bt--sec bt--mini" data-acc="editar">' + ic('editar', 15) + 'Editar</button><button class="bt bt--peligro bt--icono" data-acc="borrar" aria-label="Borrar">' + ic('borrar', 16) + '</button></div></div>';
        }).join('') + '</div>' : '<p class="vacio">Todavía no hay ' + E(esq.titulo.toLowerCase()) + '. Usa “Agregar ' + E(esq.singular) + '”.</p>');
      $('#agregar').onclick = function () { editarItem(tipo, null, lista.length ? Math.max.apply(null, lista.map(function (x) { return x.orden || 0; })) + 10 : 0); };
      var cont = $('#items');
      if (cont) cont.addEventListener('click', function (e) {
        var b = e.target.closest('[data-acc]'); if (!b) return;
        var id = b.closest('.item').getAttribute('data-id'), i = lista.findIndex(function (x) { return x.id === id; }), it = lista[i], acc = b.getAttribute('data-acc');
        if (acc === 'editar') return editarItem(tipo, it);
        if (acc === 'borrar') { if (confirm('¿Borrar "' + tituloItem(tipo, it) + '"? No se puede deshacer. Si solo quieres quitarlo del sitio por un tiempo, usa el ojo para ocultarlo.')) A.borrarItem(id).then(function () { toast('Borrado'); if (tipo === 'habitaciones') habs(true); vistaColeccion(tipo); }).catch(mal); return; }
        if (acc === 'ver') return guardar(it, { activo: !it.activo }).then(function () { toast(it.activo ? 'Oculto del sitio' : 'Visible en el sitio'); vistaColeccion(tipo); }).catch(mal);
        if (acc === 'subir' || acc === 'bajar') {
          var j = acc === 'subir' ? i - 1 : i + 1; if (j < 0 || j >= lista.length) return;
          var nueva = lista.slice(); nueva.splice(j, 0, nueva.splice(i, 1)[0]);
          var cambios = []; nueva.forEach(function (x, k) { if ((x.orden || 0) !== k * 10) cambios.push(guardar(x, { orden: k * 10 })); });
          Promise.all(cambios).then(function () { if (tipo === 'habitaciones') habs(true); vistaColeccion(tipo); }).catch(mal);
        }
      });
      function guardar(it, cambio) {
        var datos = {}; Object.keys(it).forEach(function (k) { if (['id', 'orden', 'activo'].indexOf(k) === -1) datos[k] = it[k]; });
        return A.guardarItem(tipo, Object.assign({ id: it.id, datos: datos, orden: it.orden || 0, activo: it.activo }, cambio));
      }
    }).catch(mal);
  }

  /* Campos de formulario a partir del esquema */
  function campoFoto(k, v) {
    return '<div class="foto-campo" data-foto="' + E(k) + '">' + (v ? '<img class="prev" src="' + E(v) + '" alt="">' : '<span class="prev">Sin foto</span>') +
      '<div class="acc"><input type="hidden" name="' + E(k) + '" value="' + E(v || '') + '"><div class="fila-bt"><label class="bt bt--sec bt--mini subir">Subir foto<input type="file" accept="image/*" data-subir-una></label><button type="button" class="bt bt--sec bt--mini" data-quitar-foto' + (v ? '' : ' hidden') + '>Quitar</button></div>' +
      '<input type="url" placeholder="…o pega el enlace de una foto" data-url-foto style="min-height:36px;padding:0 10px;border:1px solid rgba(30,43,36,.25);font-size:13px"><small class="suave" data-estado-foto></small></div></div>';
  }
  function construirCampos(campos, it) {
    return campos.map(function (c) {
      var v = it[c.k], ayuda = c.ayuda ? '<small>' + E(c.ayuda) + '</small>' : '', req = c.req ? ' required' : '';
      var et = E(c.l) + (c.req ? ' *' : '');
      switch (c.t) {
        case 'largo': return '<label class="campo campo--ancho">' + et + '<textarea name="' + c.k + '"' + req + '>' + E(v || '') + '</textarea>' + ayuda + '</label>';
        case 'numero': return '<label class="campo">' + et + '<input type="number" name="' + c.k + '" value="' + E(v == null ? '' : v) + '" min="0" step="any"' + req + '>' + ayuda + '</label>';
        case 'select': return '<label class="campo">' + et + '<select name="' + c.k + '">' + opcionesDe(c.op, v == null ? c.op[0][0] : v) + '</select>' + ayuda + '</label>';
        case 'si_no': return '<label class="check campo--ancho"><input type="checkbox" name="' + c.k + '"' + (v ? ' checked' : '') + '> ' + E(c.l) + '</label>';
        case 'lista': return '<label class="campo campo--ancho">' + et + '<textarea name="' + c.k + '" rows="5">' + E(U.textoListas(v).join('\n')) + '</textarea>' + ayuda + '</label>';
        case 'foto': return '<div class="campo campo--ancho">' + et + campoFoto(c.k, v) + ayuda + '</div>';
        case 'fotos': return '<div class="campo campo--ancho">' + et + '<small>La primera es la portada. Usa las flechas para cambiar el orden.</small><div data-fotos="' + c.k + '"></div>' +
          '<div class="fila-bt"><label class="bt bt--sec bt--mini subir">Subir fotos<input type="file" accept="image/*" multiple data-subir-varias></label><input type="url" placeholder="…o pega un enlace y presiona Enter" data-url-fotos style="min-height:32px;padding:0 10px;border:1px solid rgba(30,43,36,.25);font-size:13px;flex:1;min-width:220px"></div><small class="suave" data-estado-fotos></small></div>';
        default: return '<label class="campo' + (c.k === 'nombre' || c.k === 'titulo' || c.k === 'pregunta' ? ' campo--ancho' : '') + '">' + et + '<input type="text" name="' + c.k + '" value="' + E(v == null ? '' : v) + '"' + req + '>' + ayuda + '</label>';
      }
    }).join('');
  }
  function enlazarFotos(raiz, carpeta, it, campos) {
    // Una foto
    $$('[data-foto]', raiz).forEach(function (box) {
      var input = $('input[type="hidden"]', box), est = $('[data-estado-foto]', box);
      function poner(url) { input.value = url || ''; var p = $('.prev', box); var n = url ? '<img class="prev" src="' + E(url) + '" alt="">' : '<span class="prev">Sin foto</span>'; p.outerHTML = n; $('[data-quitar-foto]', box).hidden = !url; }
      $('[data-subir-una]', box).addEventListener('change', function () {
        var f = this.files[0]; if (!f) return; est.textContent = 'Subiendo…';
        A.subirFoto(f, carpeta).then(function (url) { poner(url); est.textContent = 'Lista. Recuerda guardar.'; }).catch(function (e) { est.textContent = ''; mal(e); });
        this.value = '';
      });
      $('[data-quitar-foto]', box).onclick = function () { poner(''); };
      $('[data-url-foto]', box).addEventListener('change', function () { var u = this.value.trim(); if (u) { poner(u); this.value = ''; } });
    });
    // Varias fotos
    var listas = {};
    $$('[data-fotos]', raiz).forEach(function (box) {
      var k = box.getAttribute('data-fotos'), wrap = box.parentElement, est = $('[data-estado-fotos]', wrap);
      listas[k] = U.textoListas(it[k]).slice();
      function pintar() {
        var l = listas[k];
        box.innerHTML = l.length ? '<div class="fotos-grid">' + l.map(function (u, i) {
          return '<figure><img src="' + E(u) + '" alt=""><figcaption><button type="button" class="bt bt--sec bt--icono" data-m="-1" data-i="' + i + '" aria-label="Mover antes"' + (i === 0 ? ' disabled' : '') + '>' + ic('izq', 14) + '</button><button type="button" class="bt bt--peligro bt--icono" data-x="' + i + '" aria-label="Quitar foto">' + ic('cerrar', 14) + '</button><button type="button" class="bt bt--sec bt--icono" data-m="1" data-i="' + i + '" aria-label="Mover después"' + (i === l.length - 1 ? ' disabled' : '') + '>' + ic('der', 14) + '</button></figcaption></figure>';
        }).join('') + '</div>' : '<p class="vacio" style="padding:18px">Sin fotos todavía.</p>';
      }
      box.addEventListener('click', function (e) {
        var x = e.target.closest('[data-x]'), m = e.target.closest('[data-m]'), l = listas[k];
        if (x) { l.splice(Number(x.getAttribute('data-x')), 1); pintar(); }
        if (m) { var i = Number(m.getAttribute('data-i')), j = i + Number(m.getAttribute('data-m')); l.splice(j, 0, l.splice(i, 1)[0]); pintar(); }
      });
      $('[data-subir-varias]', wrap).addEventListener('change', function () {
        var fs = Array.prototype.slice.call(this.files), hechas = 0; if (!fs.length) return;
        est.textContent = 'Subiendo 0 de ' + fs.length + '…';
        fs.reduce(function (p, f) { return p.then(function () { return A.subirFoto(f, carpeta).then(function (u) { listas[k].push(u); hechas++; est.textContent = 'Subiendo ' + hechas + ' de ' + fs.length + '…'; pintar(); }); }); }, Promise.resolve())
          .then(function () { est.textContent = 'Listo. Recuerda guardar.'; }).catch(function (e) { est.textContent = ''; mal(e); });
        this.value = '';
      });
      $('[data-url-fotos]', wrap).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var u = this.value.trim(); if (u) { listas[k].push(u); this.value = ''; pintar(); } } });
      pintar();
    });
    return function leer(form) {
      var d = {};
      campos.forEach(function (c) {
        var el = form.elements[c.k];
        if (c.t === 'fotos') d[c.k] = listas[c.k] || [];
        else if (c.t === 'si_no') d[c.k] = !!(el && el.checked);
        else if (c.t === 'numero') d[c.k] = el && el.value !== '' ? Number(el.value) : null;
        else if (c.t === 'lista') d[c.k] = U.textoListas(el ? el.value : '');
        else d[c.k] = el ? el.value.trim() : '';
      });
      return d;
    };
  }
  function editarItem(tipo, it, ordenNuevo) {
    var esq = NF.ESQUEMAS[tipo], nuevo = !it;
    it = it || { activo: true, orden: ordenNuevo || 0 };
    var cuerpo = '<form class="form" id="f-item" novalidate>' + construirCampos(esq.campos, it) +
      '<label class="check campo--ancho"><input type="checkbox" name="__activo"' + (it.activo !== false ? ' checked' : '') + '> Visible en el sitio</label></form>' +
      (NF.modo === 'prueba' ? '<p class="suave">En modo prueba las fotos subidas se guardan reducidas en este navegador (hay poco espacio). Con Supabase se guardan en la nube.</p>' : '');
    var pie = '<span></span><div class="fila-bt"><button type="button" class="bt bt--sec" data-cerrar>Cancelar</button><button type="button" class="bt" id="guardar">Guardar</button></div>';
    var m = modal((nuevo ? 'Agregar ' : 'Editar ') + esq.singular, cuerpo, pie), f = $('#f-item', m.el);
    var leer = enlazarFotos(m.el, tipo, it, esq.campos);
    $('#guardar', m.el).onclick = function () {
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var d = leer(f), falta = esq.campos.filter(function (c) { return c.req && (c.t === 'foto' || c.t === 'fotos') && !(Array.isArray(d[c.k]) ? d[c.k].length : d[c.k]); })[0];
      if (falta) return toast('Falta: ' + falta.l, true);
      var b = this; b.disabled = true;
      A.guardarItem(tipo, { id: it.id, datos: d, orden: it.orden || 0, activo: f.elements.__activo.checked })
        .then(function () { toast('Guardado'); m.cerrar(); if (tipo === 'habitaciones') habs(true); vistaColeccion(tipo); })
        .catch(function (e) { b.disabled = false; mal(e); });
    };
  }

  /* ---------- Textos y fotos de páginas ---------- */
  function htmlATexto(html) {
    var t = String(html).replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
    var ta = document.createElement('textarea'); ta.innerHTML = t;
    return ta.value.split('\n').map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).join('\n').trim();
  }
  var paginaTextos = 'index.html';
  RUTAS.textos = function () {
    Promise.all([fetch('/' + paginaTextos, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('No se pudo abrir la página'); return r.text(); }), A.ajustesGuardados()]).then(function (x) {
      var doc = new DOMParser().parseFromString(x[0], 'text/html'), guardados = x[1], vistos = {}, campos = [];
      $$('[data-cms], [data-cms-img], [data-cms-lista]', doc).forEach(function (el) {
        var k = el.getAttribute('data-cms') || el.getAttribute('data-cms-img') || el.getAttribute('data-cms-lista');
        if (vistos[k]) return; vistos[k] = 1;
        var tipo = el.hasAttribute('data-cms-img') ? 'img' : el.hasAttribute('data-cms-lista') ? 'lista' : 'texto';
        var def = tipo === 'img' ? el.getAttribute('src') : tipo === 'lista' ? $$('li', el).map(function (li) { return htmlATexto(li.innerHTML); }).join('\n') : htmlATexto(el.innerHTML);
        campos.push({ k: k, tipo: tipo, def: def, l: el.getAttribute('data-etiqueta') || k, actual: guardados[k] || '' });
      });
      var nombre = (NF.PAGINAS.filter(function (p) { return p[0] === paginaTextos; })[0] || [])[1];
      $('#vista').innerHTML = cabeza('Textos y fotos de páginas', 'Cambia los títulos, textos y fotos fijas de cada página. Escribe <b>*así*</b> para poner una palabra en cursiva dorada; cada Enter es un salto de línea. Si dejas un campo igual al original o vacío, se usa el texto original.',
        '<a class="bt bt--sec" href="/' + E(paginaTextos) + '" target="_blank" rel="noopener">' + ic('externo', 16) + 'Ver ' + E(nombre || 'página') + '</a>') + AVISO_PRUEBA +
        '<div class="filtros"><label class="campo" style="flex-direction:row;align-items:center;gap:10px">Página<select id="sel-pag">' + opcionesDe(NF.PAGINAS, paginaTextos) + '</select></label><span class="suave">' + campos.length + ' campos · los marcados con una línea dorada están cambiados</span></div>' +
        '<form class="caja form" id="f-textos">' + (campos.length ? campos.map(function (c, i) {
          var v = c.actual || c.def, cam = c.actual && c.actual !== c.def ? ' cambiado' : '';
          if (c.tipo === 'img') return '<div class="campo campo--ancho">' + E(c.l) + '<div class="foto-campo" data-foto="t' + i + '"><img class="prev" src="' + E(v) + '" alt=""><div class="acc"><input type="hidden" name="t' + i + '" value="' + E(c.actual) + '"><div class="fila-bt"><label class="bt bt--sec bt--mini subir">Cambiar foto<input type="file" accept="image/*" data-subir-una></label><button type="button" class="bt bt--sec bt--mini" data-restaurar="' + i + '"' + (c.actual ? '' : ' hidden') + '>Volver a la original</button></div><small class="suave" data-estado-foto></small></div></div></div>';
          var largo = v.length > 70 || v.indexOf('\n') !== -1 || c.tipo === 'lista';
          return '<label class="campo' + (largo ? ' campo--ancho' : '') + '">' + E(c.l) + (c.tipo === 'lista' ? ' <small>(uno por línea)</small>' : '') +
            (largo ? '<textarea name="t' + i + '" class="' + cam + '" rows="' + Math.min(8, Math.max(2, Math.ceil(v.length / 90) + (v.split('\n').length - 1))) + '">' + E(v) + '</textarea>' : '<input name="t' + i + '" class="' + cam + '" value="' + E(v) + '">') + '</label>';
        }).join('') + '<div class="campo--ancho fila-bt" style="position:sticky;bottom:0;background:#fff;padding:12px 0;border-top:1px solid var(--linea)"><button class="bt" type="submit">Guardar cambios de esta página</button><span class="suave" id="t-estado"></span></div>' : '<p class="vacio campo--ancho">Esta página no tiene textos fijos editables: su contenido sale de las secciones de Contenido del sitio.</p>') + '</form>';
      $('#sel-pag').onchange = function () { paginaTextos = this.value; RUTAS.textos(); };
      var f = $('#f-textos');
      // Fotos de página
      $$('[data-foto]', f).forEach(function (box) {
        var input = $('input[type="hidden"]', box), est = $('[data-estado-foto]', box), i = Number(box.getAttribute('data-foto').slice(1)), c = campos[i];
        $('[data-subir-una]', box).addEventListener('change', function () {
          var file = this.files[0]; if (!file) return; est.textContent = 'Subiendo…';
          A.subirFoto(file, 'paginas').then(function (u) { input.value = u; $('.prev', box).src = u; $('[data-restaurar]', box).hidden = false; est.textContent = 'Lista. Guarda para publicarla.'; }).catch(function (e) { est.textContent = ''; mal(e); });
          this.value = '';
        });
        $('[data-restaurar]', box).onclick = function () { input.value = ''; $('.prev', box).src = c.def; this.hidden = true; est.textContent = 'Se usará la foto original al guardar.'; };
      });
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var cambios = {};
        campos.forEach(function (c, i) {
          var el = f.elements['t' + i]; if (!el) return;
          var v = c.tipo === 'img' ? el.value : el.value.replace(/\r/g, '').trim();
          var nuevo = (c.tipo !== 'img' && htmlATexto(U.formatear(v)) === c.def) || v === c.def ? '' : v;
          if (nuevo !== (c.actual || '')) cambios[c.k] = nuevo;
        });
        if (!Object.keys(cambios).length) { $('#t-estado').textContent = 'No hay cambios.'; return; }
        A.guardarAjustes(cambios).then(function () { cacheAjustes = null; toast('Página actualizada'); RUTAS.textos(); }).catch(mal);
      });
    }).catch(mal);
  };

  /* ---------- Datos generales ---------- */
  RUTAS.datos = function () {
    ajustes(true).then(function (aj) {
      $('#vista').innerHTML = cabeza('Datos generales', 'Contacto, horarios y datos que se repiten en todo el sitio (cabecera, pie de página, botones de WhatsApp, reservas).') + AVISO_PRUEBA +
        '<form class="caja form" id="f-datos">' + NF.GLOBALES.map(function (c) {
          var v = aj[c.k] == null ? '' : aj[c.k], ayuda = c.ayuda ? '<small>' + E(c.ayuda) + '</small>' : '';
          if (c.t === 'largo') return '<label class="campo campo--ancho">' + E(c.l) + '<textarea name="' + E(c.k) + '">' + E(v) + '</textarea>' + ayuda + '</label>';
          return '<label class="campo' + (/maps|direccion|mensaje|frase/.test(c.k) ? ' campo--ancho' : '') + '">' + E(c.l) + '<input name="' + E(c.k) + '" value="' + E(v) + '"' + (c.t === 'numero' ? ' type="number" min="0" step="500"' : '') + '>' + ayuda + '</label>';
        }).join('') + '<div class="campo--ancho fila-bt"><button class="bt" type="submit">Guardar datos</button><a class="bt bt--sec" id="probar-wa" target="_blank" rel="noopener">Probar enlace de WhatsApp</a></div></form>';
      var f = $('#f-datos');
      function wa() { var n = f.elements['global.whatsapp'].value.replace(/\D/g, ''), a = $('#probar-wa'); a.hidden = !n; a.href = 'https://wa.me/' + n + '?text=' + encodeURIComponent(f.elements['global.mensaje_whatsapp'].value); }
      f.addEventListener('input', wa); wa();
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = {}; NF.GLOBALES.forEach(function (c) { d[c.k] = f.elements[c.k].value.trim(); });
        d['global.whatsapp'] = d['global.whatsapp'].replace(/\D/g, '');
        if (d['global.whatsapp'] && d['global.whatsapp'].length === 10 && d['global.whatsapp'][0] === '3') d['global.whatsapp'] = '57' + d['global.whatsapp'];
        A.guardarAjustes(d).then(function () { cacheAjustes = null; toast('Datos guardados'); RUTAS.datos(); }).catch(mal);
      });
    }).catch(mal);
  };

  /* ---------- Ayuda / modo prueba ---------- */
  RUTAS.ayuda = function () {
    var prueba = NF.modo === 'prueba';
    $('#vista').innerHTML = cabeza(prueba ? 'Modo prueba y ayuda' : 'Ayuda', '') +
      (prueba ? '<section class="caja"><h2>Estás en modo prueba</h2><p>La base de datos todavía no está conectada. Puedes explorar y editar todo, pero los cambios se guardan <b>solo en este navegador</b>: los visitantes del sitio siguen viendo los datos de ejemplo y las reservas que hagan quedan en su propio navegador.</p>' +
        '<p style="margin-top:10px">Para recibir reservas reales: crea un proyecto en Supabase, ejecuta <code>supabase/esquema.sql</code> y <code>supabase/datos-iniciales.sql</code>, y pega la URL y la clave pública en <code>assets/js/config.js</code>. El archivo <code>README.md</code> del proyecto tiene los pasos.</p>' +
        '<div class="fila-bt" style="margin-top:16px"><button class="bt bt--sec" id="exportar">Descargar mis cambios (JSON)</button><button class="bt bt--peligro" id="reiniciar">Borrar mis cambios y volver a los datos de ejemplo</button></div></section>' : '') +
      '<section class="caja"><h2>Cómo usar el panel</h2><dl style="display:grid;grid-template-columns:minmax(150px,auto) 1fr;gap:10px 20px;margin:0">' +
      '<dt><b>Reservas</b></dt><dd style="margin:0">Las que llegan de la web quedan <i>pendientes</i>. Escríbele al huésped por WhatsApp, recibe el anticipo y cámbiala a <i>confirmada</i>. Si se cae, márcala como <i>cancelada</i> (libera las fechas).</dd>' +
      '<dt><b>Calendario</b></dt><dd style="margin:0">Ves la ocupación del mes y puedes bloquear fechas para que no se reserven desde la web.</dd>' +
      '<dt><b>Contenido del sitio</b></dt><dd style="margin:0">Habitaciones, experiencias, planes, galería, preguntas… Agrega, edita, ordena con las flechas u oculta con el ojo.</dd>' +
      '<dt><b>Textos y fotos</b></dt><dd style="margin:0">Los títulos y textos fijos de cada página, y sus fotos principales.</dd>' +
      '<dt><b>Datos generales</b></dt><dd style="margin:0">WhatsApp, teléfono, correo, dirección, horarios, anticipo, desayuno y política de cancelación.</dd>' +
      '<dt><b>Fotos</b></dt><dd style="margin:0">Usa fotos horizontales o verticales de buena calidad (idealmente de más de 1600 px). El panel las reduce automáticamente antes de subirlas.</dd></dl></section>';
    if (prueba) {
      $('#exportar').onclick = function () { A.exportarPrueba().then(function (d) { descargar('nuevo-futuro-modo-prueba-' + hoy() + '.json', JSON.stringify(d, null, 2), 'application/json'); }); };
      $('#reiniciar').onclick = function () { if (confirm('¿Borrar todos los cambios hechos en este navegador (contenido, reservas de prueba y solicitudes)?')) { A.reiniciarPrueba(); cacheHabs = null; cacheAjustes = null; toast('Datos de ejemplo restaurados'); conteos(); } };
    }
  };

  arrancar();
  if (NF.sb) NF.sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_OUT') login(); });
})();
