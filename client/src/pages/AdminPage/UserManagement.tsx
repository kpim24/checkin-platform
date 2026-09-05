import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Trash2,
  Shield,
  ShieldOff,
  Users as UsersIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { usersApi } from '@client/src/api';
import { useUser } from '@client/src/hooks/useUser';
import type { UserProfile, PagedResponse } from '@shared/api.interface';
import PaginationFooter, { LoadingSpinner } from './PaginationFooter';
import type { ConfirmState } from './admin.types';
import { Image } from '@client/src/components/ui/image';

const PRIMARY_COLOR = '#7c3aed';
const PAGE_SIZE = 20;

interface UserManagementProps {
  profile: UserProfile | null;
  onConfirmChange: (state: ConfirmState) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
  onConfirmChange,
}) => {
  const { user } = useUser();
  const currentUserId = user?.userId ?? '';
  const [usersData, setUsersData] = useState<PagedResponse<UserProfile> | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');

  const loadUsers = async (p: number): Promise<void> => {
    setLoading(true);
    try {
      const data: PagedResponse<UserProfile> = await usersApi.listUsers(
        p,
        PAGE_SIZE,
      );
      setUsersData(data);
      setPage(p);
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      logger.error('UserManagement loadUsers failed', e);
      toast.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    if (!usersData) return [];
    if (!search.trim()) return usersData.items;
    const keyword = search.trim().toLowerCase();
    return usersData.items.filter((u: UserProfile) =>
      u.nickname.toLowerCase().includes(keyword),
    );
  }, [usersData, search]);

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${mo}-${da} ${h}:${mi}`;
  };

  const handleRoleChange = (user: UserProfile, newRole: 'admin' | 'user'): void => {
    onConfirmChange({
      show: true,
      title: newRole === 'admin' ? '设为管理员' : '设为普通用户',
      description: `确定将用户"${user.nickname}"${newRole === 'admin' ? '提升为管理员' : '降级为普通用户'}？`,
      confirmText: '确认',
      variant: 'default',
      onConfirm: async () => {
        try {
          await usersApi.updateUserRole(user.userId, newRole);
          toast.success('角色更新成功');
          await loadUsers(page);
        } catch (err: unknown) {
          const e = err instanceof Error ? err : new Error(String(err));
          logger.error('UserManagement updateRole failed', e);
          toast.error('角色更新失败');
        }
      },
    });
  };

  const handleDelete = (user: UserProfile): void => {
    onConfirmChange({
      show: true,
      title: '删除用户',
      description: `确定删除用户"${user.nickname}"？该用户的所有签到记录和聊天消息将被一并删除，此操作不可恢复。`,
      confirmText: '删除',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await usersApi.deleteUser(user.userId);
          toast.success('用户已删除');
          await loadUsers(page);
        } catch (err: unknown) {
          const e = err instanceof Error ? err : new Error(String(err));
          logger.error('UserManagement deleteUser failed', e);
          toast.error('删除用户失败');
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="按昵称搜索用户..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        {loading && <LoadingSpinner label="加载用户列表..." />}

        {!loading && filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UsersIcon className="w-12 h-12 mb-3" />
            <span>暂无数据</span>
          </div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-left">
                    <th className="px-4 py-3 font-medium rounded-l-lg">用户</th>
                    <th className="px-4 py-3 font-medium">角色</th>
                    <th className="px-4 py-3 font-medium">累计打卡</th>
                    <th className="px-4 py-3 font-medium">连续打卡</th>
                    <th className="px-4 py-3 font-medium">注册时间</th>
                    <th className="px-4 py-3 font-medium rounded-r-lg text-right">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: UserProfile) => {
                     const isSelf = user.userId === currentUserId;
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <Image
                                src={user.avatarUrl}
                                alt={user.nickname}
                                className="w-9 h-9 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                style={{
                                  background: `linear-gradient(135deg, ${PRIMARY_COLOR}, #5b21b6)`,
                                }}
                              >
                                {user.nickname.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-800">
                                {user.nickname}
                              </span>
                              <span className="text-xs text-gray-400">
                                {user.userId.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {user.role === 'admin' ? '管理员' : '普通用户'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {user.totalCheckins} 天
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {user.currentStreak} 天
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {user.role === 'user' ? (
                              <button
                                type="button"
                                onClick={() => handleRoleChange(user, 'admin')}
                                disabled={isSelf}
                                title={isSelf ? '不能修改自己的角色' : '设为管理员'}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                  isSelf
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                }`}
                              >
                                <Shield className="w-3.5 h-3.5" />
                                设为管理员
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRoleChange(user, 'user')}
                                disabled={isSelf}
                                title={isSelf ? '不能修改自己的角色' : '设为普通用户'}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                  isSelf
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                <ShieldOff className="w-3.5 h-3.5" />
                                取消管理员
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              disabled={isSelf}
                              title={isSelf ? '不能删除自己' : '删除用户'}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                                isSelf
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-50 text-red-500 hover:bg-red-100'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationFooter
              total={usersData?.total ?? 0}
              page={page}
              pageSize={PAGE_SIZE}
              loading={loading}
              onPageChange={(p) => void loadUsers(p)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
