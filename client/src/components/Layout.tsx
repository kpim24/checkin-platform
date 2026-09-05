import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Button } from '@client/src/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@client/src/components/ui/avatar';
import { useUser } from '@client/src/hooks/useUser';
import { UserSetupModal } from '@client/src/components/UserSetupModal';
import { toast } from '@client/src/components/ui/sonner';

const NAV_ITEMS = [
  { key: 'checkin', label: '签到', path: '/checkin', icon: '✓' },
  { key: 'chat', label: '群聊', path: '/chat', icon: '💬' },
  { key: 'leaderboard', label: '排行榜', path: '/leaderboard', icon: '🏆' },
  { key: 'profile', label: '我的', path: '/profile', icon: '👤' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, ensureSetup } = useUser();
  const [setupOpen, setSetupOpen] = useState(false);
  const [avatarClickTimes, setAvatarClickTimes] = useState<number[]>([]);

  useEffect(() => { if (!ensureSetup()) { setSetupOpen(true); } }, [ensureSetup]);

  const handleAvatarClick = useCallback(() => {
    const now = Date.now();
    const recent = avatarClickTimes.filter((t) => now - t < 1200);
    const next = [...recent, now];
    setAvatarClickTimes(next);
    if (next.length >= 5) {
      setAvatarClickTimes([]);
      navigate('/admin');
      toast.info('已进入隐藏入口');
    }
  }, [avatarClickTimes, navigate]);

  const activeKey = location.pathname.startsWith('/admin') ? 'admin' : NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.key || 'checkin';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">打卡广场</span>
            {isAdmin && <span className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">管理员</span>}
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={handleAvatarClick} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" title="个人中心">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatarUrl || user.avatarUrl} alt={user.nickname} />
                  <AvatarFallback>{user.nickname.slice(0, 1)}</AvatarFallback>
                </Avatar>
              </button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setSetupOpen(true)}>设置昵称</Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background">
        <div className="mx-auto flex h-16 max-w-3xl items-stretch justify-around">
          {NAV_ITEMS.map((item) => (
            <button key={item.key} onClick={() => navigate(item.path)} className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors ${activeKey === item.key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      <UserSetupModal open={setupOpen} onOpenChange={setSetupOpen} />
    </div>
  );
}
