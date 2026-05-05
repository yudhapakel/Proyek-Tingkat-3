export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export type User = {
  id: number
  name: string
  email: string
  created_at: string
}

export type AuthResponse = {
  access_token: string
  token_type: string
  user: User
}

export type Analysis = {
  id: number
  user_id: number
  filename: string | null
  image_url: string | null
  fish_type: string
  overall_score: number
  freshness_score: number
  eye_score: number
  gill_score: number
  scale_score: number
  confidence_score: number
  status: string
  recommendation: string | null
  model_used: string
  created_at: string
}

type RequestOptions = RequestInit & {
  token?: string
}

function getDetail(payload: unknown): string | undefined {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail?: unknown }).detail
    if (typeof detail === 'string') return detail
  }
  if (typeof payload === 'string') return payload
  return undefined
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Terjadi kesalahan. Coba lagi ya bro.'
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 204) return null as T

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    throw new Error(getDetail(payload) || `Request gagal (${response.status})`)
  }

  return payload as T
}

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export function register(name: string, email: string, password: string) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
}

export function scanFish(token: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequest<Analysis>('/scan', {
    method: 'POST',
    token,
    body: formData,
  })
}

export function getHistory(token: string) {
  return apiRequest<Analysis[]>('/analysis/history', { token })
}

export function getAnalysisDetail(token: string, id: number) {
  return apiRequest<Analysis>(`/analysis/${id}`, { token })
}

export function deleteAnalysis(token: string, id: number) {
  return apiRequest<null>(`/analysis/${id}`, {
    method: 'DELETE',
    token,
  })
}
