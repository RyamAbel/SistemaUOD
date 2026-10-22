using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Infrastructure.Services;

namespace SistemaUOD.Api.Endpoints;

public static class CorreosEndpoints
{
    public static void MapCorreosEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/correos")
            .WithTags("Cola de Correos y Notificaciones")
            .RequireAuthorization(Policies.ExigirGestionInventario);

        // 1. Listar correos en cola
        group.MapGet("/cola", async (
            [FromQuery] string? estado,
            [FromQuery] int? pagina,
            [FromQuery] int? tamanoPagina,
            IApplicationDbContext context,
            CancellationToken ct) =>
        {
            var query = context.ColaCorreos.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(estado))
            {
                var estNorm = estado.Trim().ToLower();
                query = query.Where(c => c.Estado.ToLower() == estNorm);
            }

            var total = await query.CountAsync(ct);
            var page = pagina.HasValue && pagina.Value > 0 ? pagina.Value : 1;
            var size = tamanoPagina.HasValue && tamanoPagina.Value > 0 ? tamanoPagina.Value : 20;

            var items = await query
                .OrderByDescending(c => c.CreadoEn)
                .Skip((page - 1) * size)
                .Take(size)
                .Select(c => new ColaCorreoDto
                {
                    Id = c.Id,
                    Destinatario = c.Destinatario,
                    Asunto = c.Asunto,
                    Estado = c.Estado,
                    Intentos = c.Intentos,
                    UltimoError = c.UltimoError,
                    CreadoEn = c.CreadoEn,
                    ProcesadoEn = c.ProcesadoEn
                })
                .ToListAsync(ct);

            return Results.Ok(PagedResult<ColaCorreoDto>.Create(items, total, page, size));
        })
        .WithName("ListarColaCorreos")
        .WithSummary("Consulta los correos de la cola transaccional con filtros y paginación");

        // 2. Estadísticas de la cola de correos
        group.MapGet("/cola/estadisticas", async (
            IApplicationDbContext context,
            CancellationToken ct) =>
        {
            var pendientes = await context.ColaCorreos.CountAsync(c => c.Estado == "pendiente", ct);
            var enviados = await context.ColaCorreos.CountAsync(c => c.Estado == "enviado", ct);
            var fallidos = await context.ColaCorreos.CountAsync(c => c.Estado == "fallido", ct);

            return Results.Ok(new
            {
                pendientes,
                enviados,
                fallidos,
                total = pendientes + enviados + fallidos
            });
        })
        .WithName("ObtenerEstadisticasColaCorreos")
        .WithSummary("Obtiene el balance estadístico de correos pendientes, enviados y fallidos");

        // 3. Reintentar envío de correo fallido
        group.MapPost("/cola/{id:guid}/reintentar", async (
            Guid id,
            IApplicationDbContext context,
            CancellationToken ct) =>
        {
            var correo = await context.ColaCorreos.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (correo == null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Correo no encontrado",
                    detail: $"No se encontró el registro con ID {id} en la cola de correos."
                );
            }

            correo.Estado = "pendiente";
            correo.Intentos = 0;
            correo.UltimoError = null;
            correo.ProcesadoEn = null;

            await context.SaveChangesAsync(ct);

            return Results.Ok(new
            {
                mensaje = "Correo restablecido a estado pendiente para reintento.",
                id = correo.Id
            });
        })
        .WithName("ReintentarCorreoCola")
        .WithSummary("Restablece un correo fallido a estado pendiente para reintento por el worker");

        // 4. Procesar lote de la cola bajo demanda
        group.MapPost("/cola/procesar", async (
            EmailQueueBackgroundService worker,
            CancellationToken ct) =>
        {
            var procesados = await worker.ProcesarLotePendientesAsync(ct);
            return Results.Ok(new
            {
                mensaje = $"Lote procesado: {procesados} correos enviados.",
                procesados
            });
        })
        .WithName("ProcesarLoteCorreosManual")
        .WithSummary("Fuerza la ejecución inmediata de un lote de correos de la cola transaccional");
    }
}
