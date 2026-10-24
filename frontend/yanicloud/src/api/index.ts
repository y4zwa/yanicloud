export interface User {
  id: number
  username: string
  quotaBytes: number
  isAdmin: boolean
  banner: boolean
}

export interface AdminUser {
  id: number
  username: string
  quotaBytes: number
  isAdmin: boolean
  used: number
  createdAt: number
}

export interface AdminSettings {
  defaultQuota: number
  storageDir: string
  trashRetentionDays: number
  diskTotal: number
  diskFree: number
  reservedBytes: number
  userCount: number
}

export interface AdminDisk {
  path: string
  total: number
  free: number
  current: boolean
  device: string | null
}

export interface NodeItem {
  id: string
  parentId: string | null
  name: string
  type: 'file' | 'folder'
  size: number
  mimeType: string | null
  isFavorite: boolean
  deletedAt: number | null
  createdAt: number
  updatedAt: number
  items?: number
}

export interface StorageInfo {
  used: number
  quota: number
  percent: number
  diskTotal: number
  diskFree: number
}

const TOKEN_KEY = 'yanicloud_token'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...authHeaders() }
  if (opts.body && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(path, { ...opts, headers })
  if (res.status === 401) {
    clearToken()
    throw new ApiError(401, 'Сессия истекла')
  }
  if (!res.ok) {
    let msg = 'Ошибка запроса'
    try {
      const j = await res.json()
      msg = j.error || msg
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg)
  }
  return (await res.json()) as T
}

export async function register(username: string, password: string): Promise<{ token: string; user: User }> {
  const res = await request<{ token: string; user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setToken(res.token)
  return res
}

export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
  const res = await request<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setToken(res.token)
  return res
}

export async function me(): Promise<User> {
  const res = await request<{ user: User }>('/api/auth/me')
  return res.user
}

export async function listFiles(parentId?: string | null): Promise<NodeItem[]> {
  const q = parentId ? `?parent=${encodeURIComponent(parentId)}` : ''
  const res = await request<{ items: NodeItem[] }>(`/api/files${q}`)
  return res.items
}

export async function listFavorites(): Promise<NodeItem[]> {
  const res = await request<{ items: NodeItem[] }>('/api/files/favorites')
  return res.items
}

export async function listRecent(): Promise<NodeItem[]> {
  const res = await request<{ items: NodeItem[] }>('/api/files/recent')
  return res.items
}

export async function listTrash(): Promise<NodeItem[]> {
  const res = await request<{ items: NodeItem[] }>('/api/files/trash')
  return res.items
}

export async function searchFiles(q: string): Promise<NodeItem[]> {
  const res = await request<{ items: NodeItem[] }>(`/api/files/search?q=${encodeURIComponent(q)}`)
  return res.items
}

export async function createFolder(name: string, parentId?: string | null): Promise<NodeItem> {
  return request<NodeItem>('/api/files/folders', {
    method: 'POST',
    body: JSON.stringify({ name, parentId }),
  })
}

export function uploadFiles(
  files: File[],
  parentId: string | null,
  onProgress?: (loaded: number, total: number) => void
): Promise<NodeItem[]> {
  return new Promise((resolve, reject) => {
    const fd = new FormData()
    for (const f of files) fd.append('files', f, f.name)
    const q = parentId ? `?parent=${encodeURIComponent(parentId)}` : ''
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/files/upload${q}`)
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded, e.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText).files || [])
        } catch {
          resolve([])
        }
      } else {
        let msg = 'Ошибка загрузки'
        try {
          msg = JSON.parse(xhr.responseText).error || msg
        } catch {
          /* ignore */
        }
        reject(new ApiError(xhr.status, msg))
      }
    }
    xhr.onerror = () => reject(new ApiError(0, 'Сетевая ошибка'))
    xhr.send(fd)
  })
}

export async function downloadFile(node: NodeItem): Promise<void> {
  const res = await request<{ url: string }>(`/api/files/${node.id}/download-url`, { method: 'POST' })
  const a = document.createElement('a')
  a.href = res.url
  a.download = node.name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function renameNode(id: string, name: string): Promise<NodeItem> {
  return request<NodeItem>(`/api/files/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) })
}

export async function setFavorite(id: string, isFavorite: boolean): Promise<NodeItem> {
  return request<NodeItem>(`/api/files/${id}`, { method: 'PATCH', body: JSON.stringify({ isFavorite }) })
}

export async function setHiddenRecent(id: string, hidden: boolean): Promise<NodeItem> {
  return request<NodeItem>(`/api/files/${id}`, { method: 'PATCH', body: JSON.stringify({ hiddenRecent: hidden }) })
}

export async function moveNode(id: string, parentId: string | null): Promise<NodeItem> {
  return request<NodeItem>(`/api/files/${id}`, { method: 'PATCH', body: JSON.stringify({ parentId }) })
}

export async function trashNode(id: string): Promise<void> {
  await request(`/api/files/${id}`, { method: 'DELETE' })
}

export async function deleteNodePermanent(id: string): Promise<void> {
  await request(`/api/files/${id}/permanent`, { method: 'DELETE' })
}

export async function restoreNode(id: string): Promise<void> {
  await request(`/api/files/${id}/restore`, { method: 'POST' })
}

export async function emptyTrash(): Promise<void> {
  await request('/api/files/trash', { method: 'DELETE' })
}

export async function getStorage(): Promise<StorageInfo> {
  return request<StorageInfo>('/api/storage')
}

export async function getStreamUrl(id: string): Promise<string> {
  const res = await request<{ url: string }>(`/api/files/${id}/stream-url`, { method: 'POST' })
  return res.url
}

export async function getThumbUrls(ids: string[]): Promise<Record<string, string>> {
  const res = await request<{ urls: Record<string, string> }>('/api/files/thumb-urls', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
  return res.urls
}

export async function fetchTextPreview(url: string): Promise<string> {
  const res = await fetch(url, { headers: authHeaders() })
  if (!res.ok) throw new ApiError(res.status, 'Ошибка загрузки')
  return res.text()
}

export async function adminListUsers(): Promise<AdminUser[]> {
  const res = await request<{ users: AdminUser[] }>('/api/admin/users')
  return res.users
}

export async function adminCreateUser(data: {
  username: string
  password: string
  quotaBytes?: number | null
  isAdmin?: boolean
}): Promise<AdminUser> {
  const res = await request<{ user: AdminUser }>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res.user
}

export async function adminUpdateUser(
  id: number,
  data: { quotaBytes?: number | null; isAdmin?: boolean; password?: string }
): Promise<AdminUser> {
  const res = await request<{ user: AdminUser }>(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return res.user
}

export async function adminDeleteUser(id: number): Promise<void> {
  await request(`/api/admin/users/${id}`, { method: 'DELETE' })
}

export async function adminGetSettings(): Promise<AdminSettings> {
  return request<AdminSettings>('/api/admin/settings')
}

export async function adminUpdateSettings(data: {
  defaultQuota?: number | null
  storageDir?: string
}): Promise<AdminSettings> {
  return request<AdminSettings>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(data) })
}

export async function adminGetDisks(): Promise<AdminDisk[]> {
  const res = await request<{ disks: AdminDisk[] }>('/api/admin/disks')
  return res.disks
}

export async function listPins(): Promise<NodeItem[]> {
  const res = await request<{ items: NodeItem[] }>('/api/pins')
  return res.items
}

export async function pinNode(id: string): Promise<void> {
  await request(`/api/pins/${id}`, { method: 'POST' })
}

export async function unpinNode(id: string): Promise<void> {
  await request(`/api/pins/${id}`, { method: 'DELETE' })
}

export async function getBannerUrl(): Promise<string | null> {
  const res = await request<{ url: string | null }>('/api/banner-url', { method: 'POST' })
  return res.url
}

export async function uploadBanner(file: File): Promise<void> {
  const fd = new FormData()
  fd.append('banner', file, file.name)
  await request('/api/banner', { method: 'PUT', body: fd })
}

export async function deleteBanner(): Promise<void> {
  await request('/api/banner', { method: 'DELETE' })
}
