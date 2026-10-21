using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
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
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return Results.BadRequest(new ProblemDetails
                {
                    Title = "Mensaje inválido",
                    Detail = "El mensaje del usuario no puede estar vacío.",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            var respuesta = await assistantService.ProcesarMensajeAsync(request, ct);
            return Results.Ok(respuesta);
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

        return app;
    }
}
