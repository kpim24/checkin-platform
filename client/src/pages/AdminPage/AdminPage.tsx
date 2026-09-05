import { useState, useEffect } from 'react';
import { Users, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { adminApi } from '@client/src/api';
import { useUser } from '@client/src/hooks/useUser';
import UserManagement from './UserManagement';
import MessageManagement from './MessageManagement';
import AdminConfirmDialog from './AdminConfirmDialog';
import type { ConfirmState } from './admin.types';

type TabKey = 'users' | 'messages';

const PRIMARY_COLOR = '#7c3aed';
const DANGER_COLOR = '#ef4444';
const SUCCESS_COLOR = '#10b981';
const ACCENT_COLOR = '#f97316';

const AdminPage: React.FC = () => {
  const { isAdmin } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('users');
  const [stats, setStats] = useState<adminApi.AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [confirm, setConfirm] = useState<ConfirmState>({
    show: false,
    title: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/profile');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    if (stats) return;
    void (async () => {
      setStatsLoading(true);
      try {
        const data: adminApi.AdminStats = await adminApi.getAdminStats();
        setStats(data);
      } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err));
        logger.error('AdminPage loadStats failed', e);
      } finally {
        setStatsLoading(false);
      }
    })();
  }, [isAdmin, stats]);

  const closeConfirm = (): void => {
    setConfirm((prev) => ({ ...prev, show: false }));
  };

  const handleConfirm = (): void => {
    const action = confirm.onConfirm;
    setConfirm((prev) => ({ ...prev, show: false }));
    void action();
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">管理员后台</h1>

      {/* Tabs */}
      <div className="bg-white shadow-sm rounded-xl p-2 mb-6 flex gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-purple-50 text-purple-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>用户管理</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'messages'
              ? 'bg-purple-50 text-purple-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span>消息管理</span>
        </button>
      </div>

      {/* Stats Cards (only on users tab) */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white shadow-sm rounded-xl p-6">
            <div className="text-sm text-gray-500 mb-2">总用户数</div>
            <div className="text-3xl font-bold" style={{ color: PRIMARY_COLOR }}>
              {statsLoading || !stats ? (
                <Loader2 className="w-6 h-6 animate-spin inline" />
              ) : (
                stats.totalUsers
              )}
            </div>
          </div>
          <div className="bg-white shadow-sm rounded-xl p-6">
            <div className="text-sm text-gray-500 mb-2">今日签到</div>
            <div className="text-3xl font-bold" style={{ color: SUCCESS_COLOR }}>
              {statsLoading || !stats ? (
                <Loader2 className="w-6 h-6 animate-spin inline" />
              ) : (
                stats.activeUsersToday
              )}
            </div>
          </div>
          <div className="bg-white shadow-sm rounded-xl p-6">
            <div className="text-sm text-gray-500 mb-2">累计签到次数</div>
            <div className="text-3xl font-bold" style={{ color: ACCENT_COLOR }}>
              {statsLoading || !stats ? (
                <Loader2 className="w-6 h-6 animate-spin inline" />
              ) : (
                stats.totalCheckins
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'users' && (
        <UserManagement
          profile={null}
          onConfirmChange={setConfirm}
        />
      )}
      {activeTab === 'messages' && (
        <MessageManagement onConfirmChange={setConfirm} />
      )}

      {/* Confirm Dialog */}
      <AdminConfirmDialog
        show={confirm.show}
        title={confirm.title}
        description={confirm.description}
        confirmText={confirm.confirmText}
        variant={confirm.variant}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
};

export default AdminPage;
