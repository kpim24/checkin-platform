import React, { useEffect, useState, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@client/src/components/ui/avatar';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { checkinApi } from '@client/src/api';
import { toast } from '@client/src/components/ui/sonner';
import { getLevelTitle, getLevelColor, calcLevel } from '@client/src/utils/level';
import type { LeaderboardItem, PagedResponse } from '@shared/api.interface';

const PAGE_SIZE = 50;

export default function LeaderboardPage() {
  const [data, setData] = useState<PagedResponse<LeaderboardItem> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try { const result = await checkinApi.getLeaderboard(1, PAGE_SIZE); setData(result); } catch (error: unknown) { logger.error('Leaderboard load failed', error); toast.error('加载失败'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  if (loading) { return (<div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-14 w-full" />))}</div>); }

  const items = data?.items || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">签到排行榜</CardTitle></CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-8">暂无数据</p>) : (
            <div className="divide-y">
              {items.map((item, index) => {
                const level = calcLevel(item.totalDays);
                const rankClass = index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground';
                return (
                  <div key={item.userId} className="flex items-center gap-3 px-4 py-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${rankClass}`}>{index + 1}</span>
                    <Avatar className="h-9 w-9"><AvatarImage src={item.avatarUrl} alt={item.nickname} /><AvatarFallback>{item.nickname.slice(0,1)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.nickname}</p>
                      <p className={`text-xs ${getLevelColor(level)}`}>{getLevelTitle(level)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{item.totalDays}天</p>
                      <p className="text-xs text-muted-foreground">连续{item.streak}天</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
