using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class ImportacionEndpoints
{
    public static IEndpointRouteBuilder MapImportacionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/importacion")
            .WithTags("Importación Masiva de Recursos")
            .RequireAuthorization();

        // 1. Descargar plantilla CSV institucional
        group.MapGet("/plantilla-csv", (IImportacionService importacionService) =>
        {
            var bytes = importacionService.GenerarPlantillaCsv();
            return Results.File(bytes, "text/csv; charset=utf-8", "plantilla_recursos_siia.csv");
        })
        .WithName("DescargarPlantillaCsvRecursos")
        .WithSummary("Descarga la plantilla CSV oficial con codificación UTF-8 para importación masiva de recursos");

        // 2. Pre-validar lote de filas CSV/Excel antes de importar
        group.MapPost("/validar", async (
            [FromBody] List<ImportarRecursoFilaDto> filas,
            IImportacionService importacionService,
            CancellationToken ct) =>
        {
            var resultado = await importacionService.ValidarFilasAsync(filas, ct);
            return Results.Ok(resultado);
        })
        .WithName("ValidarFilasImportacionRecursos")
        .WithSummary("Valida un lote de filas de recursos para detectar errores de formato, campos obligatorios y posibles duplicados");

        // 3. Ejecutar importación masiva de recursos aprobados
        group.MapPost("/ejecutar", async (
            [FromBody] EjecutarImportacionSolicitudDto dto,
            IImportacionService importacionService,
            ICurrentUserService currentUserService,
            CancellationToken ct) =>
        {
            var usuarioId = currentUserService.UserId;
            if (!usuarioId.HasValue)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuario no autenticado",
                    detail: "No se pudo identificar al usuario que realiza la importación.");
            }

            if (dto.Filas == null || dto.Filas.Count == 0)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Datos vacíos",
                    detail: "Debe suministrar al menos una fila válida para importar.");
            }

            var resultado = await importacionService.ImportarRecursosAsync(dto.Filas, usuarioId.Value, ct);
            return Results.Ok(resultado);
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("EjecutarImportacionRecursos")
        .WithSummary("Da de alta en lote los recursos validados en el catálogo institucional");

        return app;
    }
}
