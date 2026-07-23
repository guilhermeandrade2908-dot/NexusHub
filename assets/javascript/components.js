// COMPONENTES INTERATIVOS NO HTML

// FUNÇÃO PARA EVITAR ATAQUES XSS E QUEBRA DE LAYOUT POR CARACTERES ESPECIAIS:
function escapeHTML(str) {
    if (typeof str !== 'string') return str ?? '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// VALIDADOR DE URL SEGURA (HTTPS/HTTP)
function isSafeUrl(url) {
    if (typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
}

// FUNÇÃO QUE RENDERIZA A TOP BAR (CABEÇALHO SUPERIOR):
export function renderHeader(perfil = {}) {
    const nome = escapeHTML(perfil.nome || 'Operador');
    const cargo = escapeHTML(perfil.cargo || 'System Operator');
    const status = escapeHTML(perfil.status || 'online');
    const statusClass = status.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const inicial = perfil.nome ? escapeHTML(perfil.nome.charAt(0).toUpperCase()) : 'U';

    return `<div class="header-info">
                <div class="user-avatar-badge">${inicial}</div>
                <div>
                    <h1 class="header-title">${nome}</h1>
                    <p class="header-subtitle">${cargo}</p>
                </div>
            </div>
            <div class="status-indicator">
                <span class="status-dot ${statusClass}"></span>
                <span class="status-text">${status.toUpperCase()}</span>
                <button id="btn-edit-header" class="btn-icon" title="Editar Status">✏️</button>
            </div>`;
}

// FUNÇÃO QUE RENDERIZA O CARD DE PERFIL E FOCO ATUAL:
export function renderPerfilCard(perfil = {}) {
    const foco = perfil.focoAtual || {};
    const statusTag = escapeHTML(foco.statusTag || 'Em Andamento');
    const titulo = escapeHTML(foco.titulo || 'Sem Foco Definido');
    const descricao = escapeHTML(foco.descricao || 'Adicione um objetivo principal para o seu momento.');

    return `<div class="card card-perfil">
                <div class="card-header">
                    <h3>Foco Atual</h3>
                    <button id="btn-edit-foco" class="btn-icon" title="Editar Foco">✏️</button>
                </div>
                <div class="card-body">
                    <span class="badge badge-accent">${statusTag}</span>
                    <h4 class="foco-titulo">${titulo}</h4>
                    <p class="foco-descricao">${descricao}</p>
                </div>
            </div>`;
}

// FUNÇÃO QUE RENDERIZA O CARD DO MÓDULO DE ESTUDOS:
export function renderEstudosCard(estudos = {}) {
    const materias = Array.isArray(estudos.materias) ? estudos.materias : [];

    const materiasHTML = materias.map(materia => {
        const nome = escapeHTML(materia?.nome || 'Matéria');
        const progressoVal = Number(materia?.progresso) || 0;
        const progresso = Math.min(100, Math.max(0, progressoVal));

        return `<li class="materia-item">
            <div class="materia-info">
                <span class="materia-nome">${nome}</span>
                <span class="materia-progresso-txt">${progresso}%</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${progresso}%"></div>
            </div>
        </li>`;
    }).join('');

    const horasTotais = Number(estudos.horasTotais) || 0;
    const metaHoras = Number(estudos.metasHorasSemanais || estudos.metasHorasSemanal) || 0;

    return `<div class="card card-estudos">
                <div class="card-header">
                    <h3>Estudos</h3>
                    <button id="btn-add-materia" class="btn-icon" title="Adicionar Matéria">➕</button>
                </div>
                <div class="card-body">
                    <div class="estudos-stats">
                        <div class="stat-box">
                            <span class="stat-number">${horasTotais}h</span>
                            <span class="stat-label">Horas Totais</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-number">${metaHoras}h</span>
                            <span class="stat-label">Meta Semanal</span>
                        </div>
                    </div>
                    <ul class="materias-list">
                        ${materiasHTML.length > 0 ? materiasHTML : '<li class="empty-msg">Nenhuma matéria cadastrada.</li>'}
                    </ul>
                </div>
            </div>`;
}

// FUNÇÃO QUE RENDERIZA A LISTA DE PROJETOS:
export function renderProjetosCard(projetos = []) {
    const projetosList = Array.isArray(projetos) ? projetos : [];

    const projetosHTML = projetosList.map(proj => {
        const nome = escapeHTML(proj?.nome || 'Sem Nome');
        const status = escapeHTML(proj?.status || 'Pendente');
        const descricao = escapeHTML(proj?.descricao || '');
        const githubUrl = isSafeUrl(proj?.githubUrl) ? escapeHTML(proj.githubUrl) : null;

        const techs = Array.isArray(proj?.techs) ? proj.techs : [];
        const techsHTML = techs.map(t => `<span class="tag-tech">${escapeHTML(t)}</span>`).join('');

        return `<div class="projeto-item card">
                    <div class="projeto-header">
                        <h4>${nome}</h4>
                        <span class="badge badge-status">${status}</span>
                    </div>
                    <p class="projeto-desc">${descricao}</p>
                    <div class="projeto-techs">${techsHTML}</div>
                    ${githubUrl ? `<a href="${githubUrl}" target="_blank" rel="noopener noreferrer" class="link-github">Ver no GitHub ↗</a>` : ''}
                </div>`;
    }).join('');

    return `<div class="section-projetos">
                <div class="section-header">
                    <h3>Projetos</h3>
                    <button id="btn-add-projeto" class="btn-icon" title="Novo Projeto">➕</button>
                </div>
                <div class="projetos-grid">
                    ${projetosHTML.length > 0 ? projetosHTML : '<p class="empty-msg">Nenhum projeto cadastrado.</p>'}
                </div>
            </div>`;
}

// FUNÇÃO QUE RENDERIZA A CHECKLIST DE METAS:
export function renderMetasCard(metas = []) {
    const metasList = Array.isArray(metas) ? metas : [];

    const metasHTML = metasList.map(meta => {
        const id = escapeHTML(String(meta?.id || ''));
        const texto = escapeHTML(meta?.texto || '');
        const concluida = Boolean(meta?.concluida);

        return `<li class="meta-item ${concluida ? 'meta-done' : ''}">
            <label class="checkbox-container">
                <input type="checkbox" data-meta-id="${id}" ${concluida ? 'checked' : ''}>
                <span class="checkmark"></span>
                <span class="meta-texto">${texto}</span>
            </label>
            <button class="btn-icon btn-delete-meta" data-meta-id="${id}" title="Excluir">🗑️</button>
        </li>`;
    }).join('');

    return `<div class="card card-metas">
                <div class="card-header">
                    <h3>Metas da Semana</h3>
                    <button id="btn-add-meta" class="btn-icon" title="Adicionar Meta">➕</button>
                </div>
                <div class="card-body">
                    <ul class="metas-list">
                        ${metasHTML.length > 0 ? metasHTML : '<li class="empty-msg">Nenhuma meta adicionada.</li>'}
                    </ul>
                </div>
            </div>`;
}

// FUNÇÃO QUE RENDERIZA O MÓDULO DE LAZER (JOGOS, LIVROS, FILMES, ETC):
export function renderLazerCard(lazer = {}) {
    const jogos = Array.isArray(lazer.jogos) ? lazer.jogos : [];
    const livros = Array.isArray(lazer.livros) ? lazer.livros : [];
    const filmes = Array.isArray(lazer.filmes) ? lazer.filmes : [];

    const jogosHTML = jogos.map(j => `<li>🎮 <strong>${escapeHTML(j?.titulo || 'Sem título')}</strong> <span class="sub-info">(${escapeHTML(j?.plataforma || 'N/A')})</span></li>`).join('');
    const livrosHTML = livros.map(l => `<li>📖 <strong>${escapeHTML(l?.titulo || 'Sem título')}</strong> <span class="sub-info">- ${escapeHTML(l?.progresso || 'N/A')}</span></li>`).join('');
    const filmesHTML = filmes.map(f => `<li>🎬 <strong>${escapeHTML(f?.titulo || 'Sem título')}</strong> <span class="sub-info">(${escapeHTML(f?.genero || 'N/A')}) - ${escapeHTML(f?.status || 'N/A')}</span></li>`).join('');

    return `<div class="card card-lazer">
                <div class="card-header">
                    <h3>Lazer & Mídia</h3>
                    <button id="btn-add-lazer" class="btn-icon" title="Adicionar Mídia">➕</button>
                </div>
                <div class="card-body lazer-grid">
                    <div class="lazer-col">
                        <h5>Jogos</h5>
                        <ul>${jogosHTML || '<li class="empty-item">Nenhum jogo cadastrado.</li>'}</ul>
                    </div>
                    <div class="lazer-col">
                        <h5>Livros</h5>
                        <ul>${livrosHTML || '<li class="empty-item">Nenhum livro cadastrado.</li>'}</ul>
                    </div>
                    <div class="lazer-col">
                        <h5>Filmes</h5>
                        <ul>${filmesHTML || '<li class="empty-item">Nenhum filme cadastrado.</li>'}</ul>
                    </div>
                </div>
            </div>`;
}
