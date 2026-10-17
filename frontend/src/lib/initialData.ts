export interface ArticuloItem {
  id: string;
  sku: string;
  codigoBarras: string;
  nombre: string;
  categoria: string;
  tipo: 'consumible' | 'activo_fijo';
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  ubicacionPrincipal: string;
  costoEstimado: number;
  estado: 'saludable' | 'bajo' | 'agotado';
}

export interface MovimientoItem {
  id: string;
  numero: string;
  tipo: 'entrada' | 'salida' | 'traslado' | 'ajuste';
  articuloNombre: string;
  cantidad: number;
  origen?: string;
  destino?: string;
  fecha: string;
  usuario: string;
  origenIa: boolean;
  motivo: string;
}

export const initialArticulos: ArticuloItem[] = [
  {
    id: 'art-001',
    sku: 'OFI-PAP-001',
    codigoBarras: '7461234567890',
    nombre: 'Resmas de Papel Bond 8.5 x 11 (Caja 500 hjs)',
    categoria: 'Papelería y Oficina',
    tipo: 'consumible',
    unidad: 'resma',
    stockActual: 85,
    stockMinimo: 15,
    ubicacionPrincipal: 'Almacén Central',
    costoEstimado: 320.00,
    estado: 'saludable',
  },
  {
    id: 'art-002',
    sku: 'OFI-MAR-002',
    codigoBarras: '7461234567891',
    nombre: 'Set Marcadores para Pizarra Blanca (4 Colores)',
    categoria: 'Papelería y Oficina',
    tipo: 'consumible',
    unidad: 'paquete',
    stockActual: 8,
    stockMinimo: 10,
    ubicacionPrincipal: 'Almacén Central',
    costoEstimado: 240.00,
    estado: 'bajo', // Stock por debajo del mínimo
  },
  {
    id: 'art-003',
    sku: 'TEC-LAP-001',
    codigoBarras: '7461234567892',
    nombre: 'Laptop Dell Inspiron 15 (Core i5, 16GB, 512GB SSD)',
    categoria: 'Tecnología y Cómputo',
    tipo: 'activo_fijo',
    unidad: 'unidad',
    stockActual: 6,
    stockMinimo: 2,
    ubicacionPrincipal: 'Almacén Central',
    costoEstimado: 48500.00,
    estado: 'saludable',
  },
  {
    id: 'art-004',
    sku: 'MOB-SIL-001',
    codigoBarras: '7461234567893',
    nombre: 'Silla Ergonómica de Malla con Apoyabrazos',
    categoria: 'Mobiliario y Equipamiento',
    tipo: 'activo_fijo',
    unidad: 'unidad',
    stockActual: 18,
    stockMinimo: 5,
    ubicacionPrincipal: 'Almacén Central',
    costoEstimado: 6800.00,
    estado: 'saludable',
  },
  {
    id: 'art-005',
    sku: 'LIM-JAB-001',
    codigoBarras: '7461234567894',
    nombre: 'Galón Jabón Líquido Antibacterial para Manos',
    categoria: 'Limpieza y Cafetería',
    tipo: 'consumible',
    unidad: 'galon',
    stockActual: 2,
    stockMinimo: 6,
    ubicacionPrincipal: 'Almacén Central',
    costoEstimado: 450.00,
    estado: 'bajo', // Crítico
  }
];

export const initialMovimientos: MovimientoItem[] = [
  {
    id: 'mov-104',
    numero: 'MOV-2026-00104',
    tipo: 'traslado',
    articuloNombre: 'Resmas de Papel Bond 8.5 x 11',
    cantidad: 15,
    origen: 'Almacén Central',
    destino: 'Secretaría General',
    fecha: 'Hoy, 09:30 AM',
    usuario: 'Carlos Almonte (Encargado Almacén)',
    origenIa: true,
    motivo: 'Reabastecimiento solicitado por Secretaría y confirmado con IA',
  },
  {
    id: 'mov-103',
    numero: 'MOV-2026-00103',
    tipo: 'entrada',
    articuloNombre: 'Laptop Dell Inspiron 15',
    cantidad: 4,
    destino: 'Almacén Central',
    fecha: 'Ayer, 03:15 PM',
    usuario: 'Admin UOD',
    origenIa: false,
    motivo: 'Recepción Orden de Compra #OC-2026-042',
  },
  {
    id: 'mov-102',
    numero: 'MOV-2026-00102',
    tipo: 'salida',
    articuloNombre: 'Set Marcadores para Pizarra Blanca',
    cantidad: 12,
    origen: 'Almacén Central',
    fecha: '14 Octubre, 10:00 AM',
    usuario: 'Laura Peña (Coordinación)',
    origenIa: false,
    motivo: 'Entrega para inicio de ciclo académico Edificio A',
  }
];

export const ubicacionesList = [
  'Almacén Central',
  'Secretaría General',
  'Laboratorio de Cómputo 1',
  'Rectoría / Dirección',
  'Edificio Docente B'
];
