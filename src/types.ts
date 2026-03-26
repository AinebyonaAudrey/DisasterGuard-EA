export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface DisasterRisk {
  type: 'Flood' | 'Drought' | 'Landslide' | 'Storm' | 'Heatwave' | 'Other';
  level: RiskLevel;
  description: string;
  immediateActions: string[];
  preventionTips: string[];
  evacuationAdvice: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  data?: LocationData;
  timestamp: Date;
}

export interface ChatResponse {
  text: string;
  data?: LocationData;
}

export interface LocationData {
  city: string;
  country: string;
  risks: DisasterRisk[];
  generalAdvice: string;
  sources: { name: string; url: string }[];
}

export type Language = 'English' | 'Swahili' | 'Luganda';
