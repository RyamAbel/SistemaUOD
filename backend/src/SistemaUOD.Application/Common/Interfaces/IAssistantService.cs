using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IAssistantService
{
    Task<ChatResponseDto> ProcesarMensajeAsync(ChatRequestDto request, CancellationToken ct = default);
    Task<ConsumoAsistenteDto> ObtenerResumenConsumoAsync(CancellationToken ct = default);
    Task<ResultadoConfirmacionPropuestaDto> ConfirmarPropuestaAsync(string propuestaId, CancellationToken ct = default);
    Task<bool> CancelarPropuestaAsync(string propuestaId, CancellationToken ct = default);
    Task<ResultadoConfirmacionPropuestaDto> RevertirPropuestaAsync(string propuestaId, CancellationToken ct = default);
    Task<PropuestaRecursoDesdeFotoDto> AnalizarFotoRecursoAsync(AnalisisFotoRecursoDto dto, CancellationToken ct = default);
}
