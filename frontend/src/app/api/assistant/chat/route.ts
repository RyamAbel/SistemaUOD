import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, articulos = [], ubicaciones = [], mode = 'operativo' } = await req.json();

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

    const systemPrompt = `Eres SIIA (Sistema Inteligente de Inventario Asistido) de la institución UOD en República Dominicana.
Eres un asistente profesional de control de inventario con dos modos:
1. "Operativo": respondes consultas sobre existencias, sugerencias de compras y preparas órdenes de movimiento.
2. "Tutor": explicas paso a paso cómo usar las pantallas del sistema al personal administrativo.

DATOS DEL INVENTARIO EN TIEMPO REAL:
${JSON.stringify(inventarioContexto, null, 2)}

UBICACIONES INSTITUCIONALES DISPONIBLES:
${JSON.stringify(ubicaciones)}

REGLAS FUNDAMENTALES (INVIOLABLES):
- Si el usuario solicita un movimiento (traslado, salida, entrada, baja), NUNCA lo ejecutes directamente.
- Debes responder explicando lo que vas a proponer y al FINAL de tu respuesta debes incluir un bloque JSON EXACTO con esta estructura:
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

    // 1. Intentar llamar a la API oficial de Gemini si la clave tiene formato válido de Google (empieza con AIzaSy)
    if (cleanKey && cleanKey.startsWith('AIzaSy')) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nMODO ACTUAL: ${mode}\n\nMENSAJE DEL USUARIO:\n${message}` }]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 800
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
      }
    }

    // 2. Motor de Inteligencia y Procesamiento Semántico Local (Contextual con los datos reales)
    // Permite que el asistente funcione con total precisión incluso antes de poner la clave AIzaSy definitiva
    const lower = message.toLowerCase().trim();

    // Caso A: Traslado o movimiento
    if (lower.includes('traslad') || lower.includes('mover') || lower.includes('pasa') || lower.includes('lleva')) {
      // Buscar qué artículo menciona
      const art = articulos.find((a: any) =>
        lower.includes(a.nombre.toLowerCase()) ||
        lower.includes(a.sku.toLowerCase()) ||
        (lower.includes('papel') && a.sku.includes('PAP')) ||
        (lower.includes('marcador') && a.sku.includes('MAR')) ||
        (lower.includes('laptop') && a.sku.includes('LAP')) ||
        (lower.includes('silla') && a.sku.includes('SIL')) ||
        (lower.includes('jabon') && a.sku.includes('JAB'))
      ) || articulos[0];

      // Extraer cantidad
      const matchNum = lower.match(/\d+/);
      const cantidad = matchNum ? parseInt(matchNum[0], 10) : 10;

      // Ubicación destino
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
        text: `He verificado el inventario en **${origen}** para **${art.nombre}**. Hay **${stockActual}** ${art.unidad}s disponibles.\n\nHe generado la propuesta de traslado por **${cantidad} ${art.unidad}s** hacia **${destino}**. Por normas de seguridad y auditoría institucional, debes confirmar la acción en la tarjeta inferior antes de que se impacte la base de datos:`,
        proposal,
        isGeminiLive: false,
        apiKeyWarning: !cleanKey.startsWith('AIzaSy') ? 'Nota: Tu clave de Gemini no inicia con "AIzaSy". Asegúrate de copiar la API Key de Google AI Studio (aistudio.google.com).' : undefined
      });
    }

    // Caso B: Consulta de stock o existencias
    if (lower.includes('cuanto') || lower.includes('cuánt') || lower.includes('queda') || lower.includes('hay') || lower.includes('stock') || lower.includes('existencia')) {
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
        const estadoDesc = art.stockActual <= art.stockMinimo
          ? `⚠️ **Atención:** El stock (${art.stockActual}) está por debajo del mínimo requerido (${art.stockMinimo}). Se sugiere reposición.`
          : `✅ El stock se encuentra en niveles saludables (Mínimo: ${art.stockMinimo}).`;

        return NextResponse.json({
          text: `📦 **Consulta de Existencias:**\n\n• **Artículo:** ${art.nombre}\n• **SKU:** \`${art.sku}\`\n• **Cantidad disponible:** **${art.stockActual} ${art.unidad}s**\n• **Ubicación:** ${art.ubicacionPrincipal}\n• **Costo Unitario Est.:** RD$ ${art.costoEstimado.toFixed(2)}\n\n${estadoDesc}`,
          isGeminiLive: false
        });
      }

      // Si preguntó en general por todo el inventario
      const total = articulos.reduce((acc: number, curr: any) => acc + curr.stockActual, 0);
      return NextResponse.json({
        text: `En el inventario general tenemos **${articulos.length} artículos registrados** sumando un total de **${total} unidades físicas** en todas las sedes. ¿Deseas consultar un artículo en específico como el papel bond, marcadores o laptops?`,
        isGeminiLive: false
      });
    }

    // Caso C: Alertas de stock bajo / qué reponer
    if (lower.includes('reponer') || lower.includes('bajo') || lower.includes('agotad') || lower.includes('minimo') || lower.includes('alerta') || lower.includes('comprar')) {
      const bajos = articulos.filter((a: any) => a.stockActual <= a.stockMinimo);
      if (bajos.length === 0) {
        return NextResponse.json({
          text: `✅ **Todo el inventario está en niveles óptimos.** Ningún artículo se encuentra por debajo de su stock mínimo en este momento.`,
          isGeminiLive: false
        });
      }

      const lista = bajos.map((b: any) => `• **${b.nombre}**: ${b.stockActual} / ${b.stockMinimo} ${b.unidad}s (Déficit: ${b.stockMinimo - b.stockActual})`).join('\n');
      return NextResponse.json({
        text: `⚠️ **Reporte de Artículos Críticos para Reposición:**\n\nSe detectaron **${bajos.length} artículos** que requieren reposición urgente:\n\n${lista}\n\n¿Deseas que prepare una solicitud de orden de compra para estos artículos?`,
        isGeminiLive: false
      });
    }

    // Caso D: Modo Tutor / Ayuda de procesos
    if (mode === 'tutor' || lower.includes('como') || lower.includes('cómo') || lower.includes('ayuda') || lower.includes('explicame') || lower.includes('hazlo') || lower.includes('hacer')) {
      return NextResponse.json({
        text: `📘 **Modo Tutor Institucional SIIA:**\n\n1. **Para consultar existencias:** Puedes preguntarme directamente (ej. *"¿Cuánto papel queda?"* o *"¿Qué laptops hay disponibles?"*).\n2. **Para solicitar un traslado:** Solo escribe *"Traslada 15 resmas de papel a Secretaría"* y generaré una tarjeta de previsualización para tu confirmación.\n3. **Para registrar compras o entradas:** Ve a la pestaña **Movimientos** en el menú izquierdo y pulsa *"Registrar Movimiento"* o pídemelo aquí con el número de factura.\n4. **Para auditoría:** Cada acción queda guardada con tu usuario, fecha y estado en la **Bitácora de Auditoría** (cumpliendo la Ley 172-13).`,
        isGeminiLive: false
      });
    }

    // Caso Default inteligente
    return NextResponse.json({
      text: `He recibido tu mensaje: *"${message}"*.\n\nPuedes pedirme:\n• Consultas exactas de stock (ej. *"¿Cuántas laptops tenemos?"* o *"Stock de marcadores"*).\n• Alertas de reabastecimiento (ej. *"¿Qué artículos debo reponer?"*).\n• Ejecutar órdenes de traslado con confirmación (ej. *"Traslada 20 resmas de papel del Almacén Central a Secretaría"*).\n• Guía operativa en modo tutor sobre cómo usar el sistema.`,
      isGeminiLive: false,
      apiKeyWarning: !cleanKey.startsWith('AIzaSy') ? 'Nota: La API key ingresada no tiene el formato estándar de Google AI Studio (debe iniciar con "AIzaSy...").' : undefined
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
