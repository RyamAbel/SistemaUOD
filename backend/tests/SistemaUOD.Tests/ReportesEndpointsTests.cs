using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using SistemaUOD.Application.DTOs;
using Xunit;

namespace SistemaUOD.Tests;

public class ReportesEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public ReportesEndpointsTests(CustomWebApplicationFactory factory)
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
    public async Task ObtenerResumenEjecutivo_SinAutenticacion_Retorna401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/reportes/resumen-ejecutivo");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ObtenerResumenEjecutivo_Autenticado_Retorna200Ok_ConMetricasConsolidadas()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/reportes/resumen-ejecutivo");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var data = await response.Content.ReadFromJsonAsync<ResumenEjecutivoDto>(JsonOptions);
        Assert.NotNull(data);
        Assert.True(data.TotalRecursosCatalogo >= 0);
        Assert.True(data.TotalActivosFisicos >= 0);
        Assert.True(data.ExactitudInventarioPorcentaje > 0);
    }

    [Fact]
    public async Task ObtenerRotacionConsumibles_Autenticado_RetornaListaConsumibles()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/reportes/rotacion-consumibles");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var data = await response.Content.ReadFromJsonAsync<List<RotacionConsumibleItemDto>>(JsonOptions);
        Assert.NotNull(data);
    }

    [Fact]
    public async Task ObtenerDistribucionParqueTi_Autenticado_RetornaCategoriasYPorcentajes()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/reportes/distribucion-parque-ti");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var data = await response.Content.ReadFromJsonAsync<List<DistribucionParqueTiDto>>(JsonOptions);
        Assert.NotNull(data);
    }

    [Fact]
    public async Task ObtenerReporteProveedores_Autenticado_RetornaMetricasCompras()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/reportes/proveedores");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var data = await response.Content.ReadFromJsonAsync<List<ReporteOrdenesProveedorDto>>(JsonOptions);
        Assert.NotNull(data);
    }

    [Fact]
    public async Task ExportarReportePatrimonialCsv_RetornaArchivoCsvConBomYCabeceras()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/reportes/exportar-patrimonial-csv");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("text/csv", response.Content.Headers.ContentType?.ToString() ?? "");

        var csv = await response.Content.ReadAsStringAsync();
        Assert.Contains("PlacaInstitucional,NumeroSerie,Equipo,Categoria", csv);
        Assert.Contains("CostoHistoricoDOP,DepreciacionAcumuladaDOP,ValorNetoEnLibrosDOP", csv);
    }
}
