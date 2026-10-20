using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class UbicacionService : IUbicacionService
{
    private readonly IApplicationDbContext _context;

    public UbicacionService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<UbicacionDto>> ListarUbicacionesAsync(UbicacionFiltrosDto filtros, CancellationToken ct = default)
    {
        var query = _context.Ubicaciones
            .AsNoTracking()
            .Include(u => u.UbicacionPadre)
            .Include(u => u.Responsable)
            .Include(u => u.Sububicaciones)
            .Include(u => u.Existencias)
            .Include(u => u.Activos)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtros.Search))
        {
            var search = filtros.Search.Trim().ToLower();
            query = query.Where(u =>
                u.Nombre.ToLower().Contains(search) ||
                u.Codigo.ToLower().Contains(search) ||
                (u.Responsable != null && u.Responsable.NombreCompleto.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(filtros.Tipo))
        {
            query = query.Where(u => u.Tipo.ToLower() == filtros.Tipo.Trim().ToLower());
        }

        if (filtros.UbicacionPadreId.HasValue)
        {
            query = query.Where(u => u.UbicacionPadreId == filtros.UbicacionPadreId.Value);
        }

        if (filtros.SoloActivas.HasValue)
        {
            query = query.Where(u => u.Activa == filtros.SoloActivas.Value);
        }

        var totalCount = await query.CountAsync(ct);

        // Ordenamiento
        query = (filtros.SortBy?.ToLower(), filtros.IsDescending) switch
        {
            ("nombre", true) => query.OrderByDescending(u => u.Nombre),
            ("nombre", false) => query.OrderBy(u => u.Nombre),
            ("tipo", true) => query.OrderByDescending(u => u.Tipo),
            ("tipo", false) => query.OrderBy(u => u.Tipo),
            ("codigo", true) => query.OrderByDescending(u => u.Codigo),
            _ => query.OrderBy(u => u.Codigo)
        };

        var pageIndex = Math.Max(1, filtros.PageIndex);
        var pageSize = Math.Clamp(filtros.PageSize, 1, 100);

        var items = await query
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UbicacionDto
            {
                Id = u.Id,
                UbicacionPadreId = u.UbicacionPadreId,
                UbicacionPadreNombre = u.UbicacionPadre != null ? u.UbicacionPadre.Nombre : null,
                Codigo = u.Codigo,
                Nombre = u.Nombre,
                Tipo = u.Tipo,
                ResponsableId = u.ResponsableId,
                ResponsableNombre = u.Responsable != null ? u.Responsable.NombreCompleto : null,
                ResponsableCorreo = u.Responsable != null ? u.Responsable.Correo : null,
                Activa = u.Activa,
                TotalSububicaciones = u.Sububicaciones.Count,
                TotalExistencias = u.Existencias.Select(e => (int?)e.Cantidad).Sum() ?? 0,
                TotalActivosFisicos = u.Activos.Count,
                CreadoEn = u.CreadoEn,
                ActualizadoEn = u.ActualizadoEn
            })
            .ToListAsync(ct);

        return PagedResult<UbicacionDto>.Create(items, totalCount, pageIndex, pageSize);
    }

    public async Task<List<UbicacionNodoArbolDto>> ObtenerArbolJerarquicoAsync(bool? soloActivas = null, CancellationToken ct = default)
    {
        var query = _context.Ubicaciones
            .AsNoTracking()
            .Include(u => u.Responsable)
            .Include(u => u.Existencias)
            .Include(u => u.Activos)
            .AsQueryable();

        if (soloActivas.HasValue)
        {
            query = query.Where(u => u.Activa == soloActivas.Value);
        }

        var todas = await query.ToListAsync(ct);

        var nodosPorId = todas.ToDictionary(
            u => u.Id,
            u => new UbicacionNodoArbolDto
            {
                Id = u.Id,
                UbicacionPadreId = u.UbicacionPadreId,
                Codigo = u.Codigo,
                Nombre = u.Nombre,
                Tipo = u.Tipo,
                ResponsableNombre = u.Responsable?.NombreCompleto,
                Activa = u.Activa,
                TotalExistencias = u.Existencias.Select(e => (int?)e.Cantidad).Sum() ?? 0,
                TotalActivosFisicos = u.Activos.Count,
                Hijos = new List<UbicacionNodoArbolDto>()
            });

        var raices = new List<UbicacionNodoArbolDto>();

        foreach (var nodo in nodosPorId.Values)
        {
            if (nodo.UbicacionPadreId.HasValue && nodosPorId.TryGetValue(nodo.UbicacionPadreId.Value, out var padre))
            {
                padre.Hijos.Add(nodo);
            }
            else
            {
                raices.Add(nodo);
            }
        }

        // Ordenar nodos hijos recursivamente por código
        void OrdenarRecursivo(List<UbicacionNodoArbolDto> lista)
        {
            lista.Sort((a, b) => string.Compare(a.Codigo, b.Codigo, StringComparison.OrdinalIgnoreCase));
            foreach (var item in lista)
            {
                OrdenarRecursivo(item.Hijos);
            }
        }

        OrdenarRecursivo(raices);
        return raices;
    }

    public async Task<UbicacionDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default)
    {
        var u = await _context.Ubicaciones
            .AsNoTracking()
            .Include(u => u.UbicacionPadre)
            .Include(u => u.Responsable)
            .Include(u => u.Sububicaciones)
            .Include(u => u.Existencias)
            .Include(u => u.Activos)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (u == null) return null;

        return new UbicacionDto
        {
            Id = u.Id,
            UbicacionPadreId = u.UbicacionPadreId,
            UbicacionPadreNombre = u.UbicacionPadre?.Nombre,
            Codigo = u.Codigo,
            Nombre = u.Nombre,
            Tipo = u.Tipo,
            ResponsableId = u.ResponsableId,
            ResponsableNombre = u.Responsable?.NombreCompleto,
            ResponsableCorreo = u.Responsable?.Correo,
            Activa = u.Activa,
            TotalSububicaciones = u.Sububicaciones.Count,
            TotalExistencias = u.Existencias.Select(e => (int?)e.Cantidad).Sum() ?? 0,
            TotalActivosFisicos = u.Activos.Count,
            CreadoEn = u.CreadoEn,
            ActualizadoEn = u.ActualizadoEn
        };
    }

    public async Task<UbicacionDto> CrearUbicacionAsync(CrearUbicacionDto dto, CancellationToken ct = default)
    {
        var codigoLimpio = dto.Codigo.Trim().ToUpperInvariant();

        var codigoExiste = await _context.Ubicaciones
            .AnyAsync(u => u.Codigo == codigoLimpio, ct);

        if (codigoExiste)
        {
            throw new InvalidOperationException($"Ya existe una ubicación con el código '{codigoLimpio}'.");
        }

        if (dto.UbicacionPadreId.HasValue)
        {
            var padreExiste = await _context.Ubicaciones
                .AnyAsync(u => u.Id == dto.UbicacionPadreId.Value, ct);

            if (!padreExiste)
            {
                throw new InvalidOperationException("La ubicación padre especificada no existe.");
            }
        }

        if (dto.ResponsableId.HasValue)
        {
            var respExiste = await _context.Perfiles
                .AnyAsync(p => p.Id == dto.ResponsableId.Value, ct);

            if (!respExiste)
            {
                throw new InvalidOperationException("El responsable institucional asignado no existe.");
            }
        }

        var ubicacion = new Ubicacion
        {
            Id = Guid.NewGuid(),
            UbicacionPadreId = dto.UbicacionPadreId,
            Codigo = codigoLimpio,
            Nombre = dto.Nombre.Trim(),
            Tipo = dto.Tipo.Trim().ToLowerInvariant(),
            ResponsableId = dto.ResponsableId,
            Activa = dto.Activa,
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };

        _context.Ubicaciones.Add(ubicacion);
        await _context.SaveChangesAsync(ct);

        return (await ObtenerPorIdAsync(ubicacion.Id, ct))!;
    }

    public async Task<UbicacionDto> ActualizarUbicacionAsync(Guid id, ActualizarUbicacionDto dto, CancellationToken ct = default)
    {
        var ubicacion = await _context.Ubicaciones
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (ubicacion == null)
        {
            throw new KeyNotFoundException($"No se encontró la ubicación con ID '{id}'.");
        }

        var codigoLimpio = dto.Codigo.Trim().ToUpperInvariant();

        var codigoEnUso = await _context.Ubicaciones
            .AnyAsync(u => u.Codigo == codigoLimpio && u.Id != id, ct);

        if (codigoEnUso)
        {
            throw new InvalidOperationException($"Ya existe otra ubicación con el código '{codigoLimpio}'.");
        }

        if (dto.UbicacionPadreId.HasValue)
        {
            if (dto.UbicacionPadreId.Value == id)
            {
                throw new InvalidOperationException("Una ubicación no puede ser su propia ubicación padre.");
            }

            var padreExiste = await _context.Ubicaciones
                .AnyAsync(u => u.Id == dto.UbicacionPadreId.Value, ct);

            if (!padreExiste)
            {
                throw new InvalidOperationException("La ubicación padre especificada no existe.");
            }
        }

        if (dto.ResponsableId.HasValue)
        {
            var respExiste = await _context.Perfiles
                .AnyAsync(p => p.Id == dto.ResponsableId.Value, ct);

            if (!respExiste)
            {
                throw new InvalidOperationException("El responsable institucional asignado no existe.");
            }
        }

        ubicacion.UbicacionPadreId = dto.UbicacionPadreId;
        ubicacion.Codigo = codigoLimpio;
        ubicacion.Nombre = dto.Nombre.Trim();
        ubicacion.Tipo = dto.Tipo.Trim().ToLowerInvariant();
        ubicacion.ResponsableId = dto.ResponsableId;
        ubicacion.Activa = dto.Activa;
        ubicacion.ActualizadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return (await ObtenerPorIdAsync(id, ct))!;
    }

    public async Task CambiarEstadoAsync(Guid id, bool activa, CancellationToken ct = default)
    {
        var ubicacion = await _context.Ubicaciones
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (ubicacion == null)
        {
            throw new KeyNotFoundException($"No se encontró la ubicación con ID '{id}'.");
        }

        ubicacion.Activa = activa;
        ubicacion.ActualizadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
    }

    public async Task EliminarUbicacionAsync(Guid id, CancellationToken ct = default)
    {
        var ubicacion = await _context.Ubicaciones
            .Include(u => u.Sububicaciones)
            .Include(u => u.Existencias)
            .Include(u => u.Activos)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (ubicacion == null)
        {
            throw new KeyNotFoundException($"No se encontró la ubicación con ID '{id}'.");
        }

        // Regla: No eliminar ubicaciones que tengan existencias activas o recursos asignados
        var totalExistencias = ubicacion.Existencias.Sum(e => e.Cantidad);
        if (totalExistencias > 0)
        {
            throw new InvalidOperationException(
                $"No es posible eliminar la ubicación '{ubicacion.Nombre}' ({ubicacion.Codigo}) porque posee {totalExistencias} existencias registradas. Puede desactivarla para mantener la trazabilidad histórica.");
        }

        if (ubicacion.Activos.Count > 0)
        {
            throw new InvalidOperationException(
                $"No es posible eliminar la ubicación '{ubicacion.Nombre}' ({ubicacion.Codigo}) porque tiene {ubicacion.Activos.Count} equipo(s) o activo(s) asignado(s). Debe reasignarlos o desactivar la ubicación.");
        }

        if (ubicacion.Sububicaciones.Count > 0)
        {
            throw new InvalidOperationException(
                $"No es posible eliminar la ubicación '{ubicacion.Nombre}' ({ubicacion.Codigo}) porque contiene {ubicacion.Sububicaciones.Count} sububicación(es) subordinada(s).");
        }

        _context.Ubicaciones.Remove(ubicacion);
        await _context.SaveChangesAsync(ct);
    }
}
