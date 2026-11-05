import process from 'process';
import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import {
  normalizeText,
  matchIntent,
  executeLayer1Intent,
  buildLayer3Fallback,
  AssistantContext,
  AssistantAnswer,
} from '../services/assistantService.js';
import { Farm } from '../models/Farm.js';
import { Crop } from '../models/Crop.js';

const router = Router();

// Endpoint supports authenticated requests; unauthenticated requests fall back cleanly with demo defaults
router.post('/ask', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { text, lang = 'en', farmId, page } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ success: false, message: 'Question text is required' });
      return;
    }

    const normalized = normalizeText(text);
    const context: AssistantContext = {
      userId: req.user?._id,
      farmId: farmId,
      lang: lang || 'en',
      page: page || 'home',
    };

    // --- LAYER 1: Always-On Local Intent Engine ---
    const { intent, confidence } = matchIntent(normalized, lang);

    if (intent !== 'unknown') {
      const answer = await executeLayer1Intent(intent, normalized, context);
      res.status(200).json({
        success: true,
        intent: answer.intent,
        topic: answer.topic,
        answer: answer.answer,
        spokenText: answer.spokenText,
        quickChips: answer.quickChips,
        layer: 1,
        confidence: answer.confidence,
        extractedCrop: answer.extractedCrop,
        requiresOfficerContact: answer.requiresOfficerContact,
      });
      return;
    }

    // --- LAYER 2: Optional LLM Integration (Configurable, Timeout 8s) ---
    const llmApiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;

    if (llmApiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        // Fetch farm context for LLM grounding
        let farmContext = 'Standard Indian agricultural plot';
        if (context.userId) {
          const farmDoc = await Farm.findOne({ user: context.userId }).sort({ created_at: -1 }).lean();
          if (farmDoc) {
            const cropDoc = await Crop.findOne({ farm: farmDoc._id }).sort({ created_at: -1 }).lean();
            farmContext = `Farm: ${farmDoc.name}, Soil: ${farmDoc.soil_type}, Area: ${farmDoc.area} ${farmDoc.size_unit || 'acres'}, Active Crop: ${cropDoc?.crop_type || 'wheat'}`;
          }
        }

        const prompt = `You are AgriAdvisor Voice Assistant for Indian farmers. Answer in 2-3 short, clear sentences. Use only this farm context: [${farmContext}].
Never invent pesticide brands or doses. For chemical sprays, tell the farmer to ask their local agriculture extension officer.
Respond in language code: ${lang}.
Farmer asks: "${text}"`;

        const llmRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${llmApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (llmRes.ok) {
          const data = await llmRes.json();
          const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            res.status(200).json({
              success: true,
              intent: 'llm_custom_query',
              topic: 'Agronomic Guidance',
              answer: generatedText.trim(),
              spokenText: generatedText.trim(),
              quickChips: ['Should I irrigate today?', 'Which crop should I grow?', 'Market price'],
              layer: 2,
              confidence: 0.85,
            });
            return;
          }
        }
      } catch (llmErr) {
        console.warn('[Assistant Route] Layer 2 LLM failed/timed out, falling back to Layer 3:', llmErr);
      }
    }

    // --- LAYER 3: Fallback ("I did not understand" + 3 Tappable Questions) ---
    const fallbackAnswer = buildLayer3Fallback(lang);
    res.status(200).json({
      success: true,
      intent: fallbackAnswer.intent,
      topic: fallbackAnswer.topic,
      answer: fallbackAnswer.answer,
      spokenText: fallbackAnswer.spokenText,
      quickChips: fallbackAnswer.quickChips,
      layer: 3,
      confidence: fallbackAnswer.confidence,
    });
  } catch (error: any) {
    console.error('[Assistant Route] Error processing question:', error);
    const fallback = buildLayer3Fallback(req.body.lang || 'en');
    res.status(200).json({
      success: true,
      intent: 'fallback_error',
      topic: 'Assistance',
      answer: fallback.answer,
      spokenText: fallback.spokenText,
      quickChips: fallback.quickChips,
      layer: 3,
      confidence: 0.1,
    });
  }
});

export default router;
