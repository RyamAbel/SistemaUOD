using System.Text;
using Microsoft.EntityFrameworkCore;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;

namespace SistemaUOD.Infrastructure.Services;

public class ImportacionService : IImportacionService
{
    private readonly IApplicationDbContext _db;

    public ImportacionService(IApplicationDbContext db)
    {
        _db = db;
    }

    public byte[] GenerarPlantillaCsv()
    {
        var sb = new StringBuilder();
        // UTF-8 BOM
        sb.Append('\uFEFF');

        // Encabezados
        sb.AppendLine("SKU,Nombre,Descripcion,Categoria,Tipo,UnidadMedida,StockMinimo,StockMaximo,PuntoReorden,CostoEstimadoDOP");

        // Filas de ejemplo institucionales
        sb.AppendLine("ODON-RES-001,Resina Compuesta A2 Filtek,Jeringa 4g fotocurable universal para restauraciones,Materiales Dentales,consumible,jeringa,5,20,8,850.00");
        sb.AppendLine("TI-MON-024,Monitor Dell 24 pulgadas IPS,Resolución 1080p con entradas HDMI y DisplayPort,Equipos de Cómputo,activo_fijo,unidad,2,10,4,9500.00");
        sb.AppendLine("LAB-GUAN-M,Guantes de Nitrilo Talla M,Caja dispensadora de 100 unidades no estériles,Protección y Bioseguridad,consumible,caja,10,50,15,450.00");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<ResultadoValidacionImportacionDto> ValidarFilasAsync(
        List<ImportarRecursoFilaDto> filas,
        CancellationToken ct = default)
    {
        var resultado = new ResultadoValidacionImportacionDto
        {
            TotalFilas = filas.Count
        };

        if (filas == null || filas.Count == 0)
        {
            return resultado;
        }

        // 1. Cargar SKUs y nombres existentes para comprobación rápida en memoria
        var skusExistentes = await _db.Recursos
            .Select(r => r.Sku.ToLower())
            .ToListAsync(ct);
        var skusExistentesSet = new HashSet<string>(skusExistentes);

        var nombresExistentes = await _db.Recursos
            .Select(r => r.Nombre.ToLower())
            .ToListAsync(ct);
        var nombresExistentesSet = new HashSet<string>(nombresExistentes);

        var skusEnLote = new HashSet<string>();

        foreach (var fila in filas)
        {
            var erroresFila = new List<FilaValidacionErrorDto>();
            var filaNum = fila.NumeroFila > 0 ? fila.NumeroFila : filas.IndexOf(fila) + 1;

            // Validación SKU
            if (string.IsNullOrWhiteSpace(fila.Sku))
            {
                erroresFila.Add(new FilaValidacionErrorDto
                {
                    NumeroFila = filaNum,
                    Campo = "SKU",
                    Mensaje = "El código SKU es obligatorio.",
                    Nombre = fila.Nombre
                });
            }
            else
            {
                var skuNorm = fila.Sku.Trim().ToLowerInvariant();
                if (skusEnLote.Contains(skuNorm))
                {
                    erroresFila.Add(new FilaValidacionErrorDto
                    {
                        NumeroFila = filaNum,
                        Campo = "SKU",
                        Sku = fila.Sku,
                        Nombre = fila.Nombre,
                        Mensaje = $"El SKU '{fila.Sku}' está duplicado dentro del archivo importado."
                    });
                }
                else if (skusExistentesSet.Contains(skuNorm))
                {
                    erroresFila.Add(new FilaValidacionErrorDto
                    {
                        NumeroFila = filaNum,
                        Campo = "SKU",
                        Sku = fila.Sku,
                        Nombre = fila.Nombre,
                        Mensaje = $"El SKU '{fila.Sku}' ya está registrado en el catálogo institucional."
                    });
                }
                else
                {
                    skusEnLote.Add(skuNorm);
                }
            }

            // Validación Nombre
            if (string.IsNullOrWhiteSpace(fila.Nombre) || fila.Nombre.Trim().Length < 3)
            {
                erroresFila.Add(new FilaValidacionErrorDto
                {
                    NumeroFila = filaNum,
                    Campo = "Nombre",
                    Sku = fila.Sku,
                    Nombre = fila.Nombre,
                    Mensaje = "El nombre del recurso debe tener al menos 3 caracteres."
                });
            }
            else if (nombresExistentesSet.Contains(fila.Nombre.Trim().ToLowerInvariant()))
            {
                resultado.PosiblesDuplicados++;
            }

            // Validación Tipo
            var tipo = (fila.Tipo ?? "consumible").Trim().ToLowerInvariant();
            if (tipo != "consumible" && tipo != "activo_fijo")
            {
                erroresFila.Add(new FilaValidacionErrorDto
                {
                    NumeroFila = filaNum,
                    Campo = "Tipo",
                    Sku = fila.Sku,
                    Nombre = fila.Nombre,
                    Mensaje = $"Tipo '{fila.Tipo}' no válido. Use 'consumible' o 'activo_fijo'."
                });
            }

            // Validación Cantidades y Costos
            if (fila.StockMinimo < 0)
            {
                erroresFila.Add(new FilaValidacionErrorDto
                {
                    NumeroFila = filaNum,
                    Campo = "StockMinimo",
                    Sku = fila.Sku,
                    Nombre = fila.Nombre,
                    Mensaje = "El stock mínimo no puede ser negativo."
                });
            }

            if (fila.StockMaximo.HasValue && fila.StockMaximo.Value < fila.StockMinimo)
            {
                erroresFila.Add(new FilaValidacionErrorDto
                {
                    NumeroFila = filaNum,
                    Campo = "StockMaximo",
                    Sku = fila.Sku,
                    Nombre = fila.Nombre,
                    Mensaje = "El stock máximo debe ser mayor o igual al stock mínimo."
                });
            }

            if (fila.CostoEstimado < 0)
            {
                erroresFila.Add(new FilaValidacionErrorDto
                {
                    NumeroFila = filaNum,
                    Campo = "CostoEstimado",
                    Sku = fila.Sku,
                    Nombre = fila.Nombre,
                    Mensaje = "El costo unitario estimado no puede ser negativo."
                });
            }

            if (erroresFila.Count > 0)
            {
                resultado.Errores.AddRange(erroresFila);
            }
            else
            {
                resultado.RecursosValidos.Add(fila);
            }
        }

        resultado.FilasValidas = resultado.RecursosValidos.Count;
        resultado.FilasConError = resultado.Errores.Select(e => e.NumeroFila).Distinct().Count();

        return resultado;
    }

    public async Task<ResultadoImportacionDto> ImportarRecursosAsync(
        List<ImportarRecursoFilaDto> filas,
        Guid usuarioId,
        CancellationToken ct = default)
    {
        if (filas == null || filas.Count == 0)
        {
            return new ResultadoImportacionDto
            {
                RecursosCreados = 0,
                TotalProcesados = 0,
                Mensaje = "No se proporcionaron filas para importar."
            };
        }

        // 1. Obtener o crear categorías
        var categoriasDb = await _db.Categorias.ToListAsync(ct);
        var categoriasMap = categoriasDb.ToDictionary(c => c.Nombre.ToLowerInvariant(), c => c);

        Categoria ObtenerOCrearCategoria(string nombreCat)
        {
            var nombreNorm = string.IsNullOrWhiteSpace(nombreCat) ? "General" : nombreCat.Trim();
            var key = nombreNorm.ToLowerInvariant();

            if (categoriasMap.TryGetValue(key, out var existente))
            {
                return existente;
            }

            var codigoCat = $"CAT-{nombreNorm[..Math.Min(3, nombreNorm.Length)].ToUpper()}-{Guid.NewGuid().ToString()[..3].ToUpper()}";
            var nueva = new Categoria
            {
                Id = Guid.NewGuid(),
                Codigo = codigoCat,
                Nombre = nombreNorm,
                Activa = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            _db.Categorias.Add(nueva);
            categoriasMap[key] = nueva;
            return nueva;
        }

        var skusExistentes = (await _db.Recursos.Select(r => r.Sku.ToLower()).ToListAsync(ct)).ToHashSet();
        var recursosCreados = 0;
        var recursosOmitidos = 0;

        foreach (var fila in filas)
        {
            var skuNorm = fila.Sku.Trim().ToLowerInvariant();
            if (skusExistentes.Contains(skuNorm))
            {
                recursosOmitidos++;
                continue;
            }

            var categoria = ObtenerOCrearCategoria(fila.Categoria);
            var tipo = (fila.Tipo ?? "consumible").Trim().ToLowerInvariant() == "activo_fijo" ? "activo_fijo" : "consumible";

            var recurso = new Recurso
            {
                Id = Guid.NewGuid(),
                Sku = fila.Sku.Trim().ToUpperInvariant(),
                Nombre = fila.Nombre.Trim(),
                Descripcion = fila.Descripcion?.Trim(),
                CategoriaId = categoria.Id,
                Tipo = tipo,
                UnidadMedida = string.IsNullOrWhiteSpace(fila.UnidadMedida) ? "unidad" : fila.UnidadMedida.Trim(),
                StockMinimo = fila.StockMinimo >= 0 ? fila.StockMinimo : 0,
                StockMaximo = fila.StockMaximo,
                PuntoReorden = fila.PuntoReorden,
                CostoEstimado = fila.CostoEstimado >= 0 ? fila.CostoEstimado : 0.00m,
                Activo = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };

            _db.Recursos.Add(recurso);
            skusExistentes.Add(skuNorm);
            recursosCreados++;
        }

        await _db.SaveChangesAsync(ct);

        return new ResultadoImportacionDto
        {
            RecursosCreados = recursosCreados,
            RecursosOmitidos = recursosOmitidos,
            TotalProcesados = filas.Count,
            Mensaje = $"Importación completada: {recursosCreados} recursos dados de alta exitosamente, {recursosOmitidos} omitidos por SKU duplicado."
        };
    }
}
