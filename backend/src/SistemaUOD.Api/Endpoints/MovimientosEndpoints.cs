using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class MovimientosEndpoints
{
    public static IEndpointRouteBuilder MapMovimientosEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/movimientos")
            .WithTags("Movimientos")
            .RequireAuthorization();

        // 1. Registrar movimiento con transacción atómica (todo o nada, sin stock negativo, idempotencia)
        group.MapPost("/", async (
            [FromBody] CrearMovimientoDto dto,
            [FromHeader(Name = "X-Idempotency-Key")] string? idempotencyHeader,
            IMovimientoService movimientoService,
            ICurrentUserService currentUserService,
            CancellationToken ct) =>
        {
            var usuarioId = currentUserService.UserId;
            if (!usuarioId.HasValue)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuario no autenticado",
                    detail: "No se pudo identificar al usuario que realiza el movimiento.");
            }

            try
            {
                var idempotencyKey = idempotencyHeader ?? dto.IdempotenciaKey;
                var resultado = await movimientoService.RegistrarMovimientoAsync(
                    dto,
                    usuarioId.Value,
                    idempotencyKey,
                    ct);

                return Results.Created($"/api/v1/movimientos/{resultado.Id}", resultado);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Operación de inventario inválida",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirOperacionAlmacen)
        .WithName("RegistrarMovimiento")
        .WithSummary("Registra un movimiento atómico de inventario (entrada, salida, traslado, ajuste, devolucion, baja)");

        // 2. Previsualizar impacto de movimiento antes de confirmación (Paso 3 del wizard)
        group.MapPost("/previsualizar", async (
            [FromBody] CrearMovimientoDto dto,
            IMovimientoService movimientoService,
            CancellationToken ct) =>
        {
            var previsualizacion = await movimientoService.PrevisualizarMovimientoAsync(dto, ct);
            return Results.Ok(previsualizacion);
        })
        .WithName("PrevisualizarMovimiento")
        .WithSummary("Simula el impacto en existencias antes de confirmar la transacción de inventario");

        // 3. Consultar historial de movimientos con filtros y paginación
        group.MapGet("/", async (
            [FromQuery] string? tipo,
            [FromQuery] Guid? ubicacionId,
            [FromQuery] Guid? recursoId,
            [FromQuery] Guid? usuarioId,
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta,
            [FromQuery] string? search,
            [FromQuery] int? pageIndex,
            [FromQuery] int? pageSize,
            [FromQuery] string? sortBy,
            [FromQuery] bool? isDescending,
            IMovimientoService movimientoService,
            CancellationToken ct) =>
        {
            var filtros = new MovimientoFiltrosDto
            {
                Tipo = tipo,
                UbicacionId = ubicacionId,
                RecursoId = recursoId,
                UsuarioId = usuarioId,
                FechaDesde = fechaDesde,
                FechaHasta = fechaHasta,
                Search = search,
                PageIndex = pageIndex ?? 1,
                PageSize = pageSize ?? 25,
                SortBy = sortBy ?? "creadoEn",
                IsDescending = isDescending ?? true
            };

            var resultado = await movimientoService.ListarMovimientosAsync(filtros, ct);
            return Results.Ok(resultado);
        })
        .WithName("ListarMovimientos")
        .WithSummary("Consulta el historial de movimientos de inventario con filtros por fecha, tipo y ubicación");

        // 4. Obtener detalle de movimiento por ID
        group.MapGet("/{id:guid}", async (
            Guid id,
            IMovimientoService movimientoService,
            CancellationToken ct) =>
        {
            var movimiento = await movimientoService.ObtenerMovimientoPorIdAsync(id, ct);
            if (movimiento == null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Movimiento no encontrado",
                    detail: $"No se encontró ningún movimiento con el identificador '{id}'.");
            }
            return Results.Ok(movimiento);
        })
        .WithName("ObtenerMovimientoPorId")
        .WithSummary("Obtiene el detalle completo de un movimiento institucional con todas sus líneas");

        // 5. Exportar movimientos filtrados a formato CSV (BOM UTF-8 institucional)
        group.MapGet("/exportar", async (
            [FromQuery] string? tipo,
            [FromQuery] Guid? ubicacionId,
            [FromQuery] Guid? recursoId,
            [FromQuery] Guid? usuarioId,
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta,
            [FromQuery] string? search,
            IMovimientoService movimientoService,
            CancellationToken ct) =>
        {
            var filtros = new MovimientoFiltrosDto
            {
                Tipo = tipo,
                UbicacionId = ubicacionId,
                RecursoId = recursoId,
                UsuarioId = usuarioId,
                FechaDesde = fechaDesde,
                FechaHasta = fechaHasta,
                Search = search,
                PageIndex = 1,
                PageSize = 5000
            };

            var resultado = await movimientoService.ListarMovimientosAsync(filtros, ct);
            var sb = new System.Text.StringBuilder();
            sb.AppendLine("Correlativo,Tipo,Ubicacion Origen,Ubicacion Destino,Responsable,Total Lineas,Total Unidades,Costo Total DOP,Fecha UTC,Motivo,Comprobante");

            foreach (var m in resultado.Items)
            {
                sb.AppendLine($"\"{m.NumeroMovimiento}\",\"{m.Tipo}\",\"{m.OrigenUbicacionNombre ?? "Externo"}\",\"{m.DestinoUbicacionNombre ?? "Externo"}\",\"{m.UsuarioNombre}\",{m.TotalLineas},{m.TotalUnidades},{m.CostoTotal:F2},\"{m.CreadoEn:yyyy-MM-dd HH:mm:ss}\",\"{m.Motivo.Replace("\"", "\"\"")}\",\"{m.ComprobanteUrl ?? ""}\"");
            }

            var bytes = System.Text.Encoding.UTF8.GetPreamble().Concat(System.Text.Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
            return Results.File(bytes, "text/csv; charset=utf-8", $"movimientos_siia_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv");
        })
        .WithName("ExportarMovimientosCsv")
        .WithSummary("Exporta los movimientos filtrados a un archivo CSV compatible con Excel");

        return app;
    }
}
