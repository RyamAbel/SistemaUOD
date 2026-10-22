using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IReporteService
{
    Task<ResumenEjecutivoDto> ObtenerResumenEjecutivoAsync(CancellationToken ct = default);
    Task<List<RotacionConsumibleItemDto>> ObtenerRotacionConsumiblesAsync(CancellationToken ct = default);
    Task<List<DistribucionParqueTiDto>> ObtenerDistribucionParqueTiAsync(CancellationToken ct = default);
    Task<List<ReporteOrdenesProveedorDto>> ObtenerReporteProveedoresAsync(CancellationToken ct = default);
    Task<byte[]> GenerarReportePatrimonialCsvAsync(CancellationToken ct = default);
}
