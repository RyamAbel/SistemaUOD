using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class ExistenciasEndpoints
{
    public static IEndpointRouteBuilder MapExistenciasEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/existencias")
            .WithTags("Existencias")
            .RequireAuthorization();

        // 1. Resumen de stock por recurso con reglas de reorden RF-12
        group.MapGet("/", async (
            [FromQuery] int? pageIndex,
            [FromQuery] int? pageSize,
            [FromQuery] Guid? recursoId,
            [FromQuery] Guid? ubicacionId,
            [FromQuery] bool? soloStockBajo,
            [FromQuery] bool? soloAgotados,
            [FromQuery] bool? proximosAVencer,
            [FromQuery] string? search,
            [FromQuery] string? sortBy,
            [FromQuery] bool? isDescending,
            IExistenciaService existenciaService,
            CancellationToken ct) =>
        {
            var filtros = new ExistenciaFiltrosDto
            {
                PageIndex = pageIndex ?? 1,
                PageSize = pageSize ?? 25,
                RecursoId = recursoId,
                UbicacionId = ubicacionId,
                SoloStockBajo = soloStockBajo,
                SoloAgotados = soloAgotados,
                ProximosAVencer = proximosAVencer,
                Search = search,
                SortBy = sortBy,
                IsDescending = isDescending ?? false
            };
            var res = await existenciaService.ObtenerResumenStockAsync(filtros, ct);
            return Results.Ok(res);
        })
        .WithName("ObtenerResumenExistencias")
        .WithSummary("Consulta el estado consolidado de stock de recursos con reglas de reorden RF-12");

        // 2. Ficha de existencias de un recurso específico
        group.MapGet("/recurso/{recursoId:guid}", async (
            Guid recursoId,
            IExistenciaService existenciaService,
            CancellationToken ct) =>
        {
            var item = await existenciaService.ObtenerStockPorRecursoAsync(recursoId, ct);
            if (item == null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Recurso no encontrado",
                    detail: $"No se encontró ningún recurso con el identificador '{recursoId}'.");
            }
            return Results.Ok(item);
        })
        .WithName("ObtenerStockPorRecurso")
        .WithSummary("Obtiene el desglose de existencias por ubicación y lotes de un recurso específico");

        // 3. Existencias detalladas por ubicación y lote
        group.MapGet("/detalladas", async (
            [FromQuery] Guid? recursoId,
            [FromQuery] Guid? ubicacionId,
            IExistenciaService existenciaService,
            CancellationToken ct) =>
        {
            var items = await existenciaService.ObtenerExistenciasDetalladasAsync(recursoId, ubicacionId, ct);
            return Results.Ok(items);
        })
        .WithName("ObtenerExistenciasDetalladas")
        .WithSummary("Lista detallada de existencias físicas cruzando recurso, ubicación y lote clínico");

        // 4. Alertas de stock bajo el mínimo o en reorden (RF-12)
        group.MapGet("/alertas/stock-bajo", async (
            IExistenciaService existenciaService,
            CancellationToken ct) =>
        {
            var alertas = await existenciaService.ObtenerAlertasStockBajoAsync(ct);
            return Results.Ok(alertas);
        })
        .WithName("ObtenerAlertasStockBajo")
        .WithSummary("Lista de insumos y recursos en quiebre de stock o por debajo del mínimo institucional");

        // 5. Alertas de vencimiento de lotes clínicos y biomateriales
        group.MapGet("/alertas/vencimientos", async (
            [FromQuery] int? diasAnticipacion,
            IExistenciaService existenciaService,
            CancellationToken ct) =>
        {
            var vencimientos = await existenciaService.ObtenerAlertasVencimientoAsync(diasAnticipacion ?? 30, ct);
            return Results.Ok(vencimientos);
        })
        .WithName("ObtenerAlertasVencimientos")
        .WithSummary("Lista de lotes clínicos con fecha de vencimiento próxima o caducada");

        return app;
    }
}
