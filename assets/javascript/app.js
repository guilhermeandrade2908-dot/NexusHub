// APP.JS - CONTROLLER GERAL

import { loadSystemData, saveSystemData } from './storage.js';
import {
    renderPerfilCard,
    renderPerfilPage,
    renderEstudosCard,
    renderProjetosCard,
    renderMetasCard,
    renderLazerCard,
    renderStatusCard,
    renderSidebarProfile
} from './components.js';

let state = loadSystemData();

// FUNÇÃO QUE INICIA O RELÓGIO:
function startClock() {
    const clockEl = document.getElementById('clock-display');
    if (!clockEl) return;
    const update = () => { clockEl.textContent = new Date().toLocaleTimeString('pt-BR'); };
    update();
    setInterval(update, 1000);
}

// FUNÇÃO QUE CHECA E DÁ O RESET DE HORAS DIARIAS DO SISTEMA:
function checkAndResetHorasDiarias(state) {
    if (!state.estudos) state.estudos = {};

    const agora = new Date();
    const horasAtual = agora.getHours();

    // DETERMINA A DATA DE CICLO DE ESTUDO ATUAL:
    const dataCiclo = new Date(agora);
    // SE AINDA NÃO FOR 5H DA MANHÃ, O CICLO ATUAL "PERTENCE" AO DIA DE ONTEM:
    if (horasAtual < 5) {
        dataCiclo.setDate(dataCiclo.getDate() - 1);
    }

    // FORMATA COMO ANO-MES-DIA PARA GUARDAR APENAS O DIA DO CICLO:
    const cicloString = dataCiclo.toISOString().split('T')[0];
    const ultimoReset = state.estudos.ultimoReset;

    // SE O CICLO ATUAL FOR DIFERENTE DO ÚLTIMO RESET REGISTRADO, ZERAMOS!
    if (ultimoReset !== cicloString) {
        state.estudos.horasHoje = 0;
        state.estudos.ultimoReset = cicloString;
        saveSystemData(state);
    }

    // DETERMINA O RESET SEMANAL
    const diaDaSemana = dataCiclo.getDay();
    const ultimoResetSemana = state.estudos.ultimoResetSemana;

    if (diaDaSemana === 1 && ultimoResetSemana !== cicloString) {
        state.estudos.horasTotais = 0;
        state.estudos.ultimoResetSemana = cicloString;
        saveSystemData(state);
    }
}

// FUNÇÃO QUE ATUALIZA A MUDANÇA AO CLICAR EM UM ELEMENTO DA SIDEBAR:
function switchView(viewName) {
    document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
    const activeLink = document.querySelector(`.sidebar-nav a[data-view="${viewName}"]`);
    if (activeLink && activeLink.parentElement) activeLink.parentElement.classList.add('active');

    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });

    const activeSection = document.getElementById(`view-${viewName}`);
    if (activeSection) {
        activeSection.classList.add('active');
        activeSection.style.display = '';
    }
}

// FUNÇÃO QUE RENDERIZA O SISTEMA
export function renderSystem() {
    const userNameEl = document.getElementById('user-display-name');
    if (userNameEl && state.perfil?.nome) userNameEl.textContent = state.perfil.nome;

    // STATS
    const statEstudos = document.querySelector('#stat-estudos .stat-value');
    if (statEstudos) statEstudos.textContent = `${state.estudos?.horasHoje || 0} h`;

    const statProjetos = document.querySelector('#stat-projetos .stat-value');
    if (statProjetos) statProjetos.textContent = Array.isArray(state.projetos) ? state.projetos.length : 0;

    const statMetas = document.querySelector('#stat-metas .stat-value');
    if (statMetas && Array.isArray(state.metas)) {
        const total = state.metas.length;
        const concluidas = state.metas.filter(m => m.concluida).length;
        statMetas.textContent = total > 0 ? `${Math.round((concluidas / total) * 100)}%` : '0%';
    }

    // CONTAINERS INJETADOS
    const focoEl = document.getElementById('foco-container');
    if (focoEl) focoEl.innerHTML = renderPerfilCard(state.perfil, state.projetos);

    const metasEl = document.getElementById('metas-container');
    if (metasEl) metasEl.innerHTML = renderMetasCard(state.metas);

    const estudosEl = document.getElementById('estudos-container');
    if (estudosEl) estudosEl.innerHTML = renderEstudosCard(state.estudos);

    const projetosEl = document.getElementById('projetos-container');
    if (projetosEl) projetosEl.innerHTML = renderProjetosCard(state.projetos);

    const lazerEl = document.getElementById('lazer-container');
    if (lazerEl) lazerEl.innerHTML = renderLazerCard(state.lazer);

    const perfilEl = document.getElementById('perfil-container');
    if (perfilEl) perfilEl.innerHTML = renderPerfilPage(state.perfil, state.systemStatus);

    // CARDS DE STATUS (COM CHECAGEM DE EXISTÊNCIA)
    const statusCardEl = document.getElementById('stat-status');
    if (statusCardEl) {
        statusCardEl.innerHTML = renderStatusCard(state.systemStatus);
    }

    const sidebarFooterEl = document.getElementById('sidebar-footer') || document.querySelector('.sidebar-footer');
    if (sidebarFooterEl) {
        sidebarFooterEl.innerHTML = renderSidebarProfile(state.perfil, state.systemStatus);
    }
}

// FUNÇÃO QUE "OUVE" OS EVENTOS DOM:
function attachEventListeners() {
    document.addEventListener('click', (e) => {
        const target = e.target;

        // Navegação
        const linkNav = target.closest('.sidebar-nav a');
        if (linkNav) {
            e.preventDefault();
            switchView(linkNav.getAttribute('data-view'));
            return;
        }

        // ESCOLHER FOCO A PARTIR DOS PROJETOS
        if (target.closest('#btn-select-foco')) {
            const projetos = Array.isArray(state.projetos) ? state.projetos : [];
            if (projetos.length === 0) {
                alert('Você ainda não tem projetos cadastrados! Crie um em "Projetos" primeiro.');
                return;
            }

            let opcoes = 'Escolha o número do projeto para definir como FOCO:\n';
            projetos.forEach((p, idx) => {
                opcoes += `${idx + 1}. ${p.nome}\n`;
            });

            const escolha = prompt(opcoes);
            const index = Number(escolha) - 1;

            if (!isNaN(index) && projetos[index]) {
                const proj = projetos[index];
                if (!state.perfil) state.perfil = {};
                state.perfil.focoAtual = {
                    titulo: proj.nome,
                    descricao: proj.descricao,
                    statusTag: proj.status
                };
                saveSystemData(state);
                renderSystem();
            }
            return;
        }

        // EDITAR PERFIL
        if (target.closest('#btn-edit-perfil')) {
            const nome = prompt('Seu Nome:', state.perfil?.nome || '');
            const cargo = prompt('Seu Cargo/Função:', state.perfil?.cargo || '');
            const bio = prompt('Sua Bio:', state.perfil?.bio || '');
            if (nome) {
                state.perfil = { ...state.perfil, nome, cargo, bio };
                saveSystemData(state);
                renderSystem();
            }
            return;
        }

        // ESTUDOS (ADD / EDIT / DELETE)
        if (target.closest('#btn-add-materia')) {
            const nome = prompt('Nome da Matéria:');
            if (nome) {
                const progresso = prompt('Progresso (%):', '0');
                if (!state.estudos.materias) state.estudos.materias = [];
                state.estudos.materias.push({ nome, progresso: Number(progresso) || 0 });
                saveSystemData(state);
                renderSystem();
            }
            return;
        }

        const btnEditMat = target.closest('.btn-edit-materia');
        if (btnEditMat) {
            const idx = btnEditMat.getAttribute('data-idx');
            const mat = state.estudos.materias[idx];
            const novoNome = prompt('Editar Matéria:', mat.nome);
            const novoProg = prompt('Editar Progresso (%):', mat.progresso);
            if (novoNome) {
                state.estudos.materias[idx] = { nome: novoNome, progresso: Number(novoProg) || 0 };
                saveSystemData(state);
                renderSystem();
            }
            return;
        }

        const btnDelMat = target.closest('.btn-delete-materia');
        if (btnDelMat) {
            const idx = btnDelMat.getAttribute('data-idx');
            state.estudos.materias.splice(idx, 1);
            saveSystemData(state);
            renderSystem();
            return;
        }

        if (target.closest('#btn-add-horas-hoje')) {
            const horasHoje = Number(state.estudos?.horasHoje) || 0;
            const horasTotais = Number(state.estudos?.horasTotais) || 0;

            const mensagem = `Estudadas Hoje: ${horasHoje}h | Total Semanal: ${horasTotais}h\n\nEscolha uma opção:\n1 - Somar horas estudadas hoje\n2 - Redefinir horas de HOJE`;
            const opcao = prompt(mensagem, '1')?.trim();

            if (!opcao) return;

            if (!state.estudos) state.estudos = {};

            if (opcao === '1') {
                const inputAdd = prompt('Quantas horas você estudou hoje?', '1');
                const numAdd = Number(inputAdd);

                if (inputAdd !== null && !isNaN(numAdd) && numAdd > 0) {
                    state.estudos.horasHoje = horasHoje + numAdd;
                    state.estudos.horasTotais = horasTotais + numAdd;
                    saveSystemData(state);
                    renderSystem();
                }
            } else if (opcao === '2') {
                const inputHoje = prompt('Digite o novo valor de horas para HOJE:', horasHoje);
                const numHoje = Number(inputHoje);

                if (inputHoje !== null && !isNaN(numHoje) && numHoje >= 0) {
                    const diff = numHoje - horasHoje;
                    state.estudos.horasHoje = numHoje;
                    state.estudos.horasTotais = Math.max(0, horasTotais + diff);
                    saveSystemData(state);
                    renderSystem();
                }
            }

            return;
        }

        if (target.closest('#btn-edit-meta-horas')) {
            const atual = state.estudos?.metasHorasSemanal || state.estudos?.metasHorasSemanais || 0;
            const novaMeta = prompt('Defina sua Meta Semanal de horas: ', atual);
            const numMeta = Number(novaMeta);

            if (!isNaN(numMeta) && numMeta >= 0) {
                if (!state.estudos) state.estudos = {};
                state.estudos.metasHorasSemanal = numMeta;
                state.estudos.metasHorasSemanais = numMeta; // PARA MANTER COMPATIBILIDADE DE CHAVE
                saveSystemData(state);
                renderSystem()
            }
            return;
        }

        // PROJETOS (ADD / EDIT / DELETE)
        if (target.closest('#btn-add-projeto')) {
            const nome = prompt('Nome do Projeto:');
            if (nome) {
                const descricao = prompt('Descrição:') || '';
                const status = prompt('Status:', 'Em Desenvolvimento') || 'Em Desenvolvimento';
                if (!Array.isArray(state.projetos)) state.projetos = [];
                state.projetos.push({ id: Date.now().toString(), nome, descricao, status });
                saveSystemData(state);
                renderSystem();
            }
            return;
        }

        const btnEditProj = target.closest('.btn-edit-projeto');
        if (btnEditProj) {
            const idx = Number(btnEditProj.getAttribute('data-idx'));
            const proj = state.projetos[idx];
            const nome = prompt('Nome do Projeto:', proj.nome);
            const descricao = prompt('Descrição:', proj.descricao);
            const status = prompt('Status:', proj.status);
            if (nome) {
                const nomeAntigo = proj.nome;
                state.projetos[idx] = {...proj, nome, descricao, status};
                
                if (state.perfil?.focoAtual?.titulo === nomeAntigo) {
                    state.perfil.focoAtual = {
                        titulo: nome,
                        descricao: descricao,
                        statusTag: status
                    };
                }
                
                saveSystemData(state);
                renderSystem();
            }
            return;
        }

        const btnDelProj = target.closest('.btn-delete-projeto');
        if (btnDelProj) {
            const idx = Number(btnDelProj.getAttribute('data-idx'));
            const projDeletado = state.projetos[idx];

            if (projDeletado && state.perfil?.focoAtual?.titulo === projDeletado.nome) {
                delete state.perfil.focoAtual;
            }

            state.projetos.splice(idx, 1);
            saveSystemData(state);
            renderSystem();
            return;
        }

        // LAZER (ADD | EDIT | DELETE)
        if (target.closest('#btn-add-lazer')) {
            const catOpcoes = '1 - Jogos\n2 - Livros\n3 - Filmes\n4 - Séries';
            const escolhaCat = prompt(`Escolha a categoria:\n${catOpcoes}`, '1');

            const mapaCategorias = {
                '1': 'jogos',
                '2': 'livros',
                '3': 'filmes',
                '4': 'series'
            };

            const catChave = mapaCategorias[escolhaCat?.trim()];

            if (catChave) {
                const nome = prompt('Nome do item/mídia:');
                if (nome && nome.trim()) {
                    const statusOpcoes = '1 - Em Andamento\n2 - Concluído\n3 - Pausado';
                    const escolhaStatus = prompt(`Status atual:\n${statusOpcoes}`, '1');

                    const statusLimpo = escolhaStatus?.trim();
                    let statusTxt = 'Em Andamento';
                    if (escolhaStatus === '2') statusTxt = 'Concluído';
                    if (escolhaStatus === '3') statusTxt = 'Pausado';

                    if (!state.lazer) state.lazer = {};
                    if (!Array.isArray(state.lazer[catChave])) state.lazer[catChave] = [];

                    state.lazer[catChave].push({
                        nome: nome.trim(),
                        status: statusTxt
                    });

                    saveSystemData(state);
                    renderSystem();
                }
            } else if (escolhaCat !== null) {
                alert('Categoria inválida!');
            }
            return;
        }
        
        const btnEditLazer = target.closest('.btn-edit-lazer');
        if (btnEditLazer) {
            const cat = btnEditLazer.getAttribute('data-cat');
            const idx = Number(btnEditLazer.getAttribute('data-idx'));

            if (state.lazer && Array.isArray(state.lazer[cat]) && state.lazer[cat][idx]) {
                const itemAtual = state.lazer[cat][idx];

                // TRATA ITEM ANTIGO (STRING) OU NOVO (OBJETO)
                const nomeAtual = typeof itemAtual === 'object' ? itemAtual.nome : String(itemAtual);
                const statusAtual = typeof itemAtual === 'object' ? itemAtual.status : 'Em Andamento';

                const novoNome = prompt('Editar nome da mídia/item:', nomeAtual);
                if (novoNome && novoNome.trim()) {
                    const statusOpcoes = '1 - Em Andamento\n2 - Concluído\n3 - Pausado';
                    const escolhaStatus = prompt(`Status atual: (${statusAtual})\nEscolha o novo status:\n${statusOpcoes}`, '1');

                    const statusLimpado = escolhaStatus?.trim();
                    let novoStatus = statusAtual;
                    if (statusLimpado === '1') novoStatus = 'Em Andamento';
                    if (statusLimpado === '2') novoStatus = 'Concluído';
                    if (statusLimpado === '3') novoStatus = 'Pausado';

                    // SALVA ATUALIZADO NO FORMATO OBJETO
                    state.lazer[cat][idx] = {
                        nome: novoNome.trim(),
                        status: novoStatus
                    };

                    saveSystemData(state);
                    renderSystem();
                }
            }
            return;
        }

        const btnDelLazer = target.closest('.btn-delete-lazer');
        if (btnDelLazer) {
            const cat = btnDelLazer.getAttribute('data-cat');
            const idx = Number(btnDelLazer.getAttribute('data-idx'));
            
            if (state.lazer && Array.isArray(state.lazer[cat])) {
                state.lazer[cat].splice(idx, 1);
                saveSystemData(state);
                renderSystem();
            }
            return;
        }

        // METAS (CHECK / EDIT / DELETE / ADD)
        if (target.closest('#btn-add-meta')) {
            const texto = prompt('Nova Meta:');
            if (texto) {
                if (!Array.isArray(state.metas)) state.metas = [];
                state.metas.push({ id: Date.now().toString(), texto, concluida: false });
                saveSystemData(state);
                renderSystem();
            }
            return;
        }

        const btnEditMeta = target.closest('.btn-edit-meta');
        if (btnEditMeta) {
            const id = btnEditMeta.getAttribute('data-meta-id');
            const meta = state.metas.find(m => String(m.id) === String(id));
            const texto = prompt('Editar Meta:', meta.texto);
            if (texto) {
                meta.texto = texto;
                saveSystemData(state);
                renderSystem();
            }
            return;
        }

        const btnDelMeta = target.closest('.btn-delete-meta');
        if (btnDelMeta) {
            const id = btnDelMeta.getAttribute('data-meta-id');
            state.metas = state.metas.filter(m => String(m.id) !== String(id));
            saveSystemData(state);
            renderSystem();
            return;
        }

        if (target.matches('.checkbox-container input[type="checkbox"]')) {
            const id = target.getAttribute('data-meta-id');
            const meta = state.metas.find(m => String(m.id) === String(id));
            if (meta) {
                meta.concluida = target.checked;
                saveSystemData(state);
                renderSystem();
            }
            return;
        }

        // ALTERAR STATUS DO SISTEMA (ONLINE | AUSENTE | OFFLINE)
        if (target.closest('#stat-status') || target.closest('#btn-change-status') || target.closest('#user-profile-status')) {
            const opcao = prompt('Alterar status do sistema\n1 - Online\n2 - Ausente\n3 - Offline', '1');

            let novoStatus = 'Online';
            if(opcao?.trim() === '2') novoStatus = 'Ausente';
            if (opcao?.trim() === '3') novoStatus = 'Offline';

            if (opcao !== null) {
                state.systemStatus = novoStatus;
                saveSystemData(state);
                renderSystem();
            }
            return;
        }
    });
}

// INICIALIZADOR DO SISTEMA
document.addEventListener('DOMContentLoaded', () => {
    checkAndResetHorasDiarias(state)
    startClock();
    renderSystem();
    attachEventListeners();
});

// SE O USUÁRIO DEIXAR A ABA ABERTA DE MADRUGADA E VOLTAR PELA MANHÃ, O CICLO RESETA
window.addEventListener('focus', () => {
    checkAndResetHorasDiarias(state);
    renderSystem();
});
