import { User, Goal, Post, Reward } from '../types';

// Database Schema
interface DB {
  user: User | null;
  goals: Goal[];
  posts: Post[];
  rewards: Reward[];
  version: number;
}

const DB_KEY = 'COMMIT_APP_DB_V2';

// Seed Data
export const SEED_USER: User = {
  id: 'u1',
  name: 'Aditya Sakhadeo',
  bio: 'Building better habits, one day at a time.',
  avatar: 'https://picsum.photos/200',
  stats: {
    goalsCompleted: 0,
    currentStreak: 0,
    totalDays: 1
  }
};

const SEED_REWARDS: Reward[] = [
  { id: 'r1', title: 'Free Espresso', brand: 'COEP Canteen', logo: '☕', validity: 'Valid 7 Days', unlocked: true },
  { id: 'r2', title: '20% Off Gym Gear', brand: 'FitStore', logo: '💪', validity: 'Valid 30 Days', unlocked: true },
  { id: 'r3', title: 'Free Audiobook', brand: 'Audible', logo: '🎧', validity: 'Locked', unlocked: false },
  { id: 'r4', title: 'Healthy Meal Box', brand: 'FreshEats', logo: '🥗', validity: 'Locked', unlocked: false },
];

const SEED_POSTS: Post[] = [
  {
      id: '1',
      userId: 'u1',
      userName: 'Aditya Sakhadeo',
      userAvatar: 'https://picsum.photos/200',
      goalId: 'u1_1',
      domain: 'Fitness',
      type: 'STARTED' ,
      content: 'Just started my fitness journey!',
      image: 'https://picsum.photos/400/300',
      likes: 100,
      comments: 5,
      timestamp: '2026-01-01T00:00:00Z',
      progressUpdate: 5,
  }
]

const SEED_GOALS: Goal[] = [
  {
      id: '1',
      title: 'Walk 10,000 Steps Daily',
      domain: 'Fitness',
      progress: 10, // 0 to 100
      tasks: [{id : 't1', title: 'Morning Walk', completed: true}],
      streak: 2,
      completed:false,
      startDate: '2026-01-01',
      totalSkipsAllowed: 1,
      skippedDates: ['2026-01-01'],  // ISO date strings of days that were skipped/shifted
      // Helper for streak calculation (optional persistence, mostly computed)
      completedDayNumbers: [1, 2, 3], 

  }
]
class LocalDatabase {
  private data: DB;

  constructor() {
    this.data = this.load();
  }

  private load(): DB {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load DB", e);
    }
    return {
      user: null,
      goals: [],
      posts: [],
      rewards: SEED_REWARDS,
      version: 1
    };
  }

  private save() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error("Failed to save DB", e);
    }
  }

  // --- User Methods ---
  getUser(): User | null {
    return this.data.user;
  }

  setUser(user: User) {
    this.data.user = user;
    this.save();
  }

  removeUser() {
    this.data.user = null;
    this.save();
  }

  updateUserStats(stats: Partial<User['stats']>) {
    if (this.data.user) {
      this.data.user.stats = { ...this.data.user.stats, ...stats };
      this.save();
    }
  }

  // --- Goal Methods ---
  getGoals(): Goal[] {
    return this.data.goals;
  }

  addGoal(goal: Goal) {
    this.data.goals.unshift(goal);
    this.save();
  }

  updateGoal(updatedGoal: Goal) {
    this.data.goals = this.data.goals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
    this.save();
  }

  deleteGoal(id: string) {
    this.data.goals = this.data.goals.filter(g => g.id !== id);
    this.save();
  }

  // --- Post Methods ---
  getPosts(): Post[] {
    return this.data.posts;
  }

  addPost(post: Post) {
    this.data.posts.unshift(post);
    this.save();
  }

  // --- Reward Methods ---
  getRewards(): Reward[] {
    return this.data.rewards;
  }

  updateRewards(rewards: Reward[]) {
    this.data.rewards = rewards;
    this.save();
  }

  // --- Utility ---
  init() {
    // If we want to seed initial posts only on first run ever:
    if (this.data.goals.length === 0) {
      this.data.goals = SEED_GOALS;
      this.save();
    }
    if (this.data.posts.length === 0) {
      this.data.posts = SEED_POSTS;
      this.save();
    }
  }
}

// Singleton Instance
const db = new LocalDatabase();

export const StorageService = {
  init: () => db.init(),
  getUser: () => db.getUser(),
  saveUser: (u: User) => db.setUser(u),
  removeUser: () => db.removeUser(),
  
  getGoals: () => db.getGoals(),
  saveGoals: (goals: Goal[]) => {

    // This method exists for backward compatibility with App.tsx bulk updates, 
    // but ideally we use updateGoal individually.
    // We'll just replace the whole array for now to match App logic.
    // A better backend would iterate and update.
    // For this implementation, we can just assume 'goals' is the new state.
    // However, the DB class doesn't have "setAllGoals", so let's hack it or fix App.tsx.
    // Let's implement a bulk setter in the class?
    // Actually, let's just expose a way to set the goals array for compatibility.
    (db as any).data.goals = goals;
    (db as any).save();
  },

  getPosts: () => db.getPosts(),
  savePosts: (posts: Post[]) => {
    (db as any).data.posts = posts;
    (db as any).save();
  },

  getRewards: () => db.getRewards(),
  saveRewards: (rewards: Reward[]) => db.updateRewards(rewards),
  
  // Expose direct methods for cleaner usage if we refactor App later
  addGoal: (g: Goal) => db.addGoal(g),
  updateGoal: (g: Goal) => db.updateGoal(g),
  addPost: (p: Post) => db.addPost(p),
};