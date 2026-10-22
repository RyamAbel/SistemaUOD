# Sistema Inteligente de Inventario con IA Integrada (SIIA / SistemaUOD)

Plataforma institucional de gestión de inventario, suministros y activos fijos con asistente de Inteligencia Artificial integrado, respaldado por Supabase (PostgreSQL), API REST en ASP.NET Core y frontend en Next.js.

---

## 🏛 Estructura del Monorepo

```
SistemaUOD/
├── database/                   # Base de datos Supabase / PostgreSQL
│   ├── migrations/             # Esquemas DDL, RLS, triggers y funciones
│   │   └── 001_initial_schema.sql
│   ├── seed/                   # Datos de prueba iniciales
│   │   └── 001_seed_data.sql
│   └── README.md               # Guía paso a paso para Supabase
│
├── backend/                    # Solución .NET (ASP.NET Core Web API)
│   ├── SistemaUOD.slnx         # Solución moderna de C#
│   └── src/
│       ├── SistemaUOD.Domain/         # Entidades, enums y reglas de dominio
│       ├── SistemaUOD.Application/    # Casos de uso, interfaces, DTOs y lógica
│       ├── SistemaUOD.Infrastructure/ # EF Core, PostgreSQL/Npgsql, servicios Supabase
│       └── SistemaUOD.Api/            # Endpoints REST (/api/v1), Swagger y Middleware
│
├── frontend/                   # Aplicación Web Moderna (Next.js + TypeScript)
│   ├── src/
│   │   ├── app/                # App Router (Páginas, layouts y rutas)
│   │   ├── components/         # Componentes UI (Dashboard, Catálogo, IA Drawer, etc.)
│   │   ├── lib/                # Clientes Supabase y utilidades
│   │   └── hooks/              # Custom hooks para datos y autenticación
│   ├── tailwind.config.ts      # Tokens de color institucionales y modo oscuro
│   └── package.json
│
└── .gitignore                  # Exclusiones de Git
```

---

## 🚀 Puesta en Marcha Rápida

### 1. Base de Datos (Supabase)
1. En tu proyecto de Supabase, entra al **SQL Editor**.
2. Ejecuta en orden:
   - `database/migrations/001_initial_schema.sql`
   - `database/seed/001_seed_data.sql`
3. Consulta `database/README.md` para configurar Google OAuth.

### 2. Backend (.NET)
```bash
cd backend
dotnet build SistemaUOD.slnx
dotnet run --project src/SistemaUOD.Api
```
- Swagger disponible en: `https://localhost:5001/swagger` (o puerto configurado).

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
- Aplicación web disponible en: `http://localhost:3000`.

### 4. Despliegue con Docker & Nginx (Producción)
Consulta [DEPLOYMENT.md](file:///c:/Users/ryam2/Documents/SistemaUOD/SistemaUOD/DEPLOYMENT.md) para la guía completa paso a paso:
```bash
# 1. Configurar variables de entorno
cp .env.docker.example .env

# 2. Desplegar backend, frontend y gateway Nginx
docker compose -f docker-compose.prod.yml up -d --build
```
- Gateway Nginx disponible en: `http://localhost` (puerto 80/443).

---

## 🛡️ Principios de Seguridad e IA
- **Autenticación sin contraseñas locales:** Exclusivamente Google OAuth 2.0 (con lista blanca institucional).
- **Acciones de IA bajo confirmación explícita:** Toda modificación que proponga la IA requiere validación del usuario mediante tarjeta interactiva previa a la transacción.
- **Auditoría inmutable:** Cada movimiento registra responsable, origen (`humano` vs `ia`), fecha, detalle y hash de idempotencia.
