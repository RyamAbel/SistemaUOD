using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class RecursoFotoService : IRecursoFotoService
{
    private const long MaxTamanoBytes = 5 * 1024 * 1024; // 5 MB
    private const string BucketFotos = "recursos-fotos";

    private readonly IApplicationDbContext _context;
    private readonly IStorageService _storageService;

    public RecursoFotoService(
        IApplicationDbContext context,
        IStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    public async Task<List<RecursoFotoDto>> ObtenerFotosAsync(Guid recursoId, CancellationToken ct = default)
    {
        var fotos = await _context.RecursosFotos
            .AsNoTracking()
            .Where(f => f.RecursoId == recursoId)
            .OrderByDescending(f => f.EsPrincipal)
            .ThenBy(f => f.Orden)
            .Select(f => new RecursoFotoDto
            {
                Id = f.Id,
                UrlArchivo = f.UrlArchivo,
                EsPrincipal = f.EsPrincipal,
                Orden = f.Orden,
                CreadoEn = f.CreadoEn
            })
            .ToListAsync(ct);

        return fotos;
    }

    public async Task<SubirFotoRespuestaDto> SubirFotoAsync(
        Guid recursoId,
        Stream stream,
        string nombreArchivo,
        string contentType,
        long tamanoBytes,
        bool esPrincipal,
        CancellationToken ct = default)
    {
        // 1. Validar que el recurso exista
        var recursoExiste = await _context.Recursos.AnyAsync(r => r.Id == recursoId, ct);
        if (!recursoExiste)
        {
            throw new InvalidOperationException($"No se encontró ningún recurso con el identificador '{recursoId}'.");
        }

        // 2. Validar tamaño máximo (5 MB)
        if (tamanoBytes > MaxTamanoBytes)
        {
            throw new InvalidOperationException("El archivo excede el tamaño máximo permitido de 5 MB.");
        }

        // 3. Validar tipo real de archivo mediante comprobación de Magic Numbers binarios
        var (esValido, extensionReal, mimeReal) = ValidarCabeceraBinaria(stream);
        if (!esValido)
        {
            throw new InvalidOperationException("El formato real del archivo no es válido. Solo se admiten imágenes JPG, PNG o WebP.");
        }

        // 4. Preparar ruta en Supabase Storage: {recursoId}/{UUID}.{ext}
        var fotoId = Guid.NewGuid();
        var rutaStorage = $"{recursoId}/{fotoId}{extensionReal}";

        // Subir archivo al bucket
        stream.Position = 0;
        var urlArchivo = await _storageService.SubirArchivoAsync(BucketFotos, rutaStorage, stream, mimeReal, ct);
        var urlFirmada = await _storageService.ObtenerUrlFirmadaAsync(BucketFotos, rutaStorage, TimeSpan.FromHours(1), ct);

        // 5. Gestión de foto principal y orden
        var totalFotos = await _context.RecursosFotos
            .Where(f => f.RecursoId == recursoId)
            .CountAsync(ct);

        var debeSerPrincipal = esPrincipal || totalFotos == 0;

        if (debeSerPrincipal)
        {
            var fotosExistentes = await _context.RecursosFotos
                .Where(f => f.RecursoId == recursoId && f.EsPrincipal)
                .ToListAsync(ct);

            foreach (var f in fotosExistentes)
            {
                f.EsPrincipal = false;
            }
        }

        var maxOrden = await _context.RecursosFotos
            .Where(f => f.RecursoId == recursoId)
            .Select(f => (int?)f.Orden)
            .MaxAsync(ct) ?? -1;

        var recursoFoto = new RecursoFoto
        {
            Id = fotoId,
            RecursoId = recursoId,
            UrlArchivo = urlArchivo,
            EsPrincipal = debeSerPrincipal,
            Orden = maxOrden + 1,
            CreadoEn = DateTime.UtcNow
        };

        _context.RecursosFotos.Add(recursoFoto);
        await _context.SaveChangesAsync(ct);

        return new SubirFotoRespuestaDto
        {
            Id = recursoFoto.Id,
            RecursoId = recursoFoto.RecursoId,
            UrlArchivo = recursoFoto.UrlArchivo,
            UrlFirmada = urlFirmada,
            EsPrincipal = recursoFoto.EsPrincipal,
            Orden = recursoFoto.Orden,
            CreadoEn = recursoFoto.CreadoEn
        };
    }

    public async Task<bool> EstablecerFotoPrincipalAsync(Guid recursoId, Guid fotoId, CancellationToken ct = default)
    {
        var fotos = await _context.RecursosFotos
            .Where(f => f.RecursoId == recursoId)
            .ToListAsync(ct);

        var fotoObjetivo = fotos.FirstOrDefault(f => f.Id == fotoId);
        if (fotoObjetivo == null) return false;

        foreach (var f in fotos)
        {
            f.EsPrincipal = f.Id == fotoId;
        }

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ReordenarFotosAsync(Guid recursoId, List<Guid> fotosOrdenadasIds, CancellationToken ct = default)
    {
        var fotos = await _context.RecursosFotos
            .Where(f => f.RecursoId == recursoId)
            .ToListAsync(ct);

        if (fotos.Count == 0) return false;

        for (int i = 0; i < fotosOrdenadasIds.Count; i++)
        {
            var targetId = fotosOrdenadasIds[i];
            var f = fotos.FirstOrDefault(x => x.Id == targetId);
            if (f != null)
            {
                f.Orden = i;
            }
        }

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> EliminarFotoAsync(Guid recursoId, Guid fotoId, CancellationToken ct = default)
    {
        var foto = await _context.RecursosFotos
            .FirstOrDefaultAsync(f => f.RecursoId == recursoId && f.Id == fotoId, ct);

        if (foto == null) return false;

        var eraPrincipal = foto.EsPrincipal;

        _context.RecursosFotos.Remove(foto);

        // Si era la foto principal, promover la siguiente foto
        if (eraPrincipal)
        {
            var siguienteFoto = await _context.RecursosFotos
                .Where(f => f.RecursoId == recursoId && f.Id != fotoId)
                .OrderBy(f => f.Orden)
                .FirstOrDefaultAsync(ct);

            if (siguienteFoto != null)
            {
                siguienteFoto.EsPrincipal = true;
            }
        }

        await _context.SaveChangesAsync(ct);

        // Intentar eliminar del storage privado de forma asíncrona
        _ = _storageService.EliminarArchivoAsync(BucketFotos, $"{recursoId}/{fotoId}", ct);

        return true;
    }

    /// <summary>
    /// Valida los Magic Numbers binarios de los primeros bytes del archivo para certificar JPG, PNG o WebP.
    /// </summary>
    private static (bool esValido, string extension, string mime) ValidarCabeceraBinaria(Stream stream)
    {
        if (stream.Length < 12) return (false, "", "");

        var buffer = new byte[12];
        stream.Position = 0;
        var bytesLeidos = stream.Read(buffer, 0, 12);
        stream.Position = 0;

        if (bytesLeidos < 12) return (false, "", "");

        // 1. JPEG: FF D8 FF
        if (buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF)
        {
            return (true, ".jpg", "image/jpeg");
        }

        // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
        if (buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47 &&
            buffer[4] == 0x0D && buffer[5] == 0x0A && buffer[6] == 0x1A && buffer[7] == 0x0A)
        {
            return (true, ".png", "image/png");
        }

        // 3. WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
        if (buffer[0] == 0x52 && buffer[1] == 0x49 && buffer[2] == 0x46 && buffer[3] == 0x46 &&
            buffer[8] == 0x57 && buffer[9] == 0x45 && buffer[10] == 0x42 && buffer[11] == 0x50)
        {
            return (true, ".webp", "image/webp");
        }

        return (false, "", "");
    }
}
