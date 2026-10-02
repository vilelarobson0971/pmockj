// functions/api/maintenance.js
export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return new Response(JSON.stringify({ error: "Binding DB ausente" }), { status: 500 });
    const { tag, data_manutencao, proxima_manutencao, tecnico_executante, observacoes } = await request.json();

    if (!tag || !data_manutencao) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), { status: 400 });
    }

    const histId = `maint-${Date.now()}-${tag}`;

    await env.DB.batch([
      env.DB.prepare(`
        UPDATE pmoc_devices 
        SET data_manutencao = ?, proxima_manutencao = ?, tecnico_executante = ?, aprovacao_supervisor = 'Ismael', observacoes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE tag = ?
      `).bind(data_manutencao, proxima_manutencao, tecnico_executante || 'Guilherme', observacoes || '', Number(tag)),

      env.DB.prepare(`
        INSERT INTO pmoc_maintenance_history (id, device_tag, data_manutencao, proxima_manutencao, tecnico_executante, aprovacao_supervisor, observacoes)
        VALUES (?, ?, ?, ?, ?, 'Ismael', ?)
      `).bind(histId, Number(tag), data_manutencao, proxima_manutencao, tecnico_executante || 'Guilherme', observacoes || '')
    ]);

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
