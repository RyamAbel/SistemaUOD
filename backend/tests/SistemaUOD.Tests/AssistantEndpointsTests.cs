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

    // ==========================================
    // Pruebas de Etapa 10: Confirmación, Reversión y Visión Multimodal
    // ==========================================

    [Fact]
    public async Task ConfirmarPropuesta_RolConsulta_Retorna403Forbidden()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/assistant/propuestas/PROP-TEST-999/confirmar", role: "consulta");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task ConfirmarPropuesta_RolOperadorAlmacen_PropuestaValida_Retorna200Ok_ConMovimientoOficial()
    {
        var client = _factory.CreateClient();

        // 1. Crear propuesta mediante consulta asistida
        var chatReq = CrearPeticion(HttpMethod.Post, "/api/v1/assistant/chat", role: "admin_inventario");
        chatReq.Content = JsonContent.Create(new ChatRequestDto
        {
            Message = "Traslada 3 unidades a Rectoría para equipamiento de oficina",
            Mode = "operativo"
        });

        var chatRes = await client.SendAsync(chatReq);
        Assert.Equal(HttpStatusCode.OK, chatRes.StatusCode);
        var chatData = await chatRes.Content.ReadFromJsonAsync<ChatResponseDto>();
        Assert.NotNull(chatData?.Propuesta);

        var propuestaId = chatData.Propuesta.Id;

        // 2. Confirmar propuesta con rol operador_almacen
        var confReq = CrearPeticion(HttpMethod.Post, $"/api/v1/assistant/propuestas/{propuestaId}/confirmar", role: "encargado_almacen");
        var confRes = await client.SendAsync(confReq);

        Assert.Equal(HttpStatusCode.OK, confRes.StatusCode);
        var resultado = await confRes.Content.ReadFromJsonAsync<ResultadoConfirmacionPropuestaDto>();
        Assert.NotNull(resultado);
        Assert.True(resultado.Exitoso);
        Assert.StartsWith("MOV-", resultado.MovimientoCorrelativo);
        Assert.NotNull(resultado.MovimientoId);
        Assert.True(resultado.EsReversible);
        Assert.False(resultado.Revertido);
    }

    [Fact]
    public async Task CancelarPropuesta_DescartaPropuestaPendiente_Retorna200Ok()
    {
        var client = _factory.CreateClient();

        // 1. Crear propuesta
        var chatReq = CrearPeticion(HttpMethod.Post, "/api/v1/assistant/chat", role: "admin_inventario");
        chatReq.Content = JsonContent.Create(new ChatRequestDto
        {
            Message = "Traslada 2 unidades a Rectoría",
            Mode = "operativo"
        });

        var chatRes = await client.SendAsync(chatReq);
        var chatData = await chatRes.Content.ReadFromJsonAsync<ChatResponseDto>();
        Assert.NotNull(chatData?.Propuesta);

        // 2. Cancelar propuesta
        var cancReq = CrearPeticion(HttpMethod.Post, $"/api/v1/assistant/propuestas/{chatData.Propuesta.Id}/cancelar", role: "admin_inventario");
        var cancRes = await client.SendAsync(cancReq);

        Assert.Equal(HttpStatusCode.OK, cancRes.StatusCode);
    }

    [Fact]
    public async Task RevertirPropuesta_DentroVentana5Minutos_GeneraContraMovimientoInverso()
    {
        var client = _factory.CreateClient();

        // 1. Crear propuesta
        var chatReq = CrearPeticion(HttpMethod.Post, "/api/v1/assistant/chat", role: "admin_inventario");
        chatReq.Content = JsonContent.Create(new ChatRequestDto
        {
            Message = "Traslada 1 unidad a Rectoría para prueba de reversión",
            Mode = "operativo"
        });

        var chatRes = await client.SendAsync(chatReq);
        var chatData = await chatRes.Content.ReadFromJsonAsync<ChatResponseDto>();
        Assert.NotNull(chatData?.Propuesta);

        // 2. Confirmar propuesta
        var confReq = CrearPeticion(HttpMethod.Post, $"/api/v1/assistant/propuestas/{chatData.Propuesta.Id}/confirmar", role: "encargado_almacen");
        var confRes = await client.SendAsync(confReq);
        Assert.Equal(HttpStatusCode.OK, confRes.StatusCode);

        // 3. Revertir propuesta (Undo de 5 minutos)
        var revReq = CrearPeticion(HttpMethod.Post, $"/api/v1/assistant/propuestas/{chatData.Propuesta.Id}/revertir", role: "encargado_almacen");
        var revRes = await client.SendAsync(revReq);

        Assert.Equal(HttpStatusCode.OK, revRes.StatusCode);
        var revData = await revRes.Content.ReadFromJsonAsync<ResultadoConfirmacionPropuestaDto>();
        Assert.NotNull(revData);
        Assert.True(revData.Exitoso);
        Assert.True(revData.Revertido);
        Assert.False(revData.EsReversible);
        Assert.StartsWith("MOV-", revData.MovimientoCorrelativo);
    }

    [Fact]
    public async Task AnalizarFotoRecurso_ConImagenValida_RetornaPropuestaFichaTecnica()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/assistant/analizar-foto", role: "admin_inventario");
        request.Content = JsonContent.Create(new AnalisisFotoRecursoDto
        {
            FotoBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
            MimeType = "image/png",
            ObservacionesUsuario = "Equipo de cómputo laptop para laboratorio"
        });

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var data = await response.Content.ReadFromJsonAsync<PropuestaRecursoDesdeFotoDto>();
        Assert.NotNull(data);
        Assert.False(string.IsNullOrWhiteSpace(data.NombreSugerido));
        Assert.StartsWith("UOD-", data.SkuSugerido);
        Assert.Equal("alta", data.ConfianzaAnalisis);
    }

    [Fact]
    public async Task AnalizarFotoRecurso_SinFotoBase64_Retorna400BadRequest()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/assistant/analizar-foto", role: "admin_inventario");
        request.Content = JsonContent.Create(new AnalisisFotoRecursoDto
        {
            FotoBase64 = "",
            MimeType = "image/png"
        });

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Chat_ConsultaMantenimiento_Retorna200Ok_Y_EjecutaHerramienta()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/assistant/chat", role: "admin_inventario");
        request.Content = JsonContent.Create(new ChatRequestDto
        {
            Message = "¿Cuáles son los mantenimientos preventivos o correctivos programados?",
            Mode = "operativo"
        });

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var data = await response.Content.ReadFromJsonAsync<ChatResponseDto>();
        Assert.NotNull(data);
        Assert.Contains("consultar_mantenimientos", data.ToolCallsEjecutadas);
        Assert.False(string.IsNullOrWhiteSpace(data.Text));
    }

    [Fact]
    public async Task Chat_ConsultaOrdenesCompra_Retorna200Ok_Y_EjecutaHerramienta()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/assistant/chat", role: "admin_inventario");
        request.Content = JsonContent.Create(new ChatRequestDto
        {
            Message = "¿Cuáles son las órdenes de compra registradas con los proveedores?",
            Mode = "operativo"
        });

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var data = await response.Content.ReadFromJsonAsync<ChatResponseDto>();
        Assert.NotNull(data);
        Assert.Contains("consultar_ordenes_compra", data.ToolCallsEjecutadas);
        Assert.False(string.IsNullOrWhiteSpace(data.Text));
    }

    [Fact]
    public async Task Chat_ConsultaConteosFisicos_Retorna200Ok_Y_EjecutaHerramienta()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/assistant/chat", role: "admin_inventario");
        request.Content = JsonContent.Create(new ChatRequestDto
        {
            Message = "¿Qué sesiones de conteo físico o auditoría se han realizado?",
            Mode = "operativo"
        });

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var data = await response.Content.ReadFromJsonAsync<ChatResponseDto>();
        Assert.NotNull(data);
        Assert.Contains("consultar_conteos_fisicos", data.ToolCallsEjecutadas);
        Assert.False(string.IsNullOrWhiteSpace(data.Text));
    }
}
