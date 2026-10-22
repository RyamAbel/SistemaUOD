'use client';

import React, { useState, useMemo } from 'react';
import {
  Laptop,
  Cpu,
  Monitor,
  Volume2,
  Zap,
  Printer,
  Smartphone,
  Tv,
  Network,
  Keyboard,
  Mouse,
  Camera,
  Mic,
  Headphones,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Search,
  Filter,
  Eye,
  Pencil,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Box,
  MapPin,
  User,
  Copy,
  Check,
  Building2,
  SlidersHorizontal,
  FolderTree
} from 'lucide-react';
import { ActivoTI, RECURSOS_ORIGINALES } from '@/lib/inventoryData';

export interface GroupedAssetsViewProps {
  activos: ActivoTI[];
  onEditAsset?: (activo: ActivoTI) => void;
  onSelectAsset?: (activo: ActivoTI) => void;
  onTransferAsset?: (activo: ActivoTI) => void;
  ubicacionesDisponibles?: string[];
  initialSearch?: string;
}

// Configuración visual y descriptiva de los tipos de equipos institucionales
interface TipoConfig {
  key: string;
  nombre: string;
  descripcion: string;
  icono: React.FC<any>;
  colorFondo: string;
  colorTexto: string;
  bordeColor: string;
  gradiente: string;
  keywords: string[];
}

const TIPOS_CONFIG: TipoConfig[] = [
  {
    key: 'LAPTOP',
    nombre: 'Laptops y Portátiles',
    descripcion: 'Computadoras portátiles institucionales para docencia, gestión y clínicas',
    icono: Laptop,
    colorFondo: 'bg-blue-50',
    colorTexto: 'text-[#1C3177]',
    bordeColor: 'border-blue-200',
    gradiente: 'from-[#1C3177]/10 to-blue-500/10',
    keywords: ['LAPTOP', 'PORTATIL', 'NOTEBOOK', 'INSPIRON', 'LATITUDE', 'THINKPAD']
  },
  {
    key: 'CPU',
    nombre: 'Computadoras de Escritorio / CPU',
    descripcion: 'Unidades centrales de procesamiento, torres y computadoras fijas de oficina y laboratorios',
    icono: Cpu,
    colorFondo: 'bg-indigo-50',
    colorTexto: 'text-indigo-700',
    bordeColor: 'border-indigo-200',
    gradiente: 'from-indigo-600/10 to-blue-500/10',
    keywords: ['CPU', 'COMPUTADORA', 'THINKCENTRE', 'OPTIPLEX', 'GAMER', 'DESKTOP', 'TORRE', 'PC ']
  },
  {
    key: 'MONITOR',
    nombre: 'Monitores y Pantallas',
    descripcion: 'Monitores de trabajo clínico y administrativo de 22", 24" y 27"',
    icono: Monitor,
    colorFondo: 'bg-sky-50',
    colorTexto: 'text-sky-700',
    bordeColor: 'border-sky-200',
    gradiente: 'from-sky-500/10 to-cyan-500/10',
    keywords: ['MONITOR', 'PANTALLA', 'DISPLAY', 'AOC', 'DELL 24', 'HP 22', 'SAMSUNG 24']
  },
  {
    key: 'BOCINAS',
    nombre: 'Bocinas y Audio',
    descripcion: 'Sistemas de altavoces, parlantes y periféricos de salida acústica institucional',
    icono: Volume2,
    colorFondo: 'bg-emerald-50',
    colorTexto: 'text-emerald-700',
    bordeColor: 'border-emerald-200',
    gradiente: 'from-emerald-600/10 to-[#3DAA5C]/10',
    keywords: ['BOCINA', 'BOCINAS', 'SPEAKER', 'PARLANTE', 'LOGITECH Z', 'SONIDO']
  },
  {
    key: 'UPS',
    nombre: 'Sistemas UPS y Energía',
    descripcion: 'Equipos de alimentación ininterrumpida y protección eléctrica para clínicas y cómputo',
    icono: Zap,
    colorFondo: 'bg-amber-50',
    colorTexto: 'text-amber-800',
    bordeColor: 'border-amber-200',
    gradiente: 'from-amber-500/10 to-yellow-500/10',
    keywords: ['UPS', 'FORZA', 'APC', 'ENERGIA', 'REGULADOR', 'NO BREAK', 'BATERIA']
  },
  {
    key: 'IMPRESORA',
    nombre: 'Impresoras y Escáneres',
    descripcion: 'Impresoras multifuncionales de inyección, láser institucional y digitalizadores',
    icono: Printer,
    colorFondo: 'bg-teal-50',
    colorTexto: 'text-teal-700',
    bordeColor: 'border-teal-200',
    gradiente: 'from-teal-600/10 to-emerald-500/10',
    keywords: ['IMPRESORA', 'PRINTER', 'EPSON', 'HP DESKJET', 'LASERJET', 'CANON', 'SCANNER']
  },
  {
    key: 'TELEFONO',
    nombre: 'Teléfonos y Comunicación',
    descripcion: 'Smartphones institucionales, terminales telefónicas VoIP y telefonía de oficina',
    icono: Smartphone,
    colorFondo: 'bg-violet-50',
    colorTexto: 'text-violet-700',
    bordeColor: 'border-violet-200',
    gradiente: 'from-violet-600/10 to-purple-500/10',
    keywords: ['TELEFONO', 'IPHONE', 'NUBIA', 'SMARTPHONE', 'CELULAR', 'VOIP', 'GRANDSTREAM']
  },
  {
    key: 'TV',
    nombre: 'Audiovisual y Televisores',
    descripcion: 'Televisores de alta resolución y pizarras digitales interactivas para docencia',
    icono: Tv,
    colorFondo: 'bg-purple-50',
    colorTexto: 'text-purple-700',
    bordeColor: 'border-purple-200',
    gradiente: 'from-purple-600/10 to-pink-500/10',
    keywords: ['TV', 'TELEVISOR', 'PIZARRA', 'SMART TV', 'PANTALLA GIGANTE', 'TCL', 'LG TV']
  },
  {
    key: 'SWITCH',
    nombre: 'Redes y Telecomunicaciones',
    descripcion: 'Switches Ethernet, routers, puntos de acceso y equipamiento de infraestructura de red',
    icono: Network,
    colorFondo: 'bg-cyan-50',
    colorTexto: 'text-cyan-800',
    bordeColor: 'border-cyan-200',
    gradiente: 'from-cyan-600/10 to-blue-500/10',
    keywords: ['SWITCH', 'ROUTER', 'ACCESS POINT', 'RED', 'ETHERNET', 'CISCO', 'TP-LINK']
  },
  {
    key: 'CAMARA',
    nombre: 'Cámaras Web y Video',
    descripcion: 'Cámaras web institucionales para videoconferencias y streaming académico',
    icono: Camera,
    colorFondo: 'bg-rose-50',
    colorTexto: 'text-rose-700',
    bordeColor: 'border-rose-200',
    gradiente: 'from-rose-600/10 to-pink-500/10',
    keywords: ['CAMARA', 'WEBCAM', 'LOGITECH C', 'VIDEO']
  },
  {
    key: 'MICROFONO',
    nombre: 'Micrófonos y Grabación',
    descripcion: 'Micrófonos de escritorio, solapa y captura acústica para auditorios y salones',
    icono: Mic,
    colorFondo: 'bg-orange-50',
    colorTexto: 'text-orange-700',
    bordeColor: 'border-orange-200',
    gradiente: 'from-orange-500/10 to-amber-500/10',
    keywords: ['MICROFONO', 'FIFINE', 'MIC', 'CONDENSADOR', 'SHURE']
  },
  {
    key: 'HEADSET',
    nombre: 'Auriculares y Headsets',
    descripcion: 'Auriculares con micrófono para soporte técnico, atención y docencia virtual',
    icono: Headphones,
    colorFondo: 'bg-slate-100',
    colorTexto: 'text-slate-800',
    bordeColor: 'border-slate-300',
    gradiente: 'from-slate-400/10 to-slate-600/10',
    keywords: ['HEADSET', 'AURICULAR', 'AUDIFONOS', 'DIADEMA']
  },
  {
    key: 'TECLADO',
    nombre: 'Teclados',
    descripcion: 'Teclados USB e inalámbricos institucionales para estaciones de trabajo',
    icono: Keyboard,
    colorFondo: 'bg-neutral-100',
    colorTexto: 'text-neutral-800',
    bordeColor: 'border-neutral-300',
    gradiente: 'from-neutral-400/10 to-neutral-600/10',
    keywords: ['TECLADO', 'KEYBOARD', 'GENIUS', 'LOGITECH K']
  },
  {
    key: 'MOUSE',
    nombre: 'Ratones y Punteros',
    descripcion: 'Ratones ópticos y periféricos de navegación para equipos de cómputo',
    icono: Mouse,
    colorFondo: 'bg-zinc-100',
    colorTexto: 'text-zinc-800',
    bordeColor: 'border-zinc-300',
    gradiente: 'from-zinc-400/10 to-zinc-600/10',
    keywords: ['MOUSE', 'RATON', 'OPTICAL', 'PUNTERO']
  }
];

// Configuración para ítems sin clasificar
const TIPO_SIN_CLASIFICAR: TipoConfig = {
  key: 'SIN_CLASIFICAR',
  nombre: 'Sin clasificar',
  descripcion: 'Activos que requieren asignación de tipo de equipo o categoría tecnológica',
  icono: HelpCircle,
  colorFondo: 'bg-amber-50',
  colorTexto: 'text-amber-900',
  bordeColor: 'border-amber-300',
  gradiente: 'from-amber-400/15 to-orange-400/15',
  keywords: []
};

export const GroupedAssetsView: React.FC<GroupedAssetsViewProps> = ({
  activos,
  onEditAsset,
  onSelectAsset,
  onTransferAsset,
  ubicacionesDisponibles = [],
  initialSearch = ''
}) => {
  // Filtros internos
  const [search, setSearch] = useState(initialSearch);
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('todas');
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');
  const [selectedCustodio, setSelectedCustodio] = useState<string>('todos');

  // Ordenamiento de grupos
  const [sortGroupOption, setSortGroupOption] = useState<'cantidad_desc' | 'cantidad_asc' | 'nombre_asc' | 'nombre_desc'>('cantidad_desc');

  // Estado de acordeones expandidos (por defecto, los 3 grupos principales abiertos)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['LAPTOP', 'CPU', 'UPS', 'BOCINAS']));

  // Estado copiado para número de serie
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  const handleCopySerial = (serial: string) => {
    navigator.clipboard.writeText(serial);
    setCopiedSerial(serial);
    setTimeout(() => setCopiedSerial(null), 2000);
  };

  // Mapa rápido de recurso_id -> tipo_equipo desde el dataset institucional
  const recursoTipoMap = useMemo(() => {
    const map = new Map<string, string>();
    RECURSOS_ORIGINALES.forEach(r => {
      if (r.tipo_equipo) {
        map.set(r.id, r.tipo_equipo.toUpperCase().trim());
      }
    });
    return map;
  }, []);

  // Función clasificadora precisa por activo
  const clasificarActivo = (activo: ActivoTI): TipoConfig => {
    // 1. Verificación directa en el mapa de recursos
    const tipoRecurso = recursoTipoMap.get(activo.recurso_id);
    if (tipoRecurso) {
      const config = TIPOS_CONFIG.find(t => t.key === tipoRecurso);
      if (config) return config;
    }

    // 2. Coincidencia por palabras clave en recurso_nombre
    const nombreUpper = (activo.recurso_nombre || '').toUpperCase();
    const notasUpper = (activo.notas || '').toUpperCase();
    const textoCompuesto = `${nombreUpper} ${notasUpper}`;

    for (const tipo of TIPOS_CONFIG) {
      for (const kw of tipo.keywords) {
        if (textoCompuesto.includes(kw)) {
          return tipo;
        }
      }
    }

    // 3. Coincidencia por categoría tecnológica
    const catUpper = (activo.categoria_nombre || '').toUpperCase();
    if (catUpper.includes('COMPUT') || catUpper.includes('LAPTOP')) return TIPOS_CONFIG.find(t => t.key === 'CPU') || TIPOS_CONFIG[0];
    if (catUpper.includes('PANTALLA') || catUpper.includes('MONITOR')) return TIPOS_CONFIG.find(t => t.key === 'MONITOR') || TIPOS_CONFIG[2];
    if (catUpper.includes('PERIF')) return TIPOS_CONFIG.find(t => t.key === 'BOCINAS') || TIPOS_CONFIG[3];
    if (catUpper.includes('IMP')) return TIPOS_CONFIG.find(t => t.key === 'IMPRESORA') || TIPOS_CONFIG[5];
    if (catUpper.includes('UPS') || catUpper.includes('ENERG')) return TIPOS_CONFIG.find(t => t.key === 'UPS') || TIPOS_CONFIG[4];
    if (catUpper.includes('RED') || catUpper.includes('TELECOM')) return TIPOS_CONFIG.find(t => t.key === 'SWITCH') || TIPOS_CONFIG[8];
    if (catUpper.includes('AUDIO') || catUpper.includes('MULTI')) return TIPOS_CONFIG.find(t => t.key === 'TV') || TIPOS_CONFIG[7];

    return TIPO_SIN_CLASIFICAR;
  };

  // Lista única de custodios y ubicaciones para selectores
  const custodiosUnicos = useMemo(() => {
    const set = new Set<string>();
    activos.forEach(a => {
      if (a.responsable && a.responsable.trim()) {
        set.add(a.responsable.trim());
      }
    });
    return Array.from(set).sort();
  }, [activos]);

  const ubicacionesList = useMemo(() => {
    if (ubicacionesDisponibles && ubicacionesDisponibles.length > 0) {
      return ubicacionesDisponibles;
    }
    const set = new Set<string>();
    activos.forEach(a => {
      if (a.ubicacion_nombre && a.ubicacion_nombre.trim()) {
        set.add(a.ubicacion_nombre.trim());
      }
    });
    return Array.from(set).sort();
  }, [activos, ubicacionesDisponibles]);

  // Filtrado de activos individuales según criterios del usuario
  const activosFiltrados = useMemo(() => {
    return activos.filter(activo => {
      // Búsqueda
      const q = search.trim().toLowerCase();
      const matchSearch =
        q === '' ||
        activo.placa_institucional.toLowerCase().includes(q) ||
        activo.numero_serie.toLowerCase().includes(q) ||
        activo.recurso_nombre.toLowerCase().includes(q) ||
        activo.responsable.toLowerCase().includes(q) ||
        activo.ubicacion_nombre.toLowerCase().includes(q);

      // Estado
      const matchEstado =
        selectedEstado === 'todos' ||
        (selectedEstado === 'en_uso' && activo.estado === 'en_uso') ||
        (selectedEstado === 'disponible' && activo.estado === 'disponible') ||
        (selectedEstado === 'danado' && (activo.estado === 'danado' || activo.estado === 'dado_de_baja')) ||
        (selectedEstado === 'dado_de_baja' && activo.estado === 'dado_de_baja');

      // Ubicación
      const matchUbicacion =
        selectedUbicacion === 'todas' ||
        activo.ubicacion_nombre.toLowerCase() === selectedUbicacion.toLowerCase();

      // Custodio
      const matchCustodio =
        selectedCustodio === 'todos' ||
        activo.responsable.toLowerCase() === selectedCustodio.toLowerCase();

      return matchSearch && matchEstado && matchUbicacion && matchCustodio;
    });
  }, [activos, search, selectedEstado, selectedUbicacion, selectedCustodio]);

  // Agrupamiento estructurado por tipo
  const grupos = useMemo(() => {
    const mapaGrupos = new Map<string, {
      config: TipoConfig;
      items: ActivoTI[];
      total: number;
      enUso: number;
      disponible: number;
      danados: number;
      enMantenimiento: number;
    }>();

    // Inicializar grupos configurados
    TIPOS_CONFIG.forEach(t => {
      mapaGrupos.set(t.key, {
        config: t,
        items: [],
        total: 0,
        enUso: 0,
        disponible: 0,
        danados: 0,
        enMantenimiento: 0
      });
    });

    // Inicializar grupo sin clasificar
    mapaGrupos.set('SIN_CLASIFICAR', {
      config: TIPO_SIN_CLASIFICAR,
      items: [],
      total: 0,
      enUso: 0,
      disponible: 0,
      danados: 0,
      enMantenimiento: 0
    });

    // Distribuir cada activo filtrado
    activosFiltrados.forEach(activo => {
      const config = clasificarActivo(activo);
      const grupo = mapaGrupos.get(config.key) || mapaGrupos.get('SIN_CLASIFICAR')!;
      grupo.items.push(activo);
      grupo.total += 1;

      if (activo.estado === 'en_uso') {
        grupo.enUso += 1;
      } else if (activo.estado === 'disponible') {
        grupo.disponible += 1;
      } else if (activo.estado === 'danado' || activo.estado === 'dado_de_baja') {
        grupo.danados += 1;
      }

      // Check mantenimiento si aparece en notas
      if (activo.notas && activo.notas.toLowerCase().includes('mantenimiento')) {
        grupo.enMantenimiento += 1;
      }
    });

    // Convertir a lista y descartar grupos vacíos (a menos que no haya búsqueda activa y queramos ver el resumen)
    const lista = Array.from(mapaGrupos.values()).filter(g => g.total > 0);

    // Ordenar grupos según preferencia seleccionada
    lista.sort((a, b) => {
      // El grupo sin clasificar siempre se muestra al final (o al inicio si hay alerta)
      if (a.config.key === 'SIN_CLASIFICAR') return 1;
      if (b.config.key === 'SIN_CLASIFICAR') return -1;

      if (sortGroupOption === 'cantidad_desc') return b.total - a.total;
      if (sortGroupOption === 'cantidad_asc') return a.total - b.total;
      if (sortGroupOption === 'nombre_asc') return a.config.nombre.localeCompare(b.config.nombre);
      if (sortGroupOption === 'nombre_desc') return b.config.nombre.localeCompare(a.config.nombre);
      return 0;
    });

    return lista;
  }, [activosFiltrados, recursoTipoMap, sortGroupOption]);

  // Contar activos sin clasificar para el banner institucional
  const grupoSinClasificar = useMemo(() => {
    return grupos.find(g => g.config.key === 'SIN_CLASIFICAR');
  }, [grupos]);

  // Alternar acordeón individual
  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Expandir y colapsar todos
  const handleExpandAll = () => {
    setExpandedGroups(new Set(grupos.map(g => g.config.key)));
  };

  const handleCollapseAll = () => {
    setExpandedGroups(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Controles del Módulo Agrupado */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Búsqueda en vivo */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar placa, modelo, serie, custodio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C3177]/20 focus:border-[#1C3177] transition-all bg-slate-50/50"
            />
          </div>

          {/* Filtro por Ubicación (49 reales) */}
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={selectedUbicacion}
              onChange={e => setSelectedUbicacion(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C3177]/20 focus:border-[#1C3177] transition-all bg-slate-50/50 appearance-none text-slate-700"
            >
              <option value="todas">Todas las ubicaciones ({ubicacionesList.length})</option>
              {ubicacionesList.map(ub => (
                <option key={ub} value={ub}>{ub}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={selectedEstado}
              onChange={e => setSelectedEstado(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C3177]/20 focus:border-[#1C3177] transition-all bg-slate-50/50 appearance-none text-slate-700"
            >
              <option value="todos">Todos los estados</option>
              <option value="en_uso">En uso (Operativos)</option>
              <option value="disponible">Disponibles (En almacén)</option>
              <option value="danado">Dañados / En descargo</option>
            </select>
          </div>

          {/* Filtro por Custodio / Responsable */}
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={selectedCustodio}
              onChange={e => setSelectedCustodio(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C3177]/20 focus:border-[#1C3177] transition-all bg-slate-50/50 appearance-none text-slate-700"
            >
              <option value="todos">Todos los custodios ({custodiosUnicos.length})</option>
              {custodiosUnicos.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra de utilidades: Orden de grupos y botones expandir/colapsar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Layers className="h-4 w-4 text-[#1C3177]" />
            <span>
              Mostrando <strong className="text-slate-800">{activosFiltrados.length}</strong> activos organizados en <strong className="text-slate-800">{grupos.length}</strong> tipos
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Ordenamiento de grupos */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Ordenar tipos:</span>
              <select
                value={sortGroupOption}
                onChange={e => setSortGroupOption(e.target.value as any)}
                className="py-1 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1C3177]"
              >
                <option value="cantidad_desc">Mayor cantidad</option>
                <option value="cantidad_asc">Menor cantidad</option>
                <option value="nombre_asc">Alfabético (A - Z)</option>
                <option value="nombre_desc">Alfabético (Z - A)</option>
              </select>
            </div>

            {/* Alternar todo */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 rounded-md hover:bg-white transition-all"
              >
                Expandir todos
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 rounded-md hover:bg-white transition-all"
              >
                Colapsar todos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Banner especial para ítems «Sin clasificar» si existen */}
      {grupoSinClasificar && grupoSinClasificar.total > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Atención: Hay {grupoSinClasificar.total} {grupoSinClasificar.total === 1 ? 'activo' : 'activos'} sin clasificar por tipo
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Para mantener el catálogo ordenado, puedes asignarles su categoría tecnológica y modelo haciendo clic en «Editar» en cada unidad.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              // Expandir el grupo sin clasificar
              setExpandedGroups(prev => new Set(prev).add('SIN_CLASIFICAR'));
              const el = document.getElementById('grupo-SIN_CLASIFICAR');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            Revisar {grupoSinClasificar.total} sin clasificar
          </button>
        </div>
      )}

      {/* Listado de Grupos en Acordeón */}
      {grupos.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <Box className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No se encontraron activos para los filtros seleccionados</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Intenta cambiar los términos de búsqueda o limpiar los filtros de ubicación y estado.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedUbicacion('todas');
              setSelectedEstado('todos');
              setSelectedCustodio('todos');
            }}
            className="mt-4 px-4 py-2 text-xs font-bold text-[#1C3177] bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map(grupo => {
            const isExpanded = expandedGroups.has(grupo.config.key);
            const Icon = grupo.config.icono;
            const isUnclassified = grupo.config.key === 'SIN_CLASIFICAR';

            return (
              <div
                key={grupo.config.key}
                id={`grupo-${grupo.config.key}`}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs bg-white ${
                  isUnclassified
                    ? 'border-amber-300/80 ring-1 ring-amber-300/40'
                    : isExpanded
                    ? 'border-slate-300 ring-1 ring-slate-200'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Cabecera del Grupo (Accordion Trigger) */}
                <div
                  onClick={() => toggleGroup(grupo.config.key)}
                  className={`p-4 cursor-pointer select-none transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isExpanded ? 'bg-slate-50/70 border-b border-slate-200/70' : 'hover:bg-slate-50/40'
                  }`}
                >
                  {/* Lado Izquierdo: Icono/Foto y Títulos */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border ${grupo.config.colorFondo} ${grupo.config.colorTexto} ${grupo.config.bordeColor} shadow-xs`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {grupo.config.nombre}
                        </h3>
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-white shadow-xs">
                          {grupo.total} {grupo.total === 1 ? 'unidad' : 'unidades'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {grupo.config.descripcion}
                      </p>
                    </div>
                  </div>

                  {/* Lado Derecho: Desglose por Estado y Chevron */}
                  <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                    {/* Badge En Uso */}
                    {grupo.enUso > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        {grupo.enUso} en uso
                      </span>
                    )}

                    {/* Badge Disponible */}
                    {grupo.disponible > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-[#1C3177] border border-blue-200/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1C3177]"></span>
                        {grupo.disponible} disponible{grupo.disponible > 1 ? 's' : ''}
                      </span>
                    )}

                    {/* Badge Dañados / Descargo */}
                    {grupo.danados > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                        {grupo.danados} con reporte
                      </span>
                    )}

                    {/* Botón Indicador de Acordeón */}
                    <div className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors ml-1">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Contenido Expandido: Unidades Individuales */}
                {isExpanded && (
                  <div className="p-4 sm:p-5">
                    {/* Barra informativa del subgrupo */}
                    <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 text-xs">
                      <span className="text-slate-500">
                        Detalle de unidades de <strong>{grupo.config.nombre}</strong> con placa institucional UOD:
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {grupo.items.length} {grupo.items.length === 1 ? 'ítem físico' : 'ítems físicos'}
                      </span>
                    </div>

                    {/* Tabla de unidades del grupo */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 uppercase font-semibold text-[10px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Placa / ID</th>
                            <th className="py-2.5 px-3">Modelo / Nombre del Equipo</th>
                            <th className="py-2.5 px-3">Número de Serie</th>
                            <th className="py-2.5 px-3">Ubicación Física</th>
                            <th className="py-2.5 px-3">Custodio Asignado</th>
                            <th className="py-2.5 px-3">Estado</th>
                            <th className="py-2.5 px-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {grupo.items.map(activo => {
                            const isDanado = activo.estado === 'danado' || activo.estado === 'dado_de_baja';
                            const isDisponible = activo.estado === 'disponible';

                            return (
                              <tr
                                key={activo.id}
                                className="hover:bg-blue-50/30 transition-colors group"
                              >
                                {/* Placa */}
                                <td className="py-2.5 px-3 font-mono font-bold text-[#1C3177]">
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-[#1C3177]/5 border border-[#1C3177]/20">
                                    {activo.placa_institucional || 'S/P'}
                                  </span>
                                </td>

                                {/* Nombre / Modelo */}
                                <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs truncate" title={activo.recurso_nombre}>
                                  {activo.recurso_nombre}
                                </td>

                                {/* Serial */}
                                <td className="py-2.5 px-3 font-mono text-slate-600">
                                  <div className="flex items-center gap-1.5">
                                    <span>{activo.numero_serie || 'N/A'}</span>
                                    {activo.numero_serie && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopySerial(activo.numero_serie)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition-opacity"
                                        title="Copiar número de serie"
                                      >
                                        {copiedSerial === activo.numero_serie ? (
                                          <Check className="h-3 w-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </td>

                                {/* Ubicación */}
                                <td className="py-2.5 px-3 text-slate-700">
                                  <div className="flex items-center gap-1.5" title={activo.ubicacion_nombre}>
                                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[150px]">{activo.ubicacion_nombre}</span>
                                  </div>
                                </td>

                                {/* Custodio */}
                                <td className="py-2.5 px-3 text-slate-700">
                                  <div className="flex items-center gap-1.5" title={activo.responsable}>
                                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[140px]">{activo.responsable || 'Por asignar'}</span>
                                  </div>
                                </td>

                                {/* Estado Badge */}
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isDanado
                                        ? 'bg-rose-100 text-rose-800'
                                        : isDisponible
                                        ? 'bg-blue-100 text-[#1C3177]'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        isDanado ? 'bg-rose-500' : isDisponible ? 'bg-[#1C3177]' : 'bg-emerald-500'
                                      }`}
                                    ></span>
                                    {activo.estado === 'en_uso'
                                      ? 'En uso'
                                      : activo.estado === 'disponible'
                                      ? 'Disponible'
                                      : activo.estado === 'danado'
                                      ? 'Dañado'
                                      : 'De baja'}
                                  </span>
                                </td>

                                {/* Acciones */}
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {/* Botón Editar Activo (Idea 2) */}
                                    <button
                                      type="button"
                                      onClick={() => onEditAsset?.(activo)}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-[#1C3177] hover:bg-blue-100/70 rounded-lg transition-colors cursor-pointer"
                                      title="Editar todos los datos de este activo (foto, QR, factura, serie, ubicación)"
                                    >
                                      <Pencil className="h-3 w-3" />
                                      <span>Editar</span>
                                    </button>

                                    {/* Botón Ver Detalle */}
                                    {onSelectAsset && (
                                      <button
                                        type="button"
                                        onClick={() => onSelectAsset(activo)}
                                        className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                        title="Ver ficha técnica"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </button>
                                    )}

                                    {/* Botón Trasladar */}
                                    {onTransferAsset && (
                                      <button
                                        type="button"
                                        onClick={() => onTransferAsset(activo)}
                                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                        title="Trasladar de ubicación o custodio"
                                      >
                                        <ArrowRightLeft className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
