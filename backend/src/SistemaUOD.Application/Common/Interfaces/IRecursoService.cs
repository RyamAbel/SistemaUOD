using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IRecursoService
{
    Task<PagedResult<RecursoDto>> ListarAsync(RecursoFiltrosDto filtros, CancellationToken ct = default);
    Task<RecursoDetalleDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);
    Task<RecursoDto> CrearAsync(CrearRecursoDto dto, CancellationToken ct = default);
    Task<RecursoDto?> ActualizarAsync(Guid id, ActualizarRecursoDto dto, CancellationToken ct = default);
    Task<RecursoDto> DuplicarAsync(Guid id, DuplicarRecursoDto dto, CancellationToken ct = default);
    Task<bool> CambiarEstadoAsync(Guid id, bool activo, CancellationToken ct = default);
    Task<bool> DesactivarAsync(Guid id, CancellationToken ct = default);
}
