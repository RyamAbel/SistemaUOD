using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;

namespace SistemaUOD.Api.Endpoints;

public static class ReportesEndpoints
{
    public static IEndpointRouteBuilder MapReportesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/reportes")
            .WithTags("Reportes y Analítica Ejecutiva")
            .RequireAuthorization();

        // 1. Resumen ejecutivo global
        group.MapGet("/resumen-ejecutivo", async (
            IReporteService reporteService,
            CancellationToken ct) =>
        {
            var resumen = await reporteService.ObtenerResumenEjecutivoAsync(ct);
            return Results.Ok(resumen);
        })
        .WithName("ObtenerResumenEjecutivo")
        .WithSummary("Obtiene los indicadores clave de desempeño (KPIs), valor patrimonial y métricas consolidadas de inventario");

        // 2. Rotación de inventario y consumibles
        group.MapGet("/rotacion-consumibles", async (
            IReporteService reporteService,
            CancellationToken ct) =>
        {
            var rotacion = await reporteService.ObtenerRotacionConsumiblesAsync(ct);
            return Results.Ok(rotacion);
        })
        .WithName("ObtenerRotacionConsumibles")
        .WithSummary("Obtiene el análisis de tasa de rotación y costos consumidos por insumo odontológico y consumible");

        // 3. Distribución del parque tecnológico TI
        group.MapGet("/distribucion-parque-ti", async (
            IReporteService reporteService,
            CancellationToken ct) =>
        {
            var distribucion = await reporteService.ObtenerDistribucionParqueTiAsync(ct);
            return Results.Ok(distribucion);
        })
        .WithName("ObtenerDistribucionParqueTi")
        .WithSummary("Obtiene el desglose de los 341 equipos TI por categoría tecnológica y estado operativo");

        // 4. Exportar reporte patrimonial en CSV compatible con Excel
        group.MapGet("/exportar-patrimonial-csv", async (
            IReporteService reporteService,
            CancellationToken ct) =>
        {
            var bytes = await reporteService.GenerarReportePatrimonialCsvAsync(ct);
            var fecha = DateTime.UtcNow.ToString("yyyyMMdd");
            return Results.File(bytes, "text/csv; charset=utf-8", $"reporte_patrimonial_uod_{fecha}.csv");
        })
        .WithName("ExportarReportePatrimonialCsv")
        .WithSummary("Genera y descarga el reporte patrimonial completo de activos físicos con depreciación DGII en CSV con UTF-8 BOM");

        return app;
    }
}
