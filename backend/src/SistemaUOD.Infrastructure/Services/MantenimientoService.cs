using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class MantenimientoService : IMantenimientoService
{
    private readonly IApplicationDbContext _context;

    public MantenimientoService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<MantenimientoDto>> ListarAsync(MantenimientoFiltrosDto filtros, CancellationToken ct = default)
    {
        var query = _context.Mantenimientos
            .AsNoTracking()
            .Include(m => m.ActivoSerie)
                .ThenInclude(a => a.Recurso)
                    .ThenInclude(r => r.Categoria)
            .Include(m => m.ActivoSerie)
                .ThenInclude(a => a.Ubicacion)
            .Include(m => m.Proveedor)
            .AsQueryable();

        if (filtros.ActivoSerieId.HasValue)
        {
            query = query.Where(m => m.ActivoSerieId == filtros.ActivoSerieId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filtros.PlacaInstitucional))
        {
            var placaNorm = filtros.PlacaInstitucional.Trim().ToUpper();
            query = query.Where(m => m.ActivoSerie.PlacaInstitucional != null && m.ActivoSerie.PlacaInstitucional.ToUpper() == placaNorm);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Tipo))
        {
            var tipoNorm = filtros.Tipo.Trim().ToLower();
            query = query.Where(m => m.Tipo.ToLower() == tipoNorm);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Estado))
        {
            var estadoNorm = filtros.Estado.Trim().ToLower();
            query = query.Where(m => m.Estado.ToLower() == estadoNorm);
        }

        if (filtros.ProveedorId.HasValue)
        {
            query = query.Where(m => m.ProveedorId == filtros.ProveedorId.Value);
        }

        if (filtros.FechaDesde.HasValue)
        {
            query = query.Where(m => m.FechaProgramada >= filtros.FechaDesde.Value);
        }

        if (filtros.FechaHasta.HasValue)
        {
            query = query.Where(m => m.FechaProgramada <= filtros.FechaHasta.Value);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Search))
        {
            var term = filtros.Search.Trim().ToLower();
            query = query.Where(m =>
                (m.ActivoSerie.PlacaInstitucional != null && m.ActivoSerie.PlacaInstitucional.ToLower().Contains(term)) ||
                m.ActivoSerie.NumeroSerie.ToLower().Contains(term) ||
                m.ActivoSerie.Recurso.Nombre.ToLower().Contains(term) ||
                m.Descripcion.ToLower().Contains(term) ||
                (m.TecnicoResponsable != null && m.TecnicoResponsable.ToLower().Contains(term)));
        }

        var total = await query.CountAsync(ct);

        var entities = await query
            .OrderByDescending(m => m.FechaProgramada)
            .ThenByDescending(m => m.CreadoEn)
            .Skip((filtros.PageIndex - 1) * filtros.PageSize)
            .Take(filtros.PageSize)
            .ToListAsync(ct);

        var items = entities.Select(m => MapearDto(m)).ToList();

        return new PagedResult<MantenimientoDto>
        {
            Items = items,
            TotalCount = total,
            PageIndex = filtros.PageIndex,
            PageSize = filtros.PageSize
        };
    }

    public async Task<MantenimientoDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default)
    {
        var m = await _context.Mantenimientos
            .AsNoTracking()
            .Include(x => x.ActivoSerie)
                .ThenInclude(a => a.Recurso)
                    .ThenInclude(r => r.Categoria)
            .Include(x => x.ActivoSerie)
                .ThenInclude(a => a.Ubicacion)
            .Include(x => x.Proveedor)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        return m == null ? null : MapearDto(m);
    }

    public async Task<List<MantenimientoDto>> ListarPorActivoAsync(Guid activoSerieId, CancellationToken ct = default)
    {
        var entities = await _context.Mantenimientos
            .AsNoTracking()
            .Include(x => x.ActivoSerie)
                .ThenInclude(a => a.Recurso)
                    .ThenInclude(r => r.Categoria)
            .Include(x => x.ActivoSerie)
                .ThenInclude(a => a.Ubicacion)
            .Include(x => x.Proveedor)
            .Where(x => x.ActivoSerieId == activoSerieId)
            .OrderByDescending(x => x.FechaProgramada)
            .ToListAsync(ct);

        return entities.Select(x => MapearDto(x)).ToList();
    }

    public async Task<ResumenMantenimientosActivoDto> ObtenerResumenPorActivoAsync(Guid activoSerieId, CancellationToken ct = default)
    {
        var activo = await _context.ActivosSerie
            .AsNoTracking()
            .Include(a => a.Recurso)
            .FirstOrDefaultAsync(a => a.Id == activoSerieId, ct);

        if (activo == null)
            throw new KeyNotFoundException($"El activo con ID {activoSerieId} no existe.");

        var servicios = await ListarPorActivoAsync(activoSerieId, ct);

        return new ResumenMantenimientosActivoDto
        {
            ActivoSerieId = activo.Id,
            PlacaInstitucional = activo.PlacaInstitucional ?? "SIN-PLACA",
            RecursoNombre = activo.Recurso.Nombre,
            TotalMantenimientos = servicios.Count,
            TotalPreventivos = servicios.Count(s => s.Tipo == "preventivo"),
            TotalCorrectivos = servicios.Count(s => s.Tipo == "correctivo"),
            TotalCalibraciones = servicios.Count(s => s.Tipo == "calibracion"),
            CostoTotalInvertidoDop = servicios.Sum(s => s.Costo),
            UltimoMantenimientoFecha = servicios.Where(s => s.FechaRealizada.HasValue).Max(s => s.FechaRealizada),
            ProximoMantenimientoProgramado = servicios
                .Where(s => s.Estado == "programado" && s.FechaProgramada >= DateTime.UtcNow.Date)
                .OrderBy(s => s.FechaProgramada)
                .Select(s => (DateTime?)s.FechaProgramada)
                .FirstOrDefault(),
            UltimosServicios = servicios.Take(5).ToList()
        };
    }

    public async Task<MantenimientoDto> RegistrarAsync(
        CrearMantenimientoDto dto,
        Guid usuarioId,
        string? direccionIp = null,
        CancellationToken ct = default)
    {
        var activo = await _context.ActivosSerie
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .FirstOrDefaultAsync(a => a.Id == dto.ActivoSerieId, ct);

        if (activo == null)
            throw new KeyNotFoundException($"El activo fijo con ID {dto.ActivoSerieId} no existe.");

        if (activo.Estado == "dado_de_baja")
            throw new InvalidOperationException("No se pueden programar mantenimientos para un equipo dado de baja.");

        if (dto.ProveedorId.HasValue)
        {
            var existeProveedor = await _context.Proveedores.AnyAsync(p => p.Id == dto.ProveedorId.Value && p.Activo, ct);
            if (!existeProveedor)
                throw new InvalidOperationException($"El proveedor especificado no existe o está inactivo.");
        }

        var mantenimiento = new Mantenimiento
        {
            Id = Guid.NewGuid(),
            ActivoSerieId = dto.ActivoSerieId,
            Tipo = dto.Tipo.ToLower(),
            ProveedorId = dto.ProveedorId,
            TecnicoResponsable = dto.TecnicoResponsable?.Trim() ?? string.Empty,
            Costo = dto.Costo,
            Descripcion = dto.Descripcion.Trim(),
            FechaProgramada = dto.FechaProgramada,
            Estado = "programado",
            ChecklistCompletado = "[]",
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };

        // Si se indicó cambiar estado del activo o si es correctivo urgente
        if (dto.CambiarEstadoActivoAEnMantenimiento || dto.Tipo.ToLower() == "correctivo")
        {
            activo.Estado = "en_mantenimiento";
            activo.ActualizadoEn = DateTime.UtcNow;
        }

        _context.Mantenimientos.Add(mantenimiento);

        // Registro de Auditoría (Ley 172-13)
        _context.BitacoraAuditorias.Add(new BitacoraAuditoria
        {
            Id = Guid.NewGuid(),
            UsuarioId = await ValidarUsuarioAuditIdAsync(usuarioId, ct),
            Origen = "humano",
            Accion = "CREAR_MANTENIMIENTO",
            Entidad = "Mantenimiento",
            RegistroId = mantenimiento.Id.ToString(),
            ValoresNuevos = JsonSerializer.Serialize(new
            {
                mantenimiento.Id,
                mantenimiento.ActivoSerieId,
                ActivoPlaca = activo.PlacaInstitucional,
                mantenimiento.Tipo,
                mantenimiento.Costo,
                mantenimiento.Descripcion,
                mantenimiento.FechaProgramada,
                mantenimiento.Estado,
                EstadoActivoResultante = activo.Estado
            }),
            DireccionIp = direccionIp,
            CreadoEn = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);

        return await ObtenerPorIdAsync(mantenimiento.Id, ct)
               ?? throw new InvalidOperationException("No se pudo cargar el mantenimiento recién registrado.");
    }

    public async Task<MantenimientoDto> ActualizarAsync(
        Guid id,
        ActualizarMantenimientoDto dto,
        Guid usuarioId,
        string? direccionIp = null,
        CancellationToken ct = default)
    {
        var mantenimiento = await _context.Mantenimientos
            .Include(m => m.ActivoSerie)
            .FirstOrDefaultAsync(m => m.Id == id, ct);

        if (mantenimiento == null)
            throw new KeyNotFoundException($"El mantenimiento con ID {id} no existe.");

        if (dto.ProveedorId.HasValue)
        {
            var existeProveedor = await _context.Proveedores.AnyAsync(p => p.Id == dto.ProveedorId.Value && p.Activo, ct);
            if (!existeProveedor)
                throw new InvalidOperationException($"El proveedor especificado no existe o está inactivo.");
        }

        var valoresAnteriores = JsonSerializer.Serialize(new
        {
            mantenimiento.Tipo,
            mantenimiento.TecnicoResponsable,
            mantenimiento.Costo,
            mantenimiento.Descripcion,
            mantenimiento.FechaProgramada,
            mantenimiento.FechaRealizada,
            mantenimiento.Estado
        });

        mantenimiento.Tipo = dto.Tipo.ToLower();
        mantenimiento.ProveedorId = dto.ProveedorId;
        mantenimiento.TecnicoResponsable = dto.TecnicoResponsable?.Trim() ?? string.Empty;
        mantenimiento.Costo = dto.Costo;
        mantenimiento.Descripcion = dto.Descripcion.Trim();
        mantenimiento.FechaProgramada = dto.FechaProgramada;
        mantenimiento.FechaRealizada = dto.FechaRealizada;
        mantenimiento.Estado = dto.Estado.ToLower();
        mantenimiento.ActualizadoEn = DateTime.UtcNow;

        _context.BitacoraAuditorias.Add(new BitacoraAuditoria
        {
            Id = Guid.NewGuid(),
            UsuarioId = await ValidarUsuarioAuditIdAsync(usuarioId, ct),
            Origen = "humano",
            Accion = "ACTUALIZAR_MANTENIMIENTO",
            Entidad = "Mantenimiento",
            RegistroId = mantenimiento.Id.ToString(),
            ValoresAnteriores = valoresAnteriores,
            ValoresNuevos = JsonSerializer.Serialize(new
            {
                mantenimiento.Tipo,
                mantenimiento.TecnicoResponsable,
                mantenimiento.Costo,
                mantenimiento.Descripcion,
                mantenimiento.FechaProgramada,
                mantenimiento.FechaRealizada,
                mantenimiento.Estado
            }),
            DireccionIp = direccionIp,
            CreadoEn = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);

        return await ObtenerPorIdAsync(mantenimiento.Id, ct)
               ?? throw new InvalidOperationException("No se pudo cargar el mantenimiento actualizado.");
    }

    public async Task<MantenimientoDto> CompletarAsync(
        Guid id,
        CompletarMantenimientoDto dto,
        Guid usuarioId,
        string? direccionIp = null,
        CancellationToken ct = default)
    {
        var mantenimiento = await _context.Mantenimientos
            .Include(m => m.ActivoSerie)
            .FirstOrDefaultAsync(m => m.Id == id, ct);

        if (mantenimiento == null)
            throw new KeyNotFoundException($"El mantenimiento con ID {id} no existe.");

        if (mantenimiento.Estado == "completado")
            throw new InvalidOperationException("El mantenimiento ya se encuentra marcado como completado.");

        if (mantenimiento.Estado == "cancelado")
            throw new InvalidOperationException("No se puede completar un mantenimiento que ha sido cancelado.");

        mantenimiento.Estado = "completado";
        mantenimiento.FechaRealizada = dto.FechaRealizada;
        mantenimiento.Costo = dto.CostoFinal;
        mantenimiento.ActualizadoEn = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(dto.TecnicoResponsable))
            mantenimiento.TecnicoResponsable = dto.TecnicoResponsable.Trim();

        if (!string.IsNullOrWhiteSpace(dto.ObservacionesFinales))
        {
            mantenimiento.Descripcion = $"{mantenimiento.Descripcion} | Cierre: {dto.ObservacionesFinales.Trim()}";
        }

        // Restablecer el activo a disponible o en_uso según corresponda
        var activo = mantenimiento.ActivoSerie;
        if (activo != null && activo.Estado == "en_mantenimiento")
        {
            activo.Estado = dto.EstadoFinalActivo == "en_uso" ? "en_uso" : "disponible";
            activo.ActualizadoEn = DateTime.UtcNow;
        }

        _context.BitacoraAuditorias.Add(new BitacoraAuditoria
        {
            Id = Guid.NewGuid(),
            UsuarioId = await ValidarUsuarioAuditIdAsync(usuarioId, ct),
            Origen = "humano",
            Accion = "COMPLETAR_MANTENIMIENTO",
            Entidad = "Mantenimiento",
            RegistroId = mantenimiento.Id.ToString(),
            ValoresNuevos = JsonSerializer.Serialize(new
            {
                mantenimiento.Id,
                mantenimiento.Estado,
                mantenimiento.FechaRealizada,
                mantenimiento.Costo,
                mantenimiento.TecnicoResponsable,
                ActivoId = activo?.Id,
                ActivoEstadoResultante = activo?.Estado
            }),
            DireccionIp = direccionIp,
            CreadoEn = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);

        return await ObtenerPorIdAsync(mantenimiento.Id, ct)
               ?? throw new InvalidOperationException("No se pudo cargar el mantenimiento completado.");
    }

    public async Task<MantenimientoDto> CancelarAsync(
        Guid id,
        CancelarMantenimientoDto dto,
        Guid usuarioId,
        string? direccionIp = null,
        CancellationToken ct = default)
    {
        var mantenimiento = await _context.Mantenimientos
            .Include(m => m.ActivoSerie)
            .FirstOrDefaultAsync(m => m.Id == id, ct);

        if (mantenimiento == null)
            throw new KeyNotFoundException($"El mantenimiento con ID {id} no existe.");

        if (mantenimiento.Estado == "completado")
            throw new InvalidOperationException("No se puede cancelar un mantenimiento que ya fue completado.");

        mantenimiento.Estado = "cancelado";
        mantenimiento.ActualizadoEn = DateTime.UtcNow;
        mantenimiento.Descripcion = $"{mantenimiento.Descripcion} | Cancelado: {dto.Motivo.Trim()}";

        // Si el activo estaba en mantenimiento y se cancela, devolver a su estado anterior o disponible
        var activo = mantenimiento.ActivoSerie;
        if (activo != null && activo.Estado == "en_mantenimiento")
        {
            activo.Estado = activo.ResponsableId.HasValue ? "en_uso" : "disponible";
            activo.ActualizadoEn = DateTime.UtcNow;
        }

        _context.BitacoraAuditorias.Add(new BitacoraAuditoria
        {
            Id = Guid.NewGuid(),
            UsuarioId = await ValidarUsuarioAuditIdAsync(usuarioId, ct),
            Origen = "humano",
            Accion = "CANCELAR_MANTENIMIENTO",
            Entidad = "Mantenimiento",
            RegistroId = mantenimiento.Id.ToString(),
            ValoresNuevos = JsonSerializer.Serialize(new
            {
                mantenimiento.Id,
                mantenimiento.Estado,
                dto.Motivo,
                ActivoId = activo?.Id,
                ActivoEstadoResultante = activo?.Estado
            }),
            DireccionIp = direccionIp,
            CreadoEn = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);

        return await ObtenerPorIdAsync(mantenimiento.Id, ct)
               ?? throw new InvalidOperationException("No se pudo cargar el mantenimiento cancelado.");
    }

    private async Task<Guid?> ValidarUsuarioAuditIdAsync(Guid usuarioId, CancellationToken ct)
    {
        if (usuarioId == Guid.Empty || usuarioId == Guid.Parse("00000000-0000-0000-0000-000000000001"))
            return null;

        var existe = await _context.Perfiles.AnyAsync(p => p.Id == usuarioId, ct);
        return existe ? usuarioId : null;
    }

    private static MantenimientoDto MapearDto(Mantenimiento m)
    {
        return new MantenimientoDto
        {
            Id = m.Id,
            ActivoSerieId = m.ActivoSerieId,
            PlacaInstitucional = m.ActivoSerie?.PlacaInstitucional ?? "SIN-PLACA",
            NumeroSerie = m.ActivoSerie?.NumeroSerie ?? string.Empty,
            RecursoNombre = m.ActivoSerie?.Recurso?.Nombre ?? string.Empty,
            CategoriaNombre = m.ActivoSerie?.Recurso?.Categoria?.Nombre ?? string.Empty,
            UbicacionNombre = m.ActivoSerie?.Ubicacion?.Nombre ?? string.Empty,
            Tipo = m.Tipo,
            ProveedorId = m.ProveedorId,
            ProveedorNombre = m.Proveedor?.NombreComercial,
            TecnicoResponsable = m.TecnicoResponsable,
            Costo = m.Costo,
            Descripcion = m.Descripcion,
            FechaProgramada = m.FechaProgramada,
            FechaRealizada = m.FechaRealizada,
            Estado = m.Estado,
            CreadoEn = m.CreadoEn
        };
    }
}
