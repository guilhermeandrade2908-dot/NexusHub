// COMPONENTES INTERATIVOS NO HTML

// FUNÇÃO QUE RENDERIZA A TOP BAR (CABEÇALHO SUPERIOR):
export function renderHeader(perfil) {
    return `<div class="header-info">
                <div class="user-avatar-badge">${perfil.nome ? perfil.nome.charAt(0).toUpperCase() : 'U'}</div>
                <div>
                    <h1 class="header-title">${perfil.nome || 'Operador'}</h1>
                    <p class="header-subtitle">${perfil.cargo || 'System Operator'}</p>
                </div>
            </div>
            <div class="status-indicator">
                <span class="status-dot ${perfil.status || 'online'}></span>
                <span class="status-text">${(perfil.status || 'online').toUpperCase()}</span>
                <button id="btn-edit-header" class="btn-icon" title="Editar Status">✏️</button>
            </div>`;
}

// FUNÇÃO QUE RENDERIZA O CARD DE PERFIL E FOCO ATUAL:
export function renderPerfilCard(perfil) {
    const foco = perfil.focoAtual || {};
    return `<div class="card card-perfil">
                <div class="card-header">
                    <h3>Foco Atual</h3>
                    <button id="btn-edit-foco" class="btn-icon" title="Editar Foco">✏️</button>
                </div>
                <div class="card-body">
                    <span class="badge badge-accent">${foco.statusTag || 'Em Andamento'}</span>
                    <h4 class="foco-titulo">${foco.titulo || 'Sem Foco Definido'}</h4>
                    <p class="foco-descricao">${foco.descricao || 'Adicione um objetivo principal para o seu momento.'}</p>
                </div>
            </div>`;
}

// FUNÇÃO QUE RENDERIZA O CARD DO MÓDULO DE ESTUDOS:
export function renderEstudosCard(estudos) {
    const materias = estudos.materias || [];

    const materiasHTML = materias.map(materia => 
        `<li class="materia-item">
            <div class="materia-info">
                <span class="materia-home">${materia.nome}</span>
                <span class="materia-progresso-txt">${materia.progresso}%</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${materia.progresso}%"></div>
            </div>
        </li>`
    ).join('');

    return `<div class="card card-estudos">
                <div class="card-header">
                    <h3>Estudos</h3>
                    <button id="btn-add-materia" class="btn-icon" title="Adicionar Matéria">➕</button>
                </div>
                <div class="card-body">
                    <div class="estudos-stats">
                        <div class="stat-box">
                            <span class="stat-number">${estudos.horasTotais || 0}h</span>
                            <span class="stat-label">Horas Totais</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-number">${estudos.metasHorasSemanal || 0}h</span>
                            <span class="stat-label">Meta Semanal</span>
                        </div>
                    </div>
                    <ul class="materias-list">
                        ${materiasHTML,length > 0 ? materiasHTML : '<p class="empty-msg">Nenhuma matéria cadastrada.</p>'}
                    </ul>
                </div>
            </div>`;
}