using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;
using SistemaUOD.Infrastructure.Data;
using Xunit;

namespace SistemaUOD.Tests;

public class ExistenciasEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ExistenciasEndpointsTests(CustomWebApplicationFactory factory)
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

    private async Task<(Guid categoriaId, Guid ubicacionId, Guid recursoId)> InicializarDatosPruebaAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var catId = Guid.Parse("aa111111-1111-1111-1111-111111111111");
        var cat = await db.Categorias.FindAsync(catId);
        if (cat == null)
        {
            cat = new Categoria
            {
                Id = catId,
                Codigo = "CAT-EXISTENCIAS",
                Nombre = "Categoría Existencias Test",
                Activa = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Categorias.Add(cat);
        }

        var ubiId = Guid.Parse("bb222222-2222-2222-2222-222222222222");
        var ubi = await db.Ubicaciones.FindAsync(ubiId);
        if (ubi == null)
        {
            ubi = new Ubicacion
            {
                Id = ubiId,
                Codigo = "UBI-EX-ALMACEN",
                Nombre = "Almacén Clínico Test",
                Tipo = "almacen",
                Activa = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Ubicaciones.Add(ubi);
        }

        var recId = Guid.Parse("cc333333-3333-3333-3333-333333333333");
        var rec = await db.Recursos.FindAsync(recId);
        if (rec == null)
        {
            rec = new Recurso
            {
                Id = recId,
                CategoriaId = catId,
                Sku = "SKU-EX-001",
                Nombre = "Anestesia Dental Test",
                Tipo = "consumible",
                UnidadMedida = "caja",
                StockMinimo = 10,
                StockMaximo = 50,
                PuntoReorden = 15,
                Activo = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Recursos.Add(rec);

            // Crear lote con vencimiento próximo
            var lote = new Lote
            {
                Id = Guid.Parse("dd444444-4444-4444-4444-444444444444"),
                RecursoId = recId,
                NumeroLote = "LOTE-EXP-2026",
                FechaVencimiento = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(15)),
                CreadoEn = DateTime.UtcNow
            };
            db.Lotes.Add(lote);

            // Existencia en almacén con 8 unidades (menor al stock mínimo de 10 -> bajo_minimo)
            var existencia = new Existencia
            {
                Id = Guid.Parse("ee555555-5555-5555-5555-555555555555"),
                RecursoId = recId,
                UbicacionId = ubiId,
                LoteId = lote.Id,
                Cantidad = 8,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Existencias.Add(existencia);
        }

        await db.SaveChangesAsync();
        return (catId, ubiId, recId);
    }

    [Fact]
    public async Task ObtenerResumenExistencias_SinAutenticacion_Retorna401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/existencias");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ObtenerResumenExistencias_Autenticado_Retorna200Ok_Y_Paginado()
    {
        await InicializarDatosPruebaAsync();
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/existencias?pageIndex=1&pageSize=10", role: "consulta");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<ResumenStockRecursoDto>>();
        Assert.NotNull(result);
        Assert.True(result.TotalCount > 0);
        Assert.Contains(result.Items, r => r.Sku == "SKU-EX-001");
    }

    [Fact]
    public async Task ObtenerStockPorRecurso_Inexistente_Retorna404NotFound()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, $"/api/v1/existencias/recurso/{Guid.NewGuid()}");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ObtenerStockPorRecurso_Existente_RetornaEstadoBajoMinimo_SegunRF12()
    {
        var (_, _, recursoId) = await InicializarDatosPruebaAsync();
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, $"/api/v1/existencias/recurso/{recursoId}", role: "operador");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<ResumenStockRecursoDto>();
        Assert.NotNull(item);
        Assert.Equal(recursoId, item.RecursoId);
        Assert.Equal(8, item.StockTotal);
        Assert.Equal(8, item.StockDisponible);
        Assert.Equal(10, item.StockMinimo);
        Assert.Equal("bajo_minimo", item.EstadoStock);
        Assert.True(item.RequiereReorden);
        Assert.Equal(42, item.CantidadSugeridaReorden); // Max 50 - 8 = 42
        Assert.NotEmpty(item.Ubicaciones);
        Assert.NotEmpty(item.Lotes);
    }

    [Fact]
    public async Task ObtenerAlertasStockBajo_RetornaRecursosBajoMinimo()
    {
        await InicializarDatosPruebaAsync();
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/existencias/alertas/stock-bajo", role: "auditor");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var alertas = await response.Content.ReadFromJsonAsync<List<ResumenStockRecursoDto>>();
        Assert.NotNull(alertas);
        Assert.Contains(alertas, a => a.Sku == "SKU-EX-001" && (a.EstadoStock == "bajo_minimo" || a.EstadoStock == "agotado"));
    }

    [Fact]
    public async Task ObtenerAlertasVencimiento_RetornaLotesProximosACaducar()
    {
        await InicializarDatosPruebaAsync();
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/existencias/alertas/vencimientos?diasAnticipacion=30", role: "consulta");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var lotes = await response.Content.ReadFromJsonAsync<List<ExistenciaPorLoteDto>>();
        Assert.NotNull(lotes);
        Assert.Contains(lotes, l => l.NumeroLote == "LOTE-EXP-2026");
    }

    [Fact]
    public async Task ObtenerExistenciasDetalladas_ConFiltroRecurso_RetornaDetalle()
    {
        var (_, _, recursoId) = await InicializarDatosPruebaAsync();
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, $"/api/v1/existencias/detalladas?recursoId={recursoId}", role: "consulta");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = await response.Content.ReadFromJsonAsync<List<ExistenciaDto>>();
        Assert.NotNull(items);
        Assert.All(items, ex => Assert.Equal(recursoId, ex.RecursoId));
    }
}
