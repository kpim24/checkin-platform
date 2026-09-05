import { X } from 'lucide-react';

const PRIMARY_COLOR = '#7c3aed';
const DANGER_COLOR = '#ef4444';

export interface ConfirmDialogProps {
  show: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

const AdminConfirmDialog: React.FC<ConfirmDialogProps> = ({
  show,
  title,
  description,
  confirmText = '确认',
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <h3
            className="text-lg font-bold"
            style={{ color: variant === 'danger' ? DANGER_COLOR : '#1f2937' }}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {description && (
          <p className="text-sm text-gray-600 mb-6">{description}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{
              backgroundColor: variant === 'danger' ? DANGER_COLOR : PRIMARY_COLOR,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfirmDialog;
