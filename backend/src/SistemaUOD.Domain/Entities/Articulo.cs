using SistemaUOD.Domain.Common;
using SistemaUOD.Domain.Enums;

namespace SistemaUOD.Domain.Entities;

public class Articulo : BaseTenantEntity
{
    public Guid? CategoriaId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string? CodigoBarras { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public TipoArticulo Tipo { get; set; } = TipoArticulo.Consumible;
    public string UnidadMedida { get; set; } = "unidad";
    public int StockMinimo { get; set; } = 5;
    public int? StockMaximo { get; set; }
    public decimal CostoEstimado { get; set; } = 0.00m;
    public string? ImagenUrl { get; set; }
    public bool Activo { get; set; } = true;

    // Navigation properties
    public Categoria? Categoria { get; set; }
    public ICollection<Existencia> Existencias { get; set; } = new List<Existencia>();
    public ICollection<ActivoFijo> ActivosFijos { get; set; } = new List<ActivoFijo>();
}
