# Memoria del Proyecto: SistemaUOD (SIIA)
> Sistema Inteligente de Inventario con IA Integrada

---

## 1. Qué es SIIA y para quién
**SIIA** es el sistema de inventario y almacén de la **Universidad Odontológica Dominicana (UOD)**. Maneja activos fijos institucionales (los 341 equipos tecnológicos físicos del levantamiento TI 2026) y los suministros consumibles del almacén.
**Alcance estricto:** SIIA **NO** maneja procesos clínicos, cirugías ni odontología, ni libros, ni contabilidad, ni ventas.
**Política de Roles:** Por ahora SIIA **no usa roles**: todos los usuarios registrados tienen el mismo acceso y no debe haber selectores, pantallas ni restricciones por rol. La lógica y modelos de roles preexistentes se dejan desactivados sin borrar su base para poder activarlos más adelante. Todo usuario registrado puede operar el inventario, manteniendo el registro inmutable en la bitácora de auditoría (quién hizo qué y cuándo).
**Diseño:** Se debe leer `design-system/MASTER.md` antes de tocar cualquier pantalla.
Incorpora un **Asistente de IA** (basado en Gemini) capaz de responder consultas con datos reales, fungir como tutor operativo del personal y proponer acciones de inventario (altas, traslados, salidas) que **siempre requieren confirmación explícita** del usuario antes de ejecutarse.

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
1. **Seguridad y Auditoría:** Todo endpoint valida que el usuario esté autenticado y deja registro inmutable en la bitácora de auditoría con su identidad real (cumplimiento Ley 172-13). Las restricciones por rol permanecen desactivadas temporalmente para permitir acceso unificado a todo el personal autorizado.
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
- **Etapa 6 (Catálogo de recursos con fotos, QR y filtros):** ✅ Completada al 100%:
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
  - ✅ Prompt 6.5: **Pantalla de catálogo interactiva**:
    - Alternancia fluida entre vista de tabla densa institucional y cuadrícula de tarjetas con foto/badges de estado, persistida en `localStorage`.
    - Barra de búsqueda predictiva en tiempo real con debounce integrado (SKU, nombre, marca, modelo).
    - Panel lateral desplegable con 17 filtros combinables (categorías, estado, tipo de recurso, rango de precios, stock bajo/agotado, etc.).
    - Barra de chips interactivos de filtros activos con botón de remoción individual y botón de reseteo global.
    - Selección múltiple de recursos con barra flotante de acciones en lote (cambio masivo de estado, desactivación y exportación).
    - Modal de visualización y descarga rápida de código QR institucional canónico.
    - Exportación instantánea del subconjunto filtrado a formato CSV con metadatos institucionales.
    - Cumplimiento WCAG 2.1 AA y diseño responsivo adaptativo UOD.
  - ✅ Prompt 6.6: **Formulario de recurso (Panel lateral Drawer / Modal)**:
    - Componente interactivo `ResourceFormDrawer.tsx` con tabs para datos básicos, umbrales de existencias (stock mínimo, máximo, punto de reorden), costos en DOP y especificaciones técnicas.
    - Subida de fotografías con soporte drag & drop y captura directa desde cámara (`accept="image/*" capture="environment"`), validación de 5 MB y tipos permitidos, selección de foto principal y previsualizaciones dinámicas.
    - Verificación y escaneo en vivo de códigos externos / de fabricante con `apiClient.resolverCodigo(codigo)` y alertas inmediatas si ya está registrado.
    - Detección en tiempo real de posibles duplicados con debounce (búsqueda de recursos similares por nombre y modelo en catálogo).
    - Flujo de creación rápida: botón «Guardar y agregar otro» (mantiene categoría para carga rápida masiva) y botón «Guardar recurso».
    - Soporte nativo para duplicación de recursos con clonación de atributos y generación de SKU sugerido.
    - Integración transparente en `CatalogView.tsx` (botón «Nuevo Recurso», acciones de editar y clonar en tabla y tarjetas).
  - ✅ Prompt 6.7: **Ficha del recurso y etiquetas QR imprimibles (PDF / Lote)**:
    - Componente `ResourceDetailModal.tsx` con tabs organizados:
      - *Información General:* Galería fotográfica interactiva con selector de miniaturas, barra de estado de stock en tiempo real (existencias vs stock mínimo y máximo), atributos en tarjetas y especificaciones técnicas.
      - *Existencias por Ubicación:* Desglose institucional de inventario por departamentos, aulas y clínicas odontológicas UOD.
      - *Equipos / Series Físicas:* Registro y trazabilidad de los 341 equipos físicos con ID institucional (`EQ-XX`), número de serie, custodio y estado operativo.
      - *Códigos y QR:* Código QR institucional canónico (`https://siia.uod.edu.do/recurso/{id}`) con botones de descarga en PNG y acceso al generador de etiquetas.
    - Generador de etiquetas QR imprimibles `QrLabelsPrintModal.tsx`:
      - Admite impresión individual o en lote masivo para los ítems seleccionados en el catálogo.
      - 3 formatos de etiqueta física: Compacta (45x25mm), Estándar (60x35mm) y Grande (80x50mm).
      - Configuración de copias por recurso e inclusión opcional de fotografía del ítem.
      - Reglas CSS `@media print` optimizadas para impresoras térmicas de etiquetas o exportación limpia a PDF sin elementos residuales de la interfaz.
  - ✅ Prompt 6.8: **Escáner con cámara PWA y resolución universal en vivo**:
    - Componente accesible `CameraScannerModal.tsx` con integración de `html5-qrcode` para lectura continua en alta definición de códigos QR institucionales, códigos de barras (EAN-13, CODE-128, UPC) y números de serie físicos.
    - Soporte para cámara trasera de smartphones (`facingMode: "environment"`), visor delimitador con esquinas iluminadas animadas, control de linterna (torch) y feedback acústico háptico vía Web Audio API.
    - Manejo preventivo de denegación de permisos o ausencia de cámara con opción integrada de entrada y búsqueda manual de códigos o SKU.
    - Resolución universal en tiempo real vía `GET /api/v1/codigos/resolver?codigo=...` con visualización directa de ficha técnica del recurso o activo físico identificado.
    - Flujo ante código desconocido: opción directa de «Crear nuevo recurso con este código» prellenando el formulario.
    - Configuración PWA lista: `manifest.json` institucional en `frontend/public/` y metadata en `layout.tsx` para instalación como aplicación nativa en Android, iOS y Desktop.
    - Accesos rápidos en `Navbar.tsx` y en la barra de herramientas de `CatalogView.tsx`.
  - ✅ Prompt 6.9: **Prueba real, validación de permisos y cierre formal de la Etapa 6**:
    - Verificación integral de permisos por rol: roles `auditor` y `consulta` pueden explorar el catálogo y ver fichas completas, pero tienen estrictamente denegado crear o modificar recursos (retornan `403 Forbidden`).
    - Batería de 39 pruebas automatizadas de integración superadas al 100% en `SistemaUOD.Tests` (0 fallos).
    - Compilación estricta en verde en Next.js Turbopack (`npm run build` con 6/6 páginas generadas).
- **Etapa 7 – Ubicaciones, existencias y movimientos:** 🔄 En curso:
  - ✅ Prompt 7.1: **Ubicaciones jerárquicas y dependencias institucionales**:
    - Endpoints RESTful completos (`UbicacionesEndpoints.cs`) con `GET /api/v1/ubicaciones` (listado plano con filtros y paginación), `GET /api/v1/ubicaciones/arbol` (jerarquía recursiva anidada), `GET /api/v1/ubicaciones/{id}`, `POST`, `PUT`, `PATCH /estado` y `DELETE`.
    - Servicio `UbicacionService.cs` con árbol jerárquico recursivo, validación de código único institucional y prevención estricta de borrado para ubicaciones con existencias, activos físicos asignados o sububicaciones (retorna `400 BadRequest` con ProblemDetails).
    - Políticas de autorización estrictas (`Policies.ExigirGestionInventario` para escritura, lectura autenticada).
    - Pantalla interactiva en Next.js `LocationsView.tsx` con doble vista (árbol jerárquico desplegable y tabla plana), detalle de ubicación con los equipos físicos de los 341 activos TI UOD asignados, modal de creación/edición y diálogo de prevención de borrado que ofrece desactivación.
  - ✅ Prompt 7.2: **Existencias y stock mínimo (RF-12)**:
    - Endpoints RESTful completos (`ExistenciasEndpoints.cs`) con `GET /api/v1/existencias` (resumen de stock por recurso con reglas de reorden RF-12), `GET /api/v1/existencias/recurso/{recursoId}` (ficha y desglose por ubicación y lotes), `GET /api/v1/existencias/detalladas`, `GET /api/v1/existencias/alertas/stock-bajo` y `GET /api/v1/existencias/alertas/vencimientos`.
    - Servicio `ExistenciaService.cs` implementando la fórmula RF-12: clasificación en `agotado`, `bajo_minimo`, `reorden` y `normal`, stock disponible `Math.Max(0, StockTotal - StockReservado)`, cantidad sugerida a reordenar para alcanzar stock máximo óptimo, y seguimiento de lotes clínicos próximos a vencer (30 días).
    - Métodos e interfaces tipados en `frontend/src/lib/apiClient.ts` (`obtenerResumenExistencias`, `obtenerStockPorRecurso`, `obtenerExistenciasDetalladas`, `obtenerAlertasStockBajo`, `obtenerAlertasVencimientos`).
    - Batería de 54 pruebas automatizadas superadas al 100% en `SistemaUOD.Tests` (0 fallos).
    - Compilación estricta y generación de páginas estáticas en verde en Next.js Turbopack (`npm run build`).
  - ✅ Prompt 7.3: **Movimientos transaccionales (API)**:
    - Endpoints RESTful transaccionales (`MovimientosEndpoints.cs`) con `POST /api/v1/movimientos`, `POST /api/v1/movimientos/previsualizar`, `GET /api/v1/movimientos` (historial paginado multivariable) y `GET /api/v1/movimientos/{id}`.
    - Servicio `MovimientoService.cs` con transacción atómica (todo o nada), validación estricta anti-stock negativo, correlativo único institucional (`MOV-YYYY-000001`), soporte para clave de idempotencia (`X-Idempotency-Key` / en memoria y BD) para prevenir duplicados en reintentos, y auditoría inmutable automática (Ley 172-13).
    - Métodos e interfaces tipados en `frontend/src/lib/apiClient.ts` (`registrarMovimiento`, `previsualizarMovimiento`, `listarMovimientos`, `obtenerMovimientoPorId`).
    - Batería de 62 pruebas automatizadas superadas al 100% en `SistemaUOD.Tests` (0 fallos).
    - Compilación estricta y generación de páginas estáticas en verde en Next.js Turbopack (`npm run build`).
  - ✅ Prompt 7.4: **Pantalla de movimientos (cabecera y líneas wizard)**:
    - Componente interactivo `MovementsView.tsx` estructurado con el patrón de cabecera y líneas wizard en 3 pasos:
      - *Paso 1 (Datos generales):* Selector interactivo de tipos (`entrada`, `salida`, `traslado`, `ajuste`, `devolucion`, `baja`) con chips y paleta UOD, selector dinámico de ubicación origen y destino con validación de no coincidencia, motivo obligatorio ($\ge 5$ caracteres) y soporte para documento o conduce adjunto.
      - *Paso 2 (Líneas de recursos):* Selector predictivo con debounce y visualización de stock disponible en la ubicación seleccionada antes de añadir, alerta visual inmediata ante intento de salida que supere el inventario físico, y botón para agregar recursos directamente mediante lectura de código QR / código de barras con la cámara (`CameraScannerModal`).
      - *Paso 3 (Impacto en existencias):* Simulación transaccional previa vía `apiClient.previsualizarMovimiento` que muestra tabla de balance (*Stock Actual*, *Operación*, *Stock Resultante*), bloqueo estricto si hay saldo negativo y confirmación atómica con retroalimentación toast y visualización del correlativo institucional generado (`MOV-YYYY-000001`).
    - Pestaña de bitácora e historial con filtros rápidos por tipo, búsqueda de texto y modal drawer de detalle de líneas.
    - Compilación estricta y generación de páginas estáticas en verde en Next.js Turbopack (`npm run build`).
  - ✅ Prompt 7.5: **Historial y línea de tiempo**:
    - *Historial de movimientos filtrable y exportación CSV:* Filtros combinables por correlativo/búsqueda, tipo, ubicación institucional y rango de fechas (desde/hasta). Endpoint `GET /api/v1/movimientos/exportar` que genera archivo CSV con BOM UTF-8 y codificación compatible con Microsoft Excel en español. Paginación y control de estados en `MovementsView.tsx`.
    - *Stock mínimo editable por recurso con indicadores visuales:* Endpoint `PATCH /api/v1/recursos/{id}/stock-minimo` protegido con `Policies.ExigirGestionInventario` para actualizar umbrales de stock mínimo, stock máximo y punto de reorden RF-12. Modal accesible "Ajustar Umbrales de Stock (RF-12)" en `CatalogView.tsx` e indicadores visuales de estado en tiempo real en tabla y tarjetas ("En Stock", "Stock Bajo", "Punto Reorden", "Agotado").
    - *Línea de tiempo del recurso:* Pestaña interactiva "Línea de Tiempo" en la ficha técnica (`ResourceDetailModal.tsx`) que despliega la trazabilidad cronológica vertical de transferencias, entradas y consumos que involucran al recurso, con correlativo institucional, tipo, deltas de cantidad ($\pm$), responsable y motivo.
    - Batería de 64 pruebas automatizadas superadas al 100% en `SistemaUOD.Tests` (0 fallos).
    - Compilación estricta y generación de páginas estáticas en verde en Next.js Turbopack (`npm run build`).
  - ✅ Prompt 7.6: **Pruebas y cierre formal de la Etapa 7**:
    - Batería de pruebas de integración de extremo a extremo (E2E) `CicloCompletoMovimientosExistenciasTests.cs` validando el ciclo vital del inventario:
      - Estado inicial de existencias y clasificación RF-12 (`agotado`).
      - Recepción / Entrada de existencias con transición dinámica a estado `normal`.
      - Traslado atómico entre ubicaciones institucionales con balance exacto y conservación de masa.
      - Salida / Despacho de existencias y disparo preventivo del punto de reorden (`reorden`).
      - Validación atómica estricta anti-saldo negativo (rechazo `400 BadRequest` sin mutación fantasma).
      - Idempotencia transaccional con `X-Idempotency-Key` previniendo duplicados ante reintentos de red.
    - **Total de pruebas automatizadas en .NET:** **65 pruebas superadas al 100% (0 fallos)** en `SistemaUOD.Tests`.
    - Compilación estricta sin advertencias en Next.js Turbopack (`npm run build` con 6/6 rutas estáticas/dinámicas generadas).
    - Verificación visual en vivo en el navegador de la bitácora transaccional y exportación.
    - **Etapa 7 completada y cerrada formalmente al 100%.**
- **Etapa 8 – Activos fijos, custodios y depreciación (RF-16 a RF-20):** ✅ Completada al 100%:
  - ✅ Prompt 8.1 – **Modelo y API de Activos Fijos y Series:**
    - Endpoints RESTful completos (`ActivosEndpoints.cs`) bajo Minimal APIs: `GET /api/v1/activos` (filtros combinados por texto, recurso, categoría, ubicación, responsable, placa institucional y estado, con paginación `PagedResult<T>`), `GET /api/v1/activos/{id}`, `GET /api/v1/activos/placa/{placa}` (búsqueda directa por placa institucional `EQ-XX`), `POST`, `PUT`, `PATCH /estado` y `DELETE` (baja administrativa justificada).
    - Servicio `ActivoService.cs` con validación estricta de placa institucional única en mayúsculas, existencia y actividad del recurso y ubicación física, y mapeo de historiales de asignaciones y mantenimientos técnicos.
    - Políticas de seguridad por rol (`Policies.ExigirGestionInventario` para escritura, `403 Forbidden` para `consulta`, lectura autenticada).
    - Interfaces y cliente tipado en `frontend/src/lib/apiClient.ts` (`listarActivos`, `obtenerActivoPorId`, `obtenerActivoPorPlaca`, `crearActivo`, `actualizarActivo`, `cambiarEstadoActivo`, `darDeBajaActivo`).
    - Conexión dinámica en `AssetsView.tsx` consumiendo la API de Supabase en vivo para los 341 activos TI institucionales con fallback automático.
    - **Total de pruebas automatizadas en .NET:** **74 pruebas superadas al 100% (0 fallos)** en `SistemaUOD.Tests`.
    - Compilación estricta y generación de páginas estáticas en verde en Next.js Turbopack (`npm run build` con 6/6 páginas generadas).
  - ✅ Prompt 8.2 – **Traslados de activos y cambio de custodio (RF-17 y RF-18):**
    - Endpoints RESTful transaccionales (`ActivosEndpoints.cs`): `POST /api/v1/activos/{id}/trasladar`, `POST /api/v1/activos/{id}/asignar-custodio` y `GET /api/v1/activos/{id}/acta-entrega`.
    - Servicio `ActivoService.cs` con transacción atómica: validación estricta de activo activo (no baja), verificación de ubicación destino activa, finalización de asignaciones previas, creación de registro en `AsignacionPrestamo`, generación de correlativo institucional de movimiento `MOV-YYYY-XXXXXX` en `Movimientos`, registro de auditoría inmutable (Ley 172-13) y generación de número de acta oficial `ACTA-YYYY-XXXXXX`.
    - Componente interactivo `ActaEntregaModal.tsx` con diseño institucional UOD: membrete de la Universidad Odontológica Dominicana, código oficial de acta, ficha técnica del bien (placa `EQ-XX`, serie, SKU, modelo), trazabilidad de ubicación y custodios, 4 cláusulas de responsabilidad patrimonial y recuadros formales de firmas para Emisor TI y Custodio Receptor con soporte nativo de impresión/PDF `@media print`.
    - Componente `TransferAssetModal.tsx` integrado en `AssetsView.tsx` para realizar traslados in-situ entre las 49 sedes y clínicas odontológicas UOD, disparando automáticamente el acta oficial.
    - **Total de pruebas automatizadas en .NET:** **78 pruebas superadas al 100% (0 fallos)** en `SistemaUOD.Tests`.
    - Compilación estricta y generación de páginas estáticas en verde en Next.js Turbopack (`npm run build` con 6/6 páginas generadas).
  - ✅ Prompt 8.3 – **Depreciación y cálculo de valor en libros (RF-19):**
    - Endpoints RESTful contables (`DepreciacionEndpoints.cs`) bajo Minimal APIs: `GET /api/v1/depreciacion/resumen` (totales consolidados, porcentaje amortizado y desglose por categorías tecnológicas), `GET /api/v1/depreciacion/reporte` (listado paginado multivariable con filtros por fecha de corte, categoría, ubicación y estado de depreciación), `GET /api/v1/depreciacion/activo/{id}` (cálculo individualizado con fecha de corte dinámica), `GET /api/v1/depreciacion/activo/{id}/tabla` (tabla proyectada de los 48 periodos mensuales de amortización) y `GET /api/v1/depreciacion/exportar` (exportación CSV con BOM UTF-8 y delimitadores `;` optimizado para Excel en español).
    - Servicio `DepreciacionService.cs` implementando la fórmula en línea recta según normativas de la DGII (Ley 11-92 - Categoría 2 para equipos de procesamiento de datos y TI: 25% anual, vida útil de 48 meses y 5% de valor residual estándar).
    - Métodos e interfaces tipados en `frontend/src/lib/apiClient.ts` (`obtenerResumenDepreciacion`, `listarReporteDepreciacion`, `obtenerDepreciacionActivo`, `obtenerTablaAmortizacionActivo`, `exportarDepreciacionCsv`).
    - Componente interactivo `DepreciationModal.tsx` con diseño institucional UOD: ficha del activo (placa `EQ-XX`, serie, modelo, ubicación, custodio), selector dinámico de fecha de corte, 4 tarjetas de indicadores financieros (Costo Histórico DOP, Depreciación Acumulada DOP, Valor Neto en Libros DOP, y Vida Útil en Meses), barra de progreso de amortización, tabla expandible de los 48 periodos mensuales, descarga directa de CSV contable del activo e impresión limpia.
    - Integración en `AssetsView.tsx` con botón de exportación masiva en encabezado ("Reporte Fiscal DGII (CSV)") y botones de acceso directo a la calculadora de depreciación por fila en la tabla, en cada tarjeta de activo y en la ficha de detalle.
    - **Total de pruebas automatizadas en .NET:** **84 pruebas superadas al 100% (0 fallos)** en `SistemaUOD.Tests`.
    - Compilación estricta y generación de páginas estáticas en verde en Next.js Turbopack (`npm run build` con 6/6 páginas generadas).
  - ✅ Prompt 8.4 – **Mantenimientos e historial técnico (RF-20):**
    - Endpoints RESTful para servicios técnicos (`MantenimientosEndpoints.cs`) bajo Minimal APIs: `GET /api/v1/mantenimientos` (listado multivariable con filtros por placa institucional `EQ-XX`, tipo, estado, fechas y paginación), `GET /api/v1/mantenimientos/{id}`, `GET /api/v1/mantenimientos/activo/{activoId}` (historial técnico completo y cronológico de un bien físico), `GET /api/v1/mantenimientos/activo/{activoId}/resumen` (resumen consolidado con KPIs de intervenciones preventivas, correctivas, calibraciones y costo total invertido en DOP), `POST /api/v1/mantenimientos` (programación de servicio con cambio automático del activo a `en_mantenimiento` ante fallos correctivos), `PUT /api/v1/mantenimientos/{id}`, `POST /api/v1/mantenimientos/{id}/completar` (cierre de servicio con costo real incurrido, observaciones técnicas y restablecimiento del activo a `disponible` o `en_uso`) y `POST /api/v1/mantenimientos/{id}/cancelar` (anulación justificada con motivo registrado en auditoría Ley 172-13).
    - Servicio `MantenimientoService.cs` implementando la lógica técnica de taller: validación estricta de activo no dado de baja, proveedor activo (si aplica), auditoría inmutable de estados y transición operativa del bien patrimonial.
    - Interfaces y cliente tipado en `frontend/src/lib/apiClient.ts` (`MantenimientoDto`, `CrearMantenimientoDto`, `CompletarMantenimientoDto`, `listarMantenimientos`, `obtenerMantenimientoPorId`, `listarMantenimientosPorActivo`, `obtenerResumenMantenimientosActivo`, `registrarMantenimiento`, `completarMantenimiento`, `cancelarMantenimiento`).
    - Componente interactivo `MaintenanceModal.tsx` con estética institucional UOD: tarjeta de presentación del activo (placa, modelo, serie), 4 KPIs financieros y técnicos (total servicios, costo total invertido DOP, último servicio y próximo programado), línea de tiempo interactiva con badges de tipo y estado, diálogo in-situ para finalizar intervenciones con costo real y formulario de programación de nuevos servicios con selector de tipo (`preventivo`, `correctivo`, `calibracion`), fecha, técnico responsable y switch de aislamiento del equipo.
    - Integración completa en `AssetsView.tsx` con botón de herramientas `Wrench` en la tabla densa, en cada tarjeta de activo y en la ficha de detalle individual.
    - **Total de pruebas automatizadas en .NET:** **92 pruebas superadas al 100% (0 fallos)** en `SistemaUOD.Tests`.
    - Compilación estricta y generación de páginas estáticas en verde en Next.js Turbopack (`npm run build` con 6/6 páginas generadas).
  - ✅ Prompt 8.5 – **Bajas patrimoniales y Actas Oficiales de Descargo en PDF:**
    - Endpoints RESTful patrimoniales (`ActivosEndpoints.cs`): `POST /api/v1/activos/{id}/descargo` y `GET /api/v1/activos/{id}/acta-descargo`.
    - Servicio `ActivoService.cs` con transacción atómica: validación de activo activo, transición de estado a `dado_de_baja`, liberación de custodio, generación automática de correlativo de movimiento `MOV-YYYY-XXXXXX` en `Movimientos` con auditoría Ley 172-13, y emisión formal de número de acta `ACTA-DESCARGO-YYYY-XXXXXX`.
    - Componente `DecommissionAssetModal.tsx`: diálogo guiado para desincorporación patrimonial con validación de motivo obligatorio, dictamen técnico circunstanciado, selector de destino del bien (`descarte_ecologico`, `repuestos`, `reciclaje`, `donacion`) y resolución administrativa de soporte.
    - Componente `ActaDescargoModal.tsx`: formato oficial imprimible y exportable a PDF con membrete institucional de la Universidad Odontológica Dominicana, dictamen técnico pericial, valores contables (histórico y valor en libros), 4 cláusulas formales de desincorporación patrimonial y 3 recuadros de firmas colegiadas (Tecnología TI, Auditoría Interna Institucional y Dirección Administrativa y Financiera UOD) con optimización `@media print`.
    - Integración completa en `AssetsView.tsx` con botón `AlertOctagon` por fila en tabla, en tarjetas y en ficha de detalle, conmutando automáticamente entre el flujo de desincorporación y la visualización/reimpresión del acta oficial de descargo.
  - ✅ Prompt 8.6 – **Pruebas integrales y cierre formal de la Etapa 8:**
    - Batería de pruebas automatizadas en `backend/tests/SistemaUOD.Tests/ActivosEndpointsTests.cs`:
      - Rechazo con `403 Forbidden` al intentar dar de baja activos con roles sin privilegio (`consulta`).
      - Desincorporación atómica con rol `admin_inventario`, generación de acta de descargo oficial con prefijo canónico `ACTA-DESCARGO-` y estado resultante `dado_de_baja`.
      - Recuperación y validación del acta oficial de descargo con firmas colegiadas y cláusulas patrimoniales completas.
    - **Total de pruebas automatizadas en .NET:** **95 pruebas superadas al 100% (0 fallos)** en `SistemaUOD.Tests`.
    - Compilación estricta en verde en Next.js Turbopack (`npm run build` con 6/6 páginas generadas sin errores).
    - **Etapa 8 completada y cerrada formalmente al 100%.**
- **Etapa 9 – Tutor y Asistente de IA (Gemini API & Function Calling):** ✅ Completada al 100%:
  - ✅ Prompt 9.1 – **Diseño del Asistente:** Arquitectura aprobada: orquestación exclusiva en el backend de .NET 10 LTS, modelo aislado sin acceso directo a SQL, herencia estricta del rol del usuario autenticado, y políticas de cero secretos en prompts.
  - ✅ Prompt 9.2 – **Llave y Modelos de Gemini:** Credenciales configuradas en `Gemini:ApiKey` y modelo configurable (`gemini-1.5-flash` / `gemini-2.0-flash` vía Google AI Studio) con control de temperatura y límites de tokens.
  - ✅ Prompt 9.3 – **Servicio del Asistente (API .NET 10 LTS):** Implementación de `IAssistantService` y `AssistantService.cs` bajo Clean Architecture con soporte para multi-turno, control de errores y motor semántico de contingencia local institucional con datos reales. Endpoint `POST /api/v1/assistant/chat` protegido con autenticación JWT y `GET /api/v1/assistant/info`.
  - ✅ Prompt 9.4 – **Funciones de Lectura (Function Calling):** Herramientas declaradas en formato JSON Schema de Gemini: `buscar_recursos`, `consultar_existencias`, `consultar_activo_fijo` (búsqueda de equipos `EQ-01` a `EQ-341`), `listar_alertas_inventario` (artículos en punto de reorden RF-12) y `consultar_depreciacion` (cálculo DGII Cat. 2).
  - ✅ Prompt 9.5 – **Instrucciones del Sistema y Modo Tutor:** Formato pedagógico interactivo con manuales operativos institucionales UOD paso a paso para recepción/entrada, traslados entre sedes, desincorporación patrimonial y depreciación contable.
  - ✅ Prompt 9.6 – **Conexión del Panel Lateral (Frontend Next.js):** Actualización de `AiAssistantDrawer.tsx` conectado a `apiClient.enviarMensajeAsistente`, con conmutador de modo (Operativo vs Tutor), badges de herramientas invocadas por la IA, botones de sugerencias rápidas UOD y tarjetas interactivas de confirmación obligatoria previa para toda propuesta de movimiento.
  - ✅ Prompt 9.7 – **Registro, Límites y Costos:** Endpoint `GET /api/v1/assistant/consumo` protegido con `Policies.ExigirGestionInventario` que devuelve métricas de uso por modo, herramientas invocadas, costo acumulado en DOP ($0.05 DOP/llamada), presupuesto institucional ($500.00 DOP), alerta si supera el 80%, límite diario de 150 consultas/usuario y aviso de depuración a 30 días según la Ley 172-13.
  - ✅ Prompt 9.8 – **Evaluación y Cierre de Etapa 9:** Batería de pruebas de verificación automatizadas en `AssistantEndpointsTests.cs`:
    - Consulta de existencias y alertas de inventario RF-12.
    - Consulta de ficha técnica y custodio de equipos físicos UOD (`EQ-01`).
    - Guías pedagógicas de procedimientos en modo tutor.
    - Rechazo estricto de propuestas de movimiento a roles de solo lectura (`consulta`).
    - Formulación de propuestas de movimiento con tarjeta de confirmación a roles autorizados (`admin_inventario`).
    - Seguridad de acceso en endpoint de consumo y presupuesto.
  - **Total de pruebas automatizadas en .NET:** **104 pruebas superadas al 100% (0 fallos)** en `SistemaUOD.Tests`.
  - Compilación estricta y generación de páginas estáticas en verde en Next.js Turbopack (`npm run build` con 6/6 páginas generadas).
  - **Etapa 9 completada y cerrada formalmente al 100%.**
- **Etapa 10 – Asistente de IA: acciones con confirmación y visión multimodal:** ✅ Completada al 100%:
  - ✅ Prompt 10.1 – **Diseño del mecanismo de acciones con confirmación y reversión (Aprobado):** Protocolo estricto donde la IA jamás escribe directamente en la base de datos (Reglas de Oro #4 y #5). En su lugar, formula propuestas en memoria con ventana de 15 minutos, requiriendo confirmación física explícita del usuario con previsualización del balance.
  - ✅ Prompt 10.2 / 10.3 – **Confirmación y Ejecución Atómica:**
    - Endpoints RESTful en `AssistantEndpoints.cs`: `POST /api/v1/assistant/propuestas/{id}/confirmar` y `POST /api/v1/assistant/propuestas/{id}/cancelar`.
    - Validación estricta de políticas por rol (`Policies.ExigirOperacionAlmacen`): rechazo `403 Forbidden` a roles `consulta` y `auditor`.
    - Registro atómico de `Movimiento` con correlativo oficial institucional `MOV-YYYY-XXXXXX`, flag `OrigenIa = true`, actualización de saldos de existencias en PostgreSQL y registro de auditoría inmutable (Ley 172-13).
  - ✅ Prompt 10.4 – **Reversión y Deshacer (*Undo*) de 5 Minutos:**
    - Endpoint `POST /api/v1/assistant/propuestas/{id}/revertir`.
    - Ventana temporal estricta de 5 minutos (300 segundos). Al pulsar el botón de deshacer, se genera un contra-movimiento inverso compensatorio (`MOV-YYYY-XXXXXX`) que restablece exactamente los saldos previos en origen y destino sin violar la inmutabilidad de la bitácora histórica.
    - Temporizador dinámico en `AiAssistantDrawer.tsx` con cuenta regresiva en vivo y barra flotante de deshacer accesible.
  - ✅ Prompt 10.5 / 10.6 – **Visión Multimodal con Gemini y Detección de Duplicados:**
    - Endpoint `POST /api/v1/assistant/analizar-foto` (`AnalisisFotoRecursoDto` con Base64 y observaciones).
    - Extracción de atributos de equipo/suministro odontológico o tecnológico (nombre, SKU institucional sugerido, categoría, tipo de bien, marca/modelo, costo estimado en DOP).
    - Detección preventiva de duplicados en el catálogo institucional: si el recurso ya existe o coincide con marcas/modelos registrados, se genera bandera `PosibleDuplicado = true` con alerta visual destacada en la tarjeta del asistente.
    - Botón de cámara y selector de archivos integrado en `AiAssistantDrawer.tsx`.
  - ✅ Prompt 10.7 – **Pruebas integrales y cierre formal:**
    - Batería de pruebas automatizadas en `backend/tests/SistemaUOD.Tests/AssistantEndpointsTests.cs`:
      - Rechazo con `403 Forbidden` al intentar confirmar propuestas con rol `consulta`.
      - Confirmación exitosa con rol de almacén (`encargado_almacen` / `admin_inventario`), emisión de movimiento `MOV-YYYY-XXXXXX` y trazabilidad.
      - Cancelación y descarte de propuestas pendientes.
      - Reversión exitosa (*undo*) dentro de los 5 minutos con contra-movimiento compensatorio.
      - Análisis visual multimodal y validación de entrada vacía con `400 BadRequest`.
    - **Total de pruebas automatizadas en .NET:** **110 pruebas superadas al 100% (0 fallos)** en `SistemaUOD.Tests`.
    - Compilación estricta y generación de páginas estáticas en verde en Next.js Turbopack (`npm run build` con 6/6 páginas generadas).
    - **Etapa 10 completada y cerrada formalmente al 100%.**
- **Etapa 11 – Notificaciones por correo (Gmail API y cola transaccional):** ✅ Completada al 100%:
  - ✅ Prompt 11.1 – **Motor de Alertas y Reglas Configurables:**
    - Entidades `Alerta`, `ColaCorreo` y `NotificacionPreferencia` mapeadas en `ApplicationDbContext.cs` sin migraciones EF (Database-first con PostgreSQL).
    - Servicio `AlertaService.cs` implementando las 3 reglas institucionales críticas:
      1. *Stock bajo / agotado (RF-12):* evaluación frente a stock mínimo y punto de reorden con severidades `urgente`, `advertencia` e `info`.
      2. *Lotes clínicos por vencer:* control sanitario a 30 días y retiro inmediato de insumos vencidos.
      3. *Mantenimientos técnicos TI:* avisos preventivos a 7 días y alertas de servicios vencidos.
      - Lógica anti-duplicados estricta: previene saturación descartando alertas redundantes para recursos que ya tienen avisos abiertos.
    - Endpoints RESTful Minimal APIs (`AlertasEndpoints.cs`): `GET /api/v1/alertas`, `GET /api/v1/alertas/resumen`, `GET /api/v1/alertas/conteo-no-leidas`, `POST /api/v1/alertas/evaluar`, `PATCH /api/v1/alertas/{id}/leida`, `POST /api/v1/alertas/marcar-todas-leidas` y `DELETE /api/v1/alertas/{id}`.
  - ✅ Prompt 11.2 – **Notificaciones en Vivo en la Aplicación (Frontend):**
    - Campana interactiva en `Navbar.tsx` con contador en vivo, polling periódico y dropdown con visualización de severidades (`#EF4444`, `#F59E0B`, `#1C3177`), marcado rápido de leídas y enlace a la vista completa.
    - Componente institucional `AlertsView.tsx`: Centro de Alertas y Notificaciones con 4 KPIs de balance, filtros multivariables (estado, severidad, tipo), disparador manual de evaluación de reglas, marcado masivo, eliminación y modal de preferencias.
    - Pestaña 'Centro de Alertas' integrada en la navegación lateral de `Sidebar.tsx` con badges dinámicos.
  - ✅ Prompt 11.3 & 11.4 – **Abstracción de Correo, Plantillas HTML UOD y Cola Transaccional:**
    - Interfaz abstracta `IEmailSender` desacoplada: soporte transparente para SMTP / Gmail API y modo Mock seguro para desarrollo y pruebas locales.
    - Generador de plantillas HTML institucionales `EmailTemplateService.cs`: diseño con membrete oficial de la Universidad Odontológica Dominicana, colores institucionales (`#1C3177`, `#3DAA5C`), tablas de datos y botones accesibles para stock bajo, vencimiento de lotes clínicos, mantenimientos y traslados con acta oficial.
    - Servicio en segundo plano `EmailQueueBackgroundService.cs` (`BackgroundService`): procesamiento periódico de la tabla `cola_correos`, reintentos exponenciales automáticos (hasta 3 intentos) y auditoría de errores en `UltimoError`.
    - Endpoints administrativos de gestión de cola (`CorreosEndpoints.cs`): `GET /api/v1/correos/cola`, `GET /api/v1/correos/cola/estadisticas`, `POST /api/v1/correos/cola/{id}/reintentar` y `POST /api/v1/correos/cola/procesar`.
  - ✅ Prompt 11.5 – **Preferencias de Usuario y Tarea Programada Diaria:**
    - Endpoints `GET /api/v1/notificaciones/preferencias` y `PUT /api/v1/notificaciones/preferencias` por usuario autenticado.
    - Servicio programado periódico `ScheduledInventoryAlertService.cs` (`BackgroundService`) que evalúa el inventario automáticamente y genera alertas/correos de forma periódica.
  - ✅ Prompt 11.6 – **Pruebas Automatizadas y Cierre Formal:**
    - Batería de pruebas automatizadas en `SistemaUOD.Tests` (`AlertasEndpointsTests.cs` y `CorreosEndpointsTests.cs`):
      - Paginación y conteo rápido de no leídas.
      - Disparo y anti-duplicados del motor de reglas.
      - Permisos de seguridad y rechazo `403 Forbidden` a roles sin privilegio.
      - Guardado y recuperación de preferencias de notificación.
      - Encolamiento transaccional, reintento manual y procesamiento en lote por el worker.
      - Validación de la estructura HTML UOD de todas las plantillas de correo.
    - **Total de pruebas automatizadas en .NET:** **125 pruebas superadas al 100% (0 fallos)** en `SistemaUOD.Tests`.
    - Compilación estricta y generación de páginas estáticas en verde en Next.js Turbopack (`npm run build` con 6/6 páginas generadas sin errores).
    - **Etapa 11 completada y cerrada formalmente al 100%.**
- **Etapa 12 – Compras, recepción y órdenes (sin pagos) / Inventario físico / Importación Excel:** ✅ Completada al 100%:
  - ✅ Prompt 12.1: **Backend Compras y Recepción (órdenes sin pagos)**:
    - Entidades `OrdenCompra` y `OrdenCompraLinea` mapeadas en `Entities.cs` y `ApplicationDbContext.cs`.
    - DTOs `CompraDtos.cs` con validaciones de cantidades positivas, precios y fechas estimadas.
    - Servicio `CompraService.cs` con numeración secuencial correlativa institucional `OC-YYYY-XXXXXX`, flujo de estados estricto (`borrador` -> `aprobada` -> `enviada` -> `recibida_parcial`/`recibida_total` o `cancelada`).
    - Recepción de mercancía transaccional atómica: valida cantidades pendientes, genera movimiento oficial tipo `entrada` vía `IMovimientoService`, crea lotes con fecha de vencimiento y actualiza automáticamente los saldos y estados de la orden.
    - Integración con sugerencias de compra automáticas basadas en el algoritmo RF-12 (`StockTotal - StockReservado <= StockMinimo`).
    - Endpoints RESTful completos en `ComprasEndpoints.cs` con autorización por rol (`Policies.ExigirGestionInventario`).
  - ✅ Prompt 12.2: **Frontend Compras y Recepción**:
    - Componente interactivo `PurchaseOrdersView.tsx` con 4 tarjetas de métricas en cabecera (Órdenes Activas, Mercancía Pendiente, Recibidas este Mes, Inversión Comprometida DOP).
    - Modal de creación de órdenes con selector de proveedor, fecha estimada, motivo, líneas de recursos y botón de prellenado automático a partir de alertas de stock bajo (RF-12).
    - Modal de recepción de mercancía por líneas con selector de ubicación destino, número de lote, fecha de vencimiento y soporte para entregas parciales o totales.
    - Modal de visualización imprimible optimizado para formato físico con membrete institucional UOD y firmas de autorización.
    - Pestaña "Órdenes de Compra" integrada en `SuppliersView.tsx` y permisos dinámicos en `Sidebar.tsx`.
  - ✅ Prompt 12.3: **Backend Inventario Físico y Conteos**:
    - Entidades `ConteoFisico` y `ConteoFisicoLinea` con columna calculada PostgreSQL `diferencia` (`GENERATED ALWAYS AS (cantidad_fisica - cantidad_sistema) STORED`) mapeada en EF Core como `ValueGeneratedOnAddOrUpdate()`.
    - Servicio `ConteoFisicoService.cs` con precarga opcional de stock existente por ubicación, soporte de sincronización por lotes para modo offline, e incremento continuo por escaneo de códigos de barra o QR.
    - Proceso de conciliación transaccional: calcula discrepancias y genera automáticamente movimientos de inventario tipo `ajuste` (`diferencia > 0` ingresa a destino, `diferencia < 0` descuenta de origen) con auditoría inmutable (Ley 172-13).
    - Endpoints RESTful completos en `ConteosFisicosEndpoints.cs` (`GET`, `POST`, `PUT /lineas`, `POST /escanear`, `POST /conciliar`, `POST /cancelar`).
  - ✅ Prompt 12.4: **Frontend Inventario Físico y Auditoría**:
    - Componente interactivo `PhysicalAuditView.tsx` integrado en la barra de navegación lateral (`Sidebar.tsx`) bajo la ruta `/auditoria-fisica`.
    - Selector institucional de ubicación y control de sesión de conteo activa sincronizada en vivo con la API y persistida en `localStorage` para tolerancia a desconexiones.
    - Integración de escáner con cámara PWA (`CameraScannerModal.tsx`) para incremento instantáneo de conteo al detectar etiquetas físicas.
    - Auditoría patrimonial en vivo para los 341 equipos tecnológicos institucionales con verificación de placa (`EQ-XX`), estado físico y custodio asignado.
    - Modal de conciliación con tabla de balance (*Stock Teórico*, *Conteo Físico*, *Discrepancia*), motivo obligatorio y aplicación atómica con toast y badge de éxito.
  - ✅ Prompt 12.5: **Importación masiva desde Excel / CSV**:
    - DTOs `ImportacionDtos.cs`, interfaz `IImportacionService.cs` y servicio `ImportacionService.cs` con generación de plantilla CSV oficial codificada en UTF-8 BOM, validación exhaustiva de campos requeridos, detección de duplicados en catálogo y creación en lote de recursos con auto-creación de categorías faltantes.
    - Endpoints RESTful en `ImportacionEndpoints.cs` (`GET /api/v1/importacion/plantilla-csv`, `POST /api/v1/importacion/validar`, `POST /api/v1/importacion/ejecutar`).
    - Componente interactivo `ImportResourcesModal.tsx` con descarga de plantilla con un clic, zona Drag & Drop para archivos CSV/Excel, análisis de cabeceras tolerante a comas o punto y coma, tabla de previsualización con badges de estado (Válido / Error) y filtro rápido, aviso de duplicados y alta masiva con barra de progreso.
    - Botón de acceso directo «Importar CSV» integrado en la barra de herramientas de `CatalogView.tsx` protegido con permisos de gestión de inventario.
  - ✅ Prompt 12.6: **Pruebas automatizadas y cierre formal de la Etapa 12**:
    - Batería de pruebas automatizadas en `backend/tests/SistemaUOD.Tests` superada al 100%: **143 pruebas ejecutadas, 143 aprobadas, 0 fallos**.
    - Compilación estricta y generación de páginas estáticas en verde en Next.js Turbopack (`npm run build` con 6/6 páginas generadas sin errores).
    - **Etapa 12 completada y cerrada formalmente al 100%.**
- **Etapa 13 – Notificaciones, reportes ejecutivos e inteligencia analítica:** ✅ Completada al 100%:
  - ✅ Prompt 13.1: **Expansión del Asistente de IA (Mantenimientos, Compras y Conteos)**:
    - Incorporación de nuevas declaraciones de herramientas y esquemas OpenAPI para Gemini API: `consultar_mantenimientos`, `consultar_ordenes_compra`, `consultar_conteos_fisicos` y `preparar_propuesta_compra`.
    - Motor de contingencia heurístico local ampliado en `AssistantService.cs` para soporte offline ante fallos de red o límites de cuota de la API de IA.
    - Soporte ampliado para propuestas de acción interactiva con confirmación obligatoria previa (`orden_compra`) con persistencia en borrador y auditoría inmutable automática (Ley 172-13).
    - DTOs ampliados en `AssistantDtos.cs` con `ProveedorNombre` y `CostoEstimado`. Batería de pruebas en `AssistantEndpointsTests.cs` (18/18 pruebas aprobadas).
  - ✅ Prompt 13.2: **Backend de Reportes Ejecutivos y Analítica Patrimonial**:
    - DTOs `ReporteDtos.cs` (`ResumenEjecutivoDto`, `RotacionConsumibleItemDto`, `DistribucionParqueTiDto`, `ReporteOrdenesProveedorDto`).
    - Interfaz `IReporteService.cs` y servicio `ReporteService.cs` con consolidación en tiempo real de:
      - 4 KPIs ejecutivos institucionales (Total activos físicos, desglose operativo en uso / almacén / mantenimiento / baja, stock consumibles y exactitud de inventario).
      - Cálculo de depreciación contable según DGII Categoría 2 (25% anual, vida útil de 48 meses, valor residual 5% conforme al Código Tributario Dominicano).
      - Análisis de rotación de consumibles institucionales con tasa de giro y costo total consumido en DOP.
      - Distribución y participación porcentual del parque tecnológico UOD por categoría institucional.
      - Desempeño y tasa de cumplimiento por proveedor de suministros tecnológicos.
      - Exportación de balance patrimonial en formato CSV codificado con UTF-8 BOM compatible con Microsoft Excel en español.
    - Endpoints RESTful en `ReportesEndpoints.cs` (`GET /api/v1/reportes/resumen-ejecutivo`, `GET /api/v1/reportes/rotacion-consumibles`, `GET /api/v1/reportes/distribucion-parque-ti`, `GET /api/v1/reportes/proveedores`, `GET /api/v1/reportes/exportar-patrimonial-csv`).
    - Batería de 6 pruebas de integración dedicadas en `ReportesEndpointsTests.cs` aprobadas al 100%.
  - ✅ Prompt 13.3: **Frontend de Reportes Ejecutivos e Inteligencia Analítica**:
    - Componente interactivo `ReportsView.tsx` conectado a los endpoints en vivo de la API mediante `apiClient.ts` con manejo de estados de carga, reintentos y tolerancia a fallos.
    - 4 Tarjetas KPI ejecutivas con paleta institucional UOD (`#1C3177`, `#3DAA5C`, `#06B6D4`, `#F7F9FC`).
    - 5 Subpestañas organizadas:
      - *Resumen Patrimonial y Fiscal:* Balance contable DGII Cat. 2, barra multisegmento de operatividad física y botón de exportación CSV.
      - *Distribución Parque TI:* Tabla y barras de participación de los 341 equipos por categoría tecnológica del levantamiento 2026.
      - *Rotación de Consumibles:* Monitoreo de stock actual, salidas, rotación y costo consumido en DOP con barra de búsqueda reactiva.
      - *Proveedores y Órdenes:* Historial de órdenes de compra, efectividad de entrega y volumen contratado en DOP.
      - *Auditoría y Exactitud:* Índice de concordancia del inventario físico y método de cálculo de discrepancias.
    - Integración directa con el Asistente IA mediante sugerencias de preguntas rápidas sobre presupuesto, órdenes de compra y alertas de stock.
    - Botón de descarga con un clic de reporte patrimonial en CSV (`apiClient.exportarReportePatrimonialCsv()`).
  - ✅ Prompt 13.4: **Pruebas automatizadas y cierre formal de la Etapa 13**:
    - Batería de pruebas automatizadas en `backend/tests/SistemaUOD.Tests` superada al 100%: **152 pruebas ejecutadas, 152 aprobadas, 0 fallos**.
    - Compilación estricta y generación de páginas estáticas en verde en Next.js Turbopack (`npm run build` con 6/6 páginas generadas sin errores).
    - **Etapa 13 completada y cerrada formalmente al 100%.**
- **Etapa 14 – Empaquetado Docker y Preparación para Despliegue en Producción:** ✅ Completada al 100%:
  - ✅ **Dockerfile Backend:** Multi-stage build optimizado para .NET 10 LTS (`mcr.microsoft.com/dotnet/sdk:10.0-noble` y `mcr.microsoft.com/dotnet/aspnet:10.0-noble`), usuario sin privilegios `app`, variables de entorno de producción y probe de salud `/health`.
  - ✅ **Dockerfile Frontend:** Multi-stage build optimizado para Next.js 16 con `output: 'standalone'` en `next.config.ts` (reducción de imagen de 1.5 GB a ~150 MB), usuario sin privilegios `nextjs`, compilación con Turbopack y healthcheck integrado en puerto 3000.
  - ✅ **Docker Compose:** `docker-compose.yml` (entorno local con puertos directos) y `docker-compose.prod.yml` (entorno de producción con gateway Nginx).
  - ✅ **Gateway Nginx:** Configuración institucional en `nginx/nginx.conf` con compresión Gzip, límites de subida de archivos (25 MB para fotos y Excel), encabezados de seguridad (HSTS, X-Frame-Options, X-Content-Type-Options) y proxy reverso unificado para `/api/` y el frontend web.
  - ✅ **Configuración y Guía de Operaciones:** Plantilla `.env.docker.example` con todas las variables requeridas y guía exhaustiva [DEPLOYMENT.md](file:///c:/Users/ryam2/Documents/SistemaUOD/SistemaUOD/DEPLOYMENT.md) con arquitectura, requisitos, puesta en marcha, SSL con Let's Encrypt y copias de seguridad.
  - ✅ **Corrección y Blindaje de Tipos Enum PostgreSQL y Bitácora de Auditoría:**
    - **Migración 5 (`20261021000005_enum_text_casts.sql` / `005_enum_text_casts.sql`):** Creación de casts implícitos de `text` y `varchar` a los 18 tipos ENUM de PostgreSQL (`estado_recurso`, `tipo_mantenimiento`, `estado_mantenimiento`, etc.) para permitir asignaciones parametrizadas seguras desde EF Core/Npgsql sin error 42804.
    - **Alineación de Entidad Mantenimiento:** Inclusión de `ActualizadoEn` y `ChecklistCompletado` en `Entities.cs` y mapeo explícito en `ApplicationDbContext.cs` con tipos `.HasColumnType("date")` para `fecha_programada` y `fecha_ejecutada`.
    - **Seguridad en Auditoría:** Normalización de `UsuarioId` nulo para tokens de desarrollo y verificación de existencia en `perfiles` antes de registrar en `bitacora_auditoria` para evitar violaciones de clave foránea. Validación en vivo completada exitosamente en el navegador.
  - ✅ **Ajustes de Navegación del Dashboard y Notificaciones en Vivo:**
    - **Navegación Corregida en Dashboard (`DashboardView.tsx`):** Sustitución de claves en inglés `'locations'`, `'catalog'`, `'movements'` por las claves canónicas tipadas `NavTab` (`'ubicaciones'`, `'catalogo'`, `'movimientos'`), resolviendo el despliegue en blanco al pulsar "Ver las 49 dependencias", "Explorar catálogo completo (113 modelos)" o "Ver historial completo". Además, las 6 tarjetas de métricas KPI se hicieron interactivas con `cursor-pointer`, hover y navegación directa.
    - **Notificaciones Funcionales en Tiempo Real (`Navbar.tsx`, `Sidebar.tsx`, `Program.cs`):** Autenticación para `dev-token-uod` en `SistemaUOD.Api/Program.cs` para el entorno de desarrollo local, conexión directa con `/api/v1/alertas/conteo-no-leidas` y `/api/v1/alertas`, corrección del operador de conteo nulo, listado con severidades, marcado individual o masivo ("Marcar todas leídas") y reubicación del badge de alertas en la barra lateral al ítem "Centro de Alertas". Validación en vivo en navegador superada.
  - ✅ **Resolución de Custodios Reales en Activos Fijos TI (Levantamiento UOD 2026):**
    - **Backend (`ActivoService.cs`, `RecursoService.cs`, `CodigoService.cs`):** Extracción regex automática del custodio registrado en `Notas` (`Responsable: <nombre>`) cuando `ResponsableId` sea nulo (personal sin usuario Supabase activo aún). Soporte para filtrado por custodio en consultas y resolución universal de códigos.
    - **Frontend (`AssetsView.tsx`, `ResourceDetailModal.tsx`):** Función `resolverCustodioReal(item)` que prioriza `item.responsableNombre`, extrae de `item.notas` o mapea directamente desde `ACTIVOS_ORIGINALES` del levantamiento real de TI UOD (340 equipos con custodio explícito: RYAM, ANDREW, CLAUDIA, ANA CAMAÑO, WINI, NOEMI, etc.). Eliminada la asignación forzada a "Por Asignar", permitiendo búsqueda y filtrado inmediato por nombre de custodio en vivo.
  - ✅ **Sincronización Exacta de Datos Originales Excel vs Supabase y Corrección de Estados:**
    - **Auditoría Exhaustiva de Datos:** Comparación de los 341 registros de `Datos/ACTIVOS 2026 TECNOLOGIA.xlsx` contra Supabase PostgreSQL: 341 ítems en Excel vs 341 ítems en BD, alcanzando **0 discrepancias**.
    - **Corrección de Estado EQ-01:** La Laptop DELL INSPIRON 15 (`EQ-01`, custodio RYAM) se encontraba temporalmente como `disponible` tras pruebas técnicas de mantenimiento; fue restablecida a `en_uso` tal como dicta el Excel original.
    - **Desbloqueo de Paginación (`PagedModels.cs`):** Se incrementó `MaxPageSize` de 100 a 1000 en el backend, resolviendo el truncamiento que mostraba solo 100 equipos en pantalla en lugar de los 341 reales.
    - **Métricas y Filtros Dinámicos (`AssetsView.tsx`):** El selector de estados ahora computa dinámicamente: *Todos los Estados (341)*, *En Uso (337)*, *Disponible (1)* (`EQ-05`), *Dañado / Inactivo (3)* (`EQ-153`, `EQ-154`, `EQ-155`). Verificado 100% en vivo en navegador.
- **Plan de Mejoras SIIA (guia/Mejoras de SIIA – ideas reforzadas y prompts.md):** 🔄 En curso:
  - **Fase 1 – Limpieza y Base:** ✅ Completada al 100%:
    - ✅ **Idea 4 (Eliminación de datos de prueba y foco exclusivo en almacén):** Eliminados datos semilla de prueba clínicos ficticios, garantizado el inventario estricto de 341 equipos físicos del levantamiento TI 2026 y 49 dependencias UOD auténticas. (Commit `d50414e`).
    - ✅ **Idea 8 (Editar perfil institucional):** Modal interactivo `EditProfileModal.tsx`, endpoint seguro `PUT /api/v1/me`, subida de avatar con validación de magic bytes (JPG/PNG/WebP hasta 5 MB), correo protegido de solo lectura, auditoría de cambios y actualización inmediata del avatar en encabezado y menú. (Commit `43441d0`).
    - ✅ **Idea 12 (Configuración y Cierre de Sesión Seguro):** `ThemeContext.tsx` con soporte para temas claro, oscuro y automático persistido en `localStorage` y en perfil de usuario, selector de densidad visual de tablas (cómoda vs compacta), preferencias de notificación e invalidación de sesión real con redirección a login y borrado de tokens. (Commit `507e893`).
  - **Fase 2 – Núcleo de Inventario:** 🔄 En curso:
    - ✅ **Idea 2 (Editar cualquier dato de un activo, incluida la factura):** Migración SQL `007_activos_factura_costo.sql` con `costo_adquisicion`, `factura_url`, `factura_nombre`. Endpoints `POST /api/v1/activos/{id}/factura` (validación de magic bytes PDF/JPG/PNG hasta 10 MB) y `GET /api/v1/activos/{id}/historial`. Componente `EditAssetModal.tsx` con 5 pestañas: Datos Principales, Factura Digital, Fotografías, Código QR e Historial de Cambios. Integrado en tabla, tarjetas y detalle de `AssetsView.tsx`. (Commit `a6d8632`).
    - ✅ **Idea 1 (Ver los activos agrupados por tipo):** Componente interactivo `GroupedAssetsView.tsx` con acordeones inteligentes por tipo de equipo (Laptops, Bocinas, Monitores, CPU, UPS, Impresoras, Teléfonos, etc.), conteo total y desglose por estados (en uso, disponibles, dañados), vista expandida de unidades físicas (`EQ-XX`, serial, ubicación, custodio, estado, botón «Editar»), ordenamiento de grupos (mayor/menor cantidad, A-Z, Z-A), botones «Expandir todos» y «Colapsar todos», filtros integrados y banner de advertencia para activos «Sin clasificar». Selector de vista integrado tanto en «Catálogo de Activos» (`CatalogView.tsx`) como en «Activos Fijos TI» (`AssetsView.tsx`). (Commit `170ec12`).
    - ✅ **Idea 3 (Rediseñar Movimientos, empezando por Entrada):** Rediseño integral de la pantalla de Movimientos (`MovementsView.tsx`) con enfoque primordial en entradas. Dos flujos claros y diferenciados:
      - *Camino A («Nuevo producto o activo»):* Carga de bienes que no están en el catálogo, definiendo atributos técnicos, categoría, costo unitario en DOP, foto con vista previa, factura/conduce digital y ubicación destino de las 49 sedes UOD. Para activos fijos, acepta múltiples números de serie (separados por coma o salto de línea) y genera unidades físicas consecutivas (`EQ-342`, `EQ-343`...) con sus placas institucionales UOD y códigos QR.
      - *Camino B («Agregar más unidades de un recurso existente»):* Búsqueda en catálogo con indicador visual de stock actual; para activos fijos genera secuencialmente placas `EQ-XXX` para cada serie ingresada, y para consumibles suma la cantidad.
      - *Previsualización y Auditoría Transaccional:* En el Paso 3, simulación previa de balance (*Stock Actual*, *Entrada*, *Stock Resultante*) y desglose de unidades físicas que se registrarán con placa UOD y código QR listo. Trazabilidad completa en `bitacora_auditorias`. Verificación exitosa en vivo mediante navegador.
  - **Fase 2 – Núcleo de Inventario:** ✅ Completada al 100%.

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


