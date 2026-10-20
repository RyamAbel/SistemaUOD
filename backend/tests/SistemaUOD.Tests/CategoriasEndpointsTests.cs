using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;
using SistemaUOD.Infrastructure.Data;
using Xunit;

namespace SistemaUOD.Tests;

public class CategoriasEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CategoriasEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static HttpRequestMessage CrearPeticion(HttpMethod metodo, string url, string role = "super_admin", Guid? userId = null)
    {
        var id = userId ?? Guid.NewGuid();
        var request = new HttpRequestMessage(metodo, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "test-token");
        request.Headers.Add("X-Test-UserId", id.ToString());
        request.Headers.Add("X-Test-Role", role);
        request.Headers.Add("X-Test-Email", $"{role}@uod.edu.do");
        return request;
    }

    [Fact]
    public async Task ListarCategorias_SinAutenticacion_Retorna401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/categorias");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ListarCategorias_Autenticado_Retorna200Ok()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/categorias", role: "consulta");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var categorias = await response.Content.ReadFromJsonAsync<List<CategoriaDto>>();
        Assert.NotNull(categorias);
    }

    [Fact]
    public async Task CrearCategoria_ConRolConsulta_Retorna403Forbidden()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/categorias", role: "consulta");
        request.Content = JsonContent.Create(new CrearCategoriaDto
        {
            Codigo = "CAT-TEST-DENIED",
            Nombre = "Categoría No Permitida"
        });

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CrearCategoria_ConRolSuperAdmin_Retorna201Created_Y_PersisteEnBaseDeDatos()
    {
        var client = _factory.CreateClient();
        var codigo = $"CAT-UNIT-{Guid.NewGuid().ToString("N")[..6]}";
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/categorias", role: "super_admin");
        request.Content = JsonContent.Create(new CrearCategoriaDto
        {
            Codigo = codigo,
            Nombre = "Instrumental Rotatorio Quirúrgico",
            Descripcion = "Piezas de mano, turbinas y contra-ángulos de alta velocidad"
        });

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var categoria = await response.Content.ReadFromJsonAsync<CategoriaDto>();
        Assert.NotNull(categoria);
        Assert.Equal(codigo.ToUpperInvariant(), categoria.Codigo);
        Assert.Equal("Instrumental Rotatorio Quirúrgico", categoria.Nombre);
        Assert.True(categoria.Activa);
    }

    [Fact]
    public async Task CrearCategoria_ConCodigoDuplicado_Retorna400BadRequest()
    {
        var client = _factory.CreateClient();
        var codigo = $"CAT-DUP-{Guid.NewGuid().ToString("N")[..6]}";

        // 1. Crear la primera
        var req1 = CrearPeticion(HttpMethod.Post, "/api/v1/categorias", role: "super_admin");
        req1.Content = JsonContent.Create(new CrearCategoriaDto
        {
            Codigo = codigo,
            Nombre = "Categoría Original"
        });
        var res1 = await client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);

        // 2. Intentar crear con el mismo código
        var req2 = CrearPeticion(HttpMethod.Post, "/api/v1/categorias", role: "super_admin");
        req2.Content = JsonContent.Create(new CrearCategoriaDto
        {
            Codigo = codigo,
            Nombre = "Categoría Repetida"
        });
        var res2 = await client.SendAsync(req2);

        Assert.Equal(HttpStatusCode.BadRequest, res2.StatusCode);
    }
}
