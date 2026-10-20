using System.ComponentModel.DataAnnotations;

namespace SistemaUOD.Application.DTOs;

public class AgregarCodigoRecursoDto
{
    [Required(ErrorMessage = "El código es obligatorio.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "El código debe tener entre 2 y 100 caracteres.")]
    public string Codigo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El tipo de código es obligatorio.")]
    [RegularExpression(@"^(qr_propio|codigo_barras|fabricante|placa_institucional)$",
        ErrorMessage = "El tipo de código debe ser 'qr_propio', 'codigo_barras', 'fabricante' o 'placa_institucional'.")]
    public string TipoCodigo { get; set; } = "codigo_barras";

    public bool EsPrincipal { get; set; } = false;
}

public class ResolucionCodigoDto
{
    public bool Encontrado { get; set; }
    public string CodigoBuscado { get; set; } = string.Empty;
    public string TipoEntidad { get; set; } = string.Empty; // "recurso" | "activo_serie"
    public string TipoCodigoDetectado { get; set; } = string.Empty; // "qr_propio", "sku", "numero_serie", "placa_institucional", "codigo_barras", "fabricante"
    public string UrlFicha { get; set; } = string.Empty;
    public RecursoDto? Recurso { get; set; }
    public RecursoActivoSerieDto? ActivoSerie { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}

public class EnlaceQrDto
{
    public Guid RecursoId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string CodigoQr { get; set; } = string.Empty;
    public string EnlaceSeguro { get; set; } = string.Empty;
    public string UrlDescargaImagen { get; set; } = string.Empty;
}
