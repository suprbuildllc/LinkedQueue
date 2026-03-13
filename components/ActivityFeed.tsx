import React, { useState, useEffect } from 'react';
import { Activity } from '../types';
import { GitCommit, Search, FilterX, Radio } from 'lucide-react';

interface ActivityFeedProps {
  activities: Activity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate a "refreshing" pulse when activities change
  useEffect(() => {
    setIsRefreshing(true);
    const timer = setTimeout(() => setIsRefreshing(false), 1000);
    return () => clearTimeout(timer);
  }, [activities.length]);

  const filteredActivities = activities.filter(activity => 
    activity.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full max-h-[800px] overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3">
           <div className="relative">
             <h2 className="text-lg font-bold text-slate-900">Activity Log</h2>
             <div className="absolute -top-1 -right-4 flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
             </div>
           </div>
           <p className="text-xs text-slate-500 font-medium hidden sm:block">Real-time ingestion active</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter events..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all w-64"
            />
          </div>
          <div className={`p-2 rounded-lg bg-slate-100 text-slate-400 transition-all duration-500 ${isRefreshing ? 'bg-blue-50 text-blue-500 rotate-180' : ''}`}>
            <Radio className="w-4 h-4" />
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-0 scrollbar-thin">
        {filteredActivities.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event Summary</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredActivities.map((activity, index) => (
                <tr 
                  key={activity.id} 
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="hover:bg-slate-50/80 transition-all duration-200 group animate-[fadeIn_0.4s_ease-out_forwards] opacity-0"
                >
                  <td className="px-5 py-4 whitespace-nowrap">
                     <div className="flex items-center gap-3">
                       <span className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-sm transition-all group-hover:scale-110">
                         <GitCommit className="w-4 h-4" />
                       </span>
                       <span className="text-sm font-bold text-slate-700 capitalize">{activity.provider}</span>
                     </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-900 font-medium truncate max-w-xs sm:max-w-md group-hover:text-blue-900 transition-colors">
                      {activity.summary}
                    </p>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(activity.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      activity.decision === 'drafted' 
                        ? 'bg-green-100 text-green-700 border border-green-200 group-hover:bg-green-200' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-slate-200'
                    }`}>
                      {activity.decision}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300 animate-bounce">
              <FilterX className="w-8 h-8" />
            </div>
            <p className="text-base font-bold text-slate-900">No events found</p>
            <p className="text-sm mt-1 max-w-[200px] text-center">We couldn't find any activities matching your search criteria.</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-6 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ActivityFeed;