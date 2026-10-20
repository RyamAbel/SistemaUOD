using System.ComponentModel.DataAnnotations;

namespace SistemaUOD.Application.DTOs;

public class UbicacionDto
{
    public Guid Id { get; set; }
    public Guid? UbicacionPadreId { get; set; }
    public string? UbicacionPadreNombre { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = "almacen";
    public Guid? ResponsableId { get; set; }
    public string? ResponsableNombre { get; set; }
    public string? ResponsableCorreo { get; set; }
    public bool Activa { get; set; } = true;
    public int TotalSububicaciones { get; set; }
    public int TotalExistencias { get; set; }
    public int TotalActivosFisicos { get; set; }
    public DateTime CreadoEn { get; set; }
    public DateTime ActualizadoEn { get; set; }
}

public class UbicacionNodoArbolDto
{
    public Guid Id { get; set; }
    public Guid? UbicacionPadreId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = "almacen";
    public string? ResponsableNombre { get; set; }
    public bool Activa { get; set; } = true;
    public int TotalExistencias { get; set; }
    public int TotalActivosFisicos { get; set; }
    public List<UbicacionNodoArbolDto> Hijos { get; set; } = new();
}

public class CrearUbicacionDto
{
    public Guid? UbicacionPadreId { get; set; }

    [Required(ErrorMessage = "El código de la ubicación es obligatorio.")]
    [MaxLength(50, ErrorMessage = "El código no puede exceder 50 caracteres.")]
    public string Codigo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre de la ubicación es obligatorio.")]
    [MaxLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El tipo de ubicación es obligatorio.")]
    [MaxLength(50, ErrorMessage = "El tipo no puede exceder 50 caracteres.")]
    public string Tipo { get; set; } = "almacen"; // sede, almacen, departamento, aula, clinica, oficina, laboratorio, etc.

    public Guid? ResponsableId { get; set; }

    public bool Activa { get; set; } = true;
}

public class ActualizarUbicacionDto
{
    public Guid? UbicacionPadreId { get; set; }

    [Required(ErrorMessage = "El código de la ubicación es obligatorio.")]
    [MaxLength(50, ErrorMessage = "El código no puede exceder 50 caracteres.")]
    public string Codigo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre de la ubicación es obligatorio.")]
    [MaxLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El tipo de ubicación es obligatorio.")]
    [MaxLength(50, ErrorMessage = "El tipo no puede exceder 50 caracteres.")]
    public string Tipo { get; set; } = "almacen";

    public Guid? ResponsableId { get; set; }

    public bool Activa { get; set; } = true;
}

public class UbicacionFiltrosDto
{
    public string? Search { get; set; }
    public string? Tipo { get; set; }
    public Guid? UbicacionPadreId { get; set; }
    public bool? SoloActivas { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public string? SortBy { get; set; } = "codigo";
    public bool IsDescending { get; set; } = false;
}
