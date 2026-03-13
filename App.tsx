import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DraftsView from './components/DraftsView';
import Settings from './components/Settings';
import ActivityFeed from './components/ActivityFeed';
import Toaster from './components/Toaster';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { 
  INITIAL_DRAFTS, 
  INITIAL_SOURCES, 
  INITIAL_ACTIVITIES 
} from './constants';
import { Draft, Source, Activity, AppNotification, NotificationType } from './types';

const AppContent: React.FC = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [sources, setSources] = useState<Source[]>(INITIAL_SOURCES);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (!user || !profile?.onboarding_completed) return;

    const fetchData = async () => {
      try {
        const [draftsRes, activitiesRes] = await Promise.all([
          fetch(`/api/drafts?user_id=${user.id}`),
          fetch(`/api/activities?user_id=${user.id}`)
        ]);

        if (draftsRes.ok) {
          const data = await draftsRes.json();
          const mappedDrafts = data.map((d: any) => ({
            id: d.id,
            content: d.content,
            status: d.status,
            style: d.writing_style,
            confidence_score: d.confidence_score,
            created_at: d.created_at,
            scheduled_for: d.scheduled_for,
            published_at: d.published_at,
            rejection_reason: d.rejection_reason,
            activity_summary: d.activity_summary,
            likes: d.likes,
            comments: d.comments
          }));
          setDrafts(mappedDrafts.length > 0 ? mappedDrafts : INITIAL_DRAFTS);
        }

        if (activitiesRes.ok) {
          const data = await activitiesRes.json();
          const mappedActivities = data.map((a: any) => ({
            id: a.id,
            provider: a.source,
            summary: a.title,
            created_at: a.timestamp,
            decision: a.is_content_worthy ? 'drafted' : 'skipped'
          }));
          setActivities(mappedActivities.length > 0 ? mappedActivities : INITIAL_ACTIVITIES);
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        setDrafts(INITIAL_DRAFTS);
        setActivities(INITIAL_ACTIVITIES);
      }
    };

    fetchData();
  }, [user, profile]);

  // Helper to add notification
  const notify = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type, created_at: new Date().toISOString() }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handlePublish = async (draft: Draft) => {
    if (!user) return;
    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft.content, user_id: user.id })
      });
      
      if (response.ok) {
        // Update draft status in backend
        await fetch(`/api/drafts/${draft.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published', published_at: new Date().toISOString(), user_id: user.id })
        });

        notify('Successfully posted to LinkedIn!', 'success');
        setDrafts(prev => prev.map(d => 
          d.id === draft.id ? { ...d, status: 'published', published_at: new Date().toISOString() } : d
        ));
      } else {
        const data = await response.json();
        if (data.error?.includes('LinkedIn not connected')) {
          notify('Please connect your LinkedIn account in Settings first.', 'warning');
        } else {
          notify('Failed to post to LinkedIn.', 'error');
        }
        throw new Error(data.error || 'Failed to post');
      }
    } catch (error) {
      console.error('Publish error:', error);
      notify('Failed to post to LinkedIn.', 'error');
      throw error;
    }
  };

  // Polling for scheduled drafts to actually publish them
  useEffect(() => {
    const checkScheduled = () => {
      const now = new Date();
      const dueDrafts = drafts.filter(d => 
        d.status === 'scheduled' && 
        d.scheduled_for && 
        new Date(d.scheduled_for) <= now
      );

      dueDrafts.forEach(d => {
        handlePublish(d).catch(err => {
          console.error(`Auto-publish failed for draft ${d.id}:`, err);
        });
      });
    };

    const interval = setInterval(checkScheduled, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [drafts, handlePublish]);

  const handlePublishAllApproved = async () => {
    const approvedDrafts = drafts.filter(d => d.status === 'approved');
    if (approvedDrafts.length === 0) {
      notify("No approved drafts to publish.", "info");
      return;
    }

    notify(`Publishing ${approvedDrafts.length} approved drafts...`, "info");
    
    let successCount = 0;
    let failCount = 0;

    // Publish sequentially to avoid rate limits and handle errors better
    for (const draft of approvedDrafts) {
      try {
        await handlePublish(draft);
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Bulk publish failed for ${draft.id}:`, error);
      }
    }

    if (successCount > 0) {
      notify(`Successfully published ${successCount} posts to LinkedIn!`, "success");
    }
    if (failCount > 0) {
      notify(`Failed to publish ${failCount} posts.`, "error");
    }
  };

  const handleToggleSource = async (id: string) => {
    if (!user) return;
    const source = sources.find(s => s.id === id);
    if (!source) return;

    if (source.status === 'connected') {
      try {
        const res = await fetch(`/api/integrations/${source.provider}?user_id=${user.id}`, { method: 'DELETE' });
        if (res.ok) {
          setSources(prev => prev.map(s => s.id === id ? { ...s, status: 'disconnected' } : s));
          notify(`${source.provider} disconnected`, 'info');
        }
      } catch (err) {
        notify(`Failed to disconnect ${source.provider}`, 'error');
      }
      return;
    }

    // Connect
    if (['github', 'linkedin', 'linear', 'x'].includes(source.provider)) {
      try {
        const response = await fetch(`/api/auth/${source.provider}/url?user_id=${user.id}`);
        if (!response.ok) throw new Error('Failed to get auth URL');
        const { url } = await response.json();

        const authWindow = window.open(
          url,
          'oauth_popup',
          'width=600,height=700'
        );

        if (!authWindow) {
          notify('Please allow popups to connect your account.', 'error');
        }
      } catch (error) {
        console.error('OAuth error:', error);
        notify(`Failed to connect ${source.provider}`, 'error');
      }
    } else {
      // Mock connection for other providers
      setSources(prev => prev.map(s => s.id === id ? { ...s, status: 'connected' } : s));
      notify(`${source.provider} connected`, 'success');
    }
  };

  useEffect(() => {
    if (!user) return;
    const bc = new BroadcastChannel('ce_oauth');
    
    const handleAuthSuccess = (provider: string) => {
      setSources(prev => prev.map(s => s.provider === provider ? { ...s, status: 'connected' } : s));
      notify(`${provider} connected successfully!`, 'success');
      if (provider === 'github') {
        fetchGithubCommits();
      }
    };

    bc.onmessage = (event) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        handleAuthSuccess(event.data.provider);
      }
    };

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        handleAuthSuccess(event.data.provider);
      }
    };

    window.addEventListener('message', handleMessage);

    // Initial fetch of integrations
    const fetchIntegrations = async () => {
      try {
        const res = await fetch(`/api/integrations?user_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setSources(prev => prev.map(s => {
            const integration = data.find((i: any) => i.id === s.provider);
            return {
              ...s,
              status: integration?.connected ? 'connected' : 'disconnected',
              last_sync: integration?.lastSync || s.last_sync
            };
          }));
        }
      } catch (err) {
        console.error('Failed to fetch integrations', err);
      }
    };
    fetchIntegrations();

    return () => {
      window.removeEventListener('message', handleMessage);
      bc.close();
    };
  }, [notify, user]);

  const fetchGithubCommits = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/github/check-activities?user_id=${user.id}`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        if (data.activities && data.activities.length > 0) {
          // Add as activities
          const newActivities = data.activities.map((a: any) => ({
            id: a.id,
            provider: 'github' as const,
            summary: a.title,
            created_at: a.timestamp,
            decision: 'drafted' as const
          }));
          setActivities(prev => [...newActivities, ...prev]);
          notify(`Ingested ${data.activities.length} new activities from GitHub`, 'success');
          
          // Generate a draft from the latest activity
          handleGenerateDraft(data.activities[0].title, data.activities[0].id);
        } else {
          notify("No new GitHub activities found.", "info");
        }
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const handleGenerateDraft = async (prompt?: string, activityId?: string) => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const activity = activityId ? activities.find(a => a.id === activityId) : null;
      
      const contextPrompt = prompt || "Building an automated publishing platform";
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a LinkedIn post based on this context: ${contextPrompt}`,
        config: {
          systemInstruction: `You are a professional LinkedIn content creator. Write a post that is high-impact, uses 1-2 relevant emojis, and fits a "${profile?.preferences?.style || 'humble_builder'}" narrative. Stay under 400 characters.`,
        }
      });

      const content = response.text || "Failed to generate content.";
      const confidence = 0.96;
      const activitySummary = activity ? activity.summary : (prompt ? prompt : "AI Ingestion");

      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          status: 'draft',
          style: profile?.preferences?.style || 'humble_builder',
          confidence_score: confidence,
          activity_summary: activitySummary,
          activity_id: activityId,
          user_id: user.id
        })
      });

      if (res.ok) {
        const savedDraft = await res.json();
        const mappedDraft = {
          id: savedDraft.id,
          content: savedDraft.content,
          status: savedDraft.status,
          style: savedDraft.writing_style,
          confidence_score: savedDraft.confidence_score,
          created_at: savedDraft.created_at,
          scheduled_for: savedDraft.scheduled_for,
          published_at: savedDraft.published_at,
          rejection_reason: savedDraft.rejection_reason,
          activity_summary: savedDraft.activity_summary,
          likes: savedDraft.likes,
          comments: savedDraft.comments
        };
        setDrafts(prev => [mappedDraft, ...prev]);
        notify("New AI draft generated and ready for review", "success");
        setActiveTab('drafts');
      } else {
        throw new Error("Failed to save draft to backend");
      }
    } catch (error) {
      console.error("Generation failed", error);
      notify("Draft generation failed. Please check connection.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!profile?.onboarding_completed) {
    return <Onboarding />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard drafts={drafts} sources={sources} activities={activities} />;
      case 'drafts':
        return (
          <DraftsView 
            drafts={drafts} 
            setDrafts={setDrafts} 
            activities={activities}
            onGenerate={handleGenerateDraft}
            isGenerating={isGenerating}
            onPublish={handlePublish}
            onPublishAll={handlePublishAllApproved}
          />
        );
      case 'activity':
        return <ActivityFeed activities={activities} />;
      case 'settings':
        return <Settings user={{ ...user, name: profile.full_name || user.email, avatar_url: profile.avatar_url || '' }} sources={sources} onToggleSource={handleToggleSource} />;
      default:
        return <Dashboard drafts={drafts} sources={sources} activities={activities} />;
    }
  };

  return (
    <Layout 
      user={{ ...user, name: profile.full_name || user.email, avatar_url: profile.avatar_url || '' }} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onLogout={signOut}
    >
      <Toaster notifications={notifications} onRemove={removeNotification} />
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
