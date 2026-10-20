# Memoria del Proyecto: SistemaUOD (SIIA)
> Sistema Inteligente de Inventario con IA Integrada

---

## 1. Qué es SIIA y para quién
**SIIA** es una plataforma web moderna, segura e integral diseñada para centralizar el control de existencias, suministros consumibles y activos fijos institucionales (inicialmente para instituciones en República Dominicana y escalable a SaaS multi-tenant).
Incorpora un **Asistente de IA** (basado en Gemini) capaz de responder consultas en lenguaje natural, fungir como tutor operativo del personal y proponer acciones de inventario (altas, traslados, salidas) que **siempre requieren confirmación explícita** del usuario antes de ejecutarse.

---

## 2. Decisiones Técnicas Aprobadas
- **Backend / API:** ASP.NET Core Web API (.NET 10 LTS) bajo Clean Architecture (`Domain`, `Application`, `Infrastructure`, `Api`).
- **Base de Datos & Auth:** Supabase (PostgreSQL 15+, Row Level Security - RLS, Storage para adjuntos, Realtime, pgvector).
- **Frontend Web:** Next.js (React 19, TypeScript, Tailwind CSS, App Router, Lucide Icons, Mobile-first / PWA).
- **Autenticación:** Exclusiva con Google OAuth 2.0 vía Supabase Auth (sin contraseñas locales). Solo correos autorizados por invitación institucional o dominio permitido.
- **Asistente de IA:** Gemini API (Google AI Studio / Vertex AI) orquestado exclusivamente desde el backend mediante *Tool Calling* / *Function Calling*.
- **Notificaciones por Correo:** Gmail API institucional con cola transaccional en base de datos y reintentos.

---

## 3. Estructura del Repositorio (Monorepo)
```
SistemaUOD/
├── AGENTS.md                  # Este archivo: memoria y contexto del proyecto
├── README.md                  # Documentación general y puesta en marcha
├── .gitignore                 # Exclusiones de Git
├── database/                  # Base de datos Supabase / PostgreSQL
│   ├── migrations/            # Migraciones versionadas (001_initial_schema.sql)
│   ├── seed/                  # Datos semilla institucionales (001_seed_data.sql)
│   └── README.md              # Instrucciones de ejecución en Supabase
├── backend/                   # Solución .NET (ASP.NET Core Web API)
│   ├── SistemaUOD.slnx        # Solución C#
│   └── src/
│       ├── SistemaUOD.Domain/         # Entidades, enums y reglas de dominio
│       ├── SistemaUOD.Application/    # DTOs, casos de uso, interfaces
│       ├── SistemaUOD.Infrastructure/ # EF Core, Npgsql, integraciones Supabase
│       └── SistemaUOD.Api/            # Endpoints /api/v1, OpenAPI/Swagger, Auth
└── frontend/                  # Aplicación Web Next.js
    ├── src/
    │   ├── app/               # Layout, globals.css y vistas
    │   ├── components/        # Navbar, Sidebar, Dashboard, Catálogo, Asistente IA
    │   └── lib/               # Cliente Supabase y utilidades
    ├── .env.example           # Plantilla de variables de entorno frontend
    └── package.json
```

---

## 4. Reglas de Oro del Proyecto
1. **Seguridad y Permisos:** Todo endpoint valida el rol del usuario y deja registro inmutable en la bitácora de auditoría (cumplimiento Ley 172-13).
2. **Cero Secretos en Código:** Ninguna clave o credencial va al repositorio ni al chat; se gestionan exclusivamente en archivos `.env.local` / `appsettings.Development.json` locales ignorados por Git.
3. **Evolución del Esquema:** Todo cambio en la base de datos se realiza mediante un archivo de migración SQL versionado en `database/migrations/`.
4. **Gobierno de la IA:** Las acciones de escritura propuestas por la IA **nunca** se ejecutan automáticamente; requieren tarjeta interactiva con previsualización de impacto y confirmación explícita del usuario.
5. **Aislamiento de la IA:** El Asistente de IA interactúa únicamente con la API de SIIA vía herramientas definidas, jamás tiene conexión directa ni acceso SQL libre a la base de datos.
6. **Sistema de Diseño:** Se respeta la paleta institucional de la Universidad Odontológica Dominicana (UOD). Antes de construir cualquier pantalla, leer `.agents/skills/ui-ux-pro-max/SKILL.md` y `design-system/MASTER.md`:
   - Azul Marino Primario (logo UOD): `#1C3177`
   - Azul Medio / Hover: `#2B4BA0`
   - Verde UOD (círculo diente + DOMINICANA): `#3DAA5C`
   - Verde Oscuro / Hover: `#2D8246`
   - Acento IA Turquesa: `#06B6D4`
   - Advertencia / Stock Bajo: `#F59E0B`
   - Error / Agotado: `#EF4444`
   - Fondo claro (default): `#F7F9FC` (blanco clínico-institucional)
   - Fondo oscuro (toggle): `#0D1B2A` (azul naval profundo)

---

## 5. Estado Actual del Proyecto
- **Etapa 0 (Preparación y repositorio):** ✅ Completada.
- **Etapa 1 (Sistema de diseño):** ✅ Completada (Aprobada):
  - ✅ Prompt 1.1: Skill UI/UX Pro Max instalada en `.agents/skills/ui-ux-pro-max/`.
  - ✅ Prompt 1.2: Propuesta base de diseño aprobada — estilo `enterprise + minimal-light`, paleta UOD institucional (blanco clínico `#F7F9FC` + azul marino `#1C3177` + verde `#3DAA5C`), Inter + JetBrains Mono.
  - ✅ Prompt 1.3: Excepción aprobada por el usuario (sin referencias externas adicionales).
  - ✅ Prompt 1.4: Sistema de diseño unificado en `design-system/MASTER.md` con archivos de excepciones por página (`login.md`, `dashboard.md`, `catalogo.md`, `ficha-recurso.md`, `panel-ia.md`).
  - ✅ Prompt 1.5: Vista previa navegable interactiva de pantallas implementada en `frontend/` y validada en vivo vía navegador.
  - ✅ Prompt 1.6: Lista de verificación WCAG 2.1 AA (contrastes accesibles > 4.5:1, foco visible, reduced-motion, diseño adaptativo).
- **Etapa 2 (Base de datos en Supabase):** ✅ Completada y verificada en vivo:
  - ✅ Migración 1: `20261018000001_base_schema.sql` aplicada con éxito.
  - ✅ Migración 2: `20261018000002_operation_schema.sql` aplicada con éxito.
  - ✅ Migración 3: `20261018000003_security_transversal.sql` aplicada con éxito (RLS y Storage activos).
  - ✅ Migración 4: `20261018000004_auth_invitation_trigger.sql` aplicada con éxito (control estricto de invitaciones).
  - ✅ Datos semilla: `supabase/seed.sql` sembrados con éxito.
  - ✅ Batería de pruebas: `supabase/tests/database_test.sql` superada con todas las restricciones validadas.
- **Etapa 3 (Acceso con Google & Credenciales):** ✅ Completada:
  - Supabase Database & Auth (URL y claves configuradas).
  - Google OAuth 2.0 (Client ID y Client Secret configurados en Supabase).
  - Gemini API (Google AI Studio API Key configurada para el Asistente de IA).
- **Etapa 4 (API base en .NET 10 LTS):** ✅ Completada y verificada:
  - ✅ Prompt 4.1: Solución .NET 10 LTS con Clean Architecture (`SistemaUOD.Domain`, `SistemaUOD.Application`, `SistemaUOD.Infrastructure`, `SistemaUOD.Api`, `SistemaUOD.Tests`).
  - ✅ Prompt 4.2: Conexión PostgreSQL (Supabase pooler) con EF Core sin migraciones EF (Database-first). Validación de tokens asimétricos ES256 (OIDC/JWKS). Endpoint `GET /api/v1/me` que valida perfil, rol y estado activo.
  - ✅ Prompt 4.3: Políticas de autorización por roles (`ExigirSuperAdmin`, `ExigirGestionInventario`, `ExigirOperacionAlmacen`, `ExigirAuditoria`). Mecanismo centralizado de auditoría automática en `ApplicationDbContext.SaveChangesAsync()` (Ley 172-13). Estandarización de errores con `ProblemDetails` (RFC 7807) y modelos de paginación (`PagedRequest`, `PagedResult<T>`).
  - ✅ Prompt 4.4: Documentación OpenAPI, CORS para `http://localhost:3000`, Rate Limiting por IP/usuario, y batería de pruebas automatizadas en `backend/tests/SistemaUOD.Tests` (7/7 pruebas superadas).
- **Datos Reales de Inventario (Levantamiento TI UOD 2026):** ✅ Procesados e integrados:
  - Archivo fuente: `Datos/ACTIVOS 2026 TECNOLOGIA.xlsx`.
  - 341 equipos físicos con ID/placa institucional (`EQ-01` a `EQ-341`), custodio y notas.
  - 49 ubicaciones reales de la UOD (Clínicas Odontológicas B, C, E, F, Panorámica, Laboratorio Cómputo, Rectoría, Contabilidad, Admisiones, etc.).
  - 113 referencias/modelos en catálogo organizados en 7 categorías tecnológicas.
  - Generación de scripts SQL `supabase/seed.sql` y `supabase/seed_original_inventario.sql`.
  - Sincronización completa con vistas del frontend (Dashboard, Catálogo, Ubicaciones y Movimientos).
- **Etapa 5 (Interfaz base e integración Google Auth):** ✅ Completada y verificada:
  - ✅ Prompt 5.1: Tokens de Tailwind, componentes base, paleta institucional UOD e iconos Lucide.
  - ✅ Prompt 5.2: Autenticación exclusiva con Google OAuth 2.0 vía Supabase Auth (`exchangeCodeForSession` en `/auth/callback`), protección global de rutas, rechazo automático con banner explicativo para correos sin invitación (`trg_auth_user_created`), consumo de `GET /api/v1/me` para perfil y rol real.
  - ✅ Prompt 5.3: Layout principal con navegación adaptada dinámicamente según el rol del usuario (`Sidebar.tsx`), búsqueda global (`Navbar.tsx` con atajo Ctrl+K), alertas de inventario en tiempo real y menú de usuario.
  - ✅ Prompt 5.4: Cliente HTTP tipado (`frontend/src/lib/apiClient.ts`) con interceptor de JWT Supabase, manejo estandarizado de `ProblemDetails` (RFC 7807) en español y modelos de paginación.
  - ✅ Prompt 5.5: Panel lateral del Asistente IA (`AiAssistantDrawer.tsx`) con chat interactivo, selector de modo (operativo / tutor), indicador de pensamiento y tarjetas de confirmación obligatoria previa para toda acción en el inventario.
  - ✅ Prompt 5.6: Revisión de accesibilidad WCAG 2.1 AA, pruebas de compilación estricta Next.js Turbopack (`npm run build` 6/6 páginas en verde).
- **Etapa 6 (Catálogo de recursos con fotos, QR y filtros):** 🔄 En curso:
  - ✅ Prompt 6.1: **Categorías y proveedores (patrón fijado y validado)**:
    - Endpoints RESTful con Clean Architecture en Minimal APIs (`CategoriasEndpoints.cs`, `ProveedoresEndpoints.cs`).
    - Políticas de seguridad por rol (`Policies.ExigirGestionInventario` para escritura, `Policies.ExigirSuperAdmin` para borrado, lectura autenticada).
    - Validaciones estrictas de dominio (RNC dominicano de 9 u 11 dígitos con regex, códigos únicos, prevención de ciclos padre-hijo).
    - Trazabilidad y auditoría inmutable automática en `ApplicationDbContext.SaveChangesAsync()` (Ley 172-13).
    - Cliente frontend tipado en `apiClient.ts` con manejo de `ProblemDetails` (RFC 7807).
    - Pantalla interactiva en Next.js `SuppliersView.tsx` con tabs para Proveedores y Categorías, modales accesibles y badges de estado.
    - Batería de 18 pruebas automatizadas superadas al 100% en `SistemaUOD.Tests`.
  - ✅ Prompt 6.2: **API de recursos con filtros combinables**:
    - Endpoints RESTful completos (`RecursosEndpoints.cs`) con `GET /api/v1/recursos` (17 filtros combinables), `GET /api/v1/recursos/{id}`, `POST`, `PUT`, `POST /duplicar`, `PATCH /estado` y `DELETE` (desactivación lógica).
    - Servicio `RecursoService.cs` con validación de SKU único, verificación de categoría activa, búsqueda compuesta y clonación de especificaciones/fotos.
    - Políticas de autorización estrictas (`Policies.ExigirGestionInventario` para escritura y clonación, lectura autenticada).
    - Cliente frontend tipado en `apiClient.ts` con `RecursoFiltrosDto`, `RecursoDto`, `RecursoDetalleDto`, etc.
    - Batería de 25 pruebas automatizadas superadas al 100% en `SistemaUOD.Tests` (0 fallos).
  - ✅ Prompt 6.3: **Fotos de los recursos (Supabase Storage privado)**:
    - Validación de seguridad binaria estricta (Magic Numbers reales para JPG, PNG y WebP, descartando ejecutables o scripts camuflados).
    - Límite de 5 MB por archivo e integración con Supabase Storage privado (`recursos-fotos`).
    - Lógica de asignación y alternancia de foto principal (promoción automática al borrar la foto destacada).
    - Endpoints RESTful completos (`RecursosFotosEndpoints.cs`): `GET`, `POST` (multipart), `PUT /principal`, `PUT /reordenar` y `DELETE`.
    - Cliente tipado en `apiClient.ts` con manejo de tokens asimétricos y multipart form-data.
    - Batería de 31 pruebas automatizadas superadas al 100% en `SistemaUOD.Tests` (0 fallos).
  - ✅ Prompt 6.4: **Códigos y QR (Resolución universal y generación segura)**:
    - Generación de código QR institucional canónico (`https://siia.uod.edu.do/recurso/{id}`) sin exponer credenciales ni datos sensibles.
    - Generador de imágenes PNG en memoria con `QRCoder` (`/api/v1/recursos/{id}/qr/imagen`) para previsualización e impresión de etiquetas.
    - Validación estricta de unicidad en códigos externos (barras, fabricante o serie) para prevenir duplicidades en todo el inventario.
    - Endpoint resolutor universal (`GET /api/v1/codigos/resolver?codigo=...`) capaz de identificar cualquier código escaneado (QR institucional, SKU, código de barras, número de serie o placa institucional `EQ-XX`) y devolver la ficha correspondiente según permisos.
    - Manejo seguro de sesión y permisos (401 si no hay sesión, 404 si no existe).
    - Cliente tipado en `apiClient.ts` con `resolverCodigo`, `obtenerEnlaceQrRecurso`, etc.
    - Batería de 37 pruebas automatizadas superadas al 100% en `SistemaUOD.Tests` (0 fallos).
- **Próximo paso:**
  - **Prompt 6.5 – Pantalla de catálogo:** Construir la pantalla de catálogo interactiva según el sistema de diseño UOD: alternancia tabla/tarjetas con foto, panel de 17 filtros combinables, chips de filtros activos, ordenamiento, selección múltiple para acciones en lote y exportación rápida.




---

## 6. Patrón Arquitectónico Estándar para Módulos (Regla Fija)
Todo nuevo módulo de negocio en SIIA sigue rigurosamente esta estructura en 5 capas:
1. **Dominio (`SistemaUOD.Domain`):**
   - Entidad con claves primarias UUID/Guid, timestamps UTC (`CreadoEn`, `ActualizadoEn`), estado booleano (`Activo`) y relaciones tipadas.
2. **Aplicación (`SistemaUOD.Application`):**
   - DTOs separados para lectura (`*Dto`), creación (`Crear*Dto`) y edición (`Actualizar*Dto`).
   - Validaciones de DataAnnotations con mensajes claros en español.
   - Interfaz de servicio (`I*Service`) con soporte para cancelación (`CancellationToken`) y paginación (`PagedRequest`, `PagedResult<T>`).
3. **Infraestructura (`SistemaUOD.Infrastructure`):**
   - Implementación del servicio con `IApplicationDbContext`.
   - Consultas optimizadas con `AsNoTracking()`.
   - Inyección en `DependencyInjection.cs` con ciclo de vida `Scoped`.
   - Registro automático e inmutable de auditoría (quién, qué cambió, valores antes/después, IP y timestamp) sin código repetitivo.
4. **API y Seguridad (`SistemaUOD.Api`):**
   - Minimal API mapeada en `Endpoints/*Endpoints.cs` con tags de OpenAPI y sumarios.
   - Respuestas estandarizadas con `ProblemDetails` (RFC 7807) ante errores o validaciones fallidas.
   - Autorización estricta por roles (`ExigirSuperAdmin`, `ExigirGestionInventario`, etc.).
5. **Pruebas y Frontend (`SistemaUOD.Tests` & `frontend`):**
   - Pruebas de integración con `CustomWebApplicationFactory` simulando autenticación y roles.
   - Cliente HTTP tipado en `apiClient.ts`.
   - Vista React en Next.js con Tailwind siguiendo la paleta institucional UOD (`#1C3177`, `#3DAA5C`, `#F7F9FC`), estados de carga (skeletons), empty states y accesibilidad WCAG 2.1 AA.


