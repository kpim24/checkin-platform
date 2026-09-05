import React, { useEffect, useState, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { checkinApi } from '@client/src/api';
import { useUser } from '@client/src/hooks/useUser';
import { toast } from '@client/src/components/ui/sonner';
import { todayStr, getMonthDays } from '@client/src/utils/date';
import { calcLevel, getLevelTitle, getLevelColor } from '@client/src/utils/level';
import type { CheckinStatus, CalendarHeatmapItem, LeaderboardItem } from '@shared/api.interface';

export default function CheckinPage() {
  const { user, profile, ensureSetup } = useUser();
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [calendar, setCalendar] = useState<CalendarHeatmapItem[]>([]);
  const [todayUsers, setTodayUsers] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthDays = getMonthDays(currentYear, currentMonth);

  const loadData = useCallback(async () => {
    if (!ensureSetup()) { setLoading(false); return; }
    setLoading(true);
    try {
      const [statusRes, calendarRes, todayRes] = await Promise.all([
        checkinApi.getCheckinStatus(),
        checkinApi.getCalendar(currentYear, currentMonth),
        checkinApi.getTodayUsers(),
      ]);
      setStatus(statusRes);
      setCalendar(calendarRes.items);
      setTodayUsers(todayRes.users);
    } catch (error: unknown) { logger.error('CheckinPage load failed', error); toast.error('加载失败，请刷新重试'); } finally { setLoading(false); }
  }, [ensureSetup, currentYear, currentMonth]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleCheckin = async () => {
    if (!user) { toast.error('请先设置昵称'); return; }
    setCheckingIn(true);
    try {
      const result = await checkinApi.checkin();
      if (result.success) { toast.success('签到成功！'); setStatus(result.status); void loadData(); } else { toast.error('签到失败'); }
    } catch (error: unknown) { logger.error('checkin failed', error); toast.error('签到失败，请重试'); } finally { setCheckingIn(false); }
  };

  const checkedDates = new Set(calendar.map((c) => c.date));
  const level = calcLevel(status?.totalDays || profile?.totalCheckins || 0);

  if (loading) { return (<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>); }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">今日签到</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{todayStr()}</p>
              <p className="text-sm text-muted-foreground mt-1">{status?.checkedToday ? '今日已签到' : '今日未签到'}</p>
            </div>
            <Button size="lg" onClick={() => void handleCheckin()} disabled={checkingIn || status?.checkedToday}>{status?.checkedToday ? '已签到' : checkingIn ? '签到中...' : '立即签到'}</Button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted p-2"><p className="text-xl font-bold">{status?.streak || 0}</p><p className="text-xs text-muted-foreground">连续天数</p></div>
            <div className="rounded-lg bg-muted p-2"><p className="text-xl font-bold">{status?.totalDays || 0}</p><p className="text-xs text-muted-foreground">累计天数</p></div>
            <div className="rounded-lg bg-muted p-2"><p className={`text-xl font-bold ${getLevelColor(level)}`}>Lv.{level}</p><p className="text-xs text-muted-foreground">{getLevelTitle(level)}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{currentYear}年{currentMonth}月签到日历</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {['日','一','二','三','四','五','六'].map((d) => (<div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>))}
            {monthDays.map((date) => {
              const day = parseInt(date.split('-')[2], 10);
              const checked = checkedDates.has(date);
              const isToday = date === todayStr();
              return (<div key={date} className={`aspect-square flex items-center justify-center rounded-md text-sm ${checked ? 'bg-primary text-primary-foreground font-medium' : isToday ? 'ring-1 ring-primary text-primary' : 'text-muted-foreground'}`}>{day}</div>);
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">今日已签到 ({todayUsers.length}人)</CardTitle></CardHeader>
        <CardContent>
          {todayUsers.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-4">还没有人签到，快来第一个吧！</p>) : (
            <div className="flex flex-wrap gap-2">
              {todayUsers.map((u) => (
                <Badge key={u.userId} variant="secondary" className="gap-1">
                  <span className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">{u.nickname.slice(0,1)}</span>
                  {u.nickname}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
