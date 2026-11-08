-- ============================================================================
-- Finca Hotel Nuevo Futuro · Esquema de base de datos (Supabase / PostgreSQL)
-- ----------------------------------------------------------------------------
-- Cómo usarlo:
--   1. En Supabase, abre "SQL Editor", pega TODO este archivo y ejecútalo.
--   2. Luego ejecuta supabase/datos-iniciales.sql (contenido de ejemplo).
--   3. Crea tu usuario en Authentication > Users > "Add user" (correo y clave).
--   4. Hazlo administrador (cambia el correo):
--        insert into public.admins (user_id)
--        select id from auth.users where email = 'tu-correo@ejemplo.com';
--   5. Pega la URL del proyecto y la clave pública (anon / publishable) en
--      assets/js/config.js.
-- Se puede ejecutar más de una vez sin dañar los datos.
-- ============================================================================

create extension if not exists btree_gist;

-- ---------------------------------------------------------------- Tablas ----
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  creado  timestamptz not null default now()
);

create table if not exists public.ajustes (
  clave       text primary key,
  valor       text not null default '',
  actualizado timestamptz not null default now()
);

create table if not exists public.colecciones (
  id     uuid primary key default gen_random_uuid(),
  tipo   text not null,
  datos  jsonb not null default '{}'::jsonb,
  orden  integer not null default 0,
  activo boolean not null default true,
  creado timestamptz not null default now()
);
create index if not exists colecciones_tipo_orden on public.colecciones (tipo, orden);

create table if not exists public.reservas (
  id                uuid primary key default gen_random_uuid(),
  codigo            text not null unique,
  creado            timestamptz not null default now(),
  estado            text not null default 'pendiente'
                    check (estado in ('pendiente', 'confirmada', 'completada', 'cancelada')),
  habitacion_id     uuid references public.colecciones (id) on delete set null,
  habitacion_nombre text,
  llegada           date not null,
  salida            date not null,
  adultos           integer not null default 1 check (adultos >= 0),
  ninos             integer not null default 0 check (ninos >= 0),
  mascota           boolean not null default false,
  desayuno          boolean not null default false,
  nombre            text,
  telefono          text,
  correo            text,
  ciudad            text,
  hora_llegada      text,
  comentarios       text,
  total             numeric not null default 0,
  anticipo_pagado   numeric not null default 0,
  notas             text,
  origen            text not null default 'web',
  constraint reservas_fechas check (salida > llegada)
);
create index if not exists reservas_llegada on public.reservas (llegada);

-- Dos reservas activas de la misma habitación no pueden cruzarse
do $$ begin
  alter table public.reservas add constraint reservas_sin_cruce
    exclude using gist (habitacion_id with =, daterange(llegada, salida) with &&)
    where (estado in ('pendiente', 'confirmada'));
exception when duplicate_object or duplicate_table then null; end $$;

create table if not exists public.bloqueos (
  id            uuid primary key default gen_random_uuid(),
  habitacion_id uuid references public.colecciones (id) on delete cascade, -- null = toda la finca
  desde         date not null,
  hasta         date not null, -- día de salida (no incluido)
  motivo        text not null default '',
  creado        timestamptz not null default now(),
  constraint bloqueos_fechas check (hasta > desde)
);

create table if not exists public.solicitudes (
  id       uuid primary key default gen_random_uuid(),
  creado   timestamptz not null default now(),
  tipo     text not null default 'contacto' check (tipo in ('contacto', 'evento')),
  estado   text not null default 'nueva' check (estado in ('nueva', 'en_proceso', 'respondida', 'archivada')),
  nombre   text,
  telefono text,
  correo   text,
  asunto   text,
  fecha    date,
  personas integer,
  mensaje  text
);

-- -------------------------------------------------------------- Funciones ----
create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()); $$;

-- Noches ocupadas (reservas activas y bloqueos) entre dos fechas
create or replace function public.disponibilidad(p_desde date, p_hasta date)
returns table (habitacion_id uuid, fecha date)
language plpgsql stable security definer set search_path = public
as $$
declare v_hasta date := least(p_hasta, p_desde + 400);
begin
  return query
    select r.habitacion_id, d::date
    from public.reservas r,
         generate_series(greatest(r.llegada, p_desde)::timestamp, (least(r.salida, v_hasta) - 1)::timestamp, interval '1 day') d
    where r.estado in ('pendiente', 'confirmada') and r.llegada < v_hasta and r.salida > p_desde
    union all
    select b.habitacion_id, d::date
    from public.bloqueos b,
         generate_series(greatest(b.desde, p_desde)::timestamp, (least(b.hasta, v_hasta) - 1)::timestamp, interval '1 day') d
    where b.desde < v_hasta and b.hasta > p_desde;
end $$;

-- Reserva desde la web: valida, calcula el total y la deja "pendiente"
create or replace function public.crear_reserva(p jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_hab       record;
  v_llegada   date;
  v_salida    date;
  v_adultos   integer;
  v_ninos     integer;
  v_huespedes integer;
  v_cap       integer;
  v_precio    numeric;
  v_pd        numeric;
  v_noches    integer;
  v_total     numeric;
  v_finca     boolean;
  v_desayuno  boolean := coalesce((p ->> 'desayuno')::boolean, false);
  v_codigo    text;
  v_hoy       date := (now() at time zone 'America/Bogota')::date;
begin
  begin
    v_llegada := (p ->> 'llegada')::date;
    v_salida  := (p ->> 'salida')::date;
  exception when others then
    raise exception 'Fechas no válidas.';
  end;
  if v_llegada is null or v_salida is null or v_salida <= v_llegada then raise exception 'Fechas no válidas.'; end if;
  if v_llegada < v_hoy then raise exception 'La fecha de llegada ya pasó.'; end if;
  if v_llegada > v_hoy + 540 then raise exception 'Todavía no recibimos reservas para esas fechas.'; end if;
  v_noches := v_salida - v_llegada;
  if v_noches > 30 then raise exception 'Para estadías de más de 30 noches escríbenos por WhatsApp.'; end if;

  v_adultos := least(greatest(coalesce(nullif(p ->> 'adultos', '')::integer, 1), 1), 60);
  v_ninos   := least(greatest(coalesce(nullif(p ->> 'ninos', '')::integer, 0), 0), 40);
  v_huespedes := v_adultos + v_ninos;
  if coalesce(trim(p ->> 'nombre'), '') = '' or coalesce(trim(p ->> 'telefono'), '') = '' then
    raise exception 'Faltan tu nombre o tu celular.';
  end if;

  select c.id, c.datos into v_hab
  from public.colecciones c
  where c.id = nullif(p ->> 'habitacion_id', '')::uuid and c.tipo = 'habitaciones' and c.activo;
  if not found then raise exception 'La habitación ya no está disponible.'; end if;

  v_cap := nullif(regexp_replace(coalesce(v_hab.datos ->> 'capacidad', ''), '[^0-9]', '', 'g'), '')::integer;
  if v_cap is not null and v_cap > 0 and v_huespedes > v_cap then
    raise exception 'Son más personas de las que caben en esta habitación.';
  end if;
  v_finca := (v_hab.datos ->> 'tipo') = 'finca';

  -- Evita que dos reservas simultáneas tomen las mismas fechas
  perform pg_advisory_xact_lock(hashtext('nf-reservas'));

  if (select count(*) from public.reservas where origen = 'web' and creado > now() - interval '10 minutes') >= 25 then
    raise exception 'Estamos recibiendo muchas reservas. Intenta en unos minutos o escríbenos por WhatsApp.';
  end if;

  if exists (
    select 1 from public.reservas r left join public.colecciones c on c.id = r.habitacion_id
    where r.estado in ('pendiente', 'confirmada') and r.llegada < v_salida and r.salida > v_llegada
      and (v_finca or r.habitacion_id = v_hab.id or (c.datos ->> 'tipo') = 'finca')
  ) or exists (
    select 1 from public.bloqueos b left join public.colecciones c on c.id = b.habitacion_id
    where b.desde < v_salida and b.hasta > v_llegada
      and (v_finca or b.habitacion_id is null or b.habitacion_id = v_hab.id or (c.datos ->> 'tipo') = 'finca')
  ) then
    raise exception 'Esas fechas ya no están libres. Elige otras.';
  end if;

  v_precio := coalesce(nullif(regexp_replace(coalesce(v_hab.datos ->> 'precio', ''), '[^0-9.]', '', 'g'), '')::numeric, 0);
  select nullif(regexp_replace(valor, '[^0-9.]', '', 'g'), '')::numeric into v_pd from public.ajustes where clave = 'global.precio_desayuno';
  v_total := case when (v_hab.datos ->> 'modo_precio') = 'persona' then v_precio * v_huespedes * v_noches else v_precio * v_noches end
           + case when v_desayuno then coalesce(v_pd, 0) * v_huespedes * v_noches else 0 end;

  loop
    v_codigo := 'NF-' || to_char(v_llegada, 'MMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
    exit when not exists (select 1 from public.reservas where codigo = v_codigo);
  end loop;

  insert into public.reservas (codigo, estado, habitacion_id, habitacion_nombre, llegada, salida, adultos, ninos, mascota, desayuno,
                               nombre, telefono, correo, ciudad, hora_llegada, comentarios, total, origen)
  values (v_codigo, 'pendiente', v_hab.id, v_hab.datos ->> 'nombre', v_llegada, v_salida, v_adultos, v_ninos,
          coalesce((p ->> 'mascota')::boolean, false), v_desayuno,
          left(trim(p ->> 'nombre'), 120), left(trim(p ->> 'telefono'), 40), left(trim(coalesce(p ->> 'correo', '')), 160),
          left(coalesce(p ->> 'ciudad', ''), 80), left(coalesce(p ->> 'hora_llegada', ''), 60), left(coalesce(p ->> 'comentarios', ''), 2000),
          v_total, 'web');

  return jsonb_build_object('codigo', v_codigo, 'total', v_total);
end $$;

-- Mensaje de contacto o cotización de evento desde la web
create or replace function public.crear_solicitud(p jsonb)
returns boolean
language plpgsql volatile security definer set search_path = public
as $$
declare v_fecha date; v_personas integer;
begin
  if coalesce(trim(p ->> 'nombre'), '') = '' or coalesce(trim(p ->> 'telefono'), '') = '' then
    raise exception 'Faltan tu nombre o tu celular.';
  end if;
  if (select count(*) from public.solicitudes where creado > now() - interval '10 minutes') >= 30 then
    raise exception 'Estamos recibiendo muchos mensajes. Intenta en unos minutos o escríbenos por WhatsApp.';
  end if;
  begin v_fecha := nullif(p ->> 'fecha', '')::date; exception when others then v_fecha := null; end;
  begin v_personas := nullif(p ->> 'personas', '')::integer; exception when others then v_personas := null; end;
  insert into public.solicitudes (tipo, nombre, telefono, correo, asunto, fecha, personas, mensaje)
  values (case when p ->> 'tipo' = 'evento' then 'evento' else 'contacto' end,
          left(trim(p ->> 'nombre'), 120), left(trim(p ->> 'telefono'), 40), left(coalesce(p ->> 'correo', ''), 160),
          left(coalesce(p ->> 'asunto', ''), 160), v_fecha, v_personas, left(coalesce(p ->> 'mensaje', ''), 4000));
  return true;
end $$;

-- ----------------------------------------------------------- Seguridad ----
alter table public.admins      enable row level security;
alter table public.ajustes     enable row level security;
alter table public.colecciones enable row level security;
alter table public.reservas    enable row level security;
alter table public.bloqueos    enable row level security;
alter table public.solicitudes enable row level security;

drop policy if exists "admins se ven a si mismos" on public.admins;
create policy "admins se ven a si mismos" on public.admins for select to authenticated using (user_id = auth.uid());

drop policy if exists "ajustes lectura publica" on public.ajustes;
create policy "ajustes lectura publica" on public.ajustes for select to anon, authenticated using (true);
drop policy if exists "ajustes escritura admin" on public.ajustes;
create policy "ajustes escritura admin" on public.ajustes for all to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "colecciones lectura publica" on public.colecciones;
create policy "colecciones lectura publica" on public.colecciones for select to anon, authenticated using (activo or public.es_admin());
drop policy if exists "colecciones escritura admin" on public.colecciones;
create policy "colecciones escritura admin" on public.colecciones for all to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "reservas solo admin" on public.reservas;
create policy "reservas solo admin" on public.reservas for all to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists "bloqueos solo admin" on public.bloqueos;
create policy "bloqueos solo admin" on public.bloqueos for all to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists "solicitudes solo admin" on public.solicitudes;
create policy "solicitudes solo admin" on public.solicitudes for all to authenticated using (public.es_admin()) with check (public.es_admin());

grant usage on schema public to anon, authenticated;
grant select on public.ajustes, public.colecciones to anon, authenticated;
grant insert, update, delete on public.ajustes, public.colecciones to authenticated;
grant select, insert, update, delete on public.reservas, public.bloqueos, public.solicitudes to authenticated;
grant select on public.admins to authenticated;

revoke all on function public.es_admin() from public;
revoke all on function public.disponibilidad(date, date) from public;
revoke all on function public.crear_reserva(jsonb) from public;
revoke all on function public.crear_solicitud(jsonb) from public;
grant execute on function public.es_admin() to anon, authenticated;
grant execute on function public.disponibilidad(date, date) to anon, authenticated;
grant execute on function public.crear_reserva(jsonb) to anon, authenticated;
grant execute on function public.crear_solicitud(jsonb) to anon, authenticated;

-- ------------------------------------------------- Fotos (Storage) ----
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true) on conflict (id) do nothing;

drop policy if exists "fotos: admin sube" on storage.objects;
create policy "fotos: admin sube" on storage.objects for insert to authenticated with check (bucket_id = 'fotos' and public.es_admin());
drop policy if exists "fotos: admin cambia" on storage.objects;
create policy "fotos: admin cambia" on storage.objects for update to authenticated using (bucket_id = 'fotos' and public.es_admin());
drop policy if exists "fotos: admin borra" on storage.objects;
create policy "fotos: admin borra" on storage.objects for delete to authenticated using (bucket_id = 'fotos' and public.es_admin());
