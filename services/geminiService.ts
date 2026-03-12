import { GoogleGenAI, Chat } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let chatInstance: Chat | null = null;

// HOMEOWNER LEAD FINDER — finds potential customers for a contractor (not other contractors)
export const findLeads = async (serviceType: string, location: string, userCoords?: { latitude: number; longitude: number }): Promise<GenerateContentResponse> => {
  const prompt = `You are a lead generation expert helping a ${serviceType} contractor find new residential and commercial customers in ${location}.

Your goal is to find HOMEOWNERS and BUSINESSES that likely need ${serviceType} services — NOT other contractors.

Search for the following signals in the ${location} area:
1. **Recent storm, hail, wind, or weather damage** — news reports, community alerts, insurance claims spikes
2. **Neighborhoods with aging housing stock** — homes 15–30+ years old that likely need ${serviceType} work
3. **Recent real estate activity** — newly sold or newly listed homes (new owners often need inspections/work)
4. **Local permit activity** — renovation or construction permits that commonly pair with ${serviceType}
5. **Community discussions** — local Facebook groups, Nextdoor posts, or forums where residents mention needing ${serviceType}
6. **Commercial properties** — businesses, apartment complexes, or HOAs that may need ${serviceType} services

For each opportunity found, provide:
- **Area/Neighborhood** — specific location
- **Opportunity Type** — what signal was found (storm damage, new homeowner, etc.)
- **Why It's a Lead** — brief explanation
- **Urgency** — High / Medium / Low
- **Suggested First Step** — how the contractor should approach this lead

Format as a clear, actionable list. Focus on real, specific opportunities in ${location} — not generic advice.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });
  return response;
};

// CONTRACTOR FINDER — for admin use only, finds contractors to sell LeadHub to
export const findContractors = async (serviceType: string, location: string): Promise<GenerateContentResponse> => {
  const prompt = `Find ${serviceType} businesses near ${location}. For each, provide their business name, address, phone number if available, approximate size (solo, small team, or large company), and any signals that suggest they might need better lead generation tools (e.g., limited web presence, no reviews, or heavy reliance on Angi/HomeAdvisor). Format as a clear list.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });
  return response;
};

export const qualifyLead = async (leadInfo: string): Promise<GenerateContentResponse> => {
  const prompt = `You are an expert sales assistant for a home services business. Analyze the following lead and provide a qualification score from 1-10, a summary of their needs, potential budget, urgency, and suggest concrete next steps for engagement. Format the output in Markdown.
  ---
  LEAD INFORMATION:
  ${leadInfo}
  ---
  ANALYSIS:`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
  });
  return response;
};

export const generateMarketingCopy = async (serviceType: string, targetAudience: string, tone: string): Promise<GenerateContentResponse> => {
  const prompt = `Generate 3 short, catchy marketing ad copy options for a ${serviceType} business.
  Target Audience: ${targetAudience}
  Tone of Voice: ${tone}
  
  Provide the output in a clean, easy-to-read format. For example:
  **Option 1:** [Headline] - [Body]
  **Option 2:** [Headline] - [Body]
  **Option 3:** [Headline] - [Body]
  `;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  return response;
};

export const generateBusinessPlan = async (prompt: string): Promise<GenerateContentResponse> => {
  const fullPrompt = `As a world-class business consultant, develop a comprehensive, actionable business strategy based on the following request. The strategy should be detailed, well-structured using Markdown, and cover key areas like marketing, operations, finance, and growth milestones.
  ---
  REQUEST:
  ${prompt}
  ---
  STRATEGY:`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: fullPrompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });
  return response;
};

export const generateBusinessNames = async (serviceType: string): Promise<GenerateContentResponse> => {
  const prompt = `Generate 10 creative and professional business names for a ${serviceType} company. Provide a brief one-sentence rationale for each name.`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
  });
  return response;
};


// Chat Service
export const startChat = (): Chat => {
  chatInstance = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'You are a helpful AI assistant for a home services business owner. You are friendly, knowledgeable, and provide concise, actionable advice.',
    },
  });
  return chatInstance;
};

export const sendMessageToChat = async (message: string): Promise<GenerateContentResponse> => {
  if (!chatInstance) {
    startChat();
  }
  if (!chatInstance) {
    throw new Error("Chat not initialized");
  }
  return await chatInstance.sendMessage({ message });
};
