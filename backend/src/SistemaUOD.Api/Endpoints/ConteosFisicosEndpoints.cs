using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class ConteosFisicosEndpoints
{
    public static IEndpointRouteBuilder MapConteosFisicosEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/conteos-fisicos")
            .WithTags("Inventario Físico y Auditoría")
            .RequireAuthorization();

        // 1. Listar conteos físicos con filtros y paginación
        group.MapGet("/", async (
            [FromQuery] Guid? ubicacionId,
            [FromQuery] string? estado,
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta,
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            IConteoFisicoService conteoService,
            CancellationToken ct) =>
        {
            var filtros = new ConteoFisicoFiltrosDto
            {
                UbicacionId = ubicacionId,
                Estado = estado,
                FechaDesde = fechaDesde,
                FechaHasta = fechaHasta,
                Page = (page == null || page <= 0) ? 1 : page.Value,
                PageSize = (pageSize == null || pageSize <= 0) ? 20 : pageSize.Value
            };

            var resultado = await conteoService.ListarConteosAsync(filtros, ct);
            return Results.Ok(resultado);
        })
        .WithName("ListarConteosFisicos")
        .WithSummary("Lista las sesiones de conteo e inventario físico de auditoría");

        // 2. Obtener conteo físico detallado por ID
        group.MapGet("/{id:guid}", async (
            Guid id,
            IConteoFisicoService conteoService,
            CancellationToken ct) =>
        {
            var conteo = await conteoService.ObtenerPorIdAsync(id, ct);
            if (conteo == null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Conteo físico no encontrado",
                    detail: $"No se encontró la auditoría de conteo con identificador '{id}'.");
            }

            return Results.Ok(conteo);
        })
        .WithName("ObtenerConteoFisicoPorId")
        .WithSummary("Obtiene el detalle y las líneas de auditoría física de un conteo");

        // 3. Iniciar nuevo conteo físico por ubicación
        group.MapPost("/", async (
            [FromBody] IniciarConteoFisicoDto dto,
            IConteoFisicoService conteoService,
            ICurrentUserService currentUserService,
            CancellationToken ct) =>
        {
            var usuarioId = currentUserService.UserId;
            if (!usuarioId.HasValue)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuario no autenticado",
                    detail: "No se pudo identificar al usuario responsable del conteo.");
            }

            try
            {
                var resultado = await conteoService.IniciarConteoAsync(dto, usuarioId.Value, ct);
                return Results.Created($"/api/v1/conteos-fisicos/{resultado.Id}", resultado);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "No se pudo iniciar el conteo físico",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirOperacionAlmacen)
        .WithName("IniciarConteoFisico")
        .WithSummary("Abre una nueva sesión de inventario físico para una ubicación institucional");

        // 4. Sincronizar líneas contadas (soporte offline)
        group.MapPut("/{id:guid}/lineas", async (
            Guid id,
            [FromBody] SincronizarConteosDto dto,
            IConteoFisicoService conteoService,
            ICurrentUserService currentUserService,
            CancellationToken ct) =>
        {
            var usuarioId = currentUserService.UserId;
            if (!usuarioId.HasValue)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuario no autenticado",
                    detail: "No se pudo identificar al usuario.");
            }

            try
            {
                var resultado = await conteoService.SincronizarLineasAsync(id, dto, usuarioId.Value, ct);
                return Results.Ok(resultado);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Conteo no encontrado",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Sincronización no permitida",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirOperacionAlmacen)
        .WithName("SincronizarLineasConteo")
        .WithSummary("Sincroniza en lote las cantidades físicas registradas en el dispositivo móvil");

        // 5. Escanear ítem individual en vivo
        group.MapPost("/{id:guid}/escanear", async (
            Guid id,
            [FromBody] EscanearItemConteoDto dto,
            IConteoFisicoService conteoService,
            ICurrentUserService currentUserService,
            CancellationToken ct) =>
        {
            var usuarioId = currentUserService.UserId;
            if (!usuarioId.HasValue)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuario no autenticado",
                    detail: "No se pudo identificar al usuario.");
            }

            try
            {
                var resultado = await conteoService.EscanearItemAsync(id, dto, usuarioId.Value, ct);
                return Results.Ok(resultado);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Conteo no encontrado",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error al escanear ítem",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirOperacionAlmacen)
        .WithName("EscanearItemConteo")
        .WithSummary("Registra o incrementa el conteo de un recurso mediante lectura de código QR / barras");

        // 6. Conciliar conteo y ajustar existencias automáticamente
        group.MapPost("/{id:guid}/conciliar", async (
            Guid id,
            [FromBody] ConciliarConteoDto dto,
            IConteoFisicoService conteoService,
            ICurrentUserService currentUserService,
            CancellationToken ct) =>
        {
            var usuarioId = currentUserService.UserId;
            if (!usuarioId.HasValue)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuario no autenticado",
                    detail: "No se pudo identificar al usuario.");
            }

            try
            {
                var resultado = await conteoService.ConciliarConteoAsync(id, dto, usuarioId.Value, ct);
                return Results.Ok(resultado);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Conteo no encontrado",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "No se pudo conciliar el conteo",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("ConciliarConteoFisico")
        .WithSummary("Concilia el conteo físico generando movimientos auditados de ajuste para sobrantes y faltantes");

        // 7. Cancelar conteo sin aplicar ajustes
        group.MapPost("/{id:guid}/cancelar", async (
            Guid id,
            [FromQuery] string? motivo,
            IConteoFisicoService conteoService,
            ICurrentUserService currentUserService,
            CancellationToken ct) =>
        {
            var usuarioId = currentUserService.UserId;
            if (!usuarioId.HasValue)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuario no autenticado",
                    detail: "No se pudo identificar al usuario.");
            }

            try
            {
                var resultado = await conteoService.CancelarConteoAsync(id, motivo, usuarioId.Value, ct);
                return Results.Ok(resultado);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Conteo no encontrado",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "No se pudo cancelar el conteo",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("CancelarConteoFisico")
        .WithSummary("Cancela una sesión de inventario físico sin alterar las existencias");

        return app;
    }
}
