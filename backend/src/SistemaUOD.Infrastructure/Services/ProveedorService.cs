using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class ProveedorService : IProveedorService
{
    private readonly IApplicationDbContext _context;

    public ProveedorService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ProveedorDto>> ObtenerPaginadoAsync(PagedRequest request, bool? soloActivos = null, CancellationToken ct = default)
    {
        var query = _context.Proveedores
            .AsNoTracking()
            .AsQueryable();

        if (soloActivos.HasValue)
        {
            query = query.Where(p => p.Activo == soloActivos.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(p =>
                p.Rnc.ToLower().Contains(search) ||
                p.NombreComercial.ToLower().Contains(search) ||
                (p.RazonSocial != null && p.RazonSocial.ToLower().Contains(search)) ||
                (p.ContactoNombre != null && p.ContactoNombre.ToLower().Contains(search)) ||
                (p.Correo != null && p.Correo.ToLower().Contains(search)));
        }

        // Ordenamiento
        query = request.SortBy?.ToLower() switch
        {
            "rnc" => request.IsDescending ? query.OrderByDescending(p => p.Rnc) : query.OrderBy(p => p.Rnc),
            "nombre" or "nombrecomercial" => request.IsDescending ? query.OrderByDescending(p => p.NombreComercial) : query.OrderBy(p => p.NombreComercial),
            "plazocredito" => request.IsDescending ? query.OrderByDescending(p => p.PlazoCreditoDias) : query.OrderBy(p => p.PlazoCreditoDias),
            _ => request.IsDescending ? query.OrderBy(p => p.CreadoEn) : query.OrderByDescending(p => p.CreadoEn)
        };

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((request.PageIndex - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new ProveedorDto
            {
                Id = p.Id,
                Rnc = p.Rnc,
                NombreComercial = p.NombreComercial,
                RazonSocial = p.RazonSocial,
                ContactoNombre = p.ContactoNombre,
                Telefono = p.Telefono,
                Correo = p.Correo,
                Direccion = p.Direccion,
                PlazoCreditoDias = p.PlazoCreditoDias,
                Activo = p.Activo,
                CreadoEn = p.CreadoEn,
                ActualizadoEn = p.ActualizadoEn,
                ActivosSuministradosCount = p.ActivosSuministrados.Count()
            })
            .ToListAsync(ct);

        return PagedResult<ProveedorDto>.Create(items, totalCount, request.PageIndex, request.PageSize);
    }

    public async Task<ProveedorDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default)
    {
        var p = await _context.Proveedores
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (p == null) return null;

        return new ProveedorDto
        {
            Id = p.Id,
            Rnc = p.Rnc,
            NombreComercial = p.NombreComercial,
            RazonSocial = p.RazonSocial,
            ContactoNombre = p.ContactoNombre,
            Telefono = p.Telefono,
            Correo = p.Correo,
            Direccion = p.Direccion,
            PlazoCreditoDias = p.PlazoCreditoDias,
            Activo = p.Activo,
            CreadoEn = p.CreadoEn,
            ActualizadoEn = p.ActualizadoEn,
            ActivosSuministradosCount = p.ActivosSuministrados.Count
        };
    }

    public async Task<ProveedorDto> CrearAsync(CrearProveedorDto dto, CancellationToken ct = default)
    {
        var rncLimpio = dto.Rnc.Trim().Replace("-", "");

        if (!System.Text.RegularExpressions.Regex.IsMatch(rncLimpio, @"^[0-9]{9,11}$"))
        {
            throw new InvalidOperationException("El RNC debe contener exclusivamente entre 9 y 11 dígitos numéricos sin guiones.");
        }

        var existeRnc = await _context.Proveedores
            .AnyAsync(p => p.Rnc == rncLimpio, ct);

        if (existeRnc)
        {
            throw new InvalidOperationException($"Ya existe un proveedor registrado con el RNC/Cédula '{rncLimpio}'.");
        }

        var proveedor = new Proveedor
        {
            Id = Guid.NewGuid(),
            Rnc = rncLimpio,
            NombreComercial = dto.NombreComercial.Trim(),
            RazonSocial = dto.RazonSocial?.Trim(),
            ContactoNombre = dto.ContactoNombre?.Trim(),
            Telefono = dto.Telefono?.Trim(),
            Correo = dto.Correo?.Trim().ToLowerInvariant(),
            Direccion = dto.Direccion?.Trim(),
            PlazoCreditoDias = dto.PlazoCreditoDias,
            Activo = dto.Activo,
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };

        _context.Proveedores.Add(proveedor);
        await _context.SaveChangesAsync(ct);

        return await ObtenerPorIdAsync(proveedor.Id, ct) ?? new ProveedorDto
        {
            Id = proveedor.Id,
            Rnc = proveedor.Rnc,
            NombreComercial = proveedor.NombreComercial,
            Activo = proveedor.Activo
        };
    }

    public async Task<ProveedorDto?> ActualizarAsync(Guid id, ActualizarProveedorDto dto, CancellationToken ct = default)
    {
        var proveedor = await _context.Proveedores
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (proveedor == null) return null;

        var rncLimpio = dto.Rnc.Trim().Replace("-", "");

        if (!System.Text.RegularExpressions.Regex.IsMatch(rncLimpio, @"^[0-9]{9,11}$"))
        {
            throw new InvalidOperationException("El RNC debe contener exclusivamente entre 9 y 11 dígitos numéricos sin guiones.");
        }

        var rncDuplicado = await _context.Proveedores
            .AnyAsync(p => p.Id != id && p.Rnc == rncLimpio, ct);

        if (rncDuplicado)
        {
            throw new InvalidOperationException($"Ya existe otro proveedor registrado con el RNC/Cédula '{rncLimpio}'.");
        }

        proveedor.Rnc = rncLimpio;
        proveedor.NombreComercial = dto.NombreComercial.Trim();
        proveedor.RazonSocial = dto.RazonSocial?.Trim();
        proveedor.ContactoNombre = dto.ContactoNombre?.Trim();
        proveedor.Telefono = dto.Telefono?.Trim();
        proveedor.Correo = dto.Correo?.Trim().ToLowerInvariant();
        proveedor.Direccion = dto.Direccion?.Trim();
        proveedor.PlazoCreditoDias = dto.PlazoCreditoDias;
        proveedor.Activo = dto.Activo;
        proveedor.ActualizadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return await ObtenerPorIdAsync(id, ct);
    }

    public async Task<bool> CambiarEstadoAsync(Guid id, bool activo, CancellationToken ct = default)
    {
        var proveedor = await _context.Proveedores
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (proveedor == null) return false;

        proveedor.Activo = activo;
        proveedor.ActualizadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return true;
    }
}
