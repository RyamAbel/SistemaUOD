using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IConteoFisicoService
{
    Task<PagedResult<ConteoFisicoDto>> ListarConteosAsync(ConteoFisicoFiltrosDto filtros, CancellationToken ct = default);
    Task<ConteoFisicoDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);
    Task<ConteoFisicoDto> IniciarConteoAsync(IniciarConteoFisicoDto dto, Guid usuarioId, CancellationToken ct = default);
    Task<ConteoFisicoDto> SincronizarLineasAsync(Guid conteoId, SincronizarConteosDto dto, Guid usuarioId, CancellationToken ct = default);
    Task<ConteoFisicoDto> EscanearItemAsync(Guid conteoId, EscanearItemConteoDto dto, Guid usuarioId, CancellationToken ct = default);
    Task<ConteoFisicoDto> ConciliarConteoAsync(Guid conteoId, ConciliarConteoDto dto, Guid usuarioId, CancellationToken ct = default);
    Task<ConteoFisicoDto> CancelarConteoAsync(Guid conteoId, string? motivo, Guid usuarioId, CancellationToken ct = default);
    Task EliminarConteoAsync(Guid conteoId, CancellationToken ct = default);
}
