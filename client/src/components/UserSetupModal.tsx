import React, { useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@client/src/components/ui/dialog';
import { Input } from '@client/src/components/ui/input';
import { Button } from '@client/src/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@client/src/components/ui/avatar';
import { useUser, generateUserId } from '@client/src/hooks/useUser';
import { toast } from '@client/src/components/ui/sonner';
import { avatarImg1, avatarImg2, avatarImg3, avatarImg4, avatarImg5, avatarImg6, avatarImg7, avatarImg8, avatarImg9, avatarImg10, avatarImg11 } from '@client/src/utils/img-resources/avatar-placeholders';

const AVATAR_OPTIONS = [avatarImg1, avatarImg2, avatarImg3, avatarImg4, avatarImg5, avatarImg6, avatarImg7, avatarImg8, avatarImg9, avatarImg10, avatarImg11];

interface UserSetupModalProps { open: boolean; onOpenChange: (open: boolean) => void; }

export function UserSetupModal({ open, onOpenChange }: UserSetupModalProps) {
  const { user, setUser } = useUser();
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (open) { setNickname(user?.nickname || ''); setAvatarUrl(user?.avatarUrl || AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]); } }, [open, user]);

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) { toast.error('请输入昵称'); return; }
    if (trimmed.length > 20) { toast.error('昵称不能超过20个字符'); return; }
    setSubmitting(true);
    try {
      const userId = user?.userId || generateUserId();
      setUser({ userId, nickname: trimmed, avatarUrl });
      toast.success(user ? '资料已更新' : '欢迎加入打卡广场');
      onOpenChange(false);
    } catch (error: unknown) { logger.error('UserSetupModal submit failed', error); toast.error('保存失败，请重试'); } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? '编辑资料' : '设置你的昵称'}</DialogTitle>
          <DialogDescription>选择一个头像和昵称，开始你的打卡之旅。无需注册，数据保存在本地。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-center">
            <Avatar className="h-16 w-16"><AvatarImage src={avatarUrl} alt="头像预览" /><AvatarFallback>{nickname.slice(0, 1) || '?'}</AvatarFallback></Avatar>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_OPTIONS.map((url) => (
              <button key={url} type="button" onClick={() => setAvatarUrl(url)} className={`rounded-full p-0.5 transition-all ${avatarUrl === url ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-muted'}`}>
                <Avatar className="h-8 w-8"><AvatarImage src={url} alt="头像" /><AvatarFallback>?</AvatarFallback></Avatar>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <label htmlFor="nickname-input" className="text-sm font-medium">昵称</label>
            <Input id="nickname-input" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="输入你的昵称" maxLength={20} onKeyDown={(e) => { if (e.key === 'Enter') { void handleSubmit(); } }} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          {user && <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>}
          <Button onClick={() => void handleSubmit()} disabled={submitting}>{submitting ? '保存中...' : '确认'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
