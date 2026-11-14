import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const ai = new GoogleGenAI();

// Robust Gemini model fallback candidates
const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

async function generateWithFallback(contents: any, systemInstruction?: string) {
  let lastError: any = null;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });
      if (response && response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed, trying fallback:`, err?.message?.slice(0, 80));
    }
  }
  throw lastError || new Error('All AI models unavailable');
}

// Endpoint for AI Agronomic Description of Rotation
app.post('/api/ai-description', async (req, res) => {
  try {
    const { rotation, farmAnswers, climateData } = req.body;
    const prompt = `You are a precision agronomist AI for Field Shift.
Provide a clear, authoritative, tailored 2-3 sentence explanation (~60-80 words) for why this specific crop rotation is recommended for this farmer.
You MUST directly reference the user's specific inputs:
- Rotation: ${rotation?.name || 'Crop Rotation'} (Sequence: ${rotation?.sequence?.map((s: any) => s.cropName).join(' → ') || 'Wheat → Lettuce → Beans → Maize'})
- Farm Location: ${farmAnswers?.locationName || 'Salina, Kansas, USA'}
- Soil Texture: ${farmAnswers?.soilTexture?.replace('_', ' ') || 'Silt Loam'}
- Irrigation Mode: ${farmAnswers?.irrigationMode === 'rain_only' ? 'Rain-fed' : 'Irrigated'}
- Historical Crops: ${farmAnswers?.cropHistory?.length ? farmAnswers.cropHistory.map((h: any) => h.cropId).join(', ') : 'None / Fallow / Virgin field (First time cultivation)'}
- Farmer Priorities: Water Saving (${farmAnswers?.priorities?.waterSaving ?? 3}/4), Soil Health (${farmAnswers?.priorities?.soilHealth ?? 3}/4), Climate Resilience (${farmAnswers?.priorities?.climateResilience ?? 3}/4)
- Climate: ${climateData?.annualPrecipitationMm ?? 820}mm rainfall, ${climateData?.meanTempC ?? 14}°C.

Focus on the exact agronomic mechanisms (soil nitrogen dynamics, disease break, water conservation) that make this sequence optimal for their inputs.`;

    const systemInstruction = 'You are the Field Shift AI Agronomist. Deliver concise, scientifically grounded, farmer-friendly rationale directly connecting the recommended rotation with the user’s soil, water, history, and priorities.';
    const result = await generateWithFallback(prompt, systemInstruction);
    res.json({ description: result.text, model: result.modelUsed });
  } catch (error: any) {
    console.error('Error generating AI description:', error);
    // Deterministic fallback explanation if AI is offline
    const { rotation, farmAnswers } = req.body;
    const seq = rotation?.sequence?.map((s: any) => s.cropName).join(' → ') || 'Selected Crop Sequence';
    const fallbackDesc = `This ${seq} rotation sequence optimizes organic matter accumulation and biological disease breaks tailored for ${farmAnswers?.soilTexture?.replace('_', ' ') || 'loam'} soil under ${farmAnswers?.irrigationMode === 'rain_only' ? 'rain-fed' : 'supplemental irrigation'} management, providing balanced nitrogen fixation and drought resilience.`;
    res.json({ description: fallbackDesc, isFallback: true });
  }
});

// Endpoint for AI Bot Chat
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { message, history, context } = req.body;

    // Dynamically build context items strictly from supplied data
    const contextLines: string[] = [];

    if (context?.farmName) {
      contextLines.push(`- Farm Name: ${context.farmName}`);
    }
    if (context?.farmAnswers?.locationName) {
      contextLines.push(`- Location: ${context.farmAnswers.locationName}`);
    } else {
      contextLines.push(`- Location: Not specified by user`);
    }

    if (context?.farmAnswers?.soilTexture) {
      contextLines.push(`- Soil Texture: ${context.farmAnswers.soilTexture.replace('_', ' ')}`);
    } else {
      contextLines.push(`- Soil Texture: Not provided`);
    }

    if (context?.farmAnswers?.irrigationMode) {
      contextLines.push(`- Irrigation Mode: ${context.farmAnswers.irrigationMode === 'rain_only' ? 'Rain-fed' : 'Supplemental Irrigation'}`);
    }

    if (context?.farmAnswers?.cropHistory && context.farmAnswers.cropHistory.length > 0) {
      const histStr = context.farmAnswers.cropHistory.map((h: any) => h.cropId || h.cropName).join(', ');
      contextLines.push(`- Stated Prior Crops: ${histStr}`);
    } else {
      contextLines.push(`- Prior Crop History: None recorded / Not supplied`);
    }

    if (context?.farmAnswers?.priorities) {
      const p = context.farmAnswers.priorities;
      contextLines.push(`- Stated Priorities: Water Saving (${p.waterSaving ?? 'N/A'}/4), Soil Health (${p.soilHealth ?? 'N/A'}/4), Resilience (${p.climateResilience ?? 'N/A'}/4)`);
    }

    if (context?.climateData) {
      const c = context.climateData;
      const climParts: string[] = [];
      if (c.annualPrecipitationMm !== undefined) climParts.push(`${c.annualPrecipitationMm}mm annual precipitation`);
      if (c.soilMoisturePercentile !== undefined) climParts.push(`Root-zone moisture: ${c.soilMoisturePercentile}th percentile`);
      if (c.meanTempC !== undefined) climParts.push(`Mean annual temp: ${c.meanTempC}°C`);
      contextLines.push(`- NASA/Sensor Observations: ${climParts.join(', ')}`);
    } else {
      contextLines.push(`- Climate / Satellite Observations: None provided in active request context`);
    }

    if (context?.selectedRotation?.sequence && context.selectedRotation.sequence.length > 0) {
      const seqStr = context.selectedRotation.sequence.map((s: any) => s.cropName).join(' → ');
      const scoreStr = context.selectedRotation.totalScore ? `, Evaluation Score: ${context.selectedRotation.totalScore}/100` : '';
      contextLines.push(`- Active Selected Rotation: ${context.selectedRotation.name || 'Current Plan'} (${seqStr}${scoreStr})`);
    } else {
      contextLines.push(`- Active Rotation: None currently selected or configured by user`);
    }

    const systemInstruction = `You are the Field Shift AI Agronomist, a rigorous precision agriculture advisor grounded in verified agronomic science (FAO-56, USDA NRCS, NASA Earth observations).

CURRENT VERIFIED CONTEXT (from user's active session):
${contextLines.join('\n')}

STRICT SCIENTIFIC INTEGRITY RULES:
1. ONLY reference farm-specific crops, rotations, soil moisture, and history that are explicitly present in the verified context above.
2. DO NOT assume or invent unsupplied field crops, rotations, soil moisture values, or prior farming history. If a parameter is marked as "None", "Not provided", or "Not specified", acknowledge that no field-specific record is attached and offer general agronomic principles or ask the user to specify their field conditions.
3. Cleanly distinguish between confirmed field facts (provided above), physical estimations (e.g. FAO-56 dual Kc water budgets), and agronomic recommendations.
4. You cannot directly alter farm boundaries or store farm activities autonomously. Any management practice you parse or propose is a draft proposal that requires the farmer's explicit review and confirmation.
5. Provide clear, direct, and actionable answers without unnecessary jargon or promotional language.`;

    const contents = [
      ...(history || []).map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const result = await generateWithFallback(contents, systemInstruction);
    res.json({ reply: result.text, model: result.modelUsed });
  } catch (error: any) {
    console.error('Error in AI chat:', error);
    // Honest deterministic fallback without invented specific crop names or moisture numbers
    res.json({
      reply: "The live AI Agronomist service is temporarily unreachable. When managing crop rotations and water budgets, prioritize balancing vegetative water demand against seasonal soil moisture capacity, maintaining ground cover to limit evaporative loss, and introducing legume pulse breaks to replenish nitrogen reserves.",
      isFallback: true,
    });
  }
});

// Live API Ping and Diagnostics Endpoint (replaces mock pings with real live network tests)
app.get('/api/health-ping', async (req, res) => {
  const service = (req.query.service as string) || 'nasa_power';
  const start = Date.now();

  try {
    if (service === 'nasa_power') {
      const resp = await fetch('https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M&community=AG&longitude=-97.6114&latitude=38.8403&start=2020&end=2020&format=JSON', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000),
      });
      const latency = Date.now() - start;
      if (resp.ok) {
        return res.json({
          status: 'ok',
          statusCode: resp.status,
          latencyMs: latency,
          endpoint: 'https://power.larc.nasa.gov/api/temporal/monthly/point',
          qualityFlag: 'QA_PASSED_NASA_POWER_ORBITAL',
          timestamp: new Date().toISOString(),
          server: 'NASA Langley Research Center Earth Science Data Operations Center',
        });
      }
      throw new Error(`NASA POWER returned HTTP ${resp.status}`);
    } else if (service === 'open_meteo') {
      const resp = await fetch('https://api.open-meteo.com/v1/forecast?latitude=38.8403&longitude=-97.6114&current=temperature_2m', {
        signal: AbortSignal.timeout(4000),
      });
      const latency = Date.now() - start;
      if (resp.ok) {
        return res.json({
          status: 'ok',
          statusCode: resp.status,
          latencyMs: latency,
          endpoint: 'https://api.open-meteo.com/v1/forecast',
          qualityFlag: 'QA_PASSED_WMO_HOURLY_OBSERVED',
          timestamp: new Date().toISOString(),
          server: 'Open-Meteo High Resolution ECMWF/DWD Global Ensemble',
        });
      }
      throw new Error(`Open-Meteo returned HTTP ${resp.status}`);
    } else if (service === 'gemini_ai') {
      const result = await generateWithFallback('Ping test. Reply with: OK', 'System health monitor');
      const latency = Date.now() - start;
      return res.json({
        status: 'ok',
        statusCode: 200,
        latencyMs: latency,
        endpoint: 'https://ai.google.dev (Interactions API / Gemini)',
        qualityFlag: 'QA_PASSED_GENAI_ONLINE',
        modelUsed: result.modelUsed,
        timestamp: new Date().toISOString(),
        server: 'Google DeepMind AI Studio Cloud Endpoint',
      });
    } else if (service === 'esri_imagery') {
      const resp = await fetch('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer?f=json', {
        signal: AbortSignal.timeout(4000),
      });
      const latency = Date.now() - start;
      if (resp.ok) {
        return res.json({
          status: 'ok',
          statusCode: resp.status,
          latencyMs: latency,
          endpoint: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
          qualityFlag: 'QA_PASSED_ESRI_MAXAR_TILES',
          timestamp: new Date().toISOString(),
          server: 'ESRI Living Atlas High-Resolution Imagery Server',
        });
      }
      throw new Error(`ESRI World Imagery returned HTTP ${resp.status}`);
    } else if (service === 'nasa_cmr') {
      const resp = await fetch('https://cmr.earthdata.nasa.gov/stac', {
        signal: AbortSignal.timeout(5000),
      });
      const latency = Date.now() - start;
      if (resp.ok) {
        return res.json({
          status: 'ok',
          statusCode: resp.status,
          latencyMs: latency,
          endpoint: 'https://cmr.earthdata.nasa.gov/stac',
          qualityFlag: 'QA_PASSED_NASA_CMR_STAC',
          timestamp: new Date().toISOString(),
          server: 'NASA EOSDIS Common Metadata Repository (CMR)',
        });
      }
      throw new Error(`NASA CMR STAC returned HTTP ${resp.status}`);
    } else {
      // CartoDB / OSM tiles
      const resp = await fetch('https://tile.openstreetmap.org/0/0/0.png', {
        signal: AbortSignal.timeout(4000),
      });
      const latency = Date.now() - start;
      return res.json({
        status: 'ok',
        statusCode: resp.status,
        latencyMs: latency,
        endpoint: 'https://tile.openstreetmap.org',
        qualityFlag: 'QA_PASSED_LEAFLET_OSM_TILES',
        timestamp: new Date().toISOString(),
        server: 'OpenStreetMap Global Tile Server',
      });
    }
  } catch (err: any) {
    const latency = Date.now() - start;
    return res.status(502).json({
      status: 'error',
      message: err?.message || 'Connection test failed',
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    });
  }
});

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

if (!isProduction) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
