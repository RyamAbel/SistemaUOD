using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Infrastructure.Data;
using Xunit;

namespace SistemaUOD.Tests;

public class AssistantEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AssistantEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static HttpRequestMessage CrearPeticion(HttpMethod metodo, string url, string role = "admin_inventario")
    {
        var request = new HttpRequestMessage(metodo, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "test-token");
        request.Headers.Add("X-Test-UserId", Guid.NewGuid().ToString());
        request.Headers.Add("X-Test-Role", role);
        request.Headers.Add("X-Test-Email", $"{role}@uod.edu.do");
        return request;
    }

    [Fact]
    public async Task Chat_SinAutenticacion_Retorna401Unauthorized()
    {
        var client = _factory.CreateClient();
        var request = new ChatRequestDto { Message = "¿Cuáles son las existencias actuales?" };
        var response = await client.PostAsJsonAsync("/api/v1/assistant/chat", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Chat_MensajeVacio_Retorna400BadRequest()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/assistant/chat", role: "consulta");
        request.Content = JsonContent.Create(new ChatRequestDto { Message = "   " });

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Chat_ModoOperativo_ConsultaStock_Retorna200Ok_ConRespuestaValida()
    {
        var client = _factory.CreateClient();
        var reqDto = new ChatRequestDto
        {
            Message = "¿Qué artículos tienen stock bajo o requieren reposición?",
            Mode = "operativo"
        };

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/assistant/chat", role: "consulta");
        request.Content = JsonContent.Create(reqDto);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var chatResp = await response.Content.ReadFromJsonAsync<ChatResponseDto>();
        Assert.NotNull(chatResp);
        Assert.False(string.IsNullOrWhiteSpace(chatResp.Text));
        Assert.Equal("operativo", chatResp.Mode);
    }

    [Fact]
    public async Task Chat_ModoTutor_GuiaProcedimiento_Retorna200Ok_ConFormatoPedagogico()
    {
        var client = _factory.CreateClient();
        var reqDto = new ChatRequestDto
        {
            Message = "¿Cómo hago una recepción de mercancía y entrada al almacén?",
            Mode = "tutor"
        };

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/assistant/chat", role: "consulta");
        request.Content = JsonContent.Create(reqDto);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var chatResp = await response.Content.ReadFromJsonAsync<ChatResponseDto>();
        Assert.NotNull(chatResp);
        Assert.False(string.IsNullOrWhiteSpace(chatResp.Text));
        Assert.Equal("tutor", chatResp.Mode);
        Assert.Contains("Recepción", chatResp.Text);
    }

    [Fact]
    public async Task Chat_PeticionMovimiento_RolConsulta_NoGeneraPropuestaAccion()
    {
        var client = _factory.CreateClient();
        var reqDto = new ChatRequestDto
        {
            Message = "Traslada 10 cajas de guantes de látex al Laboratorio de Cómputo",
            Mode = "operativo"
        };

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/assistant/chat", role: "consulta");
        request.Content = JsonContent.Create(reqDto);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var chatResp = await response.Content.ReadFromJsonAsync<ChatResponseDto>();
        Assert.NotNull(chatResp);
        // El usuario con rol consulta no debe recibir una propuesta ejecutable
        Assert.Null(chatResp.Propuesta);
        Assert.Contains("consulta", chatResp.Text.ToLower());
    }

    [Fact]
    public async Task Chat_PeticionMovimiento_RolGestionInventario_GeneraPropuestaAccionConTarjeta()
    {
        var client = _factory.CreateClient();
        var reqDto = new ChatRequestDto
        {
            Message = "Traslada 5 unidades al Laboratorio de Cómputo por solicitud docente",
            Mode = "operativo"
        };

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/assistant/chat", role: "admin_inventario");
        request.Content = JsonContent.Create(reqDto);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var chatResp = await response.Content.ReadFromJsonAsync<ChatResponseDto>();
        Assert.NotNull(chatResp);
        Assert.NotNull(chatResp.Propuesta);
        Assert.StartsWith("PROP-", chatResp.Propuesta.Id);
        Assert.False(chatResp.Propuesta.Confirmado); // Regla inquebrantable: no confirmada automáticamente
        Assert.True(chatResp.Propuesta.Cantidad > 0);
    }

    [Fact]
    public async Task ObtenerInfoAsistente_Autenticado_Retorna200Ok_ConMetadatos()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/assistant/info", role: "consulta");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains("SIIA AI Assistant", json);
        Assert.Contains("operativo", json);
        Assert.Contains("tutor", json);
    }

    [Fact]
    public async Task ObtenerConsumoAsistente_RolConsulta_Retorna403Forbidden()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/assistant/consumo", role: "consulta");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task ObtenerConsumoAsistente_RolAdminInventario_Retorna200Ok_ConMetricasYPresupuesto()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/assistant/consumo", role: "admin_inventario");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var consumo = await response.Content.ReadFromJsonAsync<ConsumoAsistenteDto>();
        Assert.NotNull(consumo);
        Assert.True(consumo.TotalConsultasHoy >= 0);
        Assert.True(consumo.TotalConsultasMes >= 0);
        Assert.True(consumo.PresupuestoMensualDop > 0);
        Assert.NotEmpty(consumo.AvisoPoliticaPrivacidad);
    }
}
