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
  createdAt: number
  updatedAt: number
  items?: number
}

export interface PublicNode extends Omit<Node, 'userId'> {}

export interface PublicUser {
  id: number
  username: string
  quotaBytes: number
  isAdmin: boolean
  banner: boolean
}
