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

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'DELETE', headers }),

  // Endpoints específicos del Dominio
  getMiPerfil: async (): Promise<PerfilUsuario> => {
    return request<PerfilUsuario>('me');
  },

  checkHealth: async () => {
    return request<{ estado: string; sistema: string }>('health');
  }
};
