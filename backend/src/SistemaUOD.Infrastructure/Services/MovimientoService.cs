using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Caching.Memory;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;
using SistemaUOD.Infrastructure.Data;

namespace SistemaUOD.Infrastructure.Services;

public class MovimientoService : IMovimientoService
{
    private readonly ApplicationDbContext _db;
    private readonly IMemoryCache _cache;

    public MovimientoService(ApplicationDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<MovimientoDto> RegistrarMovimientoAsync(
        CrearMovimientoDto dto,
        Guid usuarioId,
        string? idempotencyKey = null,
        CancellationToken ct = default)
    {
        var claveIdempotencia = idempotencyKey ?? dto.IdempotenciaKey;

        // 1. Manejo de Idempotencia: si ya existe una operación con esta clave, se retorna el movimiento registrado
        if (!string.IsNullOrWhiteSpace(claveIdempotencia))
        {
            if (_cache.TryGetValue($"idempotency_{claveIdempotencia}", out Guid movId))
            {
                var movExistente = await ObtenerMovimientoPorIdAsync(movId, ct);
                if (movExistente != null) return movExistente;
            }

            var movPrevio = await _db.Movimientos
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.Motivo.Contains($"[IDEMPOTENCIA:{claveIdempotencia}]"), ct);

            if (movPrevio != null)
            {
                _cache.Set($"idempotency_{claveIdempotencia}", movPrevio.Id, TimeSpan.FromHours(24));
                var dtoPrevio = await ObtenerMovimientoPorIdAsync(movPrevio.Id, ct);
                if (dtoPrevio != null) return dtoPrevio;
            }
        }

        // 2. Validaciones de rutas y ubicaciones según tipo de movimiento
        ValidarRutasMovimiento(dto);

        Ubicacion? origen = null;
        if (dto.OrigenUbicacionId.HasValue)
        {
            origen = await _db.Ubicaciones.FindAsync(new object[] { dto.OrigenUbicacionId.Value }, ct);
            if (origen == null || !origen.Activa)
            {
                throw new InvalidOperationException($"La ubicación de origen especificada no existe o se encuentra inactiva.");
            }
        }

        Ubicacion? destino = null;
        if (dto.DestinoUbicacionId.HasValue)
        {
            destino = await _db.Ubicaciones.FindAsync(new object[] { dto.DestinoUbicacionId.Value }, ct);
            if (destino == null || !destino.Activa)
            {
                throw new InvalidOperationException($"La ubicación de destino especificada no existe o se encuentra inactiva.");
            }
        }

        if (dto.Lineas == null || dto.Lineas.Count == 0)
        {
            throw new InvalidOperationException("El movimiento debe contener al menos una línea de detalle.");
        }

        // 3. Cargar recursos involucrados
        var recursoIds = dto.Lineas.Select(l => l.RecursoId).Distinct().ToList();
        var recursos = await _db.Recursos
            .Where(r => recursoIds.Contains(r.Id))
            .ToDictionaryAsync(r => r.Id, ct);

        foreach (var id in recursoIds)
        {
            if (!recursos.TryGetValue(id, out var r) || !r.Activo)
            {
                throw new InvalidOperationException($"Uno de los recursos solicitados ({id}) no existe o está inactivo.");
            }
        }

        // 4. Transacción Atómica: Todo o nada (con soporte para NpgsqlRetryingExecutionStrategy)
        var strategy = _db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            var soportaTransacciones = !_db.Database.ProviderName?.Contains("InMemory") == true;
            IDbContextTransaction? transaction = null;
            if (soportaTransacciones)
            {
                transaction = await _db.Database.BeginTransactionAsync(ct);
            }

        try
        {
            var movimientoId = Guid.NewGuid();
            var motivoConIdempotencia = string.IsNullOrWhiteSpace(claveIdempotencia)
                ? dto.Motivo.Trim()
                : $"{dto.Motivo.Trim()} [IDEMPOTENCIA:{claveIdempotencia}]";

            // Generar correlativo institucional MOV-YYYY-000001
            var anio = DateTime.UtcNow.Year;
            var conteoAnio = await _db.Movimientos
                .CountAsync(m => m.NumeroMovimiento.StartsWith($"MOV-{anio}-"), ct);
            var numeroMovimiento = $"MOV-{anio}-{(conteoAnio + 1):D6}";

            // Asegurar que el usuario existe en perfiles para cumplir la integridad referencial
            var perfilExiste = await _db.Perfiles.AnyAsync(p => p.Id == usuarioId, ct);
            if (!perfilExiste)
            {
                var perfilFallback = await _db.Perfiles.FirstOrDefaultAsync(p => p.Activo, ct);
                if (perfilFallback != null)
                {
                    usuarioId = perfilFallback.Id;
                }
            }

            var nuevoMovimiento = new Movimiento
            {
                Id = movimientoId,
                NumeroMovimiento = numeroMovimiento,
                Tipo = dto.Tipo.ToLowerInvariant(),
                OrigenUbicacionId = dto.OrigenUbicacionId,
                DestinoUbicacionId = dto.DestinoUbicacionId,
                UsuarioId = usuarioId,
                OrigenIa = dto.OrigenIa,
                Motivo = motivoConIdempotencia,
                ComprobanteUrl = dto.ComprobanteUrl?.Trim(),
                CreadoEn = DateTime.UtcNow
            };

            var lineasEntidad = new List<MovimientoLinea>();

            foreach (var linea in dto.Lineas)
            {
                var recurso = recursos[linea.RecursoId];
                var costo = linea.CostoUnitario > 0 ? linea.CostoUnitario : recurso.CostoEstimado;

                // A) Si la operación resta inventario del origen
                if (RestaInventarioDeOrigen(dto.Tipo) && dto.OrigenUbicacionId.HasValue)
                {
                    var existenciaOrigen = await _db.Existencias
                        .FirstOrDefaultAsync(e => e.RecursoId == linea.RecursoId &&
                                                  e.UbicacionId == dto.OrigenUbicacionId.Value &&
                                                  e.LoteId == linea.LoteId, ct);

                    int stockActual = existenciaOrigen?.Cantidad ?? 0;
                    if (stockActual < linea.Cantidad)
                    {
                        throw new InvalidOperationException(
                            $"Stock insuficiente para '{recurso.Nombre}' en la ubicación de origen. " +
                            $"Disponible: {stockActual}, requerido: {linea.Cantidad}. La operación fue cancelada.");
                    }

                    existenciaOrigen!.Cantidad -= linea.Cantidad;
                    existenciaOrigen.ActualizadoEn = DateTime.UtcNow;
                }

                // B) Si la operación suma inventario al destino
                if (SumaInventarioADestino(dto.Tipo) && dto.DestinoUbicacionId.HasValue)
                {
                    var existenciaDestino = await _db.Existencias
                        .FirstOrDefaultAsync(e => e.RecursoId == linea.RecursoId &&
                                                  e.UbicacionId == dto.DestinoUbicacionId.Value &&
                                                  e.LoteId == linea.LoteId, ct);

                    if (existenciaDestino == null)
                    {
                        existenciaDestino = new Existencia
                        {
                            Id = Guid.NewGuid(),
                            RecursoId = linea.RecursoId,
                            UbicacionId = dto.DestinoUbicacionId.Value,
                            LoteId = linea.LoteId,
                            Cantidad = linea.Cantidad,
                            ActualizadoEn = DateTime.UtcNow
                        };
                        _db.Existencias.Add(existenciaDestino);
                    }
                    else
                    {
                        existenciaDestino.Cantidad += linea.Cantidad;
                        existenciaDestino.ActualizadoEn = DateTime.UtcNow;
                    }
                }

                var lineaEntidad = new MovimientoLinea
                {
                    Id = Guid.NewGuid(),
                    MovimientoId = movimientoId,
                    RecursoId = linea.RecursoId,
                    LoteId = linea.LoteId,
                    Cantidad = linea.Cantidad,
                    CostoUnitario = costo
                };

                lineasEntidad.Add(lineaEntidad);
            }

            // Si es entrada y contiene números de serie para activos físicos, registrar las unidades en ActivosSerie
            if (dto.Tipo.Equals("entrada", StringComparison.OrdinalIgnoreCase) && dto.DestinoUbicacionId.HasValue)
            {
                var placasExistentes = await _db.ActivosSerie
                    .Where(a => a.PlacaInstitucional != null && a.PlacaInstitucional.StartsWith("EQ-"))
                    .Select(a => a.PlacaInstitucional!)
                    .ToListAsync(ct);

                int maxNumero = 0;
                foreach (var p in placasExistentes)
                {
                    var sub = p.Replace("EQ-", "").Trim();
                    if (int.TryParse(sub, out var n) && n > maxNumero)
                    {
                        maxNumero = n;
                    }
                }

                var nuevosActivosSerie = new List<ActivoSerie>();
                foreach (var linea in dto.Lineas)
                {
                    if (linea.NumerosSerie != null && linea.NumerosSerie.Count > 0)
                    {
                        var recurso = recursos[linea.RecursoId];
                        var costo = linea.CostoUnitario > 0 ? linea.CostoUnitario : recurso.CostoEstimado;
                        foreach (var serie in linea.NumerosSerie)
                        {
                            var sLimpio = serie?.Trim();
                            if (string.IsNullOrWhiteSpace(sLimpio)) continue;

                            maxNumero++;
                            var nuevaPlaca = $"EQ-{maxNumero:D2}";
                            var activoSerie = new ActivoSerie
                            {
                                Id = Guid.NewGuid(),
                                RecursoId = linea.RecursoId,
                                NumeroSerie = sLimpio,
                                PlacaInstitucional = nuevaPlaca,
                                Estado = "disponible",
                                UbicacionId = dto.DestinoUbicacionId.Value,
                                ProveedorId = dto.ProveedorId,
                                FechaAdquisicion = dto.FechaMovimiento.HasValue ? DateOnly.FromDateTime(dto.FechaMovimiento.Value) : DateOnly.FromDateTime(DateTime.UtcNow),
                                CostoAdquisicion = costo,
                                FacturaUrl = dto.FacturaUrl,
                                FacturaNombre = dto.NumeroFactura,
                                Notas = $"Ingresado mediante movimiento {numeroMovimiento}. {dto.Motivo}".Trim(),
                                CreadoEn = DateTime.UtcNow,
                                ActualizadoEn = DateTime.UtcNow
                            };
                            nuevosActivosSerie.Add(activoSerie);
                        }
                    }
                }

                if (nuevosActivosSerie.Count > 0)
                {
                    _db.ActivosSerie.AddRange(nuevosActivosSerie);
                }
            }

            _db.Movimientos.Add(nuevoMovimiento);
            _db.MovimientosLineas.AddRange(lineasEntidad);

            await _db.SaveChangesAsync(ct);

            if (transaction != null)
            {
                await transaction.CommitAsync(ct);
            }

            if (!string.IsNullOrWhiteSpace(claveIdempotencia))
            {
                _cache.Set($"idempotency_{claveIdempotencia}", movimientoId, TimeSpan.FromHours(24));
            }

            var resultado = await ObtenerMovimientoPorIdAsync(movimientoId, ct);
            return resultado!;
        }
        catch
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync(ct);
            }
            throw;
        }
    });
}

    public async Task<PrevisualizarMovimientoResultadoDto> PrevisualizarMovimientoAsync(
        CrearMovimientoDto dto,
        CancellationToken ct = default)
    {
        var resultado = new PrevisualizarMovimientoResultadoDto
        {
            Tipo = dto.Tipo,
            TotalLineas = dto.Lineas.Count,
            EsValido = true
        };

        try
        {
            ValidarRutasMovimiento(dto);
        }
        catch (Exception ex)
        {
            resultado.EsValido = false;
            resultado.Errores.Add(ex.Message);
            return resultado;
        }

        var recursoIds = dto.Lineas.Select(l => l.RecursoId).Distinct().ToList();
        var recursos = await _db.Recursos
            .Where(r => recursoIds.Contains(r.Id))
            .ToDictionaryAsync(r => r.Id, ct);

        foreach (var linea in dto.Lineas)
        {
            if (!recursos.TryGetValue(linea.RecursoId, out var recurso))
            {
                resultado.EsValido = false;
                resultado.Errores.Add($"Recurso con ID {linea.RecursoId} no encontrado.");
                continue;
            }

            // Si resta del origen
            if (RestaInventarioDeOrigen(dto.Tipo) && dto.OrigenUbicacionId.HasValue)
            {
                var existencia = await _db.Existencias
                    .Include(e => e.Ubicacion)
                    .Include(e => e.Lote)
                    .FirstOrDefaultAsync(e => e.RecursoId == linea.RecursoId &&
                                              e.UbicacionId == dto.OrigenUbicacionId.Value &&
                                              e.LoteId == linea.LoteId, ct);

                int stockActual = existencia?.Cantidad ?? 0;
                int resultante = stockActual - linea.Cantidad;

                var prevLinea = new PrevisualizarMovimientoLineaDto
                {
                    RecursoId = recurso.Id,
                    RecursoSku = recurso.Sku,
                    RecursoNombre = recurso.Nombre,
                    UbicacionId = dto.OrigenUbicacionId.Value,
                    UbicacionNombre = existencia?.Ubicacion?.Nombre ?? "Ubicación Origen",
                    LoteId = linea.LoteId,
                    NumeroLote = existencia?.Lote?.NumeroLote,
                    StockActual = stockActual,
                    CantidadOperacion = -linea.Cantidad,
                    StockResultante = resultante
                };

                if (resultante < 0)
                {
                    prevLinea.MensajeError = $"Stock insuficiente: solo hay {stockActual} unidades disponibles.";
                    resultado.EsValido = false;
                    resultado.Errores.Add($"Stock insuficiente para '{recurso.Nombre}' en origen ({stockActual} disp., {linea.Cantidad} req.).");
                }

                resultado.Lineas.Add(prevLinea);
            }

            // Si suma al destino
            if (SumaInventarioADestino(dto.Tipo) && dto.DestinoUbicacionId.HasValue)
            {
                var existencia = await _db.Existencias
                    .Include(e => e.Ubicacion)
                    .Include(e => e.Lote)
                    .FirstOrDefaultAsync(e => e.RecursoId == linea.RecursoId &&
                                              e.UbicacionId == dto.DestinoUbicacionId.Value &&
                                              e.LoteId == linea.LoteId, ct);

                int stockActual = existencia?.Cantidad ?? 0;
                int resultante = stockActual + linea.Cantidad;

                var prevDestino = new PrevisualizarMovimientoLineaDto
                {
                    RecursoId = recurso.Id,
                    RecursoSku = recurso.Sku,
                    RecursoNombre = recurso.Nombre,
                    UbicacionId = dto.DestinoUbicacionId.Value,
                    UbicacionNombre = existencia?.Ubicacion?.Nombre ?? "Ubicación Destino",
                    LoteId = linea.LoteId,
                    NumeroLote = existencia?.Lote?.NumeroLote,
                    StockActual = stockActual,
                    CantidadOperacion = +linea.Cantidad,
                    StockResultante = resultante
                };

                if (linea.NumerosSerie != null && linea.NumerosSerie.Count > 0)
                {
                    var seriesLimpas = linea.NumerosSerie.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToList();
                    prevDestino.NumerosSerie = seriesLimpas;

                    var maxPlacas = await _db.ActivosSerie
                        .Where(a => a.PlacaInstitucional != null && a.PlacaInstitucional.StartsWith("EQ-"))
                        .Select(a => a.PlacaInstitucional!)
                        .ToListAsync(ct);

                    int maxNumPrev = 0;
                    foreach (var p in maxPlacas)
                    {
                        var parts = p.Split('-');
                        if (parts.Length == 2 && int.TryParse(parts[1], out int n) && n > maxNumPrev)
                        {
                            maxNumPrev = n;
                        }
                    }

                    foreach (var _ in seriesLimpas)
                    {
                        maxNumPrev++;
                        prevDestino.PlacasSugeridas.Add($"EQ-{maxNumPrev:D2}");
                    }
                }

                resultado.Lineas.Add(prevDestino);
            }
        }

        return resultado;
    }

    public async Task<PagedResult<MovimientoDto>> ListarMovimientosAsync(
        MovimientoFiltrosDto filtros,
        CancellationToken ct = default)
    {
        var query = _db.Movimientos
            .AsNoTracking()
            .Include(m => m.OrigenUbicacion)
            .Include(m => m.DestinoUbicacion)
            .Include(m => m.Usuario)
            .Include(m => m.Lineas)
                .ThenInclude(l => l.Recurso)
            .Include(m => m.Lineas)
                .ThenInclude(l => l.Lote)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtros.Tipo))
        {
            var tipoNormalizado = filtros.Tipo.ToLowerInvariant();
            query = query.Where(m => m.Tipo == tipoNormalizado);
        }

        if (filtros.UbicacionId.HasValue)
        {
            var uId = filtros.UbicacionId.Value;
            query = query.Where(m => m.OrigenUbicacionId == uId || m.DestinoUbicacionId == uId);
        }

        if (filtros.RecursoId.HasValue)
        {
            var rId = filtros.RecursoId.Value;
            query = query.Where(m => m.Lineas.Any(l => l.RecursoId == rId));
        }

        if (filtros.UsuarioId.HasValue)
        {
            query = query.Where(m => m.UsuarioId == filtros.UsuarioId.Value);
        }

        if (filtros.FechaDesde.HasValue)
        {
            query = query.Where(m => m.CreadoEn >= filtros.FechaDesde.Value);
        }

        if (filtros.FechaHasta.HasValue)
        {
            query = query.Where(m => m.CreadoEn <= filtros.FechaHasta.Value);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Search))
        {
            var term = filtros.Search.Trim().ToLower();
            query = query.Where(m =>
                m.NumeroMovimiento.ToLower().Contains(term) ||
                m.Motivo.ToLower().Contains(term) ||
                (m.OrigenUbicacion != null && m.OrigenUbicacion.Nombre.ToLower().Contains(term)) ||
                (m.DestinoUbicacion != null && m.DestinoUbicacion.Nombre.ToLower().Contains(term)) ||
                m.Lineas.Any(l => l.Recurso.Nombre.ToLower().Contains(term) || l.Recurso.Sku.ToLower().Contains(term)));
        }

        var total = await query.CountAsync(ct);

        query = filtros.SortBy?.ToLowerInvariant() switch
        {
            "numeromovimiento" => filtros.IsDescending ? query.OrderByDescending(m => m.NumeroMovimiento) : query.OrderBy(m => m.NumeroMovimiento),
            "tipo" => filtros.IsDescending ? query.OrderByDescending(m => m.Tipo) : query.OrderBy(m => m.Tipo),
            _ => filtros.IsDescending ? query.OrderByDescending(m => m.CreadoEn) : query.OrderBy(m => m.CreadoEn)
        };

        var itemsDb = await query
            .Skip((filtros.PageIndex - 1) * filtros.PageSize)
            .Take(filtros.PageSize)
            .ToListAsync(ct);

        var dtos = itemsDb.Select(MapearMovimientoADto).ToList();

        return new PagedResult<MovimientoDto>
        {
            Items = dtos,
            TotalCount = total,
            PageIndex = filtros.PageIndex,
            PageSize = filtros.PageSize
        };
    }

    public async Task<MovimientoDto?> ObtenerMovimientoPorIdAsync(Guid id, CancellationToken ct = default)
    {
        var mov = await _db.Movimientos
            .AsNoTracking()
            .Include(m => m.OrigenUbicacion)
            .Include(m => m.DestinoUbicacion)
            .Include(m => m.Usuario)
            .Include(m => m.Lineas)
                .ThenInclude(l => l.Recurso)
            .Include(m => m.Lineas)
                .ThenInclude(l => l.Lote)
            .FirstOrDefaultAsync(m => m.Id == id, ct);

        return mov == null ? null : MapearMovimientoADto(mov);
    }

    private static void ValidarRutasMovimiento(CrearMovimientoDto dto)
    {
        var tipo = dto.Tipo.ToLowerInvariant();
        switch (tipo)
        {
            case "entrada":
                if (!dto.DestinoUbicacionId.HasValue)
                    throw new InvalidOperationException("Una entrada requiere especificar la ubicación de destino.");
                break;

            case "salida":
                if (!dto.OrigenUbicacionId.HasValue)
                    throw new InvalidOperationException("Una salida requiere especificar la ubicación de origen.");
                break;

            case "traslado":
                if (!dto.OrigenUbicacionId.HasValue || !dto.DestinoUbicacionId.HasValue)
                    throw new InvalidOperationException("Un traslado requiere especificar tanto la ubicación de origen como la de destino.");
                if (dto.OrigenUbicacionId.Value == dto.DestinoUbicacionId.Value)
                    throw new InvalidOperationException("La ubicación de origen y destino en un traslado deben ser diferentes.");
                break;

            case "ajuste":
                if (!dto.OrigenUbicacionId.HasValue && !dto.DestinoUbicacionId.HasValue)
                    throw new InvalidOperationException("Un ajuste requiere especificar al menos la ubicación de origen (si disminuye) o destino (si incrementa).");
                if (string.IsNullOrWhiteSpace(dto.Motivo) || dto.Motivo.Trim().Length < 5)
                    throw new InvalidOperationException("El motivo de un ajuste es obligatorio y debe tener al menos 5 caracteres.");
                break;

            case "devolucion":
                if (!dto.OrigenUbicacionId.HasValue && !dto.DestinoUbicacionId.HasValue)
                    throw new InvalidOperationException("Una devolución requiere especificar al menos una ubicación.");
                break;

            case "baja":
                if (!dto.OrigenUbicacionId.HasValue)
                    throw new InvalidOperationException("Una baja requiere especificar la ubicación de origen de los bienes.");
                if (string.IsNullOrWhiteSpace(dto.Motivo) || dto.Motivo.Trim().Length < 5)
                    throw new InvalidOperationException("El motivo de una baja es obligatorio y debe tener al menos 5 caracteres.");
                break;

            default:
                throw new InvalidOperationException($"Tipo de movimiento '{dto.Tipo}' no reconocido.");
        }
    }

    private static bool RestaInventarioDeOrigen(string tipo)
    {
        return tipo switch
        {
            "salida" => true,
            "traslado" => true,
            "baja" => true,
            "ajuste" => true, // si tiene OrigenUbicacionId configurado
            _ => false
        };
    }

    private static bool SumaInventarioADestino(string tipo)
    {
        return tipo switch
        {
            "entrada" => true,
            "traslado" => true,
            "devolucion" => true,
            "ajuste" => true, // si tiene DestinoUbicacionId configurado
            _ => false
        };
    }

    private static MovimientoDto MapearMovimientoADto(Movimiento m)
    {
        var lineas = m.Lineas.Select(l => new MovimientoLineaDto
        {
            Id = l.Id,
            RecursoId = l.RecursoId,
            RecursoSku = l.Recurso?.Sku ?? string.Empty,
            RecursoNombre = l.Recurso?.Nombre ?? string.Empty,
            RecursoTipo = l.Recurso?.Tipo ?? "consumible",
            UnidadMedida = l.Recurso?.UnidadMedida ?? "unidad",
            LoteId = l.LoteId,
            NumeroLote = l.Lote?.NumeroLote,
            FechaVencimiento = l.Lote?.FechaVencimiento,
            Cantidad = l.Cantidad,
            CostoUnitario = l.CostoUnitario
        }).ToList();

        return new MovimientoDto
        {
            Id = m.Id,
            NumeroMovimiento = m.NumeroMovimiento,
            Tipo = m.Tipo,
            OrigenUbicacionId = m.OrigenUbicacionId,
            OrigenUbicacionNombre = m.OrigenUbicacion?.Nombre,
            OrigenUbicacionCodigo = m.OrigenUbicacion?.Codigo,
            DestinoUbicacionId = m.DestinoUbicacionId,
            DestinoUbicacionNombre = m.DestinoUbicacion?.Nombre,
            DestinoUbicacionCodigo = m.DestinoUbicacion?.Codigo,
            UsuarioId = m.UsuarioId,
            UsuarioNombre = m.Usuario?.NombreCompleto ?? "Usuario del Sistema",
            UsuarioCorreo = m.Usuario?.Correo ?? string.Empty,
            OrigenIa = m.OrigenIa,
            Motivo = m.Motivo,
            ComprobanteUrl = m.ComprobanteUrl,
            TotalLineas = lineas.Count,
            TotalUnidades = lineas.Sum(l => l.Cantidad),
            CostoTotal = lineas.Sum(l => l.Subtotal),
            CreadoEn = m.CreadoEn,
            Lineas = lineas
        };
    }
}
