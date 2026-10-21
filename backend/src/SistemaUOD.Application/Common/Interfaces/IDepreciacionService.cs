using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IDepreciacionService
{
    Task<CalculoDepreciacionActivoDto?> CalcularDepreciacionActivoAsync(Guid activoId, DateOnly? fechaCorte = null, CancellationToken ct = default);
    Task<TablaAmortizacionActivoDto?> GenerarTablaAmortizacionAsync(Guid activoId, CancellationToken ct = default);
    Task<PagedResult<CalculoDepreciacionActivoDto>> ListarDepreciacionesAsync(FiltroDepreciacionDto filtros, CancellationToken ct = default);
    Task<ResumenDepreciacionContableDto> ObtenerResumenContableAsync(DateOnly? fechaCorte = null, CancellationToken ct = default);
    Task<byte[]> ExportarDepreciacionCsvAsync(FiltroDepreciacionDto filtros, CancellationToken ct = default);
}
