/**
 * Admin Types
 * 
 * TypeScript interfaces for admin dashboard
 */

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  role?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  paid?: boolean;
  totalTokensUsed?: number;
  ideasAnalyzed?: number;
  ideasBookmarked?: number;
  lastActive?: Date;
}

export interface TokenUsageStats {
  userId: string;
  planTier: 'free' | 'pro';
  totalTokensUsed: number;
  userName?: string;
  userEmail?: string;
}

export interface BookmarkStats {
  userId: string;
  count: number;
  userName?: string;
  userEmail?: string;
}

export interface IdeasAnalytics {
  totalIdeas: number;
  totalBookmarked: number;
  totalValidated: number;
  topUsers: Array<{
    userId: string;
    count: number;
    userName?: string;
  }>;
}

export interface AdminStats {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  totalTokensUsed: number;
  totalIdeas: number;
  totalBookmarks: number;
}

