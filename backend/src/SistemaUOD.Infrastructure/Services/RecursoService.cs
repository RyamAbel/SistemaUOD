using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class RecursoService : IRecursoService
{
    private readonly IApplicationDbContext _context;

    public RecursoService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<RecursoDto>> ListarAsync(RecursoFiltrosDto filtros, CancellationToken ct = default)
    {
        var query = _context.Recursos
            .AsNoTracking()
            .Include(r => r.Categoria)
            .AsQueryable();

        // 1. Estado activo
        if (filtros.Activo.HasValue)
        {
            query = query.Where(r => r.Activo == filtros.Activo.Value);
        }

        // 2. Categoría (incluye subcategorías dependientes)
        if (filtros.CategoriaId.HasValue)
        {
            var catId = filtros.CategoriaId.Value;
            query = query.Where(r => r.CategoriaId == catId || r.Categoria.CategoriaPadreId == catId);
        }

        // 3. Tipo (consumible / activo_fijo)
        if (!string.IsNullOrWhiteSpace(filtros.Tipo))
        {
            var tipoNormalizado = filtros.Tipo.Trim().ToLower();
            query = query.Where(r => r.Tipo.ToLower() == tipoNormalizado);
        }

        // 4. Rango de costos
        if (filtros.CostoMin.HasValue)
        {
            query = query.Where(r => r.CostoEstimado >= filtros.CostoMin.Value);
        }
        if (filtros.CostoMax.HasValue)
        {
            query = query.Where(r => r.CostoEstimado <= filtros.CostoMax.Value);
        }

        // 5. Presencia de fotos o QR
        if (filtros.ConFoto.HasValue)
        {
            query = filtros.ConFoto.Value ? query.Where(r => r.Fotos.Any()) : query.Where(r => !r.Fotos.Any());
        }
        if (filtros.ConQr.HasValue)
        {
            query = filtros.ConQr.Value ? query.Where(r => r.Codigos.Any()) : query.Where(r => !r.Codigos.Any());
        }

        // 6. Ubicación (en existencias o en activos de serie)
        if (filtros.UbicacionId.HasValue)
        {
            var uId = filtros.UbicacionId.Value;
            query = query.Where(r =>
                r.Existencias.Any(e => e.UbicacionId == uId && e.Cantidad > 0) ||
                r.ActivosSerie.Any(a => a.UbicacionId == uId));
        }

        // 7. Responsable / Custodio asignado
        if (filtros.ResponsableId.HasValue)
        {
            var respId = filtros.ResponsableId.Value;
            query = query.Where(r => r.ActivosSerie.Any(a => a.ResponsableId == respId));
        }

        // 8. Proveedor
        if (filtros.ProveedorId.HasValue)
        {
            var provId = filtros.ProveedorId.Value;
            query = query.Where(r =>
                r.ActivosSerie.Any(a => a.ProveedorId == provId) ||
                r.Lotes.Any(l => l.ProveedorId == provId));
        }

        // 9. Rango de fechas de adquisición
        if (filtros.FechaAdquisicionDesde.HasValue)
        {
            query = query.Where(r => r.ActivosSerie.Any(a => a.FechaAdquisicion >= filtros.FechaAdquisicionDesde.Value));
        }
        if (filtros.FechaAdquisicionHasta.HasValue)
        {
            query = query.Where(r => r.ActivosSerie.Any(a => a.FechaAdquisicion <= filtros.FechaAdquisicionHasta.Value));
        }

        // 10. Búsqueda por texto libre
        if (!string.IsNullOrWhiteSpace(filtros.Search))
        {
            var search = filtros.Search.Trim().ToLower();
            query = query.Where(r =>
                r.Nombre.ToLower().Contains(search) ||
                r.Sku.ToLower().Contains(search) ||
                (r.Descripcion != null && r.Descripcion.ToLower().Contains(search)) ||
                r.Codigos.Any(c => c.Codigo.ToLower().Contains(search)) ||
                r.ActivosSerie.Any(a =>
                    a.NumeroSerie.ToLower().Contains(search) ||
                    (a.PlacaInstitucional != null && a.PlacaInstitucional.ToLower().Contains(search))));
        }

        // 11. Filtro Stock Bajo o Agotado
        if (filtros.StockBajo == true)
        {
            query = query.Where(r => r.Existencias.Sum(e => (int?)e.Cantidad ?? 0) <= r.StockMinimo);
        }
        if (filtros.StockAgotado == true)
        {
            query = query.Where(r => r.Existencias.Sum(e => (int?)e.Cantidad ?? 0) == 0);
        }

        // 12. Ordenamiento
        query = filtros.SortBy?.ToLower() switch
        {
            "sku" => filtros.IsDescending ? query.OrderByDescending(r => r.Sku) : query.OrderBy(r => r.Sku),
            "nombre" => filtros.IsDescending ? query.OrderByDescending(r => r.Nombre) : query.OrderBy(r => r.Nombre),
            "costo" => filtros.IsDescending ? query.OrderByDescending(r => r.CostoEstimado) : query.OrderBy(r => r.CostoEstimado),
            "categoria" => filtros.IsDescending ? query.OrderByDescending(r => r.Categoria.Nombre) : query.OrderBy(r => r.Categoria.Nombre),
            _ => filtros.IsDescending ? query.OrderBy(r => r.CreadoEn) : query.OrderByDescending(r => r.CreadoEn)
        };

        var totalCount = await query.CountAsync(ct);

        var pageIndex = filtros.PageIndex < 1 ? 1 : filtros.PageIndex;
        var pageSize = filtros.PageSize < 1 ? 20 : (filtros.PageSize > 100 ? 100 : filtros.PageSize);

        var items = await query
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RecursoDto
            {
                Id = r.Id,
                Sku = r.Sku,
                Nombre = r.Nombre,
                Descripcion = r.Descripcion,
                CategoriaId = r.CategoriaId,
                CategoriaNombre = r.Categoria.Nombre,
                Tipo = r.Tipo,
                UnidadMedida = r.UnidadMedida,
                StockMinimo = r.StockMinimo,
                StockMaximo = r.StockMaximo,
                PuntoReorden = r.PuntoReorden,
                CostoEstimado = r.CostoEstimado,
                Activo = r.Activo,
                StockActual = r.Existencias.Sum(e => (int?)e.Cantidad) ?? 0,
                FotoPrincipalUrl = r.Fotos.OrderByDescending(f => f.EsPrincipal).ThenBy(f => f.Orden).Select(f => f.UrlArchivo).FirstOrDefault(),
                TotalFotos = r.Fotos.Count(),
                QrPrincipalCodigo = r.Codigos.OrderByDescending(c => c.EsPrincipal).Select(c => c.Codigo).FirstOrDefault(),
                TotalActivosSerie = r.ActivosSerie.Count(),
                CreadoEn = r.CreadoEn,
                ActualizadoEn = r.ActualizadoEn
            })
            .ToListAsync(ct);

        return PagedResult<RecursoDto>.Create(items, totalCount, pageIndex, pageSize);
    }

    public async Task<RecursoDetalleDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default)
    {
        var r = await _context.Recursos
            .AsNoTracking()
            .Include(x => x.Categoria)
            .Include(x => x.Fotos.OrderBy(f => f.Orden))
            .Include(x => x.Codigos)
            .Include(x => x.Existencias)
                .ThenInclude(e => e.Ubicacion)
            .Include(x => x.ActivosSerie)
                .ThenInclude(a => a.Ubicacion)
            .Include(x => x.ActivosSerie)
                .ThenInclude(a => a.Responsable)
            .Include(x => x.ActivosSerie)
                .ThenInclude(a => a.Proveedor)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (r == null) return null;

        return new RecursoDetalleDto
        {
            Id = r.Id,
            Sku = r.Sku,
            Nombre = r.Nombre,
            Descripcion = r.Descripcion,
            CategoriaId = r.CategoriaId,
            CategoriaNombre = r.Categoria.Nombre,
            Tipo = r.Tipo,
            UnidadMedida = r.UnidadMedida,
            StockMinimo = r.StockMinimo,
            StockMaximo = r.StockMaximo,
            PuntoReorden = r.PuntoReorden,
            CostoEstimado = r.CostoEstimado,
            Activo = r.Activo,
            StockActual = r.Existencias.Sum(e => e.Cantidad),
            FotoPrincipalUrl = r.Fotos.FirstOrDefault(f => f.EsPrincipal)?.UrlArchivo ?? r.Fotos.FirstOrDefault()?.UrlArchivo,
            TotalFotos = r.Fotos.Count,
            QrPrincipalCodigo = r.Codigos.FirstOrDefault(c => c.EsPrincipal)?.Codigo ?? r.Codigos.FirstOrDefault()?.Codigo,
            TotalActivosSerie = r.ActivosSerie.Count,
            CreadoEn = r.CreadoEn,
            ActualizadoEn = r.ActualizadoEn,
            Fotos = r.Fotos.Select(f => new RecursoFotoDto
            {
                Id = f.Id,
                UrlArchivo = f.UrlArchivo,
                EsPrincipal = f.EsPrincipal,
                Orden = f.Orden,
                CreadoEn = f.CreadoEn
            }).ToList(),
            Codigos = r.Codigos.Select(c => new RecursoCodigoDto
            {
                Id = c.Id,
                TipoCodigo = c.TipoCodigo,
                Codigo = c.Codigo,
                EsPrincipal = c.EsPrincipal,
                CreadoEn = c.CreadoEn
            }).ToList(),
            Existencias = r.Existencias.Select(e => new RecursoExistenciaDto
            {
                UbicacionId = e.UbicacionId,
                UbicacionNombre = e.Ubicacion.Nombre,
                UbicacionCodigo = e.Ubicacion.Codigo,
                Cantidad = e.Cantidad,
                ActualizadoEn = e.ActualizadoEn
            }).ToList(),
            ActivosSerie = r.ActivosSerie.Select(a => new RecursoActivoSerieDto
            {
                Id = a.Id,
                NumeroSerie = a.NumeroSerie,
                PlacaInstitucional = a.PlacaInstitucional,
                Estado = a.Estado,
                UbicacionId = a.UbicacionId,
                UbicacionNombre = a.Ubicacion.Nombre,
                ResponsableId = a.ResponsableId,
                ResponsableNombre = a.Responsable?.NombreCompleto,
                ProveedorId = a.ProveedorId,
                ProveedorNombre = a.Proveedor?.NombreComercial,
                FechaAdquisicion = a.FechaAdquisicion,
                Notas = a.Notas
            }).ToList()
        };
    }

    public async Task<RecursoDto> CrearAsync(CrearRecursoDto dto, CancellationToken ct = default)
    {
        var skuLimpio = dto.Sku.Trim().ToUpperInvariant();

        // 1. Validar unicidad del SKU
        var existeSku = await _context.Recursos
            .AnyAsync(r => r.Sku == skuLimpio, ct);

        if (existeSku)
        {
            throw new InvalidOperationException($"Ya existe un recurso registrado con el SKU '{skuLimpio}'.");
        }

        // 2. Validar que la categoría exista
        var categoriaExiste = await _context.Categorias
            .AnyAsync(c => c.Id == dto.CategoriaId, ct);

        if (!categoriaExiste)
        {
            throw new InvalidOperationException("La categoría especificada no existe en el sistema.");
        }

        // 3. Crear entidad Recurso
        var recurso = new Recurso
        {
            Id = Guid.NewGuid(),
            Sku = skuLimpio,
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            CategoriaId = dto.CategoriaId,
            Tipo = dto.Tipo.Trim().ToLowerInvariant(),
            UnidadMedida = dto.UnidadMedida.Trim().ToLowerInvariant(),
            StockMinimo = dto.StockMinimo,
            StockMaximo = dto.StockMaximo,
            PuntoReorden = dto.PuntoReorden,
            CostoEstimado = dto.CostoEstimado,
            Activo = dto.Activo,
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };

        // Si se incluye un código QR inicial
        if (!string.IsNullOrWhiteSpace(dto.CodigoQrInicial))
        {
            recurso.Codigos.Add(new RecursoCodigo
            {
                Id = Guid.NewGuid(),
                RecursoId = recurso.Id,
                TipoCodigo = "qr_propio",
                Codigo = dto.CodigoQrInicial.Trim(),
                EsPrincipal = true,
                CreadoEn = DateTime.UtcNow
            });
        }

        _context.Recursos.Add(recurso);
        await _context.SaveChangesAsync(ct);

        return (await ObtenerPorIdAsync(recurso.Id, ct))!;
    }

    public async Task<RecursoDto?> ActualizarAsync(Guid id, ActualizarRecursoDto dto, CancellationToken ct = default)
    {
        var recurso = await _context.Recursos
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (recurso == null) return null;

        var skuLimpio = dto.Sku.Trim().ToUpperInvariant();

        // Validar unicidad del SKU en caso de cambio
        var skuDuplicado = await _context.Recursos
            .AnyAsync(r => r.Id != id && r.Sku == skuLimpio, ct);

        if (skuDuplicado)
        {
            throw new InvalidOperationException($"Ya existe otro recurso registrado con el SKU '{skuLimpio}'.");
        }

        // Validar categoría
        var categoriaExiste = await _context.Categorias
            .AnyAsync(c => c.Id == dto.CategoriaId, ct);

        if (!categoriaExiste)
        {
            throw new InvalidOperationException("La categoría especificada no existe.");
        }

        recurso.Sku = skuLimpio;
        recurso.Nombre = dto.Nombre.Trim();
        recurso.Descripcion = dto.Descripcion?.Trim();
        recurso.CategoriaId = dto.CategoriaId;
        recurso.Tipo = dto.Tipo.Trim().ToLowerInvariant();
        recurso.UnidadMedida = dto.UnidadMedida.Trim().ToLowerInvariant();
        recurso.StockMinimo = dto.StockMinimo;
        recurso.StockMaximo = dto.StockMaximo;
        recurso.PuntoReorden = dto.PuntoReorden;
        recurso.CostoEstimado = dto.CostoEstimado;
        recurso.Activo = dto.Activo;
        recurso.ActualizadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return (await ObtenerPorIdAsync(id, ct))!;
    }

    public async Task<RecursoDto> DuplicarAsync(Guid id, DuplicarRecursoDto dto, CancellationToken ct = default)
    {
        var origen = await _context.Recursos
            .Include(r => r.Fotos)
            .Include(r => r.Codigos)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (origen == null)
        {
            throw new InvalidOperationException("El recurso de origen que desea duplicar no existe.");
        }

        var nuevoSku = dto.NuevoSku.Trim().ToUpperInvariant();
        var existeSku = await _context.Recursos.AnyAsync(r => r.Sku == nuevoSku, ct);
        if (existeSku)
        {
            throw new InvalidOperationException($"Ya existe un recurso con el SKU '{nuevoSku}'.");
        }

        var clon = new Recurso
        {
            Id = Guid.NewGuid(),
            Sku = nuevoSku,
            Nombre = dto.NuevoNombre.Trim(),
            Descripcion = origen.Descripcion,
            CategoriaId = origen.CategoriaId,
            Tipo = origen.Tipo,
            UnidadMedida = origen.UnidadMedida,
            StockMinimo = origen.StockMinimo,
            StockMaximo = origen.StockMaximo,
            PuntoReorden = origen.PuntoReorden,
            CostoEstimado = origen.CostoEstimado,
            Activo = true,
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };

        if (dto.CopiarFotos)
        {
            foreach (var foto in origen.Fotos)
            {
                clon.Fotos.Add(new RecursoFoto
                {
                    Id = Guid.NewGuid(),
                    RecursoId = clon.Id,
                    UrlArchivo = foto.UrlArchivo,
                    EsPrincipal = foto.EsPrincipal,
                    Orden = foto.Orden,
                    CreadoEn = DateTime.UtcNow
                });
            }
        }

        _context.Recursos.Add(clon);
        await _context.SaveChangesAsync(ct);

        return (await ObtenerPorIdAsync(clon.Id, ct))!;
    }

    public async Task<bool> CambiarEstadoAsync(Guid id, bool activo, CancellationToken ct = default)
    {
        var recurso = await _context.Recursos
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (recurso == null) return false;

        recurso.Activo = activo;
        recurso.ActualizadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DesactivarAsync(Guid id, CancellationToken ct = default)
    {
        return await CambiarEstadoAsync(id, false, ct);
    }
}
