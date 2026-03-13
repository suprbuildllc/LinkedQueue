import React from 'react';
import { Activity, Draft, Source, User } from './types';
import { Github, Linkedin, Slack, Trello, CreditCard, Rss, Rocket, Twitter } from 'lucide-react';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex Developer',
  email: 'alex@example.com',
  avatar_url: 'https://picsum.photos/200',
  credits_balance: 450
};

export const INITIAL_SOURCES: Source[] = [
  {
    id: 's1',
    provider: 'github',
    name: 'alex-dev/linked-queue',
    status: 'connected',
    last_sync: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
  {
    id: 's2',
    provider: 'linkedin',
    name: 'Alex Developer',
    status: 'connected',
    last_sync: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
  },
  {
    id: 's3',
    provider: 'linear',
    name: 'Product Team',
    status: 'paused',
    last_sync: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 's4',
    provider: 'stripe',
    name: 'SaaS Revenue Events',
    status: 'connected',
    last_sync: new Date(Date.now() - 1000 * 60 * 120).toISOString(), 
  },
  {
    id: 's5',
    provider: 'rss',
    name: 'TechCrunch & IndieHackers',
    status: 'disconnected',
    last_sync: '', 
  },
  {
    id: 's6',
    provider: 'producthunt',
    name: 'Competitor Launches',
    status: 'disconnected',
    last_sync: '', 
  },
  {
    id: 's7',
    provider: 'x',
    name: 'X (Twitter)',
    status: 'disconnected',
    last_sync: '',
  }
];

export const INITIAL_DRAFTS: Draft[] = [
  {
    id: 'd1',
    content: "🚀 Just shipped the new LinkedIn integration for LinkedQueue! It was a challenging build involving OAuth token management and edge functions, but we can now schedule posts directly from GitHub commits. #BuildInPublic #SaaS #Engineering",
    status: 'approved',
    style: 'humble_builder',
    confidence_score: 0.92,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    activity_summary: "Completed LinkedIn Publishing (Write-Path) implementation"
  },
  {
    id: 'd2',
    content: "Refactoring the authentication flow today. It's amazing how much complexity hides behind a simple 'Sign In' button. We moved everything to Supabase Auth and it's 10x smoother now. What's your go-to auth provider?",
    status: 'draft',
    style: 'technical_deep_dive',
    confidence_score: 0.85,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    activity_summary: "Refactored auth middleware"
  },
  {
    id: 'd3',
    content: "Big milestone: 100th commit to the repository! 💯 Consistency is key in software development. Small daily improvements compound over time.",
    status: 'scheduled',
    scheduled_for: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
    style: 'motivational',
    confidence_score: 0.78,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    activity_summary: "100th Commit Milestone"
  },
  {
    id: 'd4',
    content: "Looking into optimizing our edge function cold starts. Currently seeing ~500ms latency. Anyone have tips for V8 isolate optimization on Supabase Edge Functions?",
    status: 'published',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    style: 'question',
    confidence_score: 0.88,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    activity_summary: "Performance optimization on edge functions",
    likes: 42,
    comments: 12
  },
  {
    id: 'd5',
    content: "Why testing your API endpoints is just as important as testing your UI. Spent the morning setting up Playwright for our backend. Game changer. 🛠️",
    status: 'published',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    style: 'technical_deep_dive',
    confidence_score: 0.95,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 100).toISOString(),
    activity_summary: "API integration tests",
    likes: 89,
    comments: 24
  },
  {
    id: 'd6',
    content: "Just hit 10 stars on GitHub for LinkedQueue! It's small, but it's a start. Thank you to everyone supporting the journey. ✨",
    status: 'published',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(),
    style: 'humble_builder',
    confidence_score: 0.82,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 150).toISOString(),
    activity_summary: "GitHub Stars Milestone",
    likes: 156,
    comments: 31
  }
];

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    provider: 'github',
    summary: "Merged PR: LinkedIn Publishing Service",
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    decision: 'drafted'
  },
  {
    id: 'a5',
    provider: 'stripe',
    summary: "New MRR Milestone Reached: $1k",
    created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    decision: 'drafted'
  },
  {
    id: 'a2',
    provider: 'github',
    summary: "Update README.md with deployment instructions",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    decision: 'skipped'
  },
  {
    id: 'a3',
    provider: 'github',
    summary: "Fix type definition in vite-env.d.ts",
    created_at: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    decision: 'skipped'
  },
  {
    id: 'a4',
    provider: 'github',
    summary: "Refactor auth middleware for better error handling",
    created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    decision: 'drafted'
  }
];

export const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  github: <Github className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  linear: <Trello className="w-5 h-5" />, // Using Trello icon as proxy for Linear
  slack: <Slack className="w-5 h-5" />,
  stripe: <CreditCard className="w-5 h-5" />,
  rss: <Rss className="w-5 h-5" />,
  producthunt: <Rocket className="w-5 h-5" />,
  x: <Twitter className="w-5 h-5" />
};

export const WRITING_STYLES = [
  { id: 'humble_builder', label: 'Humble Builder' },
  { id: 'technical_deep_dive', label: 'Technical Deep Dive' },
  { id: 'motivational', label: 'Motivational' },
  { id: 'question', label: 'Question / Engagement' },
  { id: 'storytelling', label: 'Storytelling' },
  { id: 'contrarian', label: 'Contrarian View' },
  { id: 'tutorial', label: 'How-to / Tutorial' },
  { id: 'behind_the_scenes', label: 'Behind the Scenes' }
];