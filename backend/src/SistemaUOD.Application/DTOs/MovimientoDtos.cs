using System.ComponentModel.DataAnnotations;

namespace SistemaUOD.Application.DTOs;

public class MovimientoLineaDto
{
    public Guid Id { get; set; }
    public Guid RecursoId { get; set; }
    public string RecursoSku { get; set; } = string.Empty;
    public string RecursoNombre { get; set; } = string.Empty;
    public string RecursoTipo { get; set; } = "consumible";
    public string UnidadMedida { get; set; } = "unidad";
    public Guid? LoteId { get; set; }
    public string? NumeroLote { get; set; }
    public DateOnly? FechaVencimiento { get; set; }
    public int Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }
    public decimal Subtotal => Cantidad * CostoUnitario;
}

public class MovimientoDto
{
    public Guid Id { get; set; }
    public string NumeroMovimiento { get; set; } = string.Empty;
    public string Tipo { get; set; } = "entrada"; // entrada, salida, traslado, ajuste, devolucion, baja
    public Guid? OrigenUbicacionId { get; set; }
    public string? OrigenUbicacionNombre { get; set; }
    public string? OrigenUbicacionCodigo { get; set; }
    public Guid? DestinoUbicacionId { get; set; }
    public string? DestinoUbicacionNombre { get; set; }
    public string? DestinoUbicacionCodigo { get; set; }
    public Guid UsuarioId { get; set; }
    public string UsuarioNombre { get; set; } = string.Empty;
    public string UsuarioCorreo { get; set; } = string.Empty;
    public bool OrigenIa { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string? ComprobanteUrl { get; set; }
    public int TotalLineas { get; set; }
    public int TotalUnidades { get; set; }
    public decimal CostoTotal { get; set; }
    public DateTime CreadoEn { get; set; }
    public List<MovimientoLineaDto> Lineas { get; set; } = new();
}

public class CrearMovimientoLineaDto
{
    [Required(ErrorMessage = "El identificador del recurso es obligatorio.")]
    public Guid RecursoId { get; set; }

    public Guid? LoteId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a cero.")]
    public int Cantidad { get; set; }

    [Range(0, 10000000, ErrorMessage = "El costo unitario debe ser mayor o igual a cero.")]
    public decimal CostoUnitario { get; set; } = 0.00m;
}

public class CrearMovimientoDto
{
    [Required(ErrorMessage = "El tipo de movimiento es obligatorio.")]
    [RegularExpression("^(entrada|salida|traslado|ajuste|devolucion|baja)$",
        ErrorMessage = "Tipo de movimiento no válido. Opciones: entrada, salida, traslado, ajuste, devolucion, baja.")]
    public string Tipo { get; set; } = "entrada";

    public Guid? OrigenUbicacionId { get; set; }
    public Guid? DestinoUbicacionId { get; set; }

    [Required(ErrorMessage = "El motivo del movimiento es obligatorio.")]
    [MinLength(5, ErrorMessage = "El motivo debe tener al menos 5 caracteres descriptivos.")]
    public string Motivo { get; set; } = string.Empty;

    public string? ComprobanteUrl { get; set; }
    public bool OrigenIa { get; set; } = false;
    public string? IdempotenciaKey { get; set; }

    [Required(ErrorMessage = "Debe incluir al menos una línea en el movimiento.")]
    [MinLength(1, ErrorMessage = "El movimiento debe tener al menos una línea de detalle.")]
    public List<CrearMovimientoLineaDto> Lineas { get; set; } = new();
}

public class MovimientoFiltrosDto
{
    public string? Tipo { get; set; }
    public Guid? UbicacionId { get; set; }
    public Guid? RecursoId { get; set; }
    public Guid? UsuarioId { get; set; }
    public DateTime? FechaDesde { get; set; }
    public DateTime? FechaHasta { get; set; }
    public string? Search { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 25;
    public string? SortBy { get; set; } = "creadoEn";
    public bool IsDescending { get; set; } = true;
}

public class PrevisualizarMovimientoLineaDto
{
    public Guid RecursoId { get; set; }
    public string RecursoSku { get; set; } = string.Empty;
    public string RecursoNombre { get; set; } = string.Empty;
    public Guid UbicacionId { get; set; }
    public string UbicacionNombre { get; set; } = string.Empty;
    public Guid? LoteId { get; set; }
    public string? NumeroLote { get; set; }
    public int StockActual { get; set; }
    public int CantidadOperacion { get; set; } // Negativa si resta, positiva si suma
    public int StockResultante { get; set; }
    public bool EsValido => StockResultante >= 0;
    public string? MensajeError { get; set; }
}

public class PrevisualizarMovimientoResultadoDto
{
    public bool EsValido { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public int TotalLineas { get; set; }
    public List<PrevisualizarMovimientoLineaDto> Lineas { get; set; } = new();
    public List<string> Errores { get; set; } = new();
}
