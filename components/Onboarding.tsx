import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { 
  User, 
  Linkedin, 
  Github, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Settings,
  Rocket,
  Loader2
} from 'lucide-react';

const Onboarding: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(profile?.onboarding_step || 1);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [style, setStyle] = useState(profile?.preferences?.style || 'humble_builder');

  const updateOnboarding = async (nextStep: number, completed: boolean = false) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_step: nextStep, 
          onboarding_completed: completed,
          full_name: fullName,
          preferences: { ...profile?.preferences, style }
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      await refreshProfile();
      setStep(nextStep);
    } catch (err) {
      console.error('Error updating onboarding:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Let's get to know you</h2>
            <p className="text-slate-500 mb-8">Tell us your name so we can personalize your experience.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="John Doe"
                />
              </div>
              <button
                onClick={() => updateOnboarding(2)}
                disabled={!fullName || loading}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 text-purple-600">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Choose your writing style</h2>
            <p className="text-slate-500 mb-8">This will influence how the AI generates your LinkedIn posts.</p>
            
            <div className="grid grid-cols-1 gap-3 mb-8">
              {[
                { id: 'humble_builder', name: 'Humble Builder', desc: 'Authentic, technical, and progress-focused.' },
                { id: 'thought_leader', name: 'Thought Leader', desc: 'Insightful, visionary, and authoritative.' },
                { id: 'storyteller', name: 'Storyteller', desc: 'Narrative-driven, engaging, and personal.' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    style === s.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="font-bold text-slate-900">{s.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.desc}</div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => updateOnboarding(3)}
              disabled={loading}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Next Step'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
      case 3:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-green-600">
              <Rocket className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">You're all set!</h2>
            <p className="text-slate-500 mb-8">Your profile is ready. You can connect your LinkedIn and GitHub accounts in the dashboard.</p>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-sm font-bold text-slate-700">Profile Created</div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-sm font-bold text-slate-700">Style Configured</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                  <Settings className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-sm font-bold text-slate-700">Ready for Integrations</div>
              </div>
            </div>
            
            <button
              onClick={() => updateOnboarding(3, true)}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go to Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 sm:p-12">
          {/* Progress Bar */}
          <div className="flex gap-2 mb-12">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  s <= step ? 'bg-blue-600' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>

          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
