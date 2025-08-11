import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, API_ENDPOINTS, buildApiUrl } from '../constants/api';
import {
  AnalyticsScreenQuery,
  AnalyticsScreenResponse,
  ApiError,
  ApiResponse,
  Category,
  CreateCategoryRequest,
  CreateExpenseRequest,
  DashboardScreenQuery,
  DashboardScreenResponse,
  Expense,
  ExpensesScreenQuery,
  ExpensesScreenResponse,
  ExpensesScreenData,
  GetCategories,
  ProcessReceiptRequest,
  ProcessReceiptResponse,
  UpdateCategoryRequest,
  UpdateExpenseRequest,
  UpdateProfileRequest,
  DashboardScreenData,
} from '../types';

const url = buildApiUrl(API_ENDPOINTS.AUTH_SIGNUP);
console.log({ url, baseURL: API_CONFIG.BASE_URL });

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
      Accept: 'application/json',
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
      console.log('request', url);
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
  async post<T = any>(endpoint: string, data?: any, includeAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      includeAuth,
    });
  }

  // PUT request
  async put<T = any>(endpoint: string, data?: any, includeAuth: boolean = false): Promise<T> {
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

  // Screen-centric endpoints
  async getDashboardData(query?: DashboardScreenQuery): Promise<ApiResponse<DashboardScreenData>> {
    const queryString = query ? new URLSearchParams(query as any).toString() : '';
    const endpoint = queryString
      ? `${API_ENDPOINTS.SCREEN_DASHBOARD}?${queryString}`
      : API_ENDPOINTS.SCREEN_DASHBOARD;
    return this.get(endpoint, true);
  }

  async getExpensesData(query?: ExpensesScreenQuery): Promise<ApiResponse<ExpensesScreenData>> {
    const queryString = query ? new URLSearchParams(query as any).toString() : '';
    const endpoint = queryString
      ? `${API_ENDPOINTS.SCREEN_EXPENSES}?${queryString}`
      : API_ENDPOINTS.SCREEN_EXPENSES;
    return this.get(endpoint, true);
  }

  async getAnalyticsData(
    query?: AnalyticsScreenQuery
  ): Promise<ApiResponse<AnalyticsScreenResponse>> {
    const queryString = query ? new URLSearchParams(query as any).toString() : '';
    const endpoint = queryString
      ? `${API_ENDPOINTS.SCREEN_ANALYTICS}?${queryString}`
      : API_ENDPOINTS.SCREEN_ANALYTICS;
    return this.get(endpoint, true);
  }

  async getCategories(): Promise<ApiResponse<GetCategories>> {
    return this.get(API_ENDPOINTS.SCREEN_CATEGORIES, true);
  }

  async processReceipt(data: ProcessReceiptRequest): Promise<ApiResponse<ProcessReceiptResponse>> {
    return this.post(API_ENDPOINTS.SCREEN_CAMERA_PROCESS, data, true);
  }

  // Individual CRUD operations for expenses
  async createExpense(data: CreateExpenseRequest): Promise<ApiResponse<Expense>> {
    return this.post(API_ENDPOINTS.EXPENSES, data, true);
  }

  async updateExpense(id: string, data: UpdateExpenseRequest): Promise<ApiResponse<Expense>> {
    const endpoint = API_ENDPOINTS.EXPENSE_BY_ID.replace(':id', id);
    return this.put(endpoint, data, true);
  }

  async deleteExpense(id: string): Promise<ApiResponse<void>> {
    const endpoint = API_ENDPOINTS.EXPENSE_BY_ID.replace(':id', id);
    return this.delete(endpoint, true);
  }

  async uploadReceiptImage(imageData: string): Promise<ApiResponse<{ image_url: string; file_name: string }>> {
    return this.post(API_ENDPOINTS.EXPENSE_UPLOAD_RECEIPT, { image: imageData }, true);
  }

  // Individual CRUD operations for categories
  async createCategory(data: CreateCategoryRequest): Promise<ApiResponse<Category>> {
    return this.post(API_ENDPOINTS.CATEGORIES, data, true);
  }

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<ApiResponse<Category>> {
    const endpoint = API_ENDPOINTS.CATEGORY_BY_ID.replace(':id', id);
    return this.put(endpoint, data, true);
  }

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    const endpoint = API_ENDPOINTS.CATEGORY_BY_ID.replace(':id', id);
    return this.delete(endpoint, true);
  }

  // User profile operations
  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<any>> {
    return this.put(API_ENDPOINTS.USERS_PROFILE, data, true);
  }
}

export const apiService = new ApiService();
export default apiService;
