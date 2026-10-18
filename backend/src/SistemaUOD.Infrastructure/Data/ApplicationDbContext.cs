using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Domain.Entities;
using SistemaUOD.Domain.Enums;

namespace SistemaUOD.Infrastructure.Data;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentUserService _currentUserService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService) : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<Perfil> Perfiles => Set<Perfil>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Ubicacion> Ubicaciones => Set<Ubicacion>();
    public DbSet<Recurso> Recursos => Set<Recurso>();
    public DbSet<RecursoFoto> RecursosFotos => Set<RecursoFoto>();
    public DbSet<RecursoCodigo> RecursosCodigos => Set<RecursoCodigo>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<Lote> Lotes => Set<Lote>();
    public DbSet<Existencia> Existencias => Set<Existencia>();
    public DbSet<ActivoSerie> ActivosSerie => Set<ActivoSerie>();
    public DbSet<Movimiento> Movimientos => Set<Movimiento>();
    public DbSet<MovimientoLinea> MovimientosLineas => Set<MovimientoLinea>();
    public DbSet<AsignacionPrestamo> AsignacionesPrestamos => Set<AsignacionPrestamo>();
    public DbSet<Mantenimiento> Mantenimientos => Set<Mantenimiento>();
    public DbSet<BitacoraAuditoria> BitacoraAuditorias => Set<BitacoraAuditoria>();
    public DbSet<Alerta> Alertas => Set<Alerta>();
    public DbSet<Invitacion> Invitaciones => Set<Invitacion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Perfiles (vinculados a auth.users)
        modelBuilder.Entity<Perfil>(entity =>
        {
            entity.ToTable("perfiles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Correo).HasColumnName("correo").IsRequired();
            entity.Property(e => e.NombreCompleto).HasColumnName("nombre_completo").IsRequired();
            entity.Property(e => e.Rol).HasColumnName("rol").HasColumnType("rol_usuario").IsRequired();
            entity.Property(e => e.Departamento).HasColumnName("departamento");
            entity.Property(e => e.Telefono).HasColumnName("telefono");
            entity.Property(e => e.Activo).HasColumnName("activo").HasDefaultValue(true);
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
            entity.Property(e => e.ActualizadoEn).HasColumnName("actualizado_en");
        });

        // 2. Categorías
        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.ToTable("categorias");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CategoriaPadreId).HasColumnName("categoria_padre_id");
            entity.Property(e => e.Codigo).HasColumnName("codigo").IsRequired();
            entity.Property(e => e.Nombre).HasColumnName("nombre").IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion");
            entity.Property(e => e.Activa).HasColumnName("activa");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
            entity.Property(e => e.ActualizadoEn).HasColumnName("actualizado_en");

            entity.HasOne(e => e.CategoriaPadre)
                .WithMany(e => e.Subcategorias)
                .HasForeignKey(e => e.CategoriaPadreId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 3. Ubicaciones
        modelBuilder.Entity<Ubicacion>(entity =>
        {
            entity.ToTable("ubicaciones");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UbicacionPadreId).HasColumnName("ubicacion_padre_id");
            entity.Property(e => e.Codigo).HasColumnName("codigo").IsRequired();
            entity.Property(e => e.Nombre).HasColumnName("nombre").IsRequired();
            entity.Property(e => e.Tipo).HasColumnName("tipo").HasColumnType("tipo_ubicacion").IsRequired();
            entity.Property(e => e.ResponsableId).HasColumnName("responsable_id");
            entity.Property(e => e.Activa).HasColumnName("activa");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
            entity.Property(e => e.ActualizadoEn).HasColumnName("actualizado_en");

            entity.HasOne(e => e.UbicacionPadre)
                .WithMany(e => e.Sububicaciones)
                .HasForeignKey(e => e.UbicacionPadreId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Responsable)
                .WithMany(p => p.UbicacionesACargo)
                .HasForeignKey(e => e.ResponsableId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // 4. Recursos
        modelBuilder.Entity<Recurso>(entity =>
        {
            entity.ToTable("recursos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Sku).HasColumnName("sku").IsRequired();
            entity.Property(e => e.Nombre).HasColumnName("nombre").IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion");
            entity.Property(e => e.CategoriaId).HasColumnName("categoria_id");
            entity.Property(e => e.Tipo).HasColumnName("tipo").HasColumnType("tipo_recurso").IsRequired();
            entity.Property(e => e.UnidadMedida).HasColumnName("unidad_medida").HasDefaultValue("unidad");
            entity.Property(e => e.StockMinimo).HasColumnName("stock_minimo");
            entity.Property(e => e.StockMaximo).HasColumnName("stock_maximo");
            entity.Property(e => e.PuntoReorden).HasColumnName("punto_reorden");
            entity.Property(e => e.CostoEstimado).HasColumnName("costo_estimado").HasPrecision(12, 2);
            entity.Property(e => e.Activo).HasColumnName("activo");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
            entity.Property(e => e.ActualizadoEn).HasColumnName("actualizado_en");

            entity.HasOne(e => e.Categoria)
                .WithMany(c => c.Recursos)
                .HasForeignKey(e => e.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 5. Recursos Fotos
        modelBuilder.Entity<RecursoFoto>(entity =>
        {
            entity.ToTable("recursos_fotos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RecursoId).HasColumnName("recurso_id");
            entity.Property(e => e.UrlArchivo).HasColumnName("url_archivo").IsRequired();
            entity.Property(e => e.EsPrincipal).HasColumnName("es_principal");
            entity.Property(e => e.Orden).HasColumnName("orden");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");

            entity.HasOne(e => e.Recurso)
                .WithMany(r => r.Fotos)
                .HasForeignKey(e => e.RecursoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 6. Recursos Códigos
        modelBuilder.Entity<RecursoCodigo>(entity =>
        {
            entity.ToTable("recursos_codigos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RecursoId).HasColumnName("recurso_id");
            entity.Property(e => e.TipoCodigo).HasColumnName("tipo_codigo").HasColumnType("tipo_codigo").IsRequired();
            entity.Property(e => e.Codigo).HasColumnName("codigo").IsRequired();
            entity.Property(e => e.EsPrincipal).HasColumnName("es_principal");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");

            entity.HasOne(e => e.Recurso)
                .WithMany(r => r.Codigos)
                .HasForeignKey(e => e.RecursoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 7. Proveedores
        modelBuilder.Entity<Proveedor>(entity =>
        {
            entity.ToTable("proveedores");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Rnc).HasColumnName("rnc").IsRequired();
            entity.Property(e => e.NombreComercial).HasColumnName("nombre_comercial").IsRequired();
            entity.Property(e => e.RazonSocial).HasColumnName("razon_social");
            entity.Property(e => e.ContactoNombre).HasColumnName("contacto_nombre");
            entity.Property(e => e.Telefono).HasColumnName("telefono");
            entity.Property(e => e.Correo).HasColumnName("correo");
            entity.Property(e => e.Direccion).HasColumnName("direccion");
            entity.Property(e => e.PlazoCreditoDias).HasColumnName("plazo_credito_dias");
            entity.Property(e => e.Activo).HasColumnName("activo");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
            entity.Property(e => e.ActualizadoEn).HasColumnName("actualizado_en");
        });

        // 8. Lotes
        modelBuilder.Entity<Lote>(entity =>
        {
            entity.ToTable("lotes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RecursoId).HasColumnName("recurso_id");
            entity.Property(e => e.NumeroLote).HasColumnName("numero_lote").IsRequired();
            entity.Property(e => e.FechaFabricacion).HasColumnName("fecha_fabricacion");
            entity.Property(e => e.FechaVencimiento).HasColumnName("fecha_vencimiento");
            entity.Property(e => e.ProveedorId).HasColumnName("proveedor_id");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");

            entity.HasOne(e => e.Recurso)
                .WithMany(r => r.Lotes)
                .HasForeignKey(e => e.RecursoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Proveedor)
                .WithMany(p => p.LotesSuministrados)
                .HasForeignKey(e => e.ProveedorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // 9. Existencias
        modelBuilder.Entity<Existencia>(entity =>
        {
            entity.ToTable("existencias");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RecursoId).HasColumnName("recurso_id");
            entity.Property(e => e.UbicacionId).HasColumnName("ubicacion_id");
            entity.Property(e => e.LoteId).HasColumnName("lote_id");
            entity.Property(e => e.Cantidad).HasColumnName("cantidad");
            entity.Property(e => e.ActualizadoEn).HasColumnName("actualizado_en");

            entity.HasOne(e => e.Recurso)
                .WithMany(r => r.Existencias)
                .HasForeignKey(e => e.RecursoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Ubicacion)
                .WithMany(u => u.Existencias)
                .HasForeignKey(e => e.UbicacionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Lote)
                .WithMany(l => l.Existencias)
                .HasForeignKey(e => e.LoteId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 10. Activos Serie
        modelBuilder.Entity<ActivoSerie>(entity =>
        {
            entity.ToTable("activos_serie");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RecursoId).HasColumnName("recurso_id");
            entity.Property(e => e.NumeroSerie).HasColumnName("numero_serie").IsRequired();
            entity.Property(e => e.PlacaInstitucional).HasColumnName("placa_institucional");
            entity.Property(e => e.Estado).HasColumnName("estado").HasColumnType("estado_recurso").IsRequired();
            entity.Property(e => e.UbicacionId).HasColumnName("ubicacion_id");
            entity.Property(e => e.ResponsableId).HasColumnName("responsable_id");
            entity.Property(e => e.ProveedorId).HasColumnName("proveedor_id");
            entity.Property(e => e.FechaAdquisicion).HasColumnName("fecha_adquisicion");
            entity.Property(e => e.GarantiaVence).HasColumnName("garantia_vence");
            entity.Property(e => e.Notas).HasColumnName("notas");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
            entity.Property(e => e.ActualizadoEn).HasColumnName("actualizado_en");

            entity.HasOne(e => e.Recurso)
                .WithMany(r => r.ActivosSerie)
                .HasForeignKey(e => e.RecursoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Ubicacion)
                .WithMany(u => u.Activos)
                .HasForeignKey(e => e.UbicacionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Responsable)
                .WithMany(p => p.ActivosACargo)
                .HasForeignKey(e => e.ResponsableId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Proveedor)
                .WithMany(p => p.ActivosSuministrados)
                .HasForeignKey(e => e.ProveedorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // 11. Movimientos
        modelBuilder.Entity<Movimiento>(entity =>
        {
            entity.ToTable("movimientos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.NumeroMovimiento).HasColumnName("numero_movimiento").IsRequired();
            entity.Property(e => e.Tipo).HasColumnName("tipo").HasColumnType("tipo_movimiento").IsRequired();
            entity.Property(e => e.OrigenUbicacionId).HasColumnName("origen_ubicacion_id");
            entity.Property(e => e.DestinoUbicacionId).HasColumnName("destino_ubicacion_id");
            entity.Property(e => e.UsuarioId).HasColumnName("usuario_id");
            entity.Property(e => e.OrigenIa).HasColumnName("origen_ia");
            entity.Property(e => e.Motivo).HasColumnName("motivo").IsRequired();
            entity.Property(e => e.ComprobanteUrl).HasColumnName("comprobante_url");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");

            entity.HasOne(e => e.OrigenUbicacion)
                .WithMany()
                .HasForeignKey(e => e.OrigenUbicacionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DestinoUbicacion)
                .WithMany()
                .HasForeignKey(e => e.DestinoUbicacionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Usuario)
                .WithMany(p => p.MovimientosRealizados)
                .HasForeignKey(e => e.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 12. Movimientos Líneas
        modelBuilder.Entity<MovimientoLinea>(entity =>
        {
            entity.ToTable("movimientos_lineas");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.MovimientoId).HasColumnName("movimiento_id");
            entity.Property(e => e.RecursoId).HasColumnName("recurso_id");
            entity.Property(e => e.LoteId).HasColumnName("lote_id");
            entity.Property(e => e.Cantidad).HasColumnName("cantidad");
            entity.Property(e => e.CostoUnitario).HasColumnName("costo_unitario").HasPrecision(12, 2);

            entity.HasOne(e => e.Movimiento)
                .WithMany(m => m.Lineas)
                .HasForeignKey(e => e.MovimientoId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Recurso)
                .WithMany()
                .HasForeignKey(e => e.RecursoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Lote)
                .WithMany()
                .HasForeignKey(e => e.LoteId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 13. Asignaciones y Préstamos
        modelBuilder.Entity<AsignacionPrestamo>(entity =>
        {
            entity.ToTable("asignaciones_prestamos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ActivoSerieId).HasColumnName("activo_serie_id");
            entity.Property(e => e.CustodioId).HasColumnName("custodio_id");
            entity.Property(e => e.Tipo).HasColumnName("tipo").HasColumnType("tipo_asignacion").IsRequired();
            entity.Property(e => e.FechaInicio).HasColumnName("fecha_inicio");
            entity.Property(e => e.FechaDevolucionPrevista).HasColumnName("fecha_devolucion_prevista");
            entity.Property(e => e.FechaDevolucionReal).HasColumnName("fecha_devolucion_real");
            entity.Property(e => e.Estado).HasColumnName("estado").HasColumnType("estado_asignacion").IsRequired();
            entity.Property(e => e.Observaciones).HasColumnName("observaciones");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
            entity.Property(e => e.ActualizadoEn).HasColumnName("actualizado_en");

            entity.HasOne(e => e.ActivoSerie)
                .WithMany(a => a.Asignaciones)
                .HasForeignKey(e => e.ActivoSerieId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Custodio)
                .WithMany(p => p.Asignaciones)
                .HasForeignKey(e => e.CustodioId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 14. Mantenimientos
        modelBuilder.Entity<Mantenimiento>(entity =>
        {
            entity.ToTable("mantenimientos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ActivoSerieId).HasColumnName("activo_serie_id");
            entity.Property(e => e.Tipo).HasColumnName("tipo").HasColumnType("tipo_mantenimiento").IsRequired();
            entity.Property(e => e.ProveedorId).HasColumnName("proveedor_id");
            entity.Property(e => e.TecnicoResponsable).HasColumnName("tecnico_responsable");
            entity.Property(e => e.Costo).HasColumnName("costo").HasPrecision(12, 2);
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").IsRequired();
            entity.Property(e => e.FechaProgramada).HasColumnName("fecha_programada");
            entity.Property(e => e.FechaRealizada).HasColumnName("fecha_realizada");
            entity.Property(e => e.Estado).HasColumnName("estado").HasColumnType("estado_mantenimiento").IsRequired();
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");

            entity.HasOne(e => e.ActivoSerie)
                .WithMany(a => a.Mantenimientos)
                .HasForeignKey(e => e.ActivoSerieId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Proveedor)
                .WithMany()
                .HasForeignKey(e => e.ProveedorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // 15. Bitácora de Auditoría
        modelBuilder.Entity<BitacoraAuditoria>(entity =>
        {
            entity.ToTable("bitacora_auditoria");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UsuarioId).HasColumnName("usuario_id");
            entity.Property(e => e.Origen).HasColumnName("origen").HasColumnType("origen_auditoria").IsRequired();
            entity.Property(e => e.Accion).HasColumnName("accion").IsRequired();
            entity.Property(e => e.Entidad).HasColumnName("entidad").IsRequired();
            entity.Property(e => e.RegistroId).HasColumnName("registro_id").IsRequired();
            entity.Property(e => e.ValoresAnteriores).HasColumnName("valores_anteriores").HasColumnType("jsonb");
            entity.Property(e => e.ValoresNuevos).HasColumnName("valores_nuevos").HasColumnType("jsonb");
            entity.Property(e => e.DireccionIp).HasColumnName("direccion_ip");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");

            entity.HasOne(e => e.Usuario)
                .WithMany(p => p.Auditorias)
                .HasForeignKey(e => e.UsuarioId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // 16. Alertas
        modelBuilder.Entity<Alerta>(entity =>
        {
            entity.ToTable("alertas");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Tipo).HasColumnName("tipo").HasColumnType("tipo_alerta").IsRequired();
            entity.Property(e => e.Severidad).HasColumnName("severidad").HasColumnType("severidad_alerta").IsRequired();
            entity.Property(e => e.RecursoId).HasColumnName("recurso_id");
            entity.Property(e => e.UbicacionId).HasColumnName("ubicacion_id");
            entity.Property(e => e.Titulo).HasColumnName("titulo").IsRequired();
            entity.Property(e => e.Mensaje).HasColumnName("mensaje").IsRequired();
            entity.Property(e => e.Leida).HasColumnName("leida");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");

            entity.HasOne(e => e.Recurso)
                .WithMany()
                .HasForeignKey(e => e.RecursoId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Ubicacion)
                .WithMany()
                .HasForeignKey(e => e.UbicacionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 17. Invitaciones
        modelBuilder.Entity<Invitacion>(entity =>
        {
            entity.ToTable("invitaciones");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Correo).HasColumnName("correo").IsRequired();
            entity.Property(e => e.Rol).HasColumnName("rol").HasColumnType("rol_usuario").IsRequired();
            entity.Property(e => e.InvitadoPor).HasColumnName("invitado_por");
            entity.Property(e => e.Estado).HasColumnName("estado").HasColumnType("estado_invitacion").IsRequired();
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
            entity.Property(e => e.UsadoEn).HasColumnName("usado_en");
        });
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Mecanismo central de auditoría automática (Prompt 4.3)
        var auditEntries = GenerarEntradasAuditoria();

        var result = await base.SaveChangesAsync(cancellationToken);

        if (auditEntries.Count > 0)
        {
            await BitacoraAuditorias.AddRangeAsync(auditEntries, cancellationToken);
            await base.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    private List<BitacoraAuditoria> GenerarEntradasAuditoria()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is not BitacoraAuditoria &&
                        (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted))
            .ToList();

        var auditList = new List<BitacoraAuditoria>();
        var userId = _currentUserService.UserId;
        var ip = _currentUserService.IpAddress;

        foreach (var entry in entries)
        {
            var entityName = entry.Entity.GetType().Name;
            var primaryKey = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue?.ToString() ?? "N/A";

            string accion = entry.State switch
            {
                EntityState.Added => "INSERT",
                EntityState.Modified => "UPDATE",
                EntityState.Deleted => "DELETE",
                _ => "UNKNOWN"
            };

            string? valoresAnteriores = null;
            string? valoresNuevos = null;

            if (entry.State == EntityState.Modified || entry.State == EntityState.Deleted)
            {
                var dictAntes = entry.Properties
                    .Where(p => entry.State == EntityState.Deleted || p.IsModified)
                    .ToDictionary(p => p.Metadata.Name, p => p.OriginalValue);
                valoresAnteriores = JsonSerializer.Serialize(dictAntes);
            }

            if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
            {
                var dictDespues = entry.Properties
                    .Where(p => entry.State == EntityState.Added || p.IsModified)
                    .ToDictionary(p => p.Metadata.Name, p => p.CurrentValue);
                valoresNuevos = JsonSerializer.Serialize(dictDespues);
            }

            auditList.Add(new BitacoraAuditoria
            {
                Id = Guid.NewGuid(),
                UsuarioId = userId,
                Origen = OrígenesAuditoria.Humano,
                Accion = accion,
                Entidad = entityName,
                RegistroId = primaryKey,
                ValoresAnteriores = valoresAnteriores,
                ValoresNuevos = valoresNuevos,
                DireccionIp = ip,
                CreadoEn = DateTime.UtcNow
            });
        }

        return auditList;
    }
}
