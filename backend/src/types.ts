export interface User {
  id: number
  username: string
  quotaBytes: number
  isAdmin: boolean
  banner: boolean
  createdAt: number
}

export type NodeType = 'file' | 'folder'

export interface Node {
  id: string
  userId: number
  parentId: string | null
  name: string
  type: NodeType
  size: number
  mimeType: string | null
  storageKey: string | null
  isFavorite: boolean
  hiddenRecent: boolean
  deletedAt: number | null
  /** Метка операции удаления: по ней восстановление папки возвращает только своё поддерево. */
  trashId?: string | null
  createdAt: number
  updatedAt: number
  items?: number
}

export type PublicNode = Omit<Node, 'userId' | 'storageKey' | 'trashId'>

export interface PublicUser {
  id: number
  username: string
  quotaBytes: number
  isAdmin: boolean
  banner: boolean
}
