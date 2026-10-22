using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class AssistantEndpoints
{
    public static IEndpointRouteBuilder MapAssistantEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/assistant")
            .WithTags("Asistente IA")
            .RequireAuthorization();

        group.MapPost("/chat", async (
            [FromBody] ChatRequestDto request,
            IAssistantService assistantService,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request?.Message))
            {
                return Results.BadRequest(new ProblemDetails
                {
                    Title = "Mensaje inválido",
                    Detail = "El mensaje del usuario no puede estar vacío.",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            try
            {
                var respuesta = await assistantService.ProcesarMensajeAsync(request, ct);
                return Results.Ok(respuesta);
            }
            catch (Exception)
            {
                return Results.Ok(new ChatResponseDto
                {
                    Text = "¡Hola! He recibido tu consulta; sin embargo, ocurrió una incidencia temporal al procesarla. Por favor intenta de nuevo en unos momentos o prueba con otra pregunta de inventario.",
                    Mode = request.Mode,
                    IsLiveGemini = false,
                    CostoEstimadoDop = 0.00m
                });
            }
        })
        .WithName("EnviarMensajeAsistente")
        .WithSummary("Procesa un mensaje conversacional en modo operativo o tutor con herramientas de inventario")
        .Produces<ChatResponseDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/info", (IConfiguration config) =>
        {
            var model = config["Gemini:FlashModel"] ?? config["Gemini:Model"] ?? "gemini-1.5-flash";
            return Results.Ok(new
            {
                Nombre = "SIIA AI Assistant (Universidad Odontológica Dominicana)",
                Proveedor = "Google Gemini API (Google AI Studio)",
                Modelo = model,
                ModosDisponibles = new[] { "operativo", "tutor" },
                HerramientasHabilitadas = new[]
                {
                    "buscar_recursos",
                    "consultar_existencias",
                    "consultar_activo_fijo",
                    "listar_alertas_inventario",
                    "consultar_depreciacion",
                    "preparar_propuesta_movimiento",
                    "obtener_guia_procedimiento"
                },
                Gobierno = "Lectura automatizada y propuestas de escritura con confirmación obligatoria previa (Etapa 9/10)"
            });
        })
        .WithName("ObtenerInfoAsistente")
        .WithSummary("Obtiene metadatos y capacidades del asistente de IA de SIIA");

        group.MapGet("/consumo", async (
            IAssistantService assistantService,
            CancellationToken ct) =>
        {
            var consumo = await assistantService.ObtenerResumenConsumoAsync(ct);
            return Results.Ok(consumo);
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("ObtenerConsumoAsistente")
        .WithSummary("Obtiene métricas de consumo de IA, costo estimado en DOP y presupuesto de tokens (Prompt 9.7)")
        .Produces<ConsumoAsistenteDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden);

        // --- Etapa 10: Acciones con confirmación, reversión (undo) y visión multimodal ---

        group.MapPost("/propuestas/{id}/confirmar", async (
            string id,
            IAssistantService assistantService,
            CancellationToken ct) =>
        {
            try
            {
                var resultado = await assistantService.ConfirmarPropuestaAsync(id, ct);
                return Results.Ok(resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status403Forbidden,
                    title: "Acceso no autorizado",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error al confirmar propuesta",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirOperacionAlmacen)
        .WithName("ConfirmarPropuestaAsistente")
        .WithSummary("Confirma y ejecuta atómicamente una propuesta de movimiento formulada por la IA (Prompt 10.3)")
        .Produces<ResultadoConfirmacionPropuestaDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status403Forbidden);

        group.MapPost("/propuestas/{id}/cancelar", async (
            string id,
            IAssistantService assistantService,
            CancellationToken ct) =>
        {
            var exitoso = await assistantService.CancelarPropuestaAsync(id, ct);
            return Results.Ok(new { exitoso, mensaje = exitoso ? "Propuesta cancelada y descartada." : "Propuesta no encontrada." });
        })
        .WithName("CancelarPropuestaAsistente")
        .WithSummary("Cancela y descarta una propuesta de movimiento pendiente formulada por la IA")
        .Produces(StatusCodes.Status200OK);

        group.MapPost("/propuestas/{id}/revertir", async (
            string id,
            IAssistantService assistantService,
            CancellationToken ct) =>
        {
            try
            {
                var resultado = await assistantService.RevertirPropuestaAsync(id, ct);
                return Results.Ok(resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status403Forbidden,
                    title: "Acceso no autorizado",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "No se puede revertir la propuesta",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirOperacionAlmacen)
        .WithName("RevertirPropuestaAsistente")
        .WithSummary("Revierte una propuesta ejecutada dentro de la ventana de 5 minutos mediante contra-movimiento inverso (Prompt 10.4)")
        .Produces<ResultadoConfirmacionPropuestaDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
        .Produces<ProblemDetails>(StatusCodes.Status403Forbidden);

        group.MapPost("/analizar-foto", async (
            [FromBody] AnalisisFotoRecursoDto request,
            IAssistantService assistantService,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.FotoBase64))
            {
                return Results.BadRequest(new ProblemDetails
                {
                    Title = "Imagen requerida",
                    Detail = "Debe proporcionar una imagen o fotografía codificada en Base64.",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            var propuesta = await assistantService.AnalizarFotoRecursoAsync(request, ct);
            return Results.Ok(propuesta);
        })
        .WithName("AnalizarFotoRecurso")
        .WithSummary("Analiza una fotografía de un equipo o consumible mediante visión multimodal y genera propuesta de ficha técnica (Prompt 10.5 / 10.6)")
        .Produces<PropuestaRecursoDesdeFotoDto>(StatusCodes.Status200OK)
        .Produces<ProblemDetails>(StatusCodes.Status400BadRequest);

        return app;
    }
}
