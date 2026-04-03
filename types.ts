export enum Tab {
  LEAD_FINDER = 'lead-finder',
  LEAD_QUALIFIER = 'lead-qualifier',
  PIPELINE = 'pipeline',
  CALLS = 'calls',
  MARKETING_COPY = 'marketing-copy',
  BUSINESS_PLANNER = 'business-planner',
  CHAT = 'chat',
  NAME_IDEAS = 'name-ideas',
  ADMIN = 'admin',
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export interface GroundingChunk {
  web?: { uri: string; title: string; };
  maps?: { uri: string; title: string; };
}
