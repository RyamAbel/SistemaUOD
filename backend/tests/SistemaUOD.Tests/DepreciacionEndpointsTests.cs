using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using Xunit;

namespace SistemaUOD.Tests;

public class DepreciacionEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public DepreciacionEndpointsTests(CustomWebApplicationFactory factory)
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

    [Fact]
    public async Task ObtenerResumenDepreciacion_SinAutenticacion_Retorna401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/depreciacion/resumen");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ObtenerResumenDepreciacion_Autenticado_Retorna200Ok_ConTotalesYDesglose()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/depreciacion/resumen", role: "auditor");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var resumen = await response.Content.ReadFromJsonAsync<ResumenDepreciacionContableDto>();
        Assert.NotNull(resumen);
        Assert.True(resumen.TotalActivosComputados >= 0);
        Assert.True(resumen.ValorTotalHistoricoDop >= 0);
        Assert.NotNull(resumen.DesgloseCategorias);
    }

    [Fact]
    public async Task ListarReporteDepreciacion_ConRolConsulta_Retorna200Ok_Y_CalculosValidos()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/depreciacion/reporte?pageIndex=1&pageSize=10", role: "consulta");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var paged = await response.Content.ReadFromJsonAsync<PagedResult<CalculoDepreciacionActivoDto>>();
        Assert.NotNull(paged);
        Assert.Equal(1, paged.PageIndex);
        Assert.Equal(10, paged.PageSize);

        if (paged.Items.Count > 0)
        {
            var primerItem = paged.Items.First();
            Assert.False(string.IsNullOrWhiteSpace(primerItem.PlacaInstitucional));
            Assert.Equal(25.00m, primerItem.TasaAnualPorcentaje);
            Assert.Equal(48, primerItem.VidaUtilMesesTotal);
            Assert.True(primerItem.ValorEnLibros >= primerItem.ValorResidual);
        }
    }

    [Fact]
    public async Task ObtenerDepreciacionActivo_Existente_Retorna200Ok_ConParametrosDgii()
    {
        var client = _factory.CreateClient();

        // Obtener un activo de la lista
        var listReq = CrearPeticion(HttpMethod.Get, "/api/v1/activos?pageSize=1", role: "consulta");
        var listResp = await client.SendAsync(listReq);
        var listResult = await listResp.Content.ReadFromJsonAsync<PagedResult<ActivoSerieDto>>();

        if (listResult?.Items != null && listResult.Items.Count > 0)
        {
            var activo = listResult.Items.First();
            var req = CrearPeticion(HttpMethod.Get, $"/api/v1/depreciacion/activo/{activo.Id}", role: "consulta");
            var resp = await client.SendAsync(req);

            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var calculo = await resp.Content.ReadFromJsonAsync<CalculoDepreciacionActivoDto>();
            Assert.NotNull(calculo);
            Assert.Equal(activo.Id, calculo.ActivoId);
            Assert.Equal(activo.PlacaInstitucional, calculo.PlacaInstitucional);
            Assert.Equal(25.00m, calculo.TasaAnualPorcentaje);
            Assert.Contains("Categoría 2", calculo.CategoriaDgii);
        }
    }

    [Fact]
    public async Task ObtenerTablaAmortizacion_Existente_Retorna48PeriodosProyectados()
    {
        var client = _factory.CreateClient();

        var listReq = CrearPeticion(HttpMethod.Get, "/api/v1/activos?pageSize=1", role: "consulta");
        var listResp = await client.SendAsync(listReq);
        var listResult = await listResp.Content.ReadFromJsonAsync<PagedResult<ActivoSerieDto>>();

        if (listResult?.Items != null && listResult.Items.Count > 0)
        {
            var activo = listResult.Items.First();
            var req = CrearPeticion(HttpMethod.Get, $"/api/v1/depreciacion/activo/{activo.Id}/tabla", role: "consulta");
            var resp = await client.SendAsync(req);

            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var tabla = await resp.Content.ReadFromJsonAsync<TablaAmortizacionActivoDto>();
            Assert.NotNull(tabla);
            Assert.Equal(48, tabla.TotalPeriodosMeses);
            Assert.Equal(48, tabla.Periodos.Count);

            // El último periodo debe culminar en el valor residual
            var ultimoPeriodo = tabla.Periodos.Last();
            Assert.Equal(48, ultimoPeriodo.PeriodoNumero);
            Assert.True(ultimoPeriodo.ValorEnLibrosFinPeriodo >= tabla.ValorResidual);
        }
    }

    [Fact]
    public async Task ExportarDepreciacionCsv_Autenticado_RetornaArchivoCsvConBomUtf8()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/depreciacion/exportar", role: "auditor");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/csv; charset=utf-8", response.Content.Headers.ContentType?.ToString());
        Assert.NotNull(response.Content.Headers.ContentDisposition?.FileName);

        var bytes = await response.Content.ReadAsByteArrayAsync();
        Assert.NotEmpty(bytes);

        // Verificar el BOM UTF-8 (EF BB BF) para compatibilidad con Excel en español
        Assert.True(bytes.Length >= 3);
        Assert.Equal(0xEF, bytes[0]);
        Assert.Equal(0xBB, bytes[1]);
        Assert.Equal(0xBF, bytes[2]);
    }
}
