using SistemaUOD.Domain.Common;

namespace SistemaUOD.Domain.Entities;

public class Categoria : BaseTenantEntity
{
    public Guid? ParentId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Codigo { get; set; }
    public string? Icono { get; set; }
    public bool Activo { get; set; } = true;

    // Navigation properties
    public Categoria? Parent { get; set; }
    public ICollection<Categoria> Subcategorias { get; set; } = new List<Categoria>();
    public ICollection<Articulo> Articulos { get; set; } = new List<Articulo>();
}

public class Ubicacion : BaseTenantEntity
{
    public string Sede { get; set; } = "Principal";
    public string Nombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = "almacen";
    public Guid? ResponsableId { get; set; }
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;

    // Navigation properties
    public Perfil? Responsable { get; set; }
    public ICollection<Existencia> Existencias { get; set; } = new List<Existencia>();
}

public class Existencia : BaseTenantEntity
{
    public Guid ArticuloId { get; set; }
    public Guid UbicacionId { get; set; }
    public decimal Cantidad { get; set; } = 0.00m;
    public string? Lote { get; set; }
    public DateTime? FechaVencimiento { get; set; }

    // Navigation properties
    public Articulo Articulo { get; set; } = null!;
    public Ubicacion Ubicacion { get; set; } = null!;
}

public class ActivoFijo : BaseTenantEntity
{
    public Guid ArticuloId { get; set; }
    public string? NumeroSerie { get; set; }
    public string CodigoActivo { get; set; } = string.Empty;
    public DateTime? FechaAdquisicion { get; set; }
    public decimal CostoCompra { get; set; } = 0.00m;
    public string Estado { get; set; } = "disponible";
    public Guid? ResponsableId { get; set; }
    public Guid? UbicacionId { get; set; }
    public string? Notas { get; set; }

    // Navigation properties
    public Articulo Articulo { get; set; } = null!;
    public Perfil? Responsable { get; set; }
    public Ubicacion? Ubicacion { get; set; }
}

public class Perfil : BaseTenantEntity
{
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Cargo { get; set; }
    public string? Departamento { get; set; }
    public string Rol { get; set; } = "consulta";
    public string Estado { get; set; } = "activo";
}

public class Movimiento : BaseTenantEntity
{
    public string NumeroMovimiento { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty; // entrada, salida, traslado, ajuste_positivo, etc.
    public Guid ArticuloId { get; set; }
    public decimal Cantidad { get; set; }
    public Guid? UbicacionOrigenId { get; set; }
    public Guid? UbicacionDestinoId { get; set; }
    public string? Lote { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string? DocumentoReferencia { get; set; }
    public Guid UsuarioId { get; set; }
    public bool OrigenIa { get; set; } = false;
    public string? IdempotencyKey { get; set; }

    // Navigation properties
    public Articulo Articulo { get; set; } = null!;
    public Ubicacion? UbicacionOrigen { get; set; }
    public Ubicacion? UbicacionDestino { get; set; }
    public Perfil Usuario { get; set; } = null!;
}
