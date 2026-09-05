import React, { useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@client/src/components/ui/avatar';
import { Badge } from '@client/src/components/ui/badge';
import { useUser } from '@client/src/hooks/useUser';
import { UserSetupModal } from '@client/src/components/UserSetupModal';
import { toast } from '@client/src/components/ui/sonner';
import { calcLevel, getLevelTitle, getLevelColor } from '@client/src/utils/level';

export default function ProfilePage() {
  const { user, profile, isAdmin, logout, refreshProfile } = useUser();
  const [editOpen, setEditOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const level = calcLevel(profile?.totalCheckins || 0);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refreshProfile(); toast.success('已刷新'); } catch (error: unknown) { logger.error('refresh failed', error); } finally { setRefreshing(false); }
  };

  const handleLogout = () => { logout(); toast.success('已退出，可重新设置昵称'); };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16"><AvatarImage src={profile?.avatarUrl || user?.avatarUrl} alt={user?.nickname} /><AvatarFallback>{user?.nickname?.slice(0,1) || '?'}</AvatarFallback></Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{user?.nickname || '未设置'}</h2>
                {isAdmin && <Badge>管理员</Badge>}
              </div>
              <p className={`text-sm ${getLevelColor(level)}`}>Lv.{level} {getLevelTitle(level)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>编辑</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">我的数据</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted p-3 text-center"><p className="text-2xl font-bold">{profile?.totalCheckins || 0}</p><p className="text-xs text-muted-foreground">累计签到</p></div>
            <div className="rounded-lg bg-muted p-3 text-center"><p className="text-2xl font-bold">{profile?.currentStreak || 0}</p><p className="text-xs text-muted-foreground">连续天数</p></div>
            <div className="rounded-lg bg-muted p-3 text-center"><p className="text-2xl font-bold">{profile?.messageCount || 0}</p><p className="text-xs text-muted-foreground">发言数</p></div>
            <div className="rounded-lg bg-muted p-3 text-center"><p className="text-2xl font-bold">{profile?.longestStreak || 0}</p><p className="text-xs text-muted-foreground">最长连续</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 pt-4">
          <Button variant="ghost" className="w-full justify-start" onClick={() => void handleRefresh()} disabled={refreshing}>{refreshing ? '刷新中...' : '刷新数据'}</Button>
          <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>清除本地身份</Button>
        </CardContent>
      </Card>

      <UserSetupModal open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
