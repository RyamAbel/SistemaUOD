using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface ICodigoService
{
    Task<List<RecursoCodigoDto>> ObtenerCodigosAsync(Guid recursoId, CancellationToken ct = default);
    Task<RecursoCodigoDto> AgregarCodigoAsync(Guid recursoId, AgregarCodigoRecursoDto dto, CancellationToken ct = default);
    Task<bool> EliminarCodigoAsync(Guid recursoId, Guid codigoId, CancellationToken ct = default);
    Task<byte[]> GenerarQrPngAsync(string contenido, int pixelesPorModulo = 10, CancellationToken ct = default);
    Task<EnlaceQrDto> ObtenerOAsignarQrPropioAsync(Guid recursoId, string baseUrl, CancellationToken ct = default);
    Task<ResolucionCodigoDto> ResolverCodigoAsync(string codigo, string baseUrl, CancellationToken ct = default);
}
