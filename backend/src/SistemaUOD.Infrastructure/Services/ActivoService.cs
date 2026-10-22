using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class ActivoService : IActivoService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ActivoService(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
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

        if (!string.IsNullOrWhiteSpace(filtros.Custodio))
        {
            var cust = filtros.Custodio.Trim().ToLower();
            query = query.Where(a =>
                (a.Responsable != null && a.Responsable.NombreCompleto.ToLower().Contains(cust)) ||
                (a.Notas != null && a.Notas.ToLower().Contains(cust)));
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

        foreach (var item in items)
        {
            if (string.IsNullOrWhiteSpace(item.ResponsableNombre))
            {
                item.ResponsableNombre = ExtraerResponsableDeNotas(item.Notas);
            }
        }

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
            ResponsableNombre = activo.Responsable?.NombreCompleto ?? ExtraerResponsableDeNotas(activo.Notas),
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
            ResponsableNombre = activo.Responsable?.NombreCompleto ?? ExtraerResponsableDeNotas(activo.Notas),
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
            ResponsableNombre = a.Responsable?.NombreCompleto ?? ExtraerResponsableDeNotas(a.Notas),
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

    public async Task<ResultadoTrasladoActivoDto> TrasladarActivoAsync(Guid id, TrasladarActivoDto dto, CancellationToken ct = default)
    {
        var activo = await _context.ActivosSerie
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .Include(a => a.Asignaciones)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (activo == null)
        {
            throw new KeyNotFoundException($"El activo con ID '{id}' no fue encontrado.");
        }

        if (activo.Estado == "baja")
        {
            throw new InvalidOperationException("No se puede trasladar un activo que ha sido dado de baja.");
        }

        // Validar nueva ubicación
        var nuevaUbicacion = await _context.Ubicaciones.FirstOrDefaultAsync(u => u.Id == dto.NuevaUbicacionId, ct);
        if (nuevaUbicacion == null)
        {
            throw new InvalidOperationException("La ubicación de destino especificada no existe.");
        }

        if (!nuevaUbicacion.Activa)
        {
            throw new InvalidOperationException($"La ubicación de destino '{nuevaUbicacion.Nombre}' se encuentra inactiva.");
        }

        var ubicacionAnterior = activo.Ubicacion?.Nombre ?? "Sin ubicación asignada";
        var custodioAnterior = activo.Responsable?.NombreCompleto ?? "Sin custodio asignado";
        Perfil? nuevoCustodio = null;

        // Si se especificó un nuevo custodio
        if (dto.NuevoCustodioId.HasValue)
        {
            nuevoCustodio = await _context.Perfiles.FirstOrDefaultAsync(p => p.Id == dto.NuevoCustodioId.Value, ct);
            if (nuevoCustodio == null)
            {
                throw new InvalidOperationException("El nuevo custodio asignado no existe en el sistema.");
            }

            // Finalizar asignaciones activas previas
            foreach (var asig in activo.Asignaciones.Where(a => a.Estado == "activo" || a.Estado == "activa"))
            {
                asig.Estado = "finalizada";
                asig.FechaDevolucionReal = DateTime.UtcNow;
                asig.ActualizadoEn = DateTime.UtcNow;
            }

            // Crear nueva asignación
            var nuevaAsignacion = new AsignacionPrestamo
            {
                Id = Guid.NewGuid(),
                ActivoSerieId = activo.Id,
                CustodioId = nuevoCustodio.Id,
                Tipo = dto.TipoAsignacion ?? "asignacion_fija",
                FechaInicio = DateTime.UtcNow,
                Estado = "activo",
                Observaciones = dto.Motivo,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            _context.AsignacionesPrestamos.Add(nuevaAsignacion);
            activo.ResponsableId = nuevoCustodio.Id;
            activo.Responsable = nuevoCustodio;
        }

        // Actualizar ubicación física
        var ubicacionAnteriorId = activo.UbicacionId;
        activo.UbicacionId = dto.NuevaUbicacionId;
        activo.Ubicacion = nuevaUbicacion;

        // Si estaba disponible y ahora tiene custodio, pasa a en_uso
        if (activo.Estado == "disponible" && activo.ResponsableId.HasValue)
        {
            activo.Estado = "en_uso";
        }

        // Registrar movimiento institucional de traslado
        var anio = DateTime.UtcNow.Year;
        var conteoMov = await _context.Movimientos.CountAsync(m => m.NumeroMovimiento.StartsWith($"MOV-{anio}-"), ct);
        var numeroMovimiento = $"MOV-{anio}-{(conteoMov + 1):D6}";

        var usuarioEmisorId = _currentUserService.UserId ?? activo.ResponsableId ?? Guid.Parse("00000000-0000-0000-0000-000000000001");
        var movimiento = new Movimiento
        {
            Id = Guid.NewGuid(),
            NumeroMovimiento = numeroMovimiento,
            Tipo = "traslado",
            OrigenUbicacionId = ubicacionAnteriorId,
            DestinoUbicacionId = dto.NuevaUbicacionId,
            UsuarioId = usuarioEmisorId,
            Motivo = $"[Traslado Activo {activo.PlacaInstitucional ?? activo.NumeroSerie}] {dto.Motivo}",
            CreadoEn = DateTime.UtcNow
        };
        _context.Movimientos.Add(movimiento);

        var linea = new MovimientoLinea
        {
            Id = Guid.NewGuid(),
            MovimientoId = movimiento.Id,
            RecursoId = activo.RecursoId,
            Cantidad = 1,
            CostoUnitario = activo.Recurso.CostoEstimado
        };
        _context.MovimientosLineas.Add(linea);

        activo.Notas = string.IsNullOrWhiteSpace(activo.Notas)
            ? $"[{DateTime.UtcNow:yyyy-MM-dd}] Traslado a {nuevaUbicacion.Nombre}: {dto.Motivo}"
            : $"{activo.Notas} | [{DateTime.UtcNow:yyyy-MM-dd}] Traslado a {nuevaUbicacion.Nombre}: {dto.Motivo}";
        activo.ActualizadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        // Generar Acta de Entrega / Recepción Institucional
        var conteoActas = await _context.AsignacionesPrestamos.CountAsync(ct);
        var numeroActa = $"ACTA-{anio}-{(conteoActas + 1):D6}";

        var acta = new ActaEntregaRecepcionDto
        {
            NumeroActa = numeroActa,
            FechaEmision = DateTime.UtcNow,
            TipoOperacion = "traslado",
            Institucion = "Universidad Odontológica Dominicana (UOD)",
            DepartamentoEmisor = "Departamento de Tecnología de la Información (TI)",
            ActivoId = activo.Id,
            PlacaInstitucional = activo.PlacaInstitucional ?? "S/P",
            NumeroSerie = activo.NumeroSerie,
            RecursoNombre = activo.Recurso.Nombre,
            RecursoSku = activo.Recurso.Sku,
            CategoriaNombre = activo.Recurso.Categoria?.Nombre ?? "Tecnología",
            UbicacionAnterior = ubicacionAnterior,
            UbicacionNueva = nuevaUbicacion.Nombre,
            CustodioAnterior = custodioAnterior,
            CustodioNuevo = nuevoCustodio?.NombreCompleto ?? activo.Responsable?.NombreCompleto ?? "Sin custodio asignado",
            CustodioNuevoCorreo = nuevoCustodio?.Correo ?? activo.Responsable?.Correo,
            CustodioNuevoDepartamento = nuevoCustodio?.Departamento ?? activo.Responsable?.Departamento,
            Motivo = dto.Motivo,
            Observaciones = dto.Observaciones,
            ClausulasResponsabilidad = new List<string>
            {
                "1. El receptor asume la custodia física y el uso adecuado del equipo para fines estrictamente institucionales y académicos de la UOD.",
                "2. Cualquier daño, extravío o mal funcionamiento técnico debe ser reportado de inmediato al Departamento de Tecnología de la Información (TI).",
                "3. Queda prohibida la transferencia, cesión o reubicación del bien sin autorización y registro formal previo en el sistema SIIA.",
                "4. En caso de cese de funciones, traslado departamental o finalización de asignación, el bien debe ser formalmente devuelto a TI mediante acta de descargo."
            },
            FirmaEmisorNombre = _currentUserService.Email ?? "Administrador de TI",
            FirmaEmisorCargo = "Encargado de Inventario y Activos Fijos UOD",
            FirmaReceptorNombre = nuevoCustodio?.NombreCompleto ?? activo.Responsable?.NombreCompleto ?? "Custodio Receptor",
            FirmaReceptorCargo = nuevoCustodio?.Departamento ?? "Personal Institucional UOD"
        };

        var activoDto = MapearActivoDto(activo, nuevaUbicacion);

        return new ResultadoTrasladoActivoDto
        {
            Exitoso = true,
            Mensaje = $"Activo trasladado correctamente a '{nuevaUbicacion.Nombre}'. Acta {numeroActa} emitida.",
            Activo = activoDto,
            Acta = acta
        };
    }

    public async Task<ResultadoTrasladoActivoDto> AsignarCustodioAsync(Guid id, AsignarCustodioDto dto, CancellationToken ct = default)
    {
        var activo = await _context.ActivosSerie
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .Include(a => a.Asignaciones)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (activo == null)
        {
            throw new KeyNotFoundException($"El activo con ID '{id}' no fue encontrado.");
        }

        if (activo.Estado == "baja")
        {
            throw new InvalidOperationException("No se puede asignar custodio a un activo que ha sido dado de baja.");
        }

        var nuevoCustodio = await _context.Perfiles.FirstOrDefaultAsync(p => p.Id == dto.CustodioId, ct);
        if (nuevoCustodio == null)
        {
            throw new InvalidOperationException("El custodio o responsable especificado no existe en el sistema.");
        }

        var custodioAnterior = activo.Responsable?.NombreCompleto ?? "Sin custodio previo";

        // Finalizar asignaciones activas previas
        foreach (var asig in activo.Asignaciones.Where(a => a.Estado == "activo" || a.Estado == "activa"))
        {
            asig.Estado = "finalizada";
            asig.FechaDevolucionReal = DateTime.UtcNow;
            asig.ActualizadoEn = DateTime.UtcNow;
        }

        // Crear nueva asignación
        var nuevaAsignacion = new AsignacionPrestamo
        {
            Id = Guid.NewGuid(),
            ActivoSerieId = activo.Id,
            CustodioId = nuevoCustodio.Id,
            Tipo = dto.Tipo ?? "asignacion_fija",
            FechaInicio = DateTime.UtcNow,
            FechaDevolucionPrevista = dto.FechaDevolucionPrevista,
            Estado = "activo",
            Observaciones = dto.Observaciones,
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };
        _context.AsignacionesPrestamos.Add(nuevaAsignacion);

        activo.ResponsableId = nuevoCustodio.Id;
        activo.Responsable = nuevoCustodio;

        if (activo.Estado == "disponible")
        {
            activo.Estado = "en_uso";
        }

        activo.Notas = string.IsNullOrWhiteSpace(activo.Notas)
            ? $"[{DateTime.UtcNow:yyyy-MM-dd}] Asignación a {nuevoCustodio.NombreCompleto}: {dto.Observaciones}"
            : $"{activo.Notas} | [{DateTime.UtcNow:yyyy-MM-dd}] Asignación a {nuevoCustodio.NombreCompleto}: {dto.Observaciones}";
        activo.ActualizadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        var anio = DateTime.UtcNow.Year;
        var conteoActas = await _context.AsignacionesPrestamos.CountAsync(ct);
        var numeroActa = $"ACTA-{anio}-{(conteoActas + 1):D6}";

        var acta = new ActaEntregaRecepcionDto
        {
            NumeroActa = numeroActa,
            FechaEmision = DateTime.UtcNow,
            TipoOperacion = "asignacion_custodio",
            Institucion = "Universidad Odontológica Dominicana (UOD)",
            DepartamentoEmisor = "Departamento de Tecnología de la Información (TI)",
            ActivoId = activo.Id,
            PlacaInstitucional = activo.PlacaInstitucional ?? "S/P",
            NumeroSerie = activo.NumeroSerie,
            RecursoNombre = activo.Recurso.Nombre,
            RecursoSku = activo.Recurso.Sku,
            CategoriaNombre = activo.Recurso.Categoria?.Nombre ?? "Tecnología",
            UbicacionAnterior = activo.Ubicacion.Nombre,
            UbicacionNueva = activo.Ubicacion.Nombre,
            CustodioAnterior = custodioAnterior,
            CustodioNuevo = nuevoCustodio.NombreCompleto,
            CustodioNuevoCorreo = nuevoCustodio.Correo,
            CustodioNuevoDepartamento = nuevoCustodio.Departamento,
            Motivo = dto.Observaciones,
            Observaciones = dto.FechaDevolucionPrevista.HasValue ? $"Préstamo temporal con devolución prevista para el {dto.FechaDevolucionPrevista.Value:yyyy-MM-dd}" : null,
            ClausulasResponsabilidad = new List<string>
            {
                "1. El custodio receptor asume la custodia del bien institucional para uso docente, administrativo o de soporte técnico asignado.",
                "2. En caso de desperfecto o anomalía, debe notificarse formalmente al equipo de TI sin intentar intervenciones no autorizadas.",
                "3. Este equipo no puede ser transferido a terceras personas sin previa emisión de una nueva acta formal en SIIA."
            },
            FirmaEmisorNombre = _currentUserService.Email ?? "Administrador de TI",
            FirmaEmisorCargo = "Encargado de Inventario y Activos Fijos UOD",
            FirmaReceptorNombre = nuevoCustodio.NombreCompleto,
            FirmaReceptorCargo = nuevoCustodio.Departamento ?? "Custodio Asignado"
        };

        var activoDto = MapearActivoDto(activo, activo.Ubicacion);

        return new ResultadoTrasladoActivoDto
        {
            Exitoso = true,
            Mensaje = $"Custodio '{nuevoCustodio.NombreCompleto}' asignado correctamente. Acta {numeroActa} emitida.",
            Activo = activoDto,
            Acta = acta
        };
    }

    public async Task<ActaEntregaRecepcionDto> GenerarActaEntregaAsync(Guid id, CancellationToken ct = default)
    {
        var activo = await _context.ActivosSerie
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .Include(a => a.Asignaciones)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (activo == null)
        {
            throw new KeyNotFoundException($"El activo con ID '{id}' no fue encontrado.");
        }

        var anio = DateTime.UtcNow.Year;
        var conteoActas = await _context.AsignacionesPrestamos.CountAsync(ct);
        var numeroActa = $"ACTA-{anio}-{(conteoActas + 1):D6}";

        var ultimaAsignacion = activo.Asignaciones
            .OrderByDescending(a => a.FechaInicio)
            .FirstOrDefault();

        return new ActaEntregaRecepcionDto
        {
            NumeroActa = numeroActa,
            FechaEmision = DateTime.UtcNow,
            TipoOperacion = "constancia_entrega",
            Institucion = "Universidad Odontológica Dominicana (UOD)",
            DepartamentoEmisor = "Departamento de Tecnología de la Información (TI)",
            ActivoId = activo.Id,
            PlacaInstitucional = activo.PlacaInstitucional ?? "S/P",
            NumeroSerie = activo.NumeroSerie,
            RecursoNombre = activo.Recurso.Nombre,
            RecursoSku = activo.Recurso.Sku,
            CategoriaNombre = activo.Recurso.Categoria?.Nombre ?? "Tecnología",
            UbicacionAnterior = null,
            UbicacionNueva = activo.Ubicacion.Nombre,
            CustodioAnterior = null,
            CustodioNuevo = activo.Responsable?.NombreCompleto ?? "Sin custodio asignado",
            CustodioNuevoCorreo = activo.Responsable?.Correo,
            CustodioNuevoDepartamento = activo.Responsable?.Departamento,
            Motivo = ultimaAsignacion?.Observaciones ?? "Asignación institucional activa de activo fijo",
            Observaciones = activo.Notas,
            ClausulasResponsabilidad = new List<string>
            {
                "1. El receptor asume la custodia física y el uso adecuado del equipo para fines estrictamente institucionales y académicos de la UOD.",
                "2. Cualquier daño, extravío o mal funcionamiento técnico debe ser reportado de inmediato al Departamento de Tecnología de la Información (TI).",
                "3. Queda prohibida la transferencia, cesión o reubicación del bien sin autorización y registro formal previo en el sistema SIIA."
            },
            FirmaEmisorNombre = _currentUserService.Email ?? "Administrador de TI",
            FirmaEmisorCargo = "Encargado de Inventario y Activos Fijos UOD",
            FirmaReceptorNombre = activo.Responsable?.NombreCompleto ?? "Custodio Responsable",
            FirmaReceptorCargo = activo.Responsable?.Departamento ?? "Personal Institucional UOD"
        };
    }

    public async Task<ResultadoBajaActivoDto> ProcesarBajaPatrimonialAsync(Guid id, DarDeBajaActivoDto dto, CancellationToken ct = default)
    {
        var activo = await _context.ActivosSerie
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .Include(a => a.Proveedor)
            .Include(a => a.Asignaciones)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (activo == null)
            throw new KeyNotFoundException($"El activo con ID '{id}' no fue encontrado.");

        if (activo.Estado == "dado_de_baja" || activo.Estado == "baja")
            throw new InvalidOperationException("El activo ya se encuentra dado de baja.");

        var custodioSaliente = activo.Responsable?.NombreCompleto;
        var ultimaUbicacion = activo.Ubicacion?.Nombre ?? "Almacén Central";

        // Finalizar asignaciones activas
        foreach (var asig in activo.Asignaciones.Where(a => a.Estado == "activo" || a.Estado == "activa"))
        {
            asig.Estado = "finalizada";
            asig.FechaDevolucionReal = DateTime.UtcNow;
            asig.ActualizadoEn = DateTime.UtcNow;
        }

        activo.Estado = "dado_de_baja";
        activo.ResponsableId = null;
        activo.Responsable = null;
        activo.Notas = string.IsNullOrWhiteSpace(activo.Notas)
            ? $"[BAJA PATRIMONIAL {DateTime.UtcNow:yyyy-MM-dd}] Motivo: {dto.Motivo} | Destino: {dto.DestinoFinalBien}"
            : $"{activo.Notas} | [BAJA PATRIMONIAL {DateTime.UtcNow:yyyy-MM-dd}] Motivo: {dto.Motivo} | Destino: {dto.DestinoFinalBien}";
        activo.ActualizadoEn = DateTime.UtcNow;

        // Registrar movimiento de baja formal
        var anio = DateTime.UtcNow.Year;
        var conteoMov = await _context.Movimientos.CountAsync(ct);
        var correlativoMov = $"MOV-{anio}-{(conteoMov + 1):D6}";

        var movimientoBaja = new Movimiento
        {
            Id = Guid.NewGuid(),
            NumeroMovimiento = correlativoMov,
            Tipo = "baja",
            OrigenUbicacionId = activo.UbicacionId,
            DestinoUbicacionId = null,
            UsuarioId = _currentUserService.UserId ?? Guid.Empty,
            OrigenIa = false,
            Motivo = $"Baja patrimonial: {dto.Motivo}. Dictamen técnico: {dto.DictamenTecnico ?? "Dictamen por obsolescencia o avería"}",
            CreadoEn = DateTime.UtcNow
        };
        _context.Movimientos.Add(movimientoBaja);

        var conteoBajas = await _context.Movimientos.CountAsync(m => m.Tipo == "baja", ct);
        var numeroActa = $"ACTA-DESCARGO-{anio}-{(conteoBajas + 1):D6}";

        await _context.SaveChangesAsync(ct);

        var costoHistorico = activo.Recurso?.CostoEstimado ?? 0;
        var valorResidual = Math.Round(costoHistorico * 0.05m, 2);

        var acta = new ActaDescargoPatrimonialDto
        {
            NumeroActa = numeroActa,
            FechaBaja = DateTime.UtcNow,
            Institucion = "Universidad Odontológica Dominicana (UOD)",
            DepartamentoEmisor = "Comisión de Gestión Patrimonial e Inventario TI",
            ActivoId = activo.Id,
            PlacaInstitucional = activo.PlacaInstitucional ?? "SIN-PLACA",
            NumeroSerie = activo.NumeroSerie,
            RecursoNombre = activo.Recurso?.Nombre ?? "Bien Patrimonial",
            RecursoSku = activo.Recurso?.Sku ?? string.Empty,
            CategoriaNombre = activo.Recurso?.Categoria?.Nombre ?? "Tecnología",
            UltimaUbicacion = ultimaUbicacion,
            UltimoCustodio = custodioSaliente ?? "Sin custodio asignado",
            ValorHistoricoDop = costoHistorico,
            ValorEnLibrosDop = valorResidual,
            MotivoBaja = dto.Motivo,
            DictamenTecnico = dto.DictamenTecnico ?? "Evaluación técnica certifica que el bien presenta obsolescencia o avería que hace inviable su reparación económica.",
            DestinoFinalBien = dto.DestinoFinalBien,
            ClausulasDescargo = new List<string>
            {
                "1. Se certifica el descargo físico y contable del bien de los registros de inventario activo de la Universidad Odontológica Dominicana (UOD).",
                "2. El custodio saliente queda formalmente liberado de toda responsabilidad patrimonial sobre el bien a partir de la firma de la presente acta.",
                "3. El bien descatalogado será canalizado según la normativa de descarte ecológico y gestión ambiental de RAEE institucional.",
                "4. Copia de la presente acta se remite al Departamento de Contabilidad y a la Auditoría Interna para el ajuste correspondiente en el libro mayor de activos fijos."
            },
            FirmaResponsableTi = _currentUserService.Email ?? "Encargado de Tecnología TI UOD",
            FirmaAuditoriaInterna = "Auditoría Interna Institucional UOD",
            FirmaRectoriaAdministracion = "Dirección Administrativa y Financiera UOD"
        };

        return new ResultadoBajaActivoDto
        {
            Exitoso = true,
            Mensaje = $"Activo {activo.PlacaInstitucional} dado de baja exitosamente. Acta oficial {numeroActa} emitida.",
            Activo = MapearActivoDto(activo, activo.Ubicacion!),
            ActaDescargo = acta
        };
    }

    public async Task<ActaDescargoPatrimonialDto> GenerarActaDescargoAsync(Guid id, CancellationToken ct = default)
    {
        var activo = await _context.ActivosSerie
            .AsNoTracking()
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (activo == null)
            throw new KeyNotFoundException($"El activo con ID '{id}' no fue encontrado.");

        var anio = DateTime.UtcNow.Year;
        var numeroActa = $"ACTA-DESCARGO-{anio}-{Math.Abs(activo.Id.GetHashCode() % 100000):D6}";
        var costoHistorico = activo.Recurso?.CostoEstimado ?? 0;
        var valorResidual = Math.Round(costoHistorico * 0.05m, 2);

        return new ActaDescargoPatrimonialDto
        {
            NumeroActa = numeroActa,
            FechaBaja = activo.ActualizadoEn,
            Institucion = "Universidad Odontológica Dominicana (UOD)",
            DepartamentoEmisor = "Comisión de Gestión Patrimonial e Inventario TI",
            ActivoId = activo.Id,
            PlacaInstitucional = activo.PlacaInstitucional ?? "SIN-PLACA",
            NumeroSerie = activo.NumeroSerie,
            RecursoNombre = activo.Recurso?.Nombre ?? "Bien Patrimonial",
            RecursoSku = activo.Recurso?.Sku ?? string.Empty,
            CategoriaNombre = activo.Recurso?.Categoria?.Nombre ?? "Tecnología",
            UltimaUbicacion = activo.Ubicacion?.Nombre ?? "Almacén Central",
            UltimoCustodio = activo.Responsable?.NombreCompleto ?? "Sin custodio asignado",
            ValorHistoricoDop = costoHistorico,
            ValorEnLibrosDop = valorResidual,
            MotivoBaja = "Obsolescencia o fin de ciclo operativo institucional",
            DictamenTecnico = "Evaluación técnica confirma desincorporación definitiva del inventario activo.",
            DestinoFinalBien = "descarte_ecologico",
            ClausulasDescargo = new List<string>
            {
                "1. Se certifica el descargo físico y contable del bien de los registros de inventario activo de la Universidad Odontológica Dominicana (UOD).",
                "2. El custodio saliente queda formalmente liberado de toda responsabilidad patrimonial sobre el bien a partir de la firma de la presente acta.",
                "3. El bien descatalogado será canalizado según la normativa de descarte ecológico y gestión ambiental de RAEE institucional.",
                "4. Copia de la presente acta se remite al Departamento de Contabilidad y a la Auditoría Interna para el ajuste correspondiente en el libro mayor de activos fijos."
            },
            FirmaResponsableTi = _currentUserService.Email ?? "Encargado de Tecnología TI UOD",
            FirmaAuditoriaInterna = "Auditoría Interna Institucional UOD",
            FirmaRectoriaAdministracion = "Dirección Administrativa y Financiera UOD"
        };
    }

    private static ActivoSerieDto MapearActivoDto(ActivoSerie activo, Ubicacion ubicacion)
    {
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
            ResponsableNombre = activo.Responsable?.NombreCompleto ?? ExtraerResponsableDeNotas(activo.Notas),
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

    private static string? ExtraerResponsableDeNotas(string? notas)
    {
        if (string.IsNullOrWhiteSpace(notas)) return null;
        var match = System.Text.RegularExpressions.Regex.Match(notas, @"Responsable:\s*([^\r\n;]+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        return match.Success && !string.IsNullOrWhiteSpace(match.Groups[1].Value) ? match.Groups[1].Value.Trim() : null;
    }
}
