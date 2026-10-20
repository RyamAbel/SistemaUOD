using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IUbicacionService
{
    Task<PagedResult<UbicacionDto>> ListarUbicacionesAsync(UbicacionFiltrosDto filtros, CancellationToken ct = default);
    Task<List<UbicacionNodoArbolDto>> ObtenerArbolJerarquicoAsync(bool? soloActivas = null, CancellationToken ct = default);
    Task<UbicacionDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);
    Task<UbicacionDto> CrearUbicacionAsync(CrearUbicacionDto dto, CancellationToken ct = default);
    Task<UbicacionDto> ActualizarUbicacionAsync(Guid id, ActualizarUbicacionDto dto, CancellationToken ct = default);
    Task CambiarEstadoAsync(Guid id, bool activa, CancellationToken ct = default);
    Task EliminarUbicacionAsync(Guid id, CancellationToken ct = default);
}
