import React, { useState } from 'react';
import { Draft, Activity } from '../types';
import DraftCard from './DraftCard';
import ScheduleModal from './ScheduleModal';
import ComposerModal from './ComposerModal';
import CalendarView from './CalendarView';
import { Filter, Sparkles, Loader2, LayoutGrid, Calendar as CalendarIcon, Send } from 'lucide-react';

interface DraftsViewProps {
  drafts: Draft[];
  setDrafts: React.Dispatch<React.SetStateAction<Draft[]>>;
  activities: Activity[];
  onGenerate: (prompt: string, activityId?: string) => Promise<void>;
  isGenerating: boolean;
  onPublish: (draft: Draft) => Promise<void>;
  onPublishAll?: () => Promise<void>;
}

const DraftsView: React.FC<DraftsViewProps> = ({ drafts, setDrafts, activities, onGenerate, isGenerating, onPublish, onPublishAll }) => {
  const [filter, setFilter] = useState<'all' | 'draft' | 'approved' | 'scheduled' | 'published'>('all');
  const [view, setView] = useState<'grid' | 'calendar'>('grid');
  const [schedulingDraftId, setSchedulingDraftId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const handleStatusChange = async (id: string, newStatus: Draft['status']) => {
    if (newStatus === 'scheduled') {
      setSchedulingDraftId(id);
    } else if (newStatus === 'published') {
      const draft = drafts.find(d => d.id === id);
      if (draft) {
        onPublish(draft);
      }
    } else {
      try {
        const res = await fetch(`/api/drafts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
          setDrafts(prev => prev.map(d => 
            d.id === id ? { 
                ...d, 
                status: newStatus
            } : d
          ));
        }
      } catch (err) {
        console.error('Failed to update draft status', err);
      }
    }
  };

  const handleScheduleConfirm = async (date: Date) => {
    if (schedulingDraftId) {
      const draft = drafts.find(d => d.id === schedulingDraftId);
      if (!draft) return;

      try {
        const res = await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: draft.content, scheduledAt: date.toISOString(), draft_id: schedulingDraftId })
        });
        
        if (res.ok) {
          // Also update the draft status in the backend
          await fetch(`/api/drafts/${schedulingDraftId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'scheduled', scheduled_for: date.toISOString() })
          });

          setDrafts(prev => prev.map(d => 
            d.id === schedulingDraftId 
              ? { ...d, status: 'scheduled', scheduled_for: date.toISOString() } 
              : d
          ));
          setSchedulingDraftId(null);
        }
      } catch (err) {
        console.error('Failed to schedule draft', err);
      }
    }
  };

  const handleStyleChange = async (id: string, style: string) => {
    try {
      const res = await fetch(`/api/drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ writing_style: style })
      });
      if (res.ok) {
        setDrafts(prev => prev.map(d => 
          d.id === id ? { ...d, style } : d
        ));
      }
    } catch (err) {
      console.error('Failed to update draft style', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/drafts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDrafts(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete draft', err);
    }
  };

  const filteredDrafts = filter === 'all' 
    ? drafts 
    : drafts.filter(d => d.status === filter);

  // Group stats
  const stats = {
    draft: drafts.filter(d => d.status === 'draft').length,
    approved: drafts.filter(d => d.status === 'approved').length,
    scheduled: drafts.filter(d => d.status === 'scheduled').length,
    published: drafts.filter(d => d.status === 'published').length
  };

  return (
    <div className="space-y-4">
      <ScheduleModal 
        isOpen={!!schedulingDraftId}
        onClose={() => setSchedulingDraftId(null)}
        onSchedule={handleScheduleConfirm}
      />

      <ComposerModal 
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        activities={activities}
        onGenerate={onGenerate}
        isGenerating={isGenerating}
      />

      {/* Header with View Toggle and Composer Trigger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-slate-100 rounded-lg shadow-inner">
            <button 
              onClick={() => setView('grid')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden lg:inline">Grid</span>
            </button>
            <button 
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title="Calendar View"
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Calendar</span>
            </button>
          </div>
          
          <div className="h-6 w-px bg-slate-200" />
          
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {(['all', 'draft', 'approved', 'scheduled', 'published'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all border whitespace-nowrap
                  ${filter === f 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
              >
                <span className="capitalize">{f}</span>
                {f !== 'all' && stats[f as keyof typeof stats] > 0 && (
                  <span className={`ml-2 px-1.5 rounded-full ${
                    filter === f ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {stats[f as keyof typeof stats]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {stats.approved > 0 && (
            <button 
              onClick={onPublishAll}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              Publish {stats.approved} Approved
            </button>
          )}
          
          <button 
            onClick={() => setIsComposerOpen(true)}
            disabled={isGenerating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 group active:scale-95"
          >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AI Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              AI Assistant
            </>
          )}
        </button>
      </div>
    </div>

      {/* Grid or Calendar View */}
      <div className="min-h-[600px]">
        {view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredDrafts.length > 0 ? (
              filteredDrafts.map(draft => (
                <DraftCard 
                  key={draft.id} 
                  draft={draft} 
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onStyleChange={handleStyleChange}
                  onPublish={onPublish}
                />
              ))
            ) : (
              <div className="col-span-full py-24 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                  <Filter className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No content here</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2 font-medium">
                  There are no drafts matching your current filter. Use the AI Assistant to spark some creativity.
                </p>
              </div>
            )}
          </div>
        ) : (
          <CalendarView 
            drafts={drafts} 
            onDraftClick={(d) => {
              // We could scroll to top or open a specific modal, 
              // for now we'll log it as requested by current patterns.
              console.log('Draft clicked from calendar:', d);
            }} 
          />
        )}
      </div>
    </div>
  );
};

export default DraftsView;