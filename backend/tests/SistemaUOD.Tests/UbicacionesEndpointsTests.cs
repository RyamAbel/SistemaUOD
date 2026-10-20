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

public class UbicacionesEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public UbicacionesEndpointsTests(CustomWebApplicationFactory factory)
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
    public async Task ListarUbicaciones_SinAutenticacion_Retorna401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/ubicaciones");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ListarUbicaciones_ConRolConsulta_Retorna200Ok_Y_Paginacion()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/ubicaciones?pageIndex=1&pageSize=10", role: "consulta");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<UbicacionDto>>();
        Assert.NotNull(result);
        Assert.Equal(1, result.PageIndex);
        Assert.Equal(10, result.PageSize);
    }

    [Fact]
    public async Task ObtenerArbolUbicaciones_Autenticado_Retorna200Ok_ConNodosJerarquicos()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/ubicaciones/arbol", role: "auditor");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var arbol = await response.Content.ReadFromJsonAsync<List<UbicacionNodoArbolDto>>();
        Assert.NotNull(arbol);
    }

    [Fact]
    public async Task CrearUbicacion_ConRolConsulta_Retorna403Forbidden()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/ubicaciones", role: "consulta");
        request.Content = JsonContent.Create(new CrearUbicacionDto
        {
            Codigo = "UBIC-DENIED",
            Nombre = "Área Restringida",
            Tipo = "departamento"
        });

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CrearUbicacion_ConRolAuditor_Retorna403Forbidden()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/ubicaciones", role: "auditor");
        request.Content = JsonContent.Create(new CrearUbicacionDto
        {
            Codigo = "UBIC-AUDIT-DENIED",
            Nombre = "Área No Permitida para Auditor",
            Tipo = "aula"
        });

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CrearUbicacion_ConRolAdminInventario_Retorna201Created()
    {
        var client = _factory.CreateClient();
        var codigoUnico = $"UBIC-TEST-{Guid.NewGuid().ToString("N")[..6]}";

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/ubicaciones", role: "admin_inventario");
        request.Content = JsonContent.Create(new CrearUbicacionDto
        {
            Codigo = codigoUnico,
            Nombre = "Laboratorio de Biomateriales Dentales",
            Tipo = "laboratorio",
            Activa = true
        });

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var creada = await response.Content.ReadFromJsonAsync<UbicacionDto>();
        Assert.NotNull(creada);
        Assert.Equal(codigoUnico.ToUpperInvariant(), creada.Codigo);
        Assert.Equal("Laboratorio de Biomateriales Dentales", creada.Nombre);
        Assert.True(creada.Activa);
    }

    [Fact]
    public async Task CrearUbicacion_ConCodigoDuplicado_Retorna400BadRequest()
    {
        var client = _factory.CreateClient();
        var codigoUnico = $"UBIC-DUP-{Guid.NewGuid().ToString("N")[..6]}";

        // 1. Crear la primera
        var req1 = CrearPeticion(HttpMethod.Post, "/api/v1/ubicaciones", role: "super_admin");
        req1.Content = JsonContent.Create(new CrearUbicacionDto
        {
            Codigo = codigoUnico,
            Nombre = "Clínica Dental Aislada",
            Tipo = "clinica"
        });
        var res1 = await client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);

        // 2. Intentar duplicar
        var req2 = CrearPeticion(HttpMethod.Post, "/api/v1/ubicaciones", role: "super_admin");
        req2.Content = JsonContent.Create(new CrearUbicacionDto
        {
            Codigo = codigoUnico,
            Nombre = "Clínica Dental Aislada Duplicada",
            Tipo = "clinica"
        });
        var res2 = await client.SendAsync(req2);
        Assert.Equal(HttpStatusCode.BadRequest, res2.StatusCode);
    }

    [Fact]
    public async Task EliminarUbicacion_ConExistenciasOActivos_Retorna400BadRequest_ImpidiendoBorrado()
    {
        var client = _factory.CreateClient();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Crear una ubicación con un activo serie asignado
        var ubicacionId = Guid.NewGuid();
        var ubicacion = new Ubicacion
        {
            Id = ubicacionId,
            Codigo = $"UBIC-ACTIVOS-{Guid.NewGuid().ToString("N")[..6]}",
            Nombre = "Área con Equipos Activos",
            Tipo = "clinica",
            Activa = true,
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };
        db.Ubicaciones.Add(ubicacion);

        // Crear recurso base
        var recurso = new Recurso
        {
            Id = Guid.NewGuid(),
            Sku = $"SKU-TEST-ACT-{Guid.NewGuid().ToString("N")[..6]}",
            Nombre = "Equipo de Prueba para Ubicación",
            CategoriaId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Tipo = "activo_fijo",
            Activo = true,
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };
        db.Recursos.Add(recurso);

        // Asignar activo serie a la ubicación
        var activo = new ActivoSerie
        {
            Id = Guid.NewGuid(),
            RecursoId = recurso.Id,
            UbicacionId = ubicacionId,
            NumeroSerie = "SERIE-TEST-001",
            PlacaInstitucional = "EQ-UBIC-TEST",
            Estado = "operativo",
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };
        db.ActivosSerie.Add(activo);
        await db.SaveChangesAsync();

        // Intentar eliminar la ubicación (debe fallar y prohibir la eliminación)
        var reqDelete = CrearPeticion(HttpMethod.Delete, $"/api/v1/ubicaciones/{ubicacionId}", role: "super_admin");
        var resDelete = await client.SendAsync(reqDelete);

        Assert.Equal(HttpStatusCode.BadRequest, resDelete.StatusCode);

        // Verificar que la ubicación sigue existiendo intacta
        var reqGet = CrearPeticion(HttpMethod.Get, $"/api/v1/ubicaciones/{ubicacionId}", role: "consulta");
        var resGet = await client.SendAsync(reqGet);
        Assert.Equal(HttpStatusCode.OK, resGet.StatusCode);
    }
}
