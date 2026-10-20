using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IMovimientoService
{
    Task<MovimientoDto> RegistrarMovimientoAsync(
        CrearMovimientoDto dto,
        Guid usuarioId,
        string? idempotencyKey = null,
        CancellationToken ct = default);

    Task<PrevisualizarMovimientoResultadoDto> PrevisualizarMovimientoAsync(
        CrearMovimientoDto dto,
        CancellationToken ct = default);

    Task<PagedResult<MovimientoDto>> ListarMovimientosAsync(
        MovimientoFiltrosDto filtros,
        CancellationToken ct = default);

    Task<MovimientoDto?> ObtenerMovimientoPorIdAsync(
        Guid id,
        CancellationToken ct = default);
}
