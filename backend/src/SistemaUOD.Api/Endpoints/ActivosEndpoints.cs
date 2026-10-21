using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class ActivosEndpoints
{
    public static IEndpointRouteBuilder MapActivosEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/activos")
            .WithTags("Activos Fijos")
            .RequireAuthorization();

        // 1. Listar activos físicos paginados y filtrables
        group.MapGet("/", async (
            [FromQuery] int? pageIndex,
            [FromQuery] int? pageSize,
            [FromQuery] string? search,
            [FromQuery] Guid? recursoId,
            [FromQuery] Guid? ubicacionId,
            [FromQuery] string? estado,
            [FromQuery] string? custodio,
            [FromQuery] string? sortBy,
            [FromQuery] bool? isDescending,
            IActivoService activoService,
            CancellationToken ct) =>
        {
            var filtros = new ActivoFiltrosDto
            {
                PageIndex = pageIndex ?? 1,
                PageSize = pageSize ?? 50,
                Search = search,
                RecursoId = recursoId,
                UbicacionId = ubicacionId,
                Estado = estado,
                Custodio = custodio,
                SortBy = sortBy,
                IsDescending = isDescending ?? false
            };

            var resultado = await activoService.ListarActivosAsync(filtros, ct);
            return Results.Ok(resultado);
        })
        .WithName("ListarActivos")
        .WithSummary("Lista los activos físicos y equipos con filtros avanzados y paginación");

        // 2. Obtener activo por ID
        group.MapGet("/{id:guid}", async (
            Guid id,
            IActivoService activoService,
            CancellationToken ct) =>
        {
            var activo = await activoService.ObtenerPorIdAsync(id, ct);
            return activo is null ? Results.NotFound() : Results.Ok(activo);
        })
        .WithName("ObtenerActivoPorId")
        .WithSummary("Obtiene el detalle completo de un activo físico por su ID");

        // 3. Obtener activo por placa institucional (EQ-XX)
        group.MapGet("/placa/{placa}", async (
            string placa,
            IActivoService activoService,
            CancellationToken ct) =>
        {
            var activo = await activoService.ObtenerPorPlacaAsync(placa, ct);
            return activo is null ? Results.NotFound() : Results.Ok(activo);
        })
        .WithName("ObtenerActivoPorPlaca")
        .WithSummary("Busca y obtiene el activo por su número de placa institucional (ej. EQ-01)");

        // 4. Crear nuevo activo físico (ExigirGestionInventario)
        group.MapPost("/", async (
            [FromBody] CrearActivoSerieDto dto,
            IActivoService activoService,
            CancellationToken ct) =>
        {
            try
            {
                var resultado = await activoService.CrearActivoAsync(dto, ct);
                return Results.Created($"/api/v1/activos/{resultado.Id}", resultado);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error de validación del activo",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("CrearActivo")
        .WithSummary("Registra un nuevo activo físico o serie institucional");

        // 5. Actualizar activo físico (ExigirGestionInventario)
        group.MapPut("/{id:guid}", async (
            Guid id,
            [FromBody] ActualizarActivoSerieDto dto,
            IActivoService activoService,
            CancellationToken ct) =>
        {
            try
            {
                var resultado = await activoService.ActualizarActivoAsync(id, dto, ct);
                return Results.Ok(resultado);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Activo no encontrado",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error de validación del activo",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("ActualizarActivo")
        .WithSummary("Actualiza los datos de un activo físico institucional");

        // 6. Cambiar estado operativo del activo (ExigirGestionInventario)
        group.MapPatch("/{id:guid}/estado", async (
            Guid id,
            [FromBody] CambiarEstadoActivoDto dto,
            IActivoService activoService,
            CancellationToken ct) =>
        {
            try
            {
                var resultado = await activoService.CambiarEstadoAsync(id, dto, ct);
                return Results.Ok(resultado);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Activo no encontrado",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Estado de activo inválido",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("CambiarEstadoActivo")
        .WithSummary("Modifica el estado operativo de un activo físico (operativo, mantenimiento, etc.)");

        // 7. Dar de baja un activo físico (ExigirGestionInventario)
        group.MapDelete("/{id:guid}", async (
            Guid id,
            [FromQuery] string? motivo,
            IActivoService activoService,
            CancellationToken ct) =>
        {
            try
            {
                var resultado = await activoService.DarDeBajaAsync(id, motivo ?? "Baja administrativa", ct);
                return Results.Ok(resultado);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Activo no encontrado",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("DarDeBajaActivo")
        .WithSummary("Da de baja definitiva o temporal a un activo físico");

        return app;
    }
}
