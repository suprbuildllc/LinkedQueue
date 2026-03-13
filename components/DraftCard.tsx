import React, { useState, useRef, useEffect } from 'react';
import { Draft } from '../types';
import { WRITING_STYLES } from '../constants';
import { 
  Calendar, 
  Send, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ThumbsUp,
  Github,
  RefreshCcw,
  Loader2,
  XCircle,
  Sparkles,
  Tag,
  ChevronDown,
  Plus
} from 'lucide-react';

interface DraftCardProps {
  draft: Draft;
  onStatusChange: (id: string, status: Draft['status']) => void;
  onDelete: (id: string) => void;
  onStyleChange: (id: string, style: string) => void;
  onPublish?: (draft: Draft) => Promise<void>;
}

const DraftCard: React.FC<DraftCardProps> = ({ draft, onStatusChange, onDelete, onStyleChange, onPublish }) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [customStyleInput, setCustomStyleInput] = useState('');
  const styleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(event.target as Node)) {
        setIsStyleMenuOpen(false);
      }
    };

    if (isStyleMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStyleMenuOpen]);

  const handlePublish = async () => {
    setIsPublishing(true);
    setErrorMessage(null);
    
    if (onPublish) {
      try {
        await onPublish(draft);
      } catch (error) {
        onStatusChange(draft.id, 'failed');
        setErrorMessage("Failed to publish to LinkedIn.");
      }
    } else {
      // Fallback simulation
      await new Promise(resolve => setTimeout(resolve, 1500));
      const fail = Math.random() < 0.20;
      if (fail) {
        onStatusChange(draft.id, 'failed');
        setErrorMessage("Network timeout. Connection to LinkedIn API failed.");
      } else {
        onStatusChange(draft.id, 'published');
        setErrorMessage(null);
      }
    }
    setIsPublishing(false);
  };

  const handleStyleSelect = (styleId: string) => {
    onStyleChange(draft.id, styleId);
    setIsStyleMenuOpen(false);
  };

  const handleCustomStyleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStyleInput.trim()) {
      onStyleChange(draft.id, customStyleInput.trim());
      setCustomStyleInput('');
      setIsStyleMenuOpen(false);
    }
  };

  const getStatusColor = (status: Draft['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'published': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'scheduled': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'draft': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: Draft['status']) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'published': return <Send className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Edit3 className="w-4 h-4" />;
    }
  };

  const currentStyleLabel = WRITING_STYLES.find(s => s.id === draft.style)?.label || draft.style;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-sm transition-all duration-300 flex flex-col h-full group overflow-hidden">
      <div className="p-5 flex-1 relative">
        <div className="flex justify-between items-start mb-4">
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(draft.status)}`}>
            {getStatusIcon(draft.status)}
            <span>{draft.status}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Style Selector */}
            <div className="relative" ref={styleMenuRef}>
              <button 
                onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                title="Change writing style"
              >
                <Tag className="w-3 h-3" />
                <span className="max-w-[80px] truncate">{currentStyleLabel}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>

              {isStyleMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Select Style</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto py-1">
                    {WRITING_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => handleStyleSelect(style.id)}
                        className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-between ${draft.style === style.id ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
                      >
                        {style.label}
                        {draft.style === style.id && <CheckCircle className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t border-slate-100 bg-slate-50">
                    <form onSubmit={handleCustomStyleSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={customStyleInput}
                        onChange={(e) => setCustomStyleInput(e.target.value)}
                        placeholder="Custom style..."
                        className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                      <button 
                        type="submit"
                        disabled={!customStyleInput.trim()}
                        className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span>{Math.round(draft.confidence_score * 100)}%</span>
            </div>
          </div>
        </div>
        
        {draft.activity_summary && (
          <div className="flex items-center gap-2 mb-4 text-[10px] font-semibold text-slate-500 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <Github className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{draft.activity_summary}</span>
          </div>
        )}

        <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
          {draft.content}
        </p>

        {errorMessage && draft.status === 'failed' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-start gap-2.5">
            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-4 bg-slate-50/30 rounded-b-xl flex justify-between items-center">
        <div className="flex gap-2 w-full">
          {draft.status === 'draft' && (
            <>
              <button 
                onClick={() => onStatusChange(draft.id, 'approved')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-all active:scale-95 shadow-xs shadow-green-100"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Approve
              </button>
              <button 
                onClick={() => onDelete(draft.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Reject"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {draft.status === 'approved' && (
            <>
              <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 min-w-[120px] shadow-sm shadow-blue-100 active:scale-95"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Post Now</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => onStatusChange(draft.id, 'scheduled')}
                disabled={isPublishing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                Schedule
              </button>
            </>
          )}

          {draft.status === 'failed' && (
             <div className="flex items-center gap-2 w-full">
               <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-all disabled:opacity-70 shadow-xs shadow-red-200"
              >
                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                Retry Now
              </button>
              <button 
                onClick={() => onDelete(draft.id)}
                className="px-4 py-2 text-slate-600 hover:text-red-600 border border-slate-200 rounded-lg hover:bg-white text-xs font-semibold transition-all"
              >
                Discard
              </button>
             </div>
          )}

          {draft.status === 'scheduled' && (
             <div className="text-[10px] text-purple-600 font-semibold flex items-center gap-1.5 w-full justify-center bg-purple-50 py-2.5 rounded-lg border border-purple-100 uppercase tracking-wider">
               <Clock className="w-3.5 h-3.5" />
               Scheduled: {draft.scheduled_for ? new Date(draft.scheduled_for).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Future'}
             </div>
          )}
          
           {draft.status === 'published' && (
             <div className="text-[10px] text-blue-600 font-semibold flex items-center gap-1.5 w-full justify-center bg-blue-50 py-2 rounded-lg border border-blue-100 uppercase tracking-wider">
               <Send className="w-3.5 h-3.5" />
               Published to LinkedIn
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraftCard;