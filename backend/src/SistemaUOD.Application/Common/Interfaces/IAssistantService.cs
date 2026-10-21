using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IAssistantService
{
    Task<ChatResponseDto> ProcesarMensajeAsync(ChatRequestDto request, CancellationToken ct = default);
}
