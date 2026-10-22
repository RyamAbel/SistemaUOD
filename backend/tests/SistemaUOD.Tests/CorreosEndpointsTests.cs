using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;
using SistemaUOD.Infrastructure.Services;
using Xunit;

namespace SistemaUOD.Tests;

public class CorreosEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public CorreosEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static HttpRequestMessage CrearPeticion(HttpMethod metodo, string url, string role = "admin_inventario")
    {
        var request = new HttpRequestMessage(metodo, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "test-token");
        request.Headers.Add("X-Test-UserId", "00000000-0000-0000-0000-000000000001");
        request.Headers.Add("X-Test-Role", role);
        request.Headers.Add("X-Test-Email", $"{role}@uod.edu.do");
        return request;
    }

    [Fact]
    public async Task ListarColaCorreos_ConPermiso_RetornaOkConPaginacion()
    {
        var client = _factory.CreateClient();
        var req = CrearPeticion(HttpMethod.Get, "/api/v1/correos/cola?pagina=1&tamanoPagina=10", role: "admin_inventario");

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<ColaCorreoDto>>(JsonOptions);
        Assert.NotNull(result);
        Assert.NotNull(result.Items);
    }

    [Fact]
    public async Task ListarColaCorreos_RolSinPermiso_RetornaForbidden()
    {
        var client = _factory.CreateClient();
        var req = CrearPeticion(HttpMethod.Get, "/api/v1/correos/cola", role: "consulta");

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task ObtenerEstadisticasColaCorreos_RetornaBalanceContadores()
    {
        var client = _factory.CreateClient();
        var req = CrearPeticion(HttpMethod.Get, "/api/v1/correos/cola/estadisticas", role: "admin_inventario");

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains("pendientes", json);
        Assert.Contains("enviados", json);
        Assert.Contains("fallidos", json);
    }

    [Fact]
    public async Task ReintentarCorreoCola_CambiaEstadoAPendiente()
    {
        Guid correoId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SistemaUOD.Infrastructure.Data.ApplicationDbContext>();
            var correoFallido = new ColaCorreo
            {
                Id = Guid.NewGuid(),
                Destinatario = "tecnico@uod.edu.do",
                Asunto = "Prueba fallo y reintento",
                CuerpoHtml = "<p>Contenido prueba</p>",
                Estado = "fallido",
                Intentos = 3,
                UltimoError = "Timeout de conexión simulado",
                CreadoEn = DateTime.UtcNow
            };
            db.ColaCorreos.Add(correoFallido);
            await db.SaveChangesAsync();
            correoId = correoFallido.Id;
        }

        var client = _factory.CreateClient();
        var req = CrearPeticion(HttpMethod.Post, $"/api/v1/correos/cola/{correoId}/reintentar", role: "admin_inventario");

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verificar en BD que volvió a estado pendiente
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SistemaUOD.Infrastructure.Data.ApplicationDbContext>();
            var correo = await db.ColaCorreos.FindAsync(correoId);
            Assert.NotNull(correo);
            Assert.Equal("pendiente", correo.Estado);
            Assert.Equal(0, correo.Intentos);
            Assert.Null(correo.UltimoError);
        }
    }

    [Fact]
    public async Task EmailQueueBackgroundService_ProcesaLoteCorreos_MarcaComoEnviado()
    {
        Guid correoId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SistemaUOD.Infrastructure.Data.ApplicationDbContext>();
            var correoPendiente = new ColaCorreo
            {
                Id = Guid.NewGuid(),
                Destinatario = "almacen@uod.edu.do",
                Asunto = "Alerta stock bajo automática",
                CuerpoHtml = "<p>Alerta de reposición</p>",
                Estado = "pendiente",
                Intentos = 0,
                CreadoEn = DateTime.UtcNow
            };
            db.ColaCorreos.Add(correoPendiente);
            await db.SaveChangesAsync();
            correoId = correoPendiente.Id;
        }

        // Ejecutar el procesamiento de lote a través del worker
        using (var scope = _factory.Services.CreateScope())
        {
            var worker = scope.ServiceProvider.GetRequiredService<EmailQueueBackgroundService>();
            var procesados = await worker.ProcesarLotePendientesAsync();
            Assert.True(procesados >= 1);
        }

        // Verificar que el correo quedó en estado enviado
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SistemaUOD.Infrastructure.Data.ApplicationDbContext>();
            var correo = await db.ColaCorreos.FindAsync(correoId);
            Assert.NotNull(correo);
            Assert.Equal("enviado", correo.Estado);
            Assert.NotNull(correo.ProcesadoEn);
            Assert.Equal(1, correo.Intentos);
        }
    }

    [Fact]
    public void GeneradorPlantillasHtml_ProduceEstructuraUodValida()
    {
        var templateService = new EmailTemplateService();

        // 1. Plantilla de stock bajo
        var htmlStock = templateService.GenerarAlertaStockBajoHtml(
            "Anestesia Odontológica 2%",
            "MED-ANE-001",
            0,
            15,
            30
        );
        Assert.Contains("UNIVERSIDAD ODONTOLÓGICA DOMINICANA", htmlStock);
        Assert.Contains("Anestesia Odontológica 2%", htmlStock);
        Assert.Contains("MED-ANE-001", htmlStock);
        Assert.Contains("EXISTENCIA AGOTADA", htmlStock);

        // 2. Plantilla de vencimiento de lote
        var htmlLote = templateService.GenerarAlertaVencimientoLoteHtml(
            "Resina Compuesta A2",
            "LOTE-2026-X",
            "30/11/2026",
            12
        );
        Assert.Contains("Resina Compuesta A2", htmlLote);
        Assert.Contains("LOTE-2026-X", htmlLote);
        Assert.Contains("12 DÍAS", htmlLote);

        // 3. Plantilla de mantenimiento
        var htmlMant = templateService.GenerarAlertaMantenimientoHtml(
            "EQ-45",
            "Sillón Odontológico Modelo X",
            "25/10/2026",
            "preventivo",
            4
        );
        Assert.Contains("EQ-45", htmlMant);
        Assert.Contains("Sillón Odontológico", htmlMant);

        // 4. Plantilla de traslado de activo
        var htmlTraslado = templateService.GenerarAvisoTrasladoActivoHtml(
            "EQ-102",
            "Computadora Dell OptiPlex",
            "Laboratorio Cómputo",
            "Clínica B",
            "Dr. Pérez",
            "ACTA-2026-00012"
        );
        Assert.Contains("EQ-102", htmlTraslado);
        Assert.Contains("ACTA-2026-00012", htmlTraslado);
        Assert.Contains("Clínica B", htmlTraslado);
    }
}
