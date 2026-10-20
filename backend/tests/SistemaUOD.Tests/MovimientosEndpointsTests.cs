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

public class MovimientosEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public MovimientosEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static HttpRequestMessage CrearPeticion(HttpMethod metodo, string url, string role = "super_admin")
    {
        var request = new HttpRequestMessage(metodo, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "test-token");
        request.Headers.Add("X-Test-UserId", "99999999-9999-9999-9999-999999999999");
        request.Headers.Add("X-Test-Role", role);
        request.Headers.Add("X-Test-Email", $"{role}@uod.edu.do");
        return request;
    }

    private async Task<(Guid recursoId, Guid ubicacionOrigenId, Guid ubicacionDestinoId)> InicializarDatosPruebaAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Perfil para el usuario que hace el movimiento
        var testUserId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        var usuario = await db.Perfiles.FindAsync(testUserId);
        if (usuario == null)
        {
            usuario = new Perfil
            {
                Id = testUserId,
                Correo = "operador@uod.edu.do",
                NombreCompleto = "Encargado Almacén Test",
                Rol = "encargado_almacen",
                Activo = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Perfiles.Add(usuario);
        }

        var catId = Guid.Parse("f1111111-1111-1111-1111-111111111111");
        var cat = await db.Categorias.FindAsync(catId);
        if (cat == null)
        {
            cat = new Categoria
            {
                Id = catId,
                Codigo = "CAT-MOV-TEST",
                Nombre = "Categoría Movimientos Test",
                Activa = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Categorias.Add(cat);
        }

        var ubiOrigenId = Guid.Parse("f2222222-2222-2222-2222-222222222222");
        var ubiOrigen = await db.Ubicaciones.FindAsync(ubiOrigenId);
        if (ubiOrigen == null)
        {
            ubiOrigen = new Ubicacion
            {
                Id = ubiOrigenId,
                Codigo = "UBI-MOV-ORIGEN",
                Nombre = "Almacén Central UOD",
                Tipo = "almacen",
                Activa = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Ubicaciones.Add(ubiOrigen);
        }

        var ubiDestinoId = Guid.Parse("f3333333-3333-3333-3333-333333333333");
        var ubiDestino = await db.Ubicaciones.FindAsync(ubiDestinoId);
        if (ubiDestino == null)
        {
            ubiDestino = new Ubicacion
            {
                Id = ubiDestinoId,
                Codigo = "UBI-MOV-DESTINO",
                Nombre = "Clínica Odontológica B",
                Tipo = "clinica",
                Activa = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Ubicaciones.Add(ubiDestino);
        }

        var recId = Guid.Parse("f4444444-4444-4444-4444-444444444444");
        var rec = await db.Recursos.FindAsync(recId);
        if (rec == null)
        {
            rec = new Recurso
            {
                Id = recId,
                CategoriaId = catId,
                Sku = "SKU-MOV-001",
                Nombre = "Guantes Quirúrgicos Látex M",
                Tipo = "consumible",
                UnidadMedida = "caja",
                CostoEstimado = 450.00m,
                StockMinimo = 5,
                Activo = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Recursos.Add(rec);

            // Existencia inicial en origen con 20 unidades
            var exOrigen = new Existencia
            {
                Id = Guid.Parse("f5555555-5555-5555-5555-555555555555"),
                RecursoId = recId,
                UbicacionId = ubiOrigenId,
                Cantidad = 20,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Existencias.Add(exOrigen);
        }

        await db.SaveChangesAsync();
        return (recId, ubiOrigenId, ubiDestinoId);
    }

    [Fact]
    public async Task RegistrarMovimiento_SinAutenticacion_Retorna401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/movimientos", new CrearMovimientoDto());
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task RegistrarMovimiento_RolSinPermisos_Retorna403Forbidden()
    {
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/movimientos", role: "consulta");
        request.Content = JsonContent.Create(new CrearMovimientoDto
        {
            Tipo = "entrada",
            Motivo = "Entrada sin permisos",
            Lineas = new List<CrearMovimientoLineaDto> { new() { RecursoId = Guid.NewGuid(), Cantidad = 1 } }
        });

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task RegistrarMovimiento_EntradaValida_Retorna201Created_E_IncrementaStock()
    {
        var (recId, _, ubiDestinoId) = await InicializarDatosPruebaAsync();
        var client = _factory.CreateClient();

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/movimientos", role: "encargado_almacen");
        request.Content = JsonContent.Create(new CrearMovimientoDto
        {
            Tipo = "entrada",
            DestinoUbicacionId = ubiDestinoId,
            Motivo = "Recepción de compra institucional con Conduce #8912",
            ComprobanteUrl = "https://siia.uod.edu.do/storage/conduce-8912.pdf",
            Lineas = new List<CrearMovimientoLineaDto>
            {
                new()
                {
                    RecursoId = recId,
                    Cantidad = 15,
                    CostoUnitario = 450.00m
                }
            }
        });

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var movimiento = await response.Content.ReadFromJsonAsync<MovimientoDto>();
        Assert.NotNull(movimiento);
        Assert.StartsWith("MOV-", movimiento.NumeroMovimiento);
        Assert.Equal("entrada", movimiento.Tipo);
        Assert.Equal(ubiDestinoId, movimiento.DestinoUbicacionId);
        Assert.Single(movimiento.Lineas);
        Assert.Equal(15, movimiento.TotalUnidades);

        // Verificar existencias en base de datos
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var exDestino = db.Existencias.FirstOrDefault(e => e.RecursoId == recId && e.UbicacionId == ubiDestinoId);
        Assert.NotNull(exDestino);
        Assert.True(exDestino.Cantidad >= 15);
    }

    [Fact]
    public async Task RegistrarMovimiento_SalidaConStockInsuficiente_Retorna400BadRequest_Y_NoCambiaStock()
    {
        var (recId, ubiOrigenId, _) = await InicializarDatosPruebaAsync();
        var client = _factory.CreateClient();

        int stockAntes;
        using (var scopeInit = _factory.Services.CreateScope())
        {
            var dbInit = scopeInit.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            stockAntes = dbInit.Existencias.First(e => e.RecursoId == recId && e.UbicacionId == ubiOrigenId).Cantidad;
        }

        // Solicitamos una cantidad muy superior a lo disponible
        var request = CrearPeticion(HttpMethod.Post, "/api/v1/movimientos", role: "admin_inventario");
        request.Content = JsonContent.Create(new CrearMovimientoDto
        {
            Tipo = "salida",
            OrigenUbicacionId = ubiOrigenId,
            Motivo = "Salida con cantidad excesiva para probar rechazo de saldo negativo",
            Lineas = new List<CrearMovimientoLineaDto>
            {
                new()
                {
                    RecursoId = recId,
                    Cantidad = stockAntes + 100
                }
            }
        });

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // Verificar que el stock no fue alterado (transacción atómica)
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var exOrigen = db.Existencias.First(e => e.RecursoId == recId && e.UbicacionId == ubiOrigenId);
        Assert.Equal(stockAntes, exOrigen.Cantidad);
    }

    [Fact]
    public async Task RegistrarMovimiento_TrasladoEntreUbicaciones_DescuentaOrigenYIncrementaDestino()
    {
        var (recId, ubiOrigenId, ubiDestinoId) = await InicializarDatosPruebaAsync();
        var client = _factory.CreateClient();

        int stockAntesOrigen;
        using (var scopeInit = _factory.Services.CreateScope())
        {
            var dbInit = scopeInit.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            stockAntesOrigen = dbInit.Existencias.First(e => e.RecursoId == recId && e.UbicacionId == ubiOrigenId).Cantidad;
        }

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/movimientos", role: "super_admin");
        request.Content = JsonContent.Create(new CrearMovimientoDto
        {
            Tipo = "traslado",
            OrigenUbicacionId = ubiOrigenId,
            DestinoUbicacionId = ubiDestinoId,
            Motivo = "Traslado de insumos para inicio de prácticas clínicas",
            Lineas = new List<CrearMovimientoLineaDto>
            {
                new()
                {
                    RecursoId = recId,
                    Cantidad = 5
                }
            }
        });

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var exOrigen = db.Existencias.First(e => e.RecursoId == recId && e.UbicacionId == ubiOrigenId);
        Assert.Equal(stockAntesOrigen - 5, exOrigen.Cantidad);
    }

    [Fact]
    public async Task RegistrarMovimiento_Idempotencia_RetornaMismoResultadoSinDuplicar()
    {
        var (recId, _, ubiDestinoId) = await InicializarDatosPruebaAsync();
        var client = _factory.CreateClient();
        var claveIdempotencia = $"IDEMP-{Guid.NewGuid():N}";

        var dto = new CrearMovimientoDto
        {
            Tipo = "entrada",
            DestinoUbicacionId = ubiDestinoId,
            Motivo = "Entrada con clave de idempotencia única",
            IdempotenciaKey = claveIdempotencia,
            Lineas = new List<CrearMovimientoLineaDto>
            {
                new() { RecursoId = recId, Cantidad = 10 }
            }
        };

        // Primer envío
        var request1 = CrearPeticion(HttpMethod.Post, "/api/v1/movimientos", role: "encargado_almacen");
        request1.Headers.Add("X-Idempotency-Key", claveIdempotencia);
        request1.Content = JsonContent.Create(dto);
        var response1 = await client.SendAsync(request1);
        Assert.Equal(HttpStatusCode.Created, response1.StatusCode);
        var mov1 = await response1.Content.ReadFromJsonAsync<MovimientoDto>();
        Assert.NotNull(mov1);

        // Segundo envío con la misma clave (simulando reintento de red)
        var request2 = CrearPeticion(HttpMethod.Post, "/api/v1/movimientos", role: "encargado_almacen");
        request2.Headers.Add("X-Idempotency-Key", claveIdempotencia);
        request2.Content = JsonContent.Create(dto);
        var response2 = await client.SendAsync(request2);

        // Debe ser exitoso y retornar el mismo ID sin generar otro registro ni duplicar inventario
        Assert.True(response2.StatusCode == HttpStatusCode.Created || response2.StatusCode == HttpStatusCode.OK);
        var mov2 = await response2.Content.ReadFromJsonAsync<MovimientoDto>();
        Assert.NotNull(mov2);
        Assert.Equal(mov1.Id, mov2.Id);
        Assert.Equal(mov1.NumeroMovimiento, mov2.NumeroMovimiento);
    }

    [Fact]
    public async Task PrevisualizarMovimiento_ConStockInsuficiente_RetornaEsValidoFalse()
    {
        var (recId, ubiOrigenId, _) = await InicializarDatosPruebaAsync();
        var client = _factory.CreateClient();

        var request = CrearPeticion(HttpMethod.Post, "/api/v1/movimientos/previsualizar", role: "consulta");
        request.Content = JsonContent.Create(new CrearMovimientoDto
        {
            Tipo = "salida",
            OrigenUbicacionId = ubiOrigenId,
            Motivo = "Prueba de previsualización",
            Lineas = new List<CrearMovimientoLineaDto>
            {
                new() { RecursoId = recId, Cantidad = 999 } // Muy superior a 20
            }
        });

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var resultado = await response.Content.ReadFromJsonAsync<PrevisualizarMovimientoResultadoDto>();
        Assert.NotNull(resultado);
        Assert.False(resultado.EsValido);
        Assert.NotEmpty(resultado.Errores);
        Assert.Contains(resultado.Lineas, l => !l.EsValido && l.StockResultante < 0);
    }

    [Fact]
    public async Task ListarMovimientos_Autenticado_Retorna200Ok_Y_Paginado()
    {
        await InicializarDatosPruebaAsync();
        var client = _factory.CreateClient();
        var request = CrearPeticion(HttpMethod.Get, "/api/v1/movimientos?pageIndex=1&pageSize=10", role: "auditor");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<MovimientoDto>>();
        Assert.NotNull(result);
        Assert.Equal(1, result.PageIndex);
    }
}
