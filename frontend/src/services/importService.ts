import axios from 'axios';

const API_URL = (import.meta as any).env.VITE_API_URL || '';

export interface ImportResult {
  success: boolean;
  data?: {
    importId: string;
    status: string;
    processedRecords: number;
    createdAccounts: number;
    updatedAccounts: number;
    skippedAccounts: number;
    routeId?: string;
    errors: ImportError[];
    warnings: ImportWarning[];
    metadata?: any;
    previewAccounts?: any[];
    totalRows?: number;
    stats?: any;
  };
  error?: string;
}

export interface ImportError {
  row?: number;
  field?: string;
  value?: any;
  message: string;
  code: string;
}

export interface ImportWarning {
  row?: number;
  field?: string;
  value?: any;
  message: string;
  code: string;
}

export enum DuplicateStrategy {
  SKIP = 'skip',
  UPDATE = 'update',
  CREATE_NEW = 'create_new',
  FAIL = 'fail'
}

class ImportService {
  private getAuthHeaders(): Record<string, string> {
    const raw = localStorage.getItem('poolroute-auth');
    if (raw) {
      try {
        const authData = JSON.parse(raw);
        if (authData?.state?.token) {
          return { 'Authorization': `Bearer ${authData.state.token}` };
        }
      } catch {
        // ignore parse errors
      }
    }
    return {};
  }

  async validateCSV(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/import/csv/validate`, formData, {
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to validate CSV file',
      };
    }
  }

  async previewCSV(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/import/csv/preview`, formData, {
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to preview CSV file',
      };
    }
  }

  async importCSV(
    file: File,
    options: {
      routeId?: string;
      routeName?: string;
      duplicateStrategy?: DuplicateStrategy;
    } = {}
  ): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    // Add options to form data
    if (options.routeId) {
      formData.append('routeId', options.routeId);
    }
    if (options.routeName) {
      formData.append('routeName', options.routeName);
    }
    formData.append('duplicateStrategy', options.duplicateStrategy || DuplicateStrategy.SKIP);
    formData.append('validateOnly', 'false');

    try {
      const response = await axios.post(`${API_URL}/api/import/csv/execute`, formData, {
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to import CSV file',
      };
    }
  }

  async getTemplates(): Promise<{ name: string; description: string; url: string }[]> {
    try {
      const response = await axios.get(`${API_URL}/api/import/templates`);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to get templates:', error);
      return [];
    }
  }

  async downloadTemplate(filename: string): Promise<void> {
    try {
      const response = await axios.get(`${API_URL}/api/import/templates/download/${filename}`, {
        responseType: 'blob',
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download template:', error);
      throw error;
    }
  }

  async getImportHistory(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/api/import/history`, {
        headers: this.getAuthHeaders(),
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to get import history:', error);
      return [];
    }
  }
}

export default new ImportService();