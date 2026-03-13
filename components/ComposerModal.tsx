import React, { useState } from 'react';
import { X, Sparkles, Send, Github, MessageSquare, Loader2, Check } from 'lucide-react';
import { Activity } from '../types';

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
  onGenerate: (prompt: string, activityId?: string) => Promise<void>;
  isGenerating: boolean;
}

const ComposerModal: React.FC<ComposerModalProps> = ({ isOpen, onClose, activities, onGenerate, isGenerating }) => {
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [mode, setMode] = useState<'activity' | 'custom'>('activity');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    const finalPrompt = mode === 'activity' 
      ? `Write a LinkedIn post about this activity: ${activities.find(a => a.id === selectedActivityId)?.summary}`
      : customPrompt;
    
    await onGenerate(finalPrompt, selectedActivityId || undefined);
    onClose();
  };

  const recentActivities = activities.filter(a => a.decision === 'skipped').slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Content Composer
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-6">
            <button 
              onClick={() => setMode('activity')}
              className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all
                ${mode === 'activity' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Github className="w-3.5 h-3.5" />
              From Activity
            </button>
            <button 
              onClick={() => setMode('custom')}
              className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all
                ${mode === 'custom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Custom Prompt
            </button>
          </div>

          {mode === 'activity' ? (
            <div className="space-y-3 mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select recent activity</label>
              {recentActivities.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {recentActivities.map((a) => (
                    <button 
                      key={a.id}
                      onClick={() => setSelectedActivityId(a.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3
                        ${selectedActivityId === a.id 
                          ? 'border-purple-200 bg-purple-50 ring-1 ring-purple-500' 
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                    >
                      <div className={`p-1.5 rounded-lg ${selectedActivityId === a.id ? 'bg-purple-500 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                         <Github className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{a.summary}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{new Date(a.created_at).toLocaleDateString()}</p>
                      </div>
                      {selectedActivityId === a.id && <Check className="w-4 h-4 text-purple-600" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 italic text-sm">
                  No recently skipped activities found to draft from.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">What's on your mind?</label>
              <textarea 
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Write a post about the importance of unit testing in large scale applications..."
                className="w-full h-32 p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none resize-none"
              />
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || (mode === 'activity' && !selectedActivityId) || (mode === 'custom' && !customPrompt.trim())}
              className="flex-[2] px-4 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Post...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate with Gemini
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposerModal;