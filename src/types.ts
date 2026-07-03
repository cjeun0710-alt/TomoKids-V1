/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EmotionType = 'sunny' | 'cloudy' | 'rainy' | 'rainbow' | 'starry';

export type MissionCategory = 'life' | 'study';

export type MissionStatus = 'todo' | 'completed' | 'approved';

export interface Mission {
  id: string;
  title: string;
  category: MissionCategory;
  description: string;
  icon: string; // lucide icon name or emoji
  status: MissionStatus;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  completedAt?: string;
}

export type EventType = 
  | 'school' 
  | 'academy_math' 
  | 'academy_english' 
  | 'academy_korean' 
  | 'academy_arts' 
  | 'academy_music' 
  | 'academy_sports' 
  | 'academy_etc' 
  | 'hospital' 
  | 'family' 
  | 'other';

export interface LearningRecommend {
  title: string;
  summary: string;
  duration: string;
  url: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  reminderSetting: '30m' | '10m' | 'none';
  suggestedContent?: LearningRecommend;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrenceId?: string;
}

export interface RewardCoupon {
  id: string;
  title: string;
  requiredPoints: number;
  icon: string;
  status: 'locked' | 'available' | 'requested' | 'used'; // locked: 포인트 부족, available: 교환가능, requested: 아이가 교환신청함, used: 부모가 쿠폰 사용처리함
  redeemedAt?: string;
}

export interface DailyReport {
  weekStartDate: string;
  highlights: string[];
  growthArea: string;
  completedCount: number;
  totalPointsGained: number;
  messageForParents: string;
}
