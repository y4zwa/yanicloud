import type { FastifyInstance } from 'fastify'
import { db, rowToNode, toPublic } from '../db.js'
import { requireAuth, fail, userIdOf } from '../auth.js'

const PIN_SQL = `
  SELECT n.*,
    (SELECT COUNT(*) FROM nodes c WHERE c.parent_id = n.id AND c.deleted_at IS NULL) AS items
  FROM pins p
  JOIN nodes n ON n.id = p.node_id
  WHERE p.user_id = ? AND n.deleted_at IS NULL
  ORDER BY p.created_at ASC
`

export async function pinsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/pins', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    const rows = db.prepare(PIN_SQL).all(userId)
    return { items: rows.map(rowToNode).map(toPublic) }
  })

  app.post('/api/pins/:id', { preHandler: requireAuth }, async (req, reply) => {
    const userId = userIdOf(req)
    const { id } = req.params as any
    const row = db.prepare('SELECT id FROM nodes WHERE id = ? AND user_id = ? AND deleted_at IS NULL').get(id, userId)
    if (!row) return fail(reply, 404, 'Не найдено')
    db.prepare('INSERT OR IGNORE INTO pins (user_id, node_id, created_at) VALUES (?, ?, ?)').run(userId, id, Date.now())
    return { ok: true }
  })

  app.delete('/api/pins/:id', { preHandler: requireAuth }, async (req) => {
    const userId = userIdOf(req)
    const { id } = req.params as any
    db.prepare('DELETE FROM pins WHERE user_id = ? AND node_id = ?').run(userId, id)
    return { ok: true }
  })
}
