using System.ComponentModel.DataAnnotations;

namespace SistemaUOD.Application.DTOs;

public class ReordenarFotosDto
{
    [Required(ErrorMessage = "La lista de identificadores de fotos ordenadas es obligatoria.")]
    [MinLength(1, ErrorMessage = "Debe enviar al menos una foto para reordenar.")]
    public List<Guid> FotosOrdenadasIds { get; set; } = [];
}

public class SubirFotoRespuestaDto
{
    public Guid Id { get; set; }
    public Guid RecursoId { get; set; }
    public string UrlArchivo { get; set; } = string.Empty;
    public string UrlFirmada { get; set; } = string.Empty;
    public bool EsPrincipal { get; set; }
    public int Orden { get; set; }
    public DateTime CreadoEn { get; set; }
}
