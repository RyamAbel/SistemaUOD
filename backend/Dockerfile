# ==============================================================================
# SIIA - Sistema Inteligente de Inventario y Activos UOD
# Dockerfile Backend (.NET 10 LTS Web API - Clean Architecture)
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Etapa de Compilación (Build Stage)
# ------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:10.0-noble AS build
WORKDIR /src

# Copiar archivos de proyectos para aprovechar la caché de capas de Docker en el restore
COPY ["SistemaUOD.slnx", "./"]
COPY ["src/SistemaUOD.Domain/SistemaUOD.Domain.csproj", "src/SistemaUOD.Domain/"]
COPY ["src/SistemaUOD.Application/SistemaUOD.Application.csproj", "src/SistemaUOD.Application/"]
COPY ["src/SistemaUOD.Infrastructure/SistemaUOD.Infrastructure.csproj", "src/SistemaUOD.Infrastructure/"]
COPY ["src/SistemaUOD.Api/SistemaUOD.Api.csproj", "src/SistemaUOD.Api/"]

# Restaurar dependencias NuGet de la API y sus referencias
RUN dotnet restore "src/SistemaUOD.Api/SistemaUOD.Api.csproj"

# Copiar el código fuente completo
COPY . .

# Compilar y publicar en modo Release sin el ejecutable de host local (más liviano y portable)
WORKDIR "/src/src/SistemaUOD.Api"
RUN dotnet publish "SistemaUOD.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ------------------------------------------------------------------------------
# 2. Etapa de Ejecución (Runtime Stage)
# ------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble AS final
WORKDIR /app

# Instalar wget o curl para healthchecks del contenedor
USER root
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copiar artefactos compilados desde la etapa de build
COPY --from=build /app/publish .

# Variables de entorno por defecto para producción
ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_EnableDiagnostics=0

# Puerto expuesto en el contenedor
EXPOSE 8080

# Usuario no privilegiado para cumplimiento de seguridad
USER app

# Comprobación de salud nativa en el contenedor
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "SistemaUOD.Api.dll"]
