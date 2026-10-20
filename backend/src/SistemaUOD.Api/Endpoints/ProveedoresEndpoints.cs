using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class ProveedoresEndpoints
{
    public static IEndpointRouteBuilder MapProveedoresEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/proveedores")
            .WithTags("Proveedores")
            .RequireAuthorization();

        // 1. Listar proveedores con paginación y búsqueda
        group.MapGet("/", async (
            [FromQuery] int? pageIndex,
            [FromQuery] int? pageSize,
            [FromQuery] string? search,
            [FromQuery] string? sortBy,
            [FromQuery] bool? isDescending,
            [FromQuery] bool? soloActivos,
            IProveedorService proveedorService,
            CancellationToken ct) =>
        {
            var request = new PagedRequest
            {
                PageIndex = pageIndex ?? 1,
                PageSize = pageSize ?? 20,
                Search = search,
                SortBy = sortBy,
                IsDescending = isDescending ?? false
            };
            var pagedResult = await proveedorService.ObtenerPaginadoAsync(request, soloActivos, ct);
            return Results.Ok(pagedResult);
        })
        .WithName("ListarProveedores")
        .WithSummary("Lista proveedores institucionales con paginación, filtros y búsqueda por RNC o nombre");

        // 2. Obtener proveedor por ID
        group.MapGet("/{id:guid}", async (
            Guid id,
            IProveedorService proveedorService,
            CancellationToken ct) =>
        {
            var item = await proveedorService.ObtenerPorIdAsync(id, ct);
            if (item == null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Proveedor no encontrado",
                    detail: $"No se encontró ningún proveedor con el identificador '{id}'.");
            }
            return Results.Ok(item);
        })
        .WithName("ObtenerProveedorPorId")
        .WithSummary("Obtiene el detalle completo de un proveedor institucional por su ID");

        // 3. Crear proveedor (ExigirGestionInventario)
        group.MapPost("/", async (
            [FromBody] CrearProveedorDto dto,
            IProveedorService proveedorService,
            CancellationToken ct) =>
        {
            try
            {
                var nuevo = await proveedorService.CrearAsync(dto, ct);
                return Results.Created($"/api/v1/proveedores/{nuevo.Id}", nuevo);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error de validación del proveedor",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("CrearProveedor")
        .WithSummary("Registra un nuevo proveedor institucional con validación de RNC dominicano");

        // 4. Actualizar proveedor (ExigirGestionInventario)
        group.MapPut("/{id:guid}", async (
            Guid id,
            [FromBody] ActualizarProveedorDto dto,
            IProveedorService proveedorService,
            CancellationToken ct) =>
        {
            try
            {
                var actualizado = await proveedorService.ActualizarAsync(id, dto, ct);
                if (actualizado == null)
                {
                    return Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Proveedor no encontrado",
                        detail: $"No se encontró ningún proveedor con el identificador '{id}'.");
                }
                return Results.Ok(actualizado);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error al actualizar proveedor",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("ActualizarProveedor")
        .WithSummary("Actualiza la información comercial y de contacto de un proveedor");

        // 5. Cambiar estado activo/inactivo (ExigirGestionInventario)
        group.MapPatch("/{id:guid}/estado", async (
            Guid id,
            [FromBody] CambiarEstadoDto dto,
            IProveedorService proveedorService,
            CancellationToken ct) =>
        {
            var ok = await proveedorService.CambiarEstadoAsync(id, dto.Activo, ct);
            if (!ok)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Proveedor no encontrado",
                    detail: $"No se encontró ningún proveedor con el identificador '{id}'.");
            }
            return Results.Ok(new { mensaje = $"Estado del proveedor actualizado a {(dto.Activo ? "activo" : "inactivo")}." });
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("CambiarEstadoProveedor")
        .WithSummary("Activa o desactiva un proveedor institucional");

        return app;
    }
}
