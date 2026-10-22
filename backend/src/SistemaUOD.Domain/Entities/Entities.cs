namespace SistemaUOD.Domain.Entities;

public class Perfil
{
    public Guid Id { get; set; }
    public string Correo { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Rol { get; set; } = "consulta";
    public string? Cargo { get; set; }
    public string? Departamento { get; set; }
    public string? Telefono { get; set; }
    public string? AvatarUrl { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    // Relaciones
    public ICollection<Ubicacion> UbicacionesACargo { get; set; } = new List<Ubicacion>();
    public ICollection<ActivoSerie> ActivosACargo { get; set; } = new List<ActivoSerie>();
    public ICollection<Movimiento> MovimientosRealizados { get; set; } = new List<Movimiento>();
    public ICollection<AsignacionPrestamo> Asignaciones { get; set; } = new List<AsignacionPrestamo>();
    public ICollection<BitacoraAuditoria> Auditorias { get; set; } = new List<BitacoraAuditoria>();
}

public class Categoria
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? CategoriaPadreId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activa { get; set; } = true;
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    // Relaciones
    public Categoria? CategoriaPadre { get; set; }
    public ICollection<Categoria> Subcategorias { get; set; } = new List<Categoria>();
    public ICollection<Recurso> Recursos { get; set; } = new List<Recurso>();
}

public class Ubicacion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UbicacionPadreId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = "almacen";
    public Guid? ResponsableId { get; set; }
    public bool Activa { get; set; } = true;
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    // Relaciones
    public Ubicacion? UbicacionPadre { get; set; }
    public ICollection<Ubicacion> Sububicaciones { get; set; } = new List<Ubicacion>();
    public Perfil? Responsable { get; set; }
    public ICollection<Existencia> Existencias { get; set; } = new List<Existencia>();
    public ICollection<ActivoSerie> Activos { get; set; } = new List<ActivoSerie>();
}

public class Recurso
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Sku { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public Guid CategoriaId { get; set; }
    public string Tipo { get; set; } = "consumible"; // consumible o activo_fijo
    public string UnidadMedida { get; set; } = "unidad";
    public int StockMinimo { get; set; } = 0;
    public int? StockMaximo { get; set; }
    public int? PuntoReorden { get; set; }
    public decimal CostoEstimado { get; set; } = 0.00m;
    public bool Activo { get; set; } = true;
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    // Relaciones
    public Categoria Categoria { get; set; } = null!;
    public ICollection<RecursoFoto> Fotos { get; set; } = new List<RecursoFoto>();
    public ICollection<RecursoCodigo> Codigos { get; set; } = new List<RecursoCodigo>();
    public ICollection<Existencia> Existencias { get; set; } = new List<Existencia>();
    public ICollection<Lote> Lotes { get; set; } = new List<Lote>();
    public ICollection<ActivoSerie> ActivosSerie { get; set; } = new List<ActivoSerie>();
}

public class RecursoFoto
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RecursoId { get; set; }
    public string UrlArchivo { get; set; } = string.Empty;
    public bool EsPrincipal { get; set; } = false;
    public int Orden { get; set; } = 0;
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public Recurso Recurso { get; set; } = null!;
}

public class RecursoCodigo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RecursoId { get; set; }
    public string TipoCodigo { get; set; } = "qr_propio";
    public string Codigo { get; set; } = string.Empty;
    public bool EsPrincipal { get; set; } = false;
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public Recurso Recurso { get; set; } = null!;
}

public class Proveedor
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Rnc { get; set; } = string.Empty;
    public string NombreComercial { get; set; } = string.Empty;
    public string? RazonSocial { get; set; }
    public string? ContactoNombre { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? Direccion { get; set; }
    public int PlazoCreditoDias { get; set; } = 30;
    public bool Activo { get; set; } = true;
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    public ICollection<ActivoSerie> ActivosSuministrados { get; set; } = new List<ActivoSerie>();
    public ICollection<Lote> LotesSuministrados { get; set; } = new List<Lote>();
}

public class Lote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RecursoId { get; set; }
    public string NumeroLote { get; set; } = string.Empty;
    public DateOnly? FechaFabricacion { get; set; }
    public DateOnly? FechaVencimiento { get; set; }
    public Guid? ProveedorId { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public Recurso Recurso { get; set; } = null!;
    public Proveedor? Proveedor { get; set; }
    public ICollection<Existencia> Existencias { get; set; } = new List<Existencia>();
}

public class Existencia
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RecursoId { get; set; }
    public Guid UbicacionId { get; set; }
    public Guid? LoteId { get; set; }
    public int Cantidad { get; set; } = 0;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    public Recurso Recurso { get; set; } = null!;
    public Ubicacion Ubicacion { get; set; } = null!;
    public Lote? Lote { get; set; }
}

public class ActivoSerie
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RecursoId { get; set; }
    public string NumeroSerie { get; set; } = string.Empty;
    public string? PlacaInstitucional { get; set; }
    public string Estado { get; set; } = "disponible";
    public Guid UbicacionId { get; set; }
    public Guid? ResponsableId { get; set; }
    public Guid? ProveedorId { get; set; }
    public DateOnly? FechaAdquisicion { get; set; }
    public DateOnly? GarantiaVence { get; set; }
    public decimal? CostoAdquisicion { get; set; }
    public string? FacturaUrl { get; set; }
    public string? FacturaNombre { get; set; }
    public string? Notas { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    public Recurso Recurso { get; set; } = null!;
    public Ubicacion Ubicacion { get; set; } = null!;
    public Perfil? Responsable { get; set; }
    public Proveedor? Proveedor { get; set; }
    public ICollection<AsignacionPrestamo> Asignaciones { get; set; } = new List<AsignacionPrestamo>();
    public ICollection<Mantenimiento> Mantenimientos { get; set; } = new List<Mantenimiento>();
}

public class Movimiento
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string NumeroMovimiento { get; set; } = string.Empty;
    public string Tipo { get; set; } = "entrada"; // entrada, salida, traslado, ajuste, devolucion, baja
    public Guid? OrigenUbicacionId { get; set; }
    public Guid? DestinoUbicacionId { get; set; }
    public Guid UsuarioId { get; set; }
    public bool OrigenIa { get; set; } = false;
    public string Motivo { get; set; } = string.Empty;
    public string? ComprobanteUrl { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public Ubicacion? OrigenUbicacion { get; set; }
    public Ubicacion? DestinoUbicacion { get; set; }
    public Perfil Usuario { get; set; } = null!;
    public ICollection<MovimientoLinea> Lineas { get; set; } = new List<MovimientoLinea>();
}

public class MovimientoLinea
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MovimientoId { get; set; }
    public Guid RecursoId { get; set; }
    public Guid? LoteId { get; set; }
    public int Cantidad { get; set; }
    public decimal CostoUnitario { get; set; } = 0.00m;

    public Movimiento Movimiento { get; set; } = null!;
    public Recurso Recurso { get; set; } = null!;
    public Lote? Lote { get; set; }
}

public class AsignacionPrestamo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ActivoSerieId { get; set; }
    public Guid CustodioId { get; set; }
    public string Tipo { get; set; } = "asignacion_fija";
    public DateTime FechaInicio { get; set; } = DateTime.UtcNow;
    public DateTime? FechaDevolucionPrevista { get; set; }
    public DateTime? FechaDevolucionReal { get; set; }
    public string Estado { get; set; } = "activo";
    public string? Observaciones { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    public ActivoSerie ActivoSerie { get; set; } = null!;
    public Perfil Custodio { get; set; } = null!;
}

public class Mantenimiento
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ActivoSerieId { get; set; }
    public string Tipo { get; set; } = "preventivo";
    public Guid? ProveedorId { get; set; }
    public string TecnicoResponsable { get; set; } = string.Empty;
    public decimal Costo { get; set; } = 0.00m;
    public string Descripcion { get; set; } = string.Empty;
    public DateTime FechaProgramada { get; set; }
    public DateTime? FechaRealizada { get; set; }
    public string Estado { get; set; } = "programado";
    public string? ChecklistCompletado { get; set; } = "[]";
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    public ActivoSerie ActivoSerie { get; set; } = null!;
    public Proveedor? Proveedor { get; set; }
}

public class BitacoraAuditoria
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UsuarioId { get; set; }
    public string Origen { get; set; } = "humano";
    public string Accion { get; set; } = string.Empty;
    public string Entidad { get; set; } = string.Empty;
    public string RegistroId { get; set; } = string.Empty;
    public string? ValoresAnteriores { get; set; }
    public string? ValoresNuevos { get; set; }
    public string? DireccionIp { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public Perfil? Usuario { get; set; }
}

public class Alerta
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Tipo { get; set; } = "stock_bajo";
    public string Severidad { get; set; } = "info";
    public Guid? RecursoId { get; set; }
    public Guid? UbicacionId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public bool Leida { get; set; } = false;
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public Recurso? Recurso { get; set; }
    public Ubicacion? Ubicacion { get; set; }
}

public class Invitacion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Correo { get; set; } = string.Empty;
    public string Rol { get; set; } = "consulta";
    public Guid? InvitadoPor { get; set; }
    public string Estado { get; set; } = "pendiente";
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime? UsadoEn { get; set; }
}

public class ColaCorreo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Destinatario { get; set; } = string.Empty;
    public string Asunto { get; set; } = string.Empty;
    public string CuerpoHtml { get; set; } = string.Empty;
    public string Estado { get; set; } = "pendiente";
    public int Intentos { get; set; } = 0;
    public string? UltimoError { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime? ProcesadoEn { get; set; }
}

public class NotificacionPreferencia
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public bool RecibirAlertasStock { get; set; } = true;
    public bool RecibirAlertasMantenimiento { get; set; } = true;
    public bool RecibirResumenSemanal { get; set; } = false;
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    public Perfil? Usuario { get; set; }
}

public class OrdenCompra
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string NumeroOrden { get; set; } = string.Empty;
    public Guid ProveedorId { get; set; }
    public Guid SolicitanteId { get; set; }
    public string Estado { get; set; } = "borrador"; // borrador, aprobada, enviada, recibida_parcial, recibida_total, cancelada
    public DateOnly FechaEmision { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DateOnly? FechaEntregaEstimada { get; set; }
    public string? Observaciones { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    public Proveedor Proveedor { get; set; } = null!;
    public Perfil Solicitante { get; set; } = null!;
    public ICollection<OrdenCompraLinea> Lineas { get; set; } = new List<OrdenCompraLinea>();
}

public class OrdenCompraLinea
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrdenId { get; set; }
    public Guid RecursoId { get; set; }
    public int CantidadSolicitada { get; set; }
    public int CantidadRecibida { get; set; } = 0;
    public decimal PrecioUnitarioEstimado { get; set; } = 0.00m;

    public OrdenCompra Orden { get; set; } = null!;
    public Recurso Recurso { get; set; } = null!;
}

public class ConteoFisico
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UbicacionId { get; set; }
    public Guid ResponsableId { get; set; }
    public DateTime FechaInicio { get; set; } = DateTime.UtcNow;
    public DateTime? FechaCierre { get; set; }
    public string Estado { get; set; } = "abierto"; // abierto, conciliado, cancelado
    public string? Observaciones { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public Ubicacion Ubicacion { get; set; } = null!;
    public Perfil Responsable { get; set; } = null!;
    public ICollection<ConteoLinea> Lineas { get; set; } = new List<ConteoLinea>();
}

public class ConteoLinea
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConteoId { get; set; }
    public Guid RecursoId { get; set; }
    public Guid? LoteId { get; set; }
    public int CantidadSistema { get; set; } = 0;
    public int CantidadFisica { get; set; } = 0;
    public int Diferencia { get; set; } = 0;
    public Guid? AjusteMovimientoId { get; set; }
    public string? Notas { get; set; }

    public ConteoFisico Conteo { get; set; } = null!;
    public Recurso Recurso { get; set; } = null!;
    public Lote? Lote { get; set; }
    public Movimiento? AjusteMovimiento { get; set; }
}


