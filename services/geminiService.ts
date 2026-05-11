import { GoogleGenAI, Chat } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let chatInstance: Chat | null = null;

// Structured lead type matching what we save to the database
export interface StructuredLead {
  name: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  phone?: string;
  email?: string;
  source: string;
  source_url?: string;
  opportunity_type: string; // storm_damage | permit_activity | new_construction | aging_home | etc
  urgency: 'high' | 'medium' | 'low';
  why_lead: string; // why this is a real, actionable lead
  suggested_action: string;
  data_freshness: string; // "found today", "reported 3 days ago", etc
  estimated_value?: number;
}

// HOMEOWNER LEAD FINDER — finds verified, fresh leads for contractors
export const findLeads = async (
  serviceType: string,
  location: string,
  userCoords?: { latitude: number; longitude: number }
): Promise<StructuredLead[]> => {
  const prompt = `You are a lead generation expert helping a ${serviceType} contractor find NEW residential and commercial customers in ${location}.

IMPORTANT RULES:
- Find HOMEOWNERS and BUSINESSES that need ${serviceType} services — NOT other contractors, not generic neighborhoods
- Every lead MUST have a real street address and a reason this is a fresh, verified opportunity
- Include recency signals — if something happened in the last 30 days, note it
- If you cannot verify an address exists, mark urgency as "low" or omit the lead

Search for these high-quality signals:

1. **Storm/Hail/Wind Damage (HIGHEST VALUE)**
   - Look for: recent storm reports in ${location}, insurance claim spikes, neighborhood damage visible on satellite imagery, local news articles about storm damage from the past 2-4 weeks
   - Every lead needs: specific address, description of damage, recency of event

2. **Building Permit Activity**
   - Look for: renovation, roof replacement, HVAC, electrical permits pulled in the last 60 days in ${location}
   - Check city permit portals for ${location}
   - Every lead needs: specific address, permit type, date pulled

3. **New Construction/Recent Sales**
   - Look for: homes sold in last 90 days in ${location} (new homeowners = high remodeling intent)
   - Every lead needs: address, sale date (within 90 days), approximate home age

4. **Aging Housing Stock (roofing/heating focus)**
   - Look for: neighborhoods with homes 20-40 years old in ${location}, homes that haven't had recent work
   - Every lead needs: approximate neighborhood, why this area specifically needs ${serviceType} work

5. **Local Business Activity**
   - Look for: commercial properties, apartment complexes, HOAs in ${location} with visible wear or recent expansion

For each lead found, return a JSON object with this exact structure:
{
  "name": "Homeowner Name or Business Name",
  "address": "123 Main St",
  "city": "Denver",
  "state": "CO",
  "zip": "80203",
  "phone": "720-555-1234",
  "email": "",
  "source": "Denver 9News storm report | City permit portal | Redfin listing",
  "source_url": "https://...",
  "opportunity_type": "storm_damage | permit_activity | new_construction | aging_home | commercial",
  "urgency": "high | medium | low",
  "why_lead": "1-2 sentence explanation of WHY this is a real, verified lead right now",
  "suggested_action": "Specific first step — e.g., 'Knock on door and offer free inspection after hailstorm'",
  "data_freshness": "Reported 3 days ago | Permit pulled 2 weeks ago | Sold 45 days ago",
  "estimated_value": 8500
}

Return EXACTLY 5-10 leads as a JSON array. Do not wrap in markdown code blocks. Do not add preamble text. Return only the JSON array.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  const text = response.text.trim();

  // Strip markdown code blocks if present
  let jsonStr = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    const leads = JSON.parse(jsonStr);
    if (Array.isArray(leads)) {
      return leads.slice(0, 10); // cap at 10 leads per search
    }
    // If it's an object with a leads array, extract it
    if (leads.leads && Array.isArray(leads.leads)) {
      return leads.leads.slice(0, 10);
    }
    console.warn('Unexpected JSON structure from gemini:', text.slice(0, 200));
    return [];
  } catch (e) {
    console.error('Failed to parse leads JSON:', e, '\nResponse:', text.slice(0, 500));
    return [];
  }
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
