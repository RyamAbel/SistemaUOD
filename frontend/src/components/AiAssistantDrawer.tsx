'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
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

// Formateador limpio de texto para evitar asteriscos sin formato (**texto**)
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed text-xs">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Detectar si es una viñeta (*, -, • o número tipo 1., 2.)
        const isBullet = /^(\*|\-|\•|\d+\.)\s*/.test(trimmed);
        const bulletMatch = trimmed.match(/^(\*|\-|\•|\d+\.)\s*/);
        const bulletPrefix = bulletMatch ? bulletMatch[0] : '';
        const cleanContent = isBullet ? trimmed.slice(bulletPrefix.length) : trimmed;

        // Parsear **negrita**
        const parts = cleanContent.split(/(\*\*.*?\*\*)/g);

        const renderedLine = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return (
              <strong key={pIdx} className="font-semibold text-white">
                {boldText}
              </strong>
            );
          }
          return <span key={pIdx}>{part}</span>;
        });

        if (isBullet) {
          const isNumbered = /^\d+\./.test(bulletPrefix);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-cyan-400 font-semibold select-none shrink-0 mt-0.5">
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
      text: '¡Hola! Soy tu Asistente Inteligente de Inventario (SIIA). Puedo responder consultas de existencias, detectar artículos por reponer o coordinar traslados con tu confirmación previa. ¿En qué puedo colaborar?',
      time: 'Ahora'
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [mode, setMode] = useState<'operativo' | 'tutor'>('operativo');

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
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: newHistory.map((m) => ({ sender: m.sender, text: m.text })),
          articulos,
          ubicaciones: ['Almacén Central', 'Secretaría General', 'Laboratorio de Cómputo 1', 'Rectoría / Dirección'],
          mode
        })
      });

      const data = await res.json();

      let finalText = data.text || 'Sin respuesta del asistente.';
      if (data.apiKeyWarning) {
        finalText += `\n\n_${data.apiKeyWarning}_`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: finalText,
        time: 'Ahora',
        proposal: data.proposal
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'Disculpa, ocurrió un error de comunicación con el motor del asistente.',
          time: 'Ahora'
        }
      ]);
    } finally {
      setIsThinking(false);
    }
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
        text: `✅ **Operación ejecutada con éxito**. Se trasladaron ${proposal.cantidad} unidades hacia ${proposal.destino}. Se ha registrado en la bitácora de auditoría con origen "IA a solicitud de usuario".`,
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
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Control transaccional y memoria de contexto</p>
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
              className={`max-w-[88%] rounded-2xl p-3.5 shadow-md ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800'
              }`}
            >
              {/* Formatted Markdown without raw asterisks */}
              <FormattedMessage text={msg.text} />

              {/* Action Confirmation Card (Required by Section 18.7 f) */}
              {msg.proposal && (
                <div className="mt-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 p-3.5 text-slate-200 shadow-lg shadow-cyan-950/50">
                  <div className="flex items-center gap-2 mb-2 text-cyan-300 font-semibold text-xs">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Confirmación Requerida para Impactar Inventario</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] mb-3 text-slate-300">
                    <p><span className="text-slate-400">Artículo:</span> <strong className="text-white">{msg.proposal.articuloNombre}</strong></p>
                    <p><span className="text-slate-400">Cantidad:</span> <span className="font-bold text-cyan-300">{msg.proposal.cantidad} unidades</span></p>
                    <div className="flex items-center gap-2 text-slate-300 my-1 font-medium">
                      <span className="text-slate-400">{msg.proposal.origen}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="font-semibold text-cyan-200">{msg.proposal.destino}</span>
                    </div>
                    <div className="mt-1 rounded-lg bg-slate-900/70 p-2 text-[10px] text-amber-300 border border-amber-500/20">
                      Balance proyectado en origen: {msg.proposal.stockActualOrigen} → <strong className="text-white">{msg.proposal.stockNuevoOrigen} existencias</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-cyan-900/50">
                    <button
                      onClick={() => handleConfirmProposal(msg.proposal!)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-cyan-500 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-md shadow-cyan-500/25"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirmar Operación
                    </button>
                    <button
                      onClick={() => {
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: `canc-${Date.now()}`,
                            sender: 'ai',
                            text: 'Operación cancelada. Las existencias permanecen sin modificaciones.',
                            time: 'Ahora'
                          }
                        ]);
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
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
            <span>Consultando Gemini 3.8 Flash y evaluando reglas de negocio...</span>
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
