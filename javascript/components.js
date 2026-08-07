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
    const foco = perfil.projetoFoco || null;

    const temFoco = Boolean(foco && foco.nome);
    const statusTag = temFoco ? escapeHTML(foco.statusTag || 'Em Andamento') : '';
    const titulo = temFoco ? escapeHTML(foco.nome) : 'Nenhum Projeto Selecionado';
    const descricao = temFoco ? escapeHTML(foco.descricao) : 'Selecione um projeto para ser o seu Foco Atual.';

    return `<div class="card card-perfil">
                <div class="card-header">
                    <h3>Foco Atual</h3>
                    <button id="btn-select-foco" class="btn-icon" title="Vincular Projeto ao Foco"><i class="ph ph-target" style="padding-right: 5px;"></i> Alterar Foco</button>
                </div>
                <div class="card-body">
                    <span class="badge badge-accent">${statusTag}</span>
                    <h4 class="foco-titulo" style="margin-top: 8px; font-size: 1.2rem;">${titulo}</h4>
                    <p class="foco-descricao" style="color: #a0a0a0; margin-top: 4px;">${descricao}</p>
                </div>
            </div>`;
}

// RENDER DA PÁGINA COMPLETA DE PERFIL
export function renderPerfilPage(perfil = {}, systemStatus = 'Online') {
    const nome = escapeHTML(perfil.nome || 'Dev');
    const cargo = escapeHTML(perfil.cargo || 'System Operator');
    const status = escapeHTML(perfil.status || 'Online');
    const bio = escapeHTML(perfil.bio || 'Sem biografia cadastrada.');
    const inicial = nome.charAt(0).toUpperCase();

    // TRATAMENTO DINÂMICO DE STATUS E CORES NO PERFIL
    const statusTxt = escapeHTML(systemStatus || 'Online');
    let statusCor = '#10b981';

    if (statusTxt === 'Ausente') {
        statusCor = '#f59e0b';
    } else if (statusTxt === 'Offline') {
        statusCor = '#d40438';
    }

    return `<div class="card card-perfil-full" style="padding: 24px;">
                <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                    <div style="width: 70px; height: 70px; border-radius: 50%; background: #00e5ff; color: #000; font-size: 2rem; font-weight: bold; display: flex; align-items: center; justify-content: center;">
                        ${inicial}
                    </div>
                    <div>
                        <h2 style="margin: 0;">${nome}</h2>
                        <p style="margin: 4px 0; color: #00e5ff;">${cargo} • <span id="btn-change-status" style="color: ${statusCor}; font-weight: 600; cursor: pointer;" title="Clique para alterar status">${statusTxt}</span></p>
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <h4>Sobre mim:</h4>
                    <p style="color: #bbb; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 6px;">${bio}</p>
                </div>
                <button id="btn-edit-perfil" class="btn-icon" style="padding: 8px 16px; background: #00e5ff; color: #000; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
                    <i class="ph ph-pencil"></i> Editar Perfil
                </button>
            </div>`;
}

// RENDER DE ESTUDOS
export function renderEstudosCard(estudos = {}) {
    // MATERIAS:
    const materias = Array.isArray(estudos.materias) ? estudos.materias : [];

    const materiasHTML = materias.map((materia, idx) => {
        const nome = escapeHTML(materia?.nome || 'Matéria');
        const progressoVal = Number(materia?.progresso) || 0;
        const progresso = Math.min(100, Math.max(0, progressoVal));

        return `<li class="materia-item" style="display:flex; justify-space-between; align-items:center; margin-bottom: 12px; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 6px;">
            <div style="flex-grow: 1; margin-right: 12px;">
                <div class="materia-info" style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                    <span class="materia-nome" style="font-size: 0.9rem;">${nome}</span>
                    <span class="materia-progresso-txt" style="font-size: 0.85rem; color: #00e5ff; font-weight: bold;">${progresso}%</span>
                </div>
                <div class="progress-bar-bg" style="background:#222; height:6px; border-radius:3px; overflow:hidden;">
                    <div class="progress-bar-fill" style="width: ${progresso}%; background:#00e5ff; height:100%;"></div>
                </div>
            </div>
            <div style="display: flex; gap: 4px;">
                <button class="btn-icon btn-edit-materia" data-idx="${idx}" title="Editar"><i class="ph ph-pencil"></i></button>
                <button class="btn-icon btn-delete-materia" data-idx="${idx}" title="Excluir"><i class="ph ph-trash"></i></button>
            </div>
        </li>`;
    }).join('');

    // CARDS DE HORAS DIARIAS, TOTAIS E META SEMANAL:
    const horasHoje = Number(estudos.horasHoje) || 0;
    const horasTotais = Number(estudos.horasTotais) || 0;
    const metaSemanal = Number(estudos.metasHorasSemanal || estudos.metasHorasSemanais) || 0;

    return `
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">📚 Estudos & Matérias</h3>
            <button id="btn-add-materia" class="btn-icon"><i class="ph ph-plus"></i></button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px;">
            
            <!-- 1. HOJE -->
            <div id="btn-add-horas-hoje" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px; text-align: center; cursor: pointer;" title="Clique para somar ou redefinir horas de hoje">
                <span style="display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 0.7rem; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    HOJE <span style="font-size: 0.8rem; color: #00e5ff;"><i class="ph ph-pencil"></i></span>
                </span>
                <span style="display: block; font-size: 1.25rem; font-weight: 800; color: #00e5ff; margin-top: 4px;">${horasHoje} h</span>
            </div>

            <!-- 2. TOTAL SEMANAL -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px; text-align: center;">
                <span style="display: block; font-size: 0.7rem; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL SEMANAL</span>
                <span style="display: block; font-size: 1.25rem; font-weight: 800; color: #3b82f6; margin-top: 4px;">${horasTotais} h</span>
            </div>

            <!-- 3. META SEMANAL -->
            <div id="btn-edit-meta-horas" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px; text-align: center; cursor: pointer;" title="Clique para editar meta">
                <span style="display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 0.7rem; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    META SEMANAL <span style="font-size: 0.8rem; color: #22c55e;"><i class="ph ph-pencil"></i></span>
                </span>
                <span style="display: block; font-size: 1.25rem; font-weight: 800; color: #22c55e; margin-top: 4px;">${metaSemanal} h</span>
            </div>

        </div>

        <!-- LISTA DE MATÉRIAS -->
        <ul style="list-style: none; padding: 0; margin: 0;">
            ${materiasHTML.length > 0 ? materiasHTML : '<p style="color: #666; font-size: 0.85rem; text-align: center;">Nenhuma matéria cadastrada.</p>'}
        </ul>`;
}

// RENDER DE PROJETOS
export function renderProjetosCard(projetos = []) {
    const projetosList = Array.isArray(projetos) ? projetos : [];

    const projetosHTML = projetosList.map((proj, idx) => {
        const nome = escapeHTML(proj?.nome || 'Sem Nome');
        const status = escapeHTML(proj?.statusTag || 'Pendente');
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
                            <button class="btn-icon btn-edit-projeto" data-idx="${idx}" title="Editar"><i class="ph ph-pencil"></i></button>
                            <button class="btn-icon btn-delete-projeto" data-idx="${idx}" title="Excluir"><i class="ph ph-trash"></i></button>
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
                    <button id="btn-add-projeto" class="btn-icon" title="Novo Projeto"><i class="ph ph-plus"></i></button>
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
                <button class="btn-icon btn-edit-meta" data-meta-id="${id}" title="Editar"><i class="ph ph-pencil"></i></button>
                <button class="btn-icon btn-delete-meta" data-meta-id="${id}" title="Excluir"><i class="ph ph-trash"></i></button>
            </div>
        </li>`;
    }).join('');

    return `<div class="card card-metas">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>Metas da Semana</h3>
                    <button id="btn-add-meta" class="btn-icon" title="Adicionar Meta"><i class="ph ph-plus"></i></button>
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
    const categorias = [
        {chave: 'jogos', titulo: 'Jogos', icone: '<i class="ph ph-game-controller"></i>'},
        {chave: 'livros', titulo: 'Livros', icone: '<i class="ph ph-books"></i>'},
        {chave: 'filmes', titulo: 'Filmes', icone: '<i class="ph ph-film-reel"></i>'},
        {chave: 'series', titulo: 'Séries', icone: '<i class="ph ph-television-simple"></i>'}
    ];

    const colunasHTML = categorias.map(cat => {
        const itens = Array.isArray(lazer[cat.chave]) ? lazer[cat.chave] : [];

        const listHTML = itens.map((item, idx) => {
            let nome = '';
            let status = 'Em Andamento';

            if (typeof item === 'object' && item !== null) {
                nome = escapeHTML(item.nome || 'Sem nome');
                status = escapeHTML(item.status || 'Em Andamento');
            } else {
                const itemTxt = String(item);
                if (itemTxt.includes('Ativo')) {
                    nome = escapeHTML(itemTxt.replace('(Ativo)', '').replace('Ativo', '').trim());
                    status = 'Em Andamento';
                } else {
                    nome = escapeHTML(itemTxt);
                }
            }
            
            // DEFINIÇÃO DE COR DE STATUS:
            let statusColor = '#a855f7';
            if (status.toLowerCase().includes('conclu')) statusColor = '#00e5ff';
            if (status.toLowerCase().includes('pausd')) statusColor = '#eab308';

            return `<li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; background: rgba(255, 255, 255, 0.02); padding: 6px 8px; border-radius: 4px;">
                    <div style="display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0;">
                        <span style="font-size: 0.85rem; color: var(--text-primary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${nome}</span>
                        <span style="font-size: 0.68rem; color: ${statusColor}; font-weight: 600; text-transform: uppercase;">${status}</span>
                    </div>
                    <div style="display: flex; gap: 4px; flex-shrink: 0; align-items: center;">
                        <button class="btn-icon btn-edit-lazer" data-cat="${cat.chave}" data-idx="${idx}" title="Editar" style="font-size: 0.75rem; opacity: 0.7; cursor: pointer; background: transparent; border: none;"><i class="ph ph-pencil"></i></button>
                        <button class="btn-icon btn-delete-lazer" data-cat="${cat.chave}" data-idx="${idx}" title="Excluir" style="font-size: 0.75rem; opacity: 0.7; cursor: pointer; background: transparent; border: none;"><i class="ph ph-trash"></i></button>
                    </div>
                    </li>`;
        }).join('');

        return `<div class="lazer-column" style="background: rgba(255, 255, 255, 0.02); padding: 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
                    <h4 style="margin-bottom: 8px; font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                        <span>${cat.icone}</span> ${cat.titulo}
                    </h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${listHTML.length > 0 ? listHTML : '<li style="color: #555; font-size: 0.75rem; italic">Vazio</li>'}
                    </ul>
                </div>`;
        }).join('');

        return `<div class="card card-lazer">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Lazer & Mídia</h3>
                        <button id="btn-add-lazer" class="btn-icon" title="Adicionar Mídia"><i class="ph ph-plus"></i></button>
                    </div>
                    <div class="card-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px;">
                            ${colunasHTML}
                        </div>
                    </div>
                </div>`
}

// RENDER DO CARD DE STATUS DO SISTEMA NO DASHBOARD
export function renderStatusCard(systemStatus = 'Online') {
    const status = escapeHTML(systemStatus);

    let statusClass = 'text-success'; // Verde
    let statusLabel = 'Online';

    if (status === 'Ausente' || status === 'Warning') {
        statusClass = 'text-warning'; // Amarelo (ou ajuste a cor via estilo/classe)
        statusLabel = 'Ausente';
    } else if (status === 'Offline' || status === 'Focus') {
        statusClass = 'text-danger'; // Vermelho
        statusLabel = 'Offline';
    }

    // Mantém o HTML idêntico ao seu layout original
    return `<div class="card-icon"><i class="ph-bold ph-pulse"></i></div>
            <div class="card-data">
                <span class="stat-value ${statusClass}">${statusLabel}</span>
                <span class="stat-label">Status do Sistema</span>
            </div>`;
}

// RENDER DO PERFIL DA SIDEBAR
export function renderSidebarProfile(perfil = {}, systemStatus = 'Online') {
    const nome = escapeHTML(perfil.nome || 'Dev');
    const cargo = escapeHTML(perfil.cargo || 'System Operator');
    const status = escapeHTML(systemStatus).toLowerCase();

    // MAPEIA O STATUS PARA A CLASSE CSS EQUIVALENTE:
    let classeStatus = 'online';
    if (status === 'ausente' || status === 'warning') classeStatus = 'warning';
    if (status === 'offline') classeStatus = 'offline';

    return `<div class="user-status-card" id="user-profile-status" style="cursor: pointer;" title="Clique para alterar status">
        <div class="status-indicator ${classeStatus}"></div>
        <div class="user-info">
            <span class="user-name">${nome}</span>
            <span class="user-role">${cargo}</span>
        </div>
    </div>`;
}
