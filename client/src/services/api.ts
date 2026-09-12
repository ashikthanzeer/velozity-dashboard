let accessToken: string | null = localStorage.getItem('velozity_access_token');

export const setStoredAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('velozity_access_token', token);
  } else {
    localStorage.removeItem('velozity_access_token');
  }
};

export const getStoredAccessToken = (): string | null => {
  return accessToken || localStorage.getItem('velozity_access_token');
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const currentToken = getStoredAccessToken();
  if (currentToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  // Ensure cookies (HttpOnly refresh token) are included
  const requestOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;
  let response = await fetch(url, requestOptions);

  // Handle 401 and attempt automatic token refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.data.accessToken;
          setStoredAccessToken(newToken);
          isRefreshing = false;
          onRefreshed(newToken);

          // Retry initial request with new token
          headers.set('Authorization', `Bearer ${newToken}`);
          return apiRequest<T>(endpoint, { ...options, headers });
        } else {
          setStoredAccessToken(null);
          isRefreshing = false;
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      } catch (err) {
        setStoredAccessToken(null);
        isRefreshing = false;
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    } else {
      // Queue requests while refreshing
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh((newToken: string) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          apiRequest<T>(endpoint, { ...options, headers })
            .then(resolve)
            .catch(reject);
        });
      });
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data?.error?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage) as any;
    error.status = response.status;
    error.code = data?.error?.code;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
