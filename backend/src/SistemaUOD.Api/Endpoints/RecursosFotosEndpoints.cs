using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class RecursosFotosEndpoints
{
    public static IEndpointRouteBuilder MapRecursosFotosEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/recursos/{recursoId:guid}/fotos")
            .WithTags("Fotos de Recursos")
            .RequireAuthorization();

        // 1. Obtener todas las fotos del recurso
        group.MapGet("/", async (
            Guid recursoId,
            IRecursoFotoService fotoService,
            CancellationToken ct) =>
        {
            var fotos = await fotoService.ObtenerFotosAsync(recursoId, ct);
            return Results.Ok(fotos);
        })
        .WithName("ObtenerFotosRecurso")
        .WithSummary("Lista todas las fotos asociadas a un recurso institucional ordenadas por prioridad");

        // 2. Subir una nueva foto (Multipart form-data)
        group.MapPost("/", async (
            Guid recursoId,
            IFormFile file,
            [FromForm] bool? esPrincipal,
            IRecursoFotoService fotoService,
            CancellationToken ct) =>
        {
            if (file == null || file.Length == 0)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Archivo no provisto",
                    detail: "Debe adjuntar un archivo de imagen válido (JPG, PNG o WebP de hasta 5 MB).");
            }

            try
            {
                using var stream = file.OpenReadStream();
                var respuesta = await fotoService.SubirFotoAsync(
                    recursoId,
                    stream,
                    file.FileName,
                    file.ContentType,
                    file.Length,
                    esPrincipal ?? false,
                    ct);

                return Results.Created($"/api/v1/recursos/{recursoId}/fotos/{respuesta.Id}", respuesta);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error al procesar fotografía",
                    detail: ex.Message);
            }
        })
        .DisableAntiforgery()
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("SubirFotoRecurso")
        .WithSummary("Sube una foto al recurso con validación binaria de formato (JPG, PNG, WebP) y almacenamiento privado en Supabase");

        // 3. Establecer foto como principal
        group.MapPut("/{fotoId:guid}/principal", async (
            Guid recursoId,
            Guid fotoId,
            IRecursoFotoService fotoService,
            CancellationToken ct) =>
        {
            var ok = await fotoService.EstablecerFotoPrincipalAsync(recursoId, fotoId, ct);
            if (!ok)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Foto no encontrada",
                    detail: $"No se encontró la foto especificada vinculada al recurso '{recursoId}'.");
            }
            return Results.Ok(new { mensaje = "La fotografía ha sido establecida como principal del recurso." });
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("EstablecerFotoPrincipal")
        .WithSummary("Establece una foto como principal y desmarca la anterior automáticamente");

        // 4. Reordenar fotos
        group.MapPut("/reordenar", async (
            Guid recursoId,
            [FromBody] ReordenarFotosDto dto,
            IRecursoFotoService fotoService,
            CancellationToken ct) =>
        {
            var ok = await fotoService.ReordenarFotosAsync(recursoId, dto.FotosOrdenadasIds, ct);
            if (!ok)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Fotos no encontradas",
                    detail: "No se encontraron fotos para reordenar en este recurso.");
            }
            return Results.Ok(new { mensaje = "El orden de las fotografías ha sido actualizado correctamente." });
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("ReordenarFotosRecurso")
        .WithSummary("Actualiza el orden secuencial de la galería de fotos del recurso");

        // 5. Eliminar foto
        group.MapDelete("/{fotoId:guid}", async (
            Guid recursoId,
            Guid fotoId,
            IRecursoFotoService fotoService,
            CancellationToken ct) =>
        {
            var ok = await fotoService.EliminarFotoAsync(recursoId, fotoId, ct);
            if (!ok)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Foto no encontrada",
                    detail: $"No se encontró la foto especificada vinculada al recurso '{recursoId}'.");
            }
            return Results.NoContent();
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("EliminarFotoRecurso")
        .WithSummary("Elimina permanentemente una foto del recurso y del almacenamiento privado");

        return app;
    }
}
