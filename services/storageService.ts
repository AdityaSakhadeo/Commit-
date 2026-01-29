import { User, Goal, Post, Reward } from '../types';

const KEYS = {
  USER: 'COMMIT_APP_USER_V1',
  GOALS: 'COMMIT_APP_GOALS_V1',
  POSTS: 'COMMIT_APP_POSTS_V1',
  REWARDS: 'COMMIT_APP_REWARDS_V1',
};

// --- Initial Seed Data ---
const SEED_USER: User = {
  id: 'u1',
  name: 'Alex Rivera',
  bio: 'Building better habits, one day at a time.',
  avatar: 'https://picsum.photos/200',
  stats: {
    goalsCompleted: 3,
    currentStreak: 12,
    totalDays: 45
  }
};

const SEED_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u2',
    userName: 'Sarah Jenkins',
    userAvatar: 'https://picsum.photos/201',
    domain: 'Fitness',
    type: 'UPDATE',
    content: 'Just finished my 5k run! Feeling exhausted but accomplished. 🏃‍♀️💨',
    likes: 24,
    comments: 4,
    timestamp: '2h ago',
    progressUpdate: 65,
    image: 'https://picsum.photos/800/600'
  },
  {
    id: 'p2',
    userId: 'u3',
    userName: 'Mike Chen',
    userAvatar: 'https://picsum.photos/202',
    domain: 'Learning',
    type: 'STARTED',
    content: 'Starting my journey to learn Python today. Wish me luck!',
    likes: 56,
    comments: 12,
    timestamp: '5h ago'
  }
];

const SEED_REWARDS: Reward[] = [
  { id: 'r1', title: 'Free Espresso', brand: 'Coffee House', logo: '☕', validity: 'Valid 7 Days', unlocked: true },
  { id: 'r2', title: '20% Off Gym Gear', brand: 'FitStore', logo: '💪', validity: 'Valid 30 Days', unlocked: true },
  { id: 'r3', title: 'Free Audiobook', brand: 'Audible', logo: '🎧', validity: 'Locked', unlocked: false },
  { id: 'r4', title: 'Healthy Meal Box', brand: 'FreshEats', logo: '🥗', validity: 'Locked', unlocked: false },
];

export const StorageService = {
  // Initialize data if not present
  init: () => {
    try {
      if (!localStorage.getItem(KEYS.USER)) {
        localStorage.setItem(KEYS.USER, JSON.stringify(SEED_USER));
      }
      if (!localStorage.getItem(KEYS.POSTS)) {
        localStorage.setItem(KEYS.POSTS, JSON.stringify(SEED_POSTS));
      }
      if (!localStorage.getItem(KEYS.REWARDS)) {
        localStorage.setItem(KEYS.REWARDS, JSON.stringify(SEED_REWARDS));
      }
      if (!localStorage.getItem(KEYS.GOALS)) {
        localStorage.setItem(KEYS.GOALS, JSON.stringify([]));
      }
    } catch (e) {
      console.error("Storage init failed", e);
    }
  },

  getUser: (): User => {
    try {
      const data = localStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : SEED_USER;
    } catch { return SEED_USER; }
  },

  saveUser: (user: User) => {
    try { localStorage.setItem(KEYS.USER, JSON.stringify(user)); } catch {}
  },

  getGoals: (): Goal[] => {
    try {
      const data = localStorage.getItem(KEYS.GOALS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveGoals: (goals: Goal[]) => {
    try { localStorage.setItem(KEYS.GOALS, JSON.stringify(goals)); } catch {}
  },

  getPosts: (): Post[] => {
    try {
      const data = localStorage.getItem(KEYS.POSTS);
      return data ? JSON.parse(data) : SEED_POSTS;
    } catch { return SEED_POSTS; }
  },

  savePosts: (posts: Post[]) => {
    try { localStorage.setItem(KEYS.POSTS, JSON.stringify(posts)); } catch {}
  },

  getRewards: (): Reward[] => {
    try {
      const data = localStorage.getItem(KEYS.REWARDS);
      return data ? JSON.parse(data) : SEED_REWARDS;
    } catch { return SEED_REWARDS; }
  },

  saveRewards: (rewards: Reward[]) => {
    try { localStorage.setItem(KEYS.REWARDS, JSON.stringify(rewards)); } catch {}
  },
  
  // Helper to clear data (for debugging)
  clearAll: () => {
    localStorage.clear();
    window.location.reload();
  }
};
