import React from 'react';
import { StatCardProps, Draft, Source, Activity } from '../types';
import PipelineStatus from './PipelineStatus';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Activity as ActivityIcon,
  FileText, 
  Zap, 
  MoreHorizontal,
  ThumbsUp,
  MessageSquare,
  BarChart3,
  ExternalLink
} from 'lucide-react';

interface DashboardProps {
  drafts: Draft[];
  sources: Source[];
  activities: Activity[];
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, trend }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full group hover:border-blue-200 transition-colors">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
      </div>
      <div className="p-2 bg-slate-50 rounded-lg text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        {icon}
      </div>
    </div>
    {change && (
      <div className="mt-4 flex items-center text-sm">
        <span className={`font-medium ${
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600'
        }`}>
          {change}
        </span>
        <span className="text-slate-400 ml-2">vs last month</span>
      </div>
    )}
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ drafts, sources, activities }) => {
  const publishedDrafts = drafts.filter(d => d.status === 'published');
  const publishedCount = publishedDrafts.length;
  const draftCount = drafts.filter(d => d.status === 'draft').length;
  
  const totalLikes = publishedDrafts.reduce((acc, d) => acc + (d.likes || 0), 0);
  const totalComments = publishedDrafts.reduce((acc, d) => acc + (d.comments || 0), 0);

  // Calculate chart data based on last 7 days of activity
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(date => {
    const dayActivities = activities.filter(a => a.created_at.startsWith(date)).length;
    const dayPublished = drafts.filter(d => d.status === 'published' && d.published_at?.startsWith(date)).length;
    
    return {
        name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date,
        value: dayActivities * 10 + dayPublished * 50
    };
  });

  const engagementData = last7Days.map(date => {
    const dayDrafts = drafts.filter(d => d.status === 'published' && d.published_at?.startsWith(date));
    const likes = dayDrafts.reduce((acc, d) => acc + (d.likes || 0), 0);
    const comments = dayDrafts.reduce((acc, d) => acc + (d.comments || 0), 0);
    
    return {
        name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        likes,
        comments
    };
  });

  const topPosts = [...publishedDrafts]
    .sort((a, b) => ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0)))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Visual Pipeline Status */}
      <PipelineStatus sources={sources} drafts={drafts} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Published Posts" 
          value={publishedCount} 
          icon={<TrendingUp className="w-5 h-5" />} 
        />
        <StatCard 
          title="Total Likes" 
          value={totalLikes} 
          icon={<ThumbsUp className="w-5 h-5" />} 
          change="+12.5%"
          trend="up"
        />
        <StatCard 
          title="Total Comments" 
          value={totalComments} 
          icon={<MessageSquare className="w-5 h-5" />} 
          change="+8.2%"
          trend="up"
        />
        <StatCard 
          title="Drafts Ready" 
          value={draftCount} 
          icon={<FileText className="w-5 h-5" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Velocity Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Pipeline Velocity</h3>
              <p className="text-sm text-slate-500">Activity & Publishing score over last 7 days</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                 <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Posts List */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Top Performing</h3>
          </div>
          <div className="space-y-4 flex-1">
            {topPosts.length > 0 ? topPosts.map((post) => (
              <div key={post.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-100 transition-all cursor-pointer group">
                <p className="text-xs text-slate-600 line-clamp-2 mb-2 font-medium leading-relaxed">
                  {post.content}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                      <ThumbsUp className="w-3 h-3 text-blue-500" />
                      {post.likes}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                      <MessageSquare className="w-3 h-3 text-purple-500" />
                      {post.comments}
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <p className="text-sm">No published posts yet.</p>
              </div>
            )}
          </div>
          <button className="w-full mt-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100">
            Detailed Analytics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Engagement Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Engagement Overview</h3>
              <p className="text-sm text-slate-500">Likes and comments over time</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="likes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="comments" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Summary (Moved/Modified) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
             <ActivityIcon className="w-5 h-5 text-amber-500" />
             <h3 className="text-lg font-bold text-slate-900">Recent Ingestion</h3>
          </div>
          <div className="space-y-4">
            {activities.length > 0 ? activities.slice(0, 4).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className={`mt-1.5 min-w-2 w-2 h-2 rounded-full ${
                  activity.decision === 'drafted' ? 'bg-green-500' : 'bg-slate-300'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 font-medium truncate">{activity.summary}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight capitalize">{activity.provider}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            )) : (
                <p className="text-sm text-slate-400">No recent activity recorded.</p>
            )}
            <button className="w-full mt-2 py-2 text-sm text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">
              Audit Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;