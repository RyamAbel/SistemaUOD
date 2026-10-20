using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IRecursoFotoService
{
    Task<List<RecursoFotoDto>> ObtenerFotosAsync(Guid recursoId, CancellationToken ct = default);
    Task<SubirFotoRespuestaDto> SubirFotoAsync(Guid recursoId, Stream stream, string nombreArchivo, string contentType, long tamanoBytes, bool esPrincipal, CancellationToken ct = default);
    Task<bool> EstablecerFotoPrincipalAsync(Guid recursoId, Guid fotoId, CancellationToken ct = default);
    Task<bool> ReordenarFotosAsync(Guid recursoId, List<Guid> fotosOrdenadasIds, CancellationToken ct = default);
    Task<bool> EliminarFotoAsync(Guid recursoId, Guid fotoId, CancellationToken ct = default);
}
