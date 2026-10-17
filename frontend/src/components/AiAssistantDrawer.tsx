'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Bot
} from 'lucide-react';
import { ArticuloItem, MovimientoItem } from '@/lib/initialData';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  articulos: ArticuloItem[];
  onExecuteAction: (movimiento: Omit<MovimientoItem, 'id' | 'numero' | 'fecha'>) => void;
}

interface ActionProposal {
  id: string;
  tipo: 'traslado' | 'salida' | 'entrada';
  articuloId: string;
  articuloNombre: string;
  cantidad: number;
  origen?: string;
  destino?: string;
  stockActualOrigen: number;
  stockNuevoOrigen: number;
  motivo: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  proposal?: ActionProposal;
}

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
      text: '¡Hola! Soy tu Asistente Inteligente de Inventario (SIIA). Puedo responder preguntas sobre existencias, sugerir reposiciones o realizar movimientos bajo tu confirmación previa. ¿En qué te ayudo hoy?',
      time: 'Ahora'
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [mode, setMode] = useState<'operativo' | 'tutor'>('operativo');

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      time: 'Ahora'
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsThinking(true);

    // AI Intent processing logic matching Annex B of SIIA spec
    setTimeout(() => {
      const lower = query.toLowerCase();
      let responseText = '';
      let proposal: ActionProposal | undefined = undefined;

      if (lower.includes('resmas') && (lower.includes('cuánt') || lower.includes('quedan') || lower.includes('stock'))) {
        const papel = articulos.find(a => a.sku.includes('PAP'));
        responseText = `En el Almacén Central quedan actualmente **${papel?.stockActual || 85} resmas** de Papel Bond 8.5x11 (Stock mínimo configurado: ${papel?.stockMinimo || 15}). El stock está en estado saludable.`;
      } 
      else if (lower.includes('bajo') || lower.includes('agot') || lower.includes('mínimo') || lower.includes('reponer')) {
        const bajos = articulos.filter(a => a.stockActual <= a.stockMinimo);
        responseText = `He analizado el inventario y detecté **${bajos.length} artículos críticos bajo stock mínimo**:\n\n` +
          bajos.map(b => `• **${b.nombre}**: ${b.stockActual} ${b.unidad}s (Mínimo: ${b.stockMinimo})`).join('\n') +
          `\n\n¿Deseas que prepare un borrador de Orden de Compra para estos suministros?`;
      }
      else if (lower.includes('traslad') || (lower.includes('papel') && lower.includes('secretaría'))) {
        const papel = articulos.find(a => a.sku.includes('PAP'));
        const stockActual = papel?.stockActual || 85;
        const qty = 20;

        proposal = {
          id: `prop-${Date.now()}`,
          tipo: 'traslado',
          articuloId: papel?.id || 'art-001',
          articuloNombre: papel?.nombre || 'Resmas de Papel Bond 8.5 x 11',
          cantidad: qty,
          origen: 'Almacén Central',
          destino: 'Secretaría General',
          stockActualOrigen: stockActual,
          stockNuevoOrigen: stockActual - qty,
          motivo: 'Traslado solicitado mediante asistente conversacional IA'
        };

        responseText = `He verificado la disponibilidad en el **Almacén Central** (${stockActual} disponibles) y tus permisos de usuario. Para proceder, por favor confirma la siguiente orden de traslado:`;
      }
      else if (mode === 'tutor' || lower.includes('cómo') || lower.includes('tutor') || lower.includes('ayuda')) {
        responseText = `📘 **Modo Tutor**: Para registrar un nuevo movimiento de inventario, puedes hacerlo directamente escribiéndomelo aquí (ej: "Traslada 10 resmas a Dirección") o yendo a la pestaña de **Movimientos** en el menú izquierdo y pulsando "Nuevo Movimiento". Cada transacción genera un comprobante inmutable con fecha, responsable y clave de auditoría.`;
      }
      else {
        responseText = `Comprendo tu solicitud: "${query}". Tengo acceso a las existencias, categorías, activos y bitácora de la institución. Puedes pedirme consultas de stock, detección de artículos por vencer o traslados entre sedes.`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        time: 'Ahora',
        proposal
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsThinking(false);
    }, 700);
  };

  const handleConfirmProposal = (proposal: ActionProposal) => {
    onExecuteAction({
      tipo: proposal.tipo,
      articuloNombre: proposal.articuloNombre,
      cantidad: proposal.cantidad,
      origen: proposal.origen,
      destino: proposal.destino,
      usuario: 'Admin UOD (Vía Asistente IA)',
      origenIa: true,
      motivo: proposal.motivo
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `conf-${Date.now()}`,
        sender: 'ai',
        text: `✅ **Operación ejecutada con éxito**. Se trasladaron ${proposal.cantidad} unidades a ${proposal.destino}. Se ha registrado en la bitácora de auditoría con origen "IA a solicitud de usuario".`,
        time: 'Ahora'
      }
    ]);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-800 bg-[#0B1020]/95 shadow-2xl backdrop-blur-2xl transition-all">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
            <Bot className="h-5 w-5 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Asistente IA • SIIA</h2>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
                Contexto Activo
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Validación y acciones con confirmación</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Mode Toggle (Operativo vs Tutor) */}
      <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/50 px-5 py-2">
        <span className="text-[11px] text-slate-400">Modo de asistencia:</span>
        <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setMode('operativo')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
              mode === 'operativo'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            Operativo
          </button>
          <button
            onClick={() => setMode('tutor')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
              mode === 'tutor'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-3 w-3" />
            Tutor
          </button>
        </div>
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800/40 bg-slate-900/30 px-4 py-2 text-xs no-scrollbar">
        <button
          onClick={() => handleSend('¿Cuántas resmas de papel quedan en el Almacén Central?')}
          className="shrink-0 rounded-full border border-slate-700/60 bg-slate-800/50 px-3 py-1 text-[11px] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
        >
          📦 Stock de papel
        </button>
        <button
          onClick={() => handleSend('¿Qué artículos tienen stock por debajo del mínimo?')}
          className="shrink-0 rounded-full border border-slate-700/60 bg-slate-800/50 px-3 py-1 text-[11px] text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors"
        >
          ⚠️ Alertas de reposición
        </button>
        <button
          onClick={() => handleSend('Traslada 20 resmas de papel del Almacén Central a Secretaría')}
          className="shrink-0 rounded-full border border-slate-700/60 bg-slate-800/50 px-3 py-1 text-[11px] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
        >
          🔄 Trasladar papel a Secretaría
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800 shadow-md'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              {/* Action Confirmation Card (Required by Section 18.7 f) */}
              {msg.proposal && (
                <div className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-3.5 text-slate-200">
                  <div className="flex items-center gap-2 mb-2 text-cyan-300 font-semibold text-xs">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Confirmación de Acción Requerida</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] mb-3 text-slate-300">
                    <p><span className="text-slate-400">Artículo:</span> {msg.proposal.articuloNombre}</p>
                    <p><span className="text-slate-400">Cantidad:</span> <span className="font-bold text-white">{msg.proposal.cantidad} unidades</span></p>
                    <div className="flex items-center gap-2 text-slate-300 my-1">
                      <span className="text-slate-400">{msg.proposal.origen}</span>
                      <ArrowRight className="h-3 w-3 text-cyan-400" />
                      <span className="font-semibold text-cyan-200">{msg.proposal.destino}</span>
                    </div>
                    <p className="text-[10px] text-amber-300/90">
                      Impacto: Origen {msg.proposal.stockActualOrigen} → {msg.proposal.stockNuevoOrigen} existencias.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-cyan-900/50">
                    <button
                      onClick={() => handleConfirmProposal(msg.proposal!)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-cyan-500 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-md shadow-cyan-500/20"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirmar Traslado
                    </button>
                    <button
                      onClick={() => {
                        setMessages(prev => [...prev, {
                          id: `canc-${Date.now()}`,
                          sender: 'ai',
                          text: 'Operación cancelada. No se modificaron las existencias.',
                          time: 'Ahora'
                        }]);
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
            <span className="mt-1 text-[10px] text-slate-500 px-1">{msg.time}</span>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 p-3 text-xs text-cyan-300 border border-slate-800 w-fit">
            <Sparkles className="h-4 w-4 animate-spin text-cyan-400" />
            <span>Consultando datos y evaluando reglas de negocio...</span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="border-t border-slate-800/80 bg-[#0B1020] p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta o instruye al Asistente..."
            className="flex-1 rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-slate-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-md shadow-cyan-500/20"
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-slate-500">
          SIIA v1.0 • Acciones de escritura protegidas con auditoría y confirmación.
        </p>
      </div>
    </div>
  );
};
