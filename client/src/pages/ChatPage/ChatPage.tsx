import React, { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Card } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@client/src/components/ui/avatar';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { chatApi } from '@client/src/api';
import { useUser } from '@client/src/hooks/useUser';
import { toast } from '@client/src/components/ui/sonner';
import type { ChatMessage, PagedResponse } from '@shared/api.interface';

const PAGE_SIZE = 50;

export default function ChatPage() {
  const { user, ensureSetup } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, []);

  const loadMessages = useCallback(async (page: number, append: boolean = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const result: PagedResponse<ChatMessage> = await chatApi.getMessages(page, PAGE_SIZE);
      const sorted = [...result.items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages((prev) => append ? [...sorted, ...prev] : sorted);
      setHasMore(result.page < result.totalPages);
      if (!append) setTimeout(scrollToBottom, 100);
    } catch (error: unknown) { logger.error('ChatPage loadMessages failed', error); toast.error('加载消息失败'); } finally { setLoading(false); setLoadingMore(false); }
  }, [scrollToBottom]);

  useEffect(() => { if (ensureSetup()) { void loadMessages(1); } }, [ensureSetup, loadMessages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!user) { toast.error('请先设置昵称'); return; }
    setSending(true);
    try {
      const msg = await chatApi.sendMessage(trimmed);
      setMessages((prev) => [...prev, msg]);
      setInput('');
      setTimeout(scrollToBottom, 50);
    } catch (error: unknown) { logger.error('sendMessage failed', error); toast.error('发送失败'); } finally { setSending(false); }
  };

  const formatTime = (dateStr: string) => { const d = new Date(dateStr); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };

  if (loading) { return (<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="flex gap-2"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-48" /></div></div>))}</div>); }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
        {hasMore && (<div className="text-center"><Button variant="ghost" size="sm" onClick={() => void loadMessages(Math.ceil(messages.length / PAGE_SIZE) + 1, true)} disabled={loadingMore}>{loadingMore ? '加载中...' : '加载更多'}</Button></div>)}
        {messages.length === 0 && (<p className="text-center text-sm text-muted-foreground py-8">还没有消息，来说点什么吧</p>)}
        {messages.map((msg) => {
          const isOwn = user?.userId === msg.userId;
          return (
            <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
              <Avatar className="h-9 w-9 shrink-0"><AvatarImage src={msg.avatarUrl} alt={msg.nickname} /><AvatarFallback>{msg.nickname.slice(0,1)}</AvatarFallback></Avatar>
              <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`flex items-center gap-2 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs text-muted-foreground">{msg.nickname}</span>
                  <span className="text-[10px] text-muted-foreground/60">{formatTime(msg.createdAt)}</span>
                </div>
                <Card className={`px-3 py-2 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                </Card>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="sticky bottom-0 flex gap-2 pt-2 bg-background">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入消息..." maxLength={500} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }} />
        <Button onClick={() => void handleSend()} disabled={sending || !input.trim()}>{sending ? '发送中' : '发送'}</Button>
      </div>
    </div>
  );
}
