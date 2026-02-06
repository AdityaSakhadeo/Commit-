import React from 'react';
import { Post, Goal, Story, User, Domain } from '../types';
import { Header } from '../components/Layout';
import { Heart, MessageCircle, PartyPopper, Plus, CheckCircle2, Circle, ChevronRight, Zap, Check, Calendar, Settings } from 'lucide-react';

interface HomeFeedProps {
  posts: Post[];
  activeGoals: Goal[];
  user: User;
  onEncourage: (id: string) => void;
  onViewGoal: (goal: Goal) => void;
  onToggleTask: (goalId: string, taskId: string) => void;
}

const MOCK_STORIES: Story[] = [
  { id: 's1', userId: 'u2', userName: 'Sarah', userAvatar: 'https://picsum.photos/201', hasUnseen: true },
  { id: 's2', userId: 'u3', userName: 'Mike', userAvatar: 'https://picsum.photos/202', hasUnseen: true },
  { id: 's3', userId: 'u4', userName: 'Jessica', userAvatar: 'https://picsum.photos/203', hasUnseen: false },
  { id: 's4', userId: 'u5', userName: 'David', userAvatar: 'https://picsum.photos/204', hasUnseen: false },
];

const getDomainColor = (domain: Domain) => {
  switch (domain) {
    case 'Fitness': return 'text-emerald-600 bg-emerald-100';
    case 'Career': return 'text-blue-600 bg-blue-100';
    case 'Learning': return 'text-amber-600 bg-amber-100';
    case 'Mental Health': return 'text-rose-600 bg-rose-100';
    default: return 'text-teal-600 bg-teal-100';
  }
};

const getRelativeTimeLabel = (timestamp: string): string => {
  const date = new Date(timestamp);

  // Fallback to original string if we can't parse a real date
  if (isNaN(date.getTime())) {
    return timestamp;
  }

  const now = Date.now();
  const diffMs = now - date.getTime();

  // Treat anything within a few seconds as "Just now"
  if (diffMs < 5000) {
    return 'Just now';
  }

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}m`;
};

const StoriesRail: React.FC<{ user: User }> = ({ user }) => (
  <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 py-4 pb-2">
    {/* My Story */}
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className="relative">
        <img src={user.avatar} alt="My Story" className="w-16 h-16 rounded-full border-2 border-white shadow-md object-cover" />
        <div className="absolute bottom-0 right-0 bg-teal-500 text-white p-0.5 rounded-full border-2 border-white">
          <Plus size={14} strokeWidth={3} />
        </div>
      </div>
      <span className="text-xs font-medium text-slate-600">My Story</span>
    </div>

    {/* Other Stories */}
    {MOCK_STORIES.map(story => (
      <div key={story.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
        <div className={`p-[3px] rounded-full ${story.hasUnseen ? 'bg-gradient-to-tr from-teal-400 to-blue-500' : 'bg-slate-200'}`}>
          <div className="bg-white p-[2px] rounded-full">
             <img src={story.userAvatar} alt={story.userName} className="w-[3.6rem] h-[3.6rem] rounded-full object-cover group-hover:scale-105 transition-transform" />
          </div>
        </div>
        <span className="text-xs font-medium text-slate-600">{story.userName}</span>
      </div>
    ))}
  </div>
);

const TodaysActionList: React.FC<{ goals: Goal[]; onViewGoal: (g: Goal) => void; onToggleTask: (gid: string, tid: string) => void }> = ({ goals, onViewGoal, onToggleTask }) => {
  // Collect tasks specifically for TODAY or SETUP
  const actions = goals.map(g => {
    if (!g.tasks) return null;

    // 1. Priority: Setup Tasks
    // If there are uncompleted setup tasks, show them first regardless of the date.
    const setupTask = g.tasks.find(t => t.title.startsWith("Setup:") && !t.completed);
    if (setupTask) return { goal: g, task: setupTask, isSetup: true };

    // 2. Logic for Today's Tasks
    const start = new Date(g.startDate);
    start.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);

    // If goal hasn't started yet
    if (today < start) return null;

    // Check if today is specifically a skipped day
    const isTodaySkipped = (g.skippedDates || []).some(d => {
        const skipDate = new Date(d);
        skipDate.setHours(0,0,0,0);
        return skipDate.getTime() === today.getTime();
    });

    if (isTodaySkipped) return null; // Relax today, no task to show

    // Calculate "Effective Day" (Calendar Days - Skips that happened before today)
    const oneDay = 1000 * 60 * 60 * 24;
    const rawDay = Math.floor((today.getTime() - start.getTime()) / oneDay) + 1;
    
    const skipsBefore = (g.skippedDates || []).filter(d => {
         const skipDate = new Date(d);
         skipDate.setHours(0,0,0,0);
         return skipDate.getTime() < today.getTime();
    }).length;

    const effectiveDay = rawDay - skipsBefore;
    const prefix = `Day ${effectiveDay}`;

    // Find the first uncompleted task matching strictly "Day X"
    const dayTask = g.tasks.find(t => 
        !t.completed && 
        (t.title.startsWith(`${prefix}:`) || t.title.startsWith(`${prefix} `))
    );

    if (dayTask) return { goal: g, task: dayTask, isSetup: false };

    return null;
  }).filter((item): item is { goal: Goal, task: { id: string, title: string, completed: boolean }, isSetup: boolean } => item !== null);

  if (actions.length === 0) return null;

  return (
    <div className="px-6 py-2 mb-2">
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
         <div className="flex items-center gap-2 mb-4 text-slate-800">
            <div className="p-1.5 bg-teal-50 rounded-lg text-teal-600">
               <Zap size={16} fill="currentColor" />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wide">Today's Focus</h3>
         </div>

         <div className="space-y-3">
            {actions.map(({ goal, task, isSetup }) => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-teal-200 hover:bg-white transition-all group">
                {/* Clickable Checkbox */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(goal.id, task.id);
                  }}
                  className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.completed ? 'bg-teal-500 border-teal-500' : 'border-slate-300 bg-white hover:border-teal-400'}`}
                >
                    {task.completed && <Check size={14} className="text-white" />}
                </button>

                <div className="flex-1 cursor-pointer" onClick={() => onViewGoal(goal)}>
                   <p className="text-sm font-semibold text-slate-800 leading-snug mb-1">
                     {isSetup ? task.title.replace('Setup: ', 'Setup: ') : task.title.replace(/^Day \d+.*?: /, '')}
                   </p>
                   <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${getDomainColor(goal.domain)}`}>
                        {goal.domain}
                      </span>
                      <span className="text-xs text-slate-400 font-medium truncate">• {goal.title}</span>
                      {isSetup && <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded flex items-center gap-0.5"><Settings size={10} /> Prep</span>}
                   </div>
                </div>

                <button onClick={() => onViewGoal(goal)} className="mt-1 text-slate-300 group-hover:text-teal-400 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

const PostCard: React.FC<{ post: Post; onEncourage: () => void }> = ({ post, onEncourage }) => {
  const isStarted = post.type === 'STARTED';
  const isCompleted = post.type === 'COMPLETED';

  const [relativeTime, setRelativeTime] = React.useState<string>(() =>
    getRelativeTimeLabel(post.timestamp)
  );

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setRelativeTime(getRelativeTimeLabel(post.timestamp));
    }, 30000); // update every 30 seconds instead of every second

    return () => window.clearInterval(interval);
  }, [post.timestamp]);

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-4 fade-in">
      <div className="flex items-center gap-3 mb-4">
        <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" />
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 text-sm">{post.userName}</h3>
          <p className="text-xs text-slate-400 font-medium">{relativeTime}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border 
          ${isStarted ? 'bg-blue-50 text-blue-600 border-blue-100' : isCompleted ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
          {post.domain}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-slate-700 leading-relaxed mb-3 text-sm">{post.content}</p>
        {post.image && (
          <div className="rounded-2xl overflow-hidden shadow-sm mb-3">
             <img src={post.image} alt="Update" className="w-full h-48 object-cover" />
          </div>
        )}
        
        {post.progressUpdate !== undefined && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
             <div className="flex justify-between text-xs text-slate-500 mb-1 font-semibold">
               <span>Goal Progress</span>
               <span>{post.progressUpdate}%</span>
             </div>
             <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
               <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${post.progressUpdate}%` }}></div>
             </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <button 
          onClick={onEncourage}
          className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors group"
        >
          <div className="p-2 bg-slate-50 rounded-full group-hover:bg-rose-50 transition-colors">
            {isCompleted ? <PartyPopper size={18} /> : <Heart size={18} />}
          </div>
          <span className="text-sm font-medium">{post.likes}</span>
        </button>

        <button className="flex items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors group">
          <div className="p-2 bg-slate-50 rounded-full group-hover:bg-blue-50 transition-colors">
            <MessageCircle size={18} />
          </div>
           <span className="text-sm font-medium">{post.comments}</span>
        </button>

        <button className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-bold hover:bg-teal-100 hover:shadow-sm transition-all border border-teal-100">
          Encourage
        </button>
      </div>
    </div>
  );
};

export default function HomeFeed({ posts, activeGoals, user, onEncourage, onViewGoal, onToggleTask }: HomeFeedProps) {
  return (
    <div className="min-h-full bg-slate-50">
      <Header title="Community" subtitle="Your productivity circle" />
      
      {/* Stories Rail */}
      <StoriesRail user={user} />

      {/* Today's Action Plan List */}
      <TodaysActionList goals={activeGoals} onViewGoal={onViewGoal} onToggleTask={onToggleTask} />

      {/* Feed */}
      <div className="px-4 pb-24 pt-2">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="font-bold text-slate-800">Latest Updates</h3>
        </div>
        {posts.map(post => (
          <PostCard key={post.id} post={post} onEncourage={() => onEncourage(post.id)} />
        ))}
      </div>
    </div>
  );
}