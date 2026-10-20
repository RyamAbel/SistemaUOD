namespace SistemaUOD.Application.Common.Interfaces;

public interface IStorageService
{
    Task<string> SubirArchivoAsync(string bucket, string rutaDestino, Stream contenido, string contentType, CancellationToken ct = default);
    Task<bool> EliminarArchivoAsync(string bucket, string rutaDestino, CancellationToken ct = default);
    Task<string> ObtenerUrlFirmadaAsync(string bucket, string rutaDestino, TimeSpan duracion, CancellationToken ct = default);
}
