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
  departamento?: string | null;
  telefono?: string | null;
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
}

export interface CrearMovimientoDto {
  tipo: 'entrada' | 'salida' | 'traslado' | 'ajuste' | 'devolucion' | 'baja';
  origenUbicacionId?: string | null;
  destinoUbicacionId?: string | null;
  motivo: string;
  comprobanteUrl?: string | null;
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
}

export interface PrevisualizarMovimientoResultadoDto {
  esValido: boolean;
  tipo: string;
  totalLineas: number;
  lineas: PrevisualizarMovimientoLineaDto[];
  errores: string[];
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
  }
};




