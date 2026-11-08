/* ==========================================================================
   Configuración de conexión
   --------------------------------------------------------------------------
   Mientras estos dos valores estén vacíos, el sitio funciona en "modo prueba":
   muestra los datos de /datos/inicial.json y el panel guarda los cambios solo
   en el navegador de quien los hace.

   Para usar la base de datos real (Supabase), copia aquí la URL del proyecto
   y la clave pública (anon o "publishable"). Esa clave es pública por diseño:
   la seguridad la ponen las reglas del archivo supabase/esquema.sql.
   ========================================================================== */
window.NF_CONFIG = {
  supabaseUrl: '',
  supabaseKey: '',
  bucket: 'fotos'
};
