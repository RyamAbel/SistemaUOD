using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IAlertaService
{
    Task<PagedResult<AlertaDto>> ListarAsync(AlertaFiltrosDto filtros, CancellationToken ct = default);
    Task<AlertaDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);
    Task<ResumenAlertasDto> ObtenerResumenAsync(CancellationToken ct = default);
    Task<int> ObtenerConteoNoLeidasAsync(CancellationToken ct = default);
    Task<EvaluacionAlertasResultadoDto> EvaluarReglasAsync(CancellationToken ct = default);
    Task<bool> MarcarComoLeidaAsync(Guid id, CancellationToken ct = default);
    Task<int> MarcarTodasComoLeidasAsync(CancellationToken ct = default);
    Task<bool> EliminarAsync(Guid id, CancellationToken ct = default);
    Task<AlertaDto> CrearAsync(CrearAlertaDto dto, CancellationToken ct = default);
    Task<NotificacionPreferenciaDto> ObtenerPreferenciasUsuarioAsync(Guid usuarioId, CancellationToken ct = default);
    Task<NotificacionPreferenciaDto> ActualizarPreferenciasUsuarioAsync(Guid usuarioId, ActualizarPreferenciaDto dto, CancellationToken ct = default);
}
