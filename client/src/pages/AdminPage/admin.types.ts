export interface ConfirmState {
  show: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void | Promise<void>;
}
