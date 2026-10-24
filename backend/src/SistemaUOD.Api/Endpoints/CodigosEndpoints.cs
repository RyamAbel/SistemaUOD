using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class CodigosEndpoints
{
    public static IEndpointRouteBuilder MapCodigosEndpoints(this IEndpointRouteBuilder app)
    {
        // 1. Grupo de resolución universal de escaneo (QR, Barras, SKU, Serial, Placa)
        var resolutorGroup = app.MapGroup("/api/v1/codigos")
            .WithTags("Resolutor Universal de Códigos y QR")
            .RequireAuthorization();

        resolutorGroup.MapGet("/resolver", async (
            [FromQuery] string codigo,
            HttpContext httpContext,
            IConfiguration configuration,
            ICodigoService codigoService,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(codigo))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Código requerido",
                    detail: "Debe proveer un valor en el parámetro 'codigo' para resolver.");
            }

            var baseUrl = configuration["Qr:BaseUrl"]
                ?? configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()?.FirstOrDefault()
                ?? $"{httpContext.Request.Scheme}://{httpContext.Request.Host}";
            var resolucion = await codigoService.ResolverCodigoAsync(codigo, baseUrl, ct);

            if (!resolucion.Encontrado)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Código no identificado",
                    detail: resolucion.Mensaje);
            }

            return Results.Ok(resolucion);
        })
        .WithName("ResolverCodigoUniversal")
        .WithSummary("Resuelve cualquier código escaneado (QR propio, código de barras, número de serie o placa institucional) y devuelve la ficha correspondiente");

        // 2. Grupo de gestión de códigos por recurso
        var recursosCodigosGroup = app.MapGroup("/api/v1/recursos/{recursoId:guid}")
            .WithTags("Códigos y QR de Recursos")
            .RequireAuthorization();

        recursosCodigosGroup.MapGet("/codigos", async (
            Guid recursoId,
            ICodigoService codigoService,
            CancellationToken ct) =>
        {
            var codigos = await codigoService.ObtenerCodigosAsync(recursoId, ct);
            return Results.Ok(codigos);
        })
        .WithName("ListarCodigosRecurso")
        .WithSummary("Lista todos los códigos asociados a un recurso (QR propio, códigos de barra y códigos de fabricante)");

        recursosCodigosGroup.MapPost("/codigos", async (
            Guid recursoId,
            [FromBody] AgregarCodigoRecursoDto dto,
            ICodigoService codigoService,
            CancellationToken ct) =>
        {
            try
            {
                var nuevo = await codigoService.AgregarCodigoAsync(recursoId, dto, ct);
                return Results.Created($"/api/v1/recursos/{recursoId}/codigos/{nuevo.Id}", nuevo);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error al registrar código",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("AgregarCodigoRecurso")
        .WithSummary("Asocia un nuevo código externo (barras o fabricante) validando que no esté repetido en ningún otro recurso");

        recursosCodigosGroup.MapDelete("/codigos/{codigoId:guid}", async (
            Guid recursoId,
            Guid codigoId,
            ICodigoService codigoService,
            CancellationToken ct) =>
        {
            var ok = await codigoService.EliminarCodigoAsync(recursoId, codigoId, ct);
            if (!ok)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Código no encontrado",
                    detail: "El código especificado no existe en este recurso.");
            }
            return Results.NoContent();
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("EliminarCodigoRecurso")
        .WithSummary("Desvincula un código externo del recurso");

        recursosCodigosGroup.MapGet("/qr/enlace", async (
            Guid recursoId,
            HttpContext httpContext,
            IConfiguration configuration,
            ICodigoService codigoService,
            CancellationToken ct) =>
        {
            try
            {
                var baseUrl = configuration["Qr:BaseUrl"]
                    ?? configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()?.FirstOrDefault()
                    ?? $"{httpContext.Request.Scheme}://{httpContext.Request.Host}";
                var enlace = await codigoService.ObtenerOAsignarQrPropioAsync(recursoId, baseUrl, ct);
                return Results.Ok(enlace);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Recurso no encontrado",
                    detail: ex.Message);
            }
        })
        .WithName("ObtenerEnlaceQrSeguro")
        .WithSummary("Obtiene o asigna el código QR seguro con enlace canónico al recurso");

        recursosCodigosGroup.MapGet("/qr/imagen", async (
            Guid recursoId,
            HttpContext httpContext,
            IConfiguration configuration,
            ICodigoService codigoService,
            CancellationToken ct) =>
        {
            try
            {
                var baseUrl = configuration["Qr:BaseUrl"]
                    ?? configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()?.FirstOrDefault()
                    ?? $"{httpContext.Request.Scheme}://{httpContext.Request.Host}";
                var enlace = await codigoService.ObtenerOAsignarQrPropioAsync(recursoId, baseUrl, ct);
                var pngBytes = await codigoService.GenerarQrPngAsync(enlace.EnlaceSeguro, 10, ct);

                return Results.File(pngBytes, "image/png", $"qr-{enlace.Sku}.png");
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Recurso no encontrado",
                    detail: ex.Message);
            }
        })
        .AllowAnonymous()
        .WithName("DescargarImagenQr")
        .WithSummary("Genera y descarga la imagen PNG del código QR institucional para impresión de etiquetas");

        return app;
    }
}
