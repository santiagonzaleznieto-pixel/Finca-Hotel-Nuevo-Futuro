/* ==========================================================================
   Capa de datos de Nuevo Futuro
   Una sola interfaz (window.NF) para el sitio y el panel. Funciona con
   Supabase si config.js tiene las claves, o en "modo prueba" con
   /datos/inicial.json + cambios guardados en el navegador.
   ========================================================================== */
(function () {
  'use strict';
  var cfg = window.NF_CONFIG || {};
  var conSupabase = !!(cfg.supabaseUrl && cfg.supabaseKey && window.supabase && window.supabase.createClient);
  var sb = conSupabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey) : null;
  var BUCKET = cfg.bucket || 'fotos';
  var CLAVE_PRUEBA = 'nf-prueba-v1';

  /* ---------- Qué se puede editar: colecciones ---------- */
  var OPC_TIPO_HAB = [['pareja', 'Para dos'], ['familiar', 'Familiar'], ['grupo', 'Grupos'], ['finca', 'Finca completa']];
  var ESQUEMAS = {
    habitaciones: { titulo: 'Habitaciones', singular: 'habitación', campos: [
      { k: 'nombre', l: 'Nombre interno', t: 'texto', req: true, ayuda: 'Para reconocerla en el panel (ej.: Habitación 3 o Yarumo).' },
      { k: 'grupo', l: 'Nombre público del tipo', t: 'texto', ayuda: 'Las habitaciones con el mismo nombre de tipo se muestran juntas en una sola tarjeta con cuántas quedan libres. Ej.: Habitación doble. Usa el mismo precio y capacidad en todas las de un tipo. Si lo dejas vacío, se muestra sola con su nombre interno.' },
      { k: 'tipo', l: 'Categoría', t: 'select', op: OPC_TIPO_HAB },
      { k: 'capacidad', l: 'Capacidad (personas)', t: 'numero' },
      { k: 'camas', l: 'Camas', t: 'texto', ayuda: 'Ej.: Cama queen · Doble y camarote' },
      { k: 'detalle', l: 'Detalle corto', t: 'texto', ayuda: 'Ej.: 30 m² · vista a la colina' },
      { k: 'descripcion', l: 'Descripción', t: 'largo' },
      { k: 'precio', l: 'Precio (pesos)', t: 'numero' },
      { k: 'modo_precio', l: 'El precio es', t: 'select', op: [['noche', 'Por noche (habitación completa)'], ['persona', 'Por persona por noche']] },
      { k: 'comodidades', l: 'Comodidades (una por línea)', t: 'lista' },
      { k: 'fotos', l: 'Fotos', t: 'fotos' },
      { k: 'destacada', l: 'Mostrar en el Inicio', t: 'si_no' }
    ] },
    experiencias: { titulo: 'Experiencias', singular: 'experiencia', campos: [
      { k: 'titulo', l: 'Título', t: 'texto', req: true },
      { k: 'hora', l: 'Hora en "Un día en la finca"', t: 'texto', ayuda: 'Ej.: 17:00. Déjalo vacío si no va en la línea del día.' },
      { k: 'descripcion', l: 'Descripción', t: 'largo' },
      { k: 'foto', l: 'Foto', t: 'foto' },
      { k: 'destacada', l: 'Mostrar en el Inicio', t: 'si_no' }
    ] },
    planes: { titulo: 'Planes', singular: 'plan', campos: [
      { k: 'nombre', l: 'Nombre', t: 'texto', req: true },
      { k: 'precio', l: 'Precio (pesos)', t: 'numero' },
      { k: 'precio_desayuno', l: 'Precio con desayuno (opcional)', t: 'numero' },
      { k: 'unidad', l: 'Unidad', t: 'texto', ayuda: 'Ej.: por persona / noche' },
      { k: 'incluye', l: 'Incluye (uno por línea)', t: 'lista' },
      { k: 'destacado', l: 'Destacado (fondo oscuro)', t: 'si_no' },
      { k: 'boton', l: 'Botón lleva a', t: 'select', op: [['reservar', 'Reservar'], ['eventos', 'Cotizar evento']] }
    ] },
    temporadas: { titulo: 'Temporadas y tarifas', singular: 'temporada', campos: [
      { k: 'nombre', l: 'Temporada', t: 'texto', req: true },
      { k: 'fechas', l: 'Fechas', t: 'texto' },
      { k: 'persona', l: 'Por persona', t: 'texto' },
      { k: 'pareja', l: 'Pareja', t: 'texto' },
      { k: 'finca', l: 'Finca completa', t: 'texto' }
    ] },
    eventos: { titulo: 'Tipos de evento', singular: 'tipo de evento', campos: [
      { k: 'titulo', l: 'Título', t: 'texto', req: true },
      { k: 'descripcion', l: 'Descripción corta', t: 'texto' },
      { k: 'foto', l: 'Foto', t: 'foto' }
    ] },
    espacios: { titulo: 'Espacios para eventos', singular: 'espacio', campos: [
      { k: 'nombre', l: 'Nombre', t: 'texto', req: true },
      { k: 'detalle', l: 'Detalle o aforo', t: 'texto' }
    ] },
    instalaciones: { titulo: 'Instalaciones', singular: 'instalación', campos: [
      { k: 'nombre', l: 'Nombre', t: 'texto', req: true },
      { k: 'descripcion', l: 'Descripción', t: 'texto' }
    ] },
    normas: { titulo: 'Normas de la casa', singular: 'norma', campos: [
      { k: 'titulo', l: 'Norma', t: 'texto', req: true },
      { k: 'detalle', l: 'Detalle', t: 'texto' }
    ] },
    lugares: { titulo: 'Alrededores', singular: 'lugar', campos: [
      { k: 'nombre', l: 'Lugar', t: 'texto', req: true },
      { k: 'distancia', l: 'Distancia', t: 'texto', ayuda: 'Ej.: 17 km' },
      { k: 'descripcion', l: 'Descripción corta', t: 'texto' },
      { k: 'foto', l: 'Foto (opcional)', t: 'foto' }
    ] },
    galeria: { titulo: 'Galería', singular: 'foto', campos: [
      { k: 'titulo', l: 'Título', t: 'texto', req: true },
      { k: 'categoria', l: 'Categoría', t: 'select', op: [['finca', 'La finca'], ['habitaciones', 'Habitaciones'], ['agua', 'Piscina y jacuzzi'], ['kiosco', 'Kiosco y juegos'], ['eventos', 'Eventos']] },
      { k: 'foto', l: 'Foto', t: 'foto', req: true }
    ] },
    preguntas: { titulo: 'Preguntas frecuentes', singular: 'pregunta', campos: [
      { k: 'tema', l: 'Tema', t: 'select', op: [['reservas', 'Reservas y pagos'], ['estadia', 'La estadía'], ['mascotas', 'Mascotas y niños'], ['eventos', 'Eventos y grupos'], ['llegada', 'Cómo llegar']] },
      { k: 'pregunta', l: 'Pregunta', t: 'texto', req: true },
      { k: 'respuesta', l: 'Respuesta', t: 'largo' }
    ] },
    opiniones: { titulo: 'Opiniones', singular: 'opinión', campos: [
      { k: 'nombre', l: 'Nombre', t: 'texto', req: true },
      { k: 'ciudad', l: 'Ciudad', t: 'texto' },
      { k: 'fecha', l: 'Mes y año', t: 'texto' },
      { k: 'texto', l: 'Opinión', t: 'largo' }
    ] }
  };

  /* ---------- Datos generales (cabecera, pie, contacto) ---------- */
  var GLOBALES = [
    { k: 'global.whatsapp', l: 'WhatsApp (solo números, con 57)', t: 'texto', ayuda: 'Ej.: 573001234567' },
    { k: 'global.mensaje_whatsapp', l: 'Mensaje inicial de WhatsApp', t: 'texto' },
    { k: 'global.telefono', l: 'Teléfono para llamadas', t: 'texto' },
    { k: 'global.correo', l: 'Correo', t: 'texto' },
    { k: 'global.direccion', l: 'Dirección', t: 'texto' },
    { k: 'global.maps_url', l: 'Enlace de Google Maps', t: 'texto' },
    { k: 'global.maps_embed', l: 'Enlace para insertar el mapa (opcional)', t: 'texto', ayuda: 'En Google Maps: Compartir > Insertar un mapa > copia solo la dirección que va en src="…"' },
    { k: 'global.instagram', l: 'Instagram', t: 'texto' },
    { k: 'global.facebook', l: 'Facebook', t: 'texto' },
    { k: 'global.horario', l: 'Horario de atención', t: 'texto' },
    { k: 'global.hora_entrada', l: 'Hora de entrada', t: 'texto' },
    { k: 'global.hora_salida', l: 'Hora de salida', t: 'texto' },
    { k: 'global.anticipo', l: 'Anticipo para confirmar', t: 'texto', ayuda: 'Ej.: 50 %' },
    { k: 'global.precio_desayuno', l: 'Precio del desayuno por persona', t: 'numero' },
    { k: 'global.politica_cancelacion', l: 'Política de cancelación', t: 'largo' },
    { k: 'global.rnt', l: 'Número de RNT', t: 'texto' },
    { k: 'pie.frase', l: 'Frase del pie de página', t: 'texto' }
  ];

  var PAGINAS = [
    ['index.html', 'Inicio'], ['habitaciones.html', 'Habitaciones'], ['experiencias.html', 'Experiencias'], ['la-finca.html', 'La finca'],
    ['eventos.html', 'Eventos y pasadías'], ['planes.html', 'Planes y tarifas'], ['galeria.html', 'Galería'], ['ubicacion.html', 'Ubicación'],
    ['preguntas.html', 'Preguntas'], ['contacto.html', 'Contacto'], ['reservar.html', 'Reservar']
  ];

  /* ---------- Utilidades ---------- */
  function pesos(n) { n = Math.round(Number(n) || 0); return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function escapar(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function formatear(t) { return escapar(t).replace(/\*([^*\n]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>'); }
  function iso(d) { var m = d.getMonth() + 1, x = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (x < 10 ? '0' : '') + x; }
  function deIso(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function noches(a, b) { return Math.round((deIso(b) - deIso(a)) / 86400000); }
  function fechaCorta(s) { if (!s) return ''; return deIso(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function uid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function plano(item) { var o = Object.assign({}, item.datos || {}); o.id = item.id; o.orden = item.orden || 0; o.activo = item.activo !== false; return o; }
  function porOrden(a, b) { return (a.orden || 0) - (b.orden || 0); }
  function textoListas(v) { return Array.isArray(v) ? v : String(v || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean); }

  function calcularTotal(hab, n, huespedes, desayuno, precioDesayuno) {
    if (!hab || !n) return 0;
    var base = hab.modo_precio === 'persona' ? (Number(hab.precio) || 0) * huespedes * n : (Number(hab.precio) || 0) * n;
    var extra = desayuno ? (Number(precioDesayuno) || 0) * huespedes * n : 0;
    return base + extra;
  }

  /* Días ocupados de una habitación según la lista de disponibilidad */
  /* Agrupa habitaciones con el mismo "grupo" (tipo público). Cada grupo usa los datos de su primera habitación. */
  function agrupar(habitaciones) {
    var grupos = [], porClave = {};
    (habitaciones || []).forEach(function (h) {
      var clave = String(h.grupo || '').trim().toLowerCase() || ('id:' + h.id);
      var g = porClave[clave];
      if (!g) { g = porClave[clave] = { id: h.id, nombre: String(h.grupo || '').trim() || h.nombre, rep: h, miembros: [] }; grupos.push(g); }
      g.miembros.push(h);
    });
    grupos.forEach(function (g) { g.total = g.miembros.length; g.destacada = g.miembros.some(function (h) { return h.destacada; }); });
    return grupos;
  }
  function grupoDe(habId, habitaciones) {
    return agrupar(habitaciones).filter(function (g) { return g.miembros.some(function (h) { return h.id === habId; }); })[0] || null;
  }
  /* Noches en que no queda ninguna habitación libre del grupo */
  function diasOcupadosGrupo(grupo, lista, habitaciones) {
    var porHab = grupo.miembros.map(function (h) { return diasOcupados(h.id, lista, habitaciones); }), set = {};
    Object.keys(porHab[0] || {}).forEach(function (f) { if (porHab.every(function (o) { return o[f]; })) set[f] = true; });
    return set;
  }

  function diasOcupados(habId, lista, habitaciones) {
    var fincas = habitaciones.filter(function (h) { return h.tipo === 'finca'; }).map(function (h) { return h.id; });
    var esFinca = fincas.indexOf(habId) !== -1;
    var set = {};
    (lista || []).forEach(function (r) {
      if (esFinca || !r.habitacion_id || r.habitacion_id === habId || fincas.indexOf(r.habitacion_id) !== -1) set[r.fecha] = true;
    });
    return set;
  }

  /* ---------- Modo prueba (navegador) ---------- */
  var base = null;
  function baseInicial() {
    if (!base) base = fetch('/datos/inicial.json', { cache: 'no-cache' }).then(function (r) { return r.json(); });
    return base;
  }
  function leerPrueba() { try { return JSON.parse(localStorage.getItem(CLAVE_PRUEBA) || '{}') || {}; } catch (e) { return {}; } }
  function guardarPrueba(d) { try { localStorage.setItem(CLAVE_PRUEBA, JSON.stringify(d)); return true; } catch (e) { return false; } }
  function estadoPrueba() {
    return baseInicial().then(function (b) {
      var p = leerPrueba();
      return {
        ajustes: Object.assign({}, b.ajustes || {}, p.ajustes || {}),
        colecciones: p.colecciones || b.colecciones || [],
        reservas: p.reservas || [], bloqueos: p.bloqueos || [], solicitudes: p.solicitudes || []
      };
    });
  }
  function mutarPrueba(fn) {
    return estadoPrueba().then(function (e) {
      var p = leerPrueba();
      var r = fn(e, p);
      if (!guardarPrueba(p)) throw new Error('El navegador no tiene más espacio para el modo prueba. Usa fotos más livianas o conecta Supabase.');
      return r;
    });
  }
  function codigoReserva(llegada) { return 'NF-' + llegada.slice(5, 7) + llegada.slice(8, 10) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }
  function rangoDias(desde, hasta) { var out = [], d = deIso(desde), h = deIso(hasta); while (d < h) { out.push(iso(d)); d.setDate(d.getDate() + 1); } return out; }

  /* ---------- Lectura pública ---------- */
  function ajustes() {
    if (!sb) return estadoPrueba().then(function (e) { return e.ajustes; });
    return Promise.all([baseInicial().catch(function () { return {}; }), sb.from('ajustes').select('clave,valor')]).then(function (r) {
      if (r[1].error) throw r[1].error;
      var o = Object.assign({}, (r[0] && r[0].ajustes) || {});
      r[1].data.forEach(function (x) { if (x.valor !== '') o[x.clave] = x.valor; });
      return o;
    });
  }
  function coleccion(tipo, opciones) {
    var todas = opciones && opciones.todas;
    if (!sb) return estadoPrueba().then(function (e) {
      return e.colecciones.filter(function (i) { return i.tipo === tipo && (todas || i.activo !== false); }).map(plano).sort(porOrden);
    });
    var q = sb.from('colecciones').select('*').eq('tipo', tipo).order('orden');
    if (!todas) q = q.eq('activo', true);
    return q.then(function (r) { if (r.error) throw r.error; return r.data.map(plano); });
  }
  function disponibilidad(desde, hasta) {
    if (!sb) return estadoPrueba().then(function (e) {
      var out = [];
      e.reservas.filter(function (r) { return r.estado === 'pendiente' || r.estado === 'confirmada'; }).forEach(function (r) {
        rangoDias(r.llegada, r.salida).forEach(function (f) { if (f >= desde && f < hasta) out.push({ habitacion_id: r.habitacion_id, fecha: f }); });
      });
      e.bloqueos.forEach(function (b) { rangoDias(b.desde, b.hasta).forEach(function (f) { if (f >= desde && f < hasta) out.push({ habitacion_id: b.habitacion_id || null, fecha: f }); }); });
      return out;
    });
    return sb.rpc('disponibilidad', { p_desde: desde, p_hasta: hasta }).then(function (r) { if (r.error) throw r.error; return r.data || []; });
  }
  function crearReserva(p) {
    if (sb) return sb.rpc('crear_reserva', { p: p }).then(function (r) { if (r.error) throw new Error(r.error.message); return r.data; });
    return Promise.all([coleccion('habitaciones'), disponibilidad(p.llegada, p.salida), ajustes()]).then(function (x) {
      var habs = x[0], hab = habs.filter(function (h) { return h.id === p.habitacion_id; })[0];
      if (!hab) throw new Error('La habitación ya no está disponible.');
      var huespedes = (Number(p.adultos) || 0) + (Number(p.ninos) || 0);
      if (hab.capacidad && huespedes > hab.capacidad) throw new Error('Son más personas de las que caben en esta habitación.');
      var ocup = diasOcupados(hab.id, x[1], habs);
      if (rangoDias(p.llegada, p.salida).some(function (f) { return ocup[f]; })) throw new Error('Esas fechas ya no están libres. Elige otras.');
      var total = calcularTotal(hab, noches(p.llegada, p.salida), huespedes, p.desayuno, x[2]['global.precio_desayuno']);
      var codigo = codigoReserva(p.llegada);
      return mutarPrueba(function (e, store) {
        var r = Object.assign({}, p, { id: uid(), codigo: codigo, creado: new Date().toISOString(), estado: 'pendiente', habitacion_nombre: hab.nombre, total: total, anticipo_pagado: 0, origen: 'web' });
        store.reservas = (e.reservas || []).concat([r]);
        return { codigo: codigo, total: total };
      });
    });
  }
  function crearSolicitud(p) {
    if (sb) return sb.rpc('crear_solicitud', { p: p }).then(function (r) { if (r.error) throw new Error(r.error.message); return r.data; });
    return mutarPrueba(function (e, store) {
      store.solicitudes = (e.solicitudes || []).concat([Object.assign({ id: uid(), creado: new Date().toISOString(), estado: 'nueva' }, p)]);
      return true;
    });
  }

  /* ---------- Panel de administración ---------- */
  var admin = {
    entrar: function (correo, clave) {
      if (!sb) {
        if (clave !== 'nuevofuturo') return Promise.reject(new Error('En modo prueba la clave es: nuevofuturo'));
        try { sessionStorage.setItem('nf-prueba-sesion', '1'); } catch (e) {}
        return Promise.resolve(true);
      }
      return sb.auth.signInWithPassword({ email: correo, password: clave }).then(function (r) { if (r.error) throw new Error('Correo o clave incorrectos.'); return true; });
    },
    salir: function () { if (!sb) { try { sessionStorage.removeItem('nf-prueba-sesion'); } catch (e) {} return Promise.resolve(); } return sb.auth.signOut(); },
    sesion: function () {
      if (!sb) { var ok = false; try { ok = sessionStorage.getItem('nf-prueba-sesion') === '1'; } catch (e) {} return Promise.resolve(ok ? { correo: 'modo prueba' } : null); }
      return sb.auth.getSession().then(function (r) { var s = r.data && r.data.session; return s ? { correo: s.user.email, id: s.user.id } : null; });
    },
    esAdmin: function () {
      if (!sb) return Promise.resolve(true);
      return sb.rpc('es_admin').then(function (r) { return !r.error && r.data === true; });
    },
    guardarAjustes: function (obj) {
      if (!sb) return mutarPrueba(function (e, store) { store.ajustes = Object.assign({}, store.ajustes || {}, obj); return true; });
      var filas = Object.keys(obj).map(function (k) { return { clave: k, valor: obj[k] == null ? '' : String(obj[k]), actualizado: new Date().toISOString() }; });
      return sb.from('ajustes').upsert(filas).then(function (r) { if (r.error) throw r.error; return true; });
    },
    ajustesGuardados: function () {
      if (!sb) return Promise.resolve(leerPrueba().ajustes || {});
      return sb.from('ajustes').select('clave,valor').then(function (r) { if (r.error) throw r.error; var o = {}; r.data.forEach(function (x) { o[x.clave] = x.valor; }); return o; });
    },
    listar: function (tipo) { return coleccion(tipo, { todas: true }); },
    guardarItem: function (tipo, item) {
      var fila = { id: item.id || uid(), tipo: tipo, datos: item.datos, orden: item.orden || 0, activo: item.activo !== false };
      if (!sb) return mutarPrueba(function (e, store) {
        var lista = (store.colecciones || e.colecciones).slice();
        var i = lista.findIndex(function (x) { return x.id === fila.id; });
        if (i === -1) lista.push(fila); else lista[i] = fila;
        store.colecciones = lista; return fila;
      });
      return sb.from('colecciones').upsert(fila).select().then(function (r) { if (r.error) throw r.error; return r.data[0]; });
    },
    borrarItem: function (id) {
      if (!sb) return mutarPrueba(function (e, store) { store.colecciones = (store.colecciones || e.colecciones).filter(function (x) { return x.id !== id; }); return true; });
      return sb.from('colecciones').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; return true; });
    },
    reservas: function () {
      if (!sb) return estadoPrueba().then(function (e) { return e.reservas.slice().sort(function (a, b) { return a.llegada < b.llegada ? -1 : 1; }); });
      return sb.from('reservas').select('*').order('llegada').then(function (r) { if (r.error) throw r.error; return r.data; });
    },
    guardarReserva: function (res) {
      if (!res.id) { res.id = uid(); res.codigo = res.codigo || codigoReserva(res.llegada); res.creado = new Date().toISOString(); }
      if (!sb) return mutarPrueba(function (e, store) {
        var l = (store.reservas || e.reservas).slice(); var i = l.findIndex(function (x) { return x.id === res.id; });
        if (i === -1) l.push(res); else l[i] = res; store.reservas = l; return res;
      });
      return sb.from('reservas').upsert(res).select().then(function (r) { if (r.error) throw r.error; return r.data[0]; });
    },
    borrarReserva: function (id) {
      if (!sb) return mutarPrueba(function (e, store) { store.reservas = (store.reservas || e.reservas).filter(function (x) { return x.id !== id; }); return true; });
      return sb.from('reservas').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; return true; });
    },
    bloqueos: function () {
      if (!sb) return estadoPrueba().then(function (e) { return e.bloqueos; });
      return sb.from('bloqueos').select('*').order('desde').then(function (r) { if (r.error) throw r.error; return r.data; });
    },
    guardarBloqueo: function (b) {
      b.id = b.id || uid();
      if (!sb) return mutarPrueba(function (e, store) { store.bloqueos = (store.bloqueos || e.bloqueos).concat([b]); return b; });
      return sb.from('bloqueos').insert(b).then(function (r) { if (r.error) throw r.error; return b; });
    },
    borrarBloqueo: function (id) {
      if (!sb) return mutarPrueba(function (e, store) { store.bloqueos = (store.bloqueos || e.bloqueos).filter(function (x) { return x.id !== id; }); return true; });
      return sb.from('bloqueos').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; return true; });
    },
    solicitudes: function () {
      if (!sb) return estadoPrueba().then(function (e) { return e.solicitudes.slice().reverse(); });
      return sb.from('solicitudes').select('*').order('creado', { ascending: false }).then(function (r) { if (r.error) throw r.error; return r.data; });
    },
    estadoSolicitud: function (id, estado) {
      if (!sb) return mutarPrueba(function (e, store) { store.solicitudes = (store.solicitudes || e.solicitudes).map(function (s) { return s.id === id ? Object.assign({}, s, { estado: estado }) : s; }); return true; });
      return sb.from('solicitudes').update({ estado: estado }).eq('id', id).then(function (r) { if (r.error) throw r.error; return true; });
    },
    subirFoto: function (archivo, carpeta) {
      return reducirImagen(archivo, sb ? 2000 : 1100, sb ? 0.85 : 0.72).then(function (blob) {
        if (!sb) return new Promise(function (ok) { var fr = new FileReader(); fr.onload = function () { ok(fr.result); }; fr.readAsDataURL(blob); });
        var ruta = (carpeta || 'general') + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + '.jpg';
        return sb.storage.from(BUCKET).upload(ruta, blob, { contentType: 'image/jpeg', upsert: false }).then(function (r) {
          if (r.error) throw r.error;
          return sb.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
        });
      });
    },
    reiniciarPrueba: function () { try { localStorage.removeItem(CLAVE_PRUEBA); } catch (e) {} },
    exportarPrueba: function () { return estadoPrueba(); }
  };

  function reducirImagen(archivo, max, calidad) {
    return new Promise(function (ok, mal) {
      var url = URL.createObjectURL(archivo), img = new Image();
      img.onload = function () {
        var k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? ok(b) : mal(new Error('No se pudo procesar la imagen.')); }, 'image/jpeg', calidad);
      };
      img.onerror = function () { mal(new Error('El archivo no es una imagen válida.')); };
      img.src = url;
    });
  }

  window.NF = {
    modo: sb ? 'supabase' : 'prueba', sb: sb,
    ESQUEMAS: ESQUEMAS, GLOBALES: GLOBALES, PAGINAS: PAGINAS,
    ajustes: ajustes, coleccion: coleccion, disponibilidad: disponibilidad, crearReserva: crearReserva, crearSolicitud: crearSolicitud,
    admin: admin,
    util: { pesos: pesos, escapar: escapar, formatear: formatear, iso: iso, deIso: deIso, noches: noches, fechaCorta: fechaCorta, uid: uid, calcularTotal: calcularTotal, diasOcupados: diasOcupados, agrupar: agrupar, grupoDe: grupoDe, diasOcupadosGrupo: diasOcupadosGrupo, textoListas: textoListas, rangoDias: rangoDias }
  };
})();
