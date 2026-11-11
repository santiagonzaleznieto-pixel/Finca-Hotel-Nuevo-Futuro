# Finca Hotel Nuevo Futuro · Sitio web y panel

Sitio web de la Finca Hotel Nuevo Futuro (Circasia, Quindío), con reservas en línea y un panel de administración para editar todo el contenido.

- **Sitio público:** HTML, CSS y JavaScript sin paso de compilación. Se publica tal cual en Vercel.
- **Datos:** Supabase (base de datos, usuarios y fotos). Mientras no se conecte, el sitio funciona en **modo prueba**.
- **Panel:** `/admin`. Desde ahí se manejan las reservas, el calendario, las solicitudes, las habitaciones, las fotos y los textos.

## Estructura

```
index.html, habitaciones.html, habitacion.html, experiencias.html, la-finca.html,
eventos.html, planes.html, galeria.html, ubicacion.html, preguntas.html,
contacto.html, reservar.html, 404.html      → páginas públicas
admin/index.html                            → panel de administración
assets/css/estilos.css                      → estilos del sitio
assets/css/movimiento.css                   → animaciones (scroll, entradas, bienvenida)
assets/css/admin.css                        → estilos del panel
assets/js/config.js                         → claves de Supabase (lo único que hay que llenar)
assets/js/datos.js                          → capa de datos (Supabase o modo prueba)
assets/js/sitio.js                          → cabecera, pie, WhatsApp y textos editables
assets/js/paginas.js                        → contenido dinámico de cada página
assets/js/admin.js                          → lógica del panel
assets/img/fotos/                           → fotos de prueba
datos/inicial.json                          → contenido de ejemplo (modo prueba)
supabase/esquema.sql                        → tablas, seguridad y funciones de la base de datos
supabase/datos-iniciales.sql                → el mismo contenido de ejemplo para Supabase
herramientas/generar_datos.py               → regenera los dos archivos de datos de ejemplo
```

## Modo prueba (como está ahora)

Si `assets/js/config.js` no tiene claves, el sitio:

- muestra el contenido de `datos/inicial.json`;
- deja entrar al panel con la clave **`nuevofuturo`**;
- guarda los cambios del panel **solo en el navegador de quien los hace** (los visitantes no los ven);
- guarda las reservas y mensajes de los visitantes **solo en el navegador del visitante**. Por eso, al terminar una reserva, se le pide enviar el resumen por WhatsApp.

Sirve para revisar el diseño y probar el panel. Para recibir reservas reales hay que conectar Supabase.

## Conectar Supabase (pasar a producción)

1. Crea un proyecto en [supabase.com](https://supabase.com) (región recomendada: São Paulo).
2. Abre **SQL Editor**, pega todo `supabase/esquema.sql` y ejecútalo. Después haz lo mismo con `supabase/datos-iniciales.sql`.
3. En **Authentication → Users → Add user**, crea el usuario del administrador (correo y clave).
4. En **SQL Editor**, hazlo administrador (cambia el correo):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'correo-del-admin@ejemplo.com';
   ```
5. En **Project Settings → API**, copia la *Project URL* y la clave pública (*anon* o *publishable*). Pégalas en `assets/js/config.js`:
   ```js
   window.NF_CONFIG = {
     supabaseUrl: 'https://xxxxxxxx.supabase.co',
     supabaseKey: 'eyJ... o sb_publishable_...',
     bucket: 'fotos'
   };
   ```
   Esa clave es pública por diseño. La seguridad la dan las reglas (RLS) de `esquema.sql`: los visitantes solo pueden leer el contenido visible y crear reservas o mensajes a través de funciones que validan los datos; solo los administradores ven y editan lo demás.
6. Guarda, haz commit y push. Vercel publica solo.

> Nunca pongas en `config.js` la clave `service_role` / `secret`.

## Cómo funcionan las reservas

- El visitante elige fechas, huéspedes y habitación. El sitio solo muestra habitaciones libres y con capacidad suficiente.
- La función `crear_reserva` de la base de datos vuelve a validar todo (fechas, capacidad, cruces), calcula el total y guarda la reserva como **pendiente**.
- Reservar la **Finca completa** bloquea todas las habitaciones en esas noches, y cualquier habitación reservada bloquea la Finca completa.
- En el panel, la reserva se confirma cuando llega el anticipo. Si se cancela, las fechas quedan libres de nuevo.
- Las fechas bloqueadas desde el panel (mantenimiento, uso propio) tampoco se pueden reservar.

## Editar el sitio

Todo se edita desde el panel, sin tocar código:

| En el panel | Qué cambia |
| --- | --- |
| Contenido del sitio | Habitaciones, experiencias, planes, temporadas, eventos, espacios, instalaciones, normas, alrededores, galería, preguntas y opiniones |
| Textos y fotos de páginas | Títulos, textos y fotos fijas de cada página (escribe `*así*` para cursiva) |
| Datos generales | WhatsApp, teléfono, correo, dirección, mapa, redes, horarios, anticipo, desayuno, política de cancelación, RNT |

Si agregas un texto editable nuevo a una página, ponle `data-cms="pagina.clave"` y `data-etiqueta="Nombre para el panel"`; el panel lo encuentra solo.

## Probar en tu computador

```bash
python -m http.server 8080
```

y abre `http://localhost:8080`. El panel está en `http://localhost:8080/admin/`.

## Pendientes antes de lanzar

- Fotos propias y en alta resolución (las actuales son de prueba, tomadas del listado de Asoatur y del Instagram de la finca; hay que confirmar el permiso de uso).
- Datos reales: WhatsApp, teléfono, correo, horario, hora de salida, anticipo, medios de pago, política de cancelación, RNT, precios por temporada y aforo de los espacios.
- Revisar con la finca el texto de tratamiento de datos (Ley 1581 de 2012).
- Dominio propio (se configura en Vercel → Settings → Domains). Al conectarlo, reemplaza `https://finca-hotel-nuevo-futuro.vercel.app` por el dominio nuevo en las etiquetas `og:` y `canonical` de cada página (buscar y reemplazar en los `.html`). La imagen para compartir en WhatsApp y redes es `assets/img/compartir.jpg` (1200 × 630).
