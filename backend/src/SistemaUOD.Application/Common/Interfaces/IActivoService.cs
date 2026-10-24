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
    Task<ResultadoBajaActivoDto> ProcesarBajaPatrimonialAsync(Guid id, DarDeBajaActivoDto dto, CancellationToken ct = default);
    Task<ActaDescargoPatrimonialDto> GenerarActaDescargoAsync(Guid id, CancellationToken ct = default);
    Task<ActivoSerieDto> SubirFacturaAsync(Guid id, Stream archivoStream, string nombreArchivo, string contentType, long tamanoBytes, CancellationToken ct = default);
    Task<ActivoSerieDto> EliminarFacturaAsync(Guid id, CancellationToken ct = default);
    Task<List<ActivoHistorialCambioDto>> ObtenerHistorialCambiosAsync(Guid id, CancellationToken ct = default);
    Task<bool> EliminarActivoDefinitivoAsync(Guid id, CancellationToken ct = default);
}
