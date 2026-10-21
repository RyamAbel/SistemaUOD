using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using Xunit;

namespace SistemaUOD.Tests;

public class MantenimientoEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public MantenimientoEndpointsTests(CustomWebApplicationFactory factory)
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

    private async Task<ActivoSerieDto> ObtenerActivoPruebaAsync(HttpClient client)
    {
        var req = CrearPeticion(HttpMethod.Get, "/api/v1/activos?pageIndex=1&pageSize=1", role: "super_admin");
        var res = await client.SendAsync(req);
        res.EnsureSuccessStatusCode();
        var paged = await res.Content.ReadFromJsonAsync<PagedResult<ActivoSerieDto>>();
        if (paged?.Items != null && paged.Items.Count > 0)
        {
            return paged.Items.First();
        }

        // Si no hay activos en la BD de pruebas, crear uno
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SistemaUOD.Infrastructure.Data.ApplicationDbContext>();

        var categoria = db.Categorias.FirstOrDefault() ?? new SistemaUOD.Domain.Entities.Categoria
        {
            Id = Guid.NewGuid(),
            Codigo = "CAT-TEST-TI",
            Nombre = "Tecnología e Informática",
            Activa = true
        };
        if (db.Entry(categoria).State == Microsoft.EntityFrameworkCore.EntityState.Detached) db.Categorias.Add(categoria);

        var ubicacion = db.Ubicaciones.FirstOrDefault() ?? new SistemaUOD.Domain.Entities.Ubicacion
        {
            Id = Guid.NewGuid(),
            Codigo = "UB-TEST-01",
            Nombre = "Laboratorio TI UOD",
            Activa = true
        };
        if (db.Entry(ubicacion).State == Microsoft.EntityFrameworkCore.EntityState.Detached) db.Ubicaciones.Add(ubicacion);

        var recurso = db.Recursos.FirstOrDefault() ?? new SistemaUOD.Domain.Entities.Recurso
        {
            Id = Guid.NewGuid(),
            Sku = $"SKU-TEST-{Guid.NewGuid():N}"[..12],
            Nombre = "Computadora All In One HP ProOne",
            CategoriaId = categoria.Id,
            Tipo = "activo_fijo",
            CostoEstimado = 52000.00m,
            Activo = true
        };
        if (db.Entry(recurso).State == Microsoft.EntityFrameworkCore.EntityState.Detached) db.Recursos.Add(recurso);

        var nuevoActivo = new SistemaUOD.Domain.Entities.ActivoSerie
        {
            Id = Guid.NewGuid(),
            RecursoId = recurso.Id,
            UbicacionId = ubicacion.Id,
            NumeroSerie = $"SN-TEST-{Guid.NewGuid():N}"[..12],
            PlacaInstitucional = $"EQ-TST-{Guid.NewGuid():N}"[..10].ToUpper(),
            Estado = "disponible",
            Notas = "Equipo para test de mantenimientos"
        };
        db.ActivosSerie.Add(nuevoActivo);
        await db.SaveChangesAsync();

        return new ActivoSerieDto
        {
            Id = nuevoActivo.Id,
            RecursoId = nuevoActivo.RecursoId,
            RecursoNombre = recurso.Nombre,
            NumeroSerie = nuevoActivo.NumeroSerie,
            PlacaInstitucional = nuevoActivo.PlacaInstitucional,
            Estado = nuevoActivo.Estado,
            UbicacionId = nuevoActivo.UbicacionId,
            UbicacionNombre = ubicacion.Nombre
        };
    }

    [Fact]
    public async Task ListarMantenimientos_SinAutenticacion_Retorna401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/mantenimientos");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ListarMantenimientos_Autenticado_Retorna200Ok_ConPaginacion()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/mantenimientos?pageIndex=1&pageSize=10", role: "consulta");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var resultado = await response.Content.ReadFromJsonAsync<PagedResult<MantenimientoDto>>();
        Assert.NotNull(resultado);
        Assert.Equal(1, resultado.PageIndex);
    }

    [Fact]
    public async Task RegistrarMantenimiento_RolConsulta_Retorna403Forbidden()
    {
        var client = _factory.CreateClient();
        var activo = await ObtenerActivoPruebaAsync(client);

        var dto = new CrearMantenimientoDto
        {
            ActivoSerieId = activo.Id,
            Tipo = "preventivo",
            Descripcion = "Limpieza de ventiladores y cambio de pasta térmica",
            Costo = 1200.00m,
            FechaProgramada = DateTime.UtcNow.AddDays(2)
        };

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/mantenimientos", role: "consulta");
        request.Content = JsonContent.Create(dto);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task RegistrarMantenimiento_Preventivo_Exitoso_Retorna201Created()
    {
        var client = _factory.CreateClient();
        var activo = await ObtenerActivoPruebaAsync(client);

        var dto = new CrearMantenimientoDto
        {
            ActivoSerieId = activo.Id,
            Tipo = "preventivo",
            TecnicoResponsable = "Ing. Soporte TI UOD",
            Descripcion = "Mantenimiento preventivo semestral UOD",
            Costo = 1500.00m,
            FechaProgramada = DateTime.UtcNow.AddDays(1)
        };

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/mantenimientos", role: "admin_inventario");
        request.Content = JsonContent.Create(dto);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var creado = await response.Content.ReadFromJsonAsync<MantenimientoDto>();
        Assert.NotNull(creado);
        Assert.Equal("preventivo", creado.Tipo);
        Assert.Equal("programado", creado.Estado);
        Assert.Equal(1500.00m, creado.Costo);
        Assert.Equal(activo.Id, creado.ActivoSerieId);
    }

    [Fact]
    public async Task RegistrarMantenimiento_Correctivo_CambiaEstadoActivoAEnMantenimiento()
    {
        var client = _factory.CreateClient();
        var activo = await ObtenerActivoPruebaAsync(client);

        var dto = new CrearMantenimientoDto
        {
            ActivoSerieId = activo.Id,
            Tipo = "correctivo",
            TecnicoResponsable = "Especialista Hardware UOD",
            Descripcion = "Fallo en fuente de poder y reinicios intermitentes",
            Costo = 3800.00m,
            FechaProgramada = DateTime.UtcNow
        };

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/mantenimientos", role: "super_admin");
        request.Content = JsonContent.Create(dto);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var creado = await response.Content.ReadFromJsonAsync<MantenimientoDto>();
        Assert.NotNull(creado);
        Assert.Equal("correctivo", creado.Tipo);

        // Verificar que el activo ahora está en estado "en_mantenimiento"
        var reqActivo = CrearPeticion(HttpMethod.Get, $"/api/v1/activos/{activo.Id}", role: "super_admin");
        var resActivo = await client.SendAsync(reqActivo);
        resActivo.EnsureSuccessStatusCode();
        var detalleActivo = await resActivo.Content.ReadFromJsonAsync<ActivoSerieDetalleDto>();
        Assert.NotNull(detalleActivo);
        Assert.Equal("en_mantenimiento", detalleActivo.Estado);
    }

    [Fact]
    public async Task CompletarMantenimiento_RestauraActivoYMarcaCompletado()
    {
        var client = _factory.CreateClient();
        var activo = await ObtenerActivoPruebaAsync(client);

        // 1. Crear mantenimiento
        var dtoCrear = new CrearMantenimientoDto
        {
            ActivoSerieId = activo.Id,
            Tipo = "correctivo",
            TecnicoResponsable = "Tecnico Taller UOD",
            Descripcion = "Sustitución de memoria RAM dañada",
            Costo = 2500.00m,
            FechaProgramada = DateTime.UtcNow
        };

        var reqCrear = CrearPeticion(HttpMethod.Post, "/api/v1/mantenimientos", role: "super_admin");
        reqCrear.Content = JsonContent.Create(dtoCrear);
        var resCrear = await client.SendAsync(reqCrear);
        resCrear.EnsureSuccessStatusCode();
        var mantenimiento = await resCrear.Content.ReadFromJsonAsync<MantenimientoDto>();
        Assert.NotNull(mantenimiento);

        // 2. Completar mantenimiento
        var dtoCompletar = new CompletarMantenimientoDto
        {
            FechaRealizada = DateTime.UtcNow,
            CostoFinal = 2650.00m,
            TecnicoResponsable = "Tecnico Taller UOD",
            ObservacionesFinales = "Memoria RAM reemplazada con éxito, equipo probado por 2 horas sin fallos.",
            EstadoFinalActivo = "disponible"
        };

        var reqCompletar = CrearPeticion(HttpMethod.Post, $"/api/v1/mantenimientos/{mantenimiento.Id}/completar", role: "super_admin");
        reqCompletar.Content = JsonContent.Create(dtoCompletar);

        var resCompletar = await client.SendAsync(reqCompletar);
        Assert.Equal(HttpStatusCode.OK, resCompletar.StatusCode);

        var completado = await resCompletar.Content.ReadFromJsonAsync<MantenimientoDto>();
        Assert.NotNull(completado);
        Assert.Equal("completado", completado.Estado);
        Assert.Equal(2650.00m, completado.Costo);
        Assert.NotNull(completado.FechaRealizada);

        // 3. Verificar que el activo volvió a disponible
        var reqActivo = CrearPeticion(HttpMethod.Get, $"/api/v1/activos/{activo.Id}", role: "super_admin");
        var resActivo = await client.SendAsync(reqActivo);
        resActivo.EnsureSuccessStatusCode();
        var detalleActivo = await resActivo.Content.ReadFromJsonAsync<ActivoSerieDetalleDto>();
        Assert.NotNull(detalleActivo);
        Assert.Equal("disponible", detalleActivo.Estado);
    }

    [Fact]
    public async Task CancelarMantenimiento_MarcaCancelado_Y_RegistraMotivo()
    {
        var client = _factory.CreateClient();
        var activo = await ObtenerActivoPruebaAsync(client);

        var dtoCrear = new CrearMantenimientoDto
        {
            ActivoSerieId = activo.Id,
            Tipo = "preventivo",
            Descripcion = "Inspección de cableado",
            Costo = 500.00m,
            FechaProgramada = DateTime.UtcNow.AddDays(5)
        };

        var reqCrear = CrearPeticion(HttpMethod.Post, "/api/v1/mantenimientos", role: "super_admin");
        reqCrear.Content = JsonContent.Create(dtoCrear);
        var resCrear = await client.SendAsync(reqCrear);
        resCrear.EnsureSuccessStatusCode();
        var mantenimiento = await resCrear.Content.ReadFromJsonAsync<MantenimientoDto>();
        Assert.NotNull(mantenimiento);

        var dtoCancelar = new CancelarMantenimientoDto
        {
            Motivo = "Cancelado por cambio de prioridades en el departamento solicitante."
        };

        var reqCancelar = CrearPeticion(HttpMethod.Post, $"/api/v1/mantenimientos/{mantenimiento.Id}/cancelar", role: "super_admin");
        reqCancelar.Content = JsonContent.Create(dtoCancelar);

        var resCancelar = await client.SendAsync(reqCancelar);
        Assert.Equal(HttpStatusCode.OK, resCancelar.StatusCode);

        var cancelado = await resCancelar.Content.ReadFromJsonAsync<MantenimientoDto>();
        Assert.NotNull(cancelado);
        Assert.Equal("cancelado", cancelado.Estado);
        Assert.Contains("Cancelado:", cancelado.Descripcion);
    }

    [Fact]
    public async Task ObtenerHistorialYResumenActivo_RetornaDatosCorrectos()
    {
        var client = _factory.CreateClient();
        var activo = await ObtenerActivoPruebaAsync(client);

        // Obtener historial
        var reqHistorial = CrearPeticion(HttpMethod.Get, $"/api/v1/mantenimientos/activo/{activo.Id}", role: "consulta");
        var resHistorial = await client.SendAsync(reqHistorial);
        Assert.Equal(HttpStatusCode.OK, resHistorial.StatusCode);
        var lista = await resHistorial.Content.ReadFromJsonAsync<List<MantenimientoDto>>();
        Assert.NotNull(lista);

        // Obtener resumen
        var reqResumen = CrearPeticion(HttpMethod.Get, $"/api/v1/mantenimientos/activo/{activo.Id}/resumen", role: "consulta");
        var resResumen = await client.SendAsync(reqResumen);
        Assert.Equal(HttpStatusCode.OK, resResumen.StatusCode);
        var resumen = await resResumen.Content.ReadFromJsonAsync<ResumenMantenimientosActivoDto>();
        Assert.NotNull(resumen);
        Assert.Equal(activo.Id, resumen.ActivoSerieId);
        Assert.True(resumen.TotalMantenimientos >= 0);
        Assert.True(resumen.CostoTotalInvertidoDop >= 0);
    }
}
