import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import session from 'express-session';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Config ─────────────────────────────────────────────────────────────────
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

const OAUTH = {
  linkedin: {
    clientId:     process.env.LINKEDIN_CLIENT_ID     || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri:  process.env.LINKEDIN_REDIRECT_URI  || `${BASE_URL}/auth/linkedin/callback`,
    scope:        'openid profile email w_member_social',
    authUrl:      'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl:     'https://www.linkedin.com/oauth/v2/accessToken',
    profileUrl:   'https://api.linkedin.com/v2/userinfo',  // OpenID Connect userinfo
  },
  github: {
    clientId:     process.env.GITHUB_CLIENT_ID     || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    redirectUri:  process.env.GITHUB_REDIRECT_URI  || `${BASE_URL}/auth/github/callback`,
    scope:        'read:user user:email',
    authUrl:      'https://github.com/login/oauth/authorize',
    tokenUrl:     'https://github.com/login/oauth/access_token',
    profileUrl:   'https://api.github.com/user',
  },
  linear: {
    clientId:     process.env.LINEAR_CLIENT_ID     || '',
    clientSecret: process.env.LINEAR_CLIENT_SECRET || '',
    redirectUri:  process.env.LINEAR_REDIRECT_URI  || `${BASE_URL}/auth/linear/callback`,
    scope:        'read',
    authUrl:      'https://linear.app/oauth/authorize',
    tokenUrl:     'https://api.linear.app/oauth/token',
    profileUrl:   'https://api.linear.app/graphql',
  },
  x: {
    clientId:     process.env.X_CLIENT_ID     || '',
    clientSecret: process.env.X_CLIENT_SECRET || '',
    redirectUri:  `${BASE_URL}/auth/x/callback`,
    scope:        'tweet.read tweet.write users.read offline.access',
    authUrl:      'https://twitter.com/i/oauth2/authorize',
    tokenUrl:     'https://api.twitter.com/2/oauth2/token',
    profileUrl:   'https://api.twitter.com/2/users/me',
  },
};

// ─── Helper ──────────────────────────────────────────────────────────────────
function oauthPopupResponse(success: boolean, provider: string, extra: Record<string, string> = {}) {
  const payload = success
    ? JSON.stringify({ type: 'OAUTH_AUTH_SUCCESS', provider, ...extra })
    : JSON.stringify({ type: 'OAUTH_AUTH_ERROR',   provider, ...extra });

  // Modern Chrome/Edge null out window.opener after a cross-origin redirect
  // (e.g. GitHub's auth page → back to localhost). BroadcastChannel is used as
  // the primary signal because it works across windows from the same origin
  // regardless of navigation history. postMessage is kept as a secondary path.
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
    <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc}p{color:#64748b;font-size:14px}</style>
    <p>${success ? '✓ Connected! Closing…' : '✗ Connection failed. You can close this window.'}</p>
    <script>
      (function() {
        var payload = ${payload};

        // 1. BroadcastChannel — works even after cross-origin redirects
        try {
          var bc = new BroadcastChannel('ce_oauth');
          bc.postMessage(payload);
          setTimeout(function() { bc.close(); }, 500);
        } catch(e) {}

        // 2. postMessage fallback — works when opener is still available
        try {
          if (window.opener && window.opener !== window) {
            window.opener.postMessage(payload, window.location.origin);
          }
        } catch(e) {}

        // Close the popup after a brief delay (gives channel time to flush)
        setTimeout(function() {
          try { window.close(); } catch(e) {}
        }, 300);
      })();
    </script>
  </body></html>`;
}


// ─── Server ──────────────────────────────────────────────────────────────────
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // ── Supabase ────────────────────────────────────────────────────────────────
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );

  // Test DB connection and table existence
  const requiredTables = ['integrations', 'monitored_repositories', 'activities', 'drafts', 'scheduled_posts'];
  
  console.log('[Startup] Running database diagnostic...');
  for (const table of requiredTables) {
    supabase.from(table).select('*').limit(1).then(({ data, error }) => {
      if (error) {
        console.error(`[Startup] ❌ Table "${table}" check failed:`, error.message, `(Code: ${error.code})`);
        if (error.code === 'PGRST204' || error.code === 'PGRST205') {
          console.error(`[Startup] Hint: Table "${table}" seems to be missing. Please ensure migrations are applied.`);
        }
      } else {
        const columns = data?.[0] ? Object.keys(data[0]) : 'no rows';
        console.log(`[Startup] ✅ Table "${table}" check passed. Columns:`, columns);
      }
    });
  }

  // ── Middleware ───────────────────────────────────────────────────────────────
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.set('trust proxy', 1);

  app.use(cors({ origin: true, credentials: true }));

  app.use(session({
    secret: process.env.SESSION_SECRET || 'contentengine-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      // In localhost HTTP, secure must be false
      secure: BASE_URL.startsWith('https'),
      sameSite: BASE_URL.startsWith('https') ? 'none' : 'lax',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  }));

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  OAUTH – INITIATION  (Frontend calls /api/auth/:provider/url)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  app.get('/api/auth/:provider/url', (req, res) => {
    const { provider } = req.params as { provider: keyof typeof OAUTH };
    const { user_id } = req.query;
    const cfg = OAUTH[provider];
    if (!cfg) return res.status(400).json({ error: 'Unknown provider' });
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const state = Math.random().toString(36).substring(2);
    (req.session as any).oauthState = state;
    (req.session as any).oauthProvider = provider;
    (req.session as any).userId = user_id;

    const params = new URLSearchParams({
      client_id:    cfg.clientId,
      redirect_uri: cfg.redirectUri,
      scope:        cfg.scope,
      state,
      response_type: 'code',
    });

    // X requires PKCE (plain challenge for simplicity in dev)
    if (provider === 'x') {
      params.set('code_challenge', 'challenge');
      params.set('code_challenge_method', 'plain');
    }

    res.json({ url: `${cfg.authUrl}?${params}` });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  OAUTH CALLBACKS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ── LinkedIn ─────────────────────────────────────────────────────────────
  app.get('/auth/linkedin/callback', async (req, res) => {
    const { code, error } = req.query;
    if (error) {
      console.error('[LinkedIn] OAuth error:', error);
      return res.send(oauthPopupResponse(false, 'linkedin', { error: String(error) }));
    }
    if (!code) {
      return res.send(oauthPopupResponse(false, 'linkedin', { error: 'No code received' }));
    }

    try {
      // 1. Exchange code for token
      const tokenRes = await axios.post(
        OAUTH.linkedin.tokenUrl,
        new URLSearchParams({
          grant_type:   'authorization_code',
          code:          String(code),
          redirect_uri:  OAUTH.linkedin.redirectUri,
          client_id:     OAUTH.linkedin.clientId,
          client_secret: OAUTH.linkedin.clientSecret,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      const { access_token: accessToken, refresh_token: refreshToken } = tokenRes.data;

      // 2. Fetch profile (OpenID userinfo)
      const profileRes = await axios.get(OAUTH.linkedin.profileUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = profileRes.data;
      const userId = profile.sub; // OpenID subject

      // 3. Persist everything in integrations table
      const sessionUserId = (req.session as any).userId;
      await supabase.from('integrations').upsert({
        id:         'linkedin',
        user_id:    sessionUserId,
        connected:  true,
        "lastSync": new Date().toISOString(),
        settings: {
          userId,
          name:         `${profile.given_name ?? ''} ${profile.family_name ?? ''}`.trim(),
          email:        profile.email ?? '',
          picture:      profile.picture ?? null,
          accessToken,
          refreshToken: refreshToken ?? null,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id,user_id' });

      console.log(`[LinkedIn] ✅ Connected: ${profile.given_name} (${userId})`);
      res.send(oauthPopupResponse(true, 'linkedin'));
    } catch (err: any) {
      console.error('[LinkedIn] Callback error:', err.response?.data || err.message);
      res.send(oauthPopupResponse(false, 'linkedin', { error: 'Token exchange failed' }));
    }
  });

  // ── GitHub ───────────────────────────────────────────────────────────────
  app.get('/auth/github/callback', async (req, res) => {
    const { code, error } = req.query;
    if (error || !code) {
      return res.send(oauthPopupResponse(false, 'github', { error: String(error || 'No code') }));
    }

    try {
      // 1. Exchange code
      const tokenRes = await axios.post(
        OAUTH.github.tokenUrl,
        { code, client_id: OAUTH.github.clientId, client_secret: OAUTH.github.clientSecret, redirect_uri: OAUTH.github.redirectUri },
        { headers: { Accept: 'application/json' } },
      );
      const { access_token: accessToken } = tokenRes.data;
      if (!accessToken) throw new Error('No access token from GitHub');

      // 2. Fetch user profile
      const profileRes = await axios.get(OAUTH.github.profileUrl, {
        headers: { Authorization: `token ${accessToken}`, 'User-Agent': 'ContentEngine' },
      });
      const profile = profileRes.data;

      // 3. Persist to Supabase integrations
      const sessionUserId = (req.session as any).userId;
      await supabase.from('integrations').upsert({
        id:        'github',
        user_id:   sessionUserId,
        connected: true,
        "lastSync":  new Date().toISOString(),
        settings:  { userId: String(profile.id), login: profile.login, accessToken },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id,user_id' });

      console.log(`[GitHub] ✅ Connected: ${profile.login}`);
      res.send(oauthPopupResponse(true, 'github'));
    } catch (err: any) {
      console.error('[GitHub] Callback error:', err.response?.data || err.message);
      res.send(oauthPopupResponse(false, 'github', { error: 'Token exchange failed' }));
    }
  });

  // ── Linear ───────────────────────────────────────────────────────────────
  app.get('/auth/linear/callback', async (req, res) => {
    const { code, error } = req.query;
    if (error || !code) {
      return res.send(oauthPopupResponse(false, 'linear', { error: String(error || 'No code') }));
    }

    try {
      // 1. Exchange code
      const tokenRes = await axios.post(
        OAUTH.linear.tokenUrl,
        new URLSearchParams({
          grant_type:   'authorization_code',
          code:          String(code),
          redirect_uri:  OAUTH.linear.redirectUri,
          client_id:     OAUTH.linear.clientId,
          client_secret: OAUTH.linear.clientSecret,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      const { access_token: accessToken } = tokenRes.data;
      if (!accessToken) throw new Error('No access token from Linear');

      // 2. Fetch viewer info via GraphQL
      const meRes = await axios.post(
        OAUTH.linear.profileUrl,
        { query: '{ viewer { id name email } }' },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } },
      );
      const viewer = meRes.data?.data?.viewer;

      // 3. Persist to Supabase
      const sessionUserId = (req.session as any).userId;
      await supabase.from('integrations').upsert({
        id:        'linear',
        user_id:   sessionUserId,
        connected: true,
        "lastSync":  new Date().toISOString(),
        settings:  { userId: viewer?.id, name: viewer?.name, email: viewer?.email, accessToken },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id,user_id' });

      console.log(`[Linear] ✅ Connected: ${viewer?.name}`);
      res.send(oauthPopupResponse(true, 'linear'));
    } catch (err: any) {
      console.error('[Linear] Callback error:', err.response?.data || err.message);
      res.send(oauthPopupResponse(false, 'linear', { error: 'Token exchange failed' }));
    }
  });

  // ── X (Twitter) ──────────────────────────────────────────────────────────
  app.get('/auth/x/callback', async (req, res) => {
    const { code, error } = req.query;
    if (error || !code) {
      return res.send(oauthPopupResponse(false, 'x', { error: String(error || 'No code') }));
    }

    try {
      // 1. Exchange code (X uses Basic auth with client_id:client_secret)
      const basicAuth = Buffer.from(`${OAUTH.x.clientId}:${OAUTH.x.clientSecret}`).toString('base64');
      const tokenRes = await axios.post(
        OAUTH.x.tokenUrl,
        new URLSearchParams({
          grant_type:    'authorization_code',
          code:           String(code),
          redirect_uri:   OAUTH.x.redirectUri,
          code_verifier:  'challenge', // matches the plain challenge we sent
        }).toString(),
        {
          headers: {
            Authorization:  `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      const { access_token: accessToken, refresh_token: refreshToken } = tokenRes.data;
      if (!accessToken) throw new Error('No access token from X');

      // 2. Fetch user profile
      const profileRes = await axios.get(`${OAUTH.x.profileUrl}?user.fields=name,username`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const xUser = profileRes.data?.data;

      // 3. Persist to Supabase
      const sessionUserId = (req.session as any).userId;
      await supabase.from('integrations').upsert({
        id:        'x',
        user_id:   sessionUserId,
        connected: true,
        "lastSync":  new Date().toISOString(),
        settings:  { userId: xUser?.id, username: xUser?.username, accessToken, refreshToken },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id,user_id' });

      console.log(`[X] ✅ Connected: @${xUser?.username}`);
      res.send(oauthPopupResponse(true, 'x'));
    } catch (err: any) {
      console.error('[X] Callback error:', err.response?.data || err.message);
      res.send(oauthPopupResponse(false, 'x', { error: 'Token exchange failed' }));
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  INTEGRATIONS CRUD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // GET /api/integrations – list all integration statuses
  app.get('/api/integrations', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user_id);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  // DELETE /api/integrations/:id – disconnect an integration
  app.delete('/api/integrations/:id', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const { error } = await supabase.from('integrations').upsert({
      id,
      user_id,
      connected: false,
      settings:  {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id,user_id' });
    if (error) return res.status(500).json({ error: error.message });
    console.log(`[Integrations] Disconnected: ${id} for user ${user_id}`);
    res.json({ success: true });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  GITHUB – REPOSITORIES & ACTIVITY MONITORING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Retrieve the stored GitHub access token from integrations table */
  async function getGitHubAccessToken(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('integrations')
      .select('settings')
      .eq('id', 'github')
      .eq('user_id', userId)
      .eq('connected', true)
      .single();
    return (data?.settings as any)?.accessToken ?? null;
  }

  // GET /api/github/repositories
  // Returns the authenticated user's GitHub repositories (up to 100, sorted by push date)
  app.get('/api/github/repositories', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const token = await getGitHubAccessToken(String(user_id));
    if (!token) {
      return res.status(401).json({ error: 'GitHub not connected. Connect GitHub in Integrations first.' });
    }

    try {
      const response = await axios.get('https://api.github.com/user/repos', {
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'ContentEngine',
          Accept: 'application/vnd.github.v3+json',
        },
        params: {
          sort: 'pushed',
          direction: 'desc',
          per_page: 100,
          affiliation: 'owner,collaborator',
        },
      });

      const repos = (response.data as any[]).map((r) => ({
        id:             String(r.id),
        repo_full_name: r.full_name,
        name:           r.name,
        description:    r.description,
        private:        r.private,
        pushed_at:      r.pushed_at,
        html_url:       r.html_url,
        stargazers:     r.stargazers_count,
        language:       r.language,
      }));

      console.log(`[GitHub] Listed ${repos.length} repositories`);
      res.json(repos);
    } catch (err: any) {
      console.error('[GitHub/repos] Error:', err.response?.data || err.message);
      res.status(500).json({ error: 'Failed to fetch repositories from GitHub' });
    }
  });

  // POST /api/github/check-activities
  // Trigger a manual activity check for the connected GitHub account.
  app.post('/api/github/check-activities', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const token = await getGitHubAccessToken(String(user_id));
    if (!token) {
      return res.status(401).json({ error: 'GitHub not connected.' });
    }

    const TRIVIAL_PATTERNS = [
      /^(fix typo|typo|wip|work in progress|fixup|merge|bump|revert|format|lint|whitespace|style|chore)/i,
      /^merge (pull request|branch)/i,
      /bump .* from .* to /i,
    ];

    function isTrivial(message: string): boolean {
      return TRIVIAL_PATTERNS.some((p) => p.test(message.trim()));
    }

    try {
      // Get repos marked as monitored in Supabase
      const { data: monitoredRows } = await supabase
        .from('monitored_repositories')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_monitored', true);

      const repos: string[] = (monitoredRows || []).map((r: any) => r.repo_full_name);

      if (repos.length === 0) {
        return res.json({ message: 'No monitored repositories. Add repos in Settings › Repositories.', activities: [] });
      }

      const captured: any[] = [];

      for (const repoFullName of repos) {
        // Find last check time from DB
        const { data: repoRow } = await supabase
          .from('monitored_repositories')
          .select('last_checked_at')
          .eq('user_id', user_id)
          .eq('repo_full_name', repoFullName)
          .single();

        const since = repoRow?.last_checked_at
          ? new Date(repoRow.last_checked_at).toISOString()
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

        // Fetch commits
        const commitsRes = await axios.get(
          `https://api.github.com/repos/${repoFullName}/commits`,
          {
            headers: { Authorization: `token ${token}`, 'User-Agent': 'ContentEngine' },
            params: { since, per_page: 20 },
          },
        ).catch(() => ({ data: [] }));

        for (const commit of (commitsRes.data as any[])) {
          const msg: string = commit.commit?.message?.split('\n')[0] ?? '';
          if (!msg || isTrivial(msg)) continue;

          // Store activity (metadata only — no source code)
          const { data: existing } = await supabase
            .from('activities')
            .select('id')
            .eq('user_id', user_id)
            .eq('source', 'github')
            .eq('title', msg.slice(0, 200))
            .eq('repo_full_name', repoFullName)
            .maybeSingle();

          if (existing) continue; // already captured

          const newActivity = {
            user_id,
            source:           'github',
            activity_type:    'commit',
            title:            msg.slice(0, 200),
            description:      commit.commit?.message ?? '',
            timestamp:        commit.commit?.author?.date ?? new Date().toISOString(),
            repo_full_name:   repoFullName,
            is_content_worthy: true,
          };

          const { data: inserted } = await supabase
            .from('activities')
            .insert(newActivity)
            .select()
            .single();

          if (inserted) captured.push(inserted);
        }

        // Update last_checked_at
        await supabase
          .from('monitored_repositories')
          .update({ last_checked_at: new Date().toISOString() })
          .eq('repo_full_name', repoFullName);
      }

      console.log(`[GitHub/check-activities] Captured ${captured.length} new activit(ies)`);
      res.json({ message: `Captured ${captured.length} new activit(ies).`, activities: captured });
    } catch (err: any) {
      console.error('[GitHub/check-activities] Error:', err.message);
      res.status(500).json({ error: 'Activity check failed.' });
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ACTIVITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  app.get('/api/activities', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user_id)
      .order('timestamp', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  DRAFT MANAGEMENT (server-side, so service role key stays off the browser)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // GET /api/drafts — list all drafts with joined activity
  app.get('/api/drafts', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const { data, error } = await supabase
      .from('drafts')
      .select('*, originalActivity:activities(*)')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  // POST /api/drafts — create a new draft
  app.post('/api/drafts', async (req, res) => {
    const { content, status, style, confidence_score, activity_summary, activity_id, user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const { data, error } = await supabase
      .from('drafts')
      .insert({
        user_id,
        content,
        status: status || 'draft',
        writing_style: style,
        confidence_score,
        activity_summary,
        activity_id
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });


  // PATCH /api/drafts/:id — update status / content of a draft
  app.patch('/api/drafts/:id', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const allowed = ['status', 'content', 'edited_content', 'rejection_reason', 'reviewed_at', 'writing_style', 'scheduled_for', 'published_at'];
    const updates: Record<string, any> = {};

    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const { data, error } = await supabase
      .from('drafts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // DELETE /api/drafts/:id — hard-delete a draft
  app.delete('/api/drafts/:id', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const { error } = await supabase.from('drafts').delete().eq('id', id).eq('user_id', user_id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  MONITORED REPOSITORIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // GET /api/repositories — list monitored repos from DB
  app.get('/api/repositories', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const { data, error } = await supabase
      .from('monitored_repositories')
      .select('*')
      .eq('user_id', user_id)
      .order('added_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  // PATCH /api/repositories/:id/toggle — toggle is_monitored flag
  app.patch('/api/repositories/:id/toggle', async (req, res) => {
    const { id } = req.params;
    const { is_monitored, user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });
    if (typeof is_monitored !== 'boolean') {
      return res.status(400).json({ error: 'is_monitored must be a boolean' });
    }
    const { data, error } = await supabase
      .from('monitored_repositories')
      .update({ is_monitored })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // POST /api/repositories — add a repo to monitoring
  app.post('/api/repositories', async (req, res) => {
    const { repo_full_name, repo_id, user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });
    if (!repo_full_name) return res.status(400).json({ error: 'repo_full_name required' });

    const { data, error } = await supabase
      .from('monitored_repositories')
      .upsert(
        { user_id, repo_full_name, repo_id: String(repo_id ?? ''), is_monitored: true, added_at: new Date().toISOString() },
        { onConflict: 'repo_full_name,user_id' },
      )
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  SESSION & USER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  app.get('/api/me', (req, res) => {
    const sess = req.session as any;
    if (!sess.user) return res.status(401).json({ error: 'Not authenticated' });
    res.json(sess.user);
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) return res.status(500).json({ error: 'Logout failed' });
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  LINKEDIN PUBLISHING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Reads LinkedIn token + userId from integrations table
  async function getLinkedInCredentials(userId: string): Promise<{ accessToken: string; linkedinUserId: string } | null> {
    const { data } = await supabase
      .from('integrations')
      .select('settings')
      .eq('id', 'linkedin')
      .eq('user_id', userId)
      .eq('connected', true)
      .single();
    const s = data?.settings as any;
    if (!s?.accessToken || !s?.userId) return null;
    return { accessToken: s.accessToken, linkedinUserId: s.userId };
  }

  app.post('/api/publish', async (req, res) => {
    const { content, scheduled_id, user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });
    if (!content?.trim()) return res.status(400).json({ error: 'Empty content' });

    const creds = await getLinkedInCredentials(user_id);
    if (!creds) {
      return res.status(401).json({ error: 'LinkedIn not connected. Please connect LinkedIn first.' });
    }
    const { accessToken, linkedinUserId } = creds;

    try {
      const memberUrn = `urn:li:person:${linkedinUserId}`;
      const response  = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author:          memberUrn,
          lifecycleState:  'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary:    { text: content },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        },
        {
          headers: {
            Authorization:               `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'Content-Type':              'application/json',
          },
        },
      );

      if (scheduled_id) {
        await supabase
          .from('scheduled_posts')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', scheduled_id)
          .eq('user_id', user_id);
      }

      res.json({ success: true, message: 'Published!', data: response.data });
    } catch (err: any) {
      console.error('[Publish]', err.response?.data || err.message);
      res.status(500).json({ error: 'Failed to publish post' });
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  SCHEDULE / QUEUE ENDPOINTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  app.post('/api/schedule', async (req, res) => {
    const { content, scheduledAt, draft_id, user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });
    if (!content || !scheduledAt) return res.status(400).json({ error: 'Invalid post data' });

    const scheduleDate = new Date(scheduledAt);
    if (scheduleDate <= new Date()) return res.status(400).json({ error: 'Scheduled time must be in the future' });

    const { data: newPost, error } = await supabase
      .from('scheduled_posts')
      .insert({ user_id, content, scheduled_at: scheduleDate, status: 'pending', draft_id })
      .select()
      .single();

    if (error) {
      console.error('[Schedule] Failed to save:', error);
      return res.status(500).json({ error: 'Failed to schedule post' });
    }
    res.json({ success: true, message: 'Added to queue', job: newPost });
  });

  app.get('/api/queue', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const { data: queue, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true });

    if (error) return res.status(500).json({ error: 'Failed to load queue' });
    res.json(queue);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  BACKGROUND SCHEDULER (publishes pending posts that are due)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async function processScheduledPosts() {
    console.log('[Scheduler] Checking for posts to publish...');

    const { data: posts, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());

    if (error) { 
      console.error('[Scheduler] DB error:', error.message, error.code, error.details); 
      return; 
    }
    if (!posts?.length) {
      console.log('[Scheduler] No pending posts due.');
      return;
    }

    console.log(`[Scheduler] Publishing ${posts.length} post(s)…`);

    for (const post of posts) {
      try {
        const creds = await getLinkedInCredentials(post.user_id);
        if (!creds) {
          console.error(`[Scheduler] LinkedIn not connected for user ${post.user_id}`);
          continue;
        }
        const { accessToken, linkedinUserId } = creds;

        await axios.post(
          'https://api.linkedin.com/v2/ugcPosts',
          {
            author:          `urn:li:person:${linkedinUserId}`,
            lifecycleState:  'PUBLISHED',
            specificContent: {
              'com.linkedin.ugc.ShareContent': {
                shareCommentary:    { text: post.content },
                shareMediaCategory: 'NONE',
              },
            },
            visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
          },
          {
            headers: {
              Authorization:               `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
              'Content-Type':              'application/json',
            },
          },
        );

        await supabase
          .from('scheduled_posts')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', post.id);

        if (post.draft_id) {
          await supabase
            .from('drafts')
            .update({ status: 'published', published_at: new Date().toISOString() })
            .eq('id', post.draft_id);
        }

        console.log(`[Scheduler] ✅ Published post ${post.id} for user ${post.user_id}`);
      } catch (err: any) {
        console.error(`[Scheduler] ❌ Failed post ${post.id} for user ${post.user_id}:`, err.response?.data || err.message);
        await supabase.from('scheduled_posts').update({ status: 'failed' }).eq('id', post.id);
        if (post.draft_id) {
          await supabase.from('drafts').update({ status: 'failed' }).eq('id', post.draft_id);
        }
      }
    }
  }

  setInterval(processScheduledPosts, 60_000);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  VITE / STATIC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] 🟢 Listening on http://localhost:${PORT}`);
    console.log(`[Server] OAuth providers: LinkedIn ✓ | GitHub ✓ | Linear ✓ | X ✓`);
  });
}

startServer();
