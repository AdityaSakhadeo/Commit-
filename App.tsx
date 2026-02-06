import React, { useState, useEffect } from 'react';
import { Screen, Domain, Goal, Post, User, Reward, Task } from './types';
import { MobileContainer } from './components/Layout';
import { BottomNav } from './components/BottomNav';
import { PartyPopper, Gift, X } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';
import { StorageService, SEED_USER } from './services/storageService';

// Screens
import Onboarding from './screens/Onboarding';
import GoalSelection from './screens/GoalSelection';
import AIGoalSetup from './screens/AIGoalSetup';
import HomeFeed from './screens/HomeFeed';
import CreatePost from './screens/CreatePost';
import GoalDetail from './screens/GoalDetail';
import Rewards from './screens/Rewards';
import Profile from './screens/Profile';

// Simple confetti component
const ConfettiRain = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
    {[...Array(20)].map((_, i) => (
      <div 
        key={i}
        className="absolute animate-bounce"
        style={{
          left: `${Math.random() * 100}%`,
          top: `-20px`,
          animationDuration: `${2 + Math.random() * 3}s`,
          animationDelay: `${Math.random() * 2}s`
        }}
      >
         <div 
           className="w-3 h-3 rounded-full" 
           style={{ backgroundColor: ['#FCD34D', '#F87171', '#60A5FA', '#34D399'][Math.floor(Math.random() * 4)] }} 
         />
      </div>
    ))}
  </div>
);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  const [screen, setScreen] = useState<Screen>(Screen.ONBOARDING);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  
  // Data State
  const [posts, setPosts] = useState<Post[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [justCompletedGoal, setJustCompletedGoal] = useState<Goal | null>(null);

  // 1. Initial Data Load
  useEffect(() => {
    // Artificial delay for splash screen
    const timer = setTimeout(() => {
      StorageService.init();
      const storedUser = StorageService.getUser();
      const storedGoals = StorageService.getGoals();
      const storedPosts = StorageService.getPosts();
      const storedRewards = StorageService.getRewards();

      setUser(storedUser);
      setGoals(storedGoals);
      setPosts(storedPosts);
      setRewards(storedRewards);

      // Navigate based on state
      if (storedUser) {
        if (storedGoals.length > 0) {
          setScreen(Screen.HOME);
        } else {
          setScreen(Screen.GOAL_SELECTION);
        }
      } else {
        setScreen(Screen.ONBOARDING);
      }
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Sync helpers
  const updateUser = (newUser: User) => {
    setUser(newUser);
    StorageService.saveUser(newUser);
  };

  const updateGoals = (newGoals: Goal[]) => {
    setGoals(newGoals);
    StorageService.saveGoals(newGoals);
  };

  const updatePosts = (newPosts: Post[]) => {
    setPosts(newPosts);
    StorageService.savePosts(newPosts);
  };

  const updateRewards = (newRewards: Reward[]) => {
    setRewards(newRewards);
    StorageService.saveRewards(newRewards);
  };

  // Auth Handlers
  const handleLogin = () => {
    // Simulate login by setting seed user
    const newUser = SEED_USER;
    StorageService.saveUser(newUser);
    setUser(newUser);
    
    // Determine where to go
    const currentGoals = StorageService.getGoals();
    if (currentGoals.length > 0) {
      setScreen(Screen.HOME);
    } else {
      setScreen(Screen.GOAL_SELECTION);
    }
  };

  const handleLogout = () => {
    StorageService.removeUser();
    setUser(null);
    setScreen(Screen.ONBOARDING);
    setActiveGoal(null);
    setSelectedDomain(null);
  };

  // App Logic Handlers
  const handleAddGoal = (goal: Goal) => {
    const newGoals = [goal, ...goals];
    updateGoals(newGoals);
    setActiveGoal(goal);
    
    // Auto-create a "Started" post
    if (user) {
      const newPost: Post = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        domain: goal.domain,
        type: 'STARTED',
        content: `I just committed to a new goal: ${goal.title}. Let's do this! 💪`,
        likes: 0,
        comments: 0,
        timestamp: new Date().toISOString()
      };
      updatePosts([newPost, ...posts]);
    }
    setScreen(Screen.HOME);
  };

  const handlePostCreate = (post: Post) => {
    updatePosts([post, ...posts]);
    setScreen(Screen.HOME);
  };

  // --- STREAK CALCULATION ENGINE ---
  const calculateGoalStats = (goal: Goal, updatedTasks: Task[]): { streak: number, progress: number, completed: boolean } => {
    // 1. Group Tasks by "Day X"
    const dayMap = new Map<number, Task[]>();
    let maxDay = 0;
    
    updatedTasks.forEach(t => {
      const match = t.title.match(/^Day (\d+)/);
      if (match) {
        const dayNum = parseInt(match[1]);
        if (dayNum > maxDay) maxDay = dayNum;
        const existing = dayMap.get(dayNum) || [];
        existing.push(t);
        dayMap.set(dayNum, existing);
      }
    });

    // 2. Determine which Virtual Day Numbers are fully completed (all tasks done)
    const completedVirtualDays: number[] = [];
    dayMap.forEach((tasks, dayNum) => {
      if (tasks.length > 0 && tasks.every(t => t.completed)) {
        completedVirtualDays.push(dayNum);
      }
    });

    // 3. Map Virtual Days to Calendar Dates
    const startDate = new Date(goal.startDate);
    startDate.setHours(0,0,0,0);
    
    const completedDates = new Set<string>(); // Format: YYYY-MM-DD
    let virtualDay = 1;
    let currentDate = new Date(startDate);
    
    // Limit loop to avoid infinite loops if data is weird
    while (virtualDay <= maxDay + 10) { 
       const dateStr = currentDate.toISOString().split('T')[0];
       
       // Check if this calendar date is skipped
       const isSkipped = (goal.skippedDates || []).some(sd => sd.startsWith(dateStr));
       
       if (isSkipped) {
          // Move calendar forward, virtual day stays same
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
       }
       
       // If this virtual day is complete, mark the calendar date as complete
       if (completedVirtualDays.includes(virtualDay)) {
          completedDates.add(dateStr);
       }
       
       virtualDay++;
       currentDate.setDate(currentDate.getDate() + 1);
    }

    // 4. Calculate Streak (Working backwards from Today)
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];
    
    let checkDate = new Date(today);
    let streak = 0;

    // Check if we should start counting from today or yesterday
    // If today is NOT done, but yesterday IS done, streak is alive.
    if (!completedDates.has(todayStr)) {
       checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (true) {
       const dStr = checkDate.toISOString().split('T')[0];
       if (completedDates.has(dStr)) {
         streak++;
         checkDate.setDate(checkDate.getDate() - 1);
       } else {
         break;
       }
    }

    // 5. Calculate Progress
    const totalTasks = updatedTasks.length;
    const completedTasksCount = updatedTasks.filter(t => t.completed).length;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasksCount / totalTasks) * 100);
    const completed = progress === 100;

    return { streak, progress, completed };
  };

  const handleTaskToggle = (goalId: string, taskId: string) => {
    if (!user) return;

    let goalJustFinished = false;
    let finishedGoalObj: Goal | null = null;
    let newRewards = [...rewards];
    let newUser = { ...user };

    const newGoals = goals.map(goal => {
      if (goal.id !== goalId) return goal;

      // 1. Update tasks
      const updatedTasks = goal.tasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );

      // 2. Recalculate stats with the new engine
      const { streak, progress, completed } = calculateGoalStats(goal, updatedTasks);

      const updatedGoal = { 
        ...goal, 
        tasks: updatedTasks, 
        progress, 
        streak, 
        completed 
      };

      // Check if it just reached 100% completion (and wasn't before)
      if (completed && !goal.completed) {
        goalJustFinished = true;
        finishedGoalObj = updatedGoal;
      }

      return updatedGoal;
    });

    if (goalJustFinished && finishedGoalObj) {
      setJustCompletedGoal(finishedGoalObj);
      setShowCelebration(true);
      
      // Unlock a random locked reward
      const locked = newRewards.filter(r => !r.unlocked);
      if (locked.length > 0) {
        const toUnlock = locked[0];
        newRewards = newRewards.map(r => r.id === toUnlock.id ? { ...r, unlocked: true } : r);
        updateRewards(newRewards);
      }
      
      newUser.stats.goalsCompleted += 1;
      updateUser(newUser);
    }

    updateGoals(newGoals);
  };

  const handleUpdateDayTasks = (goalId: string, dayNumber: number, newTasks: string[]) => {
    const newGoals = goals.map(goal => {
      if (goal.id !== goalId) return goal;

      const prefix = `Day ${dayNumber}`;
      const otherTasks = goal.tasks.filter(t => !t.title.startsWith(`${prefix}:`) && !t.title.startsWith(`${prefix} `));

      const addedTasks: Task[] = newTasks.map((txt, idx) => ({
        id: `t-updated-${Date.now()}-${idx}`,
        title: `Day ${dayNumber}: ${txt}`,
        completed: false
      }));

      const updatedTasks = [...otherTasks, ...addedTasks];
      return { ...goal, tasks: updatedTasks };
    });

    updateGoals(newGoals);
    if (activeGoal && activeGoal.id === goalId) {
       setActiveGoal(newGoals.find(g => g.id === goalId) || null);
    }
  };

  const handleUseSkip = (goalId: string, date: Date) => {
    const dateStr = date.toISOString();
    const newGoals = goals.map(goal => {
      if (goal.id !== goalId) return goal;
      
      const currentSkips = goal.skippedDates || [];
      if (currentSkips.some(d => d.split('T')[0] === dateStr.split('T')[0])) return goal;

      return {
        ...goal,
        skippedDates: [...currentSkips, dateStr]
      };
    });
    updateGoals(newGoals);
    if (activeGoal && activeGoal.id === goalId) {
      setActiveGoal(newGoals.find(g => g.id === goalId) || null);
   }
  };

  const closeCelebration = (goToRewards: boolean) => {
    setShowCelebration(false);
    if (goToRewards) {
      setScreen(Screen.REWARDS);
    } else {
      setScreen(Screen.HOME);
    }
  };

  const handleProfileGoalSelect = (goal: Goal) => {
    setActiveGoal(goal);
    setScreen(Screen.GOAL_DETAIL);
  };

  const renderScreen = () => {
    if (!user) {
      return <Onboarding onStart={handleLogin} />;
    }

    switch (screen) {
      case Screen.ONBOARDING:
         return <Onboarding onStart={handleLogin} />;
      case Screen.GOAL_SELECTION:
        return (
          <GoalSelection 
            onSelect={(domain) => {
              setSelectedDomain(domain);
              setScreen(Screen.AI_SETUP);
            }} 
            onBack={goals.length > 0 ? () => setScreen(Screen.HOME) : undefined}
          />
        );
      case Screen.AI_SETUP:
        return (
          <AIGoalSetup 
            domain={selectedDomain || 'Habits'} 
            onGoalCreated={handleAddGoal} 
            onBack={() => setScreen(Screen.GOAL_SELECTION)}
          />
        );
      case Screen.HOME:
        return (
          <HomeFeed 
            posts={posts} 
            activeGoals={goals} 
            user={user}
            onEncourage={(id) => console.log('Liked', id)} 
            onViewGoal={handleProfileGoalSelect}
            onToggleTask={handleTaskToggle}
          />
        );
      case Screen.CREATE_POST:
        return (
          <CreatePost 
            user={user} 
            activeGoals={goals} 
            onPost={handlePostCreate} 
            onCancel={() => setScreen(Screen.HOME)}
          />
        );
      case Screen.GOAL_DETAIL:
        const currentActiveGoal = goals.find(g => g.id === activeGoal?.id) || activeGoal;
        return currentActiveGoal ? (
          <GoalDetail 
            goal={currentActiveGoal} 
            onToggleTask={handleTaskToggle}
            onBack={() => setScreen(Screen.HOME)}
            onUpdateTasks={handleUpdateDayTasks}
            onSkipDay={handleUseSkip}
          />
        ) : (
           <GoalSelection onSelect={() => {}} /> 
        );
      case Screen.REWARDS:
        return <Rewards rewards={rewards} />;
      case Screen.PROFILE:
        return (
          <Profile 
            user={user} 
            goals={goals} 
            onGoalSelect={handleProfileGoalSelect} 
            onLogout={handleLogout}
          />
        );
      default:
        return <HomeFeed posts={posts} activeGoals={goals} user={user} onEncourage={() => {}} onViewGoal={handleProfileGoalSelect} onToggleTask={handleTaskToggle} />;
    }
  };

  if (loading) {
    return <SplashScreen onBypass={() => setLoading(false)} />;
  }

  return (
    <MobileContainer hasNav={!!user && screen !== Screen.ONBOARDING}>
      
      {renderScreen()}
      
      {user && screen !== Screen.AI_SETUP && screen !== Screen.ONBOARDING && screen !== Screen.CREATE_POST && (
        <BottomNav currentScreen={screen} onNavigate={setScreen} />
      )}

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 fade-in">
           <ConfettiRain />
           <div className="bg-white rounded-[2.5rem] p-8 text-center w-full max-w-sm relative shadow-2xl transform scale-100 transition-all">
              <button 
                onClick={() => closeCelebration(false)} 
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500"
              >
                <X size={24} />
              </button>
              
              <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
                <PartyPopper size={40} />
              </div>
              
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Goal Crushed!</h2>
              <p className="text-slate-500 mb-8">
                You completed <span className="text-teal-600 font-bold">{justCompletedGoal?.title}</span>. 
                That's a huge milestone!
              </p>
              
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 rounded-2xl text-white mb-6 shadow-lg shadow-purple-200">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/20 rounded-xl">
                     <Gift size={24} />
                   </div>
                   <div className="text-left">
                     <p className="text-xs font-medium text-purple-100">Reward Unlocked</p>
                     <p className="font-bold">New Voucher Available</p>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => closeCelebration(true)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 hover:scale-105 transition-transform"
              >
                Claim Reward
              </button>
           </div>
        </div>
      )}
    </MobileContainer>
  );
}