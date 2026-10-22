using Microsoft.AspNetCore.Mvc;
using SistemaUOD.Application.Common.Interfaces;
using SistemaUOD.Application.Common.Security;
using SistemaUOD.Application.DTOs;

namespace SistemaUOD.Api.Endpoints;

public static class ComprasEndpoints
{
    public static IEndpointRouteBuilder MapComprasEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/compras")
            .WithTags("Compras y Recepción")
            .RequireAuthorization();

        // 1. Listar órdenes de compra con filtros y paginación
        group.MapGet("/ordenes", async (
            [FromQuery] string? busqueda,
            [FromQuery] string? estado,
            [FromQuery] Guid? proveedorId,
            [FromQuery] DateOnly? fechaDesde,
            [FromQuery] DateOnly? fechaHasta,
            [FromQuery] int page,
            [FromQuery] int pageSize,
            ICompraService compraService,
            CancellationToken ct) =>
        {
            var filtros = new OrdenCompraFiltrosDto
            {
                Busqueda = busqueda,
                Estado = estado,
                ProveedorId = proveedorId,
                FechaDesde = fechaDesde,
                FechaHasta = fechaHasta,
                Page = page <= 0 ? 1 : page,
                PageSize = pageSize <= 0 ? 20 : pageSize
            };

            var resultado = await compraService.ListarOrdenesAsync(filtros, ct);
            return Results.Ok(resultado);
        })
        .WithName("ListarOrdenesCompra")
        .WithSummary("Lista órdenes de compra institucionales con filtros combinables y paginación");

        // 2. Obtener detalle de orden de compra por ID
        group.MapGet("/ordenes/{id:guid}", async (
            Guid id,
            ICompraService compraService,
            CancellationToken ct) =>
        {
            var orden = await compraService.ObtenerPorIdAsync(id, ct);
            if (orden == null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Orden de compra no encontrada",
                    detail: $"No existe una orden de compra con el identificador '{id}'.");
            }

            return Results.Ok(orden);
        })
        .WithName("ObtenerOrdenCompraPorId")
        .WithSummary("Obtiene los datos detallados y líneas de una orden de compra por su ID");

        // 3. Crear orden de compra (Borrador)
        group.MapPost("/ordenes", async (
            [FromBody] CrearOrdenCompraDto dto,
            ICompraService compraService,
            ICurrentUserService currentUserService,
            CancellationToken ct) =>
        {
            var usuarioId = currentUserService.UserId;
            if (!usuarioId.HasValue)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuario no autenticado",
                    detail: "No se pudo identificar al usuario que crea la orden de compra.");
            }

            try
            {
                var resultado = await compraService.CrearOrdenAsync(dto, usuarioId.Value, ct);
                return Results.Created($"/api/v1/compras/ordenes/{resultado.Id}", resultado);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Solicitud de orden inválida",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("CrearOrdenCompra")
        .WithSummary("Crea una nueva orden de compra en estado borrador");

        // 4. Actualizar orden de compra (Solo borrador)
        group.MapPut("/ordenes/{id:guid}", async (
            Guid id,
            [FromBody] ActualizarOrdenCompraDto dto,
            ICompraService compraService,
            ICurrentUserService currentUserService,
            CancellationToken ct) =>
        {
            var usuarioId = currentUserService.UserId;
            if (!usuarioId.HasValue)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuario no autenticado",
                    detail: "No se pudo identificar al usuario.");
            }

            try
            {
                var resultado = await compraService.ActualizarOrdenAsync(id, dto, usuarioId.Value, ct);
                return Results.Ok(resultado);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Orden no encontrada",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Actualización no permitida",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("ActualizarOrdenCompra")
        .WithSummary("Actualiza los datos y líneas de una orden de compra en estado borrador");

        // 5. Cambiar estado de orden de compra (Aprobar, Enviar, Cancelar)
        group.MapPatch("/ordenes/{id:guid}/estado", async (
            Guid id,
            [FromBody] CambiarEstadoOrdenDto dto,
            ICompraService compraService,
            ICurrentUserService currentUserService,
            CancellationToken ct) =>
        {
            var usuarioId = currentUserService.UserId;
            if (!usuarioId.HasValue)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuario no autenticado",
                    detail: "No se pudo identificar al usuario.");
            }

            try
            {
                var resultado = await compraService.CambiarEstadoAsync(id, dto, usuarioId.Value, ct);
                return Results.Ok(resultado);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Orden no encontrada",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Transición de estado inválida",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("CambiarEstadoOrdenCompra")
        .WithSummary("Transiciona el estado de una orden de compra (aprobada, enviada, cancelada)");

        // 6. Recepción de mercancía (parcial o total con entrada a inventario)
        group.MapPost("/ordenes/{id:guid}/recepcion", async (
            Guid id,
            [FromBody] RecepcionCompraDto dto,
            ICompraService compraService,
            ICurrentUserService currentUserService,
            CancellationToken ct) =>
        {
            var usuarioId = currentUserService.UserId;
            if (!usuarioId.HasValue)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Usuario no autenticado",
                    detail: "No se pudo identificar al usuario que recibe la mercancía.");
            }

            try
            {
                var resultado = await compraService.RecibirOrdenAsync(id, dto, usuarioId.Value, ct);
                return Results.Ok(resultado);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Orden no encontrada",
                    detail: ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Error en la recepción de mercancía",
                    detail: ex.Message);
            }
        })
        .RequireAuthorization(Policies.ExigirOperacionAlmacen)
        .WithName("RecibirMercanciaOrdenCompra")
        .WithSummary("Registra la recepción parcial o total de insumos, generando entrada automática a inventario");

        // 7. Sugerencias de reorden desde stock bajo
        group.MapGet("/sugerencias-stock-bajo", async (
            [FromQuery] Guid? proveedorId,
            ICompraService compraService,
            CancellationToken ct) =>
        {
            var resultado = await compraService.ObtenerSugerenciasStockBajoAsync(proveedorId, ct);
            return Results.Ok(resultado);
        })
        .RequireAuthorization(Policies.ExigirGestionInventario)
        .WithName("ObtenerSugerenciasStockBajo")
        .WithSummary("Obtiene sugerencias automáticas de adquisición de insumos basadas en el punto de reorden institucional");

        return app;
    }
}
