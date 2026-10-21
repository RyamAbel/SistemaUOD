using System.ComponentModel.DataAnnotations;
using SistemaUOD.Application.Common.Models;

namespace SistemaUOD.Application.DTOs;

public class MantenimientoDto
{
    public Guid Id { get; set; }
    public Guid ActivoSerieId { get; set; }
    public string PlacaInstitucional { get; set; } = string.Empty;
    public string NumeroSerie { get; set; } = string.Empty;
    public string RecursoNombre { get; set; } = string.Empty;
    public string CategoriaNombre { get; set; } = string.Empty;
    public string UbicacionNombre { get; set; } = string.Empty;

    public string Tipo { get; set; } = "preventivo"; // preventivo, correctivo, calibracion
    public Guid? ProveedorId { get; set; }
    public string? ProveedorNombre { get; set; }
    public string? TecnicoResponsable { get; set; }
    public decimal Costo { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public DateTime FechaProgramada { get; set; }
    public DateTime? FechaRealizada { get; set; }
    public string Estado { get; set; } = "programado"; // programado, en_proceso, completado, cancelado
    public DateTime CreadoEn { get; set; }
}

public class CrearMantenimientoDto
{
    [Required(ErrorMessage = "El ID del activo fijo o serie es obligatorio")]
    public Guid ActivoSerieId { get; set; }

    [Required(ErrorMessage = "El tipo de mantenimiento es obligatorio")]
    [RegularExpression("^(preventivo|correctivo|calibracion)$", ErrorMessage = "Tipo inválido: preventivo, correctivo o calibracion")]
    public string Tipo { get; set; } = "preventivo";

    public Guid? ProveedorId { get; set; }

    [MaxLength(150, ErrorMessage = "El nombre del técnico no puede exceder 150 caracteres")]
    public string? TecnicoResponsable { get; set; }

    [Range(0, 10000000, ErrorMessage = "El costo debe ser un valor no negativo")]
    public decimal Costo { get; set; } = 0.00m;

    [Required(ErrorMessage = "La descripción de la intervención es obligatoria")]
    [MinLength(5, ErrorMessage = "La descripción debe tener al menos 5 caracteres")]
    [MaxLength(1000, ErrorMessage = "La descripción no puede exceder 1000 caracteres")]
    public string Descripcion { get; set; } = string.Empty;

    public DateTime FechaProgramada { get; set; } = DateTime.UtcNow;

    public bool CambiarEstadoActivoAEnMantenimiento { get; set; } = false;
}

public class ActualizarMantenimientoDto
{
    [Required(ErrorMessage = "El tipo de mantenimiento es obligatorio")]
    [RegularExpression("^(preventivo|correctivo|calibracion)$", ErrorMessage = "Tipo inválido: preventivo, correctivo o calibracion")]
    public string Tipo { get; set; } = "preventivo";

    public Guid? ProveedorId { get; set; }

    [MaxLength(150, ErrorMessage = "El nombre del técnico no puede exceder 150 caracteres")]
    public string? TecnicoResponsable { get; set; }

    [Range(0, 10000000, ErrorMessage = "El costo debe ser un valor no negativo")]
    public decimal Costo { get; set; }

    [Required(ErrorMessage = "La descripción es obligatoria")]
    [MinLength(5, ErrorMessage = "La descripción debe tener al menos 5 caracteres")]
    public string Descripcion { get; set; } = string.Empty;

    public DateTime FechaProgramada { get; set; }
    public DateTime? FechaRealizada { get; set; }

    [Required(ErrorMessage = "El estado es obligatorio")]
    [RegularExpression("^(programado|en_proceso|completado|cancelado)$", ErrorMessage = "Estado inválido")]
    public string Estado { get; set; } = "programado";
}

public class CompletarMantenimientoDto
{
    public DateTime FechaRealizada { get; set; } = DateTime.UtcNow;

    [Range(0, 10000000, ErrorMessage = "El costo final debe ser un valor no negativo")]
    public decimal CostoFinal { get; set; }

    [MaxLength(150, ErrorMessage = "El nombre del técnico no puede exceder 150 caracteres")]
    public string? TecnicoResponsable { get; set; }

    public string? ObservacionesFinales { get; set; }

    public string EstadoFinalActivo { get; set; } = "disponible"; // disponible, en_uso
}

public class CancelarMantenimientoDto
{
    [Required(ErrorMessage = "El motivo de la cancelación es obligatorio")]
    [MinLength(5, ErrorMessage = "El motivo debe tener al menos 5 caracteres")]
    public string Motivo { get; set; } = string.Empty;
}

public class MantenimientoFiltrosDto : PagedRequest
{
    public Guid? ActivoSerieId { get; set; }
    public string? PlacaInstitucional { get; set; }
    public string? Tipo { get; set; }
    public string? Estado { get; set; }
    public Guid? ProveedorId { get; set; }
    public DateTime? FechaDesde { get; set; }
    public DateTime? FechaHasta { get; set; }
}

public class ResumenMantenimientosActivoDto
{
    public Guid ActivoSerieId { get; set; }
    public string PlacaInstitucional { get; set; } = string.Empty;
    public string RecursoNombre { get; set; } = string.Empty;
    public int TotalMantenimientos { get; set; }
    public int TotalPreventivos { get; set; }
    public int TotalCorrectivos { get; set; }
    public int TotalCalibraciones { get; set; }
    public decimal CostoTotalInvertidoDop { get; set; }
    public DateTime? UltimoMantenimientoFecha { get; set; }
    public DateTime? ProximoMantenimientoProgramado { get; set; }
    public List<MantenimientoDto> UltimosServicios { get; set; } = new();
}
