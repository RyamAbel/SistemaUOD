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

public class ComprasEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public ComprasEndpointsTests(CustomWebApplicationFactory factory)
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

    private async Task<(Guid ProveedorId, Guid RecursoId, Guid UbicacionId)> ObtenerEntidadesPruebaAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var proveedor = await db.Proveedores.FirstOrDefaultAsync(p => p.Activo);
        if (proveedor == null)
        {
            proveedor = new Proveedor
            {
                Id = Guid.NewGuid(),
                Rnc = "131889999",
                NombreComercial = "Suministros Odontológicos del Caribe",
                Activo = true
            };
            db.Proveedores.Add(proveedor);
            await db.SaveChangesAsync();
        }

        var recurso = await db.Recursos.FirstOrDefaultAsync(r => r.Activo);
        if (recurso == null)
        {
            var categoria = await db.Categorias.FirstAsync();
            recurso = new Recurso
            {
                Id = Guid.NewGuid(),
                Sku = "PRUEBA-OC-001",
                Nombre = "Resina Compuesta A2",
                CategoriaId = categoria.Id,
                CostoEstimado = 750.00m,
                StockMinimo = 5,
                Activo = true
            };
            db.Recursos.Add(recurso);
            await db.SaveChangesAsync();
        }

        var ubicacion = await db.Ubicaciones.FirstOrDefaultAsync(u => u.Activa);
        if (ubicacion == null)
        {
            ubicacion = new Ubicacion
            {
                Id = Guid.NewGuid(),
                Codigo = "ALM-TEST",
                Nombre = "Almacén Central Pruebas",
                Activa = true
            };
            db.Ubicaciones.Add(ubicacion);
            await db.SaveChangesAsync();
        }

        return (proveedor.Id, recurso.Id, ubicacion.Id);
    }

    [Fact]
    public async Task ListarOrdenesCompra_Autenticado_RetornaOkConPaginacion()
    {
        var client = _factory.CreateClient();
        var req = CrearPeticion(HttpMethod.Get, "/api/v1/compras/ordenes?page=1&pageSize=10", role: "consulta");

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var resultado = await response.Content.ReadFromJsonAsync<PagedResult<OrdenCompraDto>>(JsonOptions);
        Assert.NotNull(resultado);
        Assert.NotNull(resultado.Items);
    }

    [Fact]
    public async Task CrearOrdenCompra_DatosValidos_RetornaCreatedYCorrelativoOC()
    {
        var (proveedorId, recursoId, _) = await ObtenerEntidadesPruebaAsync();
        var client = _factory.CreateClient();

        var nuevoDto = new CrearOrdenCompraDto
        {
            ProveedorId = proveedorId,
            FechaEntregaEstimada = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
            Observaciones = "Adquisición de prueba institucional",
            Lineas = new List<CrearOrdenCompraLineaDto>
            {
                new()
                {
                    RecursoId = recursoId,
                    CantidadSolicitada = 15,
                    PrecioUnitarioEstimado = 800.00m
                }
            }
        };

        var req = CrearPeticion(HttpMethod.Post, "/api/v1/compras/ordenes", role: RolesUsuario.AdminInventario);
        req.Content = JsonContent.Create(nuevoDto);

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var creado = await response.Content.ReadFromJsonAsync<OrdenCompraDto>(JsonOptions);
        Assert.NotNull(creado);
        Assert.StartsWith("OC-", creado.NumeroOrden);
        Assert.Equal("borrador", creado.Estado);
        Assert.Single(creado.Lineas);
        Assert.Equal(15, creado.Lineas[0].CantidadSolicitada);
        Assert.Equal(12000.00m, creado.TotalEstimado);
    }

    [Fact]
    public async Task CrearOrdenCompra_SinPermisoGestion_RetornaForbidden()
    {
        var (proveedorId, recursoId, _) = await ObtenerEntidadesPruebaAsync();
        var client = _factory.CreateClient();

        var nuevoDto = new CrearOrdenCompraDto
        {
            ProveedorId = proveedorId,
            Lineas = new List<CrearOrdenCompraLineaDto>
            {
                new() { RecursoId = recursoId, CantidadSolicitada = 5, PrecioUnitarioEstimado = 100 }
            }
        };

        var req = CrearPeticion(HttpMethod.Post, "/api/v1/compras/ordenes", role: "consulta");
        req.Content = JsonContent.Create(nuevoDto);

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CambiarEstado_BorradorAAprobadaYEnviada_RetornaOk()
    {
        var (proveedorId, recursoId, _) = await ObtenerEntidadesPruebaAsync();
        var client = _factory.CreateClient();

        // 1. Crear orden
        var crearDto = new CrearOrdenCompraDto
        {
            ProveedorId = proveedorId,
            Lineas = new List<CrearOrdenCompraLineaDto>
            {
                new() { RecursoId = recursoId, CantidadSolicitada = 10, PrecioUnitarioEstimado = 500 }
            }
        };

        var reqCrear = CrearPeticion(HttpMethod.Post, "/api/v1/compras/ordenes", role: "super_admin");
        reqCrear.Content = JsonContent.Create(crearDto);
        var resCrear = await client.SendAsync(reqCrear);
        var orden = await resCrear.Content.ReadFromJsonAsync<OrdenCompraDto>(JsonOptions);
        Assert.NotNull(orden);

        // 2. Aprobar orden
        var reqAprobar = CrearPeticion(HttpMethod.Patch, $"/api/v1/compras/ordenes/{orden.Id}/estado", role: RolesUsuario.AdminInventario);
        reqAprobar.Content = JsonContent.Create(new CambiarEstadoOrdenDto { Estado = "aprobada", Observaciones = "Aprobada por dirección" });
        var resAprobar = await client.SendAsync(reqAprobar);
        Assert.Equal(HttpStatusCode.OK, resAprobar.StatusCode);
        var ordenAprobada = await resAprobar.Content.ReadFromJsonAsync<OrdenCompraDto>(JsonOptions);
        Assert.Equal("aprobada", ordenAprobada!.Estado);

        // 3. Enviar orden a proveedor
        var reqEnviar = CrearPeticion(HttpMethod.Patch, $"/api/v1/compras/ordenes/{orden.Id}/estado", role: RolesUsuario.AdminInventario);
        reqEnviar.Content = JsonContent.Create(new CambiarEstadoOrdenDto { Estado = "enviada", Observaciones = "Remitida por correo a proveedor" });
        var resEnviar = await client.SendAsync(reqEnviar);
        Assert.Equal(HttpStatusCode.OK, resEnviar.StatusCode);
        var ordenEnviada = await resEnviar.Content.ReadFromJsonAsync<OrdenCompraDto>(JsonOptions);
        Assert.Equal("enviada", ordenEnviada!.Estado);
    }

    [Fact]
    public async Task RecibirMercancia_ParcialYTotal_ActualizaStockYEstados()
    {
        var (proveedorId, recursoId, ubicacionId) = await ObtenerEntidadesPruebaAsync();
        var client = _factory.CreateClient();

        // 1. Crear y aprobar orden de 20 unidades
        var crearDto = new CrearOrdenCompraDto
        {
            ProveedorId = proveedorId,
            Lineas = new List<CrearOrdenCompraLineaDto>
            {
                new() { RecursoId = recursoId, CantidadSolicitada = 20, PrecioUnitarioEstimado = 400.00m }
            }
        };

        var reqCrear = CrearPeticion(HttpMethod.Post, "/api/v1/compras/ordenes", role: RolesUsuario.AdminInventario);
        reqCrear.Content = JsonContent.Create(crearDto);
        var resCrear = await client.SendAsync(reqCrear);
        var orden = await resCrear.Content.ReadFromJsonAsync<OrdenCompraDto>(JsonOptions);
        Assert.NotNull(orden);

        var reqAprobar = CrearPeticion(HttpMethod.Patch, $"/api/v1/compras/ordenes/{orden.Id}/estado", role: RolesUsuario.AdminInventario);
        reqAprobar.Content = JsonContent.Create(new CambiarEstadoOrdenDto { Estado = "aprobada" });
        await client.SendAsync(reqAprobar);

        // 2. Recepción parcial de 8 unidades
        var recepcionParcial = new RecepcionCompraDto
        {
            UbicacionRecepcionId = ubicacionId,
            ConduceOReferencia = "COND-2026-001",
            Observaciones = "Primera entrega parcial",
            Lineas = new List<RecepcionLineaDto>
            {
                new()
                {
                    LineaId = orden.Lineas[0].Id,
                    CantidadRecibida = 8,
                    NumeroLote = "LOT-UOD-2026-01",
                    FechaVencimiento = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(18))
                }
            }
        };

        var reqRec1 = CrearPeticion(HttpMethod.Post, $"/api/v1/compras/ordenes/{orden.Id}/recepcion", role: RolesUsuario.EncargadoAlmacen);
        reqRec1.Content = JsonContent.Create(recepcionParcial);
        var resRec1 = await client.SendAsync(reqRec1);
        Assert.Equal(HttpStatusCode.OK, resRec1.StatusCode);
        var ordenParcial = await resRec1.Content.ReadFromJsonAsync<OrdenCompraDto>(JsonOptions);
        Assert.NotNull(ordenParcial);
        Assert.Equal("recibida_parcial", ordenParcial.Estado);
        Assert.Equal(8, ordenParcial.TotalUnidadesRecibidas);
        Assert.Equal(12, ordenParcial.Lineas[0].CantidadPendiente);

        // 3. Recepción restante de 12 unidades -> pasa a recibida_total
        var recepcionFinal = new RecepcionCompraDto
        {
            UbicacionRecepcionId = ubicacionId,
            ConduceOReferencia = "COND-2026-002",
            Observaciones = "Segunda entrega y completado",
            Lineas = new List<RecepcionLineaDto>
            {
                new()
                {
                    LineaId = orden.Lineas[0].Id,
                    CantidadRecibida = 12,
                    NumeroLote = "LOT-UOD-2026-02",
                    FechaVencimiento = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(24))
                }
            }
        };

        var reqRec2 = CrearPeticion(HttpMethod.Post, $"/api/v1/compras/ordenes/{orden.Id}/recepcion", role: RolesUsuario.EncargadoAlmacen);
        reqRec2.Content = JsonContent.Create(recepcionFinal);
        var resRec2 = await client.SendAsync(reqRec2);
        Assert.Equal(HttpStatusCode.OK, resRec2.StatusCode);
        var ordenTotal = await resRec2.Content.ReadFromJsonAsync<OrdenCompraDto>(JsonOptions);
        Assert.NotNull(ordenTotal);
        Assert.Equal("recibida_total", ordenTotal.Estado);
        Assert.Equal(20, ordenTotal.TotalUnidadesRecibidas);
        Assert.Equal(0, ordenTotal.Lineas[0].CantidadPendiente);
    }

    [Fact]
    public async Task RecibirMercancia_ExcedeCantidadPendiente_RetornaBadRequest()
    {
        var (proveedorId, recursoId, ubicacionId) = await ObtenerEntidadesPruebaAsync();
        var client = _factory.CreateClient();

        // 1. Crear y aprobar orden de 10 unidades
        var crearDto = new CrearOrdenCompraDto
        {
            ProveedorId = proveedorId,
            Lineas = new List<CrearOrdenCompraLineaDto>
            {
                new() { RecursoId = recursoId, CantidadSolicitada = 10, PrecioUnitarioEstimado = 300 }
            }
        };

        var reqCrear = CrearPeticion(HttpMethod.Post, "/api/v1/compras/ordenes", role: RolesUsuario.AdminInventario);
        reqCrear.Content = JsonContent.Create(crearDto);
        var resCrear = await client.SendAsync(reqCrear);
        var orden = await resCrear.Content.ReadFromJsonAsync<OrdenCompraDto>(JsonOptions);
        Assert.NotNull(orden);

        var reqAprobar = CrearPeticion(HttpMethod.Patch, $"/api/v1/compras/ordenes/{orden.Id}/estado", role: RolesUsuario.AdminInventario);
        reqAprobar.Content = JsonContent.Create(new CambiarEstadoOrdenDto { Estado = "aprobada" });
        await client.SendAsync(reqAprobar);

        // 2. Intentar recibir 15 unidades cuando solo se pidieron 10
        var recepcionExcesiva = new RecepcionCompraDto
        {
            UbicacionRecepcionId = ubicacionId,
            Lineas = new List<RecepcionLineaDto>
            {
                new() { LineaId = orden.Lineas[0].Id, CantidadRecibida = 15 }
            }
        };

        var reqRec = CrearPeticion(HttpMethod.Post, $"/api/v1/compras/ordenes/{orden.Id}/recepcion", role: RolesUsuario.EncargadoAlmacen);
        reqRec.Content = JsonContent.Create(recepcionExcesiva);
        var resRec = await client.SendAsync(reqRec);

        Assert.Equal(HttpStatusCode.BadRequest, resRec.StatusCode);
    }

    [Fact]
    public async Task ObtenerSugerenciasStockBajo_Autenticado_RetornaOkConLista()
    {
        var client = _factory.CreateClient();
        var req = CrearPeticion(HttpMethod.Get, "/api/v1/compras/sugerencias-stock-bajo", role: RolesUsuario.AdminInventario);

        var response = await client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var sugerencias = await response.Content.ReadFromJsonAsync<List<SugerenciaOrdenStockBajoDto>>(JsonOptions);
        Assert.NotNull(sugerencias);
    }
}
