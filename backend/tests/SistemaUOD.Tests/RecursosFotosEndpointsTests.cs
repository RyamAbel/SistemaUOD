using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;
using SistemaUOD.Infrastructure.Data;
using Xunit;

namespace SistemaUOD.Tests;

public class RecursosFotosEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public RecursosFotosEndpointsTests(CustomWebApplicationFactory factory)
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

    private async Task<Guid> ObtenerOCrearRecursoParaFotosAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var catId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var cat = await db.Categorias.FindAsync(catId);
        if (cat == null)
        {
            cat = new Categoria
            {
                Id = catId,
                Codigo = "CAT-FOTOS-TEST",
                Nombre = "Categoría para Pruebas de Fotos",
                Activa = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Categorias.Add(cat);
            await db.SaveChangesAsync();
        }

        var recursoId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var recurso = await db.Recursos.FindAsync(recursoId);
        if (recurso == null)
        {
            recurso = new Recurso
            {
                Id = recursoId,
                Sku = "SKU-FOTOS-001",
                Nombre = "Turbina Odontológica LED Alta Velocidad",
                CategoriaId = catId,
                Tipo = "activo_fijo",
                UnidadMedida = "unidad",
                StockMinimo = 1,
                CostoEstimado = 18500.00m,
                Activo = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Recursos.Add(recurso);
            await db.SaveChangesAsync();
        }

        return recursoId;
    }

    private static ByteArrayContent CrearImagenJpgFalsa(string nombreCampo = "file", string nombreArchivo = "turbina.jpg")
    {
        // Encabezado Magic Numbers de un JPEG real (FF D8 FF E0 ...)
        var bytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48 };
        var content = new ByteArrayContent(bytes);
        content.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        content.Headers.ContentDisposition = new ContentDispositionHeaderValue("form-data")
        {
            Name = $"\"{nombreCampo}\"",
            FileName = $"\"{nombreArchivo}\""
        };
        return content;
    }

    private static ByteArrayContent CrearArchivoFalsoNoImagen(string nombreCampo = "file", string nombreArchivo = "malicioso.exe.jpg")
    {
        // Contenido que no contiene Magic Numbers de JPG/PNG/WebP
        var bytes = System.Text.Encoding.UTF8.GetBytes("MZ_ESTO_ES_UN_EJECUTABLE_FALSO_NO_IMAGEN");
        var content = new ByteArrayContent(bytes);
        content.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        content.Headers.ContentDisposition = new ContentDispositionHeaderValue("form-data")
        {
            Name = $"\"{nombreCampo}\"",
            FileName = $"\"{nombreArchivo}\""
        };
        return content;
    }

    [Fact]
    public async Task SubirFoto_SinAutenticacion_Retorna401Unauthorized()
    {
        var client = _factory.CreateClient();
        var recursoId = await ObtenerOCrearRecursoParaFotosAsync();

        using var form = new MultipartFormDataContent();
        form.Add(CrearImagenJpgFalsa());

        var response = await client.PostAsync($"/api/v1/recursos/{recursoId}/fotos", form);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SubirFoto_ConRolConsulta_Retorna403Forbidden()
    {
        var client = _factory.CreateClient();
        var recursoId = await ObtenerOCrearRecursoParaFotosAsync();

        var request = CrearPeticion(HttpMethod.Post, $"/api/v1/recursos/{recursoId}/fotos", role: "consulta");
        var form = new MultipartFormDataContent();
        form.Add(CrearImagenJpgFalsa());
        request.Content = form;

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task SubirFoto_ConArchivoNoImagen_Retorna400BadRequest_PorMagicNumbers()
    {
        var client = _factory.CreateClient();
        var recursoId = await ObtenerOCrearRecursoParaFotosAsync();

        var request = CrearPeticion(HttpMethod.Post, $"/api/v1/recursos/{recursoId}/fotos", role: "super_admin");
        var form = new MultipartFormDataContent();
        form.Add(CrearArchivoFalsoNoImagen());
        request.Content = form;

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("formato real del archivo no es válido", content);
    }

    [Fact]
    public async Task SubirFoto_ConJpgValido_Retorna201Created_Y_EsPrincipal()
    {
        var client = _factory.CreateClient();
        var recursoId = await ObtenerOCrearRecursoParaFotosAsync();

        var request = CrearPeticion(HttpMethod.Post, $"/api/v1/recursos/{recursoId}/fotos", role: "admin_inventario");
        var form = new MultipartFormDataContent();
        form.Add(CrearImagenJpgFalsa());
        request.Content = form;

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var creada = await response.Content.ReadFromJsonAsync<SubirFotoRespuestaDto>();
        Assert.NotNull(creada);
        Assert.Equal(recursoId, creada.RecursoId);
        Assert.True(creada.EsPrincipal);
        Assert.NotEmpty(creada.UrlArchivo);
    }

    [Fact]
    public async Task ReordenarFotos_ConListaIds_Retorna200Ok()
    {
        var client = _factory.CreateClient();
        var recursoId = await ObtenerOCrearRecursoParaFotosAsync();

        // 1. Subir dos fotos
        var req1 = CrearPeticion(HttpMethod.Post, $"/api/v1/recursos/{recursoId}/fotos", role: "super_admin");
        var form1 = new MultipartFormDataContent { CrearImagenJpgFalsa() };
        req1.Content = form1;
        var res1 = await client.SendAsync(req1);
        var foto1 = await res1.Content.ReadFromJsonAsync<SubirFotoRespuestaDto>();

        var req2 = CrearPeticion(HttpMethod.Post, $"/api/v1/recursos/{recursoId}/fotos", role: "super_admin");
        var form2 = new MultipartFormDataContent { CrearImagenJpgFalsa() };
        req2.Content = form2;
        var res2 = await client.SendAsync(req2);
        var foto2 = await res2.Content.ReadFromJsonAsync<SubirFotoRespuestaDto>();

        Assert.NotNull(foto1);
        Assert.NotNull(foto2);

        // 2. Reordenar invirtiendo las fotos
        var reqReordenar = CrearPeticion(HttpMethod.Put, $"/api/v1/recursos/{recursoId}/fotos/reordenar", role: "super_admin");
        reqReordenar.Content = JsonContent.Create(new ReordenarFotosDto
        {
            FotosOrdenadasIds = [foto2.Id, foto1.Id]
        });

        var resReordenar = await client.SendAsync(reqReordenar);
        Assert.Equal(HttpStatusCode.OK, resReordenar.StatusCode);
    }

    [Fact]
    public async Task EliminarFoto_ConPermiso_Retorna204NoContent()
    {
        var client = _factory.CreateClient();
        var recursoId = await ObtenerOCrearRecursoParaFotosAsync();

        // 1. Subir foto
        var reqUpload = CrearPeticion(HttpMethod.Post, $"/api/v1/recursos/{recursoId}/fotos", role: "super_admin");
        var form = new MultipartFormDataContent { CrearImagenJpgFalsa() };
        reqUpload.Content = form;
        var resUpload = await client.SendAsync(reqUpload);
        var foto = await resUpload.Content.ReadFromJsonAsync<SubirFotoRespuestaDto>();
        Assert.NotNull(foto);

        // 2. Eliminar
        var reqDelete = CrearPeticion(HttpMethod.Delete, $"/api/v1/recursos/{recursoId}/fotos/{foto.Id}", role: "super_admin");
        var resDelete = await client.SendAsync(reqDelete);
        Assert.Equal(HttpStatusCode.NoContent, resDelete.StatusCode);
    }
}
