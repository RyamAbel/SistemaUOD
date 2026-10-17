# Base de Datos Supabase (PostgreSQL) - SistemaUOD / SIIA

Este directorio contiene las definiciones de la base de datos para el **Sistema Inteligente de Inventario con IA Integrada**.

## Pasos para ejecutar en Supabase:

1. Ingresa a tu panel de control en [Supabase](https://supabase.com/dashboard).
2. Selecciona tu proyecto creado.
3. Ve a la sección **SQL Editor** (en el menú lateral izquierdo).
4. Crea una **New query** (Nueva consulta) y copia el contenido completo del archivo:
   - [001_initial_schema.sql](file:///database/migrations/001_initial_schema.sql)
5. Haz clic en **Run** (Ejecutar). Esto creará:
   - Todas las tablas del sistema con llaves foráneas y tipos validados.
   - Triggers automáticos para `updated_at`.
   - **Trigger transaccional de movimientos:** actualiza y valida existencias automáticamente en tiempo real (evita stock negativo en salidas y sincroniza traslados).
   - Políticas de seguridad por fila (RLS).
6. Crea otra consulta y ejecuta:
   - [001_seed_data.sql](file:///database/seed/001_seed_data.sql)
   - Esto insertará la institución inicial ("UOD"), categorías, almacenes, proveedores y artículos de prueba para comenzar a operar de inmediato.

## Autenticación de Google en Supabase:
- En tu panel de Supabase: **Authentication -> Providers -> Google**.
- Activa el interruptor y pega tu `Client ID` y `Client Secret` obtenidos en [Google Cloud Console](https://console.cloud.google.com).
- Agrega la Redirect URL que te proporciona Supabase en tus credenciales de Google OAuth.
