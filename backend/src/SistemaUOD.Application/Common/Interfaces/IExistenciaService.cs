using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IExistenciaService
{
    Task<PagedResult<ResumenStockRecursoDto>> ObtenerResumenStockAsync(ExistenciaFiltrosDto filtros, CancellationToken ct = default);
    Task<ResumenStockRecursoDto?> ObtenerStockPorRecursoAsync(Guid recursoId, CancellationToken ct = default);
    Task<List<ExistenciaDto>> ObtenerExistenciasDetalladasAsync(Guid? recursoId = null, Guid? ubicacionId = null, CancellationToken ct = default);
    Task<List<ResumenStockRecursoDto>> ObtenerAlertasStockBajoAsync(CancellationToken ct = default);
    Task<List<ExistenciaDto>> ObtenerAlertasVencimientoAsync(int diasAnticipacion = 30, CancellationToken ct = default);
}
