'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  Cpu,
  RotateCcw,
  Camera,
  ImagePlus,
  Clock,
  ShieldAlert,
  Check
} from 'lucide-react';
import { ArticuloItem, MovimientoItem } from '@/lib/initialData';
import {
  apiClient,
  PropuestaAccionDto,
  ChatRequestDto,
  PropuestaRecursoDesdeFotoDto
} from '@/lib/apiClient';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  articulos: ArticuloItem[];
  onExecuteAction: (movimiento: Omit<MovimientoItem, 'id' | 'numero' | 'fecha'>) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  proposal?: PropuestaAccionDto;
  photoProposal?: PropuestaRecursoDesdeFotoDto;
  toolsExecuted?: string[];
  isLiveGemini?: boolean;
}

// Formateador limpio de texto para evitar asteriscos sin formato (**texto**)
const FormattedMessage: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  const lines = text.split('\n');

  return (
    <div className={`space-y-1.5 leading-relaxed text-xs ${isUser ? 'text-white' : 'text-slate-800'}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Detectar si es un encabezado markdown (### o ##)
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className={`font-bold text-xs mt-2 mb-1 ${isUser ? 'text-cyan-200' : 'text-[#1C3177]'}`}>
              {trimmed.replace('### ', '')}
            </h4>
          );
        }

        // Detectar si es una viñeta (*, -, • o número tipo 1., 2.)
        const isBullet = /^(\*|\-|\•|\d+\.)\s*/.test(trimmed);
        const bulletMatch = trimmed.match(/^(\*|\-|\•|\d+\.)\s*/);
        const bulletPrefix = bulletMatch ? bulletMatch[0] : '';
        const cleanContent = isBullet ? trimmed.slice(bulletPrefix.length) : trimmed;

        // Parsear **negrita** y `código`
        const parts = cleanContent.split(/(\*\*.*?\*\*|`.*?`)/g);

        const renderedLine = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return (
              <strong key={pIdx} className={`font-bold ${isUser ? 'text-white' : 'text-slate-900'}`}>
                {boldText}
              </strong>
            );
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            const codeText = part.slice(1, -1);
            return (
              <code key={pIdx} className="font-mono text-[10px] bg-slate-100 text-[#1C3177] px-1 py-0.5 rounded border border-slate-200">
                {codeText}
              </code>
            );
          }
          return <span key={pIdx}>{part}</span>;
        });

        if (isBullet) {
          const isNumbered = /^\d+\./.test(bulletPrefix);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className={`font-bold select-none shrink-0 mt-0.5 ${isUser ? 'text-cyan-200' : 'text-[#1C3177]'}`}>
                {isNumbered ? bulletPrefix.trim() : '•'}
              </span>
              <div className="flex-1">{renderedLine}</div>
            </div>
          );
        }

        return <div key={idx}>{renderedLine}</div>;
      })}
    </div>
  );
};

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  articulos,
  onExecuteAction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: '¡Hola! Soy **SIIA**, el Asistente Inteligente de la Universidad Odontológica Dominicana (UOD). Puedo responder consultas de existencias, activos físicos (`EQ-01`), alertas de reposición, analizar fotos de suministros con Gemini Vision o formular traslados con tu confirmación explícita. ¿En qué te colaboro hoy?',
      time: 'Ahora'
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [mode, setMode] = useState<'operativo' | 'tutor'>('operativo');

  // Estado para la ventana de reversión (Deshacer de 5 minutos - Prompt 10.4)
  const [activeUndo, setActiveUndo] = useState<{
    propuestaId: string;
    movimientoCorrelativo: string;
    secondsLeft: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Temporizador para la cuenta regresiva de 5 minutos (300 segundos)
  useEffect(() => {
    if (!activeUndo) return;
    const timer = setInterval(() => {
      setActiveUndo((prev) => {
        if (!prev) return null;
        if (prev.secondsLeft <= 1) {
          return null;
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeUndo]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      time: 'Ahora'
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!textToSend) setInput('');
    setIsThinking(true);

    try {
      // 1. Enviar a la API .NET 10 LTS de SIIA con orquestación oficial de Gemini y Function Calling
      const reqDto: ChatRequestDto = {
        message: query,
        mode,
        history: newHistory.map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text
        }))
      };

      const res = await apiClient.enviarMensajeAsistente(reqDto);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.text,
        time: 'Ahora',
        proposal: res.propuesta || undefined,
        toolsExecuted: res.toolCallsEjecutadas,
        isLiveGemini: res.isLiveGemini
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Fallback de contingencia a la ruta de Next.js si la API de backend no estuviese levantada
      try {
        const fallbackRes = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            history: newHistory.map((m) => ({ sender: m.sender, text: m.text })),
            articulos,
            ubicaciones: ['Almacén Central UOD', 'Clínica Odontológica B', 'Laboratorio de Cómputo', 'Rectoría'],
            mode
          })
        });
        const fallbackData = await fallbackRes.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: fallbackData.text || 'He procesado tu solicitud de inventario.',
            time: 'Ahora',
            proposal: fallbackData.proposal
          }
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: 'Disculpa, ocurrió un error de comunicación con el motor del asistente.',
            time: 'Ahora'
          }
        ]);
      }
    } finally {
      setIsThinking(false);
    }
  };

  // Confirmar propuesta (Prompt 10.3)
  const handleConfirmProposal = async (proposal: PropuestaAccionDto) => {
    setIsThinking(true);
    try {
      const res = await apiClient.confirmarPropuestaAsistente(proposal.id);

      onExecuteAction({
        tipo: proposal.tipo as any,
        articuloNombre: proposal.recursoNombre,
        cantidad: proposal.cantidad,
        origen: proposal.origenNombre || 'Almacén Central UOD',
        destino: proposal.destinoNombre || 'Ubicación Destino',
        usuario: 'Admin UOD (Vía Asistente IA)',
        origenIa: true,
        motivo: proposal.motivo
      });

      const correlativo = res.movimientoCorrelativo || `MOV-${new Date().getFullYear()}-000001`;

      setMessages((prev) => [
        ...prev,
        {
          id: `conf-${Date.now()}`,
          sender: 'ai',
          text: `✅ **Operación ${proposal.id} confirmada exitosamente**.\n\n` +
                `- **Correlativo Oficial:** \`${correlativo}\`\n` +
                `- **Recurso:** ${proposal.recursoNombre} (${proposal.cantidad} unidades)\n` +
                `- **Ruta:** ${proposal.origenNombre || 'Almacén Central'} → ${proposal.destinoNombre || 'Ubicación Destino'}\n` +
                `- **Auditoría:** Registrado con origen IA e inmutabilidad garantizada (Ley 172-13).\n\n` +
                `⏱️ *Tienes una ventana de 5 minutos para revertir esta operación si fue un error.*`,
          time: 'Ahora'
        }
      ]);

      if (res.esReversible) {
        setActiveUndo({
          propuestaId: proposal.id,
          movimientoCorrelativo: correlativo,
          secondsLeft: 300
        });
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: `⛔ **No se pudo ejecutar la acción**: ${err?.message || 'Error de autorización o validación de balance.'}\n\n*Nota: Los roles de consulta y auditoría tienen restringida la mutación de inventario.*`,
          time: 'Ahora'
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Cancelar propuesta
  const handleCancelProposal = async (proposalId: string) => {
    try {
      await apiClient.cancelarPropuestaAsistente(proposalId);
    } catch {
      // Ignorar fallo de red en cancelación
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `canc-${Date.now()}`,
        sender: 'ai',
        text: '🚫 **Operación cancelada y descartada**. Las existencias y saldos institucionales no sufrieron ninguna alteración.',
        time: 'Ahora'
      }
    ]);
  };

  // Revertir / Deshacer propuesta (Prompt 10.4)
  const handleRevertProposal = async () => {
    if (!activeUndo) return;
    setIsThinking(true);
    try {
      const res = await apiClient.revertirPropuestaAsistente(activeUndo.propuestaId);
      setMessages((prev) => [
        ...prev,
        {
          id: `rev-${Date.now()}`,
          sender: 'ai',
          text: `↩️ **Operación revertida exitosamente (Deshacer)**.\n\n` +
                `- **Contra-movimiento compensatorio:** \`${res.movimientoCorrelativo}\`\n` +
                `- **Detalle:** ${res.mensaje}\n` +
                `- **Estado:** Los saldos de existencias han sido restaurados exactamente a sus valores previos y auditados en la bitácora institucional.`,
          time: 'Ahora'
        }
      ]);
      setActiveUndo(null);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-rev-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **No se pudo revertir la operación**: ${err?.message || 'La ventana de reversión de 5 minutos ha expirado.'}`,
          time: 'Ahora'
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Subir y analizar fotografía multimodal (Prompt 10.5 & 10.6)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La fotografía no debe superar los 5 MB de tamaño.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      const base64Clean = base64Data.split(',')[1] || base64Data;

      setMessages((prev) => [
        ...prev,
        {
          id: `usr-img-${Date.now()}`,
          sender: 'user',
          text: `📷 *[Fotografía adjuntada: ${file.name}]* Analizando equipo o consumible con visión multimodal...`,
          time: 'Ahora'
        }
      ]);

      setIsThinking(true);
      try {
        const analisis = await apiClient.analizarFotoRecurso({
          fotoBase64: base64Clean,
          mimeType: file.type,
          observacionesUsuario: input || undefined
        });

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-img-${Date.now()}`,
            sender: 'ai',
            text: `### Análisis Visual Multimodal (Gemini Vision)\n` +
                  `He analizado la fotografía del recurso con un nivel de confianza **${analisis.confianzaAnalisis.toUpperCase()}**:\n\n` +
                  `- **Nombre sugerido:** **${analisis.nombreSugerido}**\n` +
                  `- **Categoría sugerida:** ${analisis.categoriaSugerida}\n` +
                  `- **Tipo de Bien:** ${analisis.tipoEquipo === 'activo_fijo' ? 'Activo Fijo Institucional (Placa EQ)' : 'Consumible / Material Clínico'}\n` +
                  `- **Marca y Modelo:** \`${analisis.marcaModelo}\`\n` +
                  `- **SKU Institucional sugerido:** \`${analisis.skuSugerido}\`\n` +
                  `- **Costo Estimado:** **RD$ ${analisis.costoEstimadoSugeridoDop.toLocaleString('es-DO', { minimumFractionDigits: 2 })}**\n` +
                  `- **Descripción:** ${analisis.descripcion}`,
            time: 'Ahora',
            photoProposal: analisis
          }
        ]);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-err-${Date.now()}`,
            sender: 'ai',
            text: `Disculpa, ocurrió un error procesando la fotografía: ${err?.message || 'Error en motor visual'}.`,
            time: 'Ahora'
          }
        ]);
      } finally {
        setIsThinking(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-all">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1C3177] text-white shadow-sm">
            <Bot className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Asistente IA • SIIA UOD</h2>
              <span className="rounded-full bg-cyan-50 border border-cyan-200 px-2 py-0.5 text-[10px] font-bold text-[#0891B2] flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                Gemini Vision
              </span>
            </div>
            <p className="text-[11px] text-slate-500">.NET 10 LTS • Acciones con Deshacer y Visión Multimodal</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Cerrar panel de asistente"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Mode Toggle (Operativo vs Tutor) */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-2">
        <span className="text-[11px] text-slate-600 font-medium">Modo de asistencia:</span>
        <div className="flex items-center gap-1 rounded-lg bg-white p-1 border border-slate-200 shadow-2xs">
          <button
            onClick={() => setMode('operativo')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
              mode === 'operativo'
                ? 'bg-cyan-50 text-[#0891B2] border border-cyan-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            Operativo
          </button>
          <button
            onClick={() => setMode('tutor')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
              mode === 'tutor'
                ? 'bg-blue-50 text-[#1C3177] border border-blue-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-3 w-3" />
            Tutor
          </button>
        </div>
      </div>

      {/* Barra Flotante de Deshacer (Undo de 5 minutos - Prompt 10.4) */}
      {activeUndo && (
        <div className="flex items-center justify-between bg-amber-500 text-white px-4 py-2.5 shadow-md text-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin shrink-0" />
            <div>
              <span className="font-bold">Deshacer disponible:</span>{' '}
              <span className="font-mono">{activeUndo.movimientoCorrelativo}</span> (
              {Math.floor(activeUndo.secondsLeft / 60)}:
              {(activeUndo.secondsLeft % 60).toString().padStart(2, '0')})
            </div>
          </div>
          <button
            onClick={handleRevertProposal}
            disabled={isThinking}
            className="flex items-center gap-1 rounded bg-white px-2.5 py-1 font-bold text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer text-[11px]"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-800" />
            Deshacer
          </button>
        </div>
      )}

      {/* Quick Prompts Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 bg-white px-4 py-2 text-xs no-scrollbar">
        <button
          onClick={() => handleSend('¿Cuál es el estado y ubicación del equipo EQ-01?')}
          className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:border-[#1C3177] hover:text-[#1C3177] font-medium transition-colors"
        >
          🔍 Activo EQ-01
        </button>
        <button
          onClick={() => handleSend('¿Qué artículos tienen stock por debajo del mínimo?')}
          className="shrink-0 rounded-full border border-amber-200 bg-amber-50/60 px-3 py-1 text-[11px] text-amber-800 hover:border-amber-400 font-medium transition-colors"
        >
          ⚠️ Alertas de stock bajo
        </button>
        <button
          onClick={() => handleSend('Traslada 5 unidades al Laboratorio de Cómputo')}
          className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:border-[#3DAA5C] hover:text-[#2D8246] font-medium transition-colors"
        >
          🔄 Proponer traslado
        </button>
        <button
          onClick={() => {
            setMode('tutor');
            handleSend('¿Cómo hago una recepción de mercancía y entrada al almacén?');
          }}
          className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] text-[#1C3177] hover:border-blue-400 font-medium transition-colors"
        >
          🎓 Guía de Recepción
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-[#1C3177] text-white'
                  : 'bg-white text-slate-800 border border-slate-200/80 shadow-xs'
              }`}
            >
              {/* Badges de Herramientas Invocadas por la IA */}
              {msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mb-2 pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-cyan-600" />
                    Herramientas SIIA:
                  </span>
                  {msg.toolsExecuted.map((t, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <FormattedMessage text={msg.text} isUser={msg.sender === 'user'} />

              {/* Action Confirmation Card (Required by Rule #4) */}
              {msg.proposal && (
                <div className="mt-3.5 rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-slate-800 shadow-xs">
                  <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Confirmación Requerida para Impactar Inventario</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] mb-3 text-slate-700">
                    <p><span className="text-slate-500 font-medium">Propuesta:</span> <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border">{msg.proposal.id}</code></p>
                    <p><span className="text-slate-500 font-medium">Recurso:</span> <strong className="text-slate-900">{msg.proposal.recursoNombre}</strong></p>
                    <p><span className="text-slate-500 font-medium">Cantidad:</span> <span className="font-bold text-[#1C3177]">{msg.proposal.cantidad} unidades</span></p>
                    <div className="flex items-center gap-2 text-slate-700 my-1 font-medium">
                      <span className="text-slate-500">{msg.proposal.origenNombre || 'Almacén Central'}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-bold text-[#2D8246]">{msg.proposal.destinoNombre || 'Ubicación Destino'}</span>
                    </div>
                    {msg.proposal.stockActualOrigen !== undefined && (
                      <div className="mt-1 rounded-lg bg-white p-2 text-[11px] text-slate-700 border border-slate-200 font-medium">
                        Balance proyectado en origen: {msg.proposal.stockActualOrigen} → <strong className="text-slate-900">{msg.proposal.stockNuevoOrigen} existencias</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                    <button
                      onClick={() => handleConfirmProposal(msg.proposal!)}
                      disabled={isThinking}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#3DAA5C] py-2 text-xs font-bold text-white hover:bg-[#2D8246] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirmar Operación
                    </button>
                    <button
                      onClick={() => handleCancelProposal(msg.proposal!.id)}
                      disabled={isThinking}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Photo Analysis Card with Duplicate Detection (Prompt 10.5 & 10.6) */}
              {msg.photoProposal && (
                <div className="mt-3.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-slate-800 shadow-xs">
                  {msg.photoProposal.posibleDuplicado && (
                    <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-2 text-amber-900 flex items-start gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-snug">
                        <span className="font-bold">Alerta Preventiva de Duplicado (Prompt 10.6):</span> Se detectó una coincidencia con{' '}
                        <strong className="text-amber-950 font-bold">{msg.photoProposal.recursoSimilarEncontrado}</strong> en el catálogo. Revisa si ya está ingresado antes de crear un nuevo recurso.
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-bold text-[#1C3177] mb-2 border-b border-blue-100 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
                      Ficha Sugerida desde Fotografía
                    </span>
                    <span className="text-[10px] bg-blue-100 text-[#1C3177] px-2 py-0.5 rounded-full font-mono">
                      {msg.photoProposal.skuSugerido}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-700">
                    <p><span className="text-slate-500 font-medium">Nombre:</span> <strong className="text-slate-900">{msg.photoProposal.nombreSugerido}</strong></p>
                    <p><span className="text-slate-500 font-medium">Categoría:</span> <span>{msg.photoProposal.categoriaSugerida}</span></p>
                    <p><span className="text-slate-500 font-medium">Marca/Modelo:</span> <code>{msg.photoProposal.marcaModelo}</code></p>
                    <p><span className="text-slate-500 font-medium">Costo Estimado:</span> <strong className="text-[#3DAA5C]">RD$ {msg.photoProposal.costoEstimadoSugeridoDop.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong></p>
                  </div>
                </div>
              )}
            </div>
            <span className="mt-1 text-[10px] text-slate-400 px-1">{msg.time}</span>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 rounded-xl bg-white p-3 text-xs text-[#0891B2] border border-cyan-200 shadow-xs w-fit animate-pulse">
            <Sparkles className="h-4 w-4 animate-spin text-[#06B6D4]" />
            <span className="font-medium">Consultando Gemini y evaluando reglas de negocio...</span>
          </div>
        )}
      </div>

      {/* Input Field with Camera & Photo Analysis */}
      <div className="border-t border-slate-100 bg-white p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Botón de Cámara / Subida de Fotografía (Prompt 10.5) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Analizar fotografía de un recurso con Gemini Vision"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-[#1C3177] transition-colors shadow-xs cursor-pointer shrink-0"
            aria-label="Subir foto para análisis IA"
          >
            <Camera className="h-4 w-4" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'tutor' ? 'Pregunta cómo usar una pantalla o proceso...' : 'Consulta existencias, activos o formula órdenes...'}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#1C3177] focus:outline-none focus:ring-1 focus:ring-[#1C3177]"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1C3177] text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2B4BA0] transition-colors shadow-xs cursor-pointer shrink-0"
            aria-label="Enviar mensaje al asistente"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          SIIA v1.0 • Acciones con confirmación, reversión (undo) y visión multimodal.
        </p>
      </div>
    </div>
  );
};
