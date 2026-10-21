using SistemaUOD.Application.Common.Models;

namespace SistemaUOD.Application.DTOs;

public class CalculoDepreciacionActivoDto
{
    public Guid ActivoId { get; set; }
    public string PlacaInstitucional { get; set; } = string.Empty;
    public string NumeroSerie { get; set; } = string.Empty;
    public string RecursoNombre { get; set; } = string.Empty;
    public string RecursoSku { get; set; } = string.Empty;
    public string CategoriaNombre { get; set; } = string.Empty;
    public string UbicacionNombre { get; set; } = string.Empty;
    public string? CustodioNombre { get; set; }

    // Parámetros Fiscales DGII / NIIF
    public string CategoriaDgii { get; set; } = "Categoría 2 (Equipos de Datos y Cómputo - 25% anual)";
    public decimal TasaAnualPorcentaje { get; set; } = 25.00m;
    public int VidaUtilMesesTotal { get; set; } = 48; // 4 años

    // Valores Monetarios (DOP)
    public decimal CostoAdquisicion { get; set; }
    public decimal ValorResidual { get; set; }
    public decimal BaseDepreciable => Math.Max(0, CostoAdquisicion - ValorResidual);
    public decimal DepreciacionMensual { get; set; }
    public decimal DepreciacionAcumulada { get; set; }
    public decimal ValorEnLibros { get; set; }
    public decimal PorcentajeDepreciado { get; set; }

    // Fechas y Tiempos
    public DateOnly FechaInicioDepreciacion { get; set; }
    public DateOnly FechaCorteCalculo { get; set; }
    public int MesesTranscurridos { get; set; }
    public int MesesVidaUtilRestante { get; set; }

    // Estado Contable
    public string EstadoContable { get; set; } = "activo"; // activo, totalmente_depreciado, baja
    public bool TotalmenteDepreciado => ValorEnLibros <= ValorResidual || MesesVidaUtilRestante == 0;
}

public class PeriodoAmortizacionDto
{
    public int PeriodoNumero { get; set; }
    public int Anio { get; set; }
    public int Mes { get; set; }
    public string PeriodoTexto => $"{Anio}-{Mes:D2}";
    public decimal DepreciacionPeriodo { get; set; }
    public decimal DepreciacionAcumulada { get; set; }
    public decimal ValorEnLibrosFinPeriodo { get; set; }
    public decimal PorcentajeAmortizado { get; set; }
}

public class TablaAmortizacionActivoDto
{
    public Guid ActivoId { get; set; }
    public string PlacaInstitucional { get; set; } = string.Empty;
    public string RecursoNombre { get; set; } = string.Empty;
    public decimal CostoAdquisicion { get; set; }
    public decimal ValorResidual { get; set; }
    public decimal ValorEnLibrosActual { get; set; }
    public decimal TasaAnualPorcentaje { get; set; } = 25.00m;
    public int TotalPeriodosMeses { get; set; } = 48;
    public List<PeriodoAmortizacionDto> Periodos { get; set; } = new();
}

public class ResumenDepreciacionContableDto
{
    public DateTime FechaCorte { get; set; } = DateTime.UtcNow;
    public int TotalActivosComputados { get; set; }
    public int ActivosEnProcesoDepreciacion { get; set; }
    public int ActivosTotalmenteDepreciados { get; set; }
    public decimal ValorTotalHistoricoDop { get; set; }
    public decimal DepreciacionTotalAcumuladaDop { get; set; }
    public decimal ValorNetoEnLibrosTotalDop { get; set; }
    public decimal PorcentajeDepreciacionGlobal => ValorTotalHistoricoDop > 0
        ? Math.Round((DepreciacionTotalAcumuladaDop / ValorTotalHistoricoDop) * 100, 2)
        : 0;

    // Desglose por categoría tecnológica
    public List<ResumenCategoriaDepreciacionDto> DesgloseCategorias { get; set; } = new();
}

public class ResumenCategoriaDepreciacionDto
{
    public string CategoriaNombre { get; set; } = string.Empty;
    public int CantidadEquipos { get; set; }
    public decimal ValorHistoricoDop { get; set; }
    public decimal DepreciacionAcumuladaDop { get; set; }
    public decimal ValorEnLibrosDop { get; set; }
}

public class FiltroDepreciacionDto : PagedRequest
{
    public DateOnly? FechaCorte { get; set; }
    public Guid? CategoriaId { get; set; }
    public Guid? UbicacionId { get; set; }
    public bool? SoloConValorEnLibros { get; set; }
    public bool? SoloTotalmenteDepreciados { get; set; }
}
