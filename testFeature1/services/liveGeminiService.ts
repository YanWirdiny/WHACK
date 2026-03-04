/**
 * Live Gemini Service
 *
 * Handles differential frame analysis for continuous environment awareness.
 * Two modes:
 *   - BASELINE: First scan — maps the full scene
 *   - DIFFERENTIAL: Subsequent scans — reports only what changed
 *   - ON_DEMAND: Full deep scan triggered by user (double tap)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export type AnalysisMode = 'baseline' | 'differential' | 'on_demand';

export interface LiveHazard {
  name: string;
  position: 'left' | 'center' | 'right' | string;
  distance_estimate: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  action: string; // what the user should do
}

export interface LiveAnalysisResult {
  mode: AnalysisMode;
  has_change: boolean;           // false = stay silent
  safety_level: 'safe' | 'caution' | 'warning' | 'danger';
  spoken_narrative: string;      // what to speak aloud
  hazards: LiveHazard[];
  scene_summary?: string;        // baseline only
}

// ─── Prompts ────────────────────────────────────────────────────────────────

const BASELINE_PROMPT = `
You are a real-time safety assistant for a visually impaired person.
Analyze this scene and create a spatial map of the environment.

Respond ONLY with valid JSON in this exact format:
{
  "mode": "baseline",
  "has_change": true,
  "safety_level": "safe" | "caution" | "warning" | "danger",
  "spoken_narrative": "A 2-sentence natural description of the environment for the user",
  "scene_summary": "Brief internal description of static elements for future comparison",
  "hazards": [
    {
      "name": "object name",
      "position": "left" | "center" | "right",
      "distance_estimate": "e.g. 3 steps ahead",
      "urgency": "critical" | "high" | "medium" | "low",
      "action": "what the user should do, e.g. stop, move left"
    }
  ]
}

Rules:
- Focus ONLY on objects in the walking path
- Ignore decorative elements, background, sky
- spoken_narrative should sound natural when spoken aloud
- If environment is safe, hazards array should be empty
`;

const DIFFERENTIAL_PROMPT = (baseline: string) => `
You are a real-time safety assistant for a visually impaired person.
The user's baseline environment was: "${baseline}"

Compare this NEW frame to the baseline. Report ONLY meaningful changes.

Respond ONLY with valid JSON in this exact format:
{
  "mode": "differential",
  "has_change": true | false,
  "safety_level": "safe" | "caution" | "warning" | "danger",
  "spoken_narrative": "1-2 sentence update, ONLY if has_change is true. Otherwise empty string.",
  "hazards": [
    {
      "name": "object name",
      "position": "left" | "center" | "right",
      "distance_estimate": "e.g. 3 steps ahead",
      "urgency": "critical" | "high" | "medium" | "low",
      "action": "what the user should do"
    }
  ]
}

Report changes ONLY for:
1. NEW objects that entered the scene
2. Objects that moved significantly
3. Distance changes to existing hazards (getting closer/farther)
4. Hazards that disappeared (path now clear)

If nothing meaningful changed, set has_change to false and spoken_narrative to "".
Silence is better than noise — only alert when it matters.
`;

const ON_DEMAND_PROMPT = `
You are a real-time safety assistant for a visually impaired person who just requested
a full environment description.

Give a thorough analysis of this scene.

Respond ONLY with valid JSON in this exact format:
{
  "mode": "on_demand",
  "has_change": true,
  "safety_level": "safe" | "caution" | "warning" | "danger",
  "spoken_narrative": "3-5 sentence detailed description of the environment, written to be spoken aloud naturally. Include direction, distance, and any hazards.",
  "scene_summary": "Full scene description",
  "hazards": [
    {
      "name": "object name",
      "position": "left" | "center" | "right",
      "distance_estimate": "e.g. 3 steps ahead",
      "urgency": "critical" | "high" | "medium" | "low",
      "action": "what the user should do"
    }
  ]
}

Be thorough — the user specifically asked for this. Include:
- What type of space this is (indoors/outdoors, room type, street, etc.)
- All significant objects and their positions
- Clear navigation guidance
`;

// ─── Core Analysis Function ─────────────────────────────────────────────────

export async function analyzeFrame(
  base64Image: string,
  mode: AnalysisMode,
  baselineSummary?: string
): Promise<LiveAnalysisResult | null> {
  if (!API_KEY) {
    console.error('❌ Gemini API key not configured');
    return null;
  }

  try {
    let prompt: string;

    if (mode === 'baseline') {
      prompt = BASELINE_PROMPT;
    } else if (mode === 'differential') {
      prompt = DIFFERENTIAL_PROMPT(baselineSummary || 'unknown environment');
    } else {
      prompt = ON_DEMAND_PROMPT;
    }

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
    ]);

    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    const parsed: LiveAnalysisResult = JSON.parse(cleaned);
    return parsed;

  } catch (error) {
    console.error(`❌ Live Gemini error (${mode}):`, error);
    return null;
  }
}
