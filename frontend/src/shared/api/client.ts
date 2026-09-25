import axios, { AxiosError } from 'axios';

export class ApiError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

// Pluggable auth token getter.
// This will be overridden by the respective admin/tenant auth contexts.
let getAuthToken: () => string | null = () => null;

export const setAuthTokenGetter = (getter: () => string | null) => {
  getAuthToken = getter;
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response && error.response.data) {
      const { statusCode, message } = error.response.data;
      if (statusCode && message) {
        throw new ApiError(statusCode, message);
      }
    }
    throw error;
  }
);

export default apiClient;
