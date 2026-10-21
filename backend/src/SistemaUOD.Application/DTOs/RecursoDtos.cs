using System.ComponentModel.DataAnnotations;

namespace SistemaUOD.Application.DTOs;

public class RecursoFiltrosDto
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public Guid? CategoriaId { get; set; }
    public string? Tipo { get; set; } // "consumible" o "activo_fijo"
    public Guid? UbicacionId { get; set; }
    public Guid? ResponsableId { get; set; }
    public Guid? ProveedorId { get; set; }
    public bool? StockBajo { get; set; }
    public bool? StockAgotado { get; set; }
    public decimal? CostoMin { get; set; }
    public decimal? CostoMax { get; set; }
    public DateOnly? FechaAdquisicionDesde { get; set; }
    public DateOnly? FechaAdquisicionHasta { get; set; }
    public bool? ConFoto { get; set; }
    public bool? ConQr { get; set; }
    public bool? Activo { get; set; } = true;
    public string? SortBy { get; set; }
    public bool IsDescending { get; set; } = false;
}

public class RecursoDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public Guid CategoriaId { get; set; }
    public string CategoriaNombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = "consumible";
    public string UnidadMedida { get; set; } = "unidad";
    public int StockMinimo { get; set; }
    public int? StockMaximo { get; set; }
    public int? PuntoReorden { get; set; }
    public decimal CostoEstimado { get; set; }
    public bool Activo { get; set; }
    public int StockActual { get; set; }
    public string? FotoPrincipalUrl { get; set; }
    public int TotalFotos { get; set; }
    public string? QrPrincipalCodigo { get; set; }
    public int TotalActivosSerie { get; set; }
    public DateTime CreadoEn { get; set; }
    public DateTime ActualizadoEn { get; set; }
}

public class RecursoFotoDto
{
    public Guid Id { get; set; }
    public string UrlArchivo { get; set; } = string.Empty;
    public bool EsPrincipal { get; set; }
    public int Orden { get; set; }
    public DateTime CreadoEn { get; set; }
}

public class RecursoCodigoDto
{
    public Guid Id { get; set; }
    public string TipoCodigo { get; set; } = string.Empty; // qr_propio, codigo_barras, fabricante
    public string Codigo { get; set; } = string.Empty;
    public bool EsPrincipal { get; set; }
    public DateTime CreadoEn { get; set; }
}

public class RecursoExistenciaDto
{
    public Guid UbicacionId { get; set; }
    public string UbicacionNombre { get; set; } = string.Empty;
    public string UbicacionCodigo { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public DateTime ActualizadoEn { get; set; }
}

public class RecursoActivoSerieDto
{
    public Guid Id { get; set; }
    public string NumeroSerie { get; set; } = string.Empty;
    public string? PlacaInstitucional { get; set; }
    public string Estado { get; set; } = "disponible";
    public Guid UbicacionId { get; set; }
    public string UbicacionNombre { get; set; } = string.Empty;
    public Guid? ResponsableId { get; set; }
    public string? ResponsableNombre { get; set; }
    public Guid? ProveedorId { get; set; }
    public string? ProveedorNombre { get; set; }
    public DateOnly? FechaAdquisicion { get; set; }
    public string? Notas { get; set; }
}

public class RecursoDetalleDto : RecursoDto
{
    public List<RecursoFotoDto> Fotos { get; set; } = [];
    public List<RecursoCodigoDto> Codigos { get; set; } = [];
    public List<RecursoExistenciaDto> Existencias { get; set; } = [];
    public List<RecursoActivoSerieDto> ActivosSerie { get; set; } = [];
}

public class CrearRecursoDto
{
    [Required(ErrorMessage = "El código SKU es obligatorio.")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "El SKU debe tener entre 2 y 50 caracteres.")]
    public string Sku { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre del recurso es obligatorio.")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 200 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(1000, ErrorMessage = "La descripción no puede exceder los 1000 caracteres.")]
    public string? Descripcion { get; set; }

    [Required(ErrorMessage = "La categoría es obligatoria.")]
    public Guid CategoriaId { get; set; }

    [Required(ErrorMessage = "El tipo de recurso es obligatorio.")]
    [RegularExpression(@"^(consumible|activo_fijo)$", ErrorMessage = "El tipo debe ser 'consumible' o 'activo_fijo'.")]
    public string Tipo { get; set; } = "consumible";

    [Required(ErrorMessage = "La unidad de medida es obligatoria.")]
    [StringLength(30, ErrorMessage = "La unidad de medida no puede exceder 30 caracteres.")]
    public string UnidadMedida { get; set; } = "unidad";

    [Range(0, 1000000, ErrorMessage = "El stock mínimo no puede ser negativo.")]
    public int StockMinimo { get; set; } = 0;

    [Range(0, 1000000, ErrorMessage = "El stock máximo no puede ser negativo.")]
    public int? StockMaximo { get; set; }

    [Range(0, 1000000, ErrorMessage = "El punto de reorden no puede ser negativo.")]
    public int? PuntoReorden { get; set; }

    [Range(0, 99999999.99, ErrorMessage = "El costo estimado debe ser un valor positivo.")]
    public decimal CostoEstimado { get; set; } = 0.00m;

    public string? CodigoQrInicial { get; set; }

    public bool Activo { get; set; } = true;
}

public class ActualizarRecursoDto
{
    [Required(ErrorMessage = "El código SKU es obligatorio.")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "El SKU debe tener entre 2 y 50 caracteres.")]
    public string Sku { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre del recurso es obligatorio.")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 200 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(1000, ErrorMessage = "La descripción no puede exceder los 1000 caracteres.")]
    public string? Descripcion { get; set; }

    [Required(ErrorMessage = "La categoría es obligatoria.")]
    public Guid CategoriaId { get; set; }

    [Required(ErrorMessage = "El tipo de recurso es obligatorio.")]
    [RegularExpression(@"^(consumible|activo_fijo)$", ErrorMessage = "El tipo debe ser 'consumible' o 'activo_fijo'.")]
    public string Tipo { get; set; } = "consumible";

    [Required(ErrorMessage = "La unidad de medida es obligatoria.")]
    [StringLength(30, ErrorMessage = "La unidad de medida no puede exceder 30 caracteres.")]
    public string UnidadMedida { get; set; } = "unidad";

    [Range(0, 1000000, ErrorMessage = "El stock mínimo no puede ser negativo.")]
    public int StockMinimo { get; set; } = 0;

    [Range(0, 1000000, ErrorMessage = "El stock máximo no puede ser negativo.")]
    public int? StockMaximo { get; set; }

    [Range(0, 1000000, ErrorMessage = "El punto de reorden no puede ser negativo.")]
    public int? PuntoReorden { get; set; }

    [Range(0, 99999999.99, ErrorMessage = "El costo estimado debe ser un valor positivo.")]
    public decimal CostoEstimado { get; set; } = 0.00m;

    public bool Activo { get; set; } = true;
}

public class DuplicarRecursoDto
{
    [Required(ErrorMessage = "El nuevo SKU es obligatorio.")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "El SKU debe tener entre 2 y 50 caracteres.")]
    public string NuevoSku { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nuevo nombre es obligatorio.")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 200 caracteres.")]
    public string NuevoNombre { get; set; } = string.Empty;

    public bool CopiarFotos { get; set; } = true;
    public bool CopiarCodigos { get; set; } = false;
}

public class ActualizarStockMinimoDto
{
    [Range(0, 1000000, ErrorMessage = "El stock mínimo no puede ser negativo.")]
    public int StockMinimo { get; set; } = 0;

    [Range(0, 1000000, ErrorMessage = "El stock máximo no puede ser negativo.")]
    public int? StockMaximo { get; set; }

    [Range(0, 1000000, ErrorMessage = "El punto de reorden no puede ser negativo.")]
    public int? PuntoReorden { get; set; }
}

