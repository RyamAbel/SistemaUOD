using System.ComponentModel.DataAnnotations;

namespace SistemaUOD.Application.DTOs;

public class ExistenciaDto
{
    public Guid Id { get; set; }
    public Guid RecursoId { get; set; }
    public string RecursoSku { get; set; } = string.Empty;
    public string RecursoNombre { get; set; } = string.Empty;
    public string RecursoTipo { get; set; } = "consumible";
    public string UnidadMedida { get; set; } = "unidad";

    public Guid UbicacionId { get; set; }
    public string UbicacionCodigo { get; set; } = string.Empty;
    public string UbicacionNombre { get; set; } = string.Empty;

    public Guid? LoteId { get; set; }
    public string? NumeroLote { get; set; }
    public DateOnly? FechaVencimiento { get; set; }
    public int? DiasParaVencer { get; set; }
    public bool EstaVencido { get; set; }
    public bool ProximoAVencer { get; set; }

    public int Cantidad { get; set; }
    public int CantidadReservada { get; set; }
    public int CantidadDisponible => Math.Max(0, Cantidad - CantidadReservada);

    public DateTime ActualizadoEn { get; set; }
}

public class ResumenStockRecursoDto
{
    public Guid RecursoId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string CategoriaNombre { get; set; } = string.Empty;
    public string UnidadMedida { get; set; } = "unidad";
    public string Tipo { get; set; } = "consumible";

    public int StockTotal { get; set; }
    public int StockReservado { get; set; }
    public int StockDisponible { get; set; }

    public int StockMinimo { get; set; }
    public int? StockMaximo { get; set; }
    public int? PuntoReorden { get; set; }

    /// <summary>
    /// Estado según regla RF-12: 'agotado', 'bajo_minimo', 'reorden', 'normal'
    /// </summary>
    public string EstadoStock { get; set; } = "normal";

    public bool RequiereReorden => EstadoStock == "bajo_minimo" || EstadoStock == "reorden" || EstadoStock == "agotado";

    /// <summary>
    /// Cantidad a pedir para alcanzar el nivel óptimo/máximo
    /// </summary>
    public int CantidadSugeridaReorden { get; set; }

    public int LotesVencidosCount { get; set; }
    public int LotesProximosVencerCount { get; set; }

    public List<ExistenciaPorUbicacionDto> Ubicaciones { get; set; } = new();
    public List<ExistenciaPorLoteDto> Lotes { get; set; } = new();
}

public class ExistenciaPorUbicacionDto
{
    public Guid UbicacionId { get; set; }
    public string UbicacionCodigo { get; set; } = string.Empty;
    public string UbicacionNombre { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public int CantidadDisponible { get; set; }
}

public class ExistenciaPorLoteDto
{
    public Guid LoteId { get; set; }
    public string NumeroLote { get; set; } = string.Empty;
    public DateOnly? FechaVencimiento { get; set; }
    public int? DiasParaVencer { get; set; }
    public bool EstaVencido { get; set; }
    public bool ProximoAVencer { get; set; }
    public int Cantidad { get; set; }
    public string? ProveedorNombre { get; set; }
}

public class ExistenciaFiltrosDto
{
    public Guid? RecursoId { get; set; }
    public Guid? UbicacionId { get; set; }
    public Guid? LoteId { get; set; }
    public bool? SoloStockBajo { get; set; }
    public bool? SoloAgotados { get; set; }
    public bool? ProximosAVencer { get; set; }
    public string? Search { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 25;
    public string? SortBy { get; set; } = "sku";
    public bool IsDescending { get; set; } = false;
}
