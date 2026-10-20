using Microsoft.EntityFrameworkCore;
using QRCoder;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class CodigoService : ICodigoService
{
    private readonly IApplicationDbContext _context;

    public CodigoService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<RecursoCodigoDto>> ObtenerCodigosAsync(Guid recursoId, CancellationToken ct = default)
    {
        var codigos = await _context.RecursosCodigos
            .AsNoTracking()
            .Where(c => c.RecursoId == recursoId)
            .OrderByDescending(c => c.EsPrincipal)
            .ThenBy(c => c.CreadoEn)
            .Select(c => new RecursoCodigoDto
            {
                Id = c.Id,
                TipoCodigo = c.TipoCodigo,
                Codigo = c.Codigo,
                EsPrincipal = c.EsPrincipal,
                CreadoEn = c.CreadoEn
            })
            .ToListAsync(ct);

        return codigos;
    }

    public async Task<RecursoCodigoDto> AgregarCodigoAsync(Guid recursoId, AgregarCodigoRecursoDto dto, CancellationToken ct = default)
    {
        var recurso = await _context.Recursos.FirstOrDefaultAsync(r => r.Id == recursoId, ct);
        if (recurso == null)
        {
            throw new InvalidOperationException($"No se encontró ningún recurso con el identificador '{recursoId}'.");
        }

        var codigoLimpio = dto.Codigo.Trim();

        // 1. Validar que no exista el código asignado a ningún recurso en el sistema
        var existeEnCodigos = await _context.RecursosCodigos
            .AnyAsync(c => c.Codigo.ToLower() == codigoLimpio.ToLower(), ct);

        if (existeEnCodigos)
        {
            throw new InvalidOperationException($"El código '{codigoLimpio}' ya se encuentra registrado y asignado a un recurso en el sistema.");
        }

        // 2. Validar que no coincida con el SKU de otro recurso
        var existeComoSku = await _context.Recursos
            .AnyAsync(r => r.Id != recursoId && r.Sku.ToLower() == codigoLimpio.ToLower(), ct);

        if (existeComoSku)
        {
            throw new InvalidOperationException($"El código '{codigoLimpio}' coincide con el SKU de otro recurso existente.");
        }

        // 3. Validar que no coincida con número de serie o placa de un activo
        var existeEnActivos = await _context.ActivosSerie
            .AnyAsync(a => a.NumeroSerie.ToLower() == codigoLimpio.ToLower() ||
                           (a.PlacaInstitucional != null && a.PlacaInstitucional.ToLower() == codigoLimpio.ToLower()), ct);

        if (existeEnActivos)
        {
            throw new InvalidOperationException($"El código '{codigoLimpio}' coincide con un número de serie o placa de activo ya registrada.");
        }

        // Si se marca como principal, desmarcar los anteriores del mismo tipo en este recurso
        if (dto.EsPrincipal)
        {
            var anteriores = await _context.RecursosCodigos
                .Where(c => c.RecursoId == recursoId && c.TipoCodigo == dto.TipoCodigo && c.EsPrincipal)
                .ToListAsync(ct);

            foreach (var c in anteriores)
            {
                c.EsPrincipal = false;
            }
        }

        var nuevoCodigo = new RecursoCodigo
        {
            Id = Guid.NewGuid(),
            RecursoId = recursoId,
            TipoCodigo = dto.TipoCodigo,
            Codigo = codigoLimpio,
            EsPrincipal = dto.EsPrincipal,
            CreadoEn = DateTime.UtcNow
        };

        _context.RecursosCodigos.Add(nuevoCodigo);
        await _context.SaveChangesAsync(ct);

        return new RecursoCodigoDto
        {
            Id = nuevoCodigo.Id,
            TipoCodigo = nuevoCodigo.TipoCodigo,
            Codigo = nuevoCodigo.Codigo,
            EsPrincipal = nuevoCodigo.EsPrincipal,
            CreadoEn = nuevoCodigo.CreadoEn
        };
    }

    public async Task<bool> EliminarCodigoAsync(Guid recursoId, Guid codigoId, CancellationToken ct = default)
    {
        var codigo = await _context.RecursosCodigos
            .FirstOrDefaultAsync(c => c.RecursoId == recursoId && c.Id == codigoId, ct);

        if (codigo == null) return false;

        _context.RecursosCodigos.Remove(codigo);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public Task<byte[]> GenerarQrPngAsync(string contenido, int pixelesPorModulo = 10, CancellationToken ct = default)
    {
        using var qrGenerator = new QRCodeGenerator();
        var qrCodeData = qrGenerator.CreateQrCode(contenido, QRCodeGenerator.ECCLevel.Q);
        var qrCode = new PngByteQRCode(qrCodeData);
        var bytes = qrCode.GetGraphic(pixelesPorModulo);
        return Task.FromResult(bytes);
    }

    public async Task<EnlaceQrDto> ObtenerOAsignarQrPropioAsync(Guid recursoId, string baseUrl, CancellationToken ct = default)
    {
        var recurso = await _context.Recursos
            .Include(r => r.Codigos)
            .FirstOrDefaultAsync(r => r.Id == recursoId, ct);

        if (recurso == null)
        {
            throw new InvalidOperationException($"No se encontró ningún recurso con el ID '{recursoId}'.");
        }

        // El QR seguro contiene únicamente la URL canónica del recurso, sin credenciales ni datos sensibles
        var urlLimpia = baseUrl.TrimEnd('/');
        var enlaceSeguro = $"{urlLimpia}/recurso/{recursoId}";

        var qrCodigo = recurso.Codigos.FirstOrDefault(c => c.TipoCodigo == "qr_propio");
        if (qrCodigo == null)
        {
            qrCodigo = new RecursoCodigo
            {
                Id = Guid.NewGuid(),
                RecursoId = recursoId,
                TipoCodigo = "qr_propio",
                Codigo = enlaceSeguro,
                EsPrincipal = true,
                CreadoEn = DateTime.UtcNow
            };
            _context.RecursosCodigos.Add(qrCodigo);
            await _context.SaveChangesAsync(ct);
        }

        return new EnlaceQrDto
        {
            RecursoId = recurso.Id,
            Sku = recurso.Sku,
            CodigoQr = qrCodigo.Codigo,
            EnlaceSeguro = enlaceSeguro,
            UrlDescargaImagen = $"/api/v1/recursos/{recursoId}/qr/imagen"
        };
    }

    public async Task<ResolucionCodigoDto> ResolverCodigoAsync(string codigo, string baseUrl, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(codigo))
        {
            return new ResolucionCodigoDto
            {
                Encontrado = false,
                CodigoBuscado = codigo,
                Mensaje = "Debe suministrar un código válido para escanear."
            };
        }

        var valorLimpio = codigo.Trim();

        // Si el código escaneado es una URL completa (ej: http://.../recurso/{guid}), extraer el Guid
        Guid? idExtraido = null;
        if (Uri.TryCreate(valorLimpio, UriKind.Absolute, out var uri))
        {
            var segments = uri.Segments;
            if (segments.Length > 0 && Guid.TryParse(segments[^1].TrimEnd('/'), out var parsedGuid))
            {
                idExtraido = parsedGuid;
            }
        }
        else if (Guid.TryParse(valorLimpio, out var directGuid))
        {
            idExtraido = directGuid;
        }

        // 1. Buscar en RecursosCodigos
        var recursoCodigo = await _context.RecursosCodigos
            .AsNoTracking()
            .Include(c => c.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(c => c.Recurso)
                .ThenInclude(r => r.Fotos)
            .Include(c => c.Recurso)
                .ThenInclude(r => r.Existencias)
            .FirstOrDefaultAsync(c => c.Codigo.ToLower() == valorLimpio.ToLower(), ct);

        if (recursoCodigo != null)
        {
            var r = recursoCodigo.Recurso;
            return CrearResolucionRecurso(r, valorLimpio, recursoCodigo.TipoCodigo, baseUrl);
        }

        // 2. Si vino un Guid extraído de la URL o directo, buscar por Id de Recurso
        if (idExtraido.HasValue)
        {
            var rPorId = await _context.Recursos
                .AsNoTracking()
                .Include(r => r.Categoria)
                .Include(r => r.Fotos)
                .Include(r => r.Existencias)
                .FirstOrDefaultAsync(r => r.Id == idExtraido.Value, ct);

            if (rPorId != null)
            {
                return CrearResolucionRecurso(rPorId, valorLimpio, "qr_propio", baseUrl);
            }
        }

        // 3. Buscar por SKU de Recurso
        var rPorSku = await _context.Recursos
            .AsNoTracking()
            .Include(r => r.Categoria)
            .Include(r => r.Fotos)
            .Include(r => r.Existencias)
            .FirstOrDefaultAsync(r => r.Sku.ToLower() == valorLimpio.ToLower(), ct);

        if (rPorSku != null)
        {
            return CrearResolucionRecurso(rPorSku, valorLimpio, "sku", baseUrl);
        }

        // 4. Buscar por Número de Serie o Placa en ActivosSerie
        var activo = await _context.ActivosSerie
            .AsNoTracking()
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Categoria)
            .Include(a => a.Recurso)
                .ThenInclude(r => r.Fotos)
            .Include(a => a.Ubicacion)
            .Include(a => a.Responsable)
            .Include(a => a.Proveedor)
            .FirstOrDefaultAsync(a =>
                a.NumeroSerie.ToLower() == valorLimpio.ToLower() ||
                (a.PlacaInstitucional != null && a.PlacaInstitucional.ToLower() == valorLimpio.ToLower()), ct);

        if (activo != null)
        {
            var tipoDetectado = activo.NumeroSerie.Equals(valorLimpio, StringComparison.OrdinalIgnoreCase)
                ? "numero_serie"
                : "placa_institucional";

            var activoDto = new RecursoActivoSerieDto
            {
                Id = activo.Id,
                NumeroSerie = activo.NumeroSerie,
                PlacaInstitucional = activo.PlacaInstitucional,
                Estado = activo.Estado,
                UbicacionId = activo.UbicacionId,
                UbicacionNombre = activo.Ubicacion.Nombre,
                ResponsableId = activo.ResponsableId,
                ResponsableNombre = activo.Responsable?.NombreCompleto,
                ProveedorId = activo.ProveedorId,
                ProveedorNombre = activo.Proveedor?.NombreComercial,
                FechaAdquisicion = activo.FechaAdquisicion,
                Notas = activo.Notas
            };

            var recursoDto = MapearRecursoDto(activo.Recurso);

            return new ResolucionCodigoDto
            {
                Encontrado = true,
                CodigoBuscado = valorLimpio,
                TipoEntidad = "activo_serie",
                TipoCodigoDetectado = tipoDetectado,
                UrlFicha = $"/activos/{activo.Id}",
                Recurso = recursoDto,
                ActivoSerie = activoDto,
                Mensaje = $"Activo con serie '{activo.NumeroSerie}' identificado correctamente."
            };
        }

        // 5. No encontrado
        return new ResolucionCodigoDto
        {
            Encontrado = false,
            CodigoBuscado = valorLimpio,
            Mensaje = $"No se encontró ningún recurso, activo ni código registrado que coincida con '{valorLimpio}'."
        };
    }

    private static ResolucionCodigoDto CrearResolucionRecurso(Recurso r, string codigoBuscado, string tipoCodigo, string baseUrl)
    {
        var recursoDto = MapearRecursoDto(r);

        return new ResolucionCodigoDto
        {
            Encontrado = true,
            CodigoBuscado = codigoBuscado,
            TipoEntidad = "recurso",
            TipoCodigoDetectado = tipoCodigo,
            UrlFicha = $"/recurso/{r.Id}",
            Recurso = recursoDto,
            Mensaje = $"Recurso '{r.Nombre}' identificado con éxito vía {tipoCodigo}."
        };
    }

    private static RecursoDto MapearRecursoDto(Recurso r)
    {
        return new RecursoDto
        {
            Id = r.Id,
            Sku = r.Sku,
            Nombre = r.Nombre,
            Descripcion = r.Descripcion,
            CategoriaId = r.CategoriaId,
            CategoriaNombre = r.Categoria?.Nombre ?? "",
            Tipo = r.Tipo,
            UnidadMedida = r.UnidadMedida,
            StockMinimo = r.StockMinimo,
            StockMaximo = r.StockMaximo,
            PuntoReorden = r.PuntoReorden,
            CostoEstimado = r.CostoEstimado,
            Activo = r.Activo,
            StockActual = r.Existencias?.Sum(e => e.Cantidad) ?? 0,
            FotoPrincipalUrl = r.Fotos?.FirstOrDefault(f => f.EsPrincipal)?.UrlArchivo ?? r.Fotos?.FirstOrDefault()?.UrlArchivo,
            TotalFotos = r.Fotos?.Count ?? 0,
            CreadoEn = r.CreadoEn,
            ActualizadoEn = r.ActualizadoEn
        };
    }
}
