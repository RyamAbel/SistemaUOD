using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class ActivoService : IActivoService
{
    private readonly IApplicationDbContext _context;

    public ActivoService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ActivoSerieDto>> ListarActivosAsync(ActivoFiltrosDto filtros, CancellationToken ct = default)
    {
        var query = _context.ActivosSerie
            .AsNoTracking()
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .Include(a => a.Proveedor)
            .AsQueryable();

        // 1. Búsqueda por texto (placa, serie, recurso, custodio, notas)
        if (!string.IsNullOrWhiteSpace(filtros.Search))
        {
            var search = filtros.Search.Trim().ToLower();
            query = query.Where(a =>
                (a.PlacaInstitucional != null && a.PlacaInstitucional.ToLower().Contains(search)) ||
                a.NumeroSerie.ToLower().Contains(search) ||
                a.Recurso.Nombre.ToLower().Contains(search) ||
                (a.Responsable != null && a.Responsable.NombreCompleto.ToLower().Contains(search)) ||
                a.Ubicacion.Nombre.ToLower().Contains(search) ||
                (a.Notas != null && a.Notas.ToLower().Contains(search)));
        }

        // 2. Filtro por Recurso
        if (filtros.RecursoId.HasValue)
        {
            query = query.Where(a => a.RecursoId == filtros.RecursoId.Value);
        }

        // 3. Filtro por Categoría
        if (filtros.CategoriaId.HasValue)
        {
            query = query.Where(a => a.Recurso.CategoriaId == filtros.CategoriaId.Value);
        }

        // 4. Filtro por Ubicación
        if (filtros.UbicacionId.HasValue)
        {
            query = query.Where(a => a.UbicacionId == filtros.UbicacionId.Value);
        }

        // 5. Filtro por Responsable / Custodio
        if (filtros.ResponsableId.HasValue)
        {
            query = query.Where(a => a.ResponsableId == filtros.ResponsableId.Value);
        }

        // 6. Filtro por Estado
        if (!string.IsNullOrWhiteSpace(filtros.Estado))
        {
            var estadoNormalizado = filtros.Estado.Trim().ToLower();
            query = query.Where(a => a.Estado.ToLower() == estadoNormalizado);
        }

        // 7. Filtro por Placa exacta
        if (!string.IsNullOrWhiteSpace(filtros.PlacaInstitucional))
        {
            var placaNormalizada = filtros.PlacaInstitucional.Trim().ToUpper();
            query = query.Where(a => a.PlacaInstitucional != null && a.PlacaInstitucional.ToUpper() == placaNormalizada);
        }

        // Ordenación
        query = (filtros.SortBy?.ToLower()) switch
        {
            "placa" => filtros.IsDescending ? query.OrderByDescending(a => a.PlacaInstitucional) : query.OrderBy(a => a.PlacaInstitucional),
            "serie" => filtros.IsDescending ? query.OrderByDescending(a => a.NumeroSerie) : query.OrderBy(a => a.NumeroSerie),
            "recurso" => filtros.IsDescending ? query.OrderByDescending(a => a.Recurso.Nombre) : query.OrderBy(a => a.Recurso.Nombre),
            "ubicacion" => filtros.IsDescending ? query.OrderByDescending(a => a.Ubicacion.Nombre) : query.OrderBy(a => a.Ubicacion.Nombre),
            "estado" => filtros.IsDescending ? query.OrderByDescending(a => a.Estado) : query.OrderBy(a => a.Estado),
            "creadoen" => filtros.IsDescending ? query.OrderByDescending(a => a.CreadoEn) : query.OrderBy(a => a.CreadoEn),
            _ => filtros.IsDescending ? query.OrderByDescending(a => a.PlacaInstitucional ?? a.NumeroSerie) : query.OrderBy(a => a.PlacaInstitucional ?? a.NumeroSerie)
        };

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((filtros.PageIndex - 1) * filtros.PageSize)
            .Take(filtros.PageSize)
            .Select(a => new ActivoSerieDto
            {
                Id = a.Id,
                RecursoId = a.RecursoId,
                RecursoSku = a.Recurso.Sku,
                RecursoNombre = a.Recurso.Nombre,
                CategoriaId = a.Recurso.CategoriaId,
                CategoriaNombre = a.Recurso.Categoria.Nombre,
                NumeroSerie = a.NumeroSerie,
                PlacaInstitucional = a.PlacaInstitucional,
                Estado = a.Estado,
                UbicacionId = a.UbicacionId,
                UbicacionNombre = a.Ubicacion.Nombre,
                ResponsableId = a.ResponsableId,
                ResponsableNombre = a.Responsable != null ? a.Responsable.NombreCompleto : null,
                ResponsableCorreo = a.Responsable != null ? a.Responsable.Correo : null,
                ProveedorId = a.ProveedorId,
                ProveedorNombre = a.Proveedor != null ? a.Proveedor.NombreComercial : null,
                FechaAdquisicion = a.FechaAdquisicion,
                GarantiaVence = a.GarantiaVence,
                CostoEstimado = a.Recurso.CostoEstimado,
                Notas = a.Notas,
                CreadoEn = a.CreadoEn,
                ActualizadoEn = a.ActualizadoEn
            })
            .ToListAsync(ct);

        return PagedResult<ActivoSerieDto>.Create(items, totalCount, filtros.PageIndex, filtros.PageSize);
    }

    public async Task<ActivoSerieDetalleDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default)
    {
        var activo = await _context.ActivosSerie
            .AsNoTracking()
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .Include(a => a.Proveedor)
            .Include(a => a.Asignaciones)
                .ThenInclude(asig => asig.Custodio)
            .Include(a => a.Mantenimientos)
                .ThenInclude(m => m.Proveedor)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (activo == null) return null;

        return MapearDetalle(activo);
    }

    public async Task<ActivoSerieDetalleDto?> ObtenerPorPlacaAsync(string placa, CancellationToken ct = default)
    {
        var placaNormalizada = placa.Trim().ToUpper();

        var activo = await _context.ActivosSerie
            .AsNoTracking()
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .Include(a => a.Proveedor)
            .Include(a => a.Asignaciones)
                .ThenInclude(asig => asig.Custodio)
            .Include(a => a.Mantenimientos)
                .ThenInclude(m => m.Proveedor)
            .FirstOrDefaultAsync(a => a.PlacaInstitucional != null && a.PlacaInstitucional.ToUpper() == placaNormalizada, ct);

        if (activo == null) return null;

        return MapearDetalle(activo);
    }

    public async Task<ActivoSerieDto> CrearActivoAsync(CrearActivoSerieDto dto, CancellationToken ct = default)
    {
        // 1. Validar que el recurso exista
        var recurso = await _context.Recursos
            .Include(r => r.Categoria)
            .FirstOrDefaultAsync(r => r.Id == dto.RecursoId, ct);

        if (recurso == null)
        {
            throw new InvalidOperationException("El recurso tecnológico especificado no existe.");
        }

        // 2. Validar que la ubicación inicial exista
        var ubicacion = await _context.Ubicaciones
            .FirstOrDefaultAsync(u => u.Id == dto.UbicacionId, ct);

        if (ubicacion == null)
        {
            throw new InvalidOperationException("La ubicación física inicial especificada no existe.");
        }

        // 3. Validar unicidad de placa institucional si fue provista
        string? placaLimpia = null;
        if (!string.IsNullOrWhiteSpace(dto.PlacaInstitucional))
        {
            placaLimpia = dto.PlacaInstitucional.Trim().ToUpper();
            var placaExiste = await _context.ActivosSerie
                .AnyAsync(a => a.PlacaInstitucional != null && a.PlacaInstitucional.ToUpper() == placaLimpia, ct);

            if (placaExiste)
            {
                throw new InvalidOperationException($"Ya existe un activo registrado con la placa institucional '{placaLimpia}'.");
            }
        }

        // 4. Validar custodio si fue provisto
        if (dto.ResponsableId.HasValue)
        {
            var responsableExiste = await _context.Perfiles.AnyAsync(p => p.Id == dto.ResponsableId.Value, ct);
            if (!responsableExiste)
            {
                throw new InvalidOperationException("El responsable o custodio asignado no existe en el sistema.");
            }
        }

        // 5. Validar proveedor si fue provisto
        if (dto.ProveedorId.HasValue)
        {
            var proveedorExiste = await _context.Proveedores.AnyAsync(p => p.Id == dto.ProveedorId.Value, ct);
            if (!proveedorExiste)
            {
                throw new InvalidOperationException("El proveedor especificado no existe en el sistema.");
            }
        }

        var nuevoActivo = new ActivoSerie
        {
            Id = Guid.NewGuid(),
            RecursoId = dto.RecursoId,
            NumeroSerie = dto.NumeroSerie.Trim(),
            PlacaInstitucional = placaLimpia,
            Estado = string.IsNullOrWhiteSpace(dto.Estado) ? "disponible" : dto.Estado.Trim().ToLower(),
            UbicacionId = dto.UbicacionId,
            ResponsableId = dto.ResponsableId,
            ProveedorId = dto.ProveedorId,
            FechaAdquisicion = dto.FechaAdquisicion,
            GarantiaVence = dto.GarantiaVence,
            Notas = dto.Notas?.Trim(),
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };

        _context.ActivosSerie.Add(nuevoActivo);
        await _context.SaveChangesAsync(ct);

        return new ActivoSerieDto
        {
            Id = nuevoActivo.Id,
            RecursoId = nuevoActivo.RecursoId,
            RecursoSku = recurso.Sku,
            RecursoNombre = recurso.Nombre,
            CategoriaId = recurso.CategoriaId,
            CategoriaNombre = recurso.Categoria.Nombre,
            NumeroSerie = nuevoActivo.NumeroSerie,
            PlacaInstitucional = nuevoActivo.PlacaInstitucional,
            Estado = nuevoActivo.Estado,
            UbicacionId = nuevoActivo.UbicacionId,
            UbicacionNombre = ubicacion.Nombre,
            ResponsableId = nuevoActivo.ResponsableId,
            ProveedorId = nuevoActivo.ProveedorId,
            FechaAdquisicion = nuevoActivo.FechaAdquisicion,
            GarantiaVence = nuevoActivo.GarantiaVence,
            CostoEstimado = recurso.CostoEstimado,
            Notas = nuevoActivo.Notas,
            CreadoEn = nuevoActivo.CreadoEn,
            ActualizadoEn = nuevoActivo.ActualizadoEn
        };
    }

    public async Task<ActivoSerieDto> ActualizarActivoAsync(Guid id, ActualizarActivoSerieDto dto, CancellationToken ct = default)
    {
        var activo = await _context.ActivosSerie
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .Include(a => a.Proveedor)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (activo == null)
        {
            throw new KeyNotFoundException($"El activo con ID '{id}' no fue encontrado.");
        }

        // Validar unicidad de placa institucional
        string? placaLimpia = null;
        if (!string.IsNullOrWhiteSpace(dto.PlacaInstitucional))
        {
            placaLimpia = dto.PlacaInstitucional.Trim().ToUpper();
            var placaExiste = await _context.ActivosSerie
                .AnyAsync(a => a.Id != id && a.PlacaInstitucional != null && a.PlacaInstitucional.ToUpper() == placaLimpia, ct);

            if (placaExiste)
            {
                throw new InvalidOperationException($"Ya existe otro activo registrado con la placa institucional '{placaLimpia}'.");
            }
        }

        // Validar ubicación
        var ubicacion = await _context.Ubicaciones.FirstOrDefaultAsync(u => u.Id == dto.UbicacionId, ct);
        if (ubicacion == null)
        {
            throw new InvalidOperationException("La ubicación física especificada no existe.");
        }

        activo.NumeroSerie = dto.NumeroSerie.Trim();
        activo.PlacaInstitucional = placaLimpia;
        activo.Estado = dto.Estado.Trim().ToLower();
        activo.UbicacionId = dto.UbicacionId;
        activo.ResponsableId = dto.ResponsableId;
        activo.ProveedorId = dto.ProveedorId;
        activo.FechaAdquisicion = dto.FechaAdquisicion;
        activo.GarantiaVence = dto.GarantiaVence;
        activo.Notas = dto.Notas?.Trim();
        activo.ActualizadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return new ActivoSerieDto
        {
            Id = activo.Id,
            RecursoId = activo.RecursoId,
            RecursoSku = activo.Recurso.Sku,
            RecursoNombre = activo.Recurso.Nombre,
            CategoriaId = activo.Recurso.CategoriaId,
            CategoriaNombre = activo.Recurso.Categoria.Nombre,
            NumeroSerie = activo.NumeroSerie,
            PlacaInstitucional = activo.PlacaInstitucional,
            Estado = activo.Estado,
            UbicacionId = activo.UbicacionId,
            UbicacionNombre = ubicacion.Nombre,
            ResponsableId = activo.ResponsableId,
            ResponsableNombre = activo.Responsable?.NombreCompleto,
            ResponsableCorreo = activo.Responsable?.Correo,
            ProveedorId = activo.ProveedorId,
            ProveedorNombre = activo.Proveedor?.NombreComercial,
            FechaAdquisicion = activo.FechaAdquisicion,
            GarantiaVence = activo.GarantiaVence,
            CostoEstimado = activo.Recurso.CostoEstimado,
            Notas = activo.Notas,
            CreadoEn = activo.CreadoEn,
            ActualizadoEn = activo.ActualizadoEn
        };
    }

    public async Task<ActivoSerieDto> CambiarEstadoAsync(Guid id, CambiarEstadoActivoDto dto, CancellationToken ct = default)
    {
        var activo = await _context.ActivosSerie
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .Include(a => a.Proveedor)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (activo == null)
        {
            throw new KeyNotFoundException($"El activo con ID '{id}' no fue encontrado.");
        }

        var estadoLimpio = dto.Estado.Trim().ToLower();
        var estadosValidos = new[] { "disponible", "en_uso", "en_mantenimiento", "danado", "baja" };
        if (!estadosValidos.Contains(estadoLimpio))
        {
            throw new InvalidOperationException($"El estado '{dto.Estado}' no es válido. Estados permitidos: {string.Join(", ", estadosValidos)}.");
        }

        activo.Estado = estadoLimpio;
        if (!string.IsNullOrWhiteSpace(dto.Motivo))
        {
            activo.Notas = string.IsNullOrWhiteSpace(activo.Notas)
                ? $"[{DateTime.UtcNow:yyyy-MM-dd}] Cambio a {estadoLimpio}: {dto.Motivo}"
                : $"{activo.Notas} | [{DateTime.UtcNow:yyyy-MM-dd}] {estadoLimpio}: {dto.Motivo}";
        }

        activo.ActualizadoEn = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return new ActivoSerieDto
        {
            Id = activo.Id,
            RecursoId = activo.RecursoId,
            RecursoSku = activo.Recurso.Sku,
            RecursoNombre = activo.Recurso.Nombre,
            CategoriaId = activo.Recurso.CategoriaId,
            CategoriaNombre = activo.Recurso.Categoria.Nombre,
            NumeroSerie = activo.NumeroSerie,
            PlacaInstitucional = activo.PlacaInstitucional,
            Estado = activo.Estado,
            UbicacionId = activo.UbicacionId,
            UbicacionNombre = activo.Ubicacion.Nombre,
            ResponsableId = activo.ResponsableId,
            ResponsableNombre = activo.Responsable?.NombreCompleto,
            ResponsableCorreo = activo.Responsable?.Correo,
            ProveedorId = activo.ProveedorId,
            ProveedorNombre = activo.Proveedor?.NombreComercial,
            FechaAdquisicion = activo.FechaAdquisicion,
            GarantiaVence = activo.GarantiaVence,
            CostoEstimado = activo.Recurso.CostoEstimado,
            Notas = activo.Notas,
            CreadoEn = activo.CreadoEn,
            ActualizadoEn = activo.ActualizadoEn
        };
    }

    public async Task<ActivoSerieDto> DarDeBajaAsync(Guid id, string motivo, CancellationToken ct = default)
    {
        var activo = await _context.ActivosSerie
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .Include(a => a.Proveedor)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (activo == null)
        {
            throw new KeyNotFoundException($"El activo con ID '{id}' no fue encontrado.");
        }

        activo.Estado = "baja";
        activo.ResponsableId = null;
        activo.Notas = string.IsNullOrWhiteSpace(activo.Notas)
            ? $"[BAJA {DateTime.UtcNow:yyyy-MM-dd}] {motivo}"
            : $"{activo.Notas} | [BAJA {DateTime.UtcNow:yyyy-MM-dd}] {motivo}";
        activo.ActualizadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return new ActivoSerieDto
        {
            Id = activo.Id,
            RecursoId = activo.RecursoId,
            RecursoSku = activo.Recurso.Sku,
            RecursoNombre = activo.Recurso.Nombre,
            CategoriaId = activo.Recurso.CategoriaId,
            CategoriaNombre = activo.Recurso.Categoria.Nombre,
            NumeroSerie = activo.NumeroSerie,
            PlacaInstitucional = activo.PlacaInstitucional,
            Estado = activo.Estado,
            UbicacionId = activo.UbicacionId,
            UbicacionNombre = activo.Ubicacion.Nombre,
            ResponsableId = null,
            ResponsableNombre = null,
            ResponsableCorreo = null,
            ProveedorId = activo.ProveedorId,
            ProveedorNombre = activo.Proveedor?.NombreComercial,
            FechaAdquisicion = activo.FechaAdquisicion,
            GarantiaVence = activo.GarantiaVence,
            CostoEstimado = activo.Recurso.CostoEstimado,
            Notas = activo.Notas,
            CreadoEn = activo.CreadoEn,
            ActualizadoEn = activo.ActualizadoEn
        };
    }

    private static ActivoSerieDetalleDto MapearDetalle(ActivoSerie a)
    {
        return new ActivoSerieDetalleDto
        {
            Id = a.Id,
            RecursoId = a.RecursoId,
            RecursoSku = a.Recurso.Sku,
            RecursoNombre = a.Recurso.Nombre,
            CategoriaId = a.Recurso.CategoriaId,
            CategoriaNombre = a.Recurso.Categoria.Nombre,
            NumeroSerie = a.NumeroSerie,
            PlacaInstitucional = a.PlacaInstitucional,
            Estado = a.Estado,
            UbicacionId = a.UbicacionId,
            UbicacionNombre = a.Ubicacion.Nombre,
            ResponsableId = a.ResponsableId,
            ResponsableNombre = a.Responsable?.NombreCompleto,
            ResponsableCorreo = a.Responsable?.Correo,
            ProveedorId = a.ProveedorId,
            ProveedorNombre = a.Proveedor?.NombreComercial,
            FechaAdquisicion = a.FechaAdquisicion,
            GarantiaVence = a.GarantiaVence,
            CostoEstimado = a.Recurso.CostoEstimado,
            Notas = a.Notas,
            CreadoEn = a.CreadoEn,
            ActualizadoEn = a.ActualizadoEn,
            HistorialAsignaciones = a.Asignaciones.OrderByDescending(asig => asig.FechaInicio).Select(asig => new ActivoAsignacionHistorialDto
            {
                Id = asig.Id,
                CustodioId = asig.CustodioId,
                CustodioNombre = asig.Custodio != null ? asig.Custodio.NombreCompleto : "Sin custodio",
                Tipo = asig.Tipo,
                FechaInicio = asig.FechaInicio,
                FechaDevolucionPrevista = asig.FechaDevolucionPrevista,
                FechaDevolucionReal = asig.FechaDevolucionReal,
                Estado = asig.Estado,
                Observaciones = asig.Observaciones
            }).ToList(),
            HistorialMantenimientos = a.Mantenimientos.OrderByDescending(m => m.FechaProgramada).Select(m => new ActivoMantenimientoHistorialDto
            {
                Id = m.Id,
                Tipo = m.Tipo,
                Descripcion = m.Descripcion,
                FechaProgramada = m.FechaProgramada,
                FechaRealizada = m.FechaRealizada,
                Estado = m.Estado,
                Costo = m.Costo,
                TecnicoResponsable = m.TecnicoResponsable,
                ProveedorNombre = m.Proveedor != null ? m.Proveedor.NombreComercial : null
            }).ToList()
        };
    }
}
