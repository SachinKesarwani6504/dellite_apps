type Listener = () => void;

const listeners = new Set<Listener>();
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function subscribeNotificationHistoryRefresh(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function requestNotificationHistoryRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    listeners.forEach(listener => listener());
  }, 300);
}
