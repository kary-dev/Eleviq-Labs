import { GoogleGenerativeAI } from "@google/generative-ai";

export type CountryEntry = { country: string; views: number };
export type AiDemographicResult = {
  countryData: CountryEntry[];
  totalViews: number | null;
  raw: string;
};

const PROMPT = `You are analyzing a social media analytics screenshot. Extract country/region audience data (views or percentage per country).

Return ONLY valid JSON in this format:
{
  "countryData": [
    {"country": "United States", "views": 15000},
    {"country": "India", "views": 8200}
  ],
  "totalViews": 45000
}

Rules:
- If values are percentages not absolute views, still include them as numbers (e.g. 45.2% → 45.2)
- Include all visible countries
- "totalViews" is the grand total if visible, otherwise null
- If you cannot find country data, return {"countryData": [], "totalViews": null}
- Return ONLY the JSON object, no explanation`;

export async function extractDemographicsFromBytes(
  bytes: ArrayBuffer,
  mimeType: string
): Promise<AiDemographicResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const base64 = Buffer.from(bytes).toString("base64");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    { inlineData: { data: base64, mimeType } },
    PROMPT,
  ]);

  const raw = result.response.text();

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      countryData: parsed.countryData ?? [],
      totalViews: parsed.totalViews ?? null,
      raw,
    };
  } catch {
    return { countryData: [], totalViews: null, raw };
  }
}
