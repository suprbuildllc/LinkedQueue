import React from 'react';

export type ConnectionStatus = 'connected' | 'paused' | 'error' | 'disconnected';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  credits_balance: number;
}

export type ProviderType = 'github' | 'linkedin' | 'linear' | 'slack' | 'stripe' | 'rss' | 'producthunt' | 'x';

export interface Source {
  id: string;
  provider: ProviderType;
  name: string;
  status: ConnectionStatus;
  last_sync: string;
}

export interface Activity {
  id: string;
  provider: ProviderType;
  summary: string;
  created_at: string;
  decision: 'drafted' | 'skipped';
}

export type DraftStatus = 'draft' | 'approved' | 'rejected' | 'scheduled' | 'published' | 'failed';

export interface Draft {
  id: string;
  content: string;
  status: DraftStatus;
  style: string;
  confidence_score: number;
  created_at: string;
  scheduled_for?: string;
  published_at?: string;
  rejection_reason?: string;
  activity_summary?: string; // Denormalized for UI
  likes?: number;
  comments?: number;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
  created_at: string;
}