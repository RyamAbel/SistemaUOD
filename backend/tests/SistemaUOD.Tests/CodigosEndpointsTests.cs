using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;
using SistemaUOD.Infrastructure.Data;
using Xunit;

namespace SistemaUOD.Tests;

public class CodigosEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CodigosEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static HttpRequestMessage CrearPeticion(HttpMethod metodo, string url, string role = "super_admin")
    {
        var request = new HttpRequestMessage(metodo, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "test-token");
        request.Headers.Add("X-Test-UserId", Guid.NewGuid().ToString());
        request.Headers.Add("X-Test-Role", role);
        request.Headers.Add("X-Test-Email", $"{role}@uod.edu.do");
        return request;
    }

    private async Task<(Guid recursoId, string sku, Guid activoId, string placa)> SembrarRecursoYActivoDePruebaAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var catId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        var cat = await db.Categorias.FindAsync(catId);
        if (cat == null)
        {
            cat = new Categoria
            {
                Id = catId,
                Codigo = "CAT-CODIGOS-TEST",
                Nombre = "Categoría de Prueba Códigos",
                Activa = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Categorias.Add(cat);
            await db.SaveChangesAsync();
        }

        var ubicacionId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        var ubi = await db.Ubicaciones.FindAsync(ubicacionId);
        if (ubi == null)
        {
            ubi = new Ubicacion
            {
                Id = ubicacionId,
                Codigo = "UBI-CODIGOS-01",
                Nombre = "Clínica Dental A - Sala 3",
                Tipo = "clinica",
                Activa = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Ubicaciones.Add(ubi);
            await db.SaveChangesAsync();
        }

        var recursoId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        var sku = "SKU-RESOLVER-001";
        var recurso = await db.Recursos.FindAsync(recursoId);
        if (recurso == null)
        {
            recurso = new Recurso
            {
                Id = recursoId,
                Sku = sku,
                Nombre = "Lámpara de Fotocurado Inalámbrica",
                CategoriaId = catId,
                Tipo = "activo_fijo",
                UnidadMedida = "unidad",
                StockMinimo = 1,
                CostoEstimado = 12000.00m,
                Activo = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Recursos.Add(recurso);
            await db.SaveChangesAsync();
        }

        var activoId = Guid.Parse("77777777-7777-7777-7777-777777777777");
        var placa = "EQ-UOD-TEST-99";
        var activo = await db.ActivosSerie.FindAsync(activoId);
        if (activo == null)
        {
            activo = new ActivoSerie
            {
                Id = activoId,
                RecursoId = recursoId,
                NumeroSerie = "SN-LAMP-2026-X99",
                PlacaInstitucional = placa,
                Estado = "disponible",
                UbicacionId = ubicacionId,
                Notas = "Equipo de prueba de escaneo",
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.ActivosSerie.Add(activo);
            await db.SaveChangesAsync();
        }

        return (recursoId, sku, activoId, placa);
    }

    [Fact]
    public async Task ResolverCodigo_SinAutenticacion_Retorna401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/codigos/resolver?codigo=SKU-TEST");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ResolverCodigo_PorSku_Retorna200Ok_Y_TipoEntidadRecurso()
    {
        var client = _factory.CreateClient();
        var (recursoId, sku, _, _) = await SembrarRecursoYActivoDePruebaAsync();

        var request = CrearPeticion(HttpMethod.Get, $"/api/v1/codigos/resolver?codigo={sku}", role: "consulta");
        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var resolucion = await response.Content.ReadFromJsonAsync<ResolucionCodigoDto>();
        Assert.NotNull(resolucion);
        Assert.True(resolucion.Encontrado);
        Assert.Equal("recurso", resolucion.TipoEntidad);
        Assert.Equal("sku", resolucion.TipoCodigoDetectado);
        Assert.NotNull(resolucion.Recurso);
        Assert.Equal(recursoId, resolucion.Recurso.Id);
    }

    [Fact]
    public async Task ResolverCodigo_PorPlacaInstitucional_Retorna200Ok_Y_TipoEntidadActivoSerie()
    {
        var client = _factory.CreateClient();
        var (_, _, activoId, placa) = await SembrarRecursoYActivoDePruebaAsync();

        var request = CrearPeticion(HttpMethod.Get, $"/api/v1/codigos/resolver?codigo={placa}", role: "consulta");
        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var resolucion = await response.Content.ReadFromJsonAsync<ResolucionCodigoDto>();
        Assert.NotNull(resolucion);
        Assert.True(resolucion.Encontrado);
        Assert.Equal("activo_serie", resolucion.TipoEntidad);
        Assert.Equal("placa_institucional", resolucion.TipoCodigoDetectado);
        Assert.NotNull(resolucion.ActivoSerie);
        Assert.Equal(activoId, resolucion.ActivoSerie.Id);
        Assert.Equal(placa, resolucion.ActivoSerie.PlacaInstitucional);
    }

    [Fact]
    public async Task ResolverCodigo_Inexistente_Retorna404NotFound()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/codigos/resolver?codigo=CODIGO-QUE-NO-EXISTE-XYZ", role: "consulta");
        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task AgregarCodigo_ConCodigoDuplicadoEnOtroRecurso_Retorna400BadRequest()
    {
        var client = _factory.CreateClient();
        var (recursoId, _, _, _) = await SembrarRecursoYActivoDePruebaAsync();
        var codigoBarras = $"BARRA-{Guid.NewGuid().ToString("N")[..8]}";

        // 1. Agregar código exitosamente
        var req1 = CrearPeticion(HttpMethod.Post, $"/api/v1/recursos/{recursoId}/codigos", role: "super_admin");
        req1.Content = JsonContent.Create(new AgregarCodigoRecursoDto
        {
            Codigo = codigoBarras,
            TipoCodigo = "codigo_barras"
        });
        var res1 = await client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);

        // 2. Intentar agregar el mismo código
        var req2 = CrearPeticion(HttpMethod.Post, $"/api/v1/recursos/{recursoId}/codigos", role: "super_admin");
        req2.Content = JsonContent.Create(new AgregarCodigoRecursoDto
        {
            Codigo = codigoBarras,
            TipoCodigo = "codigo_barras"
        });
        var res2 = await client.SendAsync(req2);

        Assert.Equal(HttpStatusCode.BadRequest, res2.StatusCode);
    }

    [Fact]
    public async Task DescargarImagenQr_Retorna200Ok_Y_ContentTypeImagePng()
    {
        var client = _factory.CreateClient();
        var (recursoId, _, _, _) = await SembrarRecursoYActivoDePruebaAsync();

        var request = CrearPeticion(HttpMethod.Get, $"/api/v1/recursos/{recursoId}/qr/imagen", role: "consulta");
        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("image/png", response.Content.Headers.ContentType?.MediaType);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        Assert.NotEmpty(bytes);
        // Validar encabezado PNG real (89 50 4E 47)
        Assert.Equal(0x89, bytes[0]);
        Assert.Equal(0x50, bytes[1]);
        Assert.Equal(0x4E, bytes[2]);
        Assert.Equal(0x47, bytes[3]);
    }
}
