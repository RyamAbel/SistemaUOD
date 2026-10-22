using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;
using Xunit;

namespace SistemaUOD.Tests;

public class ImportacionEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public ImportacionEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static HttpRequestMessage CrearPeticion(HttpMethod metodo, string url, string role = "super_admin")
    {
        var request = new HttpRequestMessage(metodo, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "test-token");
        request.Headers.Add("X-Test-UserId", "00000000-0000-0000-0000-000000000001");
        request.Headers.Add("X-Test-Role", role);
        request.Headers.Add("X-Test-Email", $"{role}@uod.edu.do");
        return request;
    }

    [Fact]
    public async Task DescargarPlantillaCsv_RetornaCsvConCabecerasCorrectas()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/importacion/plantilla-csv");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("text/csv", response.Content.Headers.ContentType?.ToString() ?? "");

        var contenidoCsv = await response.Content.ReadAsStringAsync();
        Assert.Contains("SKU,Nombre,Descripcion,Categoria,Tipo,UnidadMedida", contenidoCsv);
        Assert.Contains("ODON-RES-001", contenidoCsv);
    }

    [Fact]
    public async Task ValidarFilas_DetectaFilasValidasYErroresObligatorios()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/importacion/validar");

        var filas = new List<ImportarRecursoFilaDto>
        {
            new()
            {
                NumeroFila = 1,
                Sku = $"IMP-{Guid.NewGuid().ToString()[..6]}",
                Nombre = "Cemento Dental Ionómero de Vidrio",
                Categoria = "Materiales Dentales",
                Tipo = "consumible",
                StockMinimo = 5,
                StockMaximo = 20,
                CostoEstimado = 750.00m
            },
            new()
            {
                NumeroFila = 2,
                Sku = "", // Error: SKU vacío
                Nombre = "No", // Error: Nombre < 3 caracteres
                Tipo = "invalido", // Error: Tipo desconocido
                StockMinimo = -5, // Error: Stock negativo
                CostoEstimado = -100 // Error: Costo negativo
            }
        };

        request.Content = JsonContent.Create(filas);

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var resultado = await response.Content.ReadFromJsonAsync<ResultadoValidacionImportacionDto>(JsonOptions);
        Assert.NotNull(resultado);
        Assert.Equal(2, resultado.TotalFilas);
        Assert.Equal(1, resultado.FilasValidas);
        Assert.Equal(1, resultado.FilasConError);
        Assert.NotEmpty(resultado.Errores);
        Assert.Contains(resultado.Errores, e => e.Campo == "SKU");
        Assert.Contains(resultado.Errores, e => e.Campo == "Nombre");
    }

    [Fact]
    public async Task ValidarFilas_DetectaSkusDuplicadosEnLoteYEnBaseDeDatos()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var cat = await db.Categorias.FirstAsync();
            var recursoExistente = new Recurso
            {
                Id = Guid.NewGuid(),
                Sku = $"EXISTENTE-{Guid.NewGuid().ToString()[..6]}",
                Nombre = "Recurso Previamente Creado",
                CategoriaId = cat.Id,
                Activo = true
            };
            db.Recursos.Add(recursoExistente);
            await db.SaveChangesAsync();

            var client = _factory.CreateClient();
            var request = CrearPeticion(HttpMethod.Post, "/api/v1/importacion/validar");

            var skuDuplicadoLote = $"LOTE-DUP-{Guid.NewGuid().ToString()[..4]}";

            var filas = new List<ImportarRecursoFilaDto>
            {
                new()
                {
                    NumeroFila = 1,
                    Sku = recursoExistente.Sku, // Duplicado en BD
                    Nombre = "Duplicado de BD",
                    Tipo = "consumible"
                },
                new()
                {
                    NumeroFila = 2,
                    Sku = skuDuplicadoLote,
                    Nombre = "Primer ítem de lote",
                    Tipo = "consumible"
                },
                new()
                {
                    NumeroFila = 3,
                    Sku = skuDuplicadoLote, // Duplicado en el mismo lote
                    Nombre = "Segundo ítem de lote con mismo SKU",
                    Tipo = "consumible"
                }
            };

            request.Content = JsonContent.Create(filas);

            // Act
            var response = await client.SendAsync(request);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var resultado = await response.Content.ReadFromJsonAsync<ResultadoValidacionImportacionDto>(JsonOptions);
            Assert.NotNull(resultado);
            Assert.Equal(1, resultado.FilasValidas);
            Assert.Equal(2, resultado.FilasConError);
            Assert.Contains(resultado.Errores, e => e.Mensaje.Contains("ya está registrado en el catálogo"));
            Assert.Contains(resultado.Errores, e => e.Mensaje.Contains("está duplicado dentro del archivo"));
        }
    }

    [Fact]
    public async Task EjecutarImportacion_SinPermisoGestion_RetornaForbidden()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/importacion/ejecutar", role: "auditor");

        var dto = new EjecutarImportacionSolicitudDto
        {
            Filas = new List<ImportarRecursoFilaDto>
            {
                new()
                {
                    Sku = $"DENIED-{Guid.NewGuid().ToString()[..6]}",
                    Nombre = "Recurso Sin Permiso",
                    Tipo = "consumible"
                }
            }
        };

        request.Content = JsonContent.Create(dto);

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task EjecutarImportacion_ConPermiso_CreaRecursosYAsignaCategorias()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/importacion/ejecutar", role: "admin_inventario");

        var sku1 = $"BATCH-{Guid.NewGuid().ToString()[..6].ToUpperInvariant()}";
        var sku2 = $"BATCH-{Guid.NewGuid().ToString()[..6].ToUpperInvariant()}";
        var nombreCat = $"Importada-{Guid.NewGuid().ToString()[..4]}";

        var dto = new EjecutarImportacionSolicitudDto
        {
            Filas = new List<ImportarRecursoFilaDto>
            {
                new()
                {
                    Sku = sku1,
                    Nombre = "Espejo Bucal N4 Acero Inoxidable",
                    Categoria = nombreCat,
                    Tipo = "consumible",
                    StockMinimo = 10,
                    StockMaximo = 50,
                    PuntoReorden = 15,
                    CostoEstimado = 120.50m
                },
                new()
                {
                    Sku = sku2,
                    Nombre = "Sillón Odontológico Ergonómico Pro",
                    Categoria = nombreCat,
                    Tipo = "activo_fijo",
                    StockMinimo = 1,
                    StockMaximo = 5,
                    CostoEstimado = 85000.00m
                }
            }
        };

        request.Content = JsonContent.Create(dto);

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var resultado = await response.Content.ReadFromJsonAsync<ResultadoImportacionDto>(JsonOptions);
        Assert.NotNull(resultado);
        Assert.Equal(2, resultado.RecursosCreados);
        Assert.Equal(0, resultado.RecursosOmitidos);

        // Verificar en base de datos
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var recursoCreado = await db.Recursos
            .Include(r => r.Categoria)
            .FirstOrDefaultAsync(r => r.Sku == sku1);

        Assert.NotNull(recursoCreado);
        Assert.Equal("Espejo Bucal N4 Acero Inoxidable", recursoCreado.Nombre);
        Assert.Equal(120.50m, recursoCreado.CostoEstimado);
        Assert.True(recursoCreado.Activo);
        Assert.Equal(nombreCat, recursoCreado.Categoria.Nombre);
    }
}
