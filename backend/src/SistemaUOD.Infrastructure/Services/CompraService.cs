using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class CompraService : ICompraService
{
    private readonly IApplicationDbContext _db;
    private readonly IMovimientoService _movimientoService;

    public CompraService(
        IApplicationDbContext db,
        IMovimientoService movimientoService)
    {
        _db = db;
        _movimientoService = movimientoService;
    }

    public async Task<PagedResult<OrdenCompraDto>> ListarOrdenesAsync(
        OrdenCompraFiltrosDto filtros,
        CancellationToken ct = default)
    {
        var query = _db.OrdenesCompra
            .Include(o => o.Proveedor)
            .Include(o => o.Solicitante)
            .Include(o => o.Lineas)
                .ThenInclude(l => l.Recurso)
                    .ThenInclude(r => r.Categoria)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtros.Busqueda))
        {
            var search = filtros.Busqueda.Trim().ToLower();
            query = query.Where(o =>
                o.NumeroOrden.ToLower().Contains(search) ||
                o.Proveedor.NombreComercial.ToLower().Contains(search) ||
                (o.Proveedor.RazonSocial != null && o.Proveedor.RazonSocial.ToLower().Contains(search)) ||
                (o.Observaciones != null && o.Observaciones.ToLower().Contains(search)) ||
                o.Lineas.Any(l => l.Recurso.Nombre.ToLower().Contains(search) || l.Recurso.Sku.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(filtros.Estado))
        {
            var estado = filtros.Estado.Trim().ToLower();
            query = query.Where(o => o.Estado.ToLower() == estado);
        }

        if (filtros.ProveedorId.HasValue)
        {
            query = query.Where(o => o.ProveedorId == filtros.ProveedorId.Value);
        }

        if (filtros.FechaDesde.HasValue)
        {
            query = query.Where(o => o.FechaEmision >= filtros.FechaDesde.Value);
        }

        if (filtros.FechaHasta.HasValue)
        {
            query = query.Where(o => o.FechaEmision <= filtros.FechaHasta.Value);
        }

        var totalItems = await query.CountAsync(ct);

        var page = filtros.Page < 1 ? 1 : filtros.Page;
        var pageSize = filtros.PageSize < 1 ? 20 : filtros.PageSize;

        var ordenes = await query
            .OrderByDescending(o => o.CreadoEn)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = ordenes.Select(MapearADto).ToList();

        return PagedResult<OrdenCompraDto>.Create(items, totalItems, page, pageSize);
    }

    public async Task<OrdenCompraDto?> ObtenerPorIdAsync(Guid id, CancellationToken ct = default)
    {
        var orden = await _db.OrdenesCompra
            .Include(o => o.Proveedor)
            .Include(o => o.Solicitante)
            .Include(o => o.Lineas)
                .ThenInclude(l => l.Recurso)
                    .ThenInclude(r => r.Categoria)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        return orden == null ? null : MapearADto(orden);
    }

    public async Task<OrdenCompraDto> CrearOrdenAsync(
        CrearOrdenCompraDto dto,
        Guid usuarioId,
        CancellationToken ct = default)
    {
        // 1. Validar proveedor
        var proveedor = await _db.Proveedores
            .FirstOrDefaultAsync(p => p.Id == dto.ProveedorId && p.Activo, ct);

        if (proveedor == null)
        {
            throw new InvalidOperationException("El proveedor seleccionado no existe o está inactivo.");
        }

        if (dto.Lineas == null || dto.Lineas.Count == 0)
        {
            throw new InvalidOperationException("Debe agregar al menos un recurso a la orden de compra.");
        }

        // 2. Validar recursos
        var recursoIds = dto.Lineas.Select(l => l.RecursoId).Distinct().ToList();
        var recursos = await _db.Recursos
            .Where(r => recursoIds.Contains(r.Id) && r.Activo)
            .ToDictionaryAsync(r => r.Id, ct);

        foreach (var id in recursoIds)
        {
            if (!recursos.ContainsKey(id))
            {
                throw new InvalidOperationException($"El recurso con ID '{id}' no existe o está inactivo.");
            }
        }

        // 3. Generar correlativo institucional OC-YYYY-000001
        var anio = DateTime.UtcNow.Year;
        var conteoAnio = await _db.OrdenesCompra
            .CountAsync(o => o.NumeroOrden.StartsWith($"OC-{anio}-"), ct);
        var numeroOrden = $"OC-{anio}-{(conteoAnio + 1):D6}";

        var nuevaOrden = new OrdenCompra
        {
            Id = Guid.NewGuid(),
            NumeroOrden = numeroOrden,
            ProveedorId = dto.ProveedorId,
            SolicitanteId = usuarioId,
            Estado = "borrador",
            FechaEmision = DateOnly.FromDateTime(DateTime.UtcNow),
            FechaEntregaEstimada = dto.FechaEntregaEstimada,
            Observaciones = dto.Observaciones?.Trim(),
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };

        foreach (var lineaDto in dto.Lineas)
        {
            if (lineaDto.CantidadSolicitada <= 0)
            {
                throw new InvalidOperationException("La cantidad solicitada debe ser mayor a cero.");
            }

            var recurso = recursos[lineaDto.RecursoId];
            var precio = lineaDto.PrecioUnitarioEstimado > 0
                ? lineaDto.PrecioUnitarioEstimado
                : recurso.CostoEstimado;

            nuevaOrden.Lineas.Add(new OrdenCompraLinea
            {
                Id = Guid.NewGuid(),
                OrdenId = nuevaOrden.Id,
                RecursoId = lineaDto.RecursoId,
                CantidadSolicitada = lineaDto.CantidadSolicitada,
                CantidadRecibida = 0,
                PrecioUnitarioEstimado = precio
            });
        }

        _db.OrdenesCompra.Add(nuevaOrden);
        await _db.SaveChangesAsync(ct);

        return (await ObtenerPorIdAsync(nuevaOrden.Id, ct))!;
    }

    public async Task<OrdenCompraDto> ActualizarOrdenAsync(
        Guid id,
        ActualizarOrdenCompraDto dto,
        Guid usuarioId,
        CancellationToken ct = default)
    {
        var orden = await _db.OrdenesCompra
            .Include(o => o.Lineas)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
        {
            throw new KeyNotFoundException($"No se encontró la orden de compra con ID '{id}'.");
        }

        if (orden.Estado != "borrador")
        {
            throw new InvalidOperationException("Solo se pueden editar órdenes de compra en estado 'borrador'.");
        }

        var proveedor = await _db.Proveedores
            .FirstOrDefaultAsync(p => p.Id == dto.ProveedorId && p.Activo, ct);

        if (proveedor == null)
        {
            throw new InvalidOperationException("El proveedor seleccionado no existe o está inactivo.");
        }

        if (dto.Lineas == null || dto.Lineas.Count == 0)
        {
            throw new InvalidOperationException("Debe incluir al menos un recurso en la orden de compra.");
        }

        var recursoIds = dto.Lineas.Select(l => l.RecursoId).Distinct().ToList();
        var recursos = await _db.Recursos
            .Where(r => recursoIds.Contains(r.Id) && r.Activo)
            .ToDictionaryAsync(r => r.Id, ct);

        foreach (var rId in recursoIds)
        {
            if (!recursos.ContainsKey(rId))
            {
                throw new InvalidOperationException($"El recurso con ID '{rId}' no existe o está inactivo.");
            }
        }

        // Actualizar datos
        orden.ProveedorId = dto.ProveedorId;
        orden.FechaEntregaEstimada = dto.FechaEntregaEstimada;
        orden.Observaciones = dto.Observaciones?.Trim();
        orden.ActualizadoEn = DateTime.UtcNow;

        // Reemplazar líneas
        _db.OrdenesCompraLineas.RemoveRange(orden.Lineas);
        orden.Lineas.Clear();

        foreach (var lineaDto in dto.Lineas)
        {
            if (lineaDto.CantidadSolicitada <= 0)
            {
                throw new InvalidOperationException("La cantidad solicitada debe ser mayor a cero.");
            }

            var recurso = recursos[lineaDto.RecursoId];
            var precio = lineaDto.PrecioUnitarioEstimado > 0
                ? lineaDto.PrecioUnitarioEstimado
                : recurso.CostoEstimado;

            orden.Lineas.Add(new OrdenCompraLinea
            {
                Id = Guid.NewGuid(),
                OrdenId = orden.Id,
                RecursoId = lineaDto.RecursoId,
                CantidadSolicitada = lineaDto.CantidadSolicitada,
                CantidadRecibida = 0,
                PrecioUnitarioEstimado = precio
            });
        }

        await _db.SaveChangesAsync(ct);
        return (await ObtenerPorIdAsync(orden.Id, ct))!;
    }

    public async Task<OrdenCompraDto> CambiarEstadoAsync(
        Guid id,
        CambiarEstadoOrdenDto dto,
        Guid usuarioId,
        CancellationToken ct = default)
    {
        var orden = await _db.OrdenesCompra
            .Include(o => o.Lineas)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
        {
            throw new KeyNotFoundException($"No se encontró la orden de compra con ID '{id}'.");
        }

        var nuevoEstado = dto.Estado.Trim().ToLowerInvariant();

        if (orden.Estado == nuevoEstado)
        {
            return (await ObtenerPorIdAsync(orden.Id, ct))!;
        }

        if (orden.Estado == "recibida_total")
        {
            throw new InvalidOperationException("No se puede cambiar el estado de una orden que ya fue recibida en su totalidad.");
        }

        if (nuevoEstado == "cancelada")
        {
            var yaRecibido = orden.Lineas.Any(l => l.CantidadRecibida > 0);
            if (yaRecibido)
            {
                throw new InvalidOperationException("No se puede cancelar una orden de compra que ya posee recepciones parciales registradas.");
            }
        }

        orden.Estado = nuevoEstado;
        if (!string.IsNullOrWhiteSpace(dto.Observaciones))
        {
            orden.Observaciones = string.IsNullOrWhiteSpace(orden.Observaciones)
                ? dto.Observaciones.Trim()
                : $"{orden.Observaciones} | {dto.Observaciones.Trim()}";
        }

        orden.ActualizadoEn = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return (await ObtenerPorIdAsync(orden.Id, ct))!;
    }

    public async Task<OrdenCompraDto> RecibirOrdenAsync(
        Guid id,
        RecepcionCompraDto dto,
        Guid usuarioId,
        CancellationToken ct = default)
    {
        var orden = await _db.OrdenesCompra
            .Include(o => o.Lineas)
                .ThenInclude(l => l.Recurso)
            .Include(o => o.Proveedor)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (orden == null)
        {
            throw new KeyNotFoundException($"No se encontró la orden de compra con ID '{id}'.");
        }

        if (orden.Estado == "borrador")
        {
            throw new InvalidOperationException("La orden de compra debe ser aprobada antes de recibir mercancía.");
        }

        if (orden.Estado == "cancelada")
        {
            throw new InvalidOperationException("No se puede recibir mercancía de una orden de compra cancelada.");
        }

        if (orden.Estado == "recibida_total")
        {
            throw new InvalidOperationException("Esta orden de compra ya ha sido recibida en su totalidad.");
        }

        // Validar ubicación de destino
        var ubicacion = await _db.Ubicaciones
            .FirstOrDefaultAsync(u => u.Id == dto.UbicacionRecepcionId && u.Activa, ct);

        if (ubicacion == null)
        {
            throw new InvalidOperationException("La ubicación de recepción seleccionada no existe o está inactiva.");
        }

        if (dto.Lineas == null || dto.Lineas.Count == 0)
        {
            throw new InvalidOperationException("Debe especificar al menos una línea con cantidad recibida.");
        }

        // Validar líneas y cantidades
        var lineasMap = orden.Lineas.ToDictionary(l => l.Id);
        var lineasMovimiento = new List<CrearMovimientoLineaDto>();

        foreach (var item in dto.Lineas)
        {
            if (!lineasMap.TryGetValue(item.LineaId, out var lineaOrden))
            {
                throw new InvalidOperationException($"La línea con ID '{item.LineaId}' no pertenece a esta orden de compra.");
            }

            if (item.CantidadRecibida <= 0)
            {
                throw new InvalidOperationException("La cantidad recibida debe ser mayor a cero.");
            }

            var pendiente = lineaOrden.CantidadSolicitada - lineaOrden.CantidadRecibida;
            if (item.CantidadRecibida > pendiente)
            {
                throw new InvalidOperationException(
                    $"La cantidad a recibir ({item.CantidadRecibida}) para el recurso '{lineaOrden.Recurso?.Nombre}' " +
                    $"excede la cantidad pendiente ({pendiente}).");
            }

            // Manejo de lote si viene indicado
            Guid? loteId = null;
            if (!string.IsNullOrWhiteSpace(item.NumeroLote))
            {
                var numLote = item.NumeroLote.Trim();
                var loteExistente = await _db.Lotes
                    .FirstOrDefaultAsync(l => l.RecursoId == lineaOrden.RecursoId && l.NumeroLote == numLote, ct);

                if (loteExistente == null)
                {
                    loteExistente = new Lote
                    {
                        Id = Guid.NewGuid(),
                        RecursoId = lineaOrden.RecursoId,
                        NumeroLote = numLote,
                        FechaFabricacion = DateOnly.FromDateTime(DateTime.UtcNow),
                        FechaVencimiento = item.FechaVencimiento,
                        ProveedorId = orden.ProveedorId,
                        CreadoEn = DateTime.UtcNow
                    };
                    _db.Lotes.Add(loteExistente);
                    await _db.SaveChangesAsync(ct);
                }

                loteId = loteExistente.Id;
            }

            lineasMovimiento.Add(new CrearMovimientoLineaDto
            {
                RecursoId = lineaOrden.RecursoId,
                Cantidad = item.CantidadRecibida,
                CostoUnitario = lineaOrden.PrecioUnitarioEstimado,
                LoteId = loteId
            });

            // Actualizar cantidad recibida en la línea
            lineaOrden.CantidadRecibida += item.CantidadRecibida;
        }

        // Registrar movimiento de almacén (Entrada transaccional)
        var motivo = string.IsNullOrWhiteSpace(dto.Observaciones)
            ? $"Recepción de mercancía - Orden {orden.NumeroOrden}"
            : $"Recepción de mercancía - Orden {orden.NumeroOrden}. {dto.Observaciones.Trim()}";

        var movDto = new CrearMovimientoDto
        {
            Tipo = "entrada",
            OrigenUbicacionId = null,
            DestinoUbicacionId = dto.UbicacionRecepcionId,
            Motivo = motivo,
            ComprobanteUrl = dto.ConduceOReferencia?.Trim(),
            OrigenIa = false,
            Lineas = lineasMovimiento
        };

        await _movimientoService.RegistrarMovimientoAsync(movDto, usuarioId, null, ct);

        // Evaluar estado final de la orden
        var todasCompletas = orden.Lineas.All(l => l.CantidadRecibida >= l.CantidadSolicitada);
        orden.Estado = todasCompletas ? "recibida_total" : "recibida_parcial";
        orden.ActualizadoEn = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return (await ObtenerPorIdAsync(orden.Id, ct))!;
    }

    public async Task<List<SugerenciaOrdenStockBajoDto>> ObtenerSugerenciasStockBajoAsync(
        Guid? proveedorId = null,
        CancellationToken ct = default)
    {
        // 1. Obtener recursos activos con existencias
        var recursosQuery = _db.Recursos
            .Include(r => r.Categoria)
            .Include(r => r.Existencias)
            .Where(r => r.Activo)
            .AsNoTracking();

        var recursos = await recursosQuery.ToListAsync(ct);

        // 2. Obtener proveedores habituales (a partir de últimos lotes suministrados)
        var ultimosLotes = await _db.Lotes
            .Include(l => l.Proveedor)
            .Where(l => l.ProveedorId != null && l.Proveedor!.Activo)
            .OrderByDescending(l => l.CreadoEn)
            .AsNoTracking()
            .ToListAsync(ct);

        var proveedorPorRecurso = ultimosLotes
            .GroupBy(l => l.RecursoId)
            .ToDictionary(g => g.Key, g => g.First().Proveedor!);

        var sugerencias = new List<SugerenciaOrdenStockBajoDto>();

        foreach (var r in recursos)
        {
            var stockActual = r.Existencias.Sum(e => e.Cantidad);
            var puntoReorden = r.PuntoReorden ?? r.StockMinimo;

            // Alerta si el stock actual está por debajo o igual al punto de reorden
            if (stockActual <= puntoReorden || stockActual <= r.StockMinimo)
            {
                proveedorPorRecurso.TryGetValue(r.Id, out var prov);

                if (proveedorId.HasValue && (prov == null || prov.Id != proveedorId.Value))
                {
                    continue;
                }

                var stockMaximo = r.StockMaximo.HasValue && r.StockMaximo.Value > r.StockMinimo
                    ? r.StockMaximo.Value
                    : (r.StockMinimo > 0 ? r.StockMinimo * 2 : 20);

                var cantidadSugerida = Math.Max(1, stockMaximo - stockActual);

                sugerencias.Add(new SugerenciaOrdenStockBajoDto
                {
                    RecursoId = r.Id,
                    RecursoSku = r.Sku,
                    RecursoNombre = r.Nombre,
                    CategoriaNombre = r.Categoria?.Nombre ?? "General",
                    ProveedorSugeridoId = prov?.Id,
                    ProveedorSugeridoNombre = prov?.NombreComercial,
                    StockActual = stockActual,
                    StockMinimo = r.StockMinimo,
                    PuntoReorden = puntoReorden,
                    CantidadSugerida = cantidadSugerida,
                    CostoUnitarioEstimado = r.CostoEstimado
                });
            }
        }

        return sugerencias.OrderBy(s => s.StockActual - s.StockMinimo).ToList();
    }

    private static OrdenCompraDto MapearADto(OrdenCompra o)
    {
        var lineas = o.Lineas.Select(l => new OrdenCompraLineaDto
        {
            Id = l.Id,
            OrdenId = l.OrdenId,
            RecursoId = l.RecursoId,
            RecursoSku = l.Recurso?.Sku ?? string.Empty,
            RecursoNombre = l.Recurso?.Nombre ?? string.Empty,
            RecursoTipo = l.Recurso?.Tipo ?? "consumible",
            UnidadMedida = l.Recurso?.UnidadMedida ?? "unidad",
            CantidadSolicitada = l.CantidadSolicitada,
            CantidadRecibida = l.CantidadRecibida,
            PrecioUnitarioEstimado = l.PrecioUnitarioEstimado
        }).ToList();

        var totalSolicitado = lineas.Sum(l => l.CantidadSolicitada);
        var totalRecibido = lineas.Sum(l => l.CantidadRecibida);
        var totalEstimado = lineas.Sum(l => l.SubtotalEstimado);

        return new OrdenCompraDto
        {
            Id = o.Id,
            NumeroOrden = o.NumeroOrden,
            ProveedorId = o.ProveedorId,
            ProveedorNombre = o.Proveedor?.NombreComercial ?? string.Empty,
            ProveedorRnc = o.Proveedor?.Rnc,
            ProveedorContacto = o.Proveedor?.ContactoNombre,
            ProveedorTelefono = o.Proveedor?.Telefono,
            ProveedorCorreo = o.Proveedor?.Correo,
            SolicitanteId = o.SolicitanteId,
            SolicitanteNombre = o.Solicitante?.NombreCompleto ?? string.Empty,
            SolicitanteCorreo = o.Solicitante?.Correo ?? string.Empty,
            Estado = o.Estado,
            FechaEmision = o.FechaEmision,
            FechaEntregaEstimada = o.FechaEntregaEstimada,
            Observaciones = o.Observaciones,
            TotalLineas = lineas.Count,
            TotalUnidadesSolicitadas = totalSolicitado,
            TotalUnidadesRecibidas = totalRecibido,
            TotalEstimado = totalEstimado,
            CreadoEn = o.CreadoEn,
            ActualizadoEn = o.ActualizadoEn,
            Lineas = lineas
        };
    }
}
