// functions/api/devices.js
export async function onRequestGet({ env }) {
  try {
    if (!env.DB) return new Response(JSON.stringify({ error: "Binding DB ausente" }), { status: 500 });
    const { results } = await env.DB.prepare("SELECT * FROM pmoc_devices ORDER BY tag ASC").all();
    return new Response(JSON.stringify(results || []), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return new Response(JSON.stringify({ error: "Binding DB ausente" }), { status: 500 });
    const body = await request.json();

    if (Array.isArray(body)) {
      const stmts = body.map(dev => env.DB.prepare(`
        INSERT INTO pmoc_devices (id, tag, local, setor, marca, modelo, btu, data_manutencao, tecnico_executante, aprovacao_supervisor, proxima_manutencao, observacoes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(tag) DO UPDATE SET
          local=excluded.local, setor=excluded.setor, marca=excluded.marca, modelo=excluded.modelo,
          btu=excluded.btu, data_manutencao=excluded.data_manutencao, tecnico_executante=excluded.tecnico_executante,
          aprovacao_supervisor='Ismael', proxima_manutencao=excluded.proxima_manutencao, observacoes=excluded.observacoes, updated_at=CURRENT_TIMESTAMP
      `).bind(
        dev.id || `dev-${dev.tag}`, dev.tag, dev.local || 'Matriz', dev.setor || 'Geral',
        dev.marca || '', dev.modelo || '', Number(dev.btu) || 12000, dev.data_manutencao || null,
        dev.tecnico_executante || 'Guilherme', 'Ismael', dev.proxima_manutencao || null, dev.observacoes || ''
      ));
      await env.DB.batch(stmts);
      return new Response(JSON.stringify({ success: true, count: body.length }), { headers: { "Content-Type": "application/json" } });
    }

    const dev = body;
    await env.DB.prepare(`
      INSERT INTO pmoc_devices (id, tag, local, setor, marca, modelo, btu, data_manutencao, tecnico_executante, aprovacao_supervisor, proxima_manutencao, observacoes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(tag) DO UPDATE SET
        local=excluded.local, setor=excluded.setor, marca=excluded.marca, modelo=excluded.modelo,
        btu=excluded.btu, data_manutencao=excluded.data_manutencao, tecnico_executante=excluded.tecnico_executante,
        aprovacao_supervisor='Ismael', proxima_manutencao=excluded.proxima_manutencao, observacoes=excluded.observacoes, updated_at=CURRENT_TIMESTAMP
    `).bind(
      dev.id || `dev-${dev.tag}`, dev.tag, dev.local || 'Matriz', dev.setor || '',
      dev.marca || '', dev.modelo || '', Number(dev.btu) || 12000, dev.data_manutencao || null,
      dev.tecnico_executante || 'Guilherme', 'Ismael', dev.proxima_manutencao || null, dev.observacoes || ''
    ).run();

    return new Response(JSON.stringify({ success: true, tag: dev.tag }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    if (!env.DB) return new Response(JSON.stringify({ error: "Binding DB ausente" }), { status: 500 });
    const url = new URL(request.url);
    const tag = url.searchParams.get("tag");
    if (!tag) return new Response(JSON.stringify({ error: "Tag obrigatória" }), { status: 400 });
    await env.DB.prepare("DELETE FROM pmoc_devices WHERE tag = ?").bind(Number(tag)).run();
    return new Response(JSON.stringify({ success: true, deletedTag: tag }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
