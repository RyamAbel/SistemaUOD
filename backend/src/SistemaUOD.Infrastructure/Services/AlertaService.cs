using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class AlertaService : IAlertaService
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailTemplateService _emailTemplateService;

    public AlertaService(IApplicationDbContext context, IEmailTemplateService emailTemplateService)
    {
        _context = context;
        _emailTemplateService = emailTemplateService;
    }

    public async Task<PagedResult<AlertaDto>> ListarAsync(AlertaFiltrosDto filtros, CancellationToken ct = default)
    {
        var query = _context.Alertas
            .AsNoTracking()
            .Include(a => a.Recurso)
            .Include(a => a.Ubicacion)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtros.Tipo))
        {
            var tipoNorm = filtros.Tipo.Trim().ToLower();
            query = query.Where(a => a.Tipo.ToLower() == tipoNorm);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Severidad))
        {
            var sevNorm = filtros.Severidad.Trim().ToLower();
            query = query.Where(a => a.Severidad.ToLower() == sevNorm);
        }

        if (filtros.Leida.HasValue)
        {
            query = query.Where(a => a.Leida == filtros.Leida.Value);
        }

        if (filtros.RecursoId.HasValue)
        {
            query = query.Where(a => a.RecursoId == filtros.RecursoId.Value);
        }

        if (filtros.UbicacionId.HasValue)
        {
            query = query.Where(a => a.UbicacionId == filtros.UbicacionId.Value);
        }

        var total = await query.CountAsync(ct);

        var pagina = filtros.Pagina <= 0 ? 1 : filtros.Pagina;
        var tamano = filtros.TamanoPagina <= 0 ? 20 : filtros.TamanoPagina;

        var items = await query
            .OrderByDescending(a => a.CreadoEn)
            .Skip((pagina - 1) * tamano)
            .Take(tamano)
            .Select(a => MapearDto(a))
            .ToListAsync(ct);

        return PagedResult<AlertaDto>.Create(items, total, pagina, tamano);
    }

    public async Task<AlertaDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default)
    {
        var alerta = await _context.Alertas
            .AsNoTracking()
            .Include(a => a.Recurso)
            .Include(a => a.Ubicacion)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        return alerta == null ? null : MapearDto(alerta);
    }

    public async Task<ResumenAlertasDto> ObtenerResumenAsync(CancellationToken ct = default)
    {
        var noLeidas = await _context.Alertas
            .AsNoTracking()
            .Where(a => !a.Leida)
            .ToListAsync(ct);

        var resumen = new ResumenAlertasDto
        {
            TotalNoLeidas = noLeidas.Count,
            TotalUrgentes = noLeidas.Count(a => a.Severidad.Equals("urgente", StringComparison.OrdinalIgnoreCase)),
            TotalAdvertencias = noLeidas.Count(a => a.Severidad.Equals("advertencia", StringComparison.OrdinalIgnoreCase)),
            TotalInfo = noLeidas.Count(a => a.Severidad.Equals("info", StringComparison.OrdinalIgnoreCase))
        };

        foreach (var grupo in noLeidas.GroupBy(a => a.Tipo.ToLower()))
        {
            resumen.PorTipo[grupo.Key] = grupo.Count();
        }

        return resumen;
    }

    public async Task<int> ObtenerConteoNoLeidasAsync(CancellationToken ct = default)
    {
        return await _context.Alertas
            .AsNoTracking()
            .CountAsync(a => !a.Leida, ct);
    }

    public async Task<bool> MarcarComoLeidaAsync(Guid id, CancellationToken ct = default)
    {
        var alerta = await _context.Alertas.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (alerta == null) return false;

        alerta.Leida = true;
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<int> MarcarTodasComoLeidasAsync(CancellationToken ct = default)
    {
        var noLeidas = await _context.Alertas
            .Where(a => !a.Leida)
            .ToListAsync(ct);

        if (noLeidas.Count == 0) return 0;

        foreach (var a in noLeidas)
        {
            a.Leida = true;
        }

        await _context.SaveChangesAsync(ct);
        return noLeidas.Count;
    }

    public async Task<bool> EliminarAsync(Guid id, CancellationToken ct = default)
    {
        var alerta = await _context.Alertas.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (alerta == null) return false;

        _context.Alertas.Remove(alerta);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<int> LimpiarTodasAlertasAsync(CancellationToken ct = default)
    {
        var todas = await _context.Alertas.ToListAsync(ct);
        if (todas.Count == 0) return 0;

        _context.Alertas.RemoveRange(todas);
        await _context.SaveChangesAsync(ct);
        return todas.Count;
    }

    public async Task<AlertaDto> CrearAsync(CrearAlertaDto dto, CancellationToken ct = default)
    {
        var alerta = new Alerta
        {
            Id = Guid.NewGuid(),
            Tipo = dto.Tipo.Trim().ToLower(),
            Severidad = dto.Severidad.Trim().ToLower(),
            RecursoId = dto.RecursoId,
            UbicacionId = dto.UbicacionId,
            Titulo = dto.Titulo.Trim(),
            Mensaje = dto.Mensaje.Trim(),
            Leida = false,
            CreadoEn = DateTime.UtcNow
        };

        await _context.Alertas.AddAsync(alerta, ct);
        await _context.SaveChangesAsync(ct);

        return await ObtenerPorIdAsync(alerta.Id, ct) ?? MapearDto(alerta);
    }

    public async Task<EvaluacionAlertasResultadoDto> EvaluarReglasAsync(CancellationToken ct = default)
    {
        var resultado = new EvaluacionAlertasResultadoDto();
        var nuevasAlertas = new List<Alerta>();

        // Cargar alertas no leídas existentes para evitar duplicados
        var alertasAbiertas = await _context.Alertas
            .AsNoTracking()
            .Where(a => !a.Leida)
            .ToListAsync(ct);

        // -------------------------------------------------------------
        // REGLA 1: Stock bajo, mínimo o agotado (RF-12)
        // -------------------------------------------------------------
        var recursosActivos = await _context.Recursos
            .AsNoTracking()
            .Where(r => r.Activo)
            .Include(r => r.Existencias)
            .ToListAsync(ct);

        foreach (var recurso in recursosActivos)
        {
            // REGLA DE ORO DEL PROYECTO: Si un activo o recurso no tiene mínimo definido (> 0), NO genera alerta de stock.
            if (recurso.StockMinimo <= 0)
            {
                continue;
            }

            var stockTotal = recurso.Existencias?.Sum(e => e.Cantidad) ?? 0;
            var yaTieneAlerta = alertasAbiertas.Any(a => a.RecursoId == recurso.Id && a.Tipo == "stock_bajo");

            if (stockTotal <= 0)
            {
                if (!yaTieneAlerta)
                {
                    nuevasAlertas.Add(new Alerta
                    {
                        Id = Guid.NewGuid(),
                        Tipo = "stock_bajo",
                        Severidad = "urgente",
                        RecursoId = recurso.Id,
                        Titulo = $"Agotado: {recurso.Nombre}",
                        Mensaje = $"El recurso '{recurso.Nombre}' ({recurso.Sku}) se encuentra totalmente agotado (Stock actual: 0). Se requiere reabastecimiento urgente.",
                        Leida = false,
                        CreadoEn = DateTime.UtcNow
                    });
                    resultado.AlertasGeneradas++;
                    resultado.Mensajes.Add($"Alerta urgente de agotado generada para: {recurso.Sku}");
                }
                else
                {
                    resultado.AlertasOmitidasExistentes++;
                }
            }
            else if (recurso.StockMinimo > 0 && stockTotal <= recurso.StockMinimo)
            {
                if (!yaTieneAlerta)
                {
                    nuevasAlertas.Add(new Alerta
                    {
                        Id = Guid.NewGuid(),
                        Tipo = "stock_bajo",
                        Severidad = "advertencia",
                        RecursoId = recurso.Id,
                        Titulo = $"Stock bajo mínimo: {recurso.Nombre}",
                        Mensaje = $"El recurso '{recurso.Nombre}' ({recurso.Sku}) tiene existencias ({stockTotal}) por debajo del stock mínimo ({recurso.StockMinimo}).",
                        Leida = false,
                        CreadoEn = DateTime.UtcNow
                    });
                    resultado.AlertasGeneradas++;
                    resultado.Mensajes.Add($"Alerta de stock bajo mínimo generada para: {recurso.Sku}");
                }
                else
                {
                    resultado.AlertasOmitidasExistentes++;
                }
            }
            else if (recurso.PuntoReorden.HasValue && stockTotal <= recurso.PuntoReorden.Value)
            {
                if (!yaTieneAlerta)
                {
                    nuevasAlertas.Add(new Alerta
                    {
                        Id = Guid.NewGuid(),
                        Tipo = "stock_bajo",
                        Severidad = "info",
                        RecursoId = recurso.Id,
                        Titulo = $"Punto de reorden: {recurso.Nombre}",
                        Mensaje = $"El recurso '{recurso.Nombre}' ({recurso.Sku}) alcanzó el punto de reorden ({stockTotal} de {recurso.PuntoReorden.Value} sugerido).",
                        Leida = false,
                        CreadoEn = DateTime.UtcNow
                    });
                    resultado.AlertasGeneradas++;
                    resultado.Mensajes.Add($"Aviso de punto de reorden generado para: {recurso.Sku}");
                }
                else
                {
                    resultado.AlertasOmitidasExistentes++;
                }
            }
        }

        // -------------------------------------------------------------
        // REGLA 2: Lotes clínicos por vencer (30 días) o vencidos
        // -------------------------------------------------------------
        var hoyDateOnly = DateOnly.FromDateTime(DateTime.UtcNow);
        var limite30Dias = hoyDateOnly.AddDays(30);

        var lotesClinicos = await _context.Lotes
            .AsNoTracking()
            .Include(l => l.Recurso)
            .Where(l => l.FechaVencimiento.HasValue)
            .ToListAsync(ct);

        foreach (var lote in lotesClinicos)
        {
            var fechaVenc = lote.FechaVencimiento!.Value;
            var yaTieneAlerta = alertasAbiertas.Any(a => a.RecursoId == lote.RecursoId &&
                                                        a.Tipo == "proximo_vencimiento" &&
                                                        a.Mensaje.Contains(lote.NumeroLote));

            if (fechaVenc < hoyDateOnly)
            {
                if (!yaTieneAlerta)
                {
                    nuevasAlertas.Add(new Alerta
                    {
                        Id = Guid.NewGuid(),
                        Tipo = "proximo_vencimiento",
                        Severidad = "urgente",
                        RecursoId = lote.RecursoId,
                        Titulo = $"Lote clínico vencido: {lote.NumeroLote}",
                        Mensaje = $"El lote '{lote.NumeroLote}' del insumo '{lote.Recurso?.Nombre}' venció el {fechaVenc:dd/MM/yyyy}. Debe retirarse de circulación inmediata.",
                        Leida = false,
                        CreadoEn = DateTime.UtcNow
                    });
                    resultado.AlertasGeneradas++;
                    resultado.Mensajes.Add($"Alerta urgente de lote vencido: {lote.NumeroLote}");
                }
                else
                {
                    resultado.AlertasOmitidasExistentes++;
                }
            }
            else if (fechaVenc <= limite30Dias)
            {
                if (!yaTieneAlerta)
                {
                    var diasRestantes = fechaVenc.DayNumber - hoyDateOnly.DayNumber;
                    nuevasAlertas.Add(new Alerta
                    {
                        Id = Guid.NewGuid(),
                        Tipo = "proximo_vencimiento",
                        Severidad = "advertencia",
                        RecursoId = lote.RecursoId,
                        Titulo = $"Lote próximo a vencer: {lote.NumeroLote}",
                        Mensaje = $"El lote '{lote.NumeroLote}' del insumo '{lote.Recurso?.Nombre}' vencerá en {diasRestantes} días ({fechaVenc:dd/MM/yyyy}).",
                        Leida = false,
                        CreadoEn = DateTime.UtcNow
                    });
                    resultado.AlertasGeneradas++;
                    resultado.Mensajes.Add($"Alerta preventiva de vencimiento: {lote.NumeroLote} ({diasRestantes} días)");
                }
                else
                {
                    resultado.AlertasOmitidasExistentes++;
                }
            }
        }

        // -------------------------------------------------------------
        // REGLA 3: Mantenimientos vencidos o en los próximos 7 días
        // -------------------------------------------------------------
        var mantenimientosProgramados = await _context.Mantenimientos
            .AsNoTracking()
            .Include(m => m.ActivoSerie)
                .ThenInclude(a => a.Recurso)
            .Where(m => m.Estado == "programado")
            .ToListAsync(ct);

        var hoyDateTime = DateTime.UtcNow.Date;
        var limite7Dias = hoyDateTime.AddDays(7);

        foreach (var mant in mantenimientosProgramados)
        {
            var fechaProg = mant.FechaProgramada.Date;
            var placa = mant.ActivoSerie?.PlacaInstitucional ?? "Equipo S/P";
            var recursoNombre = mant.ActivoSerie?.Recurso?.Nombre ?? "Equipo institucional";
            var yaTieneAlerta = alertasAbiertas.Any(a => a.Tipo == "mantenimiento_vencido" &&
                                                        a.Mensaje.Contains(placa));

            if (fechaProg < hoyDateTime)
            {
                if (!yaTieneAlerta)
                {
                    nuevasAlertas.Add(new Alerta
                    {
                        Id = Guid.NewGuid(),
                        Tipo = "mantenimiento_vencido",
                        Severidad = "urgente",
                        RecursoId = mant.ActivoSerie?.RecursoId,
                        UbicacionId = mant.ActivoSerie?.UbicacionId,
                        Titulo = $"Mantenimiento vencido: {placa}",
                        Mensaje = $"El servicio técnico programado para el equipo '{placa}' ({recursoNombre}) venció el {fechaProg:dd/MM/yyyy}. Tipo: {mant.Tipo}.",
                        Leida = false,
                        CreadoEn = DateTime.UtcNow
                    });
                    resultado.AlertasGeneradas++;
                    resultado.Mensajes.Add($"Alerta urgente de mantenimiento vencido para: {placa}");
                }
                else
                {
                    resultado.AlertasOmitidasExistentes++;
                }
            }
            else if (fechaProg <= limite7Dias)
            {
                if (!yaTieneAlerta)
                {
                    var diasRestantes = (fechaProg - hoyDateTime).Days;
                    nuevasAlertas.Add(new Alerta
                    {
                        Id = Guid.NewGuid(),
                        Tipo = "mantenimiento_vencido",
                        Severidad = "advertencia",
                        RecursoId = mant.ActivoSerie?.RecursoId,
                        UbicacionId = mant.ActivoSerie?.UbicacionId,
                        Titulo = $"Mantenimiento próximo: {placa}",
                        Mensaje = $"El equipo '{placa}' ({recursoNombre}) tiene servicio técnico programado en {diasRestantes} días ({fechaProg:dd/MM/yyyy}).",
                        Leida = false,
                        CreadoEn = DateTime.UtcNow
                    });
                    resultado.AlertasGeneradas++;
                    resultado.Mensajes.Add($"Aviso de mantenimiento próximo para: {placa}");
                }
                else
                {
                    resultado.AlertasOmitidasExistentes++;
                }
            }
        }

        // Guardar nuevas alertas en base de datos y encolar correos transaccionales
        if (nuevasAlertas.Count > 0)
        {
            await _context.Alertas.AddRangeAsync(nuevasAlertas, ct);

            var correosAEncolar = new List<ColaCorreo>();
            foreach (var alerta in nuevasAlertas.Where(a => a.Severidad == "urgente" || a.Severidad == "advertencia"))
            {
                string cuerpoHtml = alerta.Tipo switch
                {
                    "stock_bajo" => _emailTemplateService.GenerarAlertaStockBajoHtml(
                        alerta.Recurso?.Nombre ?? alerta.Titulo,
                        alerta.Recurso?.Sku ?? "N/A",
                        0,
                        alerta.Recurso?.StockMinimo ?? 1,
                        alerta.Recurso?.PuntoReorden
                    ),
                    "proximo_vencimiento" => _emailTemplateService.GenerarAlertaVencimientoLoteHtml(
                        alerta.Recurso?.Nombre ?? "Insumo Odontológico",
                        alerta.Titulo,
                        DateTime.UtcNow.ToString("dd/MM/yyyy"),
                        0
                    ),
                    "mantenimiento_vencido" => _emailTemplateService.GenerarAlertaMantenimientoHtml(
                        alerta.Titulo,
                        "Equipo TI UOD",
                        DateTime.UtcNow.ToString("dd/MM/yyyy"),
                        "preventivo",
                        0
                    ),
                    _ => $@"<div style=""font-family: sans-serif; padding: 20px;""><h2>{alerta.Titulo}</h2><p>{alerta.Mensaje}</p></div>"
                };

                correosAEncolar.Add(new ColaCorreo
                {
                    Id = Guid.NewGuid(),
                    Destinatario = "admin@uod.edu.do",
                    Asunto = $"[SIIA UOD] {alerta.Titulo}",
                    CuerpoHtml = cuerpoHtml,
                    Estado = "pendiente",
                    Intentos = 0,
                    CreadoEn = DateTime.UtcNow
                });
            }

            if (correosAEncolar.Count > 0)
            {
                await _context.ColaCorreos.AddRangeAsync(correosAEncolar, ct);
            }

            await _context.SaveChangesAsync(ct);
        }

        return resultado;
    }

    public async Task<NotificacionPreferenciaDto> ObtenerPreferenciasUsuarioAsync(Guid usuarioId, CancellationToken ct = default)
    {
        var pref = await _context.NotificacionesPreferencias
            .FirstOrDefaultAsync(p => p.UsuarioId == usuarioId, ct);

        if (pref == null)
        {
            pref = new NotificacionPreferencia
            {
                Id = Guid.NewGuid(),
                UsuarioId = usuarioId,
                RecibirAlertasStock = true,
                RecibirAlertasMantenimiento = true,
                RecibirResumenSemanal = false,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };

            await _context.NotificacionesPreferencias.AddAsync(pref, ct);
            await _context.SaveChangesAsync(ct);
        }

        return new NotificacionPreferenciaDto
        {
            Id = pref.Id,
            UsuarioId = pref.UsuarioId,
            RecibirAlertasStock = pref.RecibirAlertasStock,
            RecibirAlertasMantenimiento = pref.RecibirAlertasMantenimiento,
            RecibirResumenSemanal = pref.RecibirResumenSemanal,
            ActualizadoEn = pref.ActualizadoEn
        };
    }

    public async Task<NotificacionPreferenciaDto> ActualizarPreferenciasUsuarioAsync(Guid usuarioId, ActualizarPreferenciaDto dto, CancellationToken ct = default)
    {
        var pref = await _context.NotificacionesPreferencias
            .FirstOrDefaultAsync(p => p.UsuarioId == usuarioId, ct);

        if (pref == null)
        {
            pref = new NotificacionPreferencia
            {
                Id = Guid.NewGuid(),
                UsuarioId = usuarioId,
                RecibirAlertasStock = dto.RecibirAlertasStock,
                RecibirAlertasMantenimiento = dto.RecibirAlertasMantenimiento,
                RecibirResumenSemanal = dto.RecibirResumenSemanal,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            await _context.NotificacionesPreferencias.AddAsync(pref, ct);
        }
        else
        {
            pref.RecibirAlertasStock = dto.RecibirAlertasStock;
            pref.RecibirAlertasMantenimiento = dto.RecibirAlertasMantenimiento;
            pref.RecibirResumenSemanal = dto.RecibirResumenSemanal;
            pref.ActualizadoEn = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(ct);

        return new NotificacionPreferenciaDto
        {
            Id = pref.Id,
            UsuarioId = pref.UsuarioId,
            RecibirAlertasStock = pref.RecibirAlertasStock,
            RecibirAlertasMantenimiento = pref.RecibirAlertasMantenimiento,
            RecibirResumenSemanal = pref.RecibirResumenSemanal,
            ActualizadoEn = pref.ActualizadoEn
        };
    }

    private static AlertaDto MapearDto(Alerta a)
    {
        return new AlertaDto
        {
            Id = a.Id,
            Tipo = a.Tipo,
            Severidad = a.Severidad,
            RecursoId = a.RecursoId,
            RecursoNombre = a.Recurso?.Nombre,
            RecursoSku = a.Recurso?.Sku,
            UbicacionId = a.UbicacionId,
            UbicacionNombre = a.Ubicacion?.Nombre,
            Titulo = a.Titulo,
            Mensaje = a.Mensaje,
            Leida = a.Leida,
            CreadoEn = a.CreadoEn
        };
    }
}
