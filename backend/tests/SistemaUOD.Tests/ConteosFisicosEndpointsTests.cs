using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;
using SistemaUOD.Domain.Enums;
using Xunit;

namespace SistemaUOD.Tests;

public class ConteosFisicosEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public ConteosFisicosEndpointsTests(CustomWebApplicationFactory factory)
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

    private async Task<(Guid UbicacionId, Guid RecursoId)> ObtenerUbicacionYRecursoConStockAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var ubicacion = new Ubicacion
        {
            Id = Guid.NewGuid(),
            Codigo = $"AUDIT-{Guid.NewGuid().ToString()[..4]}",
            Nombre = "Depósito de Prueba Auditoría",
            Activa = true
        };
        db.Ubicaciones.Add(ubicacion);

        var categoria = await db.Categorias.FirstAsync();
        var recurso = new Recurso
        {
            Id = Guid.NewGuid(),
            Sku = $"SKU-AUDIT-{Guid.NewGuid().ToString()[..4]}",
            Nombre = "Anestésico Dental Lidocaína",
            CategoriaId = categoria.Id,
            CostoEstimado = 450.00m,
            StockMinimo = 10,
            Activo = true
        };
        db.Recursos.Add(recurso);

        // Asignar stock inicial
        var existencia = new Existencia
        {
            Id = Guid.NewGuid(),
            RecursoId = recurso.Id,
            UbicacionId = ubicacion.Id,
            Cantidad = 25,
            ActualizadoEn = DateTime.UtcNow
        };
        db.Existencias.Add(existencia);

        await db.SaveChangesAsync();
        return (ubicacion.Id, recurso.Id);
    }

    [Fact]
    public async Task ListarConteos_Autenticado_RetornaOkConPaginacion()
    {
        var client = _factory.CreateClient();
        var req = CrearPeticion(HttpMethod.Get, "/api/v1/conteos-fisicos?page=1&pageSize=10", role: RolesUsuario.Consulta);

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var resultado = await response.Content.ReadFromJsonAsync<PagedResult<ConteoFisicoDto>>(JsonOptions);
        Assert.NotNull(resultado);
        Assert.NotNull(resultado.Items);
    }

    [Fact]
    public async Task IniciarConteoFisico_UbicacionValida_CreaConteoYPrecargaStock()
    {
        var (ubicacionId, recursoId) = await ObtenerUbicacionYRecursoConStockAsync();
        var client = _factory.CreateClient();

        var dto = new IniciarConteoFisicoDto
        {
            UbicacionId = ubicacionId,
            Observaciones = "Conteo semestral programado",
            PrecargarExistenciasSistema = true
        };

        var req = CrearPeticion(HttpMethod.Post, "/api/v1/conteos-fisicos", role: RolesUsuario.EncargadoAlmacen);
        req.Content = JsonContent.Create(dto);

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var creado = await response.Content.ReadFromJsonAsync<ConteoFisicoDto>(JsonOptions);
        Assert.NotNull(creado);
        Assert.Equal("abierto", creado.Estado);
        Assert.True(creado.TotalLineas >= 1);
        Assert.Equal(25, creado.TotalUnidadesSistema);
    }

    [Fact]
    public async Task IniciarConteoFisico_ConteoYaAbierto_RetornaBadRequest()
    {
        var (ubicacionId, _) = await ObtenerUbicacionYRecursoConStockAsync();
        var client = _factory.CreateClient();

        var dto = new IniciarConteoFisicoDto
        {
            UbicacionId = ubicacionId,
            PrecargarExistenciasSistema = false
        };

        // Primer conteo exitoso
        var req1 = CrearPeticion(HttpMethod.Post, "/api/v1/conteos-fisicos", role: RolesUsuario.EncargadoAlmacen);
        req1.Content = JsonContent.Create(dto);
        var res1 = await client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);

        // Segundo intento en la misma ubicación
        var req2 = CrearPeticion(HttpMethod.Post, "/api/v1/conteos-fisicos", role: RolesUsuario.EncargadoAlmacen);
        req2.Content = JsonContent.Create(dto);
        var res2 = await client.SendAsync(req2);
        Assert.Equal(HttpStatusCode.BadRequest, res2.StatusCode);
    }

    [Fact]
    public async Task SincronizarLineas_ActualizaCantidadesFisicasYDiferencias()
    {
        var (ubicacionId, recursoId) = await ObtenerUbicacionYRecursoConStockAsync();
        var client = _factory.CreateClient();

        // 1. Iniciar conteo con 25 en sistema
        var reqIniciar = CrearPeticion(HttpMethod.Post, "/api/v1/conteos-fisicos", role: RolesUsuario.EncargadoAlmacen);
        reqIniciar.Content = JsonContent.Create(new IniciarConteoFisicoDto
        {
            UbicacionId = ubicacionId,
            PrecargarExistenciasSistema = true
        });
        var resIniciar = await client.SendAsync(reqIniciar);
        var conteo = await resIniciar.Content.ReadFromJsonAsync<ConteoFisicoDto>(JsonOptions);
        Assert.NotNull(conteo);

        // 2. Sincronizar conteo físico de 22 (faltante de 3)
        var syncDto = new SincronizarConteosDto
        {
            Lineas = new List<ActualizarLineaConteoDto>
            {
                new()
                {
                    RecursoId = recursoId,
                    CantidadFisica = 22,
                    Notas = "Conteo verificado en anaquel A"
                }
            }
        };

        var reqSync = CrearPeticion(HttpMethod.Put, $"/api/v1/conteos-fisicos/{conteo.Id}/lineas", role: RolesUsuario.EncargadoAlmacen);
        reqSync.Content = JsonContent.Create(syncDto);
        var resSync = await client.SendAsync(reqSync);

        Assert.Equal(HttpStatusCode.OK, resSync.StatusCode);
        var actualizado = await resSync.Content.ReadFromJsonAsync<ConteoFisicoDto>(JsonOptions);
        Assert.NotNull(actualizado);
        Assert.Equal(22, actualizado.TotalUnidadesFisicas);
        Assert.Equal(-3, actualizado.Lineas[0].Diferencia);
    }

    [Fact]
    public async Task EscanearItem_CodigoValido_IncrementaCantidadFisica()
    {
        var (ubicacionId, recursoId) = await ObtenerUbicacionYRecursoConStockAsync();
        var client = _factory.CreateClient();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var rec = await db.Recursos.FindAsync(recursoId);

            var reqIniciar = CrearPeticion(HttpMethod.Post, "/api/v1/conteos-fisicos", role: RolesUsuario.EncargadoAlmacen);
            reqIniciar.Content = JsonContent.Create(new IniciarConteoFisicoDto
            {
                UbicacionId = ubicacionId,
                PrecargarExistenciasSistema = true
            });
            var resIniciar = await client.SendAsync(reqIniciar);
            var conteo = await resIniciar.Content.ReadFromJsonAsync<ConteoFisicoDto>(JsonOptions);
            Assert.NotNull(conteo);

            // Escanear 5 unidades del SKU
            var scanDto = new EscanearItemConteoDto
            {
                Codigo = rec!.Sku,
                CantidadSumar = 5
            };

            var reqScan = CrearPeticion(HttpMethod.Post, $"/api/v1/conteos-fisicos/{conteo.Id}/escanear", role: RolesUsuario.EncargadoAlmacen);
            reqScan.Content = JsonContent.Create(scanDto);
            var resScan = await client.SendAsync(reqScan);

            Assert.Equal(HttpStatusCode.OK, resScan.StatusCode);
            var escaneado = await resScan.Content.ReadFromJsonAsync<ConteoFisicoDto>(JsonOptions);
            Assert.NotNull(escaneado);
            Assert.Equal(5, escaneado.TotalUnidadesFisicas);
        }
    }

    [Fact]
    public async Task ConciliarConteo_ConDiscrepancias_GeneraAjustesYActualizaEstado()
    {
        var (ubicacionId, recursoId) = await ObtenerUbicacionYRecursoConStockAsync();
        var client = _factory.CreateClient();

        // 1. Iniciar conteo (25 en sistema)
        var reqIniciar = CrearPeticion(HttpMethod.Post, "/api/v1/conteos-fisicos", role: RolesUsuario.AdminInventario);
        reqIniciar.Content = JsonContent.Create(new IniciarConteoFisicoDto
        {
            UbicacionId = ubicacionId,
            PrecargarExistenciasSistema = true
        });
        var resIniciar = await client.SendAsync(reqIniciar);
        var conteo = await resIniciar.Content.ReadFromJsonAsync<ConteoFisicoDto>(JsonOptions);
        Assert.NotNull(conteo);

        // 2. Establecer conteo físico en 28 (sobrante de 3)
        var syncDto = new SincronizarConteosDto
        {
            Lineas = new List<ActualizarLineaConteoDto>
            {
                new() { RecursoId = recursoId, CantidadFisica = 28 }
            }
        };
        var reqSync = CrearPeticion(HttpMethod.Put, $"/api/v1/conteos-fisicos/{conteo.Id}/lineas", role: RolesUsuario.AdminInventario);
        reqSync.Content = JsonContent.Create(syncDto);
        await client.SendAsync(reqSync);

        // 3. Conciliar conteo (genera movimiento de ajuste automático)
        var conciliarDto = new ConciliarConteoDto
        {
            Observaciones = "Conciliación aprobada tras reconteo doble"
        };
        var reqConciliar = CrearPeticion(HttpMethod.Post, $"/api/v1/conteos-fisicos/{conteo.Id}/conciliar", role: RolesUsuario.AdminInventario);
        reqConciliar.Content = JsonContent.Create(conciliarDto);
        var resConciliar = await client.SendAsync(reqConciliar);

        Assert.Equal(HttpStatusCode.OK, resConciliar.StatusCode);
        var conciliado = await resConciliar.Content.ReadFromJsonAsync<ConteoFisicoDto>(JsonOptions);
        Assert.NotNull(conciliado);
        Assert.Equal("conciliado", conciliado.Estado);
        Assert.NotNull(conciliado.FechaCierre);
        Assert.NotNull(conciliado.Lineas[0].AjusteMovimientoId);
    }
}
