import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { UserProfile } from '@shared/api.interface';
import { usersApi } from '@client/src/api';
import { STORAGE_USER_KEY, STORAGE_ADMIN_KEY, type CheckinLocalUser } from '@client/src/api';

export interface LocalUser { userId: string; nickname: string; avatarUrl: string; }
export function readLocalUser(): LocalUser | null {
  try { const raw = localStorage.getItem(STORAGE_USER_KEY); if (!raw) return null; const parsed = JSON.parse(raw) as CheckinLocalUser; if (!parsed.userId || !parsed.nickname) return null; return { userId: parsed.userId, nickname: parsed.nickname, avatarUrl: parsed.avatarUrl || '' }; } catch (e: unknown) { logger.error('readLocalUser failed', e); return null; }
}
export function writeLocalUser(user: LocalUser): void { try { localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user)); } catch (e: unknown) { logger.error('writeLocalUser failed', e); } }
export function clearLocalUser(): void { try { localStorage.removeItem(STORAGE_USER_KEY); } catch (e: unknown) { logger.error('clearLocalUser failed', e); } }
export function readAdminToken(): string | null { try { return localStorage.getItem(STORAGE_ADMIN_KEY); } catch (e: unknown) { logger.error('readAdminToken failed', e); return null; } }
export function writeAdminToken(token: string): void { try { localStorage.setItem(STORAGE_ADMIN_KEY, token); } catch (e: unknown) { logger.error('writeAdminToken failed', e); } }
export function clearAdminToken(): void { try { localStorage.removeItem(STORAGE_ADMIN_KEY); } catch (e: unknown) { logger.error('clearAdminToken failed', e); } }
export function generateUserId(): string { return crypto.randomUUID(); }
export interface UseUserResult { user: LocalUser | null; profile: UserProfile | null; loading: boolean; error: Error | null; isAdmin: boolean; setUser: (u: LocalUser) => void; logout: () => void; refreshProfile: () => Promise<void>; ensureSetup: () => boolean; enterAdmin: (token: string) => void; exitAdmin: () => void; }
export const useUser = (): UseUserResult => {
  const [user, setUserState] = useState<LocalUser | null>(() => readLocalUser());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => !!readAdminToken());
  const profileFetchedRef = useRef<boolean>(false);
  const fetchProfile = useCallback(async () => {
    const local = readLocalUser(); if (!local) { setLoading(false); return; }
    setLoading(true); setError(null);
    try { const result = await usersApi.getProfile(); setProfile(result); } catch (err: unknown) { const e = err instanceof Error ? err : new Error(String(err)); logger.error('useUser fetch profile failed', e); setError(e); } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (user && !profileFetchedRef.current) { profileFetchedRef.current = true; void fetchProfile(); } if (!user) { setLoading(false); } }, [user, fetchProfile]);
  const setUser = useCallback((u: LocalUser) => { writeLocalUser(u); setUserState(u); profileFetchedRef.current = false; }, []);
  const logout = useCallback(() => { clearLocalUser(); clearAdminToken(); setUserState(null); setProfile(null); setIsAdmin(false); profileFetchedRef.current = false; }, []);
  const refreshProfile = useCallback(async () => { if (!readLocalUser()) return; setLoading(true); setError(null); try { const result = await usersApi.getProfile(); setProfile(result); } catch (err: unknown) { const e = err instanceof Error ? err : new Error(String(err)); logger.error('useUser refreshProfile failed', e); setError(e); } finally { setLoading(false); } }, []);
  const ensureSetup = useCallback((): boolean => { const local = readLocalUser(); if (local) { if (!user || user.userId !== local.userId) { setUserState(local); } return true; } return false; }, [user]);
  const enterAdmin = useCallback((token: string) => { writeAdminToken(token); setIsAdmin(true); }, []);
  const exitAdmin = useCallback(() => { clearAdminToken(); setIsAdmin(false); }, []);
  return { user, profile, loading, error, isAdmin, setUser, logout, refreshProfile, ensureSetup, enterAdmin, exitAdmin };
};
