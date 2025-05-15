import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Interceptor, TokenConfig } from './interface/Property';

interface TokenRefreshResult {
  accessToken: string;
  refreshToken: string;
}

interface TokenHandlerContext {
  axiosInstance: AxiosInstance;
  config: TokenConfig;
}

const createAuthHeaders = (context: TokenHandlerContext, token: string, refreshToken?: string) => {
  const { config } = context;
  return config.formatAuthHeader
    ? config.formatAuthHeader(token, refreshToken)
    : {
      Authorization: `Bearer ${token}`,
      refresh: refreshToken,
    };
};

const shouldAttemptRefresh = (context: TokenHandlerContext, error: any): boolean => {
  const { config } = context;
  const originalConfig = error.config;
  return (
    error.response?.status === 401 &&
    !originalConfig._retry &&
    originalConfig.url !== config.accessEndpoint &&
    !!config.getRefreshToken &&
    !!config.getToken
  );
};

interface TokenRefreshManager {
  isRefreshing: boolean;
  waitQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }>;
}

const tokenRefreshManager: TokenRefreshManager = {
  isRefreshing: false,
  waitQueue: [],
};

const performTokenRefresh = async (context: TokenHandlerContext): Promise<TokenRefreshResult> => {
  const { axiosInstance, config } = context;
  const refreshToken = config.getRefreshToken?.();
  const token = config.getToken?.();
  if (!refreshToken || !token || !config.refreshEndpoint) {
    throw new Error('Missing refresh configuration');
  }
  const response = await axiosInstance.post(
    config.refreshEndpoint,
    {},
    { headers: createAuthHeaders(context, token, refreshToken) }
  );
  return response.data?.data;
};

const handleTokenRefresh = async (context: TokenHandlerContext, error: any) => {
  if (!shouldAttemptRefresh(context, error)) {
    return Promise.reject(error);
  }

  const { axiosInstance, config } = context;
  const originalConfig = error.config;
  originalConfig._retry = true;

  if (tokenRefreshManager.isRefreshing) {
    return new Promise((resolve, reject) => {
      tokenRefreshManager.waitQueue.push({ resolve, reject });
    });
  }

  tokenRefreshManager.isRefreshing = true;

  try {
    const { accessToken, refreshToken } = await performTokenRefresh(context);
    config.setToken?.(accessToken);
    config.setRefreshToken?.(refreshToken);

    tokenRefreshManager.waitQueue.forEach(({ resolve }) => {
      resolve(axiosInstance(originalConfig));
    });

    return axiosInstance(originalConfig);
  } catch (error) {
    config.removeToken?.();
    config.removeRefreshToken?.();
    config.onTokenExpired?.();

    tokenRefreshManager.waitQueue.forEach(({ reject }) => {
      reject(error);
    });

    return Promise.reject(error);
  } finally {
    tokenRefreshManager.isRefreshing = false;
    tokenRefreshManager.waitQueue = [];
  }
};

interface RequestContext {
  axiosInstance: AxiosInstance;
  interceptor?: Interceptor;
}

const handleRequest = async (context: RequestContext, config: AxiosRequestConfig) => {
  const { interceptor } = context;
  if (interceptor?.onRequest) return interceptor.onRequest(config);
  if (interceptor?.tokenConfig?.getToken) {
    const token = interceptor.tokenConfig.getToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
};

const handleResponse = async (context: RequestContext, response: AxiosResponse) => {
  const { interceptor } = context;
  return interceptor?.onResponse ? interceptor.onResponse(response) : response;
};

const handleResponseError = async (context: RequestContext, error: any) => {
  const { axiosInstance, interceptor } = context;
  if (interceptor?.onError) return interceptor.onError(error);
  if (interceptor?.tokenConfig) return handleTokenRefresh({ axiosInstance, config: interceptor.tokenConfig }, error);
  return Promise.reject(error);
};

export const setupInterceptors = (axiosInstance: AxiosInstance, interceptor?: Interceptor): void => {
  const context: RequestContext = { axiosInstance, interceptor };
  axiosInstance.interceptors.request.use(
    (config) => handleRequest(context, config),
    (error) => Promise.reject(error)
  );
  axiosInstance.interceptors.response.use(
    (response) => handleResponse(context, response),
    (error) => handleResponseError(context, error)
  );
};
