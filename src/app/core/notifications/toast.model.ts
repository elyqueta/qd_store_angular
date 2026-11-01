export type ToastKind = 'success' | 'error' | 'warning';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}
