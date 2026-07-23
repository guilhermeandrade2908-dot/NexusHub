// COMPONENTS.JS - O RENDERIZADOR DE UI:

function escapeHTML(str) {
    if (typeof str !== 'string') return str ?? '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function isSafeUrl(url) {
    if (typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
}

// RENDER DO CARD DE FOCO NO DASHBOARD
export function renderPerfilCard(perfil = {}, projetos = []) {
    const foco = perfil.focoAtual || null;

    const temFoco = Boolean(foco && foco.titulo);
    const statusTag = temFoco ? escapeHTML(foco.statusTag || 'Em Andamento') : '';
    const titulo = temFoco ? escapeHTML(foco.titulo) : 'Nenhum Projeto Selecionado';
    const descricao = temFoco ? escapeHTML(foco.descricao) : 'Selecione um projeto para ser o seu Foco Atual.';

    return `<div class="card card-perfil">
                <div class="card-header">
                    <h3>Foco Atual</h3>
                    <button id="btn-select-foco" class="btn-icon" title="Vincular Projeto ao Foco">🎯 Alterar Foco</button>
                </div>
                <div class="card-body">
                    <span class="badge badge-accent">${statusTag}</span>
                    <h4 class="foco-titulo" style="margin-top: 8px; font-size: 1.2rem;">${titulo}</h4>
                    <p class="foco-descricao" style="color: #a0a0a0; margin-top: 4px;">${descricao}</p>
                </div>
            </div>`;
}

// RENDER DA PÁGINA COMPLETA DE PERFIL
export function renderPerfilPage(perfil = {}) {
    const nome = escapeHTML(perfil.nome || 'Desenvolvedor');
    const cargo = escapeHTML(perfil.cargo || 'System Operator');
    const status = escapeHTML(perfil.status || 'Online');
    const bio = escapeHTML(perfil.bio || 'Sem biografia cadastrada.');
    const inicial = nome.charAt(0).toUpperCase();

    return `<div class="card card-perfil-full" style="padding: 24px;">
                <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                    <div style="width: 70px; height: 70px; border-radius: 50%; background: #00e5ff; color: #000; font-size: 2rem; font-weight: bold; display: flex; align-items: center; justify-content: center;">
                        ${inicial}
                    </div>
                    <div>
                        <h2 style="margin: 0;">${nome}</h2>
                        <p style="margin: 4px 0; color: #00e5ff;">${cargo} • <span style="color: #00ff88;">${status}</span></p>
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <h4>Sobre mim:</h4>
                    <p style="color: #bbb; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 6px;">${bio}</p>
                </div>
                <button id="btn-edit-perfil" class="btn-icon" style="padding: 8px 16px; background: #00e5ff; color: #000; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
                    ✏️ Editar Perfil
                </button>
            </div>`;
}

// RENDER DE ESTUDOS
export function renderEstudosCard(estudos = {}) {
    const materias = Array.isArray(estudos.materias) ? estudos.materias : [];

    const materiasHTML = materias.map((materia, idx) => {
        const nome = escapeHTML(materia?.nome || 'Matéria');
        const progressoVal = Number(materia?.progresso) || 0;
        const progresso = Math.min(100, Math.max(0, progressoVal));

        return `<li class="materia-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
            <div style="flex-grow: 1; margin-right: 12px;">
                <div class="materia-info" style="display:flex; justify-content:space-between;">
                    <span class="materia-nome">${nome}</span>
                    <span class="materia-progresso-txt">${progresso}%</span>
                </div>
                <div class="progress-bar-bg" style="background:#222; height:8px; border-radius:4px; overflow:hidden;">
                    <div class="progress-bar-fill" style="width: ${progresso}%; background:#00e5ff; height:100%;"></div>
                </div>
            </div>
            <div>
                <button class="btn-icon btn-edit-materia" data-idx="${idx}" title="Editar">✏️</button>
                <button class="btn-icon btn-delete-materia" data-idx="${idx}" title="Excluir">🗑️</button>
            </div>
        </li>`;
    }).join('');

    const horasTotais = Number(estudos.horasTotais) || 0;
    const metaHoras = Number(estudos.metasHorasSemanais || estudos.metasHorasSemanal) || 0;

    return `<div class="card card-estudos">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>Estudos</h3>
                    <button id="btn-add-materia" class="btn-icon" title="Adicionar Matéria">➕</button>
                </div>
                <div class="card-body">
                    <div class="estudos-stats" style="display:flex; gap: 20px; margin-bottom:15px;">
                        <div class="stat-box"><strong>${horasTotais}h</strong> Horas Totais</div>
                        <div class="stat-box"><strong>${metaHoras}h</strong> Meta Semanal</div>
                    </div>
                    <ul class="materias-list" style="list-style:none; padding:0;">
                        ${materiasHTML.length > 0 ? materiasHTML : '<li class="empty-msg">Nenhuma matéria cadastrada.</li>'}
                    </ul>
                </div>
            </div>`;
}

// RENDER DE PROJETOS
export function renderProjetosCard(projetos = []) {
    const projetosList = Array.isArray(projetos) ? projetos : [];

    const projetosHTML = projetosList.map((proj, idx) => {
        const nome = escapeHTML(proj?.nome || 'Sem Nome');
        const status = escapeHTML(proj?.status || 'Pendente');
        const descricao = escapeHTML(proj?.descricao || '');
        const githubUrl = isSafeUrl(proj?.githubUrl) ? escapeHTML(proj.githubUrl) : null;

        return `<div class="projeto-item card" style="margin-bottom:12px; padding:1.25rem; border: 1px solid var(--bg-tertiary);">
                    <!-- LINHA 1: TÍTULO, BADGE E AÇÕES -->
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <div style="display:flex; align-items:center; gap: 0.6rem; flex-wrap: wrap;">
                            <h4 style="margin:0; font-size: 1.1rem; color: var(--text-primary); font-weight: 700;">${nome}</h4>
                            <span class="badge badge-status">${status}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap: 0.25rem; flex-shrink: 0;">
                            <button class="btn-icon btn-edit-projeto" data-idx="${idx}" title="Editar">✏️</button>
                            <button class="btn-icon btn-delete-projeto" data-idx="${idx}" title="Excluir">🗑️</button>
                        </div>
                    </div>

                    <!-- LINHA 2: DESCRIÇÃO -->
                    <p class="projeto-desc" style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.4; margin: 0;">${descricao}</p>

                    <!-- LINHA 3: LINK GITHUB (SE HOUVER) -->
                    ${githubUrl ? `<a href="${githubUrl}" target="_blank" class="link-github" style="display:inline-block; margin-top:0.75rem; color:var(--accent-purple); font-size:0.85rem;">Ver no GitHub ↗</a>` : ''}
                </div>`;
    }).join('');

    return `<div class="section-projetos">
                <div class="section-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <h3>Projetos</h3>
                    <button id="btn-add-projeto" class="btn-icon" title="Novo Projeto">➕</button>
                </div>
                <div class="projetos-grid">
                    ${projetosHTML.length > 0 ? projetosHTML : '<p class="empty-msg">Nenhum projeto cadastrado.</p>'}
                </div>
            </div>`;
}

// RENDER DE METAS
export function renderMetasCard(metas = []) {
    const metasList = Array.isArray(metas) ? metas : [];

    const metasHTML = metasList.map(meta => {
        const id = escapeHTML(String(meta?.id || ''));
        const texto = escapeHTML(meta?.texto || '');
        const concluida = Boolean(meta?.concluida);

        return `<li class="meta-item ${concluida ? 'meta-done' : ''}" style="display:flex; justify-content:space-between; align-items:center;">
            <label class="checkbox-container">
                <input type="checkbox" data-meta-id="${id}" ${concluida ? 'checked' : ''}>
                <span class="meta-texto" style="${concluida ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${texto}</span>
            </label>
            <div>
                <button class="btn-icon btn-edit-meta" data-meta-id="${id}" title="Editar">✏️</button>
                <button class="btn-icon btn-delete-meta" data-meta-id="${id}" title="Excluir">🗑️</button>
            </div>
        </li>`;
    }).join('');

    return `<div class="card card-metas">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>Metas da Semana</h3>
                    <button id="btn-add-meta" class="btn-icon" title="Adicionar Meta">➕</button>
                </div>
                <div class="card-body">
                    <ul class="metas-list" style="list-style:none; padding:0;">
                        ${metasHTML.length > 0 ? metasHTML : '<li class="empty-msg">Nenhuma meta adicionada.</li>'}
                    </ul>
                </div>
            </div>`;
}

// RENDER DE LAZER & MÍDIA
export function renderLazerCard(lazer = {}) {
    const jogos = Array.isArray(lazer.jogos) ? lazer.jogos : [];
    const livros = Array.isArray(lazer.livros) ? lazer.livros : [];
    const filmes = Array.isArray(lazer.filmes) ? lazer.filmes : [];

    const renderList = (cat, items) => items.map((item, idx) => `
        <li style="display:flex; justify-content:space-between; margin-bottom: 4px;">
            <span><strong>${escapeHTML(item.titulo)}</strong> (${escapeHTML(item.info || item.plataforma || item.progresso || item.genero || '')})</span>
            <div>
                <button class="btn-icon btn-delete-lazer" data-cat="${cat}" data-idx="${idx}">🗑️</button>
            </div>
        </li>
    `).join('');

    return `<div class="card card-lazer">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>Lazer & Mídia</h3>
                    <button id="btn-add-lazer" class="btn-icon" title="Adicionar Mídia">➕</button>
                </div>
                <div class="card-body lazer-grid" style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                    <div class="lazer-col">
                        <h5>🎮 Jogos</h5>
                        <ul style="list-style:none; padding:0;">${renderList('jogos', jogos) || '<li class="empty-item">Vazio.</li>'}</ul>
                    </div>
                    <div class="lazer-col">
                        <h5>📖 Livros</h5>
                        <ul style="list-style:none; padding:0;">${renderList('livros', livros) || '<li class="empty-item">Vazio.</li>'}</ul>
                    </div>
                    <div class="lazer-col">
                        <h5>🎬 Filmes</h5>
                        <ul style="list-style:none; padding:0;">${renderList('filmes', filmes) || '<li class="empty-item">Vazio.</li>'}</ul>
                    </div>
                </div>
            </div>`;
}