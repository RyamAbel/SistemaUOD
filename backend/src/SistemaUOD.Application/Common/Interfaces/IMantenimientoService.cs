using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IMantenimientoService
{
    Task<PagedResult<MantenimientoDto>> ListarAsync(MantenimientoFiltrosDto filtros, CancellationToken ct = default);
    Task<MantenimientoDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);
    Task<List<MantenimientoDto>> ListarPorActivoAsync(Guid activoSerieId, CancellationToken ct = default);
    Task<ResumenMantenimientosActivoDto> ObtenerResumenPorActivoAsync(Guid activoSerieId, CancellationToken ct = default);
    Task<MantenimientoDto> RegistrarAsync(CrearMantenimientoDto dto, Guid usuarioId, string? direccionIp = null, CancellationToken ct = default);
    Task<MantenimientoDto> ActualizarAsync(Guid id, ActualizarMantenimientoDto dto, Guid usuarioId, string? direccionIp = null, CancellationToken ct = default);
    Task<MantenimientoDto> CompletarAsync(Guid id, CompletarMantenimientoDto dto, Guid usuarioId, string? direccionIp = null, CancellationToken ct = default);
    Task<MantenimientoDto> CancelarAsync(Guid id, CancelarMantenimientoDto dto, Guid usuarioId, string? direccionIp = null, CancellationToken ct = default);
}
