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

public class ActivosEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ActivosEndpointsTests(CustomWebApplicationFactory factory)
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
    public async Task ListarActivos_SinAutenticacion_Retorna401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/activos");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ListarActivos_ConRolConsulta_Retorna200Ok_Y_Paginacion()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/activos?pageIndex=1&pageSize=10", role: "consulta");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<ActivoSerieDto>>();
        Assert.NotNull(result);
        Assert.Equal(1, result.PageIndex);
        Assert.Equal(10, result.PageSize);
    }

    [Fact]
    public async Task ObtenerActivoPorPlaca_Existente_Retorna200Ok()
    {
        var client = _factory.CreateClient();

        // Buscar un activo para obtener su placa
        var listRequest = CrearPeticion(HttpMethod.Get, "/api/v1/activos?pageSize=1", role: "consulta");
        var listResp = await client.SendAsync(listRequest);
        var listResult = await listResp.Content.ReadFromJsonAsync<PagedResult<ActivoSerieDto>>();

        if (listResult?.Items != null && listResult.Items.Count > 0)
        {
            var primerActivo = listResult.Items.First();
            if (!string.IsNullOrEmpty(primerActivo.PlacaInstitucional))
            {
                var request = CrearPeticion(HttpMethod.Get, $"/api/v1/activos/placa/{primerActivo.PlacaInstitucional}", role: "consulta");
                var response = await client.SendAsync(request);

                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
                var activo = await response.Content.ReadFromJsonAsync<ActivoSerieDetalleDto>();
                Assert.NotNull(activo);
                Assert.Equal(primerActivo.PlacaInstitucional, activo.PlacaInstitucional);
            }
        }
    }

    [Fact]
    public async Task ObtenerActivoPorPlaca_Inexistente_Retorna404NotFound()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/activos/placa/EQ-INEXISTENTE-9999", role: "consulta");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CrearActivo_RolConsulta_Retorna403Forbidden()
    {
        var client = _factory.CreateClient();
        var dto = new CrearActivoSerieDto
        {
            RecursoId = Guid.NewGuid(),
            UbicacionId = Guid.NewGuid(),
            NumeroSerie = "SR-TEST-FORBIDDEN",
            PlacaInstitucional = "EQ-FORBIDDEN-01"
        };

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/activos", role: "consulta");
        request.Content = JsonContent.Create(dto);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CrearActivo_RolGestionInventario_CreaExitosamente()
    {
        var client = _factory.CreateClient();

        // Obtener un recurso y una ubicación válidos
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var recurso = db.Recursos.FirstOrDefault();
        var ubicacion = db.Ubicaciones.FirstOrDefault();

        Assert.NotNull(recurso);
        Assert.NotNull(ubicacion);

        var sufijo = Guid.NewGuid().ToString("N")[..6];
        var dto = new CrearActivoSerieDto
        {
            RecursoId = recurso.Id,
            UbicacionId = ubicacion.Id,
            NumeroSerie = $"SN-TEST-{sufijo}",
            PlacaInstitucional = $"EQ-TST-{sufijo}",
            Estado = "disponible",
            Notas = "Activo creado en prueba automatizada"
        };

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/activos", role: "admin_inventario");
        request.Content = JsonContent.Create(dto);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var activoCreado = await response.Content.ReadFromJsonAsync<ActivoSerieDto>();
        Assert.NotNull(activoCreado);
        Assert.Equal(dto.PlacaInstitucional.ToUpper(), activoCreado.PlacaInstitucional);
        Assert.Equal(dto.NumeroSerie, activoCreado.NumeroSerie);
    }

    [Fact]
    public async Task CrearActivo_PlacaDuplicada_Retorna400BadRequest()
    {
        var client = _factory.CreateClient();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var recurso = db.Recursos.FirstOrDefault();
        var ubicacion = db.Ubicaciones.FirstOrDefault();

        Assert.NotNull(recurso);
        Assert.NotNull(ubicacion);

        var sufijo = Guid.NewGuid().ToString("N")[..6];
        var placaDuplicada = $"EQ-DUP-{sufijo}";

        var dto1 = new CrearActivoSerieDto
        {
            RecursoId = recurso.Id,
            UbicacionId = ubicacion.Id,
            NumeroSerie = $"SN-DUP-1-{sufijo}",
            PlacaInstitucional = placaDuplicada,
            Estado = "disponible"
        };

        var request1 = CrearPeticion(HttpMethod.Post, "/api/v1/activos", role: "admin_inventario");
        request1.Content = JsonContent.Create(dto1);
        var resp1 = await client.SendAsync(request1);
        Assert.Equal(HttpStatusCode.Created, resp1.StatusCode);

        // Intentar registrar segundo activo con la misma placa
        var dto2 = new CrearActivoSerieDto
        {
            RecursoId = recurso.Id,
            UbicacionId = ubicacion.Id,
            NumeroSerie = $"SN-DUP-2-{sufijo}",
            PlacaInstitucional = placaDuplicada,
            Estado = "disponible"
        };

        var request2 = CrearPeticion(HttpMethod.Post, "/api/v1/activos", role: "admin_inventario");
        request2.Content = JsonContent.Create(dto2);
        var resp2 = await client.SendAsync(request2);

        Assert.Equal(HttpStatusCode.BadRequest, resp2.StatusCode);
    }

    [Fact]
    public async Task CambiarEstado_RolGestionInventario_ActualizaEstado()
    {
        var client = _factory.CreateClient();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var recurso = db.Recursos.FirstOrDefault();
        var ubicacion = db.Ubicaciones.FirstOrDefault();

        Assert.NotNull(recurso);
        Assert.NotNull(ubicacion);

        var sufijo = Guid.NewGuid().ToString("N")[..6];
        var dtoCrear = new CrearActivoSerieDto
        {
            RecursoId = recurso.Id,
            UbicacionId = ubicacion.Id,
            NumeroSerie = $"SN-ST-{sufijo}",
            PlacaInstitucional = $"EQ-ST-{sufijo}",
            Estado = "disponible"
        };

        var reqCrear = CrearPeticion(HttpMethod.Post, "/api/v1/activos", role: "admin_inventario");
        reqCrear.Content = JsonContent.Create(dtoCrear);
        var respCrear = await client.SendAsync(reqCrear);
        var activo = await respCrear.Content.ReadFromJsonAsync<ActivoSerieDto>();
        Assert.NotNull(activo);

        // Cambiar estado a en_mantenimiento
        var dtoEstado = new CambiarEstadoActivoDto
        {
            Estado = "en_mantenimiento",
            Motivo = "Prueba de mantenimiento"
        };

        var reqEstado = CrearPeticion(HttpMethod.Patch, $"/api/v1/activos/{activo.Id}/estado", role: "admin_inventario");
        reqEstado.Content = JsonContent.Create(dtoEstado);
        var respEstado = await client.SendAsync(reqEstado);

        Assert.Equal(HttpStatusCode.OK, respEstado.StatusCode);
        var activoActualizado = await respEstado.Content.ReadFromJsonAsync<ActivoSerieDto>();
        Assert.NotNull(activoActualizado);
        Assert.Equal("en_mantenimiento", activoActualizado.Estado);
    }

    [Fact]
    public async Task DarDeBaja_RolGestionInventario_ActualizaEstadoABaja()
    {
        var client = _factory.CreateClient();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var recurso = db.Recursos.FirstOrDefault();
        var ubicacion = db.Ubicaciones.FirstOrDefault();

        Assert.NotNull(recurso);
        Assert.NotNull(ubicacion);

        var sufijo = Guid.NewGuid().ToString("N")[..6];
        var dtoCrear = new CrearActivoSerieDto
        {
            RecursoId = recurso.Id,
            UbicacionId = ubicacion.Id,
            NumeroSerie = $"SN-BAJA-{sufijo}",
            PlacaInstitucional = $"EQ-BAJA-{sufijo}",
            Estado = "disponible"
        };

        var reqCrear = CrearPeticion(HttpMethod.Post, "/api/v1/activos", role: "admin_inventario");
        reqCrear.Content = JsonContent.Create(dtoCrear);
        var respCrear = await client.SendAsync(reqCrear);
        var activo = await respCrear.Content.ReadFromJsonAsync<ActivoSerieDto>();
        Assert.NotNull(activo);

        // Dar de baja
        var reqBaja = CrearPeticion(HttpMethod.Delete, $"/api/v1/activos/{activo.Id}?motivo=Desuso+tecnológico", role: "admin_inventario");
        var respBaja = await client.SendAsync(reqBaja);

        Assert.Equal(HttpStatusCode.OK, respBaja.StatusCode);

        // Verificar que el estado ahora sea baja
        var reqGet = CrearPeticion(HttpMethod.Get, $"/api/v1/activos/{activo.Id}", role: "consulta");
        var respGet = await client.SendAsync(reqGet);
        var activoBaja = await respGet.Content.ReadFromJsonAsync<ActivoSerieDetalleDto>();
        Assert.NotNull(activoBaja);
        Assert.Equal("baja", activoBaja.Estado);
    }
}
