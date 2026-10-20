using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class CategoriaService : ICategoriaService
{
    private readonly IApplicationDbContext _context;

    public CategoriaService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoriaDto>> ObtenerTodasAsync(bool? soloActivas = null, CancellationToken ct = default)
    {
        var query = _context.Categorias
            .AsNoTracking()
            .Include(c => c.CategoriaPadre)
            .Include(c => c.Subcategorias)
            .Include(c => c.Recursos)
            .AsQueryable();

        if (soloActivas.HasValue)
        {
            query = query.Where(c => c.Activa == soloActivas.Value);
        }

        var list = await query
            .OrderBy(c => c.Codigo)
            .ToListAsync(ct);

        return list.Select(c => new CategoriaDto
        {
            Id = c.Id,
            CategoriaPadreId = c.CategoriaPadreId,
            CategoriaPadreNombre = c.CategoriaPadre?.Nombre,
            Codigo = c.Codigo,
            Nombre = c.Nombre,
            Descripcion = c.Descripcion,
            Activa = c.Activa,
            CreadoEn = c.CreadoEn,
            ActualizadoEn = c.ActualizadoEn,
            SubcategoriasCount = c.Subcategorias.Count,
            RecursosCount = c.Recursos.Count
        }).ToList();
    }

    public async Task<CategoriaDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default)
    {
        var c = await _context.Categorias
            .AsNoTracking()
            .Include(c => c.CategoriaPadre)
            .Include(c => c.Subcategorias)
            .Include(c => c.Recursos)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (c == null) return null;

        return new CategoriaDto
        {
            Id = c.Id,
            CategoriaPadreId = c.CategoriaPadreId,
            CategoriaPadreNombre = c.CategoriaPadre?.Nombre,
            Codigo = c.Codigo,
            Nombre = c.Nombre,
            Descripcion = c.Descripcion,
            Activa = c.Activa,
            CreadoEn = c.CreadoEn,
            ActualizadoEn = c.ActualizadoEn,
            SubcategoriasCount = c.Subcategorias.Count,
            RecursosCount = c.Recursos.Count
        };
    }

    public async Task<CategoriaDto> CrearAsync(CrearCategoriaDto dto, CancellationToken ct = default)
    {
        var existeCodigo = await _context.Categorias
            .AnyAsync(c => c.Codigo.ToLower() == dto.Codigo.Trim().ToLower(), ct);

        if (existeCodigo)
        {
            throw new InvalidOperationException($"Ya existe una categoría registrada con el código '{dto.Codigo}'.");
        }

        if (dto.CategoriaPadreId.HasValue)
        {
            var padreExiste = await _context.Categorias
                .AnyAsync(c => c.Id == dto.CategoriaPadreId.Value, ct);

            if (!padreExiste)
            {
                throw new InvalidOperationException("La categoría padre seleccionada no existe en el sistema.");
            }
        }

        var categoria = new Categoria
        {
            Id = Guid.NewGuid(),
            CategoriaPadreId = dto.CategoriaPadreId,
            Codigo = dto.Codigo.Trim().ToUpperInvariant(),
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            Activa = dto.Activa,
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };

        _context.Categorias.Add(categoria);
        await _context.SaveChangesAsync(ct);

        return await ObtenerPorIdAsync(categoria.Id, ct) ?? new CategoriaDto
        {
            Id = categoria.Id,
            Codigo = categoria.Codigo,
            Nombre = categoria.Nombre,
            Descripcion = categoria.Descripcion,
            Activa = categoria.Activa
        };
    }

    public async Task<CategoriaDto?> ActualizarAsync(Guid id, ActualizarCategoriaDto dto, CancellationToken ct = default)
    {
        var categoria = await _context.Categorias
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (categoria == null) return null;

        // Validar unicidad del código
        var codigoDuplicado = await _context.Categorias
            .AnyAsync(c => c.Id != id && c.Codigo.ToLower() == dto.Codigo.Trim().ToLower(), ct);

        if (codigoDuplicado)
        {
            throw new InvalidOperationException($"Ya existe otra categoría registrada con el código '{dto.Codigo}'.");
        }

        // Validar que no sea su propio padre
        if (dto.CategoriaPadreId.HasValue)
        {
            if (dto.CategoriaPadreId.Value == id)
            {
                throw new InvalidOperationException("Una categoría no puede asignarse a sí misma como categoría padre.");
            }

            var padreExiste = await _context.Categorias
                .AnyAsync(c => c.Id == dto.CategoriaPadreId.Value, ct);

            if (!padreExiste)
            {
                throw new InvalidOperationException("La categoría padre especificada no existe.");
            }
        }

        categoria.CategoriaPadreId = dto.CategoriaPadreId;
        categoria.Codigo = dto.Codigo.Trim().ToUpperInvariant();
        categoria.Nombre = dto.Nombre.Trim();
        categoria.Descripcion = dto.Descripcion?.Trim();
        categoria.Activa = dto.Activa;
        categoria.ActualizadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return await ObtenerPorIdAsync(id, ct);
    }

    public async Task<bool> CambiarEstadoAsync(Guid id, bool activa, CancellationToken ct = default)
    {
        var categoria = await _context.Categorias
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (categoria == null) return false;

        categoria.Activa = activa;
        categoria.ActualizadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> EliminarAsync(Guid id, CancellationToken ct = default)
    {
        var categoria = await _context.Categorias
            .Include(c => c.Subcategorias)
            .Include(c => c.Recursos)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (categoria == null) return false;

        if (categoria.Recursos.Count > 0)
        {
            throw new InvalidOperationException($"No es posible eliminar la categoría '{categoria.Nombre}' porque tiene {categoria.Recursos.Count} recurso(s) asociado(s). Considere desactivarla.");
        }

        if (categoria.Subcategorias.Count > 0)
        {
            throw new InvalidOperationException($"No es posible eliminar la categoría '{categoria.Nombre}' porque tiene {categoria.Subcategorias.Count} subcategoría(s) subordinada(s).");
        }

        _context.Categorias.Remove(categoria);
        await _context.SaveChangesAsync(ct);
        return true;
    }
}
