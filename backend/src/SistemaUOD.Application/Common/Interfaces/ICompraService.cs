using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface ICompraService
{
    Task<PagedResult<OrdenCompraDto>> ListarOrdenesAsync(OrdenCompraFiltrosDto filtros, CancellationToken ct = default);
    Task<OrdenCompraDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default);
    Task<OrdenCompraDto> CrearOrdenAsync(CrearOrdenCompraDto dto, Guid usuarioId, CancellationToken ct = default);
    Task<OrdenCompraDto> ActualizarOrdenAsync(Guid id, ActualizarOrdenCompraDto dto, Guid usuarioId, CancellationToken ct = default);
    Task<OrdenCompraDto> CambiarEstadoAsync(Guid id, CambiarEstadoOrdenDto dto, Guid usuarioId, CancellationToken ct = default);
    Task<OrdenCompraDto> RecibirOrdenAsync(Guid id, RecepcionCompraDto dto, Guid usuarioId, CancellationToken ct = default);
    Task<List<SugerenciaOrdenStockBajoDto>> ObtenerSugerenciasStockBajoAsync(Guid? proveedorId = null, CancellationToken ct = default);
}
