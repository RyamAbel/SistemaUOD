using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class DepreciacionEndpoints
{
    public static IEndpointRouteBuilder MapDepreciacionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/depreciacion")
            .WithTags("Depreciación y Contabilidad")
            .RequireAuthorization();

        // 1. Resumen global contable y amortización patrimonial
        group.MapGet("/resumen", async (
            [FromQuery] DateOnly? fechaCorte,
            IDepreciacionService depreciacionService,
            CancellationToken ct) =>
        {
            var resumen = await depreciacionService.ObtenerResumenContableAsync(fechaCorte, ct);
            return Results.Ok(resumen);
        })
        .WithName("ObtenerResumenDepreciacion")
        .WithSummary("Obtiene el resumen financiero consolidado de depreciación y valor en libros (RF-19)");

        // 2. Reporte detallado paginado con filtros
        group.MapGet("/reporte", async (
            [FromQuery] int? pageIndex,
            [FromQuery] int? pageSize,
            [FromQuery] string? search,
            [FromQuery] DateOnly? fechaCorte,
            [FromQuery] Guid? categoriaId,
            [FromQuery] Guid? ubicacionId,
            [FromQuery] bool? soloConValorEnLibros,
            [FromQuery] bool? soloTotalmenteDepreciados,
            IDepreciacionService depreciacionService,
            CancellationToken ct) =>
        {
            var filtros = new FiltroDepreciacionDto
            {
                PageIndex = pageIndex ?? 1,
                PageSize = pageSize ?? 50,
                Search = search,
                FechaCorte = fechaCorte,
                CategoriaId = categoriaId,
                UbicacionId = ubicacionId,
                SoloConValorEnLibros = soloConValorEnLibros,
                SoloTotalmenteDepreciados = soloTotalmenteDepreciados
            };

            var reporte = await depreciacionService.ListarDepreciacionesAsync(filtros, ct);
            return Results.Ok(reporte);
        })
        .WithName("ListarReporteDepreciacion")
        .WithSummary("Lista el cálculo de depreciación por equipo con filtros y paginación");

        // 3. Ficha de depreciación de un activo individual
        group.MapGet("/activo/{activoId:guid}", async (
            Guid activoId,
            [FromQuery] DateOnly? fechaCorte,
            IDepreciacionService depreciacionService,
            CancellationToken ct) =>
        {
            var calculo = await depreciacionService.CalcularDepreciacionActivoAsync(activoId, fechaCorte, ct);
            return calculo is null ? Results.NotFound() : Results.Ok(calculo);
        })
        .WithName("ObtenerDepreciacionActivo")
        .WithSummary("Calcula la depreciación acumulada y valor en libros de un activo específico");

        // 4. Tabla de amortización proyectada (48 periodos DGII)
        group.MapGet("/activo/{activoId:guid}/tabla", async (
            Guid activoId,
            IDepreciacionService depreciacionService,
            CancellationToken ct) =>
        {
            var tabla = await depreciacionService.GenerarTablaAmortizacionAsync(activoId, ct);
            return tabla is null ? Results.NotFound() : Results.Ok(tabla);
        })
        .WithName("ObtenerTablaAmortizacionActivo")
        .WithSummary("Genera la tabla de amortización mes a mes hasta agotar vida útil");

        // 5. Exportación a archivo CSV compatible con Excel
        group.MapGet("/exportar", async (
            [FromQuery] string? search,
            [FromQuery] DateOnly? fechaCorte,
            [FromQuery] Guid? categoriaId,
            [FromQuery] Guid? ubicacionId,
            [FromQuery] bool? soloConValorEnLibros,
            [FromQuery] bool? soloTotalmenteDepreciados,
            IDepreciacionService depreciacionService,
            CancellationToken ct) =>
        {
            var filtros = new FiltroDepreciacionDto
            {
                Search = search,
                FechaCorte = fechaCorte,
                CategoriaId = categoriaId,
                UbicacionId = ubicacionId,
                SoloConValorEnLibros = soloConValorEnLibros,
                SoloTotalmenteDepreciados = soloTotalmenteDepreciados
            };

            var bytes = await depreciacionService.ExportarDepreciacionCsvAsync(filtros, ct);
            var fecha = (fechaCorte ?? DateOnly.FromDateTime(DateTime.UtcNow)).ToString("yyyyMMdd");
            return Results.File(bytes, "text/csv; charset=utf-8", $"depreciacion_activos_uod_{fecha}.csv");
        })
        .WithName("ExportarDepreciacionCsv")
        .WithSummary("Exporta el informe contable de depreciación en formato CSV para Microsoft Excel");

        return app;
    }
}
