namespace SistemaUOD.Application.DTOs;

public class ResumenEjecutivoDto
{
    public int TotalRecursosCatalogo { get; set; }
    public int TotalActivosFisicos { get; set; }
    public int EquiposEnUso { get; set; }
    public int EquiposEnAlmacen { get; set; }
    public int EquiposEnMantenimiento { get; set; }
    public int EquiposDeBaja { get; set; }
    public int TotalStockConsumibles { get; set; }
    public int AlertasStockBajo { get; set; }
    public int OrdenesCompraActivas { get; set; }
    public decimal ValorPatrimonialHistoricoDop { get; set; }
    public decimal DepreciacionAcumuladaDop { get; set; }
    public decimal ValorNetoEnLibrosDop { get; set; }
    public decimal ExactitudInventarioPorcentaje { get; set; }
    public DateTime FechaGeneracion { get; set; } = DateTime.UtcNow;
}

public class RotacionConsumibleItemDto
{
    public Guid RecursoId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public int StockActual { get; set; }
    public int StockMinimo { get; set; }
    public int TotalEntradas { get; set; }
    public int TotalSalidas { get; set; }
    public decimal TasaRotacion { get; set; }
    public decimal CostoEstimadoUnitario { get; set; }
    public decimal CostoTotalConsumidoDop { get; set; }
}

public class DistribucionParqueTiDto
{
    public string Categoria { get; set; } = string.Empty;
    public int CantidadEquipos { get; set; }
    public int EnUso { get; set; }
    public int EnAlmacen { get; set; }
    public int EnMantenimiento { get; set; }
    public int DeBaja { get; set; }
    public decimal PorcentajeDelTotal { get; set; }
}

public class ReporteOrdenesProveedorDto
{
    public Guid ProveedorId { get; set; }
    public string ProveedorNombre { get; set; } = string.Empty;
    public string? Rnc { get; set; }
    public int TotalOrdenes { get; set; }
    public int OrdenesCompletadas { get; set; }
    public decimal MontoTotalDop { get; set; }
    public decimal TasaCumplimiento { get; set; }
}
