import { supabase } from './supabaseClient';

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  extensions?: Record<string, any>;
}

export interface PerfilUsuario {
  id: string;
  correo: string;
  nombreCompleto: string;
  rol: string;
  cargo?: string | null;
  departamento?: string | null;
  telefono?: string | null;
  avatarUrl?: string | null;
  preferencias?: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  permisos: string[];
}

export interface PagedResult<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

class ApiError extends Error {
  public status: number;
  public problem?: ProblemDetails;

  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // 1. Obtener token de Supabase Auth (o dev-token en desarrollo local)
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || (process.env.NODE_ENV === 'development' ? 'dev-token-uod' : undefined);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/problem+json, application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      let problem: ProblemDetails | undefined;
      let errorMessage = `Error en la solicitud: ${response.status} ${response.statusText}`;

      try {
        problem = await response.json();
        if (problem?.detail) {
          errorMessage = problem.detail;
        } else if (problem?.title) {
          errorMessage = problem.title;
        }
      } catch {
        // La respuesta no era JSON
      }

      throw new ApiError(response.status, errorMessage, problem);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Errores de red o conexión caída
    throw new ApiError(
      0,
      'No se pudo conectar con el servidor de la API de SIIA (.NET). Asegúrate de que el backend esté ejecutándose.',
      { detail: error.message }
    );
  }
}

export interface CategoriaDto {
  id: string;
  categoriaPadreId?: string | null;
  categoriaPadreNombre?: string | null;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activa: boolean;
  creadoEn: string;
  actualizadoEn: string;
  subcategoriasCount: number;
  recursosCount: number;
}

export interface CrearCategoriaDto {
  categoriaPadreId?: string | null;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activa?: boolean;
}

export interface ProveedorDto {
  id: string;
  rnc: string;
  nombreComercial: string;
  razonSocial?: string | null;
  contactoNombre?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  plazoCreditoDias: number;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  activosSuministradosCount: number;
}

export interface CrearProveedorDto {
  rnc: string;
  nombreComercial: string;
  razonSocial?: string | null;
  contactoNombre?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  plazoCreditoDias?: number;
  activo?: boolean;
}

export interface UbicacionDto {
  id: string;
  ubicacionPadreId?: string | null;
  ubicacionPadreNombre?: string | null;
  codigo: string;
  nombre: string;
  tipo: string;
  responsableId?: string | null;
  responsableNombre?: string | null;
  responsableCorreo?: string | null;
  activa: boolean;
  totalSububicaciones: number;
  totalExistencias: number;
  totalActivosFisicos: number;
  creadoEn: string;
  actualizadoEn: string;
}

export interface UbicacionNodoArbolDto {
  id: string;
  ubicacionPadreId?: string | null;
  codigo: string;
  nombre: string;
  tipo: string;
  responsableNombre?: string | null;
  activa: boolean;
  totalExistencias: number;
  totalActivosFisicos: number;
  hijos: UbicacionNodoArbolDto[];
}

export interface CrearUbicacionDto {
  ubicacionPadreId?: string | null;
  codigo: string;
  nombre: string;
  tipo: string;
  responsableId?: string | null;
  activa?: boolean;
}

export interface UbicacionFiltrosDto {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  tipo?: string;
  ubicacionPadreId?: string;
  soloActivas?: boolean;
  sortBy?: string;
  isDescending?: boolean;
}

export interface RecursoFiltrosDto {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  categoriaId?: string;
  tipo?: 'consumible' | 'activo_fijo';
  ubicacionId?: string;
  responsableId?: string;
  proveedorId?: string;
  stockBajo?: boolean;
  stockAgotado?: boolean;
  costoMin?: number;
  costoMax?: number;
  fechaAdquisicionDesde?: string;
  fechaAdquisicionHasta?: string;
  conFoto?: boolean;
  conQr?: boolean;
  activo?: boolean;
  sortBy?: string;
  isDescending?: boolean;
}

export interface RecursoDto {
  id: string;
  sku: string;
  nombre: string;
  descripcion?: string | null;
  categoriaId: string;
  categoriaNombre: string;
  tipo: 'consumible' | 'activo_fijo';
  unidadMedida: string;
  stockMinimo: number;
  stockMaximo?: number | null;
  puntoReorden?: number | null;
  costoEstimado: number;
  activo: boolean;
  stockActual: number;
  fotoPrincipalUrl?: string | null;
  totalFotos: number;
  qrPrincipalCodigo?: string | null;
  totalActivosSerie: number;
  creadoEn: string;
  actualizadoEn: string;
}

export interface RecursoCodigoDto {
  id: string;
  tipoCodigo: string;
  codigo: string;
  esPrincipal: boolean;
  creadoEn: string;
}

export interface RecursoDetalleDto extends RecursoDto {
  fotos: Array<{ id: string; urlArchivo: string; esPrincipal: boolean; orden: number; creadoEn: string }>;
  codigos: RecursoCodigoDto[];
  existencias: Array<{ ubicacionId: string; ubicacionNombre: string; ubicacionCodigo: string; cantidad: number; actualizadoEn: string }>;
  activosSerie: Array<{
    id: string;
    numeroSerie: string;
    placaInstitucional?: string | null;
    estado: string;
    ubicacionId: string;
    ubicacionNombre: string;
    responsableId?: string | null;
    responsableNombre?: string | null;
    proveedorId?: string | null;
    proveedorNombre?: string | null;
    fechaAdquisicion?: string | null;
    facturaUrl?: string | null;
    facturaNombre?: string | null;
    costoAdquisicion?: number | null;
    notas?: string | null;
  }>;
}

export interface CrearRecursoDto {
  sku: string;
  nombre: string;
  descripcion?: string;
  categoriaId: string;
  tipo: 'consumible' | 'activo_fijo';
  unidadMedida?: string;
  stockMinimo?: number;
  stockMaximo?: number;
  puntoReorden?: number;
  costoEstimado?: number;
  codigoQrInicial?: string;
  activo?: boolean;
}

export interface DuplicarRecursoDto {
  nuevoSku: string;
  nuevoNombre: string;
  copiarFotos?: boolean;
  copiarCodigos?: boolean;
}

export interface AgregarCodigoRecursoDto {
  codigo: string;
  tipoCodigo: 'qr_propio' | 'codigo_barras' | 'fabricante' | 'placa_institucional';
  esPrincipal?: boolean;
}

export interface ResolucionCodigoDto {
  encontrado: boolean;
  codigoBuscado: string;
  tipoEntidad: 'recurso' | 'activo_serie';
  tipoCodigoDetectado: string;
  urlFicha: string;
  recurso?: RecursoDto | null;
  activoSerie?: {
    id: string;
    numeroSerie: string;
    placaInstitucional?: string | null;
    estado: string;
    ubicacionId: string;
    ubicacionNombre: string;
    responsableId?: string | null;
    responsableNombre?: string | null;
    proveedorId?: string | null;
    proveedorNombre?: string | null;
    fechaAdquisicion?: string | null;
    notas?: string | null;
  } | null;
  mensaje: string;
}

export interface EnlaceQrDto {
  recursoId: string;
  sku: string;
  codigoQr: string;
  enlaceSeguro: string;
  urlDescargaImagen: string;
}

// ==========================================
// Módulo de Existencias y Stock (RF-12)
// ==========================================
export interface ExistenciaDto {
  id: string;
  recursoId: string;
  recursoSku: string;
  recursoNombre: string;
  recursoTipo: string;
  unidadMedida: string;
  ubicacionId: string;
  ubicacionCodigo: string;
  ubicacionNombre: string;
  loteId?: string | null;
  numeroLote?: string | null;
  fechaVencimiento?: string | null;
  diasParaVencer?: number | null;
  estaVencido: boolean;
  proximoAVencer: boolean;
  cantidad: number;
  cantidadReservada: number;
  cantidadDisponible: number;
  actualizadoEn: string;
}

export interface ExistenciaPorUbicacionDto {
  ubicacionId: string;
  ubicacionCodigo: string;
  ubicacionNombre: string;
  cantidad: number;
  cantidadDisponible: number;
}

export interface ExistenciaPorLoteDto {
  loteId: string;
  numeroLote: string;
  fechaVencimiento?: string | null;
  diasParaVencer?: number | null;
  estaVencido: boolean;
  proximoAVencer: boolean;
  cantidad: number;
  proveedorNombre?: string | null;
}

export interface ResumenStockRecursoDto {
  recursoId: string;
  sku: string;
  nombre: string;
  categoriaNombre: string;
  unidadMedida: string;
  tipo: string;
  stockTotal: number;
  stockReservado: number;
  stockDisponible: number;
  stockMinimo: number;
  stockMaximo?: number | null;
  puntoReorden?: number | null;
  estadoStock: 'agotado' | 'bajo_minimo' | 'reorden' | 'normal';
  requiereReorden: boolean;
  cantidadSugeridaReorden: number;
  lotesVencidosCount: number;
  lotesProximosVencerCount: number;
  ubicaciones: ExistenciaPorUbicacionDto[];
  lotes: ExistenciaPorLoteDto[];
}

export interface ExistenciaFiltrosDto {
  recursoId?: string;
  ubicacionId?: string;
  loteId?: string;
  soloStockBajo?: boolean;
  soloAgotados?: boolean;
  proximosAVencer?: boolean;
  search?: string;
  pageIndex?: number;
  pageSize?: number;
  sortBy?: string;
  isDescending?: boolean;
}

// ==========================================
// Módulo de Movimientos Transaccionales (Prompt 7.3)
// ==========================================
export interface MovimientoLineaDto {
  id: string;
  recursoId: string;
  recursoSku: string;
  recursoNombre: string;
  recursoTipo: string;
  unidadMedida: string;
  loteId?: string | null;
  numeroLote?: string | null;
  fechaVencimiento?: string | null;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

export interface MovimientoDto {
  id: string;
  numeroMovimiento: string;
  tipo: 'entrada' | 'salida' | 'traslado' | 'ajuste' | 'devolucion' | 'baja';
  origenUbicacionId?: string | null;
  origenUbicacionNombre?: string | null;
  origenUbicacionCodigo?: string | null;
  destinoUbicacionId?: string | null;
  destinoUbicacionNombre?: string | null;
  destinoUbicacionCodigo?: string | null;
  usuarioId: string;
  usuarioNombre: string;
  usuarioCorreo: string;
  origenIa: boolean;
  motivo: string;
  comprobanteUrl?: string | null;
  totalLineas: number;
  totalUnidades: number;
  costoTotal: number;
  creadoEn: string;
  lineas: MovimientoLineaDto[];
}

export interface CrearMovimientoLineaDto {
  recursoId: string;
  loteId?: string | null;
  cantidad: number;
  costoUnitario?: number;
  numerosSerie?: string[];
}

export interface CrearMovimientoDto {
  tipo: 'entrada' | 'salida' | 'traslado' | 'ajuste' | 'devolucion' | 'baja';
  origenUbicacionId?: string | null;
  destinoUbicacionId?: string | null;
  motivo: string;
  comprobanteUrl?: string | null;
  facturaUrl?: string | null;
  numeroFactura?: string | null;
  proveedorId?: string | null;
  proveedorNombre?: string | null;
  fechaMovimiento?: string | null;
  origenIa?: boolean;
  idempotenciaKey?: string;
  lineas: CrearMovimientoLineaDto[];
}

export interface MovimientoFiltrosDto {
  tipo?: string;
  ubicacionId?: string;
  recursoId?: string;
  usuarioId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
  pageIndex?: number;
  pageSize?: number;
  sortBy?: string;
  isDescending?: boolean;
}

export interface PrevisualizarMovimientoLineaDto {
  recursoId: string;
  recursoSku: string;
  recursoNombre: string;
  ubicacionId: string;
  ubicacionNombre: string;
  loteId?: string | null;
  numeroLote?: string | null;
  stockActual: number;
  cantidadOperacion: number;
  stockResultante: number;
  esValido: boolean;
  mensajeError?: string | null;
  numerosSerie?: string[];
  placasSugeridas?: string[];
}

export interface PrevisualizarMovimientoResultadoDto {
  esValido: boolean;
  tipo: string;
  totalLineas: number;
  lineas: PrevisualizarMovimientoLineaDto[];
  errores: string[];
}

export interface RecursoFotoDto {
  id: string;
  urlArchivo: string;
  esPrincipal: boolean;
  orden: number;
  creadoEn: string;
}

// ==========================================
// Módulo de Activos Fijos y Series (Prompt 8.1)
// ==========================================
export interface ActivoSerieDto {
  id: string;
  recursoId: string;
  recursoSku: string;
  recursoNombre: string;
  recursoDescripcion?: string | null;
  categoriaId: string;
  categoriaNombre: string;
  numeroSerie: string;
  placaInstitucional?: string | null;
  estado: string;
  ubicacionId: string;
  ubicacionNombre: string;
  responsableId?: string | null;
  responsableNombre?: string | null;
  responsableCorreo?: string | null;
  proveedorId?: string | null;
  proveedorNombre?: string | null;
  fechaAdquisicion?: string | null;
  garantiaVence?: string | null;
  costoEstimado: number;
  costoAdquisicion?: number | null;
  facturaUrl?: string | null;
  facturaNombre?: string | null;
  fotoPrincipalUrl?: string | null;
  notas?: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ActivoHistorialCambioDto {
  id: string;
  fecha: string;
  accion: string;
  usuarioNombre?: string | null;
  detalle?: string | null;
  valoresAnteriores?: string | null;
  valoresNuevos?: string | null;
}

export interface ActivoAsignacionHistorialDto {
  id: string;
  custodioId: string;
  custodioNombre: string;
  tipo: string;
  fechaInicio: string;
  fechaDevolucionPrevista?: string | null;
  fechaDevolucionReal?: string | null;
  estado: string;
  observaciones?: string | null;
}

export interface ActivoMantenimientoHistorialDto {
  id: string;
  tipo: string;
  descripcion: string;
  fechaProgramada: string;
  fechaRealizada?: string | null;
  estado: string;
  costo: number;
  tecnicoResponsable?: string | null;
  proveedorNombre?: string | null;
}

export interface ActivoSerieDetalleDto extends ActivoSerieDto {
  fotos?: RecursoFotoDto[];
  codigos?: string[];
  historialAsignaciones: ActivoAsignacionHistorialDto[];
  historialMantenimientos: ActivoMantenimientoHistorialDto[];
  historialCambios?: ActivoHistorialCambioDto[];
}

export interface CrearActivoSerieDto {
  recursoId: string;
  numeroSerie: string;
  placaInstitucional?: string | null;
  estado?: string;
  ubicacionId: string;
  responsableId?: string | null;
  proveedorId?: string | null;
  fechaAdquisicion?: string | null;
  garantiaVence?: string | null;
  costoAdquisicion?: number | null;
  facturaUrl?: string | null;
  facturaNombre?: string | null;
  notas?: string | null;
}

export interface ActualizarActivoSerieDto {
  numeroSerie: string;
  placaInstitucional?: string | null;
  estado: string;
  ubicacionId: string;
  responsableId?: string | null;
  proveedorId?: string | null;
  fechaAdquisicion?: string | null;
  garantiaVence?: string | null;
  costoAdquisicion?: number | null;
  facturaUrl?: string | null;
  facturaNombre?: string | null;
  notas?: string | null;
  recursoNombre?: string | null;
  recursoDescripcion?: string | null;
  recursoCategoriaId?: string | null;
}

export interface CambiarEstadoActivoDto {
  estado: string;
  motivo?: string | null;
}

export interface ActivoFiltrosDto {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  recursoId?: string;
  categoriaId?: string;
  ubicacionId?: string;
  responsableId?: string;
  estado?: string;
  custodio?: string;
  placaInstitucional?: string;
  sortBy?: string;
  isDescending?: boolean;
}

export interface TrasladarActivoDto {
  nuevaUbicacionId: string;
  nuevoCustodioId?: string | null;
  tipoAsignacion?: string | null;
  motivo: string;
  observaciones?: string | null;
}

export interface AsignarCustodioDto {
  custodioId: string;
  tipo?: string;
  fechaDevolucionPrevista?: string | null;
  observaciones: string;
}

export interface ActaEntregaRecepcionDto {
  numeroActa: string;
  fechaEmision: string;
  tipoOperacion: string;
  institucion: string;
  departamentoEmisor: string;
  activoId: string;
  placaInstitucional: string;
  numeroSerie: string;
  recursoNombre: string;
  recursoSku: string;
  categoriaNombre: string;
  ubicacionAnterior?: string | null;
  ubicacionNueva: string;
  custodioAnterior?: string | null;
  custodioNuevo: string;
  custodioNuevoCorreo?: string | null;
  custodioNuevoDepartamento?: string | null;
  motivo: string;
  observaciones?: string | null;
  clausulasResponsabilidad: string[];
  firmaEmisorNombre: string;
  firmaEmisorCargo: string;
  firmaReceptorNombre: string;
  firmaReceptorCargo: string;
}

export interface ResultadoTrasladoActivoDto {
  exitoso: boolean;
  mensaje: string;
  activo: ActivoSerieDto;
  acta: ActaEntregaRecepcionDto;
}

export interface DarDeBajaActivoDto {
  motivo: string;
  dictamenTecnico?: string | null;
  destinoFinalBien?: string;
  autorizadoPor?: string | null;
}

export interface ActaDescargoPatrimonialDto {
  numeroActa: string;
  fechaBaja: string;
  institucion: string;
  departamentoEmisor: string;
  activoId: string;
  placaInstitucional: string;
  numeroSerie: string;
  recursoNombre: string;
  recursoSku: string;
  categoriaNombre: string;
  ultimaUbicacion: string;
  ultimoCustodio?: string | null;
  valorHistoricoDop: number;
  valorEnLibrosDop: number;
  motivoBaja: string;
  dictamenTecnico: string;
  destinoFinalBien: string;
  clausulasDescargo: string[];
  firmaResponsableTi: string;
  firmaAuditoriaInterna: string;
  firmaRectoriaAdministracion: string;
}

export interface ResultadoBajaActivoDto {
  exitoso: boolean;
  mensaje: string;
  activo: ActivoSerieDto;
  actaDescargo: ActaDescargoPatrimonialDto;
}

// ==========================================
// Depreciación y Valor en Libros (Prompt 8.3 - DGII Cat. 2)
// ==========================================
export interface CalculoDepreciacionActivoDto {
  activoId: string;
  placaInstitucional: string;
  numeroSerie: string;
  recursoNombre: string;
  recursoSku: string;
  categoriaNombre: string;
  ubicacionNombre: string;
  custodioNombre?: string | null;
  categoriaDgii: string;
  tasaAnualPorcentaje: number;
  vidaUtilMesesTotal: number;
  costoAdquisicion: number;
  valorResidual: number;
  baseDepreciable: number;
  depreciacionMensual: number;
  depreciacionAcumulada: number;
  valorEnLibros: number;
  porcentajeDepreciado: number;
  fechaInicioDepreciacion: string;
  fechaCorteCalculo: string;
  mesesTranscurridos: number;
  mesesVidaUtilRestante: number;
  estadoContable: string;
  totalmenteDepreciado: boolean;
}

export interface PeriodoAmortizacionDto {
  periodoNumero: number;
  anio: number;
  mes: number;
  periodoTexto: string;
  depreciacionPeriodo: number;
  depreciacionAcumulada: number;
  valorEnLibrosFinPeriodo: number;
  porcentajeAmortizado: number;
}

export interface TablaAmortizacionActivoDto {
  activoId: string;
  placaInstitucional: string;
  recursoNombre: string;
  costoAdquisicion: number;
  valorResidual: number;
  valorEnLibrosActual: number;
  tasaAnualPorcentaje: number;
  totalPeriodosMeses: number;
  periodos: PeriodoAmortizacionDto[];
}

export interface ResumenCategoriaDepreciacionDto {
  categoriaNombre: string;
  cantidadEquipos: number;
  valorHistoricoDop: number;
  depreciacionAcumuladaDop: number;
  valorEnLibrosDop: number;
}

export interface ResumenDepreciacionContableDto {
  fechaCorte: string;
  totalActivosComputados: number;
  activosEnProcesoDepreciacion: number;
  activosTotalmenteDepreciados: number;
  valorTotalHistoricoDop: number;
  depreciacionTotalAcumuladaDop: number;
  valorNetoEnLibrosTotalDop: number;
  porcentajeDepreciacionGlobal: number;
  desgloseCategorias: ResumenCategoriaDepreciacionDto[];
}

export interface FiltroDepreciacionDto {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  fechaCorte?: string;
  categoriaId?: string;
  ubicacionId?: string;
  soloConValorEnLibros?: boolean;
  soloTotalmenteDepreciados?: boolean;
  sortBy?: string;
  isDescending?: boolean;
}

// ==========================================
// Mantenimientos y Servicios Técnicos (Prompt 8.4 - RF-20)
// ==========================================
export interface MantenimientoDto {
  id: string;
  activoSerieId: string;
  placaInstitucional: string;
  numeroSerie: string;
  recursoNombre: string;
  categoriaNombre: string;
  ubicacionNombre: string;
  tipo: 'preventivo' | 'correctivo' | 'calibracion';
  proveedorId?: string | null;
  proveedorNombre?: string | null;
  tecnicoResponsable?: string | null;
  costo: number;
  descripcion: string;
  fechaProgramada: string;
  fechaRealizada?: string | null;
  estado: 'programado' | 'en_proceso' | 'completado' | 'cancelado';
  creadoEn: string;
}

export interface CrearMantenimientoDto {
  activoSerieId: string;
  tipo: 'preventivo' | 'correctivo' | 'calibracion';
  proveedorId?: string | null;
  tecnicoResponsable?: string | null;
  costo: number;
  descripcion: string;
  fechaProgramada: string;
  cambiarEstadoActivoAEnMantenimiento?: boolean;
}

export interface ActualizarMantenimientoDto {
  tipo: 'preventivo' | 'correctivo' | 'calibracion';
  proveedorId?: string | null;
  tecnicoResponsable?: string | null;
  costo: number;
  descripcion: string;
  fechaProgramada: string;
  fechaRealizada?: string | null;
  estado: 'programado' | 'en_proceso' | 'completado' | 'cancelado';
}

export interface CompletarMantenimientoDto {
  fechaRealizada?: string;
  costoFinal: number;
  tecnicoResponsable?: string | null;
  observacionesFinales?: string | null;
  estadoFinalActivo?: 'disponible' | 'en_uso';
}

export interface CancelarMantenimientoDto {
  motivo: string;
}

export interface MantenimientoFiltrosDto {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  activoSerieId?: string;
  placaInstitucional?: string;
  tipo?: string;
  estado?: string;
  proveedorId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface ResumenMantenimientosActivoDto {
  activoSerieId: string;
  placaInstitucional: string;
  recursoNombre: string;
  totalMantenimientos: number;
  totalPreventivos: number;
  totalCorrectivos: number;
  totalCalibraciones: number;
  costoTotalInvertidoDop: number;
  ultimoMantenimientoFecha?: string | null;
  proximoMantenimientoProgramado?: string | null;
  ultimosServicios: MantenimientoDto[];
}

export const apiClient = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', headers }),

  post: <T>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers
    }),

  put: <T>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers
    }),

  patch: <T>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers
    }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'DELETE', headers }),

  // Endpoints específicos del Dominio
  getMiPerfil: async (): Promise<PerfilUsuario> => {
    return request<PerfilUsuario>('me');
  },

  actualizarMiPerfil: async (datos: {
    nombreCompleto: string;
    cargo?: string | null;
    departamento?: string | null;
    telefono?: string | null;
    avatarUrl?: string | null;
  }): Promise<PerfilUsuario> => {
    return request<PerfilUsuario>('me', {
      method: 'PUT',
      body: JSON.stringify(datos)
    });
  },

  subirAvatarPerfil: async (file: File): Promise<PerfilUsuario> => {
    const formData = new FormData();
    formData.append('file', file);
    return request<PerfilUsuario>('me/avatar', {
      method: 'POST',
      body: formData
    });
  },

  eliminarAvatarPerfil: async (): Promise<{ mensaje: string }> => {
    return request<{ mensaje: string }>('me/avatar', {
      method: 'DELETE'
    });
  },

  guardarPreferencias: async (preferencias: any): Promise<{ mensaje: string; preferencias: string }> => {
    const prefStr = typeof preferencias === 'string' ? preferencias : JSON.stringify(preferencias);
    return request<{ mensaje: string; preferencias: string }>('me/preferencias', {
      method: 'PUT',
      body: JSON.stringify({ preferencias: prefStr })
    });
  },

  checkHealth: async () => {
    return request<{ estado: string; sistema: string }>('health');
  },

  // Categorías
  listarCategorias: async (soloActivas?: boolean): Promise<CategoriaDto[]> => {
    const query = soloActivas !== undefined ? `?soloActivas=${soloActivas}` : '';
    return request<CategoriaDto[]>(`categorias${query}`);
  },

  obtenerCategoria: async (id: string): Promise<CategoriaDto> => {
    return request<CategoriaDto>(`categorias/${id}`);
  },

  crearCategoria: async (dto: CrearCategoriaDto): Promise<CategoriaDto> => {
    return request<CategoriaDto>('categorias', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  actualizarCategoria: async (id: string, dto: CrearCategoriaDto): Promise<CategoriaDto> => {
    return request<CategoriaDto>(`categorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    });
  },

  cambiarEstadoCategoria: async (id: string, activo: boolean): Promise<void> => {
    return request<void>(`categorias/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo })
    });
  },

  eliminarCategoria: async (id: string): Promise<void> => {
    return request<void>(`categorias/${id}`, {
      method: 'DELETE'
    });
  },

  // Proveedores
  listarProveedores: async (params?: {
    pageIndex?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    isDescending?: boolean;
    soloActivos?: boolean;
  }): Promise<PagedResult<ProveedorDto>> => {
    const searchParams = new URLSearchParams();
    if (params?.pageIndex) searchParams.set('pageIndex', params.pageIndex.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.isDescending !== undefined) searchParams.set('isDescending', params.isDescending.toString());
    if (params?.soloActivos !== undefined) searchParams.set('soloActivos', params.soloActivos.toString());

    const qs = searchParams.toString();
    return request<PagedResult<ProveedorDto>>(`proveedores${qs ? `?${qs}` : ''}`);
  },

  obtenerProveedor: async (id: string): Promise<ProveedorDto> => {
    return request<ProveedorDto>(`proveedores/${id}`);
  },

  crearProveedor: async (dto: CrearProveedorDto): Promise<ProveedorDto> => {
    return request<ProveedorDto>('proveedores', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  actualizarProveedor: async (id: string, dto: CrearProveedorDto): Promise<ProveedorDto> => {
    return request<ProveedorDto>(`proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    });
  },

  cambiarEstadoProveedor: async (id: string, activo: boolean): Promise<void> => {
    return request<void>(`proveedores/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo })
    });
  },

  // Ubicaciones (Prompt 7.1)
  listarUbicaciones: async (filtros?: UbicacionFiltrosDto): Promise<PagedResult<UbicacionDto>> => {
    const params = new URLSearchParams();
    if (filtros?.pageIndex) params.set('pageIndex', filtros.pageIndex.toString());
    if (filtros?.pageSize) params.set('pageSize', filtros.pageSize.toString());
    if (filtros?.search) params.set('search', filtros.search);
    if (filtros?.tipo) params.set('tipo', filtros.tipo);
    if (filtros?.ubicacionPadreId) params.set('ubicacionPadreId', filtros.ubicacionPadreId);
    if (filtros?.soloActivas !== undefined) params.set('soloActivas', filtros.soloActivas.toString());
    if (filtros?.sortBy) params.set('sortBy', filtros.sortBy);
    if (filtros?.isDescending !== undefined) params.set('isDescending', filtros.isDescending.toString());

    const qs = params.toString();
    return request<PagedResult<UbicacionDto>>(`ubicaciones${qs ? `?${qs}` : ''}`);
  },

  obtenerArbolUbicaciones: async (soloActivas?: boolean): Promise<UbicacionNodoArbolDto[]> => {
    const qs = soloActivas !== undefined ? `?soloActivas=${soloActivas}` : '';
    return request<UbicacionNodoArbolDto[]>(`ubicaciones/arbol${qs}`);
  },

  obtenerUbicacion: async (id: string): Promise<UbicacionDto> => {
    return request<UbicacionDto>(`ubicaciones/${id}`);
  },

  crearUbicacion: async (dto: CrearUbicacionDto): Promise<UbicacionDto> => {
    return request<UbicacionDto>('ubicaciones', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  actualizarUbicacion: async (id: string, dto: CrearUbicacionDto): Promise<UbicacionDto> => {
    return request<UbicacionDto>(`ubicaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    });
  },

  cambiarEstadoUbicacion: async (id: string, activa: boolean): Promise<void> => {
    return request<void>(`ubicaciones/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activa })
    });
  },

  eliminarUbicacion: async (id: string): Promise<void> => {
    return request<void>(`ubicaciones/${id}`, {
      method: 'DELETE'
    });
  },

  // Recursos
  listarRecursos: async (filtros?: RecursoFiltrosDto): Promise<PagedResult<RecursoDto>> => {
    const params = new URLSearchParams();
    if (filtros?.pageIndex) params.set('pageIndex', filtros.pageIndex.toString());
    if (filtros?.pageSize) params.set('pageSize', filtros.pageSize.toString());
    if (filtros?.search) params.set('search', filtros.search);
    if (filtros?.categoriaId) params.set('categoriaId', filtros.categoriaId);
    if (filtros?.tipo) params.set('tipo', filtros.tipo);
    if (filtros?.ubicacionId) params.set('ubicacionId', filtros.ubicacionId);
    if (filtros?.responsableId) params.set('responsableId', filtros.responsableId);
    if (filtros?.proveedorId) params.set('proveedorId', filtros.proveedorId);
    if (filtros?.stockBajo !== undefined) params.set('stockBajo', filtros.stockBajo.toString());
    if (filtros?.stockAgotado !== undefined) params.set('stockAgotado', filtros.stockAgotado.toString());
    if (filtros?.costoMin !== undefined) params.set('costoMin', filtros.costoMin.toString());
    if (filtros?.costoMax !== undefined) params.set('costoMax', filtros.costoMax.toString());
    if (filtros?.conFoto !== undefined) params.set('conFoto', filtros.conFoto.toString());
    if (filtros?.conQr !== undefined) params.set('conQr', filtros.conQr.toString());
    if (filtros?.activo !== undefined) params.set('activo', filtros.activo.toString());
    if (filtros?.sortBy) params.set('sortBy', filtros.sortBy);
    if (filtros?.isDescending !== undefined) params.set('isDescending', filtros.isDescending.toString());

    const qs = params.toString();
    return request<PagedResult<RecursoDto>>(`recursos${qs ? `?${qs}` : ''}`);
  },

  obtenerRecurso: async (id: string): Promise<RecursoDetalleDto> => {
    return request<RecursoDetalleDto>(`recursos/${id}`);
  },

  crearRecurso: async (dto: CrearRecursoDto): Promise<RecursoDto> => {
    return request<RecursoDto>('recursos', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  actualizarRecurso: async (id: string, dto: CrearRecursoDto): Promise<RecursoDto> => {
    return request<RecursoDto>(`recursos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    });
  },

  actualizarUmbralesStock: async (
    id: string,
    dto: { stockMinimo: number; stockMaximo?: number | null; puntoReorden?: number | null }
  ): Promise<RecursoDto> => {
    return request<RecursoDto>(`recursos/${id}/stock-minimo`, {
      method: 'PATCH',
      body: JSON.stringify(dto)
    });
  },

  duplicarRecurso: async (id: string, dto: DuplicarRecursoDto): Promise<RecursoDto> => {
    return request<RecursoDto>(`recursos/${id}/duplicar`, {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  cambiarEstadoRecurso: async (id: string, activo: boolean): Promise<void> => {
    return request<void>(`recursos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo })
    });
  },

  desactivarRecurso: async (id: string): Promise<void> => {
    return request<void>(`recursos/${id}`, {
      method: 'DELETE'
    });
  },

  // Fotos de Recursos (Supabase Storage privado)
  listarFotosRecurso: async (recursoId: string) => {
    return request<Array<{ id: string; urlArchivo: string; esPrincipal: boolean; orden: number; creadoEn: string }>>(
      `recursos/${recursoId}/fotos`
    );
  },

  subirFotoRecurso: async (recursoId: string, archivo: File, esPrincipal: boolean = false) => {
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('esPrincipal', esPrincipal.toString());

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || (process.env.NODE_ENV === 'development' ? 'dev-token-uod' : undefined);
    const url = `${API_BASE_URL.replace(/\/+$/, '')}/recursos/${recursoId}/fotos`;

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      let problem: any;
      try { problem = await res.json(); } catch {}
      throw new Error(problem?.detail || problem?.title || `Error al subir fotografía (${res.status})`);
    }

    return await res.json();
  },

  establecerFotoPrincipal: async (recursoId: string, fotoId: string): Promise<void> => {
    return request<void>(`recursos/${recursoId}/fotos/${fotoId}/principal`, {
      method: 'PUT'
    });
  },

  reordenarFotosRecurso: async (recursoId: string, fotosOrdenadasIds: string[]): Promise<void> => {
    return request<void>(`recursos/${recursoId}/fotos/reordenar`, {
      method: 'PUT',
      body: JSON.stringify({ fotosOrdenadasIds })
    });
  },

  eliminarFotoRecurso: async (recursoId: string, fotoId: string): Promise<void> => {
    return request<void>(`recursos/${recursoId}/fotos/${fotoId}`, {
      method: 'DELETE'
    });
  },

  // Códigos y QR (Resolución universal y gestión)
  resolverCodigo: async (codigo: string): Promise<ResolucionCodigoDto> => {
    return request<ResolucionCodigoDto>(`codigos/resolver?codigo=${encodeURIComponent(codigo)}`);
  },

  listarCodigosRecurso: async (recursoId: string): Promise<RecursoCodigoDto[]> => {
    return request<RecursoCodigoDto[]>(`recursos/${recursoId}/codigos`);
  },

  agregarCodigoRecurso: async (recursoId: string, dto: AgregarCodigoRecursoDto): Promise<RecursoCodigoDto> => {
    return request<RecursoCodigoDto>(`recursos/${recursoId}/codigos`, {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  eliminarCodigoRecurso: async (recursoId: string, codigoId: string): Promise<void> => {
    return request<void>(`recursos/${recursoId}/codigos/${codigoId}`, {
      method: 'DELETE'
    });
  },

  obtenerEnlaceQrRecurso: async (recursoId: string): Promise<EnlaceQrDto> => {
    return request<EnlaceQrDto>(`recursos/${recursoId}/qr/enlace`);
  },

  obtenerUrlDescargaQr: (recursoId: string): string => {
    const baseUrl = API_BASE_URL.replace(/\/+$/, '');
    return `${baseUrl}/recursos/${recursoId}/qr/imagen`;
  },

  // ==========================================
  // Existencias y Stock Mínimo (RF-12)
  // ==========================================
  obtenerResumenExistencias: async (filtros: Partial<ExistenciaFiltrosDto> = {}): Promise<PagedResult<ResumenStockRecursoDto>> => {
    const query = new URLSearchParams();
    if (filtros.pageIndex) query.append('pageIndex', String(filtros.pageIndex));
    if (filtros.pageSize) query.append('pageSize', String(filtros.pageSize));
    if (filtros.recursoId) query.append('recursoId', filtros.recursoId);
    if (filtros.ubicacionId) query.append('ubicacionId', filtros.ubicacionId);
    if (filtros.soloStockBajo !== undefined) query.append('soloStockBajo', String(filtros.soloStockBajo));
    if (filtros.soloAgotados !== undefined) query.append('soloAgotados', String(filtros.soloAgotados));
    if (filtros.proximosAVencer !== undefined) query.append('proximosAVencer', String(filtros.proximosAVencer));
    if (filtros.search) query.append('search', filtros.search);
    if (filtros.sortBy) query.append('sortBy', filtros.sortBy);
    if (filtros.isDescending !== undefined) query.append('isDescending', String(filtros.isDescending));

    const qs = query.toString();
    return request<PagedResult<ResumenStockRecursoDto>>(`existencias${qs ? `?${qs}` : ''}`);
  },

  obtenerStockPorRecurso: async (recursoId: string): Promise<ResumenStockRecursoDto> => {
    return request<ResumenStockRecursoDto>(`existencias/recurso/${recursoId}`);
  },

  obtenerExistenciasDetalladas: async (recursoId?: string, ubicacionId?: string): Promise<ExistenciaDto[]> => {
    const query = new URLSearchParams();
    if (recursoId) query.append('recursoId', recursoId);
    if (ubicacionId) query.append('ubicacionId', ubicacionId);

    const qs = query.toString();
    return request<ExistenciaDto[]>(`existencias/detalladas${qs ? `?${qs}` : ''}`);
  },

  obtenerAlertasStockBajo: async (): Promise<ResumenStockRecursoDto[]> => {
    return request<ResumenStockRecursoDto[]>('existencias/alertas/stock-bajo');
  },

  obtenerAlertasVencimientos: async (diasAnticipacion: number = 30): Promise<ExistenciaPorLoteDto[]> => {
    return request<ExistenciaPorLoteDto[]>(`existencias/alertas/vencimientos?diasAnticipacion=${diasAnticipacion}`);
  },

  // ==========================================
  // Movimientos Transaccionales (Prompt 7.3)
  // ==========================================
  registrarMovimiento: async (dto: CrearMovimientoDto, idempotencyKey?: string): Promise<MovimientoDto> => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }
    return request<MovimientoDto>('movimientos', {
      method: 'POST',
      body: JSON.stringify(dto),
      headers
    });
  },

  previsualizarMovimiento: async (dto: CrearMovimientoDto): Promise<PrevisualizarMovimientoResultadoDto> => {
    return request<PrevisualizarMovimientoResultadoDto>('movimientos/previsualizar', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  listarMovimientos: async (filtros: Partial<MovimientoFiltrosDto> = {}): Promise<PagedResult<MovimientoDto>> => {
    const query = new URLSearchParams();
    if (filtros.tipo) query.append('tipo', filtros.tipo);
    if (filtros.ubicacionId) query.append('ubicacionId', filtros.ubicacionId);
    if (filtros.recursoId) query.append('recursoId', filtros.recursoId);
    if (filtros.usuarioId) query.append('usuarioId', filtros.usuarioId);
    if (filtros.fechaDesde) query.append('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) query.append('fechaHasta', filtros.fechaHasta);
    if (filtros.search) query.append('search', filtros.search);
    if (filtros.pageIndex) query.append('pageIndex', String(filtros.pageIndex));
    if (filtros.pageSize) query.append('pageSize', String(filtros.pageSize));
    if (filtros.sortBy) query.append('sortBy', filtros.sortBy);
    if (filtros.isDescending !== undefined) query.append('isDescending', String(filtros.isDescending));

    const qs = query.toString();
    return request<PagedResult<MovimientoDto>>(`movimientos${qs ? `?${qs}` : ''}`);
  },

  obtenerMovimientoPorId: async (id: string): Promise<MovimientoDto> => {
    return request<MovimientoDto>(`movimientos/${id}`);
  },

  exportarMovimientosCsv: async (filtros: Partial<MovimientoFiltrosDto> = {}): Promise<void> => {
    const query = new URLSearchParams();
    if (filtros.tipo) query.append('tipo', filtros.tipo);
    if (filtros.ubicacionId) query.append('ubicacionId', filtros.ubicacionId);
    if (filtros.recursoId) query.append('recursoId', filtros.recursoId);
    if (filtros.usuarioId) query.append('usuarioId', filtros.usuarioId);
    if (filtros.fechaDesde) query.append('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) query.append('fechaHasta', filtros.fechaHasta);
    if (filtros.search) query.append('search', filtros.search);

    const qs = query.toString();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || (process.env.NODE_ENV === 'development' ? 'dev-token-uod' : undefined);
    const url = `${API_BASE_URL.replace(/\/+$/, '')}/movimientos/exportar${qs ? `?${qs}` : ''}`;

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Error al exportar movimientos: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `movimientos_siia_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  },

  // ==========================================
  // Activos Fijos y Series (Prompt 8.1)
  // ==========================================
  listarActivos: async (filtros: Partial<ActivoFiltrosDto> = {}): Promise<PagedResult<ActivoSerieDto>> => {
    const query = new URLSearchParams();
    if (filtros.pageIndex) query.append('pageIndex', String(filtros.pageIndex));
    if (filtros.pageSize) query.append('pageSize', String(filtros.pageSize));
    if (filtros.search) query.append('search', filtros.search);
    if (filtros.recursoId) query.append('recursoId', filtros.recursoId);
    if (filtros.categoriaId) query.append('categoriaId', filtros.categoriaId);
    if (filtros.ubicacionId) query.append('ubicacionId', filtros.ubicacionId);
    if (filtros.responsableId) query.append('responsableId', filtros.responsableId);
    if (filtros.estado) query.append('estado', filtros.estado);
    if (filtros.custodio) query.append('custodio', filtros.custodio);
    if (filtros.placaInstitucional) query.append('placaInstitucional', filtros.placaInstitucional);
    if (filtros.sortBy) query.append('sortBy', filtros.sortBy);
    if (filtros.isDescending !== undefined) query.append('isDescending', String(filtros.isDescending));

    const qs = query.toString();
    return request<PagedResult<ActivoSerieDto>>(`activos${qs ? `?${qs}` : ''}`);
  },

  obtenerActivoPorId: async (id: string): Promise<ActivoSerieDetalleDto> => {
    return request<ActivoSerieDetalleDto>(`activos/${id}`);
  },

  obtenerActivoPorPlaca: async (placa: string): Promise<ActivoSerieDetalleDto> => {
    return request<ActivoSerieDetalleDto>(`activos/placa/${encodeURIComponent(placa)}`);
  },

  crearActivo: async (dto: CrearActivoSerieDto): Promise<ActivoSerieDto> => {
    return request<ActivoSerieDto>('activos', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  actualizarActivo: async (id: string, dto: ActualizarActivoSerieDto): Promise<ActivoSerieDto> => {
    return request<ActivoSerieDto>(`activos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    });
  },

  cambiarEstadoActivo: async (id: string, dto: CambiarEstadoActivoDto): Promise<ActivoSerieDto> => {
    return request<ActivoSerieDto>(`activos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(dto)
    });
  },

  darDeBajaActivo: async (id: string, motivo?: string): Promise<ActivoSerieDto> => {
    const qs = motivo ? `?motivo=${encodeURIComponent(motivo)}` : '';
    return request<ActivoSerieDto>(`activos/${id}${qs}`, {
      method: 'DELETE'
    });
  },

  eliminarActivoDefinitivo: async (id: string): Promise<void> => {
    return request<void>(`activos/${id}/definitivo`, {
      method: 'DELETE'
    });
  },

  trasladarActivo: async (id: string, dto: TrasladarActivoDto): Promise<ResultadoTrasladoActivoDto> => {
    return request<ResultadoTrasladoActivoDto>(`activos/${id}/trasladar`, {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  asignarCustodioActivo: async (id: string, dto: AsignarCustodioDto): Promise<ResultadoTrasladoActivoDto> => {
    return request<ResultadoTrasladoActivoDto>(`activos/${id}/asignar-custodio`, {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  obtenerActaEntrega: async (id: string): Promise<ActaEntregaRecepcionDto> => {
    return request<ActaEntregaRecepcionDto>(`activos/${id}/acta-entrega`);
  },

  procesarBajaPatrimonial: async (id: string, dto: DarDeBajaActivoDto): Promise<ResultadoBajaActivoDto> => {
    return request<ResultadoBajaActivoDto>(`activos/${id}/descargo`, {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  obtenerActaDescargo: async (id: string): Promise<ActaDescargoPatrimonialDto> => {
    return request<ActaDescargoPatrimonialDto>(`activos/${id}/acta-descargo`);
  },

  subirFacturaActivo: async (id: string, file: File): Promise<ActivoSerieDto> => {
    const formData = new FormData();
    formData.append('archivo', file);
    return request<ActivoSerieDto>(`activos/${id}/factura`, {
      method: 'POST',
      body: formData
    });
  },

  eliminarFacturaActivo: async (id: string): Promise<ActivoSerieDto> => {
    return request<ActivoSerieDto>(`activos/${id}/factura`, {
      method: 'DELETE'
    });
  },

  obtenerHistorialActivo: async (id: string): Promise<ActivoHistorialCambioDto[]> => {
    return request<ActivoHistorialCambioDto[]>(`activos/${id}/historial`);
  },

  // ==========================================
  // Depreciación Contable y Valor en Libros (DGII Cat. 2 - Prompt 8.3)
  // ==========================================
  obtenerResumenDepreciacion: async (fechaCorte?: string): Promise<ResumenDepreciacionContableDto> => {
    const qs = fechaCorte ? `?fechaCorte=${encodeURIComponent(fechaCorte)}` : '';
    return request<ResumenDepreciacionContableDto>(`depreciacion/resumen${qs}`);
  },

  listarReporteDepreciacion: async (filtros: Partial<FiltroDepreciacionDto> = {}): Promise<PagedResult<CalculoDepreciacionActivoDto>> => {
    const query = new URLSearchParams();
    if (filtros.pageIndex) query.append('pageIndex', String(filtros.pageIndex));
    if (filtros.pageSize) query.append('pageSize', String(filtros.pageSize));
    if (filtros.search) query.append('search', filtros.search);
    if (filtros.fechaCorte) query.append('fechaCorte', filtros.fechaCorte);
    if (filtros.categoriaId) query.append('categoriaId', filtros.categoriaId);
    if (filtros.ubicacionId) query.append('ubicacionId', filtros.ubicacionId);
    if (filtros.soloConValorEnLibros !== undefined) query.append('soloConValorEnLibros', String(filtros.soloConValorEnLibros));
    if (filtros.soloTotalmenteDepreciados !== undefined) query.append('soloTotalmenteDepreciados', String(filtros.soloTotalmenteDepreciados));
    if (filtros.sortBy) query.append('sortBy', filtros.sortBy);
    if (filtros.isDescending !== undefined) query.append('isDescending', String(filtros.isDescending));

    const qs = query.toString();
    return request<PagedResult<CalculoDepreciacionActivoDto>>(`depreciacion/reporte${qs ? `?${qs}` : ''}`);
  },

  obtenerDepreciacionActivo: async (id: string, fechaCorte?: string): Promise<CalculoDepreciacionActivoDto> => {
    const qs = fechaCorte ? `?fechaCorte=${encodeURIComponent(fechaCorte)}` : '';
    return request<CalculoDepreciacionActivoDto>(`depreciacion/activo/${id}${qs}`);
  },

  obtenerTablaAmortizacionActivo: async (id: string): Promise<TablaAmortizacionActivoDto> => {
    return request<TablaAmortizacionActivoDto>(`depreciacion/activo/${id}/tabla`);
  },

  exportarDepreciacionCsv: async (filtros: Partial<FiltroDepreciacionDto> = {}): Promise<void> => {
    const query = new URLSearchParams();
    if (filtros.fechaCorte) query.append('fechaCorte', filtros.fechaCorte);
    if (filtros.categoriaId) query.append('categoriaId', filtros.categoriaId);
    if (filtros.ubicacionId) query.append('ubicacionId', filtros.ubicacionId);
    if (filtros.search) query.append('search', filtros.search);
    if (filtros.soloConValorEnLibros !== undefined) query.append('soloConValorEnLibros', String(filtros.soloConValorEnLibros));
    if (filtros.soloTotalmenteDepreciados !== undefined) query.append('soloTotalmenteDepreciados', String(filtros.soloTotalmenteDepreciados));

    const qs = query.toString();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || (process.env.NODE_ENV === 'development' ? 'dev-token-uod' : undefined);
    const url = `${API_BASE_URL.replace(/\/+$/, '')}/depreciacion/exportar${qs ? `?${qs}` : ''}`;

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Error al exportar reporte de depreciación: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `depreciacion_activos_uod_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  },

  // ==========================================
  // Mantenimientos y Servicios Técnicos (Prompt 8.4)
  // ==========================================
  listarMantenimientos: async (filtros: Partial<MantenimientoFiltrosDto> = {}): Promise<PagedResult<MantenimientoDto>> => {
    const query = new URLSearchParams();
    if (filtros.pageIndex) query.append('pageIndex', String(filtros.pageIndex));
    if (filtros.pageSize) query.append('pageSize', String(filtros.pageSize));
    if (filtros.search) query.append('search', filtros.search);
    if (filtros.activoSerieId) query.append('activoSerieId', filtros.activoSerieId);
    if (filtros.placaInstitucional) query.append('placaInstitucional', filtros.placaInstitucional);
    if (filtros.tipo) query.append('tipo', filtros.tipo);
    if (filtros.estado) query.append('estado', filtros.estado);
    if (filtros.proveedorId) query.append('proveedorId', filtros.proveedorId);
    if (filtros.fechaDesde) query.append('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) query.append('fechaHasta', filtros.fechaHasta);

    const qs = query.toString();
    return request<PagedResult<MantenimientoDto>>(`mantenimientos${qs ? `?${qs}` : ''}`);
  },

  obtenerMantenimientoPorId: async (id: string): Promise<MantenimientoDto> => {
    return request<MantenimientoDto>(`mantenimientos/${id}`);
  },

  listarMantenimientosPorActivo: async (activoId: string): Promise<MantenimientoDto[]> => {
    return request<MantenimientoDto[]>(`mantenimientos/activo/${activoId}`);
  },

  obtenerResumenMantenimientosActivo: async (activoId: string): Promise<ResumenMantenimientosActivoDto> => {
    return request<ResumenMantenimientosActivoDto>(`mantenimientos/activo/${activoId}/resumen`);
  },

  registrarMantenimiento: async (dto: CrearMantenimientoDto): Promise<MantenimientoDto> => {
    return request<MantenimientoDto>('mantenimientos', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  actualizarMantenimiento: async (id: string, dto: ActualizarMantenimientoDto): Promise<MantenimientoDto> => {
    return request<MantenimientoDto>(`mantenimientos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    });
  },

  completarMantenimiento: async (id: string, dto: CompletarMantenimientoDto): Promise<MantenimientoDto> => {
    return request<MantenimientoDto>(`mantenimientos/${id}/completar`, {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  cancelarMantenimiento: async (id: string, dto: CancelarMantenimientoDto): Promise<MantenimientoDto> => {
    return request<MantenimientoDto>(`mantenimientos/${id}/cancelar`, {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  // ==========================================
  // Asistente de IA SIIA (Etapa 9 & 10 - Prompts 9.3 a 10.6)
  // ==========================================
  enviarMensajeAsistente: async (dto: ChatRequestDto): Promise<ChatResponseDto> => {
    return request<ChatResponseDto>('assistant/chat', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  obtenerInfoAsistente: async (): Promise<any> => {
    return request<any>('assistant/info');
  },

  obtenerConsumoAsistente: async (): Promise<any> => {
    return request<any>('assistant/consumo');
  },

  confirmarPropuestaAsistente: async (propuestaId: string): Promise<ResultadoConfirmacionPropuestaDto> => {
    return request<ResultadoConfirmacionPropuestaDto>(`assistant/propuestas/${propuestaId}/confirmar`, {
      method: 'POST'
    });
  },

  cancelarPropuestaAsistente: async (propuestaId: string): Promise<{ exitoso: boolean; mensaje: string }> => {
    return request<{ exitoso: boolean; mensaje: string }>(`assistant/propuestas/${propuestaId}/cancelar`, {
      method: 'POST'
    });
  },

  revertirPropuestaAsistente: async (propuestaId: string): Promise<ResultadoConfirmacionPropuestaDto> => {
    return request<ResultadoConfirmacionPropuestaDto>(`assistant/propuestas/${propuestaId}/revertir`, {
      method: 'POST'
    });
  },

  analizarFotoRecurso: async (dto: AnalisisFotoRecursoDto): Promise<PropuestaRecursoDesdeFotoDto> => {
    return request<PropuestaRecursoDesdeFotoDto>('assistant/analizar-foto', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  // ==========================================
  // Alertas y Notificaciones (Etapa 11)
  // ==========================================
  listarAlertas: async (filtros?: AlertaFiltrosDto): Promise<PagedResult<AlertaDto>> => {
    const params = new URLSearchParams();
    if (filtros?.tipo) params.set('tipo', filtros.tipo);
    if (filtros?.severidad) params.set('severidad', filtros.severidad);
    if (filtros?.leida !== undefined) params.set('leida', filtros.leida.toString());
    if (filtros?.recursoId) params.set('recursoId', filtros.recursoId);
    if (filtros?.ubicacionId) params.set('ubicacionId', filtros.ubicacionId);
    if (filtros?.pagina) params.set('pagina', filtros.pagina.toString());
    if (filtros?.tamanoPagina) params.set('tamanoPagina', filtros.tamanoPagina.toString());

    const qs = params.toString();
    return request<PagedResult<AlertaDto>>(`alertas${qs ? `?${qs}` : ''}`);
  },

  obtenerResumenAlertas: async (): Promise<ResumenAlertasDto> => {
    return request<ResumenAlertasDto>('alertas/resumen');
  },

  obtenerConteoAlertasNoLeidas: async (): Promise<number> => {
    const res = await request<{ noLeidas: number }>('alertas/conteo-no-leidas');
    return res?.noLeidas ?? 0;
  },

  obtenerAlerta: async (id: string): Promise<AlertaDto> => {
    return request<AlertaDto>(`alertas/${id}`);
  },

  evaluarReglasAlertas: async (): Promise<EvaluacionAlertasResultadoDto> => {
    return request<EvaluacionAlertasResultadoDto>('alertas/evaluar', {
      method: 'POST'
    });
  },

  marcarAlertaLeida: async (id: string): Promise<void> => {
    return request<void>(`alertas/${id}/leida`, {
      method: 'PATCH'
    });
  },

  marcarTodasAlertasLeidas: async (): Promise<{ total: number }> => {
    return request<{ total: number }>('alertas/marcar-todas-leidas', {
      method: 'POST'
    });
  },

  eliminarAlerta: async (id: string): Promise<void> => {
    return request<void>(`alertas/${id}`, {
      method: 'DELETE'
    });
  },

  eliminarTodasAlertas: async (): Promise<{ mensaje: string; total: number }> => {
    return request<{ mensaje: string; total: number }>('alertas/todas', {
      method: 'DELETE'
    });
  },

  obtenerPreferenciasNotificacion: async (): Promise<NotificacionPreferenciaDto> => {
    return request<NotificacionPreferenciaDto>('notificaciones/preferencias');
  },

  actualizarPreferenciasNotificacion: async (dto: ActualizarPreferenciaDto): Promise<NotificacionPreferenciaDto> => {
    return request<NotificacionPreferenciaDto>('notificaciones/preferencias', {
      method: 'PUT',
      body: JSON.stringify(dto)
    });
  },

  // ==========================================
  // Compras y Recepción (Etapa 12)
  // ==========================================
  listarOrdenesCompra: async (filtros?: OrdenCompraFiltrosDto): Promise<PagedResult<OrdenCompraDto>> => {
    const params = new URLSearchParams();
    if (filtros?.busqueda) params.set('busqueda', filtros.busqueda);
    if (filtros?.estado) params.set('estado', filtros.estado);
    if (filtros?.proveedorId) params.set('proveedorId', filtros.proveedorId);
    if (filtros?.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
    if (filtros?.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);
    if (filtros?.page) params.set('page', filtros.page.toString());
    if (filtros?.pageSize) params.set('pageSize', filtros.pageSize.toString());

    const qs = params.toString();
    return request<PagedResult<OrdenCompraDto>>(`compras/ordenes${qs ? `?${qs}` : ''}`);
  },

  obtenerOrdenCompraPorId: async (id: string): Promise<OrdenCompraDto> => {
    return request<OrdenCompraDto>(`compras/ordenes/${id}`);
  },

  crearOrdenCompra: async (dto: CrearOrdenCompraDto): Promise<OrdenCompraDto> => {
    return request<OrdenCompraDto>('compras/ordenes', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  actualizarOrdenCompra: async (id: string, dto: ActualizarOrdenCompraDto): Promise<OrdenCompraDto> => {
    return request<OrdenCompraDto>(`compras/ordenes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    });
  },

  cambiarEstadoOrdenCompra: async (id: string, dto: CambiarEstadoOrdenDto): Promise<OrdenCompraDto> => {
    return request<OrdenCompraDto>(`compras/ordenes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(dto)
    });
  },

  recibirMercanciaOrdenCompra: async (id: string, dto: RecepcionCompraDto): Promise<OrdenCompraDto> => {
    return request<OrdenCompraDto>(`compras/ordenes/${id}/recepcion`, {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  obtenerSugerenciasStockBajo: async (proveedorId?: string): Promise<SugerenciaOrdenStockBajoDto[]> => {
    const qs = proveedorId ? `?proveedorId=${proveedorId}` : '';
    return request<SugerenciaOrdenStockBajoDto[]>(`compras/sugerencias-stock-bajo${qs}`);
  },

  // ==========================================
  // Conteos Físicos y Auditoría (Etapa 12)
  // ==========================================
  listarConteosFisicos: async (filtros?: ConteoFisicoFiltrosDto): Promise<PagedResult<ConteoFisicoDto>> => {
    const params = new URLSearchParams();
    if (filtros?.ubicacionId) params.set('ubicacionId', filtros.ubicacionId);
    if (filtros?.estado) params.set('estado', filtros.estado);
    if (filtros?.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
    if (filtros?.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);
    if (filtros?.page) params.set('page', filtros.page.toString());
    if (filtros?.pageSize) params.set('pageSize', filtros.pageSize.toString());

    const qs = params.toString();
    return request<PagedResult<ConteoFisicoDto>>(`conteos-fisicos${qs ? `?${qs}` : ''}`);
  },

  obtenerConteoFisicoPorId: async (id: string): Promise<ConteoFisicoDto> => {
    return request<ConteoFisicoDto>(`conteos-fisicos/${id}`);
  },

  iniciarConteoFisico: async (dto: IniciarConteoFisicoDto): Promise<ConteoFisicoDto> => {
    return request<ConteoFisicoDto>('conteos-fisicos', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  sincronizarLineasConteo: async (id: string, dto: SincronizarConteosDto): Promise<ConteoFisicoDto> => {
    return request<ConteoFisicoDto>(`conteos-fisicos/${id}/lineas`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    });
  },

  escanearItemConteo: async (id: string, dto: EscanearItemConteoDto): Promise<ConteoFisicoDto> => {
    return request<ConteoFisicoDto>(`conteos-fisicos/${id}/escanear`, {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  conciliarConteoFisico: async (id: string, dto: ConciliarConteoDto): Promise<ConteoFisicoDto> => {
    return request<ConteoFisicoDto>(`conteos-fisicos/${id}/conciliar`, {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  cancelarConteoFisico: async (id: string, motivo?: string): Promise<ConteoFisicoDto> => {
    const qs = motivo ? `?motivo=${encodeURIComponent(motivo)}` : '';
    return request<ConteoFisicoDto>(`conteos-fisicos/${id}/cancelar${qs}`, {
      method: 'POST'
    });
  },

  eliminarConteoFisico: async (id: string): Promise<void> => {
    return request<void>(`conteos-fisicos/${id}`, {
      method: 'DELETE'
    });
  },

  // ==========================================
  // Importación Masiva (Etapa 12)
  // ==========================================
  descargarPlantillaCsvImportacion: async (): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || (process.env.NODE_ENV === 'development' ? 'dev-token-uod' : undefined);
    const url = `${API_BASE_URL.replace(/\/+$/, '')}/importacion/plantilla-csv`;

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Error al descargar plantilla CSV: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `plantilla_recursos_siia.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  },

  validarFilasImportacion: async (filas: ImportarRecursoFilaDto[]): Promise<ResultadoValidacionImportacionDto> => {
    return request<ResultadoValidacionImportacionDto>('importacion/validar', {
      method: 'POST',
      body: JSON.stringify(filas)
    });
  },

  ejecutarImportacionRecursos: async (filas: ImportarRecursoFilaDto[]): Promise<ResultadoImportacionDto> => {
    return request<ResultadoImportacionDto>('importacion/ejecutar', {
      method: 'POST',
      body: JSON.stringify({ filas })
    });
  },

  // ==========================================
  // Reportes y Analítica Ejecutiva (Etapa 13)
  // ==========================================
  obtenerResumenEjecutivo: async (): Promise<ResumenEjecutivoDto> => {
    return request<ResumenEjecutivoDto>('reportes/resumen-ejecutivo');
  },

  obtenerRotacionConsumibles: async (): Promise<RotacionConsumibleItemDto[]> => {
    return request<RotacionConsumibleItemDto[]>('reportes/rotacion-consumibles');
  },

  obtenerDistribucionParqueTi: async (): Promise<DistribucionParqueTiDto[]> => {
    return request<DistribucionParqueTiDto[]>('reportes/distribucion-parque-ti');
  },

  obtenerReporteProveedores: async (): Promise<ReporteOrdenesProveedorDto[]> => {
    return request<ReporteOrdenesProveedorDto[]>('reportes/proveedores');
  },

  exportarReportePatrimonialCsv: async (): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || (process.env.NODE_ENV === 'development' ? 'dev-token-uod' : undefined);
    const url = `${API_BASE_URL.replace(/\/+$/, '')}/reportes/exportar-patrimonial-csv`;

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Error al exportar reporte patrimonial: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `reporte_patrimonial_uod_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  }
};

export interface ChatMessageDto {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp?: string;
}

export interface ChatRequestDto {
  message: string;
  history?: ChatMessageDto[];
  mode?: 'operativo' | 'tutor';
  pantallaActual?: string;
}

export interface PropuestaAccionDto {
  id: string;
  tipo: string;
  recursoId?: string;
  recursoNombre: string;
  recursoSku?: string;
  activoId?: string;
  placaInstitucional?: string;
  cantidad: number;
  origenId?: string;
  origenNombre?: string;
  destinoId?: string;
  destinoNombre?: string;
  stockActualOrigen?: number;
  stockNuevoOrigen?: number;
  motivo: string;
  dictamenTecnico?: string;
  creadoEn: string;
  confirmado: boolean;
}

export interface ChatResponseDto {
  text: string;
  mode: string;
  toolCallsEjecutadas: string[];
  propuesta?: PropuestaAccionDto | null;
  isLiveGemini: boolean;
  costoEstimadoDop: number;
}

export interface ResultadoConfirmacionPropuestaDto {
  exitoso: boolean;
  mensaje: string;
  propuestaId: string;
  movimientoCorrelativo?: string;
  movimientoId?: string;
  recursoId?: string;
  activoId?: string;
  placaInstitucional?: string;
  esReversible: boolean;
  revertido: boolean;
  confirmadoEn: string;
}

export interface AnalisisFotoRecursoDto {
  fotoBase64: string;
  mimeType?: string;
  observacionesUsuario?: string;
}

export interface PropuestaRecursoDesdeFotoDto {
  nombreSugerido: string;
  skuSugerido?: string;
  categoriaSugerida: string;
  tipoEquipo: string;
  marcaModelo: string;
  descripcion: string;
  costoEstimadoSugeridoDop: number;
  posibleDuplicado: boolean;
  recursoSimilarEncontrado?: string;
  confianzaAnalisis: string;
}

export interface AlertaDto {
  id: string;
  tipo: 'stock_bajo' | 'proximo_vencimiento' | 'mantenimiento_vencido' | 'anomalia_conteo' | 'sistema';
  severidad: 'info' | 'advertencia' | 'urgente';
  recursoId?: string | null;
  recursoNombre?: string | null;
  recursoSku?: string | null;
  ubicacionId?: string | null;
  ubicacionNombre?: string | null;
  titulo: string;
  mensaje: string;
  leida: boolean;
  creadoEn: string;
}

export interface AlertaFiltrosDto {
  tipo?: string;
  severidad?: string;
  leida?: boolean;
  recursoId?: string;
  ubicacionId?: string;
  pagina?: number;
  tamanoPagina?: number;
}

export interface ResumenAlertasDto {
  totalNoLeidas: number;
  totalUrgentes: number;
  totalAdvertencias: number;
  totalInfo: number;
  porTipo: Record<string, number>;
}

export interface EvaluacionAlertasResultadoDto {
  alertasGeneradas: number;
  alertasOmitidasExistentes: number;
  mensajes: string[];
}

export interface NotificacionPreferenciaDto {
  id: string;
  usuarioId: string;
  recibirAlertasStock: boolean;
  recibirAlertasMantenimiento: boolean;
  recibirResumenSemanal: boolean;
  actualizadoEn: string;
}

export interface ActualizarPreferenciaDto {
  recibirAlertasStock: boolean;
  recibirAlertasMantenimiento: boolean;
  recibirResumenSemanal: boolean;
}

// ==========================================
// Órdenes de Compra y Recepción (Etapa 12)
// ==========================================
export interface OrdenCompraLineaDto {
  id: string;
  ordenId: string;
  recursoId: string;
  recursoSku: string;
  recursoNombre: string;
  recursoTipo: string;
  unidadMedida: string;
  cantidadSolicitada: number;
  cantidadRecibida: number;
  cantidadPendiente: number;
  precioUnitarioEstimado: number;
  subtotalEstimado: number;
  subtotalRecibido: number;
}

export interface OrdenCompraDto {
  id: string;
  numeroOrden: string;
  proveedorId: string;
  proveedorNombre: string;
  proveedorRnc?: string | null;
  proveedorContacto?: string | null;
  proveedorTelefono?: string | null;
  proveedorCorreo?: string | null;
  solicitanteId: string;
  solicitanteNombre: string;
  solicitanteCorreo: string;
  estado: 'borrador' | 'aprobada' | 'enviada' | 'recibida_parcial' | 'recibida_total' | 'cancelada';
  fechaEmision: string;
  fechaEntregaEstimada?: string | null;
  observaciones?: string | null;
  totalLineas: number;
  totalUnidadesSolicitadas: number;
  totalUnidadesRecibidas: number;
  totalEstimado: number;
  porcentajeRecepcion: number;
  creadoEn: string;
  actualizadoEn: string;
  lineas: OrdenCompraLineaDto[];
}

export interface CrearOrdenCompraLineaDto {
  recursoId: string;
  cantidadSolicitada: number;
  precioUnitarioEstimado: number;
}

export interface CrearOrdenCompraDto {
  proveedorId: string;
  fechaEntregaEstimada?: string;
  observaciones?: string;
  lineas: CrearOrdenCompraLineaDto[];
}

export interface ActualizarOrdenCompraDto {
  proveedorId: string;
  fechaEntregaEstimada?: string;
  observaciones?: string;
  lineas: CrearOrdenCompraLineaDto[];
}

export interface CambiarEstadoOrdenDto {
  estado: 'borrador' | 'aprobada' | 'enviada' | 'cancelada';
  observaciones?: string;
}

export interface RecepcionLineaDto {
  lineaId: string;
  cantidadRecibida: number;
  numeroLote?: string;
  fechaVencimiento?: string;
}

export interface RecepcionCompraDto {
  ubicacionRecepcionId: string;
  conduceOReferencia?: string;
  observaciones?: string;
  lineas: RecepcionLineaDto[];
}

export interface OrdenCompraFiltrosDto {
  busqueda?: string;
  estado?: string;
  proveedorId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  pageSize?: number;
}

export interface SugerenciaOrdenStockBajoDto {
  recursoId: string;
  recursoSku: string;
  recursoNombre: string;
  categoriaNombre: string;
  proveedorSugeridoId?: string | null;
  proveedorSugeridoNombre?: string | null;
  stockActual: number;
  stockMinimo: number;
  puntoReorden: number;
  cantidadSugerida: number;
  costoUnitarioEstimado: number;
  subtotalEstimado: number;
}

// ==========================================
// Conteos Físicos e Inventario (Etapa 12)
// ==========================================
export interface ConteoLineaDto {
  id: string;
  conteoId: string;
  recursoId: string;
  recursoSku: string;
  recursoNombre: string;
  recursoTipo: string;
  unidadMedida: string;
  loteId?: string | null;
  numeroLote?: string | null;
  fechaVencimiento?: string | null;
  cantidadSistema: number;
  cantidadFisica: number;
  diferencia: number;
  ajusteMovimientoId?: string | null;
  ajusteMovimientoNumero?: string | null;
  notas?: string | null;
}

export interface ConteoFisicoDto {
  id: string;
  ubicacionId: string;
  ubicacionNombre: string;
  ubicacionCodigo: string;
  responsableId: string;
  responsableNombre: string;
  responsableCorreo: string;
  fechaInicio: string;
  fechaCierre?: string | null;
  estado: 'abierto' | 'conciliado' | 'cancelado';
  observaciones?: string | null;
  totalLineas: number;
  totalUnidadesSistema: number;
  totalUnidadesFisicas: number;
  totalDiscrepancias: number;
  creadoEn: string;
  lineas: ConteoLineaDto[];
}

export interface IniciarConteoFisicoDto {
  ubicacionId: string;
  observaciones?: string;
  precargarExistenciasSistema?: boolean;
}

export interface ActualizarLineaConteoDto {
  recursoId: string;
  loteId?: string;
  cantidadFisica: number;
  notas?: string;
}

export interface SincronizarConteosDto {
  lineas: ActualizarLineaConteoDto[];
}

export interface EscanearItemConteoDto {
  codigo: string;
  cantidadSumar?: number;
  notas?: string;
}

export interface ConciliarConteoDto {
  observaciones?: string;
}

export interface ConteoFisicoFiltrosDto {
  ubicacionId?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  pageSize?: number;
}

export interface ImportarRecursoFilaDto {
  numeroFila?: number;
  sku: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  tipo?: string;
  unidadMedida?: string;
  stockMinimo?: number;
  stockMaximo?: number;
  puntoReorden?: number;
  costoEstimado?: number;
}

export interface FilaValidacionErrorDto {
  numeroFila: number;
  sku?: string;
  nombre?: string;
  campo: string;
  mensaje: string;
}

export interface ResultadoValidacionImportacionDto {
  totalFilas: number;
  filasValidas: number;
  filasConError: number;
  posiblesDuplicados: number;
  errores: FilaValidacionErrorDto[];
  recursosValidos: ImportarRecursoFilaDto[];
}

export interface ResultadoImportacionDto {
  recursosCreados: number;
  recursosOmitidos: number;
  totalProcesados: number;
  mensaje: string;
}

export interface ResumenEjecutivoDto {
  totalRecursosCatalogo: number;
  totalActivosFisicos: number;
  equiposEnUso: number;
  equiposEnAlmacen: number;
  equiposEnMantenimiento: number;
  equiposDeBaja: number;
  totalStockConsumibles: number;
  alertasStockBajo: number;
  ordenesCompraActivas: number;
  valorPatrimonialHistoricoDop: number;
  depreciacionAcumuladaDop: number;
  valorNetoEnLibrosDop: number;
  exactitudInventarioPorcentaje: number;
  fechaGeneracion: string;
}

export interface RotacionConsumibleItemDto {
  recursoId: string;
  sku: string;
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  totalEntradas: number;
  totalSalidas: number;
  tasaRotacion: number;
  costoEstimadoUnitario: number;
  costoTotalConsumidoDop: number;
}

export interface DistribucionParqueTiDto {
  categoria: string;
  cantidadEquipos: number;
  enUso: number;
  enAlmacen: number;
  enMantenimiento: number;
  deBaja: number;
  porcentajeDelTotal: number;
}

export interface ReporteOrdenesProveedorDto {
  proveedorId: string;
  proveedorNombre: string;
  rnc?: string;
  totalOrdenes: number;
  ordenesCompletadas: number;
  montoTotalDop: number;
  tasaCumplimiento: number;
}







