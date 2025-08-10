import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, buildApiUrl } from '../constants/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  code?: string;
}

interface ApiError {
  success: false;
  message: string;
  code: string;
  details?: any;
}

class ApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Get stored access token
  private async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@expense_ai_token');
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  // Build headers for API requests
  private async buildHeaders(includeAuth: boolean = false): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      const token = await this.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Generic API request method
  private async request<T = any>(
    endpoint: string,
    options: RequestInit & { includeAuth?: boolean } = {}
  ): Promise<T> {
    const { includeAuth = false, ...fetchOptions } = options;
    const url = buildApiUrl(endpoint);

    const config: RequestInit = {
      ...fetchOptions,
      headers: {
        ...(await this.buildHeaders(includeAuth)),
        ...fetchOptions.headers,
      },
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (!response.ok) {
        const error: ApiError = responseData;
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }

      throw new Error('Unknown error occurred');
    }
  }

  // GET request
  async get<T = any>(endpoint: string, includeAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      includeAuth,
    });
  }

  // POST request
  async post<T = any>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      includeAuth,
    });
  }

  // PUT request
  async put<T = any>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      includeAuth,
    });
  }

  // DELETE request
  async delete<T = any>(endpoint: string, includeAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      includeAuth,
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.get('/health');
  }
}

export const apiService = new ApiService();
export default apiService;