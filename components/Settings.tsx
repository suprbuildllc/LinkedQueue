import React from 'react';
import { Source, User } from '../types';
import { 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Power,
  Mic,
  Sparkles,
} from 'lucide-react';
import { PROVIDER_ICONS } from '../constants';

interface SettingsProps {
  sources: Source[];
  user: User;
  onToggleSource: (id: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ sources, user, onToggleSource }) => {
  return (
    <div className="max-w-4xl space-y-6">
      
      {/* Profile Section */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-5">
          <img src={user.avatar_url} alt={user.name} className="w-16 h-16 rounded-full border-4 border-slate-50" />
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
               <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                 Free Plan
               </span>
               <span className="text-xs text-slate-400">
                 {user.credits_balance} credits remaining
               </span>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Engine (AI) */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Narrative Engine
            </h2>
            <p className="text-sm text-slate-500 mt-1">Configure how AI translates your work into content.</p>
          </div>
          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
            Model: Claude 3.5 Sonnet
          </span>
        </div>
        
        <div className="p-5 space-y-5">
          {/* Narrative Presets */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Narrative Preset</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['Humble Builder', 'Contrarian', 'Thought Leader'].map((preset) => (
                <div key={preset} className={`border text-slate-700 rounded-lg p-3 cursor-pointer transition-all ${
                  preset === 'Humble Builder' 
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{preset}</span>
                    {preset === 'Humble Builder' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                  </div>
                  <p className="text-xs text-slate-500">
                    {preset === 'Humble Builder' && "Focuses on the journey, learnings, and building in public."}
                    {preset === 'Contrarian' && "Challenges status quo with strong, opinionated takes."}
                    {preset === 'Thought Leader' && "Authoritative insights on industry trends and future."}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Profile */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voice Profile
            </label>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex gap-4 items-center">
                 <div className="flex-1">
                   <p className="text-sm text-slate-600 mb-2">Upload your past posts or articles to train the engine on your specific writing style.</p>
                   <div className="flex gap-2">
                     <button className="px-3 py-1.5 bg-white text-slate-900 border border-slate-300 rounded text-sm font-medium hover:bg-slate-50">
                       Upload Samples
                     </button>
                     <button className="px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium hover:bg-slate-50 text-slate-600">
                       Connect Twitter/X
                     </button>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Listener (Integrations) */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">The Listener</h2>
          <p className="text-sm text-slate-500 mt-1">Connect sources to fuel your content pipeline.</p>
        </div>
        
        <div className="divide-y divide-slate-100">
          {sources.map(source => (
            <div key={source.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${
                  source.status === 'connected' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {PROVIDER_ICONS[source.provider]}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 capitalize flex items-center gap-2 text-sm">
                    {source.provider === 'producthunt' ? 'Product Hunt' : source.provider}
                    {source.status === 'connected' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                    {source.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                  </h4>
                  <p className="text-xs text-slate-500">{source.name || 'Not Connected'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {source.status === 'connected' && (
                  <span className="text-xs text-slate-400 hidden sm:block">
                    Last sync: {source.last_sync ? new Date(source.last_sync).toLocaleTimeString() : 'Never'}
                  </span>
                )}
                
                <button 
                  onClick={() => onToggleSource(source.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    source.status === 'connected'
                      ? 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {source.status === 'connected' ? (
                    <>
                      <Power className="w-3 h-3" />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      Connect
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Settings;