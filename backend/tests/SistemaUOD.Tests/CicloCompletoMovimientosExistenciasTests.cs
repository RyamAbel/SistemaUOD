using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SistemaUOD.Application.Common.Models;
using SistemaUOD.Application.DTOs;
using SistemaUOD.Domain.Entities;
using SistemaUOD.Domain.Enums;
using SistemaUOD.Infrastructure.Data;
using Xunit;

namespace SistemaUOD.Tests;

/// <summary>
/// Pruebas de integración de ciclo completo (End-to-End) para la Etapa 7:
/// Ubicaciones, Existencias y Movimientos Transaccionales (Prompt 7.6).
/// Valida la consistencia atómica, prevención de saldos negativos, reglas RF-12 e idempotencia.
/// </summary>
public class CicloCompletoMovimientosExistenciasTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CicloCompletoMovimientosExistenciasTests(CustomWebApplicationFactory factory)
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

    private async Task<(Guid recursoId, Guid ubiCentralId, Guid ubiClinicaId)> PrepararDatosBaseAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var testUserId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        var usuario = await db.Perfiles.FindAsync(testUserId);
        if (usuario == null)
        {
            usuario = new Perfil
            {
                Id = testUserId,
                Correo = "operador.e2e@uod.edu.do",
                NombreCompleto = "Operador E2E Transaccional",
                Rol = "admin_inventario",
                Activo = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };
            db.Perfiles.Add(usuario);
        }

        var catId = Guid.NewGuid();
        var categoria = new Categoria
        {
            Id = catId,
            Codigo = $"CAT-{Guid.NewGuid():N}"[..8].ToUpper(),
            Nombre = "Materiales Clínicos E2E",
            Activa = true,
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };
        db.Categorias.Add(categoria);

        var recId = Guid.NewGuid();
        var recurso = new Recurso
        {
            Id = recId,
            Sku = $"MAT-{Guid.NewGuid():N}"[..8].ToUpper(),
            Nombre = "Guantes de Nitrilo E2E",
            CategoriaId = catId,
            Tipo = "consumible",
            UnidadMedida = "cajas",
            StockMinimo = 15,
            PuntoReorden = 25,
            StockMaximo = 100,
            CostoEstimado = 450.00m,
            Activo = true,
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };
        db.Recursos.Add(recurso);

        var ubiCentralId = Guid.NewGuid();
        var ubiCentral = new Ubicacion
        {
            Id = ubiCentralId,
            Codigo = $"ALM-{Guid.NewGuid():N}"[..8].ToUpper(),
            Nombre = "Almacén Central E2E",
            Tipo = "almacen_general",
            Activa = true,
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };
        db.Ubicaciones.Add(ubiCentral);

        var ubiClinicaId = Guid.NewGuid();
        var ubiClinica = new Ubicacion
        {
            Id = ubiClinicaId,
            Codigo = $"CLN-{Guid.NewGuid():N}"[..8].ToUpper(),
            Nombre = "Clínica Odontológica B E2E",
            Tipo = "clinica_odontologica",
            Activa = true,
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };
        db.Ubicaciones.Add(ubiClinica);

        await db.SaveChangesAsync();

        return (recId, ubiCentralId, ubiClinicaId);
    }

    [Fact]
    public async Task CicloCompleto_Entrada_Traslado_Salida_ConsistenciaAtómica()
    {
        var (recId, ubiCentralId, ubiClinicaId) = await PrepararDatosBaseAsync();
        var client = _factory.CreateClient();

        // -------------------------------------------------------------
        // FASE 1: Comprobar estado inicial (Sin existencias => Agotado)
        // -------------------------------------------------------------
        var reqInicial = CrearPeticion(HttpMethod.Get, $"/api/v1/existencias/recurso/{recId}", "consulta");
        var resInicial = await client.SendAsync(reqInicial);
        Assert.Equal(HttpStatusCode.OK, resInicial.StatusCode);
        var dtoInicial = await resInicial.Content.ReadFromJsonAsync<ResumenStockRecursoDto>();
        Assert.NotNull(dtoInicial);
        Assert.Equal(0, dtoInicial.StockTotal);
        Assert.Equal("agotado", dtoInicial.EstadoStock);

        // -------------------------------------------------------------
        // FASE 2: Entrada inicial de 50 unidades en Almacén Central
        // -------------------------------------------------------------
        var reqEntrada = CrearPeticion(HttpMethod.Post, "/api/v1/movimientos", "admin_inventario");
        reqEntrada.Content = JsonContent.Create(new CrearMovimientoDto
        {
            Tipo = "entrada",
            DestinoUbicacionId = ubiCentralId,
            Motivo = "Recepción de compra inicial de 50 cajas",
            Lineas = new List<CrearMovimientoLineaDto>
            {
                new() { RecursoId = recId, Cantidad = 50, CostoUnitario = 450.00m }
            }
        });

        var resEntrada = await client.SendAsync(reqEntrada);
        Assert.Equal(HttpStatusCode.Created, resEntrada.StatusCode);
        var movEntrada = await resEntrada.Content.ReadFromJsonAsync<MovimientoDto>();
        Assert.NotNull(movEntrada);
        Assert.StartsWith("MOV-", movEntrada.NumeroMovimiento);
        Assert.Equal(50, movEntrada.TotalUnidades);

        // Validar que el stock ahora sea 50 y estado 'normal' (50 > StockMinimo 15 y > PuntoReorden 25)
        var reqStockPostEntrada = CrearPeticion(HttpMethod.Get, $"/api/v1/existencias/recurso/{recId}", "consulta");
        var resStockPostEntrada = await client.SendAsync(reqStockPostEntrada);
        var dtoPostEntrada = await resStockPostEntrada.Content.ReadFromJsonAsync<ResumenStockRecursoDto>();
        Assert.NotNull(dtoPostEntrada);
        Assert.Equal(50, dtoPostEntrada.StockTotal);
        Assert.Equal("normal", dtoPostEntrada.EstadoStock);

        // -------------------------------------------------------------
        // FASE 3: Traslado atómico de 20 unidades desde Almacén Central a Clínica B
        // -------------------------------------------------------------
        var reqTraslado = CrearPeticion(HttpMethod.Post, "/api/v1/movimientos", "encargado_almacen");
        reqTraslado.Content = JsonContent.Create(new CrearMovimientoDto
        {
            Tipo = "traslado",
            OrigenUbicacionId = ubiCentralId,
            DestinoUbicacionId = ubiClinicaId,
            Motivo = "Suministro para prácticas clínicas de odontología",
            Lineas = new List<CrearMovimientoLineaDto>
            {
                new() { RecursoId = recId, Cantidad = 20, CostoUnitario = 450.00m }
            }
        });

        var resTraslado = await client.SendAsync(reqTraslado);
        Assert.Equal(HttpStatusCode.Created, resTraslado.StatusCode);

        // Verificar existencias detalladas por ubicación
        var reqDetalladas = CrearPeticion(HttpMethod.Get, $"/api/v1/existencias/detalladas?recursoId={recId}", "consulta");
        var resDetalladas = await client.SendAsync(reqDetalladas);
        var detalladas = await resDetalladas.Content.ReadFromJsonAsync<List<ExistenciaDto>>();
        Assert.NotNull(detalladas);

        var existCentral = detalladas.FirstOrDefault(e => e.UbicacionId == ubiCentralId);
        var existClinica = detalladas.FirstOrDefault(e => e.UbicacionId == ubiClinicaId);

        Assert.NotNull(existCentral);
        Assert.NotNull(existClinica);
        Assert.Equal(30, existCentral.CantidadDisponible); // 50 - 20 = 30
        Assert.Equal(20, existClinica.CantidadDisponible); // 0 + 20 = 20

        // El stock global total debe seguir siendo 50 (conservación de masa)
        var totalExistencias = detalladas.Sum(d => d.CantidadDisponible);
        Assert.Equal(50, totalExistencias);

        // -------------------------------------------------------------
        // FASE 4: Salida / Consumo clínico de 20 unidades en Clínica B (dejándola en 0)
        // -------------------------------------------------------------
        var reqSalida = CrearPeticion(HttpMethod.Post, "/api/v1/movimientos", "encargado_almacen");
        reqSalida.Content = JsonContent.Create(new CrearMovimientoDto
        {
            Tipo = "salida",
            OrigenUbicacionId = ubiClinicaId,
            Motivo = "Consumo completo en jornada de operatoria dental",
            Lineas = new List<CrearMovimientoLineaDto>
            {
                new() { RecursoId = recId, Cantidad = 20, CostoUnitario = 450.00m }
            }
        });

        var resSalida = await client.SendAsync(reqSalida);
        Assert.Equal(HttpStatusCode.Created, resSalida.StatusCode);

        // -------------------------------------------------------------
        // FASE 5: Intento de Salida con Saldo Insuficiente (Anti-stock negativo)
        // Intentar sacar 1 unidad adicional de Clínica B cuando ya tiene 0
        // -------------------------------------------------------------
        var reqSalidaInvalida = CrearPeticion(HttpMethod.Post, "/api/v1/movimientos", "encargado_almacen");
        reqSalidaInvalida.Content = JsonContent.Create(new CrearMovimientoDto
        {
            Tipo = "salida",
            OrigenUbicacionId = ubiClinicaId,
            Motivo = "Intento ilegal de salida sin saldo",
            Lineas = new List<CrearMovimientoLineaDto>
            {
                new() { RecursoId = recId, Cantidad = 1, CostoUnitario = 450.00m }
            }
        });

        var resSalidaInvalida = await client.SendAsync(reqSalidaInvalida);
        Assert.Equal(HttpStatusCode.BadRequest, resSalidaInvalida.StatusCode);

        // -------------------------------------------------------------
        // FASE 6: Idempotencia Transaccional con X-Idempotency-Key
        // -------------------------------------------------------------
        var idempotencyKey = $"IDEM-{Guid.NewGuid():N}";
        var payloadIdem = new CrearMovimientoDto
        {
            Tipo = "salida",
            OrigenUbicacionId = ubiCentralId,
            Motivo = "Salida con clave de idempotencia de prueba",
            Lineas = new List<CrearMovimientoLineaDto>
            {
                new() { RecursoId = recId, Cantidad = 5, CostoUnitario = 450.00m }
            }
        };

        // Primer envío con clave
        var reqIdem1 = CrearPeticion(HttpMethod.Post, "/api/v1/movimientos", "admin_inventario");
        reqIdem1.Headers.Add("X-Idempotency-Key", idempotencyKey);
        reqIdem1.Content = JsonContent.Create(payloadIdem);
        var resIdem1 = await client.SendAsync(reqIdem1);
        Assert.Equal(HttpStatusCode.Created, resIdem1.StatusCode);
        var mov1 = await resIdem1.Content.ReadFromJsonAsync<MovimientoDto>();

        // Reintento idéntico con la misma clave
        var reqIdem2 = CrearPeticion(HttpMethod.Post, "/api/v1/movimientos", "admin_inventario");
        reqIdem2.Headers.Add("X-Idempotency-Key", idempotencyKey);
        reqIdem2.Content = JsonContent.Create(payloadIdem);
        var resIdem2 = await client.SendAsync(reqIdem2);
        Assert.Equal(HttpStatusCode.Created, resIdem2.StatusCode);
        var mov2 = await resIdem2.Content.ReadFromJsonAsync<MovimientoDto>();

        // Ambos retornos deben corresponder exactamente al mismo correlativo sin duplicar el descuento de inventario
        Assert.NotNull(mov1);
        Assert.NotNull(mov2);
        Assert.Equal(mov1.NumeroMovimiento, mov2.NumeroMovimiento);
        Assert.Equal(mov1.Id, mov2.Id);

        // En Almacén Central debían quedar 30 - 5 = 25 unidades (y NO 20 unidades)
        var reqStockFinal = CrearPeticion(HttpMethod.Get, $"/api/v1/existencias/recurso/{recId}", "consulta");
        var resStockFinal = await client.SendAsync(reqStockFinal);
        var dtoFinal = await resStockFinal.Content.ReadFromJsonAsync<ResumenStockRecursoDto>();
        Assert.NotNull(dtoFinal);
        Assert.Equal(25, dtoFinal.StockTotal); // 50 inicial - 20 traslado - 5 salida idempotente = 25

        // Con 25 unidades y PuntoReorden = 25, la regla RF-12 debe clasificarlo en 'reorden'
        Assert.Equal("reorden", dtoFinal.EstadoStock);
        Assert.True(dtoFinal.RequiereReorden);
    }
}
