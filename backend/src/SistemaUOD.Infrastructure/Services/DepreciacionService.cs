using System.Text;
using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class DepreciacionService : IDepreciacionService
{
    private readonly IApplicationDbContext _context;
    private const int VidaUtilMesesComputoDgii = 48; // 4 años según DGII Cat. 2
    private const decimal TasaAnualComputoDgii = 25.00m;
    private const decimal PorcentajeValorResidual = 0.05m; // 5% valor de desecho

    public DepreciacionService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CalculoDepreciacionActivoDto?> CalcularDepreciacionActivoAsync(
        Guid activoId,
        DateOnly? fechaCorte = null,
        CancellationToken ct = default)
    {
        var activo = await _context.ActivosSerie
            .AsNoTracking()
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .FirstOrDefaultAsync(a => a.Id == activoId, ct);

        if (activo == null) return null;

        var corte = fechaCorte ?? DateOnly.FromDateTime(DateTime.UtcNow);
        return CalcularDepreciacion(activo, corte);
    }

    public async Task<TablaAmortizacionActivoDto?> GenerarTablaAmortizacionAsync(
        Guid activoId,
        CancellationToken ct = default)
    {
        var activo = await _context.ActivosSerie
            .AsNoTracking()
            .Include(a => a.Recurso)
            .FirstOrDefaultAsync(a => a.Id == activoId, ct);

        if (activo == null) return null;

        var costo = activo.Recurso.CostoEstimado;
        var valorResidual = Math.Round(costo * PorcentajeValorResidual, 2);
        var baseDepreciable = Math.Max(0, costo - valorResidual);
        var depreciacionMensual = Math.Round(baseDepreciable / VidaUtilMesesComputoDgii, 2);
        var fechaInicio = activo.FechaAdquisicion ?? DateOnly.FromDateTime(activo.CreadoEn);

        var periodos = new List<PeriodoAmortizacionDto>();
        decimal acumulada = 0;

        for (int i = 1; i <= VidaUtilMesesComputoDgii; i++)
        {
            var fechaPeriodo = fechaInicio.AddMonths(i);
            decimal cuota;

            if (i == VidaUtilMesesComputoDgii)
            {
                // En el último periodo se ajusta para cerrar exactamente en el valor residual
                cuota = baseDepreciable - acumulada;
            }
            else
            {
                cuota = Math.Min(depreciacionMensual, baseDepreciable - acumulada);
            }

            acumulada += cuota;
            var valorLibros = Math.Max(valorResidual, costo - acumulada);
            var pct = costo > 0 ? Math.Round((acumulada / costo) * 100, 2) : 100;

            periodos.Add(new PeriodoAmortizacionDto
            {
                PeriodoNumero = i,
                Anio = fechaPeriodo.Year,
                Mes = fechaPeriodo.Month,
                DepreciacionPeriodo = cuota,
                DepreciacionAcumulada = acumulada,
                ValorEnLibrosFinPeriodo = valorLibros,
                PorcentajeAmortizado = pct
            });
        }

        var calculoActual = CalcularDepreciacion(activo, DateOnly.FromDateTime(DateTime.UtcNow));

        return new TablaAmortizacionActivoDto
        {
            ActivoId = activo.Id,
            PlacaInstitucional = activo.PlacaInstitucional ?? "S/P",
            RecursoNombre = activo.Recurso.Nombre,
            CostoAdquisicion = costo,
            ValorResidual = valorResidual,
            ValorEnLibrosActual = calculoActual.ValorEnLibros,
            TasaAnualPorcentaje = TasaAnualComputoDgii,
            TotalPeriodosMeses = VidaUtilMesesComputoDgii,
            Periodos = periodos
        };
    }

    public async Task<PagedResult<CalculoDepreciacionActivoDto>> ListarDepreciacionesAsync(
        FiltroDepreciacionDto filtros,
        CancellationToken ct = default)
    {
        var corte = filtros.FechaCorte ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var query = _context.ActivosSerie
            .AsNoTracking()
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .AsQueryable();

        if (filtros.CategoriaId.HasValue)
        {
            query = query.Where(a => a.Recurso.CategoriaId == filtros.CategoriaId.Value);
        }

        if (filtros.UbicacionId.HasValue)
        {
            query = query.Where(a => a.UbicacionId == filtros.UbicacionId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Search))
        {
            var search = filtros.Search.Trim().ToLower();
            query = query.Where(a =>
                (a.PlacaInstitucional != null && a.PlacaInstitucional.ToLower().Contains(search)) ||
                a.NumeroSerie.ToLower().Contains(search) ||
                a.Recurso.Nombre.ToLower().Contains(search) ||
                a.Ubicacion.Nombre.ToLower().Contains(search));
        }

        var activos = await query.ToListAsync(ct);

        // Realizar cómputo de depreciación en memoria para cada activo
        var calculos = activos.Select(a => CalcularDepreciacion(a, corte));

        if (filtros.SoloConValorEnLibros == true)
        {
            calculos = calculos.Where(c => !c.TotalmenteDepreciado && c.ValorEnLibros > c.ValorResidual);
        }

        if (filtros.SoloTotalmenteDepreciados == true)
        {
            calculos = calculos.Where(c => c.TotalmenteDepreciado);
        }

        var listaCalculos = calculos.ToList();
        var totalCount = listaCalculos.Count;

        var itemsPaginados = listaCalculos
            .Skip((filtros.PageIndex - 1) * filtros.PageSize)
            .Take(filtros.PageSize)
            .ToList();

        return PagedResult<CalculoDepreciacionActivoDto>.Create(
            itemsPaginados,
            totalCount,
            filtros.PageIndex,
            filtros.PageSize);
    }

    public async Task<ResumenDepreciacionContableDto> ObtenerResumenContableAsync(
        DateOnly? fechaCorte = null,
        CancellationToken ct = default)
    {
        var corte = fechaCorte ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var activos = await _context.ActivosSerie
            .AsNoTracking()
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .ToListAsync(ct);

        var calculos = activos.Select(a => CalcularDepreciacion(a, corte)).ToList();

        var totalHistorico = calculos.Sum(c => c.CostoAdquisicion);
        var totalDepreciado = calculos.Sum(c => c.DepreciacionAcumulada);
        var totalNeto = calculos.Sum(c => c.ValorEnLibros);

        var desglose = calculos
            .GroupBy(c => c.CategoriaNombre)
            .Select(g => new ResumenCategoriaDepreciacionDto
            {
                CategoriaNombre = g.Key,
                CantidadEquipos = g.Count(),
                ValorHistoricoDop = g.Sum(x => x.CostoAdquisicion),
                DepreciacionAcumuladaDop = g.Sum(x => x.DepreciacionAcumulada),
                ValorEnLibrosDop = g.Sum(x => x.ValorEnLibros)
            })
            .OrderByDescending(d => d.ValorHistoricoDop)
            .ToList();

        return new ResumenDepreciacionContableDto
        {
            FechaCorte = corte.ToDateTime(TimeOnly.MinValue),
            TotalActivosComputados = calculos.Count,
            ActivosEnProcesoDepreciacion = calculos.Count(c => !c.TotalmenteDepreciado),
            ActivosTotalmenteDepreciados = calculos.Count(c => c.TotalmenteDepreciado),
            ValorTotalHistoricoDop = totalHistorico,
            DepreciacionTotalAcumuladaDop = totalDepreciado,
            ValorNetoEnLibrosTotalDop = totalNeto,
            DesgloseCategorias = desglose
        };
    }

    public async Task<byte[]> ExportarDepreciacionCsvAsync(
        FiltroDepreciacionDto filtros,
        CancellationToken ct = default)
    {
        var corte = filtros.FechaCorte ?? DateOnly.FromDateTime(DateTime.UtcNow);
        filtros.PageSize = 5000;
        var paged = await ListarDepreciacionesAsync(filtros, ct);

        var sb = new StringBuilder();
        // BOM UTF-8 para compatibilidad perfecta con Microsoft Excel en español
        sb.Append('\uFEFF');

        sb.AppendLine("Placa Institucional;Numero Serie;Recurso / Modelo;Categoria;Ubicacion;Custodio;Fecha Adquisicion;Meses Transcurridos;Meses Restantes;Costo Adquisicion (DOP);Depreciacion Acumulada (DOP);Valor en Libros (DOP);% Amortizado;Estado Contable");

        foreach (var item in paged.Items)
        {
            var placa = item.PlacaInstitucional.Replace(";", ",");
            var serie = item.NumeroSerie.Replace(";", ",");
            var modelo = item.RecursoNombre.Replace(";", ",");
            var cat = item.CategoriaNombre.Replace(";", ",");
            var ub = item.UbicacionNombre.Replace(";", ",");
            var cust = (item.CustodioNombre ?? "Sin Custodio").Replace(";", ",");

            sb.AppendLine($"{placa};{serie};{modelo};{cat};{ub};{cust};{item.FechaInicioDepreciacion:yyyy-MM-dd};{item.MesesTranscurridos};{item.MesesVidaUtilRestante};{item.CostoAdquisicion:F2};{item.DepreciacionAcumulada:F2};{item.ValorEnLibros:F2};{item.PorcentajeDepreciado:F2}%;{item.EstadoContable}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static CalculoDepreciacionActivoDto CalcularDepreciacion(ActivoSerie a, DateOnly fechaCorte)
    {
        var costo = a.Recurso.CostoEstimado;
        var valorResidual = Math.Round(costo * PorcentajeValorResidual, 2);
        var baseDepreciable = Math.Max(0, costo - valorResidual);
        var depreciacionMensual = Math.Round(baseDepreciable / VidaUtilMesesComputoDgii, 2);

        var fechaInicio = a.FechaAdquisicion ?? DateOnly.FromDateTime(a.CreadoEn);

        // Calcular meses transcurridos
        var mesesTranscurridos = ((fechaCorte.Year - fechaInicio.Year) * 12) + (fechaCorte.Month - fechaInicio.Month);
        if (fechaCorte.Day < fechaInicio.Day)
        {
            mesesTranscurridos--;
        }
        mesesTranscurridos = Math.Max(0, mesesTranscurridos);

        decimal depreciacionAcumulada;
        if (mesesTranscurridos >= VidaUtilMesesComputoDgii)
        {
            depreciacionAcumulada = baseDepreciable;
        }
        else
        {
            depreciacionAcumulada = Math.Min(baseDepreciable, Math.Round(depreciacionMensual * mesesTranscurridos, 2));
        }

        var valorEnLibros = Math.Max(valorResidual, costo - depreciacionAcumulada);
        var mesesRestantes = Math.Max(0, VidaUtilMesesComputoDgii - mesesTranscurridos);
        var pct = costo > 0 ? Math.Round((depreciacionAcumulada / costo) * 100, 2) : 100;

        string estadoContable;
        if (a.Estado == "baja")
        {
            estadoContable = "baja";
        }
        else if (mesesRestantes == 0 || valorEnLibros <= valorResidual)
        {
            estadoContable = "totalmente_depreciado";
        }
        else
        {
            estadoContable = "activo";
        }

        return new CalculoDepreciacionActivoDto
        {
            ActivoId = a.Id,
            PlacaInstitucional = a.PlacaInstitucional ?? "S/P",
            NumeroSerie = a.NumeroSerie,
            RecursoNombre = a.Recurso.Nombre,
            RecursoSku = a.Recurso.Sku,
            CategoriaNombre = a.Recurso.Categoria?.Nombre ?? "Tecnología",
            UbicacionNombre = a.Ubicacion?.Nombre ?? "Sin Asignar",
            CustodioNombre = a.Responsable?.NombreCompleto,
            CategoriaDgii = "Categoría 2 (Equipos de Datos y Cómputo - 25% anual)",
            TasaAnualPorcentaje = TasaAnualComputoDgii,
            VidaUtilMesesTotal = VidaUtilMesesComputoDgii,
            CostoAdquisicion = costo,
            ValorResidual = valorResidual,
            DepreciacionMensual = depreciacionMensual,
            DepreciacionAcumulada = depreciacionAcumulada,
            ValorEnLibros = valorEnLibros,
            PorcentajeDepreciado = pct,
            FechaInicioDepreciacion = fechaInicio,
            FechaCorteCalculo = fechaCorte,
            MesesTranscurridos = mesesTranscurridos,
            MesesVidaUtilRestante = mesesRestantes,
            EstadoContable = estadoContable
        };
    }
}
