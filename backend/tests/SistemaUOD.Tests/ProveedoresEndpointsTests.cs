using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using Xunit;

namespace SistemaUOD.Tests;

public class ProveedoresEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ProveedoresEndpointsTests(CustomWebApplicationFactory factory)
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
    public async Task ListarProveedores_SinAutenticacion_Retorna401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/proveedores");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ListarProveedores_Autenticado_Retorna200Ok_Y_EstructuraPaginada()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/proveedores?pageIndex=1&pageSize=10", role: "consulta");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<ProveedorDto>>();
        Assert.NotNull(result);
        Assert.Equal(1, result.PageIndex);
        Assert.Equal(10, result.PageSize);
    }

    [Fact]
    public async Task CrearProveedor_ConRolNoAutorizado_Retorna403Forbidden()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/proveedores", role: "encargado_almacen");
        request.Content = JsonContent.Create(new CrearProveedorDto
        {
            Rnc = "101000001",
            NombreComercial = "Distribuidora Dental Dominicana"
        });

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CrearProveedor_ConRncInvalido_Retorna400BadRequest()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/proveedores", role: "admin_inventario");
        request.Content = JsonContent.Create(new CrearProveedorDto
        {
            Rnc = "RNC-CON-LETRAS", // Inválido: debe ser numérico de 9 a 11 dígitos
            NombreComercial = "Proveedor Invalido SRL"
        });

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CrearProveedor_ConRncValidoDominicano_Retorna201Created()
    {
        var client = _factory.CreateClient();
        // Generar RNC numérico de 9 dígitos único
        var rncRandom = $"13{Random.Shared.Next(1000000, 9999999)}";

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/proveedores", role: "admin_inventario");
        request.Content = JsonContent.Create(new CrearProveedorDto
        {
            Rnc = rncRandom,
            NombreComercial = "Dental Quisqueyana SAS",
            RazonSocial = "Dental Quisqueyana SAS",
            ContactoNombre = "Lic. Rafael Almonte",
            Telefono = "8095551234",
            Correo = "contacto@dentalquisqueyana.com.do",
            Direccion = "Av. 27 de Febrero esq. Winston Churchill, Santo Domingo",
            PlazoCreditoDias = 45,
            Activo = true
        });

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var proveedor = await response.Content.ReadFromJsonAsync<ProveedorDto>();
        Assert.NotNull(proveedor);
        Assert.Equal(rncRandom, proveedor.Rnc);
        Assert.Equal("Dental Quisqueyana SAS", proveedor.NombreComercial);
        Assert.Equal(45, proveedor.PlazoCreditoDias);
        Assert.True(proveedor.Activo);
    }

    [Fact]
    public async Task CrearProveedor_ConRncDuplicado_Retorna400BadRequest()
    {
        var client = _factory.CreateClient();
        var rncRandom = $"10{Random.Shared.Next(1000000, 9999999)}";

        // 1. Crear el primer proveedor
        var req1 = CrearPeticion(HttpMethod.Post, "/api/v1/proveedores", role: "super_admin");
        req1.Content = JsonContent.Create(new CrearProveedorDto
        {
            Rnc = rncRandom,
            NombreComercial = "Proveedor Original SRL"
        });
        var res1 = await client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);

        // 2. Intentar crear duplicado
        var req2 = CrearPeticion(HttpMethod.Post, "/api/v1/proveedores", role: "super_admin");
        req2.Content = JsonContent.Create(new CrearProveedorDto
        {
            Rnc = rncRandom,
            NombreComercial = "Proveedor Duplicado SRL"
        });
        var res2 = await client.SendAsync(req2);

        Assert.Equal(HttpStatusCode.BadRequest, res2.StatusCode);
    }
}
