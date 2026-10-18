using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;
using SistemaUOD.Infrastructure.Data;
using Xunit;

namespace SistemaUOD.Tests;

public class MeEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public MeEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task HealthCheck_Retorna200Ok_Y_EstadoSaludable()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/health");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("saludable", content);
        Assert.Contains("SIIA", content);
    }

    [Fact]
    public async Task GetMe_SinToken_Retorna401Unauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act (sin cabecera Authorization)
        var response = await client.GetAsync("/api/v1/me");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetMe_ConUsuarioActivo_Retorna200Ok_Y_PerfilCompleto()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var client = _factory.CreateClient();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Perfiles.Add(new Perfil
            {
                Id = userId,
                Correo = "admin.activo@uod.edu.do",
                NombreCompleto = "Dra. Carmen Reyes",
                Rol = "super_admin",
                Departamento = "Dirección Odontológica",
                Telefono = "809-555-0101",
                Activo = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
        request.Headers.Add("X-Test-UserId", userId.ToString());
        request.Headers.Add("X-Test-Role", "super_admin");
        request.Headers.Add("X-Test-Email", "admin.activo@uod.edu.do");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var perfil = await response.Content.ReadFromJsonAsync<PerfilDto>();
        Assert.NotNull(perfil);
        Assert.Equal(userId, perfil.Id);
        Assert.Equal("admin.activo@uod.edu.do", perfil.Correo);
        Assert.Equal("super_admin", perfil.Rol);
        Assert.True(perfil.Activo);
        Assert.Contains("usuarios:gestionar", perfil.Permisos);
    }

    [Fact]
    public async Task GetMe_ConUsuarioDesactivado_Retorna403Forbidden()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var client = _factory.CreateClient();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Perfiles.Add(new Perfil
            {
                Id = userId,
                Correo = "inactivo@uod.edu.do",
                NombreCompleto = "Dr. Pedro Inactivo",
                Rol = "consulta",
                Activo = false, // DESACTIVADO
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
        request.Headers.Add("X-Test-UserId", userId.ToString());
        request.Headers.Add("X-Test-Role", "consulta");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("desactivada", content);
    }

    [Fact]
    public async Task GetMe_ConUsuarioSinPerfilEnBaseDatos_Retorna403Forbidden()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var client = _factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
        request.Headers.Add("X-Test-UserId", userId.ToString());

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Acceso denegado", content);
    }

    [Fact]
    public async Task PoliticaRol_UsuarioConRolSuperAdmin_Retorna200Ok()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/verificacion-politica");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
        request.Headers.Add("X-Test-Role", "super_admin");

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task PoliticaRol_UsuarioConRolSolicitante_Retorna403Forbidden()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/verificacion-politica");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "valid-test-token");
        request.Headers.Add("X-Test-Role", "solicitante"); // Rol que no cumple ExigirSuperAdmin

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
