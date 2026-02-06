import React, { useState, useEffect } from 'react';
import { User, Goal } from '../types';
import { Settings, Award, Flame, Target, Award as AwardIcon, ChevronRight } from 'lucide-react';

interface ProfileProps {
  user: User;
  goals: Goal[];
  onGoalSelect?: (goal: Goal) => void;
  onUserUpdate?: (user: User) => void;
}

export default function Profile({ user, goals, onGoalSelect, onUserUpdate }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'GOALS' | 'HISTORY'>('GOALS');
  const [newHobby, setNewHobby] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [localHobbies, setLocalHobbies] = useState<string[]>(user.hobbies || []);

  // Keep local view in sync with persisted user
  useEffect(() => {
    setLocalHobbies(user.hobbies || []);
  }, [user.hobbies]);

  const hobbies = localHobbies;

  const baseSuggestions = [
    'Running',
    'Yoga',
    'Gym',
    'Cycling',
    'Meditation',
    'Reading',
    'Writing',
    'Cooking',
    'Photography',
    'Gaming',
  ];

  // Light "AI" flavour: prioritize by domains and text match
  const domainKeywords = goals.map((g) => g.domain);
  const rawSuggestions = baseSuggestions.filter((s) => !hobbies.includes(s));

  const filteredSuggestions = rawSuggestions
    .filter((s) =>
      newHobby.trim()
        ? s.toLowerCase().includes(newHobby.trim().toLowerCase())
        : true
    )
    .sort((a, b) => {
      const aBoost =
        domainKeywords.some((d) =>
          a.toLowerCase().includes(d.toLowerCase().slice(0, 3))
        ) ? 1 : 0;
      const bBoost =
        domainKeywords.some((d) =>
          b.toLowerCase().includes(d.toLowerCase().slice(0, 3))
        ) ? 1 : 0;
      return bBoost - aBoost;
    })
    .slice(0, 6);

  const handleAddHobby = () => {
    const value = newHobby.trim();
    if (!value) return;
    if (hobbies.includes(value)) {
      setNewHobby('');
      return;
    }

    const nextHobbies = [...hobbies, value];

    const updatedUser: User = {
      ...user,
      hobbies: nextHobbies,
    };

    onUserUpdate?.(updatedUser);
    setLocalHobbies(nextHobbies);
    setNewHobby('');
    setShowSuggestions(false);
  };

  const handleHobbyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHobby();
    }
  };

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      <div className="bg-white pb-6 rounded-b-[2.5rem] shadow-sm border-b border-slate-100">
        <div className="px-6 py-4 flex justify-end">
           <button className="text-slate-400 hover:text-slate-600"><Settings size={24} /></button>
        </div>
        
        <div className="flex flex-col items-center text-center px-6">
           <div className="relative mb-4 group">
             <img src={user.avatar} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white shadow-xl shadow-slate-200 object-cover" />
             <div className="absolute bottom-0 right-0 w-8 h-8 bg-teal-500 border-4 border-white rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
               5
             </div>
           </div>
           <h2 className="text-2xl font-bold text-slate-900 mb-1">{user.name}</h2>
           <p className="text-slate-500 text-sm max-w-xs leading-relaxed">{user.bio}</p>

           <div className="flex items-center gap-4 mt-8 w-full justify-center">
              <div className="text-center flex-1 p-3 rounded-2xl bg-orange-50/50 border border-orange-100">
                <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                  <Flame size={18} fill="currentColor" />
                  <span className="font-bold text-lg text-slate-800">{user.stats.currentStreak}</span>
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Streak</div>
              </div>
              <div className="text-center flex-1 p-3 rounded-2xl bg-blue-50/50 border border-blue-100">
                 <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                  <Target size={18} />
                  <span className="font-bold text-lg text-slate-800">{goals.length}</span>
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active</div>
              </div>
              <div className="text-center flex-1 p-3 rounded-2xl bg-purple-50/50 border border-purple-100">
                 <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
                  <Award size={18} />
                  <span className="font-bold text-lg text-slate-800">{user.stats.goalsCompleted}</span>
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Done</div>
              </div>
           </div>
        </div>
        
        {/* Hobbies / Interests */}
        <div className="px-6 mt-4 mb-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
              Hobbies & Interests
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {hobbies.length === 0 ? (
              <span className="text-xs text-slate-400">
                Add a few tags like &quot;Running&quot;, &quot;Guitar&quot;, or &quot;Cooking&quot;.
              </span>
            ) : (
              hobbies.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-medium border border-teal-100"
                >
                  {tag}
                </span>
              ))
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newHobby}
                onChange={(e) => {
                  setNewHobby(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={handleHobbyKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Delay closing so click can register
                  setTimeout(() => setShowSuggestions(false), 120);
                }}
                placeholder="Add a hobby tag"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/60 focus:border-teal-500 bg-slate-50"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.16em]">
                    AI suggestions
                  </div>
                  {hobbies.length > 0 && (
                    <div className="px-3 pb-1">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.16em] mb-1">
                        Your tags
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {hobbies.map((tag) => (
                          <span
                            key={`current-${tag}`}
                            className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 text-[11px] border border-slate-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        // add immediately
                        if (hobbies.includes(suggestion)) {
                          setShowSuggestions(false);
                          return;
                        }
                        const nextHobbies = [...hobbies, suggestion];
                        const updatedUser: User = {
                          ...user,
                          hobbies: nextHobbies,
                        };
                        onUserUpdate?.(updatedUser);
                        setLocalHobbies(nextHobbies);
                        setNewHobby('');
                        setShowSuggestions(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-teal-50"
                    >
                      <span>{suggestion}</span>
                      <span className="text-[10px] uppercase text-teal-500 font-semibold">
                        Add
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleAddHobby}
              className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!newHobby.trim()}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 px-6 pt-6 pb-2">
        <div className="flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
           <button 
             onClick={() => setActiveTab('GOALS')}
             className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'GOALS' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Active Goals
           </button>
           <button 
             onClick={() => setActiveTab('HISTORY')}
             className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'HISTORY' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Certificates
           </button>
        </div>
      </div>

      <div className="p-6 pt-2">
        {activeTab === 'GOALS' ? (
           <div className="space-y-4 fade-in">
             {goals.length === 0 ? (
               <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
                 <Target size={32} className="mx-auto mb-3 opacity-20" />
                 <p className="text-sm">No active goals yet.<br/>Time to commit!</p>
               </div>
             ) : (
               goals.map(goal => (
                 <button 
                   key={goal.id} 
                   onClick={() => onGoalSelect && onGoalSelect(goal)}
                   className="w-full group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all flex items-center justify-between text-left"
                 >
                   <div className="flex-1">
                     <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 mb-2 uppercase tracking-wide group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">{goal.domain}</span>
                     <h4 className="font-bold text-slate-800 text-lg">{goal.title}</h4>
                     <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                       <Flame size={12} className={goal.streak > 0 ? "text-orange-500" : ""} /> {goal.streak} day streak
                     </p>
                   </div>
                   
                   <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-teal-500 transition-all duration-1000" strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * goal.progress) / 100} strokeLinecap="round" />
                          </svg>
                          <span className="absolute text-[10px] font-bold text-slate-700">{goal.progress}%</span>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                   </div>
                 </button>
               ))
             )}
           </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 fade-in">
             <div className="aspect-[4/5] bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl border border-amber-200 p-4 flex flex-col justify-between relative overflow-hidden shadow-sm hover:scale-[1.02] transition-transform">
                <div className="absolute top-0 right-0 p-2 text-amber-300 opacity-20"><AwardIcon size={64} /></div>
                <div className="w-8 h-8 rounded-full bg-white/50 backdrop-blur flex items-center justify-center text-amber-600"><AwardIcon size={16} /></div>
                <div>
                  <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Completed</div>
                  <div className="font-bold text-amber-900 text-sm leading-tight">30 Day Fitness Challenge</div>
                </div>
             </div>
             <div className="aspect-[4/5] bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl border border-blue-200 p-4 flex flex-col justify-between relative overflow-hidden shadow-sm hover:scale-[1.02] transition-transform">
                <div className="absolute top-0 right-0 p-2 text-blue-300 opacity-20"><AwardIcon size={64} /></div>
                <div className="w-8 h-8 rounded-full bg-white/50 backdrop-blur flex items-center justify-center text-blue-600"><AwardIcon size={16} /></div>
                <div>
                  <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Completed</div>
                  <div className="font-bold text-blue-900 text-sm leading-tight">Read 5 Books</div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}