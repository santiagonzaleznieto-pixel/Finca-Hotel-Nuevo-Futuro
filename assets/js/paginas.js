/* ==========================================================================
   Contenido dinámico de cada página
   Lee las colecciones (habitaciones, experiencias, planes…) y las pinta en
   los contenedores con id de cada HTML. Todo lo que se ve aquí se edita
   desde el panel (/admin).
   ========================================================================== */
(function () {
  'use strict';
  var NF = window.NF, S = window.NFsitio, U = NF.util;
  var E = U.escapar, F = U.formatear;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var FL = S.icono('flecha', 18);
  var params = new URLSearchParams(location.search);

  function opciones(tipo, campo) {
    var c = (NF.ESQUEMAS[tipo].campos.filter(function (x) { return x.k === campo; })[0] || {}).op || [];
    var o = {}; c.forEach(function (p) { o[p[0]] = p[1]; }); return o;
  }
  var TIPOS_HAB = opciones('habitaciones', 'tipo');

  function img(src, alt, extra) {
    if (!src) return '<div class="foto--vacia" style="position:absolute;inset:0">Foto pendiente</div>';
    return '<img src="' + E(src) + '" alt="' + E(alt || '') + '" loading="lazy"' + (extra || '') + '>';
  }
  function vacio(el, msg) { if (el) el.innerHTML = '<p class="vacio" style="grid-column:1/-1">' + E(msg) + '</p>'; }
  function fallo(el, e) { console.error(e); vacio(el, 'No pudimos cargar esta información. Recarga la página en un momento.'); }
  function listo(el) { S.observar(el); }
  function mayus(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function hoyIso() { var d = new Date(); d.setHours(0, 0, 0, 0); return U.iso(d); }
  function sumarDias(s, n) { var d = U.deIso(s); d.setDate(d.getDate() + n); return U.iso(d); }

  function precioHab(h, conDesayuno, precioDesayuno) {
    var p = Number(h.precio) || 0;
    if (!p) return { valor: 'Por confirmar', unidad: '' };
    var pd = Number(precioDesayuno) || 0;
    if (h.modo_precio === 'persona') return { valor: U.pesos(p + (conDesayuno ? pd : 0)), unidad: 'por persona / noche' + (conDesayuno ? ' con desayuno' : '') };
    if (conDesayuno && pd) return { valor: U.pesos(p + pd * (Number(h.capacidad) || 1)), unidad: 'por noche · desayuno para ' + (h.capacidad || 1) };
    return { valor: U.pesos(p), unidad: 'por noche' };
  }

  function cuantas(n) { return n + (n === 1 ? ' habitación' : ' habitaciones'); }
  function tarjetaGrupo(g, conDesayuno, pd) {
    var h = g.rep, pr = precioHab(h, conDesayuno, pd);
    var foto = (U.textoListas(h.fotos)[0]) || '';
    return '<a class="tarjeta nf-card nf-rv" href="/habitacion.html?h=' + encodeURIComponent(h.id) + '">' +
      '<div class="foto nf-zoom" style="position:relative">' + (h.tipo && TIPOS_HAB[h.tipo] ? '<span class="sello">' + E(TIPOS_HAB[h.tipo]) + '</span>' : '') + img(foto, g.nombre) + '</div>' +
      '<div class="tarjeta__cuerpo"><h3 class="tarjeta__titulo">' + E(g.nombre) + '</h3>' +
      '<p class="datos-mini">' + (h.capacidad ? '<span>Hasta ' + E(h.capacidad) + ' personas</span>' : '') + (h.camas ? '<span>' + E(h.camas) + '</span>' : '') + (g.total > 1 ? '<span>' + cuantas(g.total) + '</span>' : (h.detalle ? '<span>' + E(h.detalle) + '</span>' : '')) + '</p>' +
      '<div class="tarjeta__pie"><span><span class="precio">' + pr.valor + '</span> <span class="suave" style="font-size:13px">' + E(pr.unidad) + '</span></span><span class="flecha nf-flecha">Ver ' + FL + '</span></div></div></a>';
  }

  function interruptor(btn, alCambiar) {
    if (!btn) return;
    btn.addEventListener('click', function () { var v = btn.getAttribute('aria-checked') !== 'true'; btn.setAttribute('aria-checked', String(v)); alCambiar(v); });
  }
  function chips(el, lista, alElegir) {
    el.innerHTML = lista.map(function (c, i) { return '<button type="button" class="chip" data-v="' + E(c[0]) + '" aria-pressed="' + (i === 0) + '">' + E(c[1]) + '</button>'; }).join('');
    el.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      $$('.chip', el).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      alElegir(b.getAttribute('data-v'));
    });
  }
  function contador(el, valor, min, max, alCambiar) {
    var out = $('output', el), bs = $$('button', el);
    function pintar() { out.textContent = valor; bs[0].disabled = valor <= min; bs[1].disabled = valor >= max; }
    bs[0].addEventListener('click', function () { if (valor > min) { valor--; pintar(); alCambiar(valor); } });
    bs[1].addEventListener('click', function () { if (valor < max) { valor++; pintar(); alCambiar(valor); } });
    pintar();
    return { fijarMax: function (m) { max = m; if (valor > max) { valor = max; alCambiar(valor); } pintar(); }, valor: function () { return valor; } };
  }

  /* ---------- Calendario de rango (llegada → salida) ---------- */
  function Calendario(el, op) {
    var hoy = hoyIso();
    var st = { llegada: op.llegada || null, salida: op.salida || null, ocup: op.ocupados || {} };
    var mes = U.deIso(st.llegada || hoy); mes.setDate(1);
    var SEM = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
    function tope(llegada) { var d = llegada; for (var i = 0; i < 400; i++) { d = sumarDias(d, 1); if (st.ocup[d]) return d; } return null; }
    function libre(desde, hasta) { return U.rangoDias(desde, hasta).every(function (f) { return !st.ocup[f]; }); }
    function pintar() {
      var y = mes.getFullYear(), m = mes.getMonth();
      var offset = (new Date(y, m, 1).getDay() + 6) % 7, total = new Date(y, m + 1, 0).getDate();
      var eligiendoSalida = st.llegada && !st.salida, limite = eligiendoSalida ? tope(st.llegada) : null;
      var mesHoy = U.deIso(hoy); mesHoy.setDate(1);
      var h = '<div class="calendario__cabeza"><h3>' + mayus(mes.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })) + '</h3><div class="calendario__nav">' +
        '<button type="button" data-nav="-1" aria-label="Mes anterior"' + (mes <= mesHoy ? ' disabled' : '') + '>' + S.icono('izq', 18) + '</button>' +
        '<button type="button" data-nav="1" aria-label="Mes siguiente">' + S.icono('flecha', 18) + '</button></div></div>' +
        '<div class="calendario__semana" aria-hidden="true">' + SEM.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</div><div class="calendario__dias">';
      for (var i = 0; i < offset; i++) h += '<span></span>';
      for (var d = 1; d <= total; d++) {
        var s = U.iso(new Date(y, m, d)), ok = s >= hoy;
        if (ok) {
          if (eligiendoSalida && s > st.llegada) ok = !limite || s <= limite;
          else ok = !st.ocup[s];
        }
        var cls = (s === st.llegada || s === st.salida) ? 'extremo' : (st.llegada && st.salida && s > st.llegada && s < st.salida ? 'en-rango' : '');
        var et = U.deIso(s).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) + (s === st.llegada ? ', llegada' : s === st.salida ? ', salida' : '') + (!ok && s >= hoy ? ', sin cupo' : '');
        h += '<button type="button" data-dia="' + s + '" class="' + cls + '"' + (ok ? '' : ' disabled') + ' aria-label="' + et + '">' + d + '</button>';
      }
      el.innerHTML = h + '</div>';
    }
    el.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-nav]');
      if (nav) { mes.setMonth(mes.getMonth() + Number(nav.getAttribute('data-nav'))); pintar(); return; }
      var b = e.target.closest('[data-dia]'); if (!b || b.disabled) return;
      var s = b.getAttribute('data-dia');
      if (!st.llegada || st.salida || s <= st.llegada) { st.llegada = s; st.salida = null; } else st.salida = s;
      pintar();
      var foco = $('[data-dia="' + s + '"]', el); foco && foco.focus();
      op.alCambiar && op.alCambiar(st.llegada, st.salida);
    });
    pintar();
    return {
      fijarOcupados: function (o) {
        st.ocup = o || {};
        if (st.llegada && (st.ocup[st.llegada] || (st.salida && !libre(st.llegada, st.salida)))) { st.llegada = null; st.salida = null; op.alCambiar && op.alCambiar(null, null); }
        pintar();
      },
      valor: function () { return { llegada: st.llegada, salida: st.salida }; }
    };
  }


  /* ====================================================================== */
  var PAGINAS = {};

  /* ---------- Inicio ---------- */
  PAGINAS.inicio = function () {
    // Portada: fotos que se van turnando
    var figs = $$('.portada__foto'), barras = $$('.portada__barras i'), num = $('.portada__num'), tot = $('.portada__total'), ahora = 0, MS = 6500;
    var dos = function (n) { return (n < 10 ? '0' : '') + n; };
    barras.forEach(function (b, k) { b.hidden = k >= figs.length; });
    if (tot) tot.textContent = dos(figs.length);
    function mostrar(n) {
      figs[ahora].classList.remove('activa'); if (barras[ahora]) barras[ahora].classList.remove('activa');
      ahora = n; figs[ahora].classList.add('activa');
      if (barras[ahora]) { void barras[ahora].offsetWidth; barras[ahora].classList.add('activa'); }
      if (num) num.textContent = dos(ahora + 1);
    }
    if (figs.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInterval(function () { if (!document.hidden) mostrar((ahora + 1) % figs.length); }, MS);
    }
    var f = $('.buscador');
    if (f) {
      var hoy = hoyIso(), ll = f.llegada, sa = f.salida;
      ll.min = hoy; sa.min = sumarDias(hoy, 1);
      ll.addEventListener('change', function () { if (ll.value) { sa.min = sumarDias(ll.value, 1); if (!sa.value || sa.value <= ll.value) sa.value = sumarDias(ll.value, 1); } });
    }
    Promise.all([NF.coleccion('habitaciones'), S.ajustes]).then(function (r) {
      var el = $('#inicio-habitaciones'), grupos = U.agrupar(r[0]).filter(function (g) { return g.rep.tipo !== 'finca'; }), lista = grupos.filter(function (g) { return g.destacada; });
      if (!lista.length) lista = grupos;
      if (!lista.length) return vacio(el, 'Pronto publicaremos las habitaciones.');
      el.innerHTML = lista.slice(0, 3).map(function (g) { return tarjetaGrupo(g, false, r[1]['global.precio_desayuno']); }).join(''); listo(el);
    }).catch(function (e) { fallo($('#inicio-habitaciones'), e); });

    NF.coleccion('experiencias').then(function (l) {
      var el = $('#inicio-experiencias'), lista = l.filter(function (x) { return x.destacada; });
      if (!lista.length) lista = l.slice(0, 3);
      if (!lista.length) return vacio(el, 'Pronto publicaremos las experiencias.');
      el.innerHTML = lista.slice(0, 4).map(function (x, i) {
        return '<article style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:28px 40px;align-items:end">' +
          '<div class="foto nf-revela" style="height:420px;position:relative' + (i % 2 ? ';order:2' : '') + '">' + img(x.foto, x.titulo, ' class="nf-m"') + '</div>' +
          '<div class="pila nf-rv" style="gap:14px"><span class="cifra" style="color:var(--laton);font-size:40px">' + (i < 9 ? '0' : '') + (i + 1) + '</span><h3 class="titulo-m">' + E(x.titulo) + '</h3><p class="suave">' + F(x.descripcion) + '</p></div></article>';
      }).join(''); listo(el);
    }).catch(function (e) { fallo($('#inicio-experiencias'), e); });

    NF.coleccion('opiniones').then(function (l) {
      if (!l.length) return;
      var sec = $('#seccion-opiniones'), el = $('#inicio-opiniones'); sec.hidden = false;
      el.innerHTML = l.slice(0, 6).map(function (o) {
        return '<figure class="panel-blanco nf-rv pila" style="gap:16px;margin:0"><span style="color:var(--laton-oscuro)">' + S.icono('estrella', 18) + S.icono('estrella', 18) + S.icono('estrella', 18) + S.icono('estrella', 18) + S.icono('estrella', 18) + '</span>' +
          '<blockquote style="margin:0;font-family:var(--serif);font-size:23px;line-height:1.4">' + F(o.texto) + '</blockquote>' +
          '<figcaption class="suave" style="font-size:14px"><b style="color:var(--bosque)">' + E(o.nombre) + '</b>' + (o.ciudad ? ' · ' + E(o.ciudad) : '') + (o.fecha ? ' · ' + E(o.fecha) : '') + '</figcaption></figure>';
      }).join(''); listo(el);
    }).catch(function (e) { console.warn(e); });
  };

  /* ---------- Habitaciones ---------- */
  PAGINAS.habitaciones = function () {
    var el = $('#lista-habitaciones'), filtro = 'todas', desayuno = false, lista = [], aj = {};
    function pintar() {
      var vis = lista.filter(function (g) { return filtro === 'todas' || g.rep.tipo === filtro; });
      $('#conteo-habitaciones').textContent = vis.length === 1 ? '1 opción' : vis.length + ' opciones';
      if (!vis.length) return vacio(el, 'No hay habitaciones en esta categoría por ahora.');
      el.innerHTML = vis.map(function (g) { return tarjetaGrupo(g, desayuno, aj['global.precio_desayuno']); }).join(''); listo(el);
    }
    Promise.all([NF.coleccion('habitaciones'), S.ajustes]).then(function (r) {
      lista = U.agrupar(r[0]); aj = r[1];
      var pd = Number(aj['global.precio_desayuno']) || 0;
      $('#precio-desayuno').textContent = pd ? U.pesos(pd) : 'Por definir';
      if (!pd) $('#cambio-desayuno').hidden = true;
      var tipos = [['todas', 'Todas']].concat(Object.keys(TIPOS_HAB).filter(function (t) { return lista.some(function (g) { return g.rep.tipo === t; }); }).map(function (t) { return [t, TIPOS_HAB[t]]; }));
      chips($('#filtros-habitaciones'), tipos, function (v) { filtro = v; pintar(); });
      interruptor($('#cambio-desayuno'), function (v) { desayuno = v; pintar(); });
      if (!lista.length) { $('#conteo-habitaciones').textContent = ''; return vacio(el, 'Pronto publicaremos las habitaciones.'); }
      pintar();
    }).catch(function (e) { fallo(el, e); });
  };

  /* ---------- Ficha de una habitación ---------- */
  PAGINAS.habitacion = function () {
    var id = params.get('h');
    Promise.all([NF.coleccion('habitaciones'), S.ajustes]).then(function (r) {
      var habs = r[0], aj = r[1], h = habs.filter(function (x) { return x.id === id; })[0];
      if (!h) {
        $('#hab-nombre').textContent = 'Habitación no encontrada';
        $('#hab-descripcion').innerHTML = 'Puede que ya no esté disponible. <a href="/habitaciones.html">Ver todas las habitaciones</a>.';
        $$('#contenido > section:not(:first-child)').forEach(function (s) { s.hidden = true; });
        return;
      }
      var g = U.grupoDe(h.id, habs) || { id: h.id, nombre: h.nombre, rep: h, miembros: [h], total: 1 };
      h = g.rep;
      var nombre = g.nombre;
      document.title = nombre + ' · Finca Hotel Nuevo Futuro';
      $('#ruta-nombre').textContent = nombre;
      $('#hab-etiqueta').textContent = TIPOS_HAB[h.tipo] || 'Habitación';
      $('#hab-nombre').textContent = nombre;
      $('#hab-descripcion').innerHTML = F(h.descripcion);
      $('#hab-datos').innerHTML = [h.capacidad ? S.icono('personas', 18) + ' Hasta ' + E(h.capacidad) + ' personas' : '', h.camas ? S.icono('cama', 18) + ' ' + E(h.camas) : '', g.total > 1 ? S.icono('casa', 18) + ' ' + cuantas(g.total) + ' de este tipo' : (h.detalle ? S.icono('casa', 18) + ' ' + E(h.detalle) : '')]
        .filter(Boolean).map(function (t) { return '<li class="chip" style="display:inline-flex;align-items:center;gap:8px;cursor:default;border-color:rgba(251,249,244,.3);color:var(--papel)">' + t + '</li>'; }).join('');

      // Fotos
      var fotos = U.textoListas(h.fotos), i = 0, porVista = window.matchMedia('(min-width: 1100px)').matches ? 3 : window.matchMedia('(min-width: 700px)').matches ? 2 : 1;
      function pintarFotos() {
        var g = $('#hab-galeria');
        if (!fotos.length) { g.innerHTML = '<div class="foto foto--vacia" style="height:420px">Fotos pendientes</div>'; $('#hab-ant').hidden = $('#hab-sig').hidden = true; return; }
        var vis = []; for (var k = 0; k < Math.min(porVista, fotos.length); k++) vis.push(fotos[(i + k) % fotos.length]);
        g.innerHTML = vis.map(function (src, k) { return '<div class="foto" style="height:clamp(320px,34vw,470px)"><img src="' + E(src) + '" alt="' + E(nombre) + ', foto ' + ((i + k) % fotos.length + 1) + '"></div>'; }).join('');
        $('#hab-contador').textContent = (i + 1) + ' / ' + fotos.length;
        $('#hab-miniaturas').innerHTML = fotos.map(function (src, k) { return '<button type="button" data-i="' + k + '" aria-label="Ver foto ' + (k + 1) + '" aria-pressed="' + (k === i) + '" style="width:64px;height:48px;padding:0;border:' + (k === i ? '2px solid var(--laton)' : '1px solid rgba(251,249,244,.3)') + ';background:none;cursor:pointer;overflow:hidden"><img src="' + E(src) + '" alt="" style="width:100%;height:100%;object-fit:cover"></button>'; }).join('');
      }
      $('#hab-ant').addEventListener('click', function () { i = (i - 1 + fotos.length) % fotos.length; pintarFotos(); });
      $('#hab-sig').addEventListener('click', function () { i = (i + 1) % fotos.length; pintarFotos(); });
      $('#hab-miniaturas').addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) { i = Number(b.getAttribute('data-i')); pintarFotos(); } });
      if (fotos.length <= porVista) { $('#hab-ant').hidden = $('#hab-sig').hidden = true; }
      pintarFotos();

      var com = U.textoListas(h.comodidades);
      $('#hab-comodidades').innerHTML = com.length ? com.map(function (c) { return '<li>' + S.icono('check', 18) + F(c) + '</li>'; }).join('') : '<li>Comodidades por publicar</li>';

      // Reserva lateral
      var pd = Number(aj['global.precio_desayuno']) || 0, st = { llegada: null, salida: null, huespedes: Math.min(2, Number(h.capacidad) || 2), desayuno: false };
      var pr = precioHab(h, false, pd);
      var panel = $('#hab-reserva');
      panel.innerHTML = '<p><span class="precio" style="font-size:34px">' + pr.valor + '</span> <span class="suave">' + E(pr.unidad) + '</span></p>' +
        '<dl><div><dt>Llegada</dt><dd id="r-ll">Elige en el calendario</dd></div><div><dt>Salida</dt><dd id="r-sa">—</dd></div></dl>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><span class="suave">Huéspedes</span><div class="contador" id="r-hu"><button type="button" aria-label="Menos huéspedes">−</button><output aria-live="polite"></output><button type="button" aria-label="Más huéspedes">+</button></div></div>' +
        (pd ? '<button type="button" class="interruptor" role="switch" aria-checked="false" id="r-de"><span aria-hidden="true"></span>Desayuno (' + U.pesos(pd) + ' c/u)</button>' : '') +
        '<div class="total"><span>Total</span><span id="r-to">—</span></div>' +
        '<a class="btn btn--oscuro nf-btn" id="r-ir" href="/reservar.html?h=' + encodeURIComponent(h.id) + '">Reservar</a>' +
        '<a class="flecha nf-flecha" id="r-wa" href="/contacto.html">Preguntar por WhatsApp ' + FL + '</a>';
      function actualizar() {
        $('#r-ll').textContent = st.llegada ? U.fechaCorta(st.llegada) : 'Elige en el calendario';
        $('#r-sa').textContent = st.salida ? U.fechaCorta(st.salida) : '—';
        var n = st.llegada && st.salida ? U.noches(st.llegada, st.salida) : 0;
        $('#r-to').textContent = n && Number(h.precio) ? U.pesos(U.calcularTotal(h, n, st.huespedes, st.desayuno, pd)) : '—';
        var q = new URLSearchParams({ h: h.id }); if (n) { q.set('llegada', st.llegada); q.set('salida', st.salida); } q.set('adultos', st.huespedes);
        $('#r-ir').href = '/reservar.html?' + q.toString();
        $('#r-ir').textContent = n ? 'Reservar ' + n + (n === 1 ? ' noche' : ' noches') : 'Reservar';
        $('#r-wa').href = S.waUrl(aj, 'Hola, quiero preguntar por ' + nombre + (n ? ' del ' + U.fechaCorta(st.llegada) + ' al ' + U.fechaCorta(st.salida) : '') + ' para ' + st.huespedes + ' personas.');
      }
      contador($('#r-hu'), st.huespedes, 1, Number(h.capacidad) || 40, function (v) { st.huespedes = v; actualizar(); });
      interruptor($('#r-de'), function (v) { st.desayuno = v; actualizar(); });
      var cal = Calendario($('#hab-calendario'), { alCambiar: function (a, b) { st.llegada = a; st.salida = b; actualizar(); } });
      var desde = hoyIso();
      NF.disponibilidad(desde, sumarDias(desde, 400)).then(function (l) { cal.fijarOcupados(U.diasOcupadosGrupo(g, l, habs)); }).catch(function (e) { console.warn('Disponibilidad', e); });
      actualizar();

      // Otras
      var otras = U.agrupar(habs).filter(function (x) { return x.id !== g.id; }).sort(function (a, b) { return (b.rep.tipo === h.tipo) - (a.rep.tipo === h.tipo); }).slice(0, 3);
      var eo = $('#hab-otras');
      if (otras.length) { eo.innerHTML = otras.map(function (x) { return tarjetaGrupo(x, false, pd); }).join(''); listo(eo); } else eo.closest('section').hidden = true;
    }).catch(function (e) { fallo($('#hab-galeria'), e); });
  };

  /* ---------- Experiencias ---------- */
  PAGINAS.experiencias = function () {
    NF.coleccion('experiencias').then(function (l) {
      var dia = $('#exp-dia'), conHora = l.filter(function (x) { return x.hora; }).sort(function (a, b) {
        var p = function (h) { var m = String(h).match(/(\d{1,2})[:.]?(\d{2})?/); return m ? Number(m[1]) * 60 + Number(m[2] || 0) : 0; };
        return p(a.hora) - p(b.hora);
      });
      if (conHora.length) {
        dia.insertAdjacentHTML('beforeend', conHora.map(function (x) {
          return '<li><span class="dia__hora nf-rv">' + E(x.hora) + '</span><div class="dia__cuerpo"><div class="nf-rv"><h3 class="titulo-m">' + E(x.titulo) + '</h3><p class="suave">' + F(x.descripcion) + '</p></div>' +
            '<div class="foto nf-revela" style="position:relative">' + img(x.foto, x.titulo, ' class="nf-m"') + '</div></div></li>';
        }).join(''));
        listo(dia);
      } else dia.closest('section').hidden = true;
      var el = $('#exp-todas');
      if (!l.length) return vacio(el, 'Pronto publicaremos las experiencias.');
      el.innerHTML = l.map(function (x) {
        return '<article class="tarjeta-oscura nf-card nf-rv" style="min-height:380px">' + (x.foto ? '<img src="' + E(x.foto) + '" alt="" loading="lazy">' : '') + '<div><h3>' + E(x.titulo) + '</h3><p style="font-size:14.5px;line-height:1.6;color:#E9E4D8">' + F(x.descripcion) + '</p></div></article>';
      }).join(''); listo(el);
    }).catch(function (e) { fallo($('#exp-todas'), e); });
  };

  /* ---------- La finca ---------- */
  function iconoPara(t) {
    t = String(t).toLowerCase();
    if (/piscina|jacuzzi|agua|turco|sauna/.test(t)) return 'agua';
    if (/fogata|asador|bbq|kiosco|cocina|fuego/.test(t)) return 'fuego';
    if (/jard|verde|sender|caf|bosque|monta/.test(t)) return 'hoja';
    if (/juego|billar|ping|sapo|cancha|tejo/.test(t)) return 'estrella';
    if (/habitaci|cama/.test(t)) return 'cama';
    return 'casa';
  }
  PAGINAS['la-finca'] = function () {
    NF.coleccion('instalaciones').then(function (l) {
      var el = $('#finca-instalaciones');
      if (!l.length) return vacio(el, 'Pronto publicaremos las instalaciones.');
      el.innerHTML = l.map(function (x) { return '<article>' + S.icono(iconoPara(x.nombre), 34) + '<h3>' + E(x.nombre) + '</h3><p>' + F(x.descripcion) + '</p></article>'; }).join('');
    }).catch(function (e) { fallo($('#finca-instalaciones'), e); });
    NF.coleccion('normas').then(function (l) {
      var el = $('#finca-normas');
      if (!l.length) { el.closest('section').hidden = true; return; }
      el.innerHTML = l.map(function (x) { return '<div><dt>' + E(x.titulo) + '</dt><dd>' + F(x.detalle) + '</dd></div>'; }).join('');
    }).catch(function (e) { fallo($('#finca-normas'), e); });
  };

  /* ---------- Formularios de solicitud ---------- */
  function formSolicitud(form, estado, tipo, armar) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var d = {}; new FormData(form).forEach(function (v, k) { d[k] = v; });
      var btn = $('button[type="submit"]', form); btn.disabled = true; estado.textContent = 'Enviando…';
      NF.crearSolicitud(Object.assign({ tipo: tipo }, armar(d))).then(function () {
        form.reset();
        estado.textContent = NF.modo === 'prueba' ? '¡Recibido! (Sitio en modo prueba: el mensaje solo se guarda en este navegador. Escríbenos por WhatsApp para asegurar la respuesta.)' : '¡Recibido! Te responderemos muy pronto.';
        S.toast('Solicitud enviada');
      }).catch(function (err) { estado.textContent = 'No se pudo enviar: ' + err.message + ' Intenta de nuevo o escríbenos por WhatsApp.'; })
        .then(function () { btn.disabled = false; });
    });
  }

  /* ---------- Eventos ---------- */
  PAGINAS.eventos = function () {
    NF.coleccion('eventos').then(function (l) {
      var el = $('#eventos-tipos'), sel = $('#evento-tipo');
      sel.insertAdjacentHTML('beforeend', l.map(function (x) { return '<option>' + E(x.titulo) + '</option>'; }).join('') + '<option>Otro</option>');
      if (!l.length) return vacio(el, 'Pronto publicaremos los tipos de evento.');
      el.innerHTML = l.map(function (x) {
        return '<article class="tarjeta-oscura nf-card nf-rv" style="min-height:400px">' + (x.foto ? '<img src="' + E(x.foto) + '" alt="" loading="lazy">' : '') + '<div><h3>' + E(x.titulo) + '</h3><p style="font-size:14.5px;color:#E9E4D8">' + F(x.descripcion) + '</p></div></article>';
      }).join(''); listo(el);
    }).catch(function (e) { fallo($('#eventos-tipos'), e); });
    NF.coleccion('espacios').then(function (l) {
      var el = $('#eventos-espacios');
      if (!l.length) return vacio(el, 'Pronto publicaremos los espacios.');
      el.innerHTML = l.map(function (x) { return '<div><dt>' + E(x.nombre) + '</dt><dd>' + F(x.detalle) + '</dd></div>'; }).join('');
    }).catch(function (e) { fallo($('#eventos-espacios'), e); });
    var f = $('#form-evento');
    f.fecha.min = hoyIso();
    formSolicitud(f, $('#evento-estado'), 'evento', function (d) {
      return { nombre: d.nombre, telefono: d.telefono, correo: d.correo, asunto: d.evento, fecha: d.fecha, personas: Number(d.personas) || null, mensaje: 'Hospedaje: ' + d.hospedaje + (d.mensaje ? '\n' + d.mensaje : '') };
    });
  };

  /* ---------- Planes ---------- */
  PAGINAS.planes = function () {
    var lista = [], desayuno = false;
    function pintar() {
      var el = $('#planes-lista');
      if (!lista.length) return vacio(el, 'Pronto publicaremos los planes.');
      el.innerHTML = lista.map(function (p) {
        var oscuro = !!p.destacado, precio = desayuno && Number(p.precio_desayuno) ? p.precio_desayuno : p.precio;
        var inc = U.textoListas(p.incluye);
        var dest = p.boton === 'eventos' ? ['/eventos.html#cotizador', 'Cotizar'] : ['/reservar.html', 'Reservar'];
        return '<article class="nf-card nf-rv pila" style="gap:20px;padding:clamp(28px,3vw,40px);background:' + (oscuro ? 'var(--bosque);color:var(--papel)' : '#fff;border:1px solid rgba(30,43,36,.12)') + '">' +
          '<h3 class="titulo-m">' + E(p.nombre) + '</h3>' +
          '<p style="display:flex;flex-direction:column;gap:4px"><span class="cifra"' + (oscuro ? ' style="color:var(--laton-claro)"' : '') + '>' + (Number(precio) ? U.pesos(precio) : 'Por confirmar') + '</span><span style="font-size:13.5px;opacity:.75">' + E(p.unidad || '') + (desayuno && Number(p.precio_desayuno) ? ' · con desayuno' : '') + '</span></p>' +
          (inc.length ? '<ul class="lista-lineas" style="margin:0">' + inc.map(function (t) { return '<li' + (oscuro ? ' style="border-color:rgba(251,249,244,.16)"' : '') + '>' + S.icono('check', 18) + F(t) + '</li>'; }).join('') + '</ul>' : '') +
          '<a class="btn ' + (oscuro ? 'btn--oro v-oscuro' : 'btn--oscuro') + ' nf-btn" style="margin-top:auto" href="' + dest[0] + '">' + dest[1] + '</a></article>';
      }).join(''); listo(el);
    }
    NF.coleccion('planes').then(function (l) {
      lista = l;
      if (!l.some(function (p) { return Number(p.precio_desayuno); })) $('#planes-desayuno').hidden = true;
      pintar();
    }).catch(function (e) { fallo($('#planes-lista'), e); });
    interruptor($('#planes-desayuno'), function (v) { desayuno = v; pintar(); });
    NF.coleccion('temporadas').then(function (l) {
      var el = $('#planes-temporadas');
      if (!l.length) { el.closest('section').hidden = true; return; }
      el.innerHTML = l.map(function (t) { return '<tr><th scope="row">' + E(t.nombre) + '</th><td>' + E(t.fechas) + '</td><td>' + E(t.persona) + '</td><td>' + E(t.pareja) + '</td><td>' + E(t.finca) + '</td></tr>'; }).join('');
    }).catch(function (e) { console.warn(e); });
  };

  /* ---------- Galería ---------- */
  PAGINAS.galeria = function () {
    var CATS = opciones('galeria', 'categoria'), todas = [], vis = [], actual = 0, ultimoFoco = null;
    var el = $('#galeria-lista'), visor = $('#visor');
    function pintar(cat) {
      vis = todas.filter(function (x) { return cat === 'todas' || x.categoria === cat; });
      if (!vis.length) return vacio(el, 'Aún no hay fotos en esta categoría.');
      el.innerHTML = vis.map(function (x, i) { return '<button type="button" class="nf-rv" data-i="' + i + '" aria-label="Ampliar: ' + E(x.titulo) + '"><img src="' + E(x.foto) + '" alt="' + E(x.titulo) + '" loading="lazy"></button>'; }).join('');
      listo(el);
    }
    function mostrar(i) {
      actual = (i + vis.length) % vis.length; var x = vis[actual];
      $('#visor-img').src = x.foto; $('#visor-img').alt = x.titulo;
      $('#visor-titulo').textContent = x.titulo; $('#visor-cuenta').textContent = (actual + 1) + ' / ' + vis.length;
    }
    function abrir(i) { ultimoFoco = document.activeElement; mostrar(i); visor.hidden = false; document.body.style.overflow = 'hidden'; $('#visor-cerrar').focus(); }
    function cerrar() { visor.hidden = true; document.body.style.overflow = ''; ultimoFoco && ultimoFoco.focus(); }
    el.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) abrir(Number(b.getAttribute('data-i'))); });
    $('#visor-cerrar').addEventListener('click', cerrar);
    $('#visor-ant').addEventListener('click', function () { mostrar(actual - 1); });
    $('#visor-sig').addEventListener('click', function () { mostrar(actual + 1); });
    visor.addEventListener('click', function (e) { if (e.target === visor || e.target.parentElement === $('.visor__centro', visor) && e.target.tagName === 'DIV') cerrar(); });
    document.addEventListener('keydown', function (e) {
      if (visor.hidden) return;
      if (e.key === 'Escape') cerrar(); else if (e.key === 'ArrowLeft') mostrar(actual - 1); else if (e.key === 'ArrowRight') mostrar(actual + 1);
    });
    NF.coleccion('galeria').then(function (l) {
      todas = l.filter(function (x) { return x.foto; });
      var cats = [['todas', 'Todas']].concat(Object.keys(CATS).filter(function (c) { return todas.some(function (x) { return x.categoria === c; }); }).map(function (c) { return [c, CATS[c]]; }));
      chips($('#galeria-filtros'), cats, pintar);
      if (!todas.length) return vacio(el, 'Pronto publicaremos las fotos.');
      pintar('todas');
    }).catch(function (e) { fallo(el, e); });
  };

  /* ---------- Ubicación ---------- */
  PAGINAS.ubicacion = function () {
    S.ajustes.then(function (aj) {
      var src = String(aj['global.maps_embed'] || '').trim();
      var m = src.match(/src="([^"]+)"/); if (m) src = m[1];
      if (/^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/.test(src)) {
        $('#mapa').innerHTML = '<iframe title="Mapa de la finca" src="' + E(src) + '" style="position:absolute;inset:0;width:100%;height:100%;border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
      }
    });
    NF.coleccion('lugares').then(function (l) {
      var el = $('#ubicacion-lugares');
      if (!l.length) { el.closest('section').hidden = true; return; }
      el.innerHTML = l.map(function (x) {
        return '<article class="tarjeta nf-card nf-rv">' + (x.foto ? '<div class="foto" style="height:200px"><img src="' + E(x.foto) + '" alt="" loading="lazy"></div>' : '') +
          '<div class="tarjeta__cuerpo"><span class="cifra" style="font-size:34px;color:var(--laton-oscuro)">' + E(x.distancia || '') + '</span><h3 class="tarjeta__titulo" style="font-size:28px">' + E(x.nombre) + '</h3><p class="suave" style="font-size:14.5px">' + F(x.descripcion) + '</p></div></article>';
      }).join(''); listo(el);
    }).catch(function (e) { fallo($('#ubicacion-lugares'), e); });
  };

  /* ---------- Preguntas ---------- */
  PAGINAS.preguntas = function () {
    var TEMAS = opciones('preguntas', 'tema'), todas = [], el = $('#preguntas-lista');
    function pintar(tema) {
      var vis = todas.filter(function (x) { return tema === 'todas' || x.tema === tema; });
      if (!vis.length) return vacio(el, 'No hay preguntas en este tema.');
      el.innerHTML = vis.map(function (x, i) {
        return '<div><h3><button type="button" aria-expanded="false" aria-controls="r' + i + '" id="p' + i + '">' + E(x.pregunta) + '<i aria-hidden="true">+</i></button></h3>' +
          '<div class="acordeon__resp" id="r' + i + '" role="region" aria-labelledby="p' + i + '"><div><p>' + F(x.respuesta) + '</p></div></div></div>';
      }).join('');
    }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('h3 button'); if (!b) return;
      var abierta = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(!abierta)); b.closest('.acordeon > div').classList.toggle('abierta', !abierta);
    });
    NF.coleccion('preguntas').then(function (l) {
      todas = l;
      var temas = [['todas', 'Todas']].concat(Object.keys(TEMAS).filter(function (t) { return l.some(function (x) { return x.tema === t; }); }).map(function (t) { return [t, TEMAS[t]]; }));
      chips($('#preguntas-filtros'), temas, pintar);
      if (!l.length) return vacio(el, 'Pronto publicaremos las preguntas frecuentes.');
      pintar('todas');
    }).catch(function (e) { fallo(el, e); });
  };

  /* ---------- Contacto ---------- */
  PAGINAS.contacto = function () {
    formSolicitud($('#form-contacto'), $('#contacto-estado'), 'contacto', function (d) { return { nombre: d.nombre, telefono: d.telefono, correo: d.correo, asunto: d.asunto, mensaje: d.mensaje }; });
  };

  /* ---------- Reservar ---------- */
  PAGINAS.reservar = function () {
    var st = { llegada: params.get('llegada'), salida: params.get('salida'), adultos: Math.max(1, Math.min(40, Number(params.get('adultos')) || 2)), ninos: 0, mascota: false, desayuno: false, hab: null, habId: params.get('h') };
    var habs = [], aj = {}, pd = 0, disp = [], filasOpciones = [];
    var hoy = hoyIso();
    if (!(st.llegada >= hoy && st.salida > st.llegada)) { st.llegada = null; st.salida = null; }

    function irA(n) {
      $$('[data-paso]').forEach(function (p) { p.hidden = Number(p.getAttribute('data-paso')) !== n; });
      $$('#pasos li').forEach(function (li, i) { li.className = i + 1 < n ? 'hecho' : i + 1 === n ? 'actual' : ''; });
      var t = $('[data-paso="' + n + '"] h2'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
      var top = $('.reserva-layout').getBoundingClientRect().top + scrollY - 120; if (scrollY > top) scrollTo({ top: top, behavior: 'smooth' });
    }
    function huespedes() { return st.adultos + st.ninos; }
    function resumen() {
      var n = st.llegada && st.salida ? U.noches(st.llegada, st.salida) : 0;
      var h = st.hab;
      $('#resumen-nombre').textContent = st.grupo ? st.grupo.nombre : h ? h.nombre : 'Tu estadía';
      var foto = h && U.textoListas(h.fotos)[0]; if (foto) $('#resumen-foto').src = foto;
      $('#resumen-datos').innerHTML = '<div><dt>Llegada</dt><dd>' + (st.llegada ? U.fechaCorta(st.llegada) : '—') + '</dd></div><div><dt>Salida</dt><dd>' + (st.salida ? U.fechaCorta(st.salida) : '—') + '</dd></div>' +
        (n ? '<div><dt>Noches</dt><dd>' + n + '</dd></div>' : '') +
        '<div><dt>Huéspedes</dt><dd>' + st.adultos + (st.adultos === 1 ? ' adulto' : ' adultos') + (st.ninos ? ', ' + st.ninos + (st.ninos === 1 ? ' niño' : ' niños') : '') + '</dd></div>' +
        (st.mascota ? '<div><dt>Mascota</dt><dd>Sí</dd></div>' : '') + (st.desayuno ? '<div><dt>Desayuno</dt><dd>Incluido</dd></div>' : '');
      var tot = h && n && Number(h.precio) ? U.calcularTotal(h, n, huespedes(), st.desayuno, pd) : 0;
      $('#resumen-total').textContent = tot ? U.pesos(tot) : (h && n ? 'Por confirmar' : '—');
      $('#ir-paso-2').disabled = !n;
    }

    // Paso 1
    var cal = Calendario($('#res-calendario'), { llegada: st.llegada, salida: st.salida, alCambiar: function (a, b) { st.llegada = a; st.salida = b; resumen(); } });
    contador($('[data-contador="adultos"]'), st.adultos, 1, 40, function (v) { st.adultos = v; resumen(); });
    contador($('[data-contador="ninos"]'), 0, 0, 20, function (v) { st.ninos = v; resumen(); });
    $('#res-mascota').addEventListener('change', function (e) { st.mascota = e.target.checked; resumen(); });
    $('#ir-paso-2').addEventListener('click', function () { cargarOpciones(); irA(2); });
    $$('[data-volver]').forEach(function (b) { b.addEventListener('click', function () { irA(Number(b.getAttribute('data-volver'))); }); });

    // Paso 2
    function cargarOpciones() {
      var el = $('#res-opciones'); el.innerHTML = '<p class="suave">Buscando disponibilidad…</p>';
      NF.disponibilidad(st.llegada, st.salida).then(function (l) {
        disp = l;
        var noches = U.rangoDias(st.llegada, st.salida);
        var filas = U.agrupar(habs).map(function (g) {
          var cap = Number(g.rep.capacidad) || 0, cabe = !cap || huespedes() <= cap;
          var libres = g.miembros.filter(function (h) {
            var oc = U.diasOcupados(h.id, disp, habs), c = Number(h.capacidad) || 0;
            return (!c || huespedes() <= c) && noches.every(function (f) { return !oc[f]; });
          });
          return { g: g, libres: libres, ok: libres.length > 0, motivo: !cabe ? 'Máximo ' + cap + ' personas' : 'Sin cupo en esas fechas' };
        }).sort(function (a, b) { return b.ok - a.ok; });
        if (!filas.length) { el.innerHTML = '<p class="vacio">Aún no hay habitaciones publicadas. Escríbenos por WhatsApp.</p>'; return; }
        var elegida = st.grupo ? filas.filter(function (f) { return f.ok && f.g.id === st.grupo.id; })[0] : null;
        if (!elegida && !st.grupo && st.habId) elegida = filas.filter(function (f) { return f.ok && f.g.miembros.some(function (h) { return h.id === st.habId; }); })[0];
        if (elegida) { st.grupo = elegida.g; st.libres = elegida.libres; st.hab = elegida.libres[0]; } else { st.grupo = null; st.libres = []; st.hab = null; }
        filasOpciones = filas;
        var n = noches.length;
        el.innerHTML = filas.map(function (f) {
          var g = f.g, h = g.rep, pr = precioHab(h, false, pd), tot = Number(h.precio) ? U.pesos(U.calcularTotal(h, n, huespedes(), st.desayuno, pd)) : 'Por confirmar';
          var foto = U.textoListas(h.fotos)[0], quedan = g.total > 1 && f.ok ? '<span>' + (f.libres.length === 1 ? 'Queda 1' : 'Quedan ' + f.libres.length) + '</span>' : '';
          return '<button type="button" class="opcion" role="radio" data-id="' + E(g.id) + '" aria-checked="' + (!!st.grupo && st.grupo.id === g.id) + '"' + (f.ok ? '' : ' disabled') + '>' +
            (foto ? '<img src="' + E(foto) + '" alt="">' : '') +
            '<div><span class="etiqueta" style="color:var(--laton-oscuro)">' + E(TIPOS_HAB[h.tipo] || 'Habitación') + '</span><span class="titulo-m" style="font-size:28px">' + E(g.nombre) + '</span>' +
            '<span class="datos-mini">' + (h.capacidad ? '<span>Hasta ' + E(h.capacidad) + ' personas</span>' : '') + (h.camas ? '<span>' + E(h.camas) + '</span>' : '') + quedan + '</span>' +
            '<span style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:6px"><span class="suave" style="font-size:13.5px">' + pr.valor + ' ' + E(pr.unidad) + '</span>' +
            (f.ok ? '<b>' + tot + ' · ' + n + (n === 1 ? ' noche' : ' noches') + '</b>' : '<b style="color:#A6452F">' + E(f.motivo) + '</b>') + '</span></div></button>';
        }).join('');
        $('#ir-paso-3').disabled = !st.hab;
        resumen();
      }).catch(function (e) { console.error(e); el.innerHTML = '<p class="aviso aviso--error">No pudimos consultar la disponibilidad. Intenta de nuevo o escríbenos por WhatsApp.</p>'; });
    }
    $('#res-opciones').addEventListener('click', function (e) {
      var b = e.target.closest('.opcion'); if (!b || b.disabled) return;
      var f = filasOpciones.filter(function (x) { return x.g.id === b.getAttribute('data-id'); })[0]; if (!f) return;
      st.grupo = f.g; st.libres = f.libres; st.hab = f.libres[0];
      $$('#res-opciones .opcion').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      $('#ir-paso-3').disabled = false; resumen();
    });
    interruptor($('#res-desayuno'), function (v) { st.desayuno = v; cargarOpciones(); });
    $('#ir-paso-3').addEventListener('click', function () { if (st.hab) irA(3); });

    // Paso 3
    var form = $('#res-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var d = {}; new FormData(form).forEach(function (v, k) { d[k] = v; });
      var btn = $('#res-enviar'), err = $('#res-error'); btn.disabled = true; btn.textContent = 'Enviando…'; err.hidden = true;
      var candidatos = (st.libres && st.libres.length) ? st.libres : [st.hab];
      var datos = { habitacion_id: st.hab.id, llegada: st.llegada, salida: st.salida, adultos: st.adultos, ninos: st.ninos, mascota: st.mascota, desayuno: st.desayuno,
        nombre: d.nombre, telefono: d.telefono, correo: d.correo, ciudad: d.ciudad || '', hora_llegada: d.hora_llegada, comentarios: d.comentarios || '' };
      // Si otra persona tomó esa habitación un momento antes, se intenta con la siguiente libre del mismo tipo
      function intentar(k) {
        datos.habitacion_id = candidatos[k].id;
        return NF.crearReserva(datos).catch(function (x) { if (/ya no están libres/i.test(x.message || '') && k + 1 < candidatos.length) return intentar(k + 1); throw x; });
      }
      intentar(0).then(function (r) {
        $('#res-codigo').textContent = r.codigo;
        var txt = 'Hola, acabo de enviar la reserva ' + r.codigo + ' desde la web.\n' +
          'Habitación: ' + (st.grupo ? st.grupo.nombre : st.hab.nombre) + '\nLlegada: ' + U.fechaCorta(st.llegada) + '\nSalida: ' + U.fechaCorta(st.salida) +
          '\nHuéspedes: ' + st.adultos + ' adultos' + (st.ninos ? ', ' + st.ninos + ' niños' : '') + (st.mascota ? '\nViajo con mascota' : '') + (st.desayuno ? '\nCon desayuno' : '') +
          (r.total ? '\nTotal estimado: ' + U.pesos(r.total) : '') + '\nNombre: ' + d.nombre;
        var wa = S.waUrl(aj, txt), a = $('#res-wa');
        if (/^https/.test(wa)) a.href = wa; else a.hidden = true;
        if (NF.modo === 'prueba') $('[data-paso="4"] .lead').insertAdjacentHTML('afterend', '<p class="aviso">El sitio está en <b>modo prueba</b>: esta reserva solo quedó guardada en este navegador. Envía el resumen por WhatsApp para que la finca la reciba.</p>');
        irA(4);
      }).catch(function (x) { err.textContent = x.message || 'No se pudo enviar la reserva.'; err.hidden = false; })
        .then(function () { btn.disabled = false; btn.textContent = 'Enviar reserva'; });
    });

    Promise.all([NF.coleccion('habitaciones'), S.ajustes]).then(function (r) {
      habs = r[0]; aj = r[1]; pd = Number(aj['global.precio_desayuno']) || 0;
      if (!pd) $('#res-desayuno').hidden = true;
      if (st.habId) {
        var h = habs.filter(function (x) { return x.id === st.habId; })[0];
        if (h) {
          var g0 = U.grupoDe(h.id, habs);
          st.hab = h; st.grupo = g0;
          NF.disponibilidad(hoy, sumarDias(hoy, 400)).then(function (l) { cal.fijarOcupados(g0 ? U.diasOcupadosGrupo(g0, l, habs) : U.diasOcupados(h.id, l, habs)); resumen(); });
        }
      }
      resumen();
    }).catch(function (e) { console.error(e); });
    resumen();
  };

  /* ---------- Arranque ---------- */
  if (NF.modo === 'prueba' && S.pagina !== '404') {
    var oculta = false; try { oculta = sessionStorage.getItem('nf-sin-marca') === '1'; } catch (e) {}
    if (!oculta) {
      document.body.insertAdjacentHTML('beforeend', '<button type="button" class="marca-prueba" title="Sitio en modo prueba: conecta Supabase para recibir reservas reales. Toca para ocultar.">Modo prueba <span aria-hidden="true">×</span></button>');
      var m = document.querySelector('.marca-prueba');
      m.addEventListener('click', function () { m.remove(); try { sessionStorage.setItem('nf-sin-marca', '1'); } catch (e) {} });
    }
  }
  var fn = PAGINAS[S.pagina];
  if (fn) { try { fn(); } catch (e) { console.error(e); } }
})();
