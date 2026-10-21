using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class RecursosEndpoints
{
    public static IEndpointRouteBuilder MapRecursosEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/recursos")
            .WithTags("Catálogo de Recursos")
            .RequireAuthorization();

        // 1. Listar recursos con filtros combinables y paginación
        group.MapGet("/", async (
            [FromQuery] int? pageIndex,
            [FromQuery] int? pageSize,
            [FromQuery] string? search,
            [FromQuery] Guid? categoriaId,
            [FromQuery] string? tipo,
            [FromQuery] Guid? ubicacionId,
            [FromQuery] Guid? responsableId,
            [FromQuery] Guid? proveedorId,
            [FromQuery] bool? stockBajo,
            [FromQuery] bool? stockAgotado,
            [FromQuery] decimal? costoMin,
            [FromQuery] decimal? costoMax,
            [FromQuery] DateOnly? fechaAdquisicionDesde,
            [FromQuery] DateOnly? fechaAdquisicionHasta,
            [FromQuery] bool? conFoto,
            [FromQuery] bool? conQr,
            [FromQuery] bool? activo,
            [FromQuery] string? sortBy,
            [FromQuery] bool? isDescending,
            IRecursoService recursoService,
            CancellationToken ct) =>
        {
            var filtros = new RecursoFiltrosDto
            {
                PageIndex = pageIndex ?? 1,
                PageSize = pageSize ?? 20,
                Search = search,
                CategoriaId = categoriaId,
                Tipo = tipo,
                UbicacionId = ubicacionId,
                ResponsableId = responsableId,
                ProveedorId = proveedorId,
                StockBajo = stockBajo,
                StockAgotado = stockAgotado,
                CostoMin = costoMin,
                CostoMax = costoMax,
                FechaAdquisicionDesde = fechaAdquisicionDesde,
                FechaAdquisicionHasta = fechaAdquisicionHasta,
                ConFoto = conFoto,
                ConQr = conQr,
                Activo = activo ?? true,
                SortBy = sortBy,
                IsDescending = isDescending ?? false
            };

            var paged = await recursoService.ListarAsync(filtros, ct);
            return Results.Ok(paged);
        })
        .WithName("ListarRecursos")
        .WithSummary("Lista el catálogo de recursos con filtros combinables (categoría, ubicación, responsable, stock, costo, fotos, QR)");

        // 2. Obtener detalle de recurso por ID
        group.MapGet("/{id:guid}", async (
            Guid id,
            IRecursoService recursoService,
            CancellationToken ct) =>
        {
            var detalle = await recursoService.ObtenerPorIdAsync(id, ct);
            if (detalle == null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Recurso no encontrado",
                    detail: $"No se encontró ningún recurso registrado con el ID '{id}'.");
            }
            return Results.Ok(detalle);
        })
        .WithName("ObtenerRecursoPorId")
        .WithSummary("Obtiene la ficha técnica detallada del recurso, fotos, códigos QR y existencias por sede");

        // 3. Crear recurso
        group.MapPost("/", async (
            [FromBody] CrearRecursoDto dto,
            IRecursoService recursoService,
            CancellationToken ct) =>
        {
            try
            {
                var nuevo = await recursoService.CrearAsync(dto, ct);
                return Results.Created($"/api/v1/recursos/{nuevo.Id}", nuevo);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error de validación del recurso",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("CrearRecurso")
        .WithSummary("Crea un nuevo artículo consumible o activo institucional en el catálogo");

        // 4. Actualizar recurso
        group.MapPut("/{id:guid}", async (
            Guid id,
            [FromBody] ActualizarRecursoDto dto,
            IRecursoService recursoService,
            CancellationToken ct) =>
        {
            try
            {
                var actualizado = await recursoService.ActualizarAsync(id, dto, ct);
                if (actualizado == null)
                {
                    return Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Recurso no encontrado",
                        detail: $"No se encontró ningún recurso registrado con el ID '{id}'.");
                }
                return Results.Ok(actualizado);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error al actualizar recurso",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("ActualizarRecurso")
        .WithSummary("Actualiza los datos técnicos, stock mínimo y costo de un recurso existente");

        // 4b. Actualizar únicamente umbrales de stock mínimo y reorden (RF-12)
        group.MapPatch("/{id:guid}/stock-minimo", async (
            Guid id,
            [FromBody] ActualizarStockMinimoDto dto,
            IRecursoService recursoService,
            CancellationToken ct) =>
        {
            var actualizado = await recursoService.ActualizarUmbralesStockAsync(id, dto, ct);
            if (actualizado == null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Recurso no encontrado",
                    detail: $"No se encontró ningún recurso registrado con el ID '{id}'.");
            }
            return Results.Ok(actualizado);
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("ActualizarStockMinimo")
        .WithSummary("Actualiza los umbrales de stock mínimo, stock máximo y punto de reorden RF-12");

        // 5. Duplicar recurso existente
        group.MapPost("/{id:guid}/duplicar", async (
            Guid id,
            [FromBody] DuplicarRecursoDto dto,
            IRecursoService recursoService,
            CancellationToken ct) =>
        {
            try
            {
                var clon = await recursoService.DuplicarAsync(id, dto, ct);
                return Results.Created($"/api/v1/recursos/{clon.Id}", clon);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error al duplicar recurso",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("DuplicarRecurso")
        .WithSummary("Crea un duplicado del recurso conservando especificaciones y fotos con un nuevo SKU");

        // 6. Cambiar estado activo/inactivo
        group.MapPatch("/{id:guid}/estado", async (
            Guid id,
            [FromBody] CambiarEstadoDto dto,
            IRecursoService recursoService,
            CancellationToken ct) =>
        {
            var ok = await recursoService.CambiarEstadoAsync(id, dto.Activo, ct);
            if (!ok)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Recurso no encontrado",
                    detail: $"No se encontró ningún recurso registrado con el ID '{id}'.");
            }
            return Results.Ok(new { mensaje = $"Estado del recurso actualizado a {(dto.Activo ? "activo" : "inactivo")}." });
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("CambiarEstadoRecurso")
        .WithSummary("Activa o desactiva un recurso del inventario");

        // 7. Desactivar en lugar de borrar (borrado lógico por trazabilidad)
        group.MapDelete("/{id:guid}", async (
            Guid id,
            IRecursoService recursoService,
            CancellationToken ct) =>
        {
            var ok = await recursoService.DesactivarAsync(id, ct);
            if (!ok)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Recurso no encontrado",
                    detail: $"No se encontró ningún recurso registrado con el ID '{id}'.");
            }
            return Results.Ok(new
            {
                mensaje = "El recurso ha sido desactivado exitosamente (borrado lógico) preservando su historial de movimientos y auditoría."
            });
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("DesactivarRecurso")
        .WithSummary("Desactiva lógicamente un recurso para preservar la integridad del historial y bitácora");

        return app;
    }
}
