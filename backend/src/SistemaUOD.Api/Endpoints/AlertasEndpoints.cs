using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Application.Common.Security;

namespace SistemaUOD.Api.Endpoints;

public static class AlertasEndpoints
{
    public static void MapAlertasEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/alertas")
            .WithTags("Alertas")
            .RequireAuthorization();

        // 1. Listar alertas con filtros y paginación
        group.MapGet("/", async (
            [FromQuery] string? tipo,
            [FromQuery] string? severidad,
            [FromQuery] bool? leida,
            [FromQuery] Guid? recursoId,
            [FromQuery] Guid? ubicacionId,
            [FromQuery] int? pagina,
            [FromQuery] int? tamanoPagina,
            IAlertaService alertaService,
            CancellationToken ct) =>
        {
            var filtros = new AlertaFiltrosDto
            {
                Tipo = tipo,
                Severidad = severidad,
                Leida = leida,
                RecursoId = recursoId,
                UbicacionId = ubicacionId,
                Pagina = pagina ?? 1,
                TamanoPagina = tamanoPagina ?? 20
            };

            var resultado = await alertaService.ListarAsync(filtros, ct);
            return Results.Ok(resultado);
        })
        .WithName("ListarAlertas")
        .WithSummary("Lista las alertas del sistema con filtros combinados y paginación");

        // 2. Resumen consolidado de alertas
        group.MapGet("/resumen", async (
            IAlertaService alertaService,
            CancellationToken ct) =>
        {
            var resumen = await alertaService.ObtenerResumenAsync(ct);
            return Results.Ok(resumen);
        })
        .WithName("ObtenerResumenAlertas")
        .WithSummary("Obtiene el resumen cuantitativo de alertas no leídas por severidad y tipo");

        // 3. Conteo rápido de alertas no leídas (para campana de navegación)
        group.MapGet("/conteo-no-leidas", async (
            IAlertaService alertaService,
            CancellationToken ct) =>
        {
            var conteo = await alertaService.ObtenerConteoNoLeidasAsync(ct);
            return Results.Ok(new { noLeidas = conteo });
        })
        .WithName("ObtenerConteoNoLeidas")
        .WithSummary("Retorna el número de alertas no leídas para la campana de notificaciones");

        // 4. Detalle de una alerta específica
        group.MapGet("/{id:guid}", async (
            Guid id,
            IAlertaService alertaService,
            CancellationToken ct) =>
        {
            var alerta = await alertaService.ObtenerPorIdAsync(id, ct);
            if (alerta == null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Alerta no encontrada",
                    detail: $"No se encontró la alerta con identificador {id}."
                );
            }

            return Results.Ok(alerta);
        })
        .WithName("ObtenerAlertaPorId")
        .WithSummary("Obtiene el detalle completo de una alerta por su ID");

        // 5. Evaluar reglas del motor de alertas bajo demanda
        group.MapPost("/evaluar", async (
            IAlertaService alertaService,
            CancellationToken ct) =>
        {
            var resultado = await alertaService.EvaluarReglasAsync(ct);
            return Results.Ok(resultado);
        })
        .RequireAuthorization(Policies.ExigirOperacionAlmacen)
        .WithName("EvaluarReglasAlertas")
        .WithSummary("Ejecuta el motor de reglas de alertas (stock bajo, lotes por vencer, mantenimientos)");

        // 6. Marcar alerta individual como leída
        group.MapPatch("/{id:guid}/leida", async (
            Guid id,
            IAlertaService alertaService,
            CancellationToken ct) =>
        {
            var exito = await alertaService.MarcarComoLeidaAsync(id, ct);
            if (!exito)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Alerta no encontrada",
                    detail: $"No se pudo marcar como leída la alerta con identificador {id}."
                );
            }

            return Results.Ok(new { mensaje = "Alerta marcada como leída.", id });
        })
        .WithName("MarcarAlertaLeida")
        .WithSummary("Marca una alerta específica como leída");

        // 7. Marcar todas las alertas como leídas
        group.MapPost("/marcar-todas-leidas", async (
            IAlertaService alertaService,
            CancellationToken ct) =>
        {
            var afectadas = await alertaService.MarcarTodasComoLeidasAsync(ct);
            return Results.Ok(new { mensaje = $"{afectadas} alertas marcadas como leídas.", total = afectadas });
        })
        .WithName("MarcarTodasAlertasLeidas")
        .WithSummary("Marca todas las alertas no leídas existentes como leídas");

        // 8. Crear alerta manual (administradores y almacén)
        group.MapPost("/", async (
            [FromBody] CrearAlertaDto dto,
            IAlertaService alertaService,
            CancellationToken ct) =>
        {
            var nuevaAlerta = await alertaService.CrearAsync(dto, ct);
            return Results.Created($"/api/v1/alertas/{nuevaAlerta.Id}", nuevaAlerta);
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("CrearAlertaManual")
        .WithSummary("Registra manualmente una alerta institucional");

        // 9. Eliminar alerta
        group.MapDelete("/{id:guid}", async (
            Guid id,
            IAlertaService alertaService,
            CancellationToken ct) =>
        {
            var exito = await alertaService.EliminarAsync(id, ct);
            if (!exito)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Alerta no encontrada",
                    detail: $"No se encontró la alerta con ID {id} para eliminar."
                );
            }

            return Results.Ok(new { mensaje = "Alerta eliminada correctamente.", id });
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("EliminarAlerta")
        .WithSummary("Elimina permanentemente una alerta del sistema");

        // -------------------------------------------------------------
        // Endpoints de Preferencias de Notificación
        // -------------------------------------------------------------
        var prefGroup = app.MapGroup("/api/v1/notificaciones/preferencias")
            .WithTags("Notificaciones")
            .RequireAuthorization();

        prefGroup.MapGet("/", async (
            ClaimsPrincipal user,
            ICurrentUserService currentUserService,
            IAlertaService alertaService,
            CancellationToken ct) =>
        {
            var usuarioId = currentUserService.UserId;
            if (!usuarioId.HasValue)
            {
                var subClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;
                if (Guid.TryParse(subClaim, out var parsedId))
                {
                    usuarioId = parsedId;
                }
            }

            if (!usuarioId.HasValue)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuario no autenticado",
                    detail: "No se pudo determinar la identidad del usuario actual."
                );
            }

            var pref = await alertaService.ObtenerPreferenciasUsuarioAsync(usuarioId.Value, ct);
            return Results.Ok(pref);
        })
        .WithName("ObtenerPreferenciasNotificacion")
        .WithSummary("Obtiene las preferencias de notificación del usuario actual");

        prefGroup.MapPut("/", async (
            [FromBody] ActualizarPreferenciaDto dto,
            ClaimsPrincipal user,
            ICurrentUserService currentUserService,
            IAlertaService alertaService,
            CancellationToken ct) =>
        {
            var usuarioId = currentUserService.UserId;
            if (!usuarioId.HasValue)
            {
                var subClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;
                if (Guid.TryParse(subClaim, out var parsedId))
                {
                    usuarioId = parsedId;
                }
            }

            if (!usuarioId.HasValue)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuario no autenticado",
                    detail: "No se pudo determinar la identidad del usuario actual."
                );
            }

            var pref = await alertaService.ActualizarPreferenciasUsuarioAsync(usuarioId.Value, dto, ct);
            return Results.Ok(pref);
        })
        .WithName("ActualizarPreferenciasNotificacion")
        .WithSummary("Actualiza las preferencias de notificación del usuario actual");
    }
}
