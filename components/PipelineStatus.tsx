import React from 'react';
import { Source, Draft } from '../types';
import { 
  Radio, 
  Bot, 
  FileText, 
  Send, 
  Zap
} from 'lucide-react';

interface PipelineStatusProps {
  sources: Source[];
  drafts: Draft[];
}

const PipelineStatus: React.FC<PipelineStatusProps> = ({ sources, drafts }) => {
  const connectedSourcesCount = sources.filter(s => s.status === 'connected').length;
  const pendingReviewCount = drafts.filter(d => d.status === 'draft').length;
  
  const nextScheduledDraft = drafts
    .filter(d => d.status === 'scheduled' && d.scheduled_for)
    .sort((a, b) => new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime())[0];

  const nextSlotTime = nextScheduledDraft 
    ? new Date(nextScheduledDraft.scheduled_for!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : 'No slots';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Work-to-Content Pipeline
          </h2>
          <p className="text-sm text-slate-500">Real-time status of your automated publishing flow</p>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full animate-pulse">
          Active
        </span>
      </div>

      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 hidden md:block" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          
          {/* Step 1: The Listener */}
          <div className="relative flex flex-col items-center text-center p-3 bg-white rounded-lg border border-slate-100 hover:border-blue-200 transition-colors group z-10">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">The Listener</h3>
            <p className="text-xs text-slate-500 mt-0.5">Monitoring {sources.length} sources</p>
            <div className="mt-2 text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {connectedSourcesCount} Connected
            </div>
          </div>

          {/* Step 2: Narrative Engine */}
          <div className="relative flex flex-col items-center text-center p-3 bg-white rounded-lg border border-slate-100 hover:border-purple-200 transition-colors group z-10">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Narrative Engine</h3>
            <p className="text-xs text-slate-500 mt-0.5">LLM Orchestration</p>
            <div className="mt-2 text-[10px] font-medium bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
              Claude 3.5 Sonnet
            </div>
          </div>

          {/* Step 3: Draft Queue */}
          <div className="relative flex flex-col items-center text-center p-3 bg-white rounded-lg border border-slate-100 hover:border-amber-200 transition-colors group z-10">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Content Queue</h3>
            <p className="text-xs text-slate-500 mt-0.5">Review & Approval</p>
            <div className="mt-2 text-[10px] font-medium bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
              {pendingReviewCount} Pending Review
            </div>
          </div>

          {/* Step 4: Publishing */}
          <div className="relative flex flex-col items-center text-center p-3 bg-white rounded-lg border border-slate-100 hover:border-green-200 transition-colors group z-10">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">LinkedIn</h3>
            <p className="text-xs text-slate-500 mt-0.5">Auto-Publishing</p>
            <div className="mt-2 text-[10px] font-medium bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
              Next: {nextSlotTime}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineStatus;