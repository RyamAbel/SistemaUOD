using System.ComponentModel.DataAnnotations;

namespace SistemaUOD.Application.DTOs;

public class ImportarRecursoFilaDto
{
    public int NumeroFila { get; set; }

    [Required(ErrorMessage = "El SKU es obligatorio.")]
    public string Sku { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre del recurso es obligatorio.")]
    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public string Categoria { get; set; } = "General";

    public string Tipo { get; set; } = "consumible"; // consumible o activo_fijo

    public string UnidadMedida { get; set; } = "unidad";

    public int StockMinimo { get; set; } = 0;

    public int? StockMaximo { get; set; }

    public int? PuntoReorden { get; set; }

    public decimal CostoEstimado { get; set; } = 0.00m;
}

public class FilaValidacionErrorDto
{
    public int NumeroFila { get; set; }
    public string? Sku { get; set; }
    public string? Nombre { get; set; }
    public string Campo { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
}

public class ResultadoValidacionImportacionDto
{
    public int TotalFilas { get; set; }
    public int FilasValidas { get; set; }
    public int FilasConError { get; set; }
    public int PosiblesDuplicados { get; set; }
    public List<FilaValidacionErrorDto> Errores { get; set; } = new();
    public List<ImportarRecursoFilaDto> RecursosValidos { get; set; } = new();
}

public class EjecutarImportacionSolicitudDto
{
    [Required]
    public List<ImportarRecursoFilaDto> Filas { get; set; } = new();
}

public class ResultadoImportacionDto
{
    public int RecursosCreados { get; set; }
    public int RecursosOmitidos { get; set; }
    public int TotalProcesados { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}
