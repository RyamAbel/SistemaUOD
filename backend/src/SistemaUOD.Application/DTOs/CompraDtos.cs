using System.ComponentModel.DataAnnotations;

namespace SistemaUOD.Application.DTOs;

public class OrdenCompraLineaDto
{
    public Guid Id { get; set; }
    public Guid OrdenId { get; set; }
    public Guid RecursoId { get; set; }
    public string RecursoSku { get; set; } = string.Empty;
    public string RecursoNombre { get; set; } = string.Empty;
    public string RecursoTipo { get; set; } = string.Empty;
    public string UnidadMedida { get; set; } = string.Empty;
    public int CantidadSolicitada { get; set; }
    public int CantidadRecibida { get; set; }
    public int CantidadPendiente => Math.Max(0, CantidadSolicitada - CantidadRecibida);
    public decimal PrecioUnitarioEstimado { get; set; }
    public decimal SubtotalEstimado => CantidadSolicitada * PrecioUnitarioEstimado;
    public decimal SubtotalRecibido => CantidadRecibida * PrecioUnitarioEstimado;
}

public class OrdenCompraDto
{
    public Guid Id { get; set; }
    public string NumeroOrden { get; set; } = string.Empty;
    public Guid ProveedorId { get; set; }
    public string ProveedorNombre { get; set; } = string.Empty;
    public string? ProveedorRnc { get; set; }
    public string? ProveedorContacto { get; set; }
    public string? ProveedorTelefono { get; set; }
    public string? ProveedorCorreo { get; set; }
    public Guid SolicitanteId { get; set; }
    public string SolicitanteNombre { get; set; } = string.Empty;
    public string SolicitanteCorreo { get; set; } = string.Empty;
    public string Estado { get; set; } = "borrador"; // borrador, aprobada, enviada, recibida_parcial, recibida_total, cancelada
    public DateOnly FechaEmision { get; set; }
    public DateOnly? FechaEntregaEstimada { get; set; }
    public string? Observaciones { get; set; }
    public int TotalLineas { get; set; }
    public int TotalUnidadesSolicitadas { get; set; }
    public int TotalUnidadesRecibidas { get; set; }
    public decimal TotalEstimado { get; set; }
    public decimal PorcentajeRecepcion => TotalUnidadesSolicitadas > 0
        ? Math.Round((decimal)TotalUnidadesRecibidas / TotalUnidadesSolicitadas * 100, 1)
        : 0;
    public DateTime CreadoEn { get; set; }
    public DateTime ActualizadoEn { get; set; }
    public List<OrdenCompraLineaDto> Lineas { get; set; } = new();
}

public class CrearOrdenCompraLineaDto
{
    [Required(ErrorMessage = "El identificador del recurso es obligatorio.")]
    public Guid RecursoId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "La cantidad solicitada debe ser mayor a cero.")]
    public int CantidadSolicitada { get; set; }

    [Range(0, 10000000, ErrorMessage = "El precio unitario estimado debe ser mayor o igual a cero.")]
    public decimal PrecioUnitarioEstimado { get; set; } = 0.00m;
}

public class CrearOrdenCompraDto
{
    [Required(ErrorMessage = "El identificador del proveedor es obligatorio.")]
    public Guid ProveedorId { get; set; }

    public DateOnly? FechaEntregaEstimada { get; set; }

    public string? Observaciones { get; set; }

    [Required(ErrorMessage = "Debe incluir al menos una línea en la orden de compra.")]
    [MinLength(1, ErrorMessage = "La orden de compra debe contener al menos un producto o recurso.")]
    public List<CrearOrdenCompraLineaDto> Lineas { get; set; } = new();
}

public class ActualizarOrdenCompraDto
{
    [Required(ErrorMessage = "El identificador del proveedor es obligatorio.")]
    public Guid ProveedorId { get; set; }

    public DateOnly? FechaEntregaEstimada { get; set; }

    public string? Observaciones { get; set; }

    [Required(ErrorMessage = "Debe incluir al menos una línea en la orden de compra.")]
    [MinLength(1, ErrorMessage = "La orden de compra debe contener al menos un producto o recurso.")]
    public List<CrearOrdenCompraLineaDto> Lineas { get; set; } = new();
}

public class CambiarEstadoOrdenDto
{
    [Required(ErrorMessage = "El nuevo estado es obligatorio.")]
    [RegularExpression("^(borrador|aprobada|enviada|cancelada)$",
        ErrorMessage = "Estado no válido para transición manual. Use: borrador, aprobada, enviada, cancelada.")]
    public string Estado { get; set; } = string.Empty;

    public string? Observaciones { get; set; }
}

public class RecepcionLineaDto
{
    [Required(ErrorMessage = "El identificador de la línea es obligatorio.")]
    public Guid LineaId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "La cantidad recibida debe ser mayor a cero.")]
    public int CantidadRecibida { get; set; }

    public string? NumeroLote { get; set; }

    public DateOnly? FechaVencimiento { get; set; }
}

public class RecepcionCompraDto
{
    [Required(ErrorMessage = "La ubicación de destino para la recepción es obligatoria.")]
    public Guid UbicacionRecepcionId { get; set; }

    public string? ConduceOReferencia { get; set; }

    public string? Observaciones { get; set; }

    [Required(ErrorMessage = "Debe especificar al menos una línea a recibir.")]
    [MinLength(1, ErrorMessage = "Debe recibir al menos una línea de la orden de compra.")]
    public List<RecepcionLineaDto> Lineas { get; set; } = new();
}

public class OrdenCompraFiltrosDto
{
    public string? Busqueda { get; set; }
    public string? Estado { get; set; }
    public Guid? ProveedorId { get; set; }
    public DateOnly? FechaDesde { get; set; }
    public DateOnly? FechaHasta { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class SugerenciaOrdenStockBajoDto
{
    public Guid RecursoId { get; set; }
    public string RecursoSku { get; set; } = string.Empty;
    public string RecursoNombre { get; set; } = string.Empty;
    public string CategoriaNombre { get; set; } = string.Empty;
    public Guid? ProveedorSugeridoId { get; set; }
    public string? ProveedorSugeridoNombre { get; set; }
    public int StockActual { get; set; }
    public int StockMinimo { get; set; }
    public int PuntoReorden { get; set; }
    public int CantidadSugerida { get; set; }
    public decimal CostoUnitarioEstimado { get; set; }
    public decimal SubtotalEstimado => CantidadSugerida * CostoUnitarioEstimado;
}
