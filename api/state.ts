import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('DATABASE_URL/POSTGRES_URL ausente no ambiente.');
}

const pool = new Pool({ connectionString });

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recout_state (
      id INTEGER PRIMARY KEY,
      state JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export default async function handler(req: any, res: any) {
  try {
    await ensureTable();

    if (req.method === 'GET') {
      const result = await pool.query('SELECT state, updated_at FROM recout_state WHERE id = 1');
      if (result.rowCount === 0) {
        return res.status(200).json({ state: null });
      }

      return res.status(200).json({
        state: result.rows[0].state,
        updatedAt: result.rows[0].updated_at,
      });
    }

    if (req.method === 'POST') {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const state = payload?.state;

      if (!state || typeof state !== 'object') {
        return res.status(400).json({ error: 'Payload invalido. Informe { state }.' });
      }

      await pool.query(
        `
        INSERT INTO recout_state (id, state, updated_at)
        VALUES (1, $1::jsonb, NOW())
        ON CONFLICT (id)
        DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
      `,
        [JSON.stringify(state)]
      );

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Metodo nao permitido' });
  } catch (error) {
    console.error('Erro na API /api/state:', error);
    return res.status(500).json({ error: 'Falha interna ao salvar/carregar estado.' });
  }
}
