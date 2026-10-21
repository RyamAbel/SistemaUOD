using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IActivoService
{
    Task<PagedResult<ActivoSerieDto>> ListarActivosAsync(ActivoFiltrosDto filtros, CancellationToken ct = default);
    Task<ActivoSerieDetalleDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);
    Task<ActivoSerieDetalleDto?> ObtenerPorPlacaAsync(string placa, CancellationToken ct = default);
    Task<ActivoSerieDto> CrearActivoAsync(CrearActivoSerieDto dto, CancellationToken ct = default);
    Task<ActivoSerieDto> ActualizarActivoAsync(Guid id, ActualizarActivoSerieDto dto, CancellationToken ct = default);
    Task<ActivoSerieDto> CambiarEstadoAsync(Guid id, CambiarEstadoActivoDto dto, CancellationToken ct = default);
    Task<ActivoSerieDto> DarDeBajaAsync(Guid id, string motivo, CancellationToken ct = default);
    Task<ResultadoTrasladoActivoDto> TrasladarActivoAsync(Guid id, TrasladarActivoDto dto, CancellationToken ct = default);
    Task<ResultadoTrasladoActivoDto> AsignarCustodioAsync(Guid id, AsignarCustodioDto dto, CancellationToken ct = default);
    Task<ActaEntregaRecepcionDto> GenerarActaEntregaAsync(Guid id, CancellationToken ct = default);
}
