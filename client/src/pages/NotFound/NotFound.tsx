import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@client/src/components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground">页面不存在</p>
      <Button onClick={() => navigate('/')}>返回首页</Button>
    </div>
  );
}
