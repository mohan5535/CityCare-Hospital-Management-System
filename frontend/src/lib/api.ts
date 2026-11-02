const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  error?: any;
  meta?: any;
}

/**
 * Centrally retrieves and sanitizes the stored authentication token.
 * Canonical key: 'hms_token', with seamless fallback to legacy 'token'.
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  let token = localStorage.getItem('hms_token') || localStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    return null;
  }
  token = token.trim();
  // Strip enclosing quotes if stored as a JSON string
  if (token.startsWith('"') && token.endsWith('"')) {
    token = token.slice(1, -1).trim();
  }
  // Strip redundant 'Bearer ' prefix if present
  if (token.startsWith('Bearer ') || token.startsWith('bearer ')) {
    token = token.substring(7).trim();
  }
  return token;
};

export const fetchApi = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let primaryUrl = `${API_BASE}${cleanEndpoint}`;
  let fallbackUrl = `/api${cleanEndpoint}`;

  if (endpoint.startsWith('http')) {
    primaryUrl = endpoint;
    fallbackUrl = endpoint;
  }

  let res: Response;

  try {
    res = await fetch(primaryUrl, {
      ...options,
      headers,
    });
  } catch (err: any) {
    // If direct connection to API_BASE failed, attempt proxy via Next.js rewrite
    if (typeof window !== 'undefined' && primaryUrl !== fallbackUrl) {
      try {
        res = await fetch(fallbackUrl, {
          ...options,
          headers,
        });
      } catch (fallbackErr: any) {
        throw new Error(
          'Cannot connect to HMS Backend server on port 5002. Please ensure the backend is started via `npm run dev:backend`.'
        );
      }
    } else {
      throw new Error(
        'Cannot connect to HMS Backend server on port 5002. Please ensure the backend is started via `npm run dev:backend`.'
      );
    }
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status >= 500 && !json.message && !json.error) {
      throw new Error(
        'HMS Backend server on port 5002 is not responding. Please ensure the backend is running via `npm run dev:backend`.'
      );
    }
    throw new Error(json.message || json.error || `Request failed with status ${res.status}`);
  }

  return json;
};

/**
 * Downloads a binary file (e.g. A4 Prescription PDF) with authenticated headers,
 * status validation, and error-handling without saving error responses as files.
 */
export const downloadFileApi = async (
  endpoint: string,
  defaultFilename = 'CityCare-Document.pdf',
  options: RequestInit = {}
): Promise<void> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required. Please log in to download this document.');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let primaryUrl = `${API_BASE}${cleanEndpoint}`;
  let fallbackUrl = `/api${cleanEndpoint}`;

  if (endpoint.startsWith('http')) {
    primaryUrl = endpoint;
    fallbackUrl = endpoint;
  }

  let res: Response;

  try {
    res = await fetch(primaryUrl, {
      ...options,
      headers,
    });
  } catch (err: any) {
    if (typeof window !== 'undefined' && primaryUrl !== fallbackUrl) {
      try {
        res = await fetch(fallbackUrl, {
          ...options,
          headers,
        });
      } catch (fallbackErr: any) {
        throw new Error(
          'Cannot connect to HMS Backend server on port 5002. Please ensure the backend is started via `npm run dev:backend`.'
        );
      }
    } else {
      throw new Error(
        'Cannot connect to HMS Backend server on port 5002. Please ensure the backend is started via `npm run dev:backend`.'
      );
    }
  }

  if (!res.ok) {
    let errorMessage = `Download failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      errorMessage = errJson.message || errJson.error || errorMessage;
    } catch {
      // Body was not JSON
    }

    if (res.status === 401) {
      throw new Error(errorMessage || 'Invalid authentication token. Please log in again.');
    }
    if (res.status === 403) {
      throw new Error(errorMessage || 'You do not have permission to download this document.');
    }
    throw new Error(errorMessage);
  }

  // Extract filename from Content-Disposition header if provided by backend
  let filename = defaultFilename;
  const disposition = res.headers.get('content-disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename=["']?([^"';]+)["']?/i);
    if (match && match[1]) {
      filename = match[1].trim();
    }
  }

  const blob = await res.blob();
  if (blob.size === 0) {
    throw new Error('Downloaded document is empty.');
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Release object URL after small timeout
  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
    if (link.parentNode) {
      document.body.removeChild(link);
    }
  }, 150);
};
