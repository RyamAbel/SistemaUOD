using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface ICategoriaService
{
    Task<List<CategoriaDto>> ObtenerTodasAsync(bool? soloActivas = null, CancellationToken ct = default);
    Task<CategoriaDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);
    Task<CategoriaDto> CrearAsync(CrearCategoriaDto dto, CancellationToken ct = default);
    Task<CategoriaDto?> ActualizarAsync(Guid id, ActualizarCategoriaDto dto, CancellationToken ct = default);
    Task<bool> CambiarEstadoAsync(Guid id, bool activa, CancellationToken ct = default);
    Task<bool> EliminarAsync(Guid id, CancellationToken ct = default);
}
