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
const FormattedMessage: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  const lines = text.split('\n');

  return (
    <div className={`space-y-1.5 leading-relaxed text-xs ${isUser ? 'text-white' : 'text-slate-800'}`}>
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
              <strong key={pIdx} className={`font-bold ${isUser ? 'text-white' : 'text-slate-900'}`}>
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
      text: '¡Hola! Soy tu Asistente Inteligente de Inventario (SIIA). Puedo responder consultas de existencias, detectar insumos clínicos por reponer o coordinar traslados entre sedes con tu confirmación explícita. ¿En qué te colaboro hoy?',
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
          ubicaciones: ['Almacén Central', 'Clínica Principal', 'Clínica Este', 'Laboratorio de Prótesis'],
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
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-all">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1C3177] text-white shadow-sm">
            <Bot className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Asistente IA • SIIA</h2>
              <span className="rounded-full bg-cyan-50 border border-cyan-200 px-2 py-0.5 text-[10px] font-bold text-[#0891B2]">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Control transaccional y memoria de contexto</p>
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

      {/* Quick Prompts Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 bg-white px-4 py-2 text-xs no-scrollbar">
        <button
          onClick={() => handleSend('¿Cuántas unidades de Resina Compuesta A2 quedan en stock?')}
          className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:border-[#1C3177] hover:text-[#1C3177] font-medium transition-colors"
        >
          📦 Stock de resinas
        </button>
        <button
          onClick={() => handleSend('¿Qué artículos tienen stock por debajo del mínimo?')}
          className="shrink-0 rounded-full border border-amber-200 bg-amber-50/60 px-3 py-1 text-[11px] text-amber-800 hover:border-amber-400 font-medium transition-colors"
        >
          ⚠️ Alertas de reposición
        </button>
        <button
          onClick={() => handleSend('Traslada 20 unidades de Pasta Profilaxis del Almacén Central a Clínica Este')}
          className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:border-[#3DAA5C] hover:text-[#2D8246] font-medium transition-colors"
        >
          🔄 Trasladar pasta a Clínica Este
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
              <FormattedMessage text={msg.text} isUser={msg.sender === 'user'} />

              {/* Action Confirmation Card (Required by Rule #4) */}
              {msg.proposal && (
                <div className="mt-3.5 rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-slate-800 shadow-xs">
                  <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Confirmación Requerida para Impactar Inventario</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] mb-3 text-slate-700">
                    <p><span className="text-slate-500 font-medium">Artículo:</span> <strong className="text-slate-900">{msg.proposal.articuloNombre}</strong></p>
                    <p><span className="text-slate-500 font-medium">Cantidad:</span> <span className="font-bold text-[#1C3177]">{msg.proposal.cantidad} unidades</span></p>
                    <div className="flex items-center gap-2 text-slate-700 my-1 font-medium">
                      <span className="text-slate-500">{msg.proposal.origen}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-bold text-[#2D8246]">{msg.proposal.destino}</span>
                    </div>
                    <div className="mt-1 rounded-lg bg-white p-2 text-[11px] text-slate-700 border border-slate-200 font-medium">
                      Balance proyectado en origen: {msg.proposal.stockActualOrigen} → <strong className="text-slate-900">{msg.proposal.stockNuevoOrigen} existencias</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                    <button
                      onClick={() => handleConfirmProposal(msg.proposal!)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#3DAA5C] py-2 text-xs font-bold text-white hover:bg-[#2D8246] transition-colors shadow-xs"
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
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
            <span className="mt-1 text-[10px] text-slate-400 px-1">{msg.time}</span>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 rounded-xl bg-white p-3 text-xs text-[#0891B2] border border-cyan-200 shadow-xs w-fit">
            <Sparkles className="h-4 w-4 animate-spin text-[#06B6D4]" />
            <span className="font-medium">Consultando Gemini y evaluando reglas de negocio...</span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="border-t border-slate-100 bg-white p-4">
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
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#1C3177] focus:outline-none focus:ring-1 focus:ring-[#1C3177]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1C3177] text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2B4BA0] transition-colors shadow-xs"
            aria-label="Enviar mensaje al asistente"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          SIIA v1.0 • Acciones de inventario protegidas con auditoría y confirmación.
        </p>
      </div>
    </div>
  );
};
