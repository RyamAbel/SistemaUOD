# ==============================================================================
# SIIA - Sistema Inteligente de Inventario y Activos UOD
# Dockerfile Root (.NET 10 LTS Web API - Clean Architecture)
# ==============================================================================

# 1. Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0-noble AS build
WORKDIR /src

# Copiar archivos de solucion y proyectos para aprovechar la cache de Docker
COPY ["backend/SistemaUOD.slnx", "backend/"]
COPY ["backend/src/SistemaUOD.Domain/SistemaUOD.Domain.csproj", "backend/src/SistemaUOD.Domain/"]
COPY ["backend/src/SistemaUOD.Application/SistemaUOD.Application.csproj", "backend/src/SistemaUOD.Application/"]
COPY ["backend/src/SistemaUOD.Infrastructure/SistemaUOD.Infrastructure.csproj", "backend/src/SistemaUOD.Infrastructure/"]
COPY ["backend/src/SistemaUOD.Api/SistemaUOD.Api.csproj", "backend/src/SistemaUOD.Api/"]

# Restaurar dependencias NuGet
RUN dotnet restore "backend/src/SistemaUOD.Api/SistemaUOD.Api.csproj"

# Copiar el codigo fuente
COPY backend/ backend/

# Compilar y publicar en modo Release
WORKDIR "/src/backend/src/SistemaUOD.Api"
RUN dotnet publish "SistemaUOD.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble AS final
WORKDIR /app

USER root
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_EnableDiagnostics=0

EXPOSE 8080
USER app

ENTRYPOINT ["dotnet", "SistemaUOD.Api.dll"]
