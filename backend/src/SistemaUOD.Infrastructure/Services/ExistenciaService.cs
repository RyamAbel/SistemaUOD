using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class ExistenciaService : IExistenciaService
{
    private readonly IApplicationDbContext _context;

    public ExistenciaService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ResumenStockRecursoDto>> ObtenerResumenStockAsync(ExistenciaFiltrosDto filtros, CancellationToken ct = default)
    {
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        var umbralVencimiento = hoy.AddDays(30);

        var query = _context.Recursos
            .AsNoTracking()
            .Include(r => r.Categoria)
            .Include(r => r.Existencias)
                .ThenInclude(e => e.Ubicacion)
            .Include(r => r.Existencias)
                .ThenInclude(e => e.Lote)
                    .ThenInclude(l => l!.Proveedor)
            .Include(r => r.ActivosSerie)
                .ThenInclude(a => a.Ubicacion)
            .Include(r => r.ActivosSerie)
                .ThenInclude(a => a.Asignaciones)
            .Where(r => r.Activo)
            .AsQueryable();

        if (filtros.RecursoId.HasValue)
        {
            query = query.Where(r => r.Id == filtros.RecursoId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Search))
        {
            var search = filtros.Search.Trim().ToLower();
            query = query.Where(r =>
                r.Nombre.ToLower().Contains(search) ||
                r.Sku.ToLower().Contains(search) ||
                r.Categoria.Nombre.ToLower().Contains(search));
        }

        if (filtros.UbicacionId.HasValue)
        {
            query = query.Where(r =>
                r.Existencias.Any(e => e.UbicacionId == filtros.UbicacionId.Value) ||
                r.ActivosSerie.Any(a => a.UbicacionId == filtros.UbicacionId.Value));
        }

        var recursos = await query.ToListAsync(ct);

        // Mapear y procesar reglas de inventario RF-12 en memoria
        var listaMapeada = recursos.Select(r =>
        {
            // Stock físico total: suma de existencias para consumibles, o conteo de activos físicos operativos/disponibles para activos fijos
            var stockTotal = r.Tipo == "activo_fijo"
                ? r.ActivosSerie.Count(a => a.Estado != "baja")
                : r.Existencias.Sum(e => e.Cantidad);

            // Stock reservado: activos en préstamo temporal activo o asignados
            var stockReservado = r.Tipo == "activo_fijo"
                ? r.ActivosSerie.Count(a => a.Asignaciones.Any(asig => asig.Estado == "activo" && asig.Tipo == "prestamo_temporal"))
                : 0;

            var stockDisponible = Math.Max(0, stockTotal - stockReservado);

            // Regla RF-12: Estado de stock
            string estadoStock;
            if (stockTotal == 0)
            {
                estadoStock = "agotado";
            }
            else if (stockDisponible <= r.StockMinimo)
            {
                estadoStock = "bajo_minimo";
            }
            else if (r.PuntoReorden.HasValue && stockDisponible <= r.PuntoReorden.Value)
            {
                estadoStock = "reorden";
            }
            else
            {
                estadoStock = "normal";
            }

            // Cantidad sugerida de reposición
            var objetivoReorden = r.StockMaximo ?? (r.StockMinimo > 0 ? r.StockMinimo * 2 : 10);
            var cantidadSugerida = (estadoStock is "bajo_minimo" or "reorden" or "agotado")
                ? Math.Max(0, objetivoReorden - stockDisponible)
                : 0;

            // Análisis de Lotes Clínicos
            var lotesVencidos = 0;
            var lotesProximos = 0;

            var desglosesLotes = r.Existencias
                .Where(e => e.Lote != null)
                .Select(e =>
                {
                    var l = e.Lote!;
                    var vencido = l.FechaVencimiento.HasValue && l.FechaVencimiento.Value < hoy;
                    var proximo = l.FechaVencimiento.HasValue && !vencido && l.FechaVencimiento.Value <= umbralVencimiento;
                    int? dias = l.FechaVencimiento.HasValue
                        ? l.FechaVencimiento.Value.DayNumber - hoy.DayNumber
                        : null;

                    if (vencido) lotesVencidos++;
                    if (proximo) lotesProximos++;

                    return new ExistenciaPorLoteDto
                    {
                        LoteId = l.Id,
                        NumeroLote = l.NumeroLote,
                        FechaVencimiento = l.FechaVencimiento,
                        DiasParaVencer = dias,
                        EstaVencido = vencido,
                        ProximoAVencer = proximo,
                        Cantidad = e.Cantidad,
                        ProveedorNombre = l.Proveedor?.NombreComercial
                    };
                })
                .ToList();

            // Desglose por ubicaciones
            var desglosesUbicaciones = r.Tipo == "activo_fijo"
                ? r.ActivosSerie
                    .GroupBy(a => new { a.UbicacionId, Codigo = a.Ubicacion != null ? a.Ubicacion.Codigo : "UB-N/A", Nombre = a.Ubicacion != null ? a.Ubicacion.Nombre : "Ubicación Asignada" })
                    .Select(g => new ExistenciaPorUbicacionDto
                    {
                        UbicacionId = g.Key.UbicacionId,
                        UbicacionCodigo = g.Key.Codigo,
                        UbicacionNombre = g.Key.Nombre,
                        Cantidad = g.Count(a => a.Estado != "baja"),
                        CantidadDisponible = g.Count(a => a.Estado == "disponible")
                    })
                    .ToList()
                : r.Existencias
                    .GroupBy(e => new { e.UbicacionId, Codigo = e.Ubicacion != null ? e.Ubicacion.Codigo : "UB-N/A", Nombre = e.Ubicacion != null ? e.Ubicacion.Nombre : "Ubicación Asignada" })
                    .Select(g => new ExistenciaPorUbicacionDto
                    {
                        UbicacionId = g.Key.UbicacionId,
                        UbicacionCodigo = g.Key.Codigo,
                        UbicacionNombre = g.Key.Nombre,
                        Cantidad = g.Sum(e => e.Cantidad),
                        CantidadDisponible = g.Sum(e => e.Cantidad)
                    })
                    .ToList();

            return new ResumenStockRecursoDto
            {
                RecursoId = r.Id,
                Sku = r.Sku,
                Nombre = r.Nombre,
                CategoriaNombre = r.Categoria.Nombre,
                UnidadMedida = r.UnidadMedida,
                Tipo = r.Tipo,
                StockTotal = stockTotal,
                StockReservado = stockReservado,
                StockDisponible = stockDisponible,
                StockMinimo = r.StockMinimo,
                StockMaximo = r.StockMaximo,
                PuntoReorden = r.PuntoReorden,
                EstadoStock = estadoStock,
                CantidadSugeridaReorden = cantidadSugerida,
                LotesVencidosCount = lotesVencidos,
                LotesProximosVencerCount = lotesProximos,
                Ubicaciones = desglosesUbicaciones,
                Lotes = desglosesLotes
            };
        });

        // Filtrado por estado si fue solicitado
        if (filtros.SoloStockBajo == true)
        {
            listaMapeada = listaMapeada.Where(s => s.EstadoStock is "bajo_minimo" or "reorden" or "agotado");
        }

        if (filtros.SoloAgotados == true)
        {
            listaMapeada = listaMapeada.Where(s => s.EstadoStock == "agotado");
        }

        if (filtros.ProximosAVencer == true)
        {
            listaMapeada = listaMapeada.Where(s => s.LotesProximosVencerCount > 0 || s.LotesVencidosCount > 0);
        }

        // Ordenamiento
        listaMapeada = (filtros.SortBy?.ToLower(), filtros.IsDescending) switch
        {
            ("nombre", true) => listaMapeada.OrderByDescending(s => s.Nombre),
            ("nombre", false) => listaMapeada.OrderBy(s => s.Nombre),
            ("stock", true) => listaMapeada.OrderByDescending(s => s.StockDisponible),
            ("stock", false) => listaMapeada.OrderBy(s => s.StockDisponible),
            ("sku", true) => listaMapeada.OrderByDescending(s => s.Sku),
            _ => listaMapeada.OrderBy(s => s.Sku)
        };

        var totalItems = listaMapeada.Count();
        var pageIndex = Math.Max(1, filtros.PageIndex);
        var pageSize = Math.Clamp(filtros.PageSize, 1, 100);

        var pagedItems = listaMapeada
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return PagedResult<ResumenStockRecursoDto>.Create(pagedItems, totalItems, pageIndex, pageSize);
    }

    public async Task<ResumenStockRecursoDto?> ObtenerStockPorRecursoAsync(Guid recursoId, CancellationToken ct = default)
    {
        var res = await ObtenerResumenStockAsync(new ExistenciaFiltrosDto { RecursoId = recursoId, PageSize = 1 }, ct);
        return res.Items.FirstOrDefault();
    }

    public async Task<List<ExistenciaDto>> ObtenerExistenciasDetalladasAsync(Guid? recursoId = null, Guid? ubicacionId = null, CancellationToken ct = default)
    {
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        var umbralVencimiento = hoy.AddDays(30);

        var query = _context.Existencias
            .AsNoTracking()
            .Include(e => e.Recurso)
            .Include(e => e.Ubicacion)
            .Include(e => e.Lote)
            .AsQueryable();

        if (recursoId.HasValue)
        {
            query = query.Where(e => e.RecursoId == recursoId.Value);
        }

        if (ubicacionId.HasValue)
        {
            query = query.Where(e => e.UbicacionId == ubicacionId.Value);
        }

        var lista = await query
            .OrderBy(e => e.Recurso.Nombre)
            .ThenBy(e => e.Ubicacion.Nombre)
            .ToListAsync(ct);

        return lista.Select(e =>
        {
            var l = e.Lote;
            var vencido = l?.FechaVencimiento.HasValue == true && l.FechaVencimiento.Value < hoy;
            var proximo = l?.FechaVencimiento.HasValue == true && !vencido && l.FechaVencimiento.Value <= umbralVencimiento;
            int? dias = l?.FechaVencimiento.HasValue == true
                ? l.FechaVencimiento.Value.DayNumber - hoy.DayNumber
                : null;

            return new ExistenciaDto
            {
                Id = e.Id,
                RecursoId = e.RecursoId,
                RecursoSku = e.Recurso.Sku,
                RecursoNombre = e.Recurso.Nombre,
                RecursoTipo = e.Recurso.Tipo,
                UnidadMedida = e.Recurso.UnidadMedida,
                UbicacionId = e.UbicacionId,
                UbicacionCodigo = e.Ubicacion.Codigo,
                UbicacionNombre = e.Ubicacion.Nombre,
                LoteId = e.LoteId,
                NumeroLote = l?.NumeroLote,
                FechaVencimiento = l?.FechaVencimiento,
                DiasParaVencer = dias,
                EstaVencido = vencido,
                ProximoAVencer = proximo,
                Cantidad = e.Cantidad,
                CantidadReservada = 0,
                ActualizadoEn = e.ActualizadoEn
            };
        }).ToList();
    }

    public async Task<List<ResumenStockRecursoDto>> ObtenerAlertasStockBajoAsync(CancellationToken ct = default)
    {
        var res = await ObtenerResumenStockAsync(new ExistenciaFiltrosDto
        {
            SoloStockBajo = true,
            PageSize = 100
        }, ct);

        return res.Items.ToList();
    }

    public async Task<List<ExistenciaDto>> ObtenerAlertasVencimientoAsync(int diasAnticipacion = 30, CancellationToken ct = default)
    {
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        var limite = hoy.AddDays(diasAnticipacion);

        var query = _context.Existencias
            .AsNoTracking()
            .Include(e => e.Recurso)
            .Include(e => e.Ubicacion)
            .Include(e => e.Lote)
            .Where(e => e.Lote != null && e.Lote.FechaVencimiento.HasValue && e.Lote.FechaVencimiento.Value <= limite && e.Cantidad > 0)
            .OrderBy(e => e.Lote!.FechaVencimiento)
            .AsQueryable();

        var lista = await query.ToListAsync(ct);

        return lista.Select(e =>
        {
            var l = e.Lote!;
            var vencido = l.FechaVencimiento!.Value < hoy;
            var proximo = !vencido && l.FechaVencimiento.Value <= limite;

            return new ExistenciaDto
            {
                Id = e.Id,
                RecursoId = e.RecursoId,
                RecursoSku = e.Recurso.Sku,
                RecursoNombre = e.Recurso.Nombre,
                RecursoTipo = e.Recurso.Tipo,
                UnidadMedida = e.Recurso.UnidadMedida,
                UbicacionId = e.UbicacionId,
                UbicacionCodigo = e.Ubicacion.Codigo,
                UbicacionNombre = e.Ubicacion.Nombre,
                LoteId = e.LoteId,
                NumeroLote = l.NumeroLote,
                FechaVencimiento = l.FechaVencimiento,
                DiasParaVencer = l.FechaVencimiento.Value.DayNumber - hoy.DayNumber,
                EstaVencido = vencido,
                ProximoAVencer = proximo,
                Cantidad = e.Cantidad,
                CantidadReservada = 0,
                ActualizadoEn = e.ActualizadoEn
            };
        }).ToList();
    }
}
