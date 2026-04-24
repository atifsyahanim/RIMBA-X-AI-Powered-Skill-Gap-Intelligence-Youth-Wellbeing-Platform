import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { UserProgress, UserStats, Achievement, UserAchievement } from '@/types';

// Lazy-init: only created when a DB function is called (server-side).
// Avoids crashing client imports that only use pure utility exports.
let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
  }
  return _supabase;
}

/**
 * XP rewards for different actions
 */
export const XP_REWARDS = {
  COMPLETE_SESSION: 50,
  ASK_QUESTION: 5,
  CORRECT_QUIZ_ANSWER: 10,
  UPLOAD_MATERIAL: 25,
  DAILY_STREAK: 30,
  COMPLETE_TOPIC: 100,
  FIRST_LOGIN: 10,
  WEEK_STREAK: 100,
} as const;

/**
 * Calculate level from total XP
 * Formula: level = floor(sqrt(xp / 100))
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100));
}

/**
 * Calculate XP needed for next level
 */
export function xpForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1;
  return (nextLevel * nextLevel * 100);
}

/**
 * Calculate XP progress percentage to next level
 */
export function calculateLevelProgress(currentXP: number): number {
  const currentLevel = calculateLevel(currentXP);
  const currentLevelXP = currentLevel * currentLevel * 100;
  const nextLevelXP = xpForNextLevel(currentLevel);
  const xpInCurrentLevel = currentXP - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;

  return (xpInCurrentLevel / xpNeededForLevel) * 100;
}

/**
 * Award XP to user
 */
export async function awardXP(
  userId: string,
  xpAmount: number,
  reason: string
): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
  // Get current progress
  const { data: progress } = await getSupabase()
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!progress) {
    throw new Error('User progress not found');
  }

  const oldLevel = progress.level;
  const newXP = progress.xp + xpAmount;
  const newLevel = calculateLevel(newXP);
  const leveledUp = newLevel > oldLevel;

  // Update progress
  await getSupabase()
    .from('user_progress')
    .update({
      xp: newXP,
      level: newLevel,
    })
    .eq('user_id', userId);

  console.log(`Awarded ${xpAmount} XP to user ${userId} for: ${reason}`);

  return { newXP, newLevel, leveledUp };
}

/**
 * Update daily streak
 */
export async function updateStreak(userId: string): Promise<{
  streak: number;
  streakMaintained: boolean;
  xpAwarded: number;
}> {
  const { data: progress } = await getSupabase()
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!progress) {
    throw new Error('User progress not found');
  }

  const today = new Date().toDateString();
  const lastActive = new Date(progress.last_active_date).toDateString();

  const daysDiff = getDaysDifference(lastActive, today);

  let newStreak = progress.streak;
  let streakMaintained = false;
  let xpAwarded = 0;

  if (daysDiff === 0) {
    // Same day, no change
    streakMaintained = true;
    newStreak = progress.streak;
  } else if (daysDiff === 1) {
    // Consecutive day, increment streak
    newStreak = progress.streak + 1;
    streakMaintained = true;
    xpAwarded = XP_REWARDS.DAILY_STREAK;

    // Award XP for streak
    await awardXP(userId, xpAwarded, 'Daily streak');

    // Check for week streak bonus
    if (newStreak % 7 === 0) {
      await awardXP(userId, XP_REWARDS.WEEK_STREAK, 'Week streak bonus');
      xpAwarded += XP_REWARDS.WEEK_STREAK;
    }
  } else {
    // Streak broken
    newStreak = 1;
    streakMaintained = false;
  }

  // Update streak and last active date
  await getSupabase()
    .from('user_progress')
    .update({
      streak: newStreak,
      last_active_date: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return { streak: newStreak, streakMaintained, xpAwarded };
}

/**
 * Calculate days difference between two dates
 */
function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check and award achievements
 */
export async function checkAchievements(userId: string): Promise<Achievement[]> {
  // Get user progress and stats
  const { data: progress } = await getSupabase()
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: stats } = await getSupabase()
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!progress || !stats) {
    return [];
  }

  // Get already unlocked achievements
  const { data: unlocked } = await getSupabase()
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const unlockedIds = new Set(unlocked?.map((a: any) => a.achievement_id) || []);

  const newAchievements: Achievement[] = [];

  // Define achievement criteria
  const achievementChecks = [
    {
      id: 'first_session',
      name: 'Getting Started',
      description: 'Completed your first tutoring session',
      icon: '🎓',
      xp_reward: 50,
      condition: stats.total_sessions >= 1,
    },
    {
      id: 'active_learner',
      name: 'Active Learner',
      description: 'Completed 10 tutoring sessions',
      icon: '📚',
      xp_reward: 100,
      condition: stats.total_sessions >= 10,
    },
    {
      id: 'curious_mind',
      name: 'Curious Mind',
      description: 'Asked 50 questions',
      icon: '❓',
      xp_reward: 100,
      condition: stats.total_questions >= 50,
    },
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: '7-day learning streak',
      icon: '🔥',
      xp_reward: 150,
      condition: progress.streak >= 7,
    },
    {
      id: 'month_master',
      name: 'Month Master',
      description: '30-day learning streak',
      icon: '⚡',
      xp_reward: 500,
      condition: progress.streak >= 30,
    },
    {
      id: 'knowledge_seeker',
      name: 'Knowledge Seeker',
      description: 'Mastered 10 topics',
      icon: '🌟',
      xp_reward: 200,
      condition: stats.topics_completed >= 10,
    },
    {
      id: 'dedicated_student',
      name: 'Dedicated Student',
      description: 'Studied for 10 hours total',
      icon: '⏰',
      xp_reward: 300,
      condition: stats.study_time >= 600, // 10 hours
    },
    {
      id: 'level_10',
      name: 'Level 10 Scholar',
      description: 'Reached level 10',
      icon: '🏆',
      xp_reward: 500,
      condition: progress.level >= 10,
    },
  ];

  // Check each achievement
  for (const achievement of achievementChecks) {
    if (achievement.condition && !unlockedIds.has(achievement.id)) {
      // Award achievement
      await getSupabase().from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievement.id,
      });

      // Award XP
      await awardXP(userId, achievement.xp_reward, `Achievement: ${achievement.name}`);

      newAchievements.push({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        xp_reward: achievement.xp_reward,
      });
    }
  }

  return newAchievements;
}

/**
 * Initialize user progress and stats
 */
export async function initializeUserProgress(userId: string): Promise<void> {
  // Create user_progress
  await getSupabase().from('user_progress').insert({
    user_id: userId,
    level: 1,
    xp: 0,
    streak: 0,
    last_active_date: new Date().toISOString(),
  });

  // Create user_stats
  await getSupabase().from('user_stats').insert({
    user_id: userId,
    total_sessions: 0,
    total_questions: 0,
    topics_completed: 0,
    study_time: 0,
  });

  // Award first login XP
  await awardXP(userId, XP_REWARDS.FIRST_LOGIN, 'First login');
}

/**
 * Update user stats
 */
export async function updateStats(
  userId: string,
  statUpdate: Partial<{
    total_sessions: number;
    total_questions: number;
    topics_completed: number;
    study_time: number;
  }>
): Promise<void> {
  const { data: currentStats } = await getSupabase()
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!currentStats) {
    throw new Error('User stats not found');
  }

  const updatedStats = {
    total_sessions: currentStats.total_sessions + (statUpdate.total_sessions || 0),
    total_questions: currentStats.total_questions + (statUpdate.total_questions || 0),
    topics_completed: currentStats.topics_completed + (statUpdate.topics_completed || 0),
    study_time: currentStats.study_time + (statUpdate.study_time || 0),
    updated_at: new Date().toISOString(),
  };

  await getSupabase()
    .from('user_stats')
    .update(updatedStats)
    .eq('user_id', userId);
}
