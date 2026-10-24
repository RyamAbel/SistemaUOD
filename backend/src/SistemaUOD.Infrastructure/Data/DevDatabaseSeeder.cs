using Microsoft.EntityFrameworkCore;
using SistemaUOD.Domain.Entities;
using SistemaUOD.Domain.Enums;

namespace SistemaUOD.Infrastructure.Data;

public static class DevDatabaseSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Solo sembrar si se está usando el proveedor InMemory y la base de datos está vacía
        if (!context.Database.IsInMemory() || await context.Categorias.AnyAsync())
        {
            return;
        }

        // 1. Perfil Super Admin
        var adminId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var adminPerfil = new Perfil
        {
            Id = adminId,
            Correo = "admin@uod.edu.do",
            NombreCompleto = "Administrador UOD",
            Rol = RolesUsuario.SuperAdmin,
            Departamento = "Tecnología e Inventario",
            Telefono = "(809) 555-0100",
            Activo = true,
            CreadoEn = DateTime.UtcNow,
            ActualizadoEn = DateTime.UtcNow
        };
        context.Perfiles.Add(adminPerfil);

        // 2. Categorías Oficiales de TI e Inventario Institucional UOD
        var catComputacion = new Categoria
        {
            Id = Guid.Parse("a1000000-0000-0000-0000-000000000001"),
            Codigo = "CAT-COMP",
            Nombre = "Computación y Equipos",
            Descripcion = "Computadoras de escritorio, servidores y laptops portátiles institucionales",
            Activa = true
        };
        var catPantallas = new Categoria
        {
            Id = Guid.Parse("a1000000-0000-0000-0000-000000000002"),
            Codigo = "CAT-MON",
            Nombre = "Pantallas y Monitores",
            Descripcion = "Monitores de trabajo clínico y administrativo de 22\", 24\" y 27\"",
            Activa = true
        };
        var catPerifericos = new Categoria
        {
            Id = Guid.Parse("a1000000-0000-0000-0000-000000000003"),
            Codigo = "CAT-PER",
            Nombre = "Periféricos y Accesorios",
            Descripcion = "Teclados, mouse, cámaras web, micrófonos, bocinas y headsets",
            Activa = true
        };
        var catImpresion = new Categoria
        {
            Id = Guid.Parse("a1000000-0000-0000-0000-000000000004"),
            Codigo = "CAT-IMP",
            Nombre = "Impresión y Digitalización",
            Descripcion = "Impresoras multifuncionales y de red institucionales",
            Activa = true
        };
        var catUps = new Categoria
        {
            Id = Guid.Parse("a1000000-0000-0000-0000-000000000005"),
            Codigo = "CAT-UPS",
            Nombre = "Energía y Respaldo (UPS)",
            Descripcion = "Sistemas de energía ininterrumpida y protección eléctrica",
            Activa = true
        };
        var catRedes = new Categoria
        {
            Id = Guid.Parse("a1000000-0000-0000-0000-000000000006"),
            Codigo = "CAT-RED",
            Nombre = "Redes y Telecomunicaciones",
            Descripcion = "Teléfonos IP, smartphones institucionales y switches de conectividad",
            Activa = true
        };
        var catAudiovisual = new Categoria
        {
            Id = Guid.Parse("a1000000-0000-0000-0000-000000000007"),
            Codigo = "CAT-AUD",
            Nombre = "Audiovisual y Multimedia",
            Descripcion = "Televisores y pizarras digitales interactivas para docencia y salones",
            Activa = true
        };

        context.Categorias.AddRange(catComputacion, catPantallas, catPerifericos, catImpresion, catUps, catRedes, catAudiovisual);

        // 3. Ubicaciones Oficiales UOD (Solamente nombres existentes en la base de datos original)
        var ubicRectoria = new Ubicacion
        {
            Id = Guid.Parse("b1000000-0000-0000-0000-000000000033"),
            Codigo = "UB-33",
            Nombre = "RECTORIA",
            Tipo = "sede",
            ResponsableId = adminId,
            Activa = true
        };
        var ubicTecnologia = new Ubicacion
        {
            Id = Guid.Parse("b1000000-0000-0000-0000-000000000045"),
            UbicacionPadreId = ubicRectoria.Id,
            Codigo = "UB-45",
            Nombre = "TECNOLOGIA",
            Tipo = "almacen",
            ResponsableId = adminId,
            Activa = true
        };
        var ubicLabComputo = new Ubicacion
        {
            Id = Guid.Parse("b1000000-0000-0000-0000-000000000029"),
            UbicacionPadreId = ubicRectoria.Id,
            Codigo = "UB-29",
            Nombre = "LABORATORIO COMPUTO",
            Tipo = "laboratorio",
            ResponsableId = adminId,
            Activa = true
        };
        var ubicClinicaB = new Ubicacion
        {
            Id = Guid.Parse("b1000000-0000-0000-0000-000000000012"),
            UbicacionPadreId = ubicRectoria.Id,
            Codigo = "UB-12",
            Nombre = "CLINICA B MATERIALES",
            Tipo = "clinica",
            ResponsableId = adminId,
            Activa = true
        };
        var ubicClinicaC = new Ubicacion
        {
            Id = Guid.Parse("b1000000-0000-0000-0000-000000000013"),
            UbicacionPadreId = ubicRectoria.Id,
            Codigo = "UB-13",
            Nombre = "CLINICA C DOCTORES",
            Tipo = "clinica",
            ResponsableId = adminId,
            Activa = true
        };
        var ubicClinicaE = new Ubicacion
        {
            Id = Guid.Parse("b1000000-0000-0000-0000-000000000015"),
            UbicacionPadreId = ubicRectoria.Id,
            Codigo = "UB-15",
            Nombre = "CLINICA E MATERIALES",
            Tipo = "clinica",
            ResponsableId = adminId,
            Activa = true
        };
        var ubicDirClinica = new Ubicacion
        {
            Id = Guid.Parse("b1000000-0000-0000-0000-000000000023"),
            UbicacionPadreId = ubicRectoria.Id,
            Codigo = "UB-23",
            Nombre = "DIRECTORA DE CLINICA",
            Tipo = "clinica",
            ResponsableId = adminId,
            Activa = true
        };

        context.Ubicaciones.AddRange(ubicRectoria, ubicTecnologia, ubicLabComputo, ubicClinicaB, ubicClinicaC, ubicClinicaE, ubicDirClinica);

        // 5. Recursos Reales de Tecnología (del inventario original UOD)
        var recLaptop = new Recurso
        {
            Id = Guid.Parse("c1000000-0000-0000-0000-000000000001"),
            Sku = "SKU-LAP-001",
            Nombre = "Laptop DELL INSPIRON 15",
            Descripcion = "Activo TI institucional - Laptop DELL INSPIRON 15. Especificaciones: CPU: I7 12TH, RAM: 16GB, Almac: 1TB.",
            CategoriaId = catComputacion.Id,
            Tipo = "activo_fijo",
            UnidadMedida = "unidad",
            StockMinimo = 2,
            StockMaximo = 20,
            PuntoReorden = 4,
            CostoEstimado = 38000.00m,
            Activo = true
        };

        var recTelefono = new Recurso
        {
            Id = Guid.Parse("c1000000-0000-0000-0000-000000000003"),
            Sku = "SKU-TEL-003",
            Nombre = "Telefono IPHONE 13 PRO",
            Descripcion = "Activo TI institucional - Telefono IPHONE 13 PRO. Especificaciones: RAM: 6 GB, Almac: 256GB.",
            CategoriaId = catRedes.Id,
            Tipo = "activo_fijo",
            UnidadMedida = "unidad",
            StockMinimo = 1,
            StockMaximo = 10,
            PuntoReorden = 2,
            CostoEstimado = 35000.00m,
            Activo = true
        };

        var recMonitor = new Recurso
        {
            Id = Guid.Parse("c1000000-0000-0000-0000-000000000010"),
            Sku = "SKU-MON-010",
            Nombre = "Monitor DELL 24 PULGADAS",
            Descripcion = "Monitor institucional IPS Full HD 24\" para estaciones de trabajo.",
            CategoriaId = catPantallas.Id,
            Tipo = "activo_fijo",
            UnidadMedida = "unidad",
            StockMinimo = 5,
            StockMaximo = 50,
            PuntoReorden = 10,
            CostoEstimado = 9500.00m,
            Activo = true
        };

        var recUps = new Recurso
        {
            Id = Guid.Parse("c1000000-0000-0000-0000-000000000020"),
            Sku = "SKU-UPS-020",
            Nombre = "UPS FORZA 750VA",
            Descripcion = "Sistema de respaldo ininterrumpido 750VA para puestos de cómputo.",
            CategoriaId = catUps.Id,
            Tipo = "activo_fijo",
            UnidadMedida = "unidad",
            StockMinimo = 3,
            StockMaximo = 30,
            PuntoReorden = 6,
            CostoEstimado = 4200.00m,
            Activo = true
        };

        var recImpresora = new Recurso
        {
            Id = Guid.Parse("c1000000-0000-0000-0000-000000000030"),
            Sku = "SKU-IMP-030",
            Nombre = "Impresora HP LASERJET PRO",
            Descripcion = "Impresora multifuncional láser blanco y negro de red.",
            CategoriaId = catImpresion.Id,
            Tipo = "activo_fijo",
            UnidadMedida = "unidad",
            StockMinimo = 1,
            StockMaximo = 5,
            PuntoReorden = 2,
            CostoEstimado = 18500.00m,
            Activo = true
        };

        context.Recursos.AddRange(recLaptop, recTelefono, recMonitor, recUps, recImpresora);

        // Códigos propios
        context.RecursosCodigos.AddRange(
            new RecursoCodigo { RecursoId = recLaptop.Id, Codigo = recLaptop.Sku, TipoCodigo = "sku", EsPrincipal = true },
            new RecursoCodigo { RecursoId = recTelefono.Id, Codigo = recTelefono.Sku, TipoCodigo = "sku", EsPrincipal = true },
            new RecursoCodigo { RecursoId = recMonitor.Id, Codigo = recMonitor.Sku, TipoCodigo = "sku", EsPrincipal = true },
            new RecursoCodigo { RecursoId = recUps.Id, Codigo = recUps.Sku, TipoCodigo = "sku", EsPrincipal = true },
            new RecursoCodigo { RecursoId = recImpresora.Id, Codigo = recImpresora.Sku, TipoCodigo = "sku", EsPrincipal = true }
        );

        // Existencias en almacén y clínicas (con nombres 100% de la BD original)
        context.Existencias.AddRange(
            new Existencia { RecursoId = recLaptop.Id, UbicacionId = ubicTecnologia.Id, Cantidad = 12 },
            new Existencia { RecursoId = recLaptop.Id, UbicacionId = ubicClinicaB.Id, Cantidad = 3 },
            new Existencia { RecursoId = recMonitor.Id, UbicacionId = ubicTecnologia.Id, Cantidad = 25 },
            new Existencia { RecursoId = recMonitor.Id, UbicacionId = ubicClinicaC.Id, Cantidad = 8 },
            new Existencia { RecursoId = recUps.Id, UbicacionId = ubicClinicaB.Id, Cantidad = 4 },
            new Existencia { RecursoId = recUps.Id, UbicacionId = ubicClinicaE.Id, Cantidad = 3 },
            new Existencia { RecursoId = recImpresora.Id, UbicacionId = ubicDirClinica.Id, Cantidad = 1 },
            new Existencia { RecursoId = recTelefono.Id, UbicacionId = ubicTecnologia.Id, Cantidad = 5 }
        );

        await context.SaveChangesAsync();
    }
}
