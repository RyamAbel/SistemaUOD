# ==============================================================================
# SIIA - Sistema Inteligente de Inventario y Activos UOD
# Dockerfile Frontend (Next.js 16 + React 19 + Turbopack Standalone)
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Base Node Image
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ------------------------------------------------------------------------------
# 2. Etapa de Dependencias (Dependencies Stage)
# ------------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

# Copiar manifiestos de paquetes
COPY package.json package-lock.json ./
# Instalar dependencias limpias de producción y desarrollo necesarias para el build
RUN npm ci

# ------------------------------------------------------------------------------
# 3. Etapa de Construcción (Builder Stage)
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Deshabilitar telemetría de Next.js durante la construcción
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Argumentos de construcción para inyectar variables públicas del cliente
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Compilar la aplicación Next.js con modo standalone activado
RUN npm run build

# ------------------------------------------------------------------------------
# 4. Etapa de Ejecución (Runner Stage)
# ------------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Crear usuario y grupo no privilegiado
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar la carpeta pública de assets institucionales (logos, íconos PWA, manifest)
COPY --from=builder /app/public ./public

# Configurar permisos para la caché de Next.js
RUN mkdir .next && chown nextjs:nodejs .next

# Copiar artefactos standalone y estáticos generados por Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar al usuario no privilegiado
USER nextjs

EXPOSE 3000

# Healthcheck interno para verificar que el servidor Node responde
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
