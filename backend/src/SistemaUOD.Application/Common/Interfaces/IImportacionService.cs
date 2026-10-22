using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IImportacionService
{
    Task<ResultadoValidacionImportacionDto> ValidarFilasAsync(List<ImportarRecursoFilaDto> filas, CancellationToken ct = default);
    Task<ResultadoImportacionDto> ImportarRecursosAsync(List<ImportarRecursoFilaDto> filas, Guid usuarioId, CancellationToken ct = default);
    byte[] GenerarPlantillaCsv();
}
