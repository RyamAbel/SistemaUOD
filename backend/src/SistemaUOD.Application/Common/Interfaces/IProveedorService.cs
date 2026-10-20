using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IProveedorService
{
    Task<PagedResult<ProveedorDto>> ObtenerPaginadoAsync(PagedRequest request, bool? soloActivos = null, CancellationToken ct = default);
    Task<ProveedorDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);
    Task<ProveedorDto> CrearAsync(CrearProveedorDto dto, CancellationToken ct = default);
    Task<ProveedorDto?> ActualizarAsync(Guid id, ActualizarProveedorDto dto, CancellationToken ct = default);
    Task<bool> CambiarEstadoAsync(Guid id, bool activo, CancellationToken ct = default);
}
