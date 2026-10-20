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
  // 1. Obtener token de Supabase Auth
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

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
    const token = session?.access_token;
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
  }
};




