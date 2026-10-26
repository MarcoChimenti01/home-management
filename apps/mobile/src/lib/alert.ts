// Notifiche a comparsa (toast). Si possono chiamare da qualsiasi punto del codice:
// il componente <ToastHost /> nel layout principale le mostra.
export type ToastKind = 'error' | 'info';
export type Toast = { id: number; kind: ToastKind; message: string };

type Listener = (toast: Toast) => void;
const listeners = new Set<Listener>();
let nextId = 1;

function push(kind: ToastKind, message: string) {
  const toast: Toast = { id: nextId++, kind, message };
  listeners.forEach((l) => l(toast));
}

export const showError = (message: string) => push('error', message);
export const showInfo = (message: string) => push('info', message);

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
