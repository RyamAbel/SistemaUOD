using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class MantenimientosEndpoints
{
    public static void MapMantenimientosEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/mantenimientos")
            .WithTags("Mantenimientos y Servicios Técnicos TI")
            .RequireAuthorization();

        // 1. Listar mantenimientos con filtros paginados
        group.MapGet("/", async (
            [FromQuery] int? pageIndex,
            [FromQuery] int? pageSize,
            [FromQuery] string? search,
            [FromQuery] Guid? activoSerieId,
            [FromQuery] string? placaInstitucional,
            [FromQuery] string? tipo,
            [FromQuery] string? estado,
            [FromQuery] Guid? proveedorId,
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta,
            IMantenimientoService service,
            CancellationToken ct) =>
        {
            var filtros = new MantenimientoFiltrosDto
            {
                PageIndex = pageIndex ?? 1,
                PageSize = pageSize ?? 20,
                Search = search,
                ActivoSerieId = activoSerieId,
                PlacaInstitucional = placaInstitucional,
                Tipo = tipo,
                Estado = estado,
                ProveedorId = proveedorId,
                FechaDesde = fechaDesde,
                FechaHasta = fechaHasta
            };
            var resultado = await service.ListarAsync(filtros, ct);
            return Results.Ok(resultado);
        })
        .WithName("ListarMantenimientos")
        .WithSummary("Lista el historial u órdenes de mantenimiento técnico con filtros combinables y paginación")
        .Produces<Application.Common.Models.PagedResult<MantenimientoDto>>(StatusCodes.Status200OK);

        // 2. Obtener mantenimiento por ID
        group.MapGet("/{id:guid}", async (
            Guid id,
            IMantenimientoService service,
            CancellationToken ct) =>
        {
            var mantenimiento = await service.ObtenerPorIdAsync(id, ct);
            return mantenimiento is not null ? Results.Ok(mantenimiento) : Results.NotFound();
        })
        .WithName("ObtenerMantenimientoPorId")
        .WithSummary("Obtiene el detalle de una orden o servicio de mantenimiento por su ID")
        .Produces<MantenimientoDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        // 3. Listar historial técnico completo de un activo
        group.MapGet("/activo/{activoId:guid}", async (
            Guid activoId,
            IMantenimientoService service,
            CancellationToken ct) =>
        {
            var mantenimientos = await service.ListarPorActivoAsync(activoId, ct);
            return Results.Ok(mantenimientos);
        })
        .WithName("ListarMantenimientosPorActivo")
        .WithSummary("Obtiene todo el historial de intervenciones y servicios técnicos realizados a un equipo específico")
        .Produces<List<MantenimientoDto>>(StatusCodes.Status200OK);

        // 4. Resumen de mantenimientos y costos invertidos en un equipo
        group.MapGet("/activo/{activoId:guid}/resumen", async (
            Guid activoId,
            IMantenimientoService service,
            CancellationToken ct) =>
        {
            var resumen = await service.ObtenerResumenPorActivoAsync(activoId, ct);
            return Results.Ok(resumen);
        })
        .WithName("ObtenerResumenMantenimientosActivo")
        .WithSummary("Obtiene el resumen de intervenciones (preventivas, correctivas), costos totales y fechas de un equipo")
        .Produces<ResumenMantenimientosActivoDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        // 5. Registrar nueva intervención o servicio técnico
        group.MapPost("/", async (
            [FromBody] CrearMantenimientoDto dto,
            IMantenimientoService service,
            ICurrentUserService currentUser,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var usuarioId = currentUser.UserId ?? Guid.Empty;
            var ip = httpContext.Connection.RemoteIpAddress?.ToString();

            var resultado = await service.RegistrarAsync(dto, usuarioId, ip, ct);
            return Results.Created($"/api/v1/mantenimientos/{resultado.Id}", resultado);
        })
        .WithName("RegistrarMantenimiento")
        .WithSummary("Programa o registra una intervención de mantenimiento técnico para un equipo físico")
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .Produces<MantenimientoDto>(StatusCodes.Status201Created)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        // 6. Actualizar orden de mantenimiento
        group.MapPut("/{id:guid}", async (
            Guid id,
            [FromBody] ActualizarMantenimientoDto dto,
            IMantenimientoService service,
            ICurrentUserService currentUser,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var usuarioId = currentUser.UserId ?? Guid.Empty;
            var ip = httpContext.Connection.RemoteIpAddress?.ToString();

            var resultado = await service.ActualizarAsync(id, dto, usuarioId, ip, ct);
            return Results.Ok(resultado);
        })
        .WithName("ActualizarMantenimiento")
        .WithSummary("Actualiza los datos de un servicio técnico programado")
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .Produces<MantenimientoDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        // 7. Completar y cerrar intervención técnica
        group.MapPost("/{id:guid}/completar", async (
            Guid id,
            [FromBody] CompletarMantenimientoDto dto,
            IMantenimientoService service,
            ICurrentUserService currentUser,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var usuarioId = currentUser.UserId ?? Guid.Empty;
            var ip = httpContext.Connection.RemoteIpAddress?.ToString();

            var resultado = await service.CompletarAsync(id, dto, usuarioId, ip, ct);
            return Results.Ok(resultado);
        })
        .WithName("CompletarMantenimiento")
        .WithSummary("Registra el cierre satisfactorio de una intervención técnica con su costo real y restablece el activo")
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .Produces<MantenimientoDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        // 8. Cancelar servicio técnico
        group.MapPost("/{id:guid}/cancelar", async (
            Guid id,
            [FromBody] CancelarMantenimientoDto dto,
            IMantenimientoService service,
            ICurrentUserService currentUser,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var usuarioId = currentUser.UserId ?? Guid.Empty;
            var ip = httpContext.Connection.RemoteIpAddress?.ToString();

            var resultado = await service.CancelarAsync(id, dto, usuarioId, ip, ct);
            return Results.Ok(resultado);
        })
        .WithName("CancelarMantenimiento")
        .WithSummary("Cancela un servicio técnico programado registrando el motivo en bitácora")
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .Produces<MantenimientoDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status404NotFound);
    }
}
