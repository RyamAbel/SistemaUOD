using System.ComponentModel.DataAnnotations;
using SistemaUOD.Application.Common.Models;

namespace SistemaUOD.Application.DTOs;

public class ActivoSerieDto
{
    public Guid Id { get; set; }
    public Guid RecursoId { get; set; }
    public string RecursoSku { get; set; } = string.Empty;
    public string RecursoNombre { get; set; } = string.Empty;
    public Guid CategoriaId { get; set; }
    public string CategoriaNombre { get; set; } = string.Empty;
    public string NumeroSerie { get; set; } = string.Empty;
    public string? PlacaInstitucional { get; set; }
    public string Estado { get; set; } = "disponible";
    public Guid UbicacionId { get; set; }
    public string UbicacionNombre { get; set; } = string.Empty;
    public Guid? ResponsableId { get; set; }
    public string? ResponsableNombre { get; set; }
    public string? ResponsableCorreo { get; set; }
    public Guid? ProveedorId { get; set; }
    public string? ProveedorNombre { get; set; }
    public DateOnly? FechaAdquisicion { get; set; }
    public DateOnly? GarantiaVence { get; set; }
    public decimal CostoEstimado { get; set; }
    public string? Notas { get; set; }
    public DateTime CreadoEn { get; set; }
    public DateTime ActualizadoEn { get; set; }
}

public class ActivoSerieDetalleDto : ActivoSerieDto
{
    public List<ActivoAsignacionHistorialDto> HistorialAsignaciones { get; set; } = new();
    public List<ActivoMantenimientoHistorialDto> HistorialMantenimientos { get; set; } = new();
}

public class ActivoAsignacionHistorialDto
{
    public Guid Id { get; set; }
    public Guid CustodioId { get; set; }
    public string CustodioNombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = "asignacion_fija";
    public DateTime FechaInicio { get; set; }
    public DateTime? FechaDevolucionPrevista { get; set; }
    public DateTime? FechaDevolucionReal { get; set; }
    public string Estado { get; set; } = "activo";
    public string? Observaciones { get; set; }
}

public class ActivoMantenimientoHistorialDto
{
    public Guid Id { get; set; }
    public string Tipo { get; set; } = "preventivo";
    public string Descripcion { get; set; } = string.Empty;
    public DateTime FechaProgramada { get; set; }
    public DateTime? FechaRealizada { get; set; }
    public string Estado { get; set; } = "programado";
    public decimal Costo { get; set; }
    public string? TecnicoResponsable { get; set; }
    public string? ProveedorNombre { get; set; }
}

public class CrearActivoSerieDto
{
    [Required(ErrorMessage = "El ID del recurso es obligatorio.")]
    public Guid RecursoId { get; set; }

    [Required(ErrorMessage = "El número de serie es obligatorio.")]
    [StringLength(100, ErrorMessage = "El número de serie no puede exceder 100 caracteres.")]
    public string NumeroSerie { get; set; } = string.Empty;

    [StringLength(50, ErrorMessage = "La placa institucional no puede exceder 50 caracteres.")]
    public string? PlacaInstitucional { get; set; }

    [StringLength(30, ErrorMessage = "El estado no puede exceder 30 caracteres.")]
    public string Estado { get; set; } = "disponible";

    [Required(ErrorMessage = "La ubicación física inicial es obligatoria.")]
    public Guid UbicacionId { get; set; }

    public Guid? ResponsableId { get; set; }
    public Guid? ProveedorId { get; set; }
    public DateOnly? FechaAdquisicion { get; set; }
    public DateOnly? GarantiaVence { get; set; }

    [StringLength(500, ErrorMessage = "Las notas no pueden exceder 500 caracteres.")]
    public string? Notas { get; set; }
}

public class ActualizarActivoSerieDto
{
    [Required(ErrorMessage = "El número de serie es obligatorio.")]
    [StringLength(100, ErrorMessage = "El número de serie no puede exceder 100 caracteres.")]
    public string NumeroSerie { get; set; } = string.Empty;

    [StringLength(50, ErrorMessage = "La placa institucional no puede exceder 50 caracteres.")]
    public string? PlacaInstitucional { get; set; }

    [Required(ErrorMessage = "El estado operativo es obligatorio.")]
    [StringLength(30, ErrorMessage = "El estado no puede exceder 30 caracteres.")]
    public string Estado { get; set; } = "disponible";

    [Required(ErrorMessage = "La ubicación física es obligatoria.")]
    public Guid UbicacionId { get; set; }

    public Guid? ResponsableId { get; set; }
    public Guid? ProveedorId { get; set; }
    public DateOnly? FechaAdquisicion { get; set; }
    public DateOnly? GarantiaVence { get; set; }

    [StringLength(500, ErrorMessage = "Las notas no pueden exceder 500 caracteres.")]
    public string? Notas { get; set; }
}

public class CambiarEstadoActivoDto
{
    [Required(ErrorMessage = "El nuevo estado es obligatorio.")]
    [StringLength(30, ErrorMessage = "El estado no puede exceder 30 caracteres.")]
    public string Estado { get; set; } = string.Empty;

    [StringLength(300, ErrorMessage = "El motivo no puede exceder 300 caracteres.")]
    public string? Motivo { get; set; }
}

public class ActivoFiltrosDto : PagedRequest
{
    public Guid? RecursoId { get; set; }
    public Guid? CategoriaId { get; set; }
    public Guid? UbicacionId { get; set; }
    public Guid? ResponsableId { get; set; }
    public string? Estado { get; set; }
    public string? Custodio { get; set; }
    public string? PlacaInstitucional { get; set; }
}

public class TrasladarActivoDto
{
    [Required(ErrorMessage = "La nueva ubicación física es obligatoria.")]
    public Guid NuevaUbicacionId { get; set; }

    public Guid? NuevoCustodioId { get; set; }

    [StringLength(30, ErrorMessage = "El tipo de asignación no puede exceder 30 caracteres.")]
    public string? TipoAsignacion { get; set; } = "asignacion_fija";

    [Required(ErrorMessage = "El motivo del traslado es obligatorio.")]
    [MinLength(5, ErrorMessage = "El motivo debe contener al menos 5 caracteres.")]
    [StringLength(300, ErrorMessage = "El motivo no puede exceder 300 caracteres.")]
    public string Motivo { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Las observaciones no pueden exceder 500 caracteres.")]
    public string? Observaciones { get; set; }
}

public class AsignarCustodioDto
{
    [Required(ErrorMessage = "El custodio o responsable es obligatorio.")]
    public Guid CustodioId { get; set; }

    [StringLength(30, ErrorMessage = "El tipo de asignación no puede exceder 30 caracteres.")]
    public string Tipo { get; set; } = "asignacion_fija";

    public DateTime? FechaDevolucionPrevista { get; set; }

    [Required(ErrorMessage = "El motivo u observaciones son obligatorios.")]
    [MinLength(5, ErrorMessage = "El motivo debe contener al menos 5 caracteres.")]
    [StringLength(500, ErrorMessage = "Las observaciones no pueden exceder 500 caracteres.")]
    public string Observaciones { get; set; } = string.Empty;
}

public class ActaEntregaRecepcionDto
{
    public string NumeroActa { get; set; } = string.Empty;
    public DateTime FechaEmision { get; set; } = DateTime.UtcNow;
    public string TipoOperacion { get; set; } = "traslado";
    public string Institucion { get; set; } = "Universidad Odontológica Dominicana (UOD)";
    public string DepartamentoEmisor { get; set; } = "Departamento de Tecnología de la Información (TI)";
    public Guid ActivoId { get; set; }
    public string PlacaInstitucional { get; set; } = string.Empty;
    public string NumeroSerie { get; set; } = string.Empty;
    public string RecursoNombre { get; set; } = string.Empty;
    public string RecursoSku { get; set; } = string.Empty;
    public string CategoriaNombre { get; set; } = string.Empty;
    public string? UbicacionAnterior { get; set; }
    public string UbicacionNueva { get; set; } = string.Empty;
    public string? CustodioAnterior { get; set; }
    public string CustodioNuevo { get; set; } = string.Empty;
    public string? CustodioNuevoCorreo { get; set; }
    public string? CustodioNuevoDepartamento { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public List<string> ClausulasResponsabilidad { get; set; } = new();
    public string FirmaEmisorNombre { get; set; } = "Administrador de TI";
    public string FirmaEmisorCargo { get; set; } = "Encargado de Inventario y Activos UOD";
    public string FirmaReceptorNombre { get; set; } = string.Empty;
    public string FirmaReceptorCargo { get; set; } = "Custodio Responsable";
}

public class ResultadoTrasladoActivoDto
{
    public bool Exitoso { get; set; } = true;
    public string Mensaje { get; set; } = string.Empty;
    public ActivoSerieDto Activo { get; set; } = null!;
    public ActaEntregaRecepcionDto Acta { get; set; } = null!;
}
