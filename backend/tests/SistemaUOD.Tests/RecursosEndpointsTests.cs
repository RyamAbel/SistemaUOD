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

public class RecursosEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public RecursosEndpointsTests(CustomWebApplicationFactory factory)
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

    private async Task<Guid> ObtenerOCrearCategoriaValidaAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var cat = await db.Categorias.FindAsync(Guid.Parse("11111111-1111-1111-1111-111111111111"));
        if (cat == null)
        {
            cat = new Categoria
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Codigo = "CAT-RECURSOS-TEST",
                Nombre = "Categoría de Prueba de Recursos",
                Activa = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Categorias.Add(cat);
            await db.SaveChangesAsync();
        }

        return cat.Id;
    }

    [Fact]
    public async Task ListarRecursos_SinAutenticacion_Retorna401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/recursos");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ListarRecursos_Autenticado_Retorna200Ok_Y_EstructuraPaginada()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/recursos?pageIndex=1&pageSize=10", role: "consulta");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<RecursoDto>>();
        Assert.NotNull(result);
        Assert.Equal(1, result.PageIndex);
        Assert.Equal(10, result.PageSize);
    }

    [Fact]
    public async Task CrearRecurso_ConRolConsulta_Retorna403Forbidden()
    {
        var client = _factory.CreateClient();
        var categoriaId = await ObtenerOCrearCategoriaValidaAsync();

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/recursos", role: "consulta");
        request.Content = JsonContent.Create(new CrearRecursoDto
        {
            Sku = "SKU-DENIED-001",
            Nombre = "Resina Compuesta Fotocurable",
            CategoriaId = categoriaId,
            Tipo = "consumible"
        });

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CrearRecurso_ConRolAdminInventario_Retorna201Created()
    {
        var client = _factory.CreateClient();
        var categoriaId = await ObtenerOCrearCategoriaValidaAsync();
        var skuUnico = $"SKU-TEST-{Guid.NewGuid().ToString("N")[..6]}";

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/recursos", role: "admin_inventario");
        request.Content = JsonContent.Create(new CrearRecursoDto
        {
            Sku = skuUnico,
            Nombre = "Cemento de Ionómero de Vidrio Tipo II",
            Descripcion = "Kit polvo y líquido para restauraciones clase V y base cavitaria",
            CategoriaId = categoriaId,
            Tipo = "consumible",
            UnidadMedida = "kit",
            StockMinimo = 5,
            StockMaximo = 25,
            PuntoReorden = 8,
            CostoEstimado = 1450.50m,
            CodigoQrInicial = $"QR-{skuUnico}",
            Activo = true
        });

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var creado = await response.Content.ReadFromJsonAsync<RecursoDto>();
        Assert.NotNull(creado);
        Assert.Equal(skuUnico.ToUpperInvariant(), creado.Sku);
        Assert.Equal("Cemento de Ionómero de Vidrio Tipo II", creado.Nombre);
        Assert.Equal(1450.50m, creado.CostoEstimado);
        Assert.True(creado.Activo);
    }

    [Fact]
    public async Task CrearRecurso_ConSkuDuplicado_Retorna400BadRequest()
    {
        var client = _factory.CreateClient();
        var categoriaId = await ObtenerOCrearCategoriaValidaAsync();
        var skuUnico = $"SKU-DUP-{Guid.NewGuid().ToString("N")[..6]}";

        // 1. Crear el primer recurso
        var req1 = CrearPeticion(HttpMethod.Post, "/api/v1/recursos", role: "super_admin");
        req1.Content = JsonContent.Create(new CrearRecursoDto
        {
            Sku = skuUnico,
            Nombre = "Fresas de Carburo Redondas #2",
            CategoriaId = categoriaId,
            Tipo = "consumible"
        });
        var res1 = await client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);

        // 2. Intentar crear duplicado
        var req2 = CrearPeticion(HttpMethod.Post, "/api/v1/recursos", role: "super_admin");
        req2.Content = JsonContent.Create(new CrearRecursoDto
        {
            Sku = skuUnico,
            Nombre = "Fresas Duplicadas",
            CategoriaId = categoriaId,
            Tipo = "consumible"
        });
        var res2 = await client.SendAsync(req2);

        Assert.Equal(HttpStatusCode.BadRequest, res2.StatusCode);
    }

    [Fact]
    public async Task DuplicarRecurso_ConNuevoSku_Retorna201Created_ConPropiedadesCopiadas()
    {
        var client = _factory.CreateClient();
        var categoriaId = await ObtenerOCrearCategoriaValidaAsync();
        var skuBase = $"SKU-BASE-{Guid.NewGuid().ToString("N")[..6]}";

        // 1. Crear recurso base
        var reqBase = CrearPeticion(HttpMethod.Post, "/api/v1/recursos", role: "super_admin");
        reqBase.Content = JsonContent.Create(new CrearRecursoDto
        {
            Sku = skuBase,
            Nombre = "Compresor Odontológico Silencioso 2HP",
            CategoriaId = categoriaId,
            Tipo = "activo_fijo",
            CostoEstimado = 45000.00m
        });
        var resBase = await client.SendAsync(reqBase);
        Assert.Equal(HttpStatusCode.Created, resBase.StatusCode);
        var baseDto = await resBase.Content.ReadFromJsonAsync<RecursoDto>();
        Assert.NotNull(baseDto);

        // 2. Duplicar con nuevo SKU y Nombre
        var skuClon = $"SKU-CLON-{Guid.NewGuid().ToString("N")[..6]}";
        var reqDuplicar = CrearPeticion(HttpMethod.Post, $"/api/v1/recursos/{baseDto.Id}/duplicar", role: "super_admin");
        reqDuplicar.Content = JsonContent.Create(new DuplicarRecursoDto
        {
            NuevoSku = skuClon,
            NuevoNombre = "Compresor Odontológico Silencioso 2HP (Unidad Quirófano)",
            CopiarFotos = false
        });
        var resClon = await client.SendAsync(reqDuplicar);

        Assert.Equal(HttpStatusCode.Created, resClon.StatusCode);
        var clonDto = await resClon.Content.ReadFromJsonAsync<RecursoDto>();
        Assert.NotNull(clonDto);
        Assert.NotEqual(baseDto.Id, clonDto.Id);
        Assert.Equal(skuClon.ToUpperInvariant(), clonDto.Sku);
        Assert.Equal("Compresor Odontológico Silencioso 2HP (Unidad Quirófano)", clonDto.Nombre);
        Assert.Equal(baseDto.CostoEstimado, clonDto.CostoEstimado);
    }

    [Fact]
    public async Task DesactivarRecurso_DeleteEndpoint_Retorna200Ok_Y_DesactivaLogicamente()
    {
        var client = _factory.CreateClient();
        var categoriaId = await ObtenerOCrearCategoriaValidaAsync();
        var skuBorrado = $"SKU-DESAC-{Guid.NewGuid().ToString("N")[..6]}";

        // 1. Crear recurso
        var reqCreate = CrearPeticion(HttpMethod.Post, "/api/v1/recursos", role: "super_admin");
        reqCreate.Content = JsonContent.Create(new CrearRecursoDto
        {
            Sku = skuBorrado,
            Nombre = "Material para Desactivar",
            CategoriaId = categoriaId,
            Tipo = "consumible"
        });
        var resCreate = await client.SendAsync(reqCreate);
        Assert.Equal(HttpStatusCode.Created, resCreate.StatusCode);
        var creado = await resCreate.Content.ReadFromJsonAsync<RecursoDto>();
        Assert.NotNull(creado);

        // 2. Desactivar (DELETE)
        var reqDelete = CrearPeticion(HttpMethod.Delete, $"/api/v1/recursos/{creado.Id}", role: "super_admin");
        var resDelete = await client.SendAsync(reqDelete);
        Assert.Equal(HttpStatusCode.OK, resDelete.StatusCode);

        // 3. Verificar que sigue existiendo en detalle pero Activo == false
        var reqGet = CrearPeticion(HttpMethod.Get, $"/api/v1/recursos/{creado.Id}", role: "consulta");
        var resGet = await client.SendAsync(reqGet);
        Assert.Equal(HttpStatusCode.OK, resGet.StatusCode);
        var detalle = await resGet.Content.ReadFromJsonAsync<RecursoDetalleDto>();
        Assert.NotNull(detalle);
        Assert.False(detalle.Activo);
    }
}
