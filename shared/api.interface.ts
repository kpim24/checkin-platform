export interface UserProfile {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl: string;
  role: 'admin' | 'user';
  totalCheckins: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  lastCheckinDate: string | null;
  createdAt: string;
}

export interface CheckinRecord {
  id: string;
  userId: string;
  checkinDate: string;
  isMakeup: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl: string;
  content: string;
  createdAt: string;
}

export interface CheckinStatus {
  todayChecked: boolean;
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  level: number;
  makeupAvailable: number;
}

export interface LeaderboardItem {
  userId: string;
  nickname: string;
  avatarUrl: string;
  totalCheckins: number;
  currentStreak: number;
  rank: number;
}

export interface CalendarHeatmapItem {
  date: string;
  checked: boolean;
  isMakeup: boolean;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminLoginResponse {
  token: string;
}

export interface AdminSecretResponse {
  secretToken: string;
  message?: string;
}
