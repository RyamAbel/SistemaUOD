using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class UbicacionesEndpoints
{
    public static IEndpointRouteBuilder MapUbicacionesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/ubicaciones")
            .WithTags("Ubicaciones")
            .RequireAuthorization();

        // 1. Listar ubicaciones paginadas y filtrables
        group.MapGet("/", async (
            [FromQuery] int? pageIndex,
            [FromQuery] int? pageSize,
            [FromQuery] string? search,
            [FromQuery] string? tipo,
            [FromQuery] Guid? ubicacionPadreId,
            [FromQuery] bool? soloActivas,
            [FromQuery] string? sortBy,
            [FromQuery] bool? isDescending,
            IUbicacionService ubicacionService,
            CancellationToken ct) =>
        {
            var filtros = new UbicacionFiltrosDto
            {
                PageIndex = pageIndex ?? 1,
                PageSize = pageSize ?? 50,
                Search = search,
                Tipo = tipo,
                UbicacionPadreId = ubicacionPadreId,
                SoloActivas = soloActivas,
                SortBy = sortBy,
                IsDescending = isDescending ?? false
            };
            var resultado = await ubicacionService.ListarUbicacionesAsync(filtros, ct);
            return Results.Ok(resultado);
        })
        .WithName("ListarUbicaciones")
        .WithSummary("Lista las ubicaciones institucionales con filtros y paginación");

        // 2. Obtener estructura en árbol jerárquico
        group.MapGet("/arbol", async (
            [FromQuery] bool? soloActivas,
            IUbicacionService ubicacionService,
            CancellationToken ct) =>
        {
            var arbol = await ubicacionService.ObtenerArbolJerarquicoAsync(soloActivas, ct);
            return Results.Ok(arbol);
        })
        .WithName("ObtenerArbolUbicaciones")
        .WithSummary("Obtiene la jerarquía completa de sedes, almacenes, clínicas y departamentos en árbol");

        // 3. Obtener ubicación por ID
        group.MapGet("/{id:guid}", async (
            Guid id,
            IUbicacionService ubicacionService,
            CancellationToken ct) =>
        {
            var item = await ubicacionService.ObtenerPorIdAsync(id, ct);
            if (item == null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Ubicación no encontrada",
                    detail: $"No se encontró ninguna ubicación con el identificador '{id}'.");
            }
            return Results.Ok(item);
        })
        .WithName("ObtenerUbicacionPorId")
        .WithSummary("Obtiene los datos detallados de una ubicación por su ID");

        // 4. Crear ubicación (ExigirGestionInventario)
        group.MapPost("/", async (
            [FromBody] CrearUbicacionDto dto,
            IUbicacionService ubicacionService,
            CancellationToken ct) =>
        {
            try
            {
                var nueva = await ubicacionService.CrearUbicacionAsync(dto, ct);
                return Results.Created($"/api/v1/ubicaciones/{nueva.Id}", nueva);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error de validación de ubicación",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("CrearUbicacion")
        .WithSummary("Registra una nueva ubicación institucional");

        // 5. Actualizar ubicación (ExigirGestionInventario)
        group.MapPut("/{id:guid}", async (
            Guid id,
            [FromBody] ActualizarUbicacionDto dto,
            IUbicacionService ubicacionService,
            CancellationToken ct) =>
        {
            try
            {
                var actualizada = await ubicacionService.ActualizarUbicacionAsync(id, dto, ct);
                return Results.Ok(actualizada);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Ubicación no encontrada",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error de validación de ubicación",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("ActualizarUbicacion")
        .WithSummary("Actualiza los datos de una ubicación existente");

        // 6. Cambiar estado activo/inactivo (ExigirGestionInventario)
        group.MapPatch("/{id:guid}/estado", async (
            Guid id,
            [FromBody] CambiarEstadoUbicacionRequest req,
            IUbicacionService ubicacionService,
            CancellationToken ct) =>
        {
            try
            {
                await ubicacionService.CambiarEstadoAsync(id, req.Activa, ct);
                return Results.NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Ubicación no encontrada",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("CambiarEstadoUbicacion")
        .WithSummary("Activa o desactiva una ubicación en el catálogo institucional");

        // 7. Eliminar ubicación (ExigirGestionInventario)
        group.MapDelete("/{id:guid}", async (
            Guid id,
            IUbicacionService ubicacionService,
            CancellationToken ct) =>
        {
            try
            {
                await ubicacionService.EliminarUbicacionAsync(id, ct);
                return Results.Ok(new { mensaje = "Ubicación eliminada correctamente." });
            }
            catch (KeyNotFoundException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Ubicación no encontrada",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Operación de borrado no permitida",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("EliminarUbicacion")
        .WithSummary("Elimina una ubicación si no posee existencias, activos o sububicaciones");

        return app;
    }
}

public record CambiarEstadoUbicacionRequest(bool Activa);
