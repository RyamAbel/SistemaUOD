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

        // 2. Categorías Odontológicas e Institucionales
        var catBiomateriales = new Categoria
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111101"),
            Codigo = "CAT-BIO",
            Nombre = "Biomateriales Dentales",
            Descripcion = "Resinas compuestas, adhesivos, ionómeros y cementos dentales",
            Activa = true
        };
        var catImplantologia = new Categoria
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111102"),
            Codigo = "CAT-IMP",
            Nombre = "Implantología y Cirugía",
            Descripcion = "Implantes de titanio, pilares, tornillos de fijación y membranas",
            Activa = true
        };
        var catFarmacologia = new Categoria
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111103"),
            Codigo = "CAT-FAR",
            Nombre = "Farmacología Odontológica",
            Descripcion = "Anestésicos locales, vasoconstrictores y antisépticos",
            Activa = true
        };
        var catProteccion = new Categoria
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111104"),
            Codigo = "CAT-PRO",
            Nombre = "Protección y Bioseguridad",
            Descripcion = "Guantes quirúrgicos, mascarillas, batas y gafas protectoras",
            Activa = true
        };
        var catEquipos = new Categoria
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111105"),
            Codigo = "CAT-EQP",
            Nombre = "Equipos Odontológicos Mayores",
            Descripcion = "Sillones quirúrgicos, autoclaves, compresores y radiovisiógrafos",
            Activa = true
        };
        var catTecnologia = new Categoria
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111106"),
            Codigo = "CAT-TEC",
            Nombre = "Tecnología y Cómputo",
            Descripcion = "Equipos informáticos, servidores, impresoras y monitores clínicos",
            Activa = true
        };

        context.Categorias.AddRange(catBiomateriales, catImplantologia, catFarmacologia, catProteccion, catEquipos, catTecnologia);

        // 3. Ubicaciones Clínicas e Institucionales UOD
        var ubicSede = new Ubicacion
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222201"),
            Codigo = "SEDE-UOD",
            Nombre = "Campus Principal UOD",
            Tipo = "sede",
            ResponsableId = adminId,
            Activa = true
        };

        var ubicAlmacen = new Ubicacion
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222202"),
            UbicacionPadreId = ubicSede.Id,
            Codigo = "ALM-CENTRAL",
            Nombre = "Almacén Central Institucional",
            Tipo = "almacen",
            ResponsableId = adminId,
            Activa = true
        };

        var ubicClinicaB = new Ubicacion
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222203"),
            UbicacionPadreId = ubicSede.Id,
            Codigo = "CLI-B",
            Nombre = "Clínica Odontológica B",
            Tipo = "clinica",
            ResponsableId = adminId,
            Activa = true
        };

        var ubicClinicaC = new Ubicacion
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222204"),
            UbicacionPadreId = ubicSede.Id,
            Codigo = "CLI-C",
            Nombre = "Clínica Odontológica C",
            Tipo = "clinica",
            ResponsableId = adminId,
            Activa = true
        };

        var ubicLab = new Ubicacion
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222205"),
            UbicacionPadreId = ubicSede.Id,
            Codigo = "LAB-COMPUTO",
            Nombre = "Laboratorio de Cómputo",
            Tipo = "laboratorio",
            ResponsableId = adminId,
            Activa = true
        };

        context.Ubicaciones.AddRange(ubicSede, ubicAlmacen, ubicClinicaB, ubicClinicaC, ubicLab);

        // 4. Proveedores
        var provDental = new Proveedor
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333301"),
            Rnc = "101889922",
            NombreComercial = "Dental Dominicana S.R.L.",
            RazonSocial = "Dental Dominicana Soluciones Médicas S.R.L.",
            ContactoNombre = "Lic. Carlos Méndez",
            Telefono = "(809) 555-8901",
            Correo = "ventas@dentaldominicana.com.do",
            Direccion = "Av. Winston Churchill #45, Sto Dgo",
            PlazoCreditoDias = 30,
            Activo = true
        };

        var provBiomat = new Proveedor
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333302"),
            Rnc = "131445566",
            NombreComercial = "Biomateriales del Caribe",
            RazonSocial = "Biomateriales y Equipos Médicos Quisqueya S.A.",
            ContactoNombre = "Dra. Laura Peña",
            Telefono = "(809) 555-4422",
            Correo = "pedidos@biomatcaribe.com",
            Direccion = "Av. 27 de Febrero #200, Sto Dgo",
            PlazoCreditoDias = 45,
            Activo = true
        };

        context.Proveedores.AddRange(provDental, provBiomat);

        // 5. Recursos y Existencias
        var recResina = new Recurso
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444401"),
            Sku = "RES-3M-A2",
            Nombre = "Resina Compuesta 3M Filtek Z250 Tono A2",
            Descripcion = "Jeringa de resina universal microhíbrida fotopolimerizable para restauraciones",
            CategoriaId = catBiomateriales.Id,
            Tipo = "consumible",
            UnidadMedida = "jeringa",
            StockMinimo = 10,
            StockMaximo = 50,
            PuntoReorden = 15,
            CostoEstimado = 1850.00m,
            Activo = true
        };

        var recGuantes = new Recurso
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444402"),
            Sku = "GNT-NIT-M",
            Nombre = "Guantes Quirúrgicos de Nitrilo Talla M (Caja 100u)",
            Descripcion = "Guantes libres de polvo, alta resistencia elástica y sensibilidad táctil",
            CategoriaId = catProteccion.Id,
            Tipo = "consumible",
            UnidadMedida = "caja",
            StockMinimo = 25,
            StockMaximo = 120,
            PuntoReorden = 35,
            CostoEstimado = 650.00m,
            Activo = true
        };

        var recSillon = new Recurso
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444403"),
            Sku = "EQP-SIL-GNAT",
            Nombre = "Unidad Dental Gnatus G3 Plus LED",
            Descripcion = "Sillón odontológico electromecánico con lámpara LED y micromotor incorporado",
            CategoriaId = catEquipos.Id,
            Tipo = "activo_fijo",
            UnidadMedida = "unidad",
            StockMinimo = 1,
            StockMaximo = 10,
            PuntoReorden = 2,
            CostoEstimado = 285000.00m,
            Activo = true
        };

        var recAutoclave = new Recurso
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444404"),
            Sku = "EQP-ATC-CRIST",
            Nombre = "Autoclave Cristófoli 21 Litros Clase B",
            Descripcion = "Esterilizador a vapor digital microprocesado con cámara de acero inoxidable",
            CategoriaId = catEquipos.Id,
            Tipo = "activo_fijo",
            UnidadMedida = "unidad",
            StockMinimo = 1,
            StockMaximo = 5,
            PuntoReorden = 1,
            CostoEstimado = 145000.00m,
            Activo = true
        };

        var recAnestesia = new Recurso
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444405"),
            Sku = "FAR-LID-2EP",
            Nombre = "Lidocaína 2% con Epinefrina 1:100.000 (Caja 50 Cárpules)",
            Descripcion = "Anestésico local dental en cárpules de vidrio con émbolo de goma",
            CategoriaId = catFarmacologia.Id,
            Tipo = "consumible",
            UnidadMedida = "caja",
            StockMinimo = 15,
            StockMaximo = 80,
            PuntoReorden = 25,
            CostoEstimado = 1200.00m,
            Activo = true
        };

        context.Recursos.AddRange(recResina, recGuantes, recSillon, recAutoclave, recAnestesia);

        // Códigos propios
        context.RecursosCodigos.AddRange(
            new RecursoCodigo { RecursoId = recResina.Id, Codigo = recResina.Sku, TipoCodigo = "sku", EsPrincipal = true },
            new RecursoCodigo { RecursoId = recGuantes.Id, Codigo = recGuantes.Sku, TipoCodigo = "sku", EsPrincipal = true },
            new RecursoCodigo { RecursoId = recSillon.Id, Codigo = recSillon.Sku, TipoCodigo = "sku", EsPrincipal = true },
            new RecursoCodigo { RecursoId = recAutoclave.Id, Codigo = recAutoclave.Sku, TipoCodigo = "sku", EsPrincipal = true },
            new RecursoCodigo { RecursoId = recAnestesia.Id, Codigo = recAnestesia.Sku, TipoCodigo = "sku", EsPrincipal = true }
        );

        // Existencias
        context.Existencias.AddRange(
            new Existencia { RecursoId = recResina.Id, UbicacionId = ubicAlmacen.Id, Cantidad = 22 },
            new Existencia { RecursoId = recResina.Id, UbicacionId = ubicClinicaB.Id, Cantidad = 8 },
            new Existencia { RecursoId = recGuantes.Id, UbicacionId = ubicAlmacen.Id, Cantidad = 65 },
            new Existencia { RecursoId = recGuantes.Id, UbicacionId = ubicClinicaB.Id, Cantidad = 20 },
            new Existencia { RecursoId = recSillon.Id, UbicacionId = ubicClinicaB.Id, Cantidad = 4 },
            new Existencia { RecursoId = recSillon.Id, UbicacionId = ubicClinicaC.Id, Cantidad = 3 },
            new Existencia { RecursoId = recAutoclave.Id, UbicacionId = ubicAlmacen.Id, Cantidad = 2 },
            new Existencia { RecursoId = recAnestesia.Id, UbicacionId = ubicAlmacen.Id, Cantidad = 35 }
        );

        await context.SaveChangesAsync();
    }
}
