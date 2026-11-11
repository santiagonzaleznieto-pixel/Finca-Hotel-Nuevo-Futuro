"""Genera los datos de ejemplo del sitio.

Salidas:
  datos/inicial.json            -> lo que muestra el sitio en "modo prueba"
  supabase/datos-iniciales.sql  -> los mismos datos para cargar en Supabase

Uso:  python3 herramientas/generar_datos.py
"""
import json, uuid, os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = lambda n: '/assets/img/fotos/%s.jpg' % n
NS = uuid.UUID('6d1f3a52-4c3e-4bde-9a0f-7c1e2b9d0a11')

def item(tipo, i, datos, activo=True):
    return {'id': str(uuid.uuid5(NS, '%s-%d' % (tipo, i))), 'tipo': tipo, 'orden': i, 'activo': activo, 'datos': datos}

COMODIDADES = ['Baño privado con agua caliente', 'Ropa de cama y toallas', 'Wifi', 'Acceso a piscina y jacuzzi']
hab = []
def h(nombre, grupo, tipo, cap, camas, detalle, precio, modo, fotos, dest=False, desc=None):
    if desc is None:
        desc = {'pareja': 'Una habitación tranquila para dos, con todo lo necesario para descansar después de un día de piscina y montaña.',
                'familiar': 'Pensada para familias: espacio para todos y acceso directo a las zonas sociales de la finca.',
                'grupo': 'La habitación más amplia de la finca, ideal para grupos de amigos o familias grandes.',
                'finca': 'Las 14 habitaciones y todas las zonas sociales para tu grupo, sin compartir con nadie más.'}[tipo]
    hab.append({'nombre': nombre, 'grupo': grupo, 'tipo': tipo, 'capacidad': cap, 'camas': camas, 'detalle': detalle, 'descripcion': desc,
                'precio': precio, 'modo_precio': modo, 'comodidades': COMODIDADES if tipo != 'finca' else ['14 habitaciones', 'Piscina y jacuzzi climatizado', 'Kiosco con cocina y asador', 'Zona de fogata y juegos'],
                'fotos': [F(x) for x in fotos], 'destacada': dest})
Q, FA, V, B = 'habitacion-queen', 'habitacion-familiar', 'habitacion-ventana', 'bano'
# Datos de ejemplo: 14 habitaciones en 3 tipos, más la finca completa. La finca los reemplaza desde el panel.
for i, n in enumerate(['Colibrí', 'Yarumo', 'Orquídea', 'Toche', 'Palma de cera', 'Mirla', 'Heliconia', 'Carriquí', 'Guayacán']):
    h(n, 'Habitación doble', 'pareja', 2, 'Cama doble o queen', 'Baño privado', 200000, 'noche', [Q, B, 'jardin-montana'], i == 0)
for i, n in enumerate(['Barranquero', 'Cafeto', 'Tucán', 'Bahareque']):
    h(n, 'Habitación familiar', 'familiar', 4, 'Cama doble y camarote', 'Baño privado', 70000, 'persona', [FA, B, 'corredor'], i == 0)
h('Guadua', 'Habitación de grupo', 'grupo', 8, 'Doble y 3 camarotes', 'La más amplia', 70000, 'persona', [V, FA, B], True)
h('Finca completa', 'Finca completa', 'finca', 40, '14 habitaciones', 'Hasta 40 personas, en exclusiva', 2800000, 'noche', ['piscina-casa', 'casa-cesped', 'kiosco'])

colecciones = [item('habitaciones', i, d) for i, d in enumerate(hab)]

def lote(tipo, filas):
    colecciones.extend(item(tipo, i, d) for i, d in enumerate(filas))

lote('experiencias', [
    {'titulo': 'Neblina y café', 'hora': '6:30', 'descripcion': 'La montaña amanece cubierta. Café en el corredor mientras la neblina se levanta sobre los cafetales.', 'foto': F('corredor'), 'destacada': False},
    {'titulo': 'Tarde de piscina', 'hora': '10:00', 'descripcion': 'Agua para los niños y para los grandes, con las montañas de fondo.', 'foto': F('piscina-amplia'), 'destacada': True},
    {'titulo': 'Asado en el kiosco', 'hora': '13:00', 'descripcion': 'Cocina propia, asador y mesa larga para el grupo.', 'foto': F('cocina-asador'), 'destacada': False},
    {'titulo': 'Jacuzzi climatizado', 'hora': '17:00', 'descripcion': 'Abierto de 5:00 a 10:00 p. m., justo cuando la montaña refresca.', 'foto': F('piscina-jacuzzi'), 'destacada': True},
    {'titulo': 'Noche de fogata', 'hora': '20:00', 'descripcion': 'Picnic, historias y cielo de montaña alrededor del fuego.', 'foto': F('pergola-fogata'), 'destacada': True},
    {'titulo': 'Juegos de siempre', 'hora': '', 'descripcion': 'Billar, ping-pong, sapo y juegos infantiles.', 'foto': F('billar'), 'destacada': False},
])
lote('planes', [
    {'nombre': 'Por persona', 'precio': 70000, 'precio_desayuno': 82000, 'unidad': 'por persona / noche', 'incluye': ['Habitación familiar o de grupo', 'Piscina, jacuzzi y juegos', 'Kiosco con cocina y asador'], 'destacado': False, 'boton': 'reservar'},
    {'nombre': 'Escapada en pareja', 'precio': 200000, 'precio_desayuno': 224000, 'unidad': 'por noche, habitación para dos', 'incluye': ['Habitación privada', 'Jacuzzi de 5:00 a 10:00 p. m.', 'Zonas sociales de la finca'], 'destacado': False, 'boton': 'reservar'},
    {'nombre': 'Finca completa', 'precio': 2800000, 'precio_desayuno': None, 'unidad': 'por noche, hasta 40 personas', 'incluye': ['Las 14 habitaciones', 'Todas las zonas, en exclusiva', 'Solo alojamiento'], 'destacado': True, 'boton': 'eventos'},
    {'nombre': 'Pasadía', 'precio': 22000, 'precio_desayuno': None, 'unidad': 'por persona + seguro', 'incluye': ['De 9:00 a. m. a 5:00 p. m.', 'Mínimo 10 personas', 'Uso de zonas sociales'], 'destacado': False, 'boton': 'eventos'},
])
lote('temporadas', [
    {'nombre': 'Regular', 'fechas': 'Resto del año', 'persona': '$70.000', 'pareja': '$200.000', 'finca': '$2.800.000'},
    {'nombre': 'Alta', 'fechas': 'Diciembre, enero, Semana Santa y mitad de año', 'persona': 'Por definir', 'pareja': 'Por definir', 'finca': 'Por definir'},
    {'nombre': 'Puentes', 'fechas': 'Fines de semana con festivo', 'persona': 'Por definir', 'pareja': 'Por definir', 'finca': 'Por definir'},
])
lote('eventos', [
    {'titulo': 'Cumpleaños', 'descripcion': 'Fogata, asado y torta en el kiosco', 'foto': F('ig-mesa-postres')},
    {'titulo': 'Aniversarios', 'descripcion': 'Cena para dos o para toda la familia', 'foto': F('ig-decoracion')},
    {'titulo': 'Grados', 'descripcion': 'El fin de semana para celebrar el logro', 'foto': F('piscina-casa')},
    {'titulo': 'Integraciones de empresa', 'descripcion': 'Día de piscina, juegos y almuerzo', 'foto': F('salon-kiosco')},
    {'titulo': 'Reuniones familiares', 'descripcion': 'Las 14 habitaciones para la familia entera', 'foto': F('terraza-lounge')},
    {'titulo': 'Bodas', 'descripcion': 'Ceremonia en el jardín y fiesta en el salón', 'foto': F('ig-boda-candelabro')},
])
lote('espacios', [
    {'nombre': 'Kiosco con cocina', 'detalle': 'Aforo por confirmar'}, {'nombre': 'Salón del kiosco', 'detalle': 'Aforo por confirmar'},
    {'nombre': 'Zona de piscina', 'detalle': 'Ideal para pasadías'}, {'nombre': 'Zona de fogata', 'detalle': 'Para cerrar la noche'},
])
lote('instalaciones', [
    {'nombre': 'Piscina', 'descripcion': 'Con zona para niños y vista a las montañas.'},
    {'nombre': 'Jacuzzi climatizado', 'descripcion': 'Abierto de 5:00 a 10:00 p. m. todos los días.'},
    {'nombre': 'Kiosco con cocina', 'descripcion': 'Asador, cocina propia y mesa larga para el grupo.'},
    {'nombre': 'Zona de fogata', 'descripcion': 'Pérgola con brasero para cerrar el día.'},
    {'nombre': 'Billar y ping-pong', 'descripcion': 'La sala de juegos para los torneos del grupo.'},
    {'nombre': 'Sapo y juegos infantiles', 'descripcion': 'El juego de siempre y espacio para los pequeños.'},
    {'nombre': 'Mascotas bienvenidas', 'descripcion': 'Perros y gatos, sin costo adicional.'},
    {'nombre': 'Parqueadero', 'descripcion': 'Dentro de la finca, sin costo para huéspedes.'},
])
lote('normas', [
    {'titulo': 'Horario de silencio', 'detalle': 'Por definir'}, {'titulo': 'Piscina', 'detalle': 'Niños siempre con un adulto'},
    {'titulo': 'Mascotas', 'detalle': 'Bienvenidas; avísanos al reservar'}, {'titulo': 'Visitantes', 'detalle': 'Por definir'},
    {'titulo': 'Menores de edad', 'detalle': 'Con documento y acompañados por sus padres'},
])
lote('lugares', [
    {'nombre': 'Armenia', 'distancia': '3 km', 'descripcion': 'La capital del Quindío.', 'foto': ''},
    {'nombre': 'Museo del Oro Quimbaya', 'distancia': '3,7 km', 'descripcion': 'Orfebrería quimbaya, en Armenia.', 'foto': ''},
    {'nombre': 'Jardín Botánico del Quindío', 'distancia': '10 km', 'descripcion': 'Bosque, guadua y mariposario en Calarcá.', 'foto': ''},
    {'nombre': 'Valle de Cocora', 'distancia': '17 km', 'descripcion': 'Las palmas de cera más altas del mundo.', 'foto': ''},
    {'nombre': 'Parque del Café', 'distancia': '20 km', 'descripcion': 'Atracciones y cultura cafetera en Montenegro.', 'foto': ''},
    {'nombre': 'Aeropuerto El Edén', 'distancia': '22 a 27 km', 'descripcion': 'Vuelos nacionales.', 'foto': ''},
])
gal = [('Piscina y casa principal','agua','piscina-casa'),('Habitación queen','habitaciones','habitacion-queen'),('Pérgola con brasero','finca','pergola-fogata'),
 ('Fachada y jardín','finca','casa-cesped'),('Piscina con jacuzzi','agua','piscina-jacuzzi'),
 ('El kiosco','kiosco','kiosco'),('Mesa de postres','eventos','ig-mesa-postres'),('Habitación familiar','habitaciones','habitacion-familiar'),
 ('Terraza con sombrilla','finca','terraza-sombrilla'),('Salón del kiosco','kiosco','salon-kiosco'),('Baño privado','habitaciones','bano'),
 ('Fiesta bajo candelabros','eventos','ig-boda-candelabro'),('La piscina','agua','piscina-amplia'),('Cocina y asador','kiosco','cocina-asador'),
 ('Corredor de la casa','finca','corredor'),('Habitación con ventana','habitaciones','habitacion-ventana'),('Decoración de evento','eventos','ig-decoracion'),
 ('Billar y ping-pong','kiosco','billar'),('Terraza lounge','finca','terraza-lounge'),('Jardín y montaña','finca','jardin-montana')]
lote('galeria', [{'titulo': a, 'categoria': b, 'foto': F(c)} for a, b, c in gal])
lote('preguntas', [
    {'tema': 'reservas', 'pregunta': '¿Cómo se paga la reserva?', 'respuesta': 'Con un anticipo por transferencia o Nequi para confirmar; el saldo se paga al llegar. El porcentaje del anticipo lo confirma la finca.'},
    {'tema': 'reservas', 'pregunta': '¿Puedo cancelar o cambiar la fecha?', 'respuesta': 'Por definir: la política de cancelación y cambios la publica la finca desde el panel.'},
    {'tema': 'reservas', 'pregunta': '¿Los precios incluyen impuestos?', 'respuesta': 'Sí. Las tarifas por noche incluyen el impuesto y el seguro hotelero.'},
    {'tema': 'reservas', 'pregunta': '¿Por qué reservar directo?', 'respuesta': 'Porque no pagas comisiones de terceros y hablas directamente con la finca.'},
    {'tema': 'estadia', 'pregunta': '¿A qué hora es la entrada y la salida?', 'respuesta': 'La entrada es desde las 3:00 p. m. La hora de salida la confirma la finca.'},
    {'tema': 'estadia', 'pregunta': '¿Cuál es el horario del jacuzzi?', 'respuesta': 'El jacuzzi es climatizado y funciona de 5:00 a 10:00 p. m. todos los días.'},
    {'tema': 'estadia', 'pregunta': '¿El desayuno está incluido?', 'respuesta': 'Es opcional: cuesta $12.000 adicionales por persona y se pide al reservar.'},
    {'tema': 'estadia', 'pregunta': '¿Podemos cocinar?', 'respuesta': 'Sí. El kiosco tiene cocina y asador para que el grupo prepare sus comidas.'},
    {'tema': 'mascotas', 'pregunta': '¿Puedo ir con mi mascota?', 'respuesta': 'Sí. Las mascotas son bienvenidas sin costo adicional; avísanos al reservar.'},
    {'tema': 'mascotas', 'pregunta': '¿Pueden ir niños?', 'respuesta': 'Sí. Los menores de edad deben llegar acompañados por sus padres y con su documento de identidad.'},
    {'tema': 'eventos', 'pregunta': '¿Puedo celebrar un evento?', 'respuesta': 'Sí. Usa el cotizador de la página de eventos o escríbenos con la fecha y el número de personas.'},
    {'tema': 'eventos', 'pregunta': '¿Qué incluye el pasadía?', 'respuesta': 'Uso de las zonas sociales de 9:00 a. m. a 5:00 p. m. por $22.000 por persona más el seguro, con un mínimo de 10 personas.'},
    {'tema': 'eventos', 'pregunta': '¿Cuántas personas caben con la finca completa?', 'respuesta': 'Hasta 40 personas en las 14 habitaciones, por $2.800.000 la noche (solo alojamiento).'},
    {'tema': 'llegada', 'pregunta': '¿Cómo llego desde el aeropuerto?', 'respuesta': 'El aeropuerto El Edén está a unos 22 a 27 km. Pasa por Armenia y toma la vía a Circasia hasta el kilómetro 3, frente al Retorno Colillas.'},
    {'tema': 'llegada', 'pregunta': '¿Hay parqueadero?', 'respuesta': 'Sí, dentro de la finca y sin costo para huéspedes.'},
    {'tema': 'llegada', 'pregunta': '¿Hay wifi?', 'respuesta': 'Sí. La cobertura la confirma la finca.'},
])

ajustes = {
    'global.whatsapp': '', 'global.mensaje_whatsapp': 'Hola, quiero información sobre la Finca Hotel Nuevo Futuro.',
    'global.telefono': '', 'global.correo': '', 'global.direccion': 'Km 3 vía Armenia–Circasia, frente al Retorno Colillas',
    'global.maps_url': 'https://www.google.com/maps/search/?api=1&query=Finca%20Hotel%20Nuevo%20Futuro%20Circasia',
    'global.maps_embed': '', 'global.instagram': 'https://www.instagram.com/fincahotelnuevofuturo', 'global.facebook': '',
    'global.horario': '', 'global.hora_entrada': '3:00 p. m.', 'global.hora_salida': 'Por definir', 'global.anticipo': 'Por definir',
    'global.precio_desayuno': '12000', 'global.politica_cancelacion': '', 'global.rnt': '',
}

os.makedirs(os.path.join(RAIZ, 'datos'), exist_ok=True)
with open(os.path.join(RAIZ, 'datos', 'inicial.json'), 'w', encoding='utf-8') as f:
    json.dump({'ajustes': ajustes, 'colecciones': colecciones}, f, ensure_ascii=False, indent=1)

def q(s): return "'" + str(s).replace("'", "''") + "'"
lineas = ['-- Datos de ejemplo de Nuevo Futuro. Ejecutar DESPUÉS de esquema.sql.',
          '-- Las fotos apuntan a /assets/img/fotos del sitio; cámbialas desde el panel.', 'begin;']
for k, v in ajustes.items():
    lineas.append('insert into public.ajustes (clave, valor) values (%s, %s) on conflict (clave) do nothing;' % (q(k), q(v)))
for c in colecciones:
    lineas.append('insert into public.colecciones (id, tipo, datos, orden, activo) values (%s, %s, %s::jsonb, %d, %s) on conflict (id) do nothing;'
                  % (q(c['id']), q(c['tipo']), q(json.dumps(c['datos'], ensure_ascii=False)), c['orden'], 'true' if c['activo'] else 'false'))
lineas.append('commit;')
with open(os.path.join(RAIZ, 'supabase', 'datos-iniciales.sql'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(lineas) + '\n')
print('ok', len(colecciones), 'elementos')
