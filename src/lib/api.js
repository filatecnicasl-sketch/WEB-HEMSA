export const ADMIN_SESSION_KEY = 'hemsa-admin-session';

export class ApiError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export async function apiRequest(path, { method = 'GET', body, form, token, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(path, {
    method,
    headers,
    body: form || (body === undefined ? undefined : JSON.stringify(body)),
    signal,
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error?.code || 'REQUEST_ERROR',
      data?.error?.message || 'No se ha podido completar la operación.',
      data?.error?.fields || {},
    );
  }
  return data;
}

export function readableError(error) {
  if (error?.name === 'AbortError') return '';
  if (error instanceof TypeError) return 'No se puede conectar con el servidor local. Inicia la web con npm run dev y vuelve a intentarlo.';
  return error?.message || 'Ha ocurrido un error inesperado.';
}
