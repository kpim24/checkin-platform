import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface PaginationFooterProps {
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

const PRIMARY_COLOR = '#7c3aed';

const PaginationFooter: React.FC<PaginationFooterProps> = ({
  total,
  page,
  pageSize,
  loading,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
      <span className="text-sm text-gray-500">
        共 {total} 条，第 {page}/{totalPages} 页
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          上一页
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          下一页
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = '加载中...',
}) => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="w-7 h-7 animate-spin" style={{ color: PRIMARY_COLOR }} />
    <span className="ml-3 text-gray-500">{label}</span>
  </div>
);

export default PaginationFooter;
