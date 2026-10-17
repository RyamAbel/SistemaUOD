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
6. **Sistema de Diseño:** Se respeta la paleta institucional:
   - Primario Índigo: `#4F46E5`
   - Primario Oscuro: `#1E1B4B`
   - Acento IA Turquesa: `#06B6D4`
   - Éxito / Stock Saludable: `#10B981`
   - Advertencia / Stock Bajo: `#F59E0B`
   - Error / Agotado: `#EF4444`
   - Fondo Noche: `#0B1020`

---

## 5. Estado Actual del Proyecto
- **Etapa 0 (Preparación y repositorio):** ✅ Completada (Repositorio inicializado, herramientas .NET/Node verificadas, AGENTS.md creado).
- **Etapa 1 (Sistema de diseño):** ✅ Paleta de colores institucional, temas oscuro/claro y componentes base integrados en Next.js.
- **Etapa 2 (Base de datos en Supabase):** ✅ Migraciones `001_initial_schema.sql` y `002_auth_trigger.sql`, datos seed `001_seed_data.sql` redactados.
- **Etapa 3 (Conexión de APIs y Servicios):** ✅ Completada:
  - Supabase Database & Auth (URL y claves pública/secreta conectadas).
  - Google OAuth 2.0 (Client ID y Client Secret configurados).
  - Gemini API (Google AI Studio API Key configurada para el Asistente de IA).
- **Etapa en curso:** **Validación del Login con Google y sincronización de sesiones**.
- **Próximas etapas:**
  - Configuración de cadena de conexión en Backend .NET y Swagger.
  - Orquestación de Gemini API en Backend con Tool Calling.
