import { useState, useMemo, useEffect } from 'react';
import { Search, Trash2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { chatApi } from '@client/src/api';
import type { ChatMessage, PagedResponse } from '@shared/api.interface';
import PaginationFooter, { LoadingSpinner } from './PaginationFooter';
import type { ConfirmState } from './admin.types';
import { Image } from '@client/src/components/ui/image';

const PRIMARY_COLOR = '#7c3aed';
const PAGE_SIZE = 20;

interface MessageManagementProps {
  onConfirmChange: (state: ConfirmState) => void;
}

const MessageManagement: React.FC<MessageManagementProps> = ({
  onConfirmChange,
}) => {
  const [messagesData, setMessagesData] =
    useState<PagedResponse<ChatMessage> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [expandedMsgId, setExpandedMsgId] = useState<string | null>(null);

  const loadMessages = async (p: number): Promise<void> => {
    setLoading(true);
    try {
      const data: PagedResponse<ChatMessage> = await chatApi.getMessages(
        p,
        PAGE_SIZE,
      );
      setMessagesData(data);
      setPage(p);
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      logger.error('MessageManagement loadMessages failed', e);
      toast.error('加载消息列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMessages = useMemo(() => {
    if (!messagesData) return [];
    if (!search.trim()) return messagesData.items;
    const keyword = search.trim().toLowerCase();
    return messagesData.items.filter((m: ChatMessage) =>
      m.content.toLowerCase().includes(keyword),
    );
  }, [messagesData, search]);

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

  const handleDelete = (msg: ChatMessage): void => {
    onConfirmChange({
      show: true,
      title: '删除消息',
      description: `确定删除"${msg.nickname}"的这条消息？此操作不可恢复。`,
      confirmText: '删除',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await chatApi.deleteMessage(msg.id);
          toast.success('消息已删除');
          await loadMessages(page);
        } catch (err: unknown) {
          const e = err instanceof Error ? err : new Error(String(err));
          logger.error('MessageManagement deleteMessage failed', e);
          toast.error('删除消息失败');
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
            placeholder="按内容关键词搜索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      {/* Message Table */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        {loading && <LoadingSpinner label="加载消息列表..." />}

        {!loading && filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <MessageSquare className="w-12 h-12 mb-3" />
            <span>暂无数据</span>
          </div>
        )}

        {!loading && filteredMessages.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-left">
                    <th className="px-4 py-3 font-medium rounded-l-lg w-56">
                      发送者
                    </th>
                    <th className="px-4 py-3 font-medium">消息内容</th>
                    <th className="px-4 py-3 font-medium w-40">发送时间</th>
                    <th className="px-4 py-3 font-medium rounded-r-lg w-20 text-right">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((msg: ChatMessage) => {
                    const isExpanded = expandedMsgId === msg.id;
                    const shouldTruncate = msg.content.length > 80;
                    return (
                      <tr
                        key={msg.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {msg.avatarUrl ? (
                              <Image
                                src={msg.avatarUrl}
                                alt={msg.nickname}
                                className="w-9 h-9 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                style={{
                                  background: `linear-gradient(135deg, ${PRIMARY_COLOR}, #5b21b6)`,
                                }}
                              >
                                {msg.nickname.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium text-gray-800">
                              {msg.nickname}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="max-w-xl">
                            <p
                              className={`whitespace-pre-wrap break-words ${
                                !isExpanded && shouldTruncate ? 'line-clamp-2' : ''
                              }`}
                            >
                              {msg.content}
                            </p>
                            {shouldTruncate && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedMsgId(isExpanded ? null : msg.id)
                                }
                                className="inline-flex items-center gap-1 mt-1 text-xs font-medium hover:opacity-80"
                                style={{ color: PRIMARY_COLOR }}
                              >
                                {isExpanded ? (
                                  <>
                                    收起
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </>
                                ) : (
                                  <>
                                    展开
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDate(msg.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(msg)}
                            title="删除消息"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationFooter
              total={messagesData?.total ?? 0}
              page={page}
              pageSize={PAGE_SIZE}
              loading={loading}
              onPageChange={(p) => void loadMessages(p)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MessageManagement;
