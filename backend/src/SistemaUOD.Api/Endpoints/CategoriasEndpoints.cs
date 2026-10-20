using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class CategoriasEndpoints
{
    public static IEndpointRouteBuilder MapCategoriasEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/categorias")
            .WithTags("Categorías")
            .RequireAuthorization();

        // 1. Listar categorías
        group.MapGet("/", async (
            [FromQuery] bool? soloActivas,
            ICategoriaService categoriaService,
            CancellationToken ct) =>
        {
            var items = await categoriaService.ObtenerTodasAsync(soloActivas, ct);
            return Results.Ok(items);
        })
        .WithName("ListarCategorias")
        .WithSummary("Lista todas las categorías y subcategorías del inventario institucional");

        // 2. Obtener categoría por ID
        group.MapGet("/{id:guid}", async (
            Guid id,
            ICategoriaService categoriaService,
            CancellationToken ct) =>
        {
            var item = await categoriaService.ObtenerPorIdAsync(id, ct);
            if (item == null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Categoría no encontrada",
                    detail: $"No se encontró ninguna categoría con el identificador '{id}'.");
            }
            return Results.Ok(item);
        })
        .WithName("ObtenerCategoriaPorId")
        .WithSummary("Obtiene los datos detallados de una categoría por su ID");

        // 3. Crear categoría (ExigirGestionInventario)
        group.MapPost("/", async (
            [FromBody] CrearCategoriaDto dto,
            ICategoriaService categoriaService,
            CancellationToken ct) =>
        {
            try
            {
                var nueva = await categoriaService.CrearAsync(dto, ct);
                return Results.Created($"/api/v1/categorias/{nueva.Id}", nueva);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error de validación de negocio",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("CrearCategoria")
        .WithSummary("Crea una nueva categoría o subcategoría en el catálogo institucional");

        // 4. Actualizar categoría (ExigirGestionInventario)
        group.MapPut("/{id:guid}", async (
            Guid id,
            [FromBody] ActualizarCategoriaDto dto,
            ICategoriaService categoriaService,
            CancellationToken ct) =>
        {
            try
            {
                var actualizada = await categoriaService.ActualizarAsync(id, dto, ct);
                if (actualizada == null)
                {
                    return Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Categoría no encontrada",
                        detail: $"No se encontró ninguna categoría con el identificador '{id}'.");
                }
                return Results.Ok(actualizada);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error al actualizar categoría",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("ActualizarCategoria")
        .WithSummary("Actualiza los datos de una categoría existente");

        // 5. Cambiar estado activo/inactivo (ExigirGestionInventario)
        group.MapPatch("/{id:guid}/estado", async (
            Guid id,
            [FromBody] CambiarEstadoDto dto,
            ICategoriaService categoriaService,
            CancellationToken ct) =>
        {
            var ok = await categoriaService.CambiarEstadoAsync(id, dto.Activo, ct);
            if (!ok)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Categoría no encontrada",
                    detail: $"No se encontró ninguna categoría con el identificador '{id}'.");
            }
            return Results.Ok(new { mensaje = $"Estado de la categoría actualizado a {(dto.Activo ? "activo" : "inactivo")}." });
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("CambiarEstadoCategoria")
        .WithSummary("Activa o desactiva una categoría del inventario");

        // 6. Eliminar categoría (ExigirSuperAdmin)
        group.MapDelete("/{id:guid}", async (
            Guid id,
            ICategoriaService categoriaService,
            CancellationToken ct) =>
        {
            try
            {
                var ok = await categoriaService.EliminarAsync(id, ct);
                if (!ok)
                {
                    return Results.Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Categoría no encontrada",
                        detail: $"No se encontró ninguna categoría con el identificador '{id}'.");
                }
                return Results.NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "No se puede eliminar la categoría",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirSuperAdmin)
        .WithName("EliminarCategoria")
        .WithSummary("Elimina permanentemente una categoría si no tiene recursos ni subcategorías asociadas");

        return app;
    }
}
