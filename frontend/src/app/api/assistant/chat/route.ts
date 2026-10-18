import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      history = [],
      articulos = [],
      ubicaciones = [],
      mode = 'operativo'
    } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const cleanKey = apiKey.trim();

    // Contexto enriquecido del inventario en tiempo real
    const inventarioContexto = articulos.map((a: any) => ({
      id: a.id,
      nombre: a.nombre,
      sku: a.sku,
      stockActual: a.stockActual,
      stockMinimo: a.stockMinimo,
      unidad: a.unidad,
      categoria: a.categoria,
      ubicacion: a.ubicacionPrincipal,
      costo: a.costoEstimado
    }));

    const systemPrompt = `Eres SIIA (Sistema Inteligente de Inventario con IA) de la institución UOD en República Dominicana.
Eres un asistente profesional de control de existencias y activos con dos modos:
1. "Operativo": respondes consultas sobre existencias, recomiendas compras y preparas órdenes de movimiento.
2. "Tutor": guías paso a paso al personal administrativo sobre el uso del sistema.

DATOS DEL INVENTARIO EN TIEMPO REAL:
${JSON.stringify(inventarioContexto, null, 2)}

UBICACIONES DISPONIBLES:
${JSON.stringify(ubicaciones)}

REGLAS CONVERSACIONALES IMPORTANTES:
- MANTÉN LA MEMORIA DE LA CONVERSACIÓN: Si en el mensaje anterior preguntaste al usuario "¿Desea preparar una orden de entrega o traslado?" y el usuario responde "sí", "hazlo", "por favor" o similar, NO lo saludes de nuevo. Debes asumir inmediatamente la confirmación, preguntar a qué ubicación desea trasladarlo o generar la propuesta de orden directamente con los artículos de los que venían hablando.
- REGLAS DE MOVIMIENTOS: Si el usuario confirma o pide un movimiento (traslado, salida, entrada), NUNCA digas que ya se ejecutó solo; debes preparar la propuesta y al FINAL de tu respuesta incluir el bloque JSON EXACTO:
\`\`\`action_proposal
{
  "tipo": "traslado" | "salida" | "entrada",
  "articuloId": "id-del-articulo",
  "articuloNombre": "nombre exacto del articulo",
  "cantidad": numero_entero_positivo,
  "origen": "nombre ubicacion origen",
  "destino": "nombre ubicacion destino",
  "stockActualOrigen": numero,
  "stockNuevoOrigen": numero,
  "motivo": "justificacion de la orden"
}
\`\`\`
- Si el usuario hace una consulta de existencias o stock, responde con datos exactos del inventario provisto arriba.
- Si el usuario pregunta qué reponer o qué está bajo, analiza qué artículos tienen stockActual <= stockMinimo.
- Sé cordial, profesional y conciso.
- Responde siempre en español.`;

    // 1. Llamar a la API oficial de Gemini (Google AI Studio) con historial multi-turno
    if (cleanKey) {
      try {
        // Filtrar y preparar historial (últimos 6 mensajes relevantes)
        const formattedHistory: any[] = [];
        for (const h of history.slice(-6)) {
          if (h.sender === 'user' || h.sender === 'ai') {
            formattedHistory.push({
              role: h.sender === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }]
            });
          }
        }

        // Agregar el mensaje actual del usuario
        formattedHistory.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': cleanKey
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: `${systemPrompt}\n\nMODO ACTUAL: ${mode}` }]
              },
              contents: formattedHistory,
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2000
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate) {
            return parseAssistantResponse(candidate, inventarioContexto);
          }
        } else {
          const errData = await response.text();
          console.warn('Advertencia API Gemini:', response.status, errData);
        }
      } catch (geminiErr) {
        console.warn('Error llamando a Gemini API:', geminiErr);
      }
    }

    // 2. Motor de Inteligencia y Procesamiento Semántico Local (Respaldo)
    const lower = message.toLowerCase().trim();

    // Si el usuario dijo "si", "dale", "hazlo", "procede"
    const isAffirmative = lower === 'si' || lower === 'sí' || lower === 'claro' || lower === 'hazlo' || lower === 'por favor' || lower === 'dale';
    const lastAiMsg = history.filter((h: any) => h.sender === 'ai').slice(-1)[0]?.text || '';

    if (isAffirmative && lastAiMsg) {
      // Deducir de qué artículo hablaban en el mensaje anterior
      const art = articulos.find((a: any) => lastAiMsg.toLowerCase().includes(a.nombre.toLowerCase()) || lastAiMsg.toLowerCase().includes(a.sku.toLowerCase())) || articulos[0];
      const cantidad = 1;
      const origen = art.ubicacionPrincipal || 'Almacén Central';
      const destino = 'Secretaría General';
      const stockActual = art.stockActual;

      const proposal = {
        id: `prop-${Date.now()}`,
        tipo: 'traslado',
        articuloId: art.id,
        articuloNombre: art.nombre,
        cantidad,
        origen,
        destino,
        stockActualOrigen: stockActual,
        stockNuevoOrigen: Math.max(0, stockActual - cantidad),
        motivo: `Orden generada tras confirmación del usuario para ${art.nombre}`
      };

      return NextResponse.json({
        text: `Entendido. He preparado la orden de traslado para **${art.nombre}** (${cantidad} unidad) desde **${origen}** hacia **${destino}**.\n\nPor favor, confirma la operación en la tarjeta siguiente para registrarla en la bitácora:`,
        proposal,
        isGeminiLive: false
      });
    }

    // Caso A: Traslado o movimiento
    if (lower.includes('traslad') || lower.includes('mover') || lower.includes('pasa') || lower.includes('lleva')) {
      const art = articulos.find((a: any) =>
        lower.includes(a.nombre.toLowerCase()) ||
        lower.includes(a.sku.toLowerCase()) ||
        (lower.includes('papel') && a.sku.includes('PAP')) ||
        (lower.includes('marcador') && a.sku.includes('MAR')) ||
        (lower.includes('laptop') && a.sku.includes('LAP')) ||
        (lower.includes('silla') && a.sku.includes('SIL')) ||
        (lower.includes('jabon') && a.sku.includes('JAB'))
      ) || articulos[0];

      const matchNum = lower.match(/\d+/);
      const cantidad = matchNum ? parseInt(matchNum[0], 10) : 10;

      let destino = 'Secretaría General';
      if (lower.includes('laboratorio')) destino = 'Laboratorio de Cómputo 1';
      else if (lower.includes('rector') || lower.includes('direcci')) destino = 'Rectoría / Dirección';
      else if (lower.includes('central') || lower.includes('almacen')) destino = 'Almacén Central';

      const origen = art.ubicacionPrincipal || 'Almacén Central';
      const stockActual = art.stockActual || 0;
      const stockNuevo = Math.max(0, stockActual - cantidad);

      const proposal = {
        id: `prop-${Date.now()}`,
        tipo: 'traslado',
        articuloId: art.id,
        articuloNombre: art.nombre,
        cantidad,
        origen,
        destino,
        stockActualOrigen: stockActual,
        stockNuevoOrigen: stockNuevo,
        motivo: `Traslado solicitado por usuario mediante Asistente IA (${message})`
      };

      return NextResponse.json({
        text: `He verificado el inventario en **${origen}** para **${art.nombre}**. Hay **${stockActual}** ${art.unidad}s disponibles.\n\nHe generado la propuesta de traslado por **${cantidad} ${art.unidad}s** hacia **${destino}**. Confirma la orden en la tarjeta siguiente:`,
        proposal,
        isGeminiLive: false
      });
    }

    // Caso B: Consulta de stock o existencias
    if (lower.includes('cuanto') || lower.includes('cuánt') || lower.includes('queda') || lower.includes('hay') || lower.includes('stock') || lower.includes('existencia') || lower.includes('laptop')) {
      const art = articulos.find((a: any) =>
        lower.includes(a.nombre.toLowerCase()) ||
        lower.includes(a.sku.toLowerCase()) ||
        (lower.includes('papel') && a.sku.includes('PAP')) ||
        (lower.includes('marcador') && a.sku.includes('MAR')) ||
        (lower.includes('laptop') && a.sku.includes('LAP')) ||
        (lower.includes('silla') && a.sku.includes('SIL')) ||
        (lower.includes('jabon') && a.sku.includes('JAB'))
      );

      if (art) {
        return NextResponse.json({
          text: `📦 **Consulta de Existencias:**\n\n• **Artículo:** ${art.nombre}\n• **SKU:** \`${art.sku}\`\n• **Stock disponible:** **${art.stockActual} ${art.unidad}s**\n• **Ubicación:** ${art.ubicacionPrincipal}\n• **Costo Unitario Est.:** RD$ ${art.costoEstimado.toFixed(2)}\n\n¿Desea preparar alguna orden de entrega o traslado a otra área institucional?`,
          isGeminiLive: false
        });
      }
    }

    return NextResponse.json({
      text: `He recibido tu consulta. Puedes pedirme consultas exactas de stock (ej. "¿Cuántas laptops tenemos?"), alertas de reposición o traslados con confirmación.`,
      isGeminiLive: false
    });

  } catch (error: any) {
    console.error('Error en assistant route:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al procesar la consulta con el asistente' },
      { status: 500 }
    );
  }
}

function parseAssistantResponse(text: string, articulos: any[]) {
  const proposalRegex = /```action_proposal\s*([\s\S]*?)\s*```/;
  const match = text.match(proposalRegex);

  let proposal = undefined;
  let cleanText = text;

  if (match && match[1]) {
    try {
      proposal = JSON.parse(match[1]);
      proposal.id = `prop-${Date.now()}`;
      cleanText = text.replace(proposalRegex, '').trim();
    } catch (e) {
      console.warn('Error al parsear propuesta JSON de Gemini:', e);
    }
  }

  return NextResponse.json({
    text: cleanText,
    proposal,
    isGeminiLive: true
  });
}
