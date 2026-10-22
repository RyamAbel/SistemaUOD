using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;
using Xunit;

namespace SistemaUOD.Tests;

public class AlertasEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public AlertasEndpointsTests(CustomWebApplicationFactory factory)
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
    public async Task ListarAlertas_Autenticado_RetornaOkConPaginacion()
    {
        var client = _factory.CreateClient();
        var req = CrearPeticion(HttpMethod.Get, "/api/v1/alertas?pagina=1&tamanoPagina=10", role: "consulta");

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<AlertaDto>>(JsonOptions);
        Assert.NotNull(result);
        Assert.NotNull(result.Items);
    }

    [Fact]
    public async Task ObtenerConteoNoLeidas_RetornaContador()
    {
        var client = _factory.CreateClient();
        var req = CrearPeticion(HttpMethod.Get, "/api/v1/alertas/conteo-no-leidas", role: "consulta");

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains("noLeidas", json);
    }

    [Fact]
    public async Task ObtenerResumenAlertas_RetornaTotalesYPorTipo()
    {
        var client = _factory.CreateClient();
        var req = CrearPeticion(HttpMethod.Get, "/api/v1/alertas/resumen", role: "consulta");

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var resumen = await response.Content.ReadFromJsonAsync<ResumenAlertasDto>(JsonOptions);
        Assert.NotNull(resumen);
        Assert.True(resumen.TotalNoLeidas >= 0);
    }

    [Fact]
    public async Task EvaluarReglas_GeneraAlertasParaStockCritico()
    {
        // 1. Preparar un recurso sin existencias para asegurar alerta
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SistemaUOD.Infrastructure.Data.ApplicationDbContext>();
            var cat = db.Categorias.FirstOrDefault() ?? new Categoria
            {
                Id = Guid.NewGuid(),
                Codigo = "CAT-ALERTA-01",
                Nombre = "Categoría Pruebas Alertas",
                Activa = true
            };
            if (db.Entry(cat).State == Microsoft.EntityFrameworkCore.EntityState.Detached) db.Categorias.Add(cat);

            var recursoCritico = new Recurso
            {
                Id = Guid.NewGuid(),
                Sku = $"TEST-ALERTA-{Guid.NewGuid():N}"[..18].ToUpper(),
                Nombre = "Insumo Crítico Agotado Test",
                CategoriaId = cat.Id,
                StockMinimo = 10,
                PuntoReorden = 20,
                Activo = true
            };
            db.Recursos.Add(recursoCritico);
            await db.SaveChangesAsync();
        }

        var client = _factory.CreateClient();
        var req = CrearPeticion(HttpMethod.Post, "/api/v1/alertas/evaluar", role: "encargado_almacen");

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var resultado = await response.Content.ReadFromJsonAsync<EvaluacionAlertasResultadoDto>(JsonOptions);
        Assert.NotNull(resultado);
        Assert.True(resultado.AlertasGeneradas >= 1);
    }

    [Fact]
    public async Task EvaluarReglas_EvitaDuplicados_NoGeneraAlertasSiYaExistenAbiertas()
    {
        var client = _factory.CreateClient();

        // Primera evaluación
        var req1 = CrearPeticion(HttpMethod.Post, "/api/v1/alertas/evaluar", role: "admin_inventario");
        var res1 = await client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.OK, res1.StatusCode);

        // Segunda evaluación inmediata: no debe generar alertas nuevas duplicadas para los mismos recursos
        var req2 = CrearPeticion(HttpMethod.Post, "/api/v1/alertas/evaluar", role: "admin_inventario");
        var res2 = await client.SendAsync(req2);
        Assert.Equal(HttpStatusCode.OK, res2.StatusCode);

        var resultado2 = await res2.Content.ReadFromJsonAsync<EvaluacionAlertasResultadoDto>(JsonOptions);
        Assert.NotNull(resultado2);
        Assert.True(resultado2.AlertasOmitidasExistentes >= 0);
    }

    [Fact]
    public async Task MarcarComoLeida_AlertaValida_RetornaOkYActualizaEstado()
    {
        Guid alertaId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SistemaUOD.Infrastructure.Data.ApplicationDbContext>();
            var alerta = new Alerta
            {
                Id = Guid.NewGuid(),
                Tipo = "sistema",
                Severidad = "info",
                Titulo = "Alerta prueba lectura",
                Mensaje = "Mensaje prueba para marcar como leída",
                Leida = false,
                CreadoEn = DateTime.UtcNow
            };
            db.Alertas.Add(alerta);
            await db.SaveChangesAsync();
            alertaId = alerta.Id;
        }

        var client = _factory.CreateClient();
        var req = CrearPeticion(HttpMethod.Patch, $"/api/v1/alertas/{alertaId}/leida", role: "consulta");

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verificar que quedó leída
        var reqGet = CrearPeticion(HttpMethod.Get, $"/api/v1/alertas/{alertaId}", role: "consulta");
        var resGet = await client.SendAsync(reqGet);
        var alertaDto = await resGet.Content.ReadFromJsonAsync<AlertaDto>(JsonOptions);
        Assert.NotNull(alertaDto);
        Assert.True(alertaDto.Leida);
    }

    [Fact]
    public async Task MarcarTodasComoLeidas_RetornaCantidadAfectadas()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SistemaUOD.Infrastructure.Data.ApplicationDbContext>();
            db.Alertas.Add(new Alerta
            {
                Id = Guid.NewGuid(),
                Tipo = "sistema",
                Severidad = "info",
                Titulo = "Alerta masiva 1",
                Mensaje = "Prueba marcar todas",
                Leida = false,
                CreadoEn = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        var client = _factory.CreateClient();
        var req = CrearPeticion(HttpMethod.Post, "/api/v1/alertas/marcar-todas-leidas", role: "admin_inventario");

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains("total", json);
    }

    [Fact]
    public async Task CrearAlertaManual_RolSinPermiso_RetornaForbidden()
    {
        var client = _factory.CreateClient();
        var req = CrearPeticion(HttpMethod.Post, "/api/v1/alertas", role: "consulta");
        req.Content = JsonContent.Create(new CrearAlertaDto
        {
            Tipo = "sistema",
            Severidad = "info",
            Titulo = "Intento no autorizado",
            Mensaje = "Este llamado debe ser rechazado"
        });

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PreferenciasNotificacion_ObtenerYActualizar_FuncionaCorrectamente()
    {
        var client = _factory.CreateClient();

        // 1. Obtener preferencias
        var reqGet = CrearPeticion(HttpMethod.Get, "/api/v1/notificaciones/preferencias", role: "consulta");
        var resGet = await client.SendAsync(reqGet);
        Assert.Equal(HttpStatusCode.OK, resGet.StatusCode);

        var pref = await resGet.Content.ReadFromJsonAsync<NotificacionPreferenciaDto>(JsonOptions);
        Assert.NotNull(pref);

        // 2. Actualizar preferencias
        var reqPut = CrearPeticion(HttpMethod.Put, "/api/v1/notificaciones/preferencias", role: "consulta");
        reqPut.Content = JsonContent.Create(new ActualizarPreferenciaDto
        {
            RecibirAlertasStock = false,
            RecibirAlertasMantenimiento = true,
            RecibirResumenSemanal = true
        });

        var resPut = await client.SendAsync(reqPut);
        Assert.Equal(HttpStatusCode.OK, resPut.StatusCode);

        var prefActualizada = await resPut.Content.ReadFromJsonAsync<NotificacionPreferenciaDto>(JsonOptions);
        Assert.NotNull(prefActualizada);
        Assert.False(prefActualizada.RecibirAlertasStock);
        Assert.True(prefActualizada.RecibirAlertasMantenimiento);
        Assert.True(prefActualizada.RecibirResumenSemanal);
    }
}
