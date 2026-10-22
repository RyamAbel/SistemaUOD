using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class ConteoFisicoService : IConteoFisicoService
{
    private readonly IApplicationDbContext _db;
    private readonly IMovimientoService _movimientoService;

    public ConteoFisicoService(
        IApplicationDbContext db,
        IMovimientoService movimientoService)
    {
        _db = db;
        _movimientoService = movimientoService;
    }

    public async Task<PagedResult<ConteoFisicoDto>> ListarConteosAsync(
        ConteoFisicoFiltrosDto filtros,
        CancellationToken ct = default)
    {
        var query = _db.ConteosFisicos
            .Include(c => c.Ubicacion)
            .Include(c => c.Responsable)
            .Include(c => c.Lineas)
                .ThenInclude(l => l.Recurso)
            .Include(c => c.Lineas)
                .ThenInclude(l => l.Lote)
            .Include(c => c.Lineas)
                .ThenInclude(l => l.AjusteMovimiento)
            .AsNoTracking()
            .AsQueryable();

        if (filtros.UbicacionId.HasValue)
        {
            query = query.Where(c => c.UbicacionId == filtros.UbicacionId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Estado))
        {
            var estado = filtros.Estado.Trim().ToLower();
            query = query.Where(c => c.Estado.ToLower() == estado);
        }

        if (filtros.FechaDesde.HasValue)
        {
            query = query.Where(c => c.FechaInicio >= filtros.FechaDesde.Value);
        }

        if (filtros.FechaHasta.HasValue)
        {
            query = query.Where(c => c.FechaInicio <= filtros.FechaHasta.Value);
        }

        var totalItems = await query.CountAsync(ct);

        var page = filtros.Page < 1 ? 1 : filtros.Page;
        var pageSize = filtros.PageSize < 1 ? 20 : filtros.PageSize;

        var conteos = await query
            .OrderByDescending(c => c.FechaInicio)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = conteos.Select(MapearADto).ToList();

        return PagedResult<ConteoFisicoDto>.Create(items, totalItems, page, pageSize);
    }

    public async Task<ConteoFisicoDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default)
    {
        var conteo = await _db.ConteosFisicos
            .Include(c => c.Ubicacion)
            .Include(c => c.Responsable)
            .Include(c => c.Lineas)
                .ThenInclude(l => l.Recurso)
            .Include(c => c.Lineas)
                .ThenInclude(l => l.Lote)
            .Include(c => c.Lineas)
                .ThenInclude(l => l.AjusteMovimiento)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        return conteo == null ? null : MapearADto(conteo);
    }

    public async Task<ConteoFisicoDto> IniciarConteoAsync(
        IniciarConteoFisicoDto dto,
        Guid usuarioId,
        CancellationToken ct = default)
    {
        // 1. Validar ubicación activa
        var ubicacion = await _db.Ubicaciones
            .FirstOrDefaultAsync(u => u.Id == dto.UbicacionId && u.Activa, ct);

        if (ubicacion == null)
        {
            throw new InvalidOperationException("La ubicación a auditar no existe o está inactiva.");
        }

        // 2. Verificar que no haya otro conteo abierto en la misma ubicación
        var tieneConteoAbierto = await _db.ConteosFisicos
            .AnyAsync(c => c.UbicacionId == dto.UbicacionId && c.Estado == "abierto", ct);

        if (tieneConteoAbierto)
        {
            throw new InvalidOperationException(
                $"Ya existe un conteo físico abierto para la ubicación '{ubicacion.Nombre}'. Finalícelo o concílielo antes de iniciar otro.");
        }

        var nuevoConteo = new ConteoFisico
        {
            Id = Guid.NewGuid(),
            UbicacionId = dto.UbicacionId,
            ResponsableId = usuarioId,
            FechaInicio = DateTime.UtcNow,
            Estado = "abierto",
            Observaciones = dto.Observaciones?.Trim(),
            CreadoEn = DateTime.UtcNow
        };

        // 3. Precargar existencias si se solicitó
        if (dto.PrecargarExistenciasSistema)
        {
            var existencias = await _db.Existencias
                .Where(e => e.UbicacionId == dto.UbicacionId && e.Cantidad > 0)
                .AsNoTracking()
                .ToListAsync(ct);

            foreach (var ex in existencias)
            {
                nuevoConteo.Lineas.Add(new ConteoLinea
                {
                    Id = Guid.NewGuid(),
                    ConteoId = nuevoConteo.Id,
                    RecursoId = ex.RecursoId,
                    LoteId = ex.LoteId,
                    CantidadSistema = ex.Cantidad,
                    CantidadFisica = 0,
                    Diferencia = -ex.Cantidad,
                    Notas = "Carga inicial desde existencias del sistema"
                });
            }
        }

        _db.ConteosFisicos.Add(nuevoConteo);
        await _db.SaveChangesAsync(ct);

        return (await ObtenerPorIdAsync(nuevoConteo.Id, ct))!;
    }

    public async Task<ConteoFisicoDto> SincronizarLineasAsync(
        Guid conteoId,
        SincronizarConteosDto dto,
        Guid usuarioId,
        CancellationToken ct = default)
    {
        var conteo = await _db.ConteosFisicos
            .Include(c => c.Lineas)
            .FirstOrDefaultAsync(c => c.Id == conteoId, ct);

        if (conteo == null)
        {
            throw new KeyNotFoundException($"No se encontró el conteo físico con ID '{conteoId}'.");
        }

        if (conteo.Estado != "abierto")
        {
            throw new InvalidOperationException("Solo se pueden actualizar o sincronizar conteos en estado 'abierto'.");
        }

        foreach (var item in dto.Lineas)
        {
            var lineaExistente = conteo.Lineas
                .FirstOrDefault(l => l.RecursoId == item.RecursoId && l.LoteId == item.LoteId);

            if (lineaExistente != null)
            {
                lineaExistente.CantidadFisica = item.CantidadFisica;
                lineaExistente.Diferencia = item.CantidadFisica - lineaExistente.CantidadSistema;
                if (!string.IsNullOrWhiteSpace(item.Notas))
                {
                    lineaExistente.Notas = item.Notas.Trim();
                }
            }
            else
            {
                // Insumo encontrado en ubicación sin stock previo en sistema
                conteo.Lineas.Add(new ConteoLinea
                {
                    Id = Guid.NewGuid(),
                    ConteoId = conteo.Id,
                    RecursoId = item.RecursoId,
                    LoteId = item.LoteId,
                    CantidadSistema = 0,
                    CantidadFisica = item.CantidadFisica,
                    Diferencia = item.CantidadFisica,
                    Notas = item.Notas?.Trim() ?? "Insumo físico detectado sin existencias previas en sistema"
                });
            }
        }

        await _db.SaveChangesAsync(ct);
        return (await ObtenerPorIdAsync(conteo.Id, ct))!;
    }

    public async Task<ConteoFisicoDto> EscanearItemAsync(
        Guid conteoId,
        EscanearItemConteoDto dto,
        Guid usuarioId,
        CancellationToken ct = default)
    {
        var conteo = await _db.ConteosFisicos
            .Include(c => c.Lineas)
            .FirstOrDefaultAsync(c => c.Id == conteoId, ct);

        if (conteo == null)
        {
            throw new KeyNotFoundException($"No se encontró el conteo físico con ID '{conteoId}'.");
        }

        if (conteo.Estado != "abierto")
        {
            throw new InvalidOperationException("Solo se pueden registrar lecturas en conteos en estado 'abierto'.");
        }

        var codigoBuscado = dto.Codigo.Trim();

        // 1. Resolver recurso: SKU, código de barras/QR o serie institucional
        var recurso = await _db.Recursos
            .FirstOrDefaultAsync(r => r.Sku.ToLower() == codigoBuscado.ToLower() && r.Activo, ct);

        if (recurso == null)
        {
            var rc = await _db.RecursosCodigos
                .Include(c => c.Recurso)
                .FirstOrDefaultAsync(c => c.Codigo == codigoBuscado && c.Recurso.Activo, ct);
            recurso = rc?.Recurso;
        }

        if (recurso == null)
        {
            var activo = await _db.ActivosSerie
                .Include(a => a.Recurso)
                .FirstOrDefaultAsync(a => (a.NumeroSerie == codigoBuscado || a.PlacaInstitucional == codigoBuscado) && a.Recurso.Activo, ct);
            recurso = activo?.Recurso;
        }

        if (recurso == null)
        {
            throw new InvalidOperationException($"No se encontró ningún recurso activo con el código '{codigoBuscado}'.");
        }

        var incremento = dto.CantidadSumar <= 0 ? 1 : dto.CantidadSumar;

        // Buscar línea existente
        var linea = conteo.Lineas.FirstOrDefault(l => l.RecursoId == recurso.Id);
        if (linea != null)
        {
            linea.CantidadFisica += incremento;
            linea.Diferencia = linea.CantidadFisica - linea.CantidadSistema;
            if (!string.IsNullOrWhiteSpace(dto.Notas))
            {
                linea.Notas = dto.Notas.Trim();
            }
        }
        else
        {
            // Obtener stock actual de existencias en el sistema para esta ubicación
            var existencia = await _db.Existencias
                .FirstOrDefaultAsync(e => e.UbicacionId == conteo.UbicacionId && e.RecursoId == recurso.Id, ct);
            var cantSistema = existencia?.Cantidad ?? 0;

            conteo.Lineas.Add(new ConteoLinea
            {
                Id = Guid.NewGuid(),
                ConteoId = conteo.Id,
                RecursoId = recurso.Id,
                CantidadSistema = cantSistema,
                CantidadFisica = incremento,
                Diferencia = incremento - cantSistema,
                Notas = dto.Notas?.Trim() ?? "Escaneado con cámara PWA"
            });
        }

        await _db.SaveChangesAsync(ct);
        return (await ObtenerPorIdAsync(conteo.Id, ct))!;
    }

    public async Task<ConteoFisicoDto> ConciliarConteoAsync(
        Guid conteoId,
        ConciliarConteoDto dto,
        Guid usuarioId,
        CancellationToken ct = default)
    {
        var conteo = await _db.ConteosFisicos
            .Include(c => c.Ubicacion)
            .Include(c => c.Lineas)
                .ThenInclude(l => l.Recurso)
            .FirstOrDefaultAsync(c => c.Id == conteoId, ct);

        if (conteo == null)
        {
            throw new KeyNotFoundException($"No se encontró el conteo físico con ID '{conteoId}'.");
        }

        if (conteo.Estado != "abierto")
        {
            throw new InvalidOperationException("Solo se pueden conciliar conteos en estado 'abierto'.");
        }

        // Líneas con discrepancias
        var sobrantes = conteo.Lineas.Where(l => l.Diferencia > 0).ToList();
        var faltantes = conteo.Lineas.Where(l => l.Diferencia < 0).ToList();

        // 1. Ajuste positivo para sobrantes (incrementa inventario en ubicación)
        if (sobrantes.Count > 0)
        {
            var movSobrantes = new CrearMovimientoDto
            {
                Tipo = "ajuste",
                OrigenUbicacionId = null,
                DestinoUbicacionId = conteo.UbicacionId,
                Motivo = $"Ajuste positivo por conciliación de conteo físico en {conteo.Ubicacion.Nombre}. {dto.Observaciones}".Trim(),
                Lineas = sobrantes.Select(s => new CrearMovimientoLineaDto
                {
                    RecursoId = s.RecursoId,
                    LoteId = s.LoteId,
                    Cantidad = s.Diferencia,
                    CostoUnitario = s.Recurso?.CostoEstimado ?? 0
                }).ToList()
            };

            var resSobrantes = await _movimientoService.RegistrarMovimientoAsync(movSobrantes, usuarioId, null, ct);
            foreach (var s in sobrantes)
            {
                s.AjusteMovimientoId = resSobrantes.Id;
            }
        }

        // 2. Ajuste negativo para faltantes (reduce inventario de ubicación)
        if (faltantes.Count > 0)
        {
            var movFaltantes = new CrearMovimientoDto
            {
                Tipo = "ajuste",
                OrigenUbicacionId = conteo.UbicacionId,
                DestinoUbicacionId = null,
                Motivo = $"Ajuste negativo por faltante en conteo físico en {conteo.Ubicacion.Nombre}. {dto.Observaciones}".Trim(),
                Lineas = faltantes.Select(f => new CrearMovimientoLineaDto
                {
                    RecursoId = f.RecursoId,
                    LoteId = f.LoteId,
                    Cantidad = Math.Abs(f.Diferencia),
                    CostoUnitario = f.Recurso?.CostoEstimado ?? 0
                }).ToList()
            };

            var resFaltantes = await _movimientoService.RegistrarMovimientoAsync(movFaltantes, usuarioId, null, ct);
            foreach (var f in faltantes)
            {
                f.AjusteMovimientoId = resFaltantes.Id;
            }
        }

        conteo.Estado = "conciliado";
        conteo.FechaCierre = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(dto.Observaciones))
        {
            conteo.Observaciones = string.IsNullOrWhiteSpace(conteo.Observaciones)
                ? dto.Observaciones.Trim()
                : $"{conteo.Observaciones} | {dto.Observaciones.Trim()}";
        }

        await _db.SaveChangesAsync(ct);
        return (await ObtenerPorIdAsync(conteo.Id, ct))!;
    }

    public async Task<ConteoFisicoDto> CancelarConteoAsync(
        Guid conteoId,
        string? motivo,
        Guid usuarioId,
        CancellationToken ct = default)
    {
        var conteo = await _db.ConteosFisicos.FirstOrDefaultAsync(c => c.Id == conteoId, ct);

        if (conteo == null)
        {
            throw new KeyNotFoundException($"No se encontró el conteo físico con ID '{conteoId}'.");
        }

        if (conteo.Estado != "abierto")
        {
            throw new InvalidOperationException("Solo se pueden cancelar conteos en estado 'abierto'.");
        }

        conteo.Estado = "cancelado";
        conteo.FechaCierre = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(motivo))
        {
            conteo.Observaciones = string.IsNullOrWhiteSpace(conteo.Observaciones)
                ? motivo.Trim()
                : $"{conteo.Observaciones} | {motivo.Trim()}";
        }

        await _db.SaveChangesAsync(ct);
        return (await ObtenerPorIdAsync(conteo.Id, ct))!;
    }

    private static ConteoFisicoDto MapearADto(ConteoFisico c)
    {
        var lineas = c.Lineas.Select(l => new ConteoLineaDto
        {
            Id = l.Id,
            ConteoId = l.ConteoId,
            RecursoId = l.RecursoId,
            RecursoSku = l.Recurso?.Sku ?? string.Empty,
            RecursoNombre = l.Recurso?.Nombre ?? string.Empty,
            RecursoTipo = l.Recurso?.Tipo ?? "consumible",
            UnidadMedida = l.Recurso?.UnidadMedida ?? "unidad",
            LoteId = l.LoteId,
            NumeroLote = l.Lote?.NumeroLote,
            FechaVencimiento = l.Lote?.FechaVencimiento,
            CantidadSistema = l.CantidadSistema,
            CantidadFisica = l.CantidadFisica,
            Diferencia = l.Diferencia,
            AjusteMovimientoId = l.AjusteMovimientoId,
            AjusteMovimientoNumero = l.AjusteMovimiento?.NumeroMovimiento,
            Notas = l.Notas
        }).ToList();

        var totalSistema = lineas.Sum(l => l.CantidadSistema);
        var totalFisico = lineas.Sum(l => l.CantidadFisica);
        var totalDiscrepancias = lineas.Count(l => l.Diferencia != 0);

        return new ConteoFisicoDto
        {
            Id = c.Id,
            UbicacionId = c.UbicacionId,
            UbicacionNombre = c.Ubicacion?.Nombre ?? string.Empty,
            UbicacionCodigo = c.Ubicacion?.Codigo ?? string.Empty,
            ResponsableId = c.ResponsableId,
            ResponsableNombre = c.Responsable?.NombreCompleto ?? string.Empty,
            ResponsableCorreo = c.Responsable?.Correo ?? string.Empty,
            FechaInicio = c.FechaInicio,
            FechaCierre = c.FechaCierre,
            Estado = c.Estado,
            Observaciones = c.Observaciones,
            TotalLineas = lineas.Count,
            TotalUnidadesSistema = totalSistema,
            TotalUnidadesFisicas = totalFisico,
            TotalDiscrepancias = totalDiscrepancias,
            CreadoEn = c.CreadoEn,
            Lineas = lineas
        };
    }
}
