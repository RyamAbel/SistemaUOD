using System.ComponentModel.DataAnnotations;

namespace SistemaUOD.Application.DTOs;

public class ConteoLineaDto
{
    public Guid Id { get; set; }
    public Guid ConteoId { get; set; }
    public Guid RecursoId { get; set; }
    public string RecursoSku { get; set; } = string.Empty;
    public string RecursoNombre { get; set; } = string.Empty;
    public string RecursoTipo { get; set; } = string.Empty;
    public string UnidadMedida { get; set; } = string.Empty;
    public Guid? LoteId { get; set; }
    public string? NumeroLote { get; set; }
    public DateOnly? FechaVencimiento { get; set; }
    public int CantidadSistema { get; set; }
    public int CantidadFisica { get; set; }
    public int Diferencia { get; set; } // Fisica - Sistema
    public Guid? AjusteMovimientoId { get; set; }
    public string? AjusteMovimientoNumero { get; set; }
    public string? Notas { get; set; }
}

public class ConteoFisicoDto
{
    public Guid Id { get; set; }
    public Guid UbicacionId { get; set; }
    public string UbicacionNombre { get; set; } = string.Empty;
    public string UbicacionCodigo { get; set; } = string.Empty;
    public Guid ResponsableId { get; set; }
    public string ResponsableNombre { get; set; } = string.Empty;
    public string ResponsableCorreo { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }
    public DateTime? FechaCierre { get; set; }
    public string Estado { get; set; } = "abierto"; // abierto, conciliado, cancelado
    public string? Observaciones { get; set; }
    public int TotalLineas { get; set; }
    public int TotalUnidadesSistema { get; set; }
    public int TotalUnidadesFisicas { get; set; }
    public int TotalDiscrepancias { get; set; }
    public DateTime CreadoEn { get; set; }
    public List<ConteoLineaDto> Lineas { get; set; } = new();
}

public class IniciarConteoFisicoDto
{
    [Required(ErrorMessage = "La ubicación auditada es obligatoria.")]
    public Guid UbicacionId { get; set; }

    public string? Observaciones { get; set; }

    public bool PrecargarExistenciasSistema { get; set; } = true;
}

public class ActualizarLineaConteoDto
{
    [Required(ErrorMessage = "El identificador de recurso es obligatorio.")]
    public Guid RecursoId { get; set; }

    public Guid? LoteId { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "La cantidad física debe ser mayor o igual a cero.")]
    public int CantidadFisica { get; set; }

    public string? Notas { get; set; }
}

public class SincronizarConteosDto
{
    [Required(ErrorMessage = "Debe enviar al menos una línea para sincronizar.")]
    public List<ActualizarLineaConteoDto> Lineas { get; set; } = new();
}

public class EscanearItemConteoDto
{
    [Required(ErrorMessage = "El código escaneado es obligatorio.")]
    public string Codigo { get; set; } = string.Empty;

    public int CantidadSumar { get; set; } = 1;

    public string? Notas { get; set; }
}

public class ConciliarConteoDto
{
    public string? Observaciones { get; set; }
}

public class ConteoFisicoFiltrosDto
{
    public Guid? UbicacionId { get; set; }
    public string? Estado { get; set; }
    public DateTime? FechaDesde { get; set; }
    public DateTime? FechaHasta { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
