using Microsoft.EntityFrameworkCore;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Perfil> Perfiles { get; }
    DbSet<Categoria> Categorias { get; }
    DbSet<Ubicacion> Ubicaciones { get; }
    DbSet<Recurso> Recursos { get; }
    DbSet<RecursoFoto> RecursosFotos { get; }
    DbSet<RecursoCodigo> RecursosCodigos { get; }
    DbSet<Proveedor> Proveedores { get; }
    DbSet<Lote> Lotes { get; }
    DbSet<Existencia> Existencias { get; }
    DbSet<ActivoSerie> ActivosSerie { get; }
    DbSet<Movimiento> Movimientos { get; }
    DbSet<MovimientoLinea> MovimientosLineas { get; }
    DbSet<AsignacionPrestamo> AsignacionesPrestamos { get; }
    DbSet<Mantenimiento> Mantenimientos { get; }
    DbSet<BitacoraAuditoria> BitacoraAuditorias { get; }
    DbSet<Alerta> Alertas { get; }
    DbSet<Invitacion> Invitaciones { get; }
    DbSet<ColaCorreo> ColaCorreos { get; }
    DbSet<NotificacionPreferencia> NotificacionesPreferencias { get; }
    DbSet<OrdenCompra> OrdenesCompra { get; }
    DbSet<OrdenCompraLinea> OrdenesCompraLineas { get; }
    DbSet<ConteoFisico> ConteosFisicos { get; }
    DbSet<ConteoLinea> ConteosLineas { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
