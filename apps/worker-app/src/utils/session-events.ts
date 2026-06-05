const authTokenRefreshListeners = new Set<() => void>();

export function emitAuthTokenRefreshed() {
  authTokenRefreshListeners.forEach((listener) => {
    listener();
  });
}

export function registerAuthTokenRefreshListener(listener: () => void) {
  authTokenRefreshListeners.add(listener);
  return () => {
    authTokenRefreshListeners.delete(listener);
  };
}
