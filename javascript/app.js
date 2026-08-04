// APP.JS - CONTROLLER GERAL

import {loadSystemData, saveSystemData, salvarPerfilAPI, salvarProjetosAPI, deletarProjetoAPI, salvarEstudosAPI, deletarEstudosAPI, carregarMetasAPI, salvarMetasAPI, deletarMetaAPI} from './storage.js';
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

// ESTADO INICIAL DO SISTEMA
let state = loadSystemData();

// FUNÇÃO DO MODAL GLOBAL:
function customModal({title, message = '', defaultValue = '', type='text', options = null, isConfirm = false, isDanger = false}) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-modal-overlay');
        const titleEl = document.getElementById('modal-title');
        const bodyEl = document.getElementById('modal-body');

        if (!overlay || !titleEl || !bodyEl) {
            console.error('Estrutura do modal customizado não encontrada no DOM!');
            return resolve(null);
        }

        titleEl.textContent = title;

        const safeDefaultValue = String(defaultValue).replace(/"/g, '&quot;');

        let inputHTML = '';

        if (!isConfirm) {
            if (options && Array.isArray(options)) {
                // RENDERIZA UM DROPDOWN / SELECT:
                const opts = options.map(o => `<option value="${o.value}" ${String(o.value) === String(defaultValue) ? 'selected' : ''}>${o.label}</option>`).join('');
                inputHTML = `<select id="custom-prompt-input">${opts}</select>`;
            } else if (type === 'textarea') {
                // RENDERIZA CAIXA DE TEXTO MULTILINHA:
                inputHTML = `<textarea id="custom-prompt-input" rows="4">${safeDefaultValue}</textarea>`;
            } else {
                // RENDERIZA INPUT PADRÃO:
                inputHTML = `<input type="${type}" id="custom-prompt-input" value="${safeDefaultValue}">`;
            }
        }

        const confirmBtnClass = isDanger ? 'btn-modal-danger' : 'btn-modal-primary';
        const confirmBtnText = isConfirm ? (isDanger ? 'Sim, Excluir' : 'Confirmar') : 'Confirmar';
        
        bodyEl.innerHTML = `${message ? `<p style="color: #ccc; font-size: 0.9rem; margin-top: 0; margin-bottom: 12px; line-height: 1.4;">${message}</p>` : ''}
                            ${inputHTML}
                            <div class="modal-actions">
                                <button id="custom-prompt-cancel" class="btn-modal-secondary">Cancelar</button>
                                <button id="custom-prompt-ok" class="${confirmBtnClass}">${confirmBtnText}</button>
                            </div>`;
        
        overlay.classList.remove('hidden');

        const input = document.getElementById('custom-prompt-input');
        const btnOk = document.getElementById('custom-prompt-ok');
        const btnCancel = document.getElementById('custom-prompt-cancel');
        const closeBtn = document.getElementById('modal-close-btn');

        if (input) {
            setTimeout(() => {
                input.focus();
                if (input.select && type !== 'number') input.select();
            }, 50);
        }

        function cleanUp() {
            overlay.classList.add('hidden');
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
            overlay.removeEventListener('click', onOverlayClick);
            if (closeBtn) closeBtn.removeEventListener('click', onCancel);
            if (input) input.removeEventListener('keydown', onKeyDown);
        }

        function onOk() {
            const val = isConfirm ? true : input.value;
            cleanUp();
            resolve(val);
        }

        function onCancel() {
            cleanUp();
            resolve(isConfirm ? false : null);
        }

        function onOverlayClick(e) {
            if (e.target === overlay) onCancel();
        }

        function onKeyDown(e) {
            if (e.key === 'Enter' && type !== 'textarea') onOk();
            if (e.key === 'Escape') onCancel();
        }

        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
        overlay.addEventListener('click', onOverlayClick);
        if (closeBtn) closeBtn.addEventListener('click', onCancel);
        if (input) input.addEventListener('keydown', onKeyDown);
    });
}

// FUNÇÃO QUE INICIA O RELÓGIO:
function startClock() {
    const clockEl = document.getElementById('clock-display');
    if (!clockEl) return;
    const update = () => { clockEl.textContent = new Date().toLocaleTimeString('pt-BR'); };
    update();
    setInterval(update, 1000);
}

// FUNÇÃO QUE CHECA E DÁ O RESET DE HORAS DIARIAS E SEMANAIS DO SISTEMA:
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

    // SE O CICLO ATUAL FOR DIFERENTE DO ÚLTIMO RESET REGISTRADO, ZERAMOS:
    if (ultimoReset !== cicloString) {
        state.estudos.horasHoje = 0;
        state.estudos.ultimoReset = cicloString;
        saveSystemData(state);
    }

    // RESET SEMANAL (SEGUNDA-FEIRA):
    const diaDaSemana = dataCiclo.getDay();
    const ultimoResetSemana = state.estudos.ultimoResetSemana;

    if (diaDaSemana === 1 && ultimoResetSemana !== cicloString) {
        state.estudos.horasTotais = 0;
        state.estudos.ultimoResetSemana = cicloString;
        saveSystemData(state);

        // Atualiza o banco junto com o reset semanal:
        const primeiraMateria = state.estudos.materias?.[0];
        if (primeiraMateria?.id) {
            salvarEstudosAPI({
                id: primeiraMateria.id,
                materia: primeiraMateria.nome,
                horasHoje: 0,
                horasTotais: 0,
                metaHorasSemanal: Number(state.estudos.metasHorasSemanal) || 0,
                ultimaAtualizacao: new Date().toISOString()
            });
        }
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
    document.addEventListener('click', async (e) => {
        const target = e.target;

        // NAVEGAÇÃO
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
                await customModal({
                    title: 'Aviso',
                    message: 'Você ainda não tem projetos cadastrados! Crie um na aba "Projetos" primeiro.',
                    isConfirm: true
                });
                return;
            }

            const opcoes = projetos.map((p, idx) => ({
                value: String(idx),
                label: `${p.nome} (${p.statusTag || 'Sem status'})`
            }));

            const escolha = await customModal({
                title: 'Escolher Foco Atual',
                message: 'Selecione o projeto que será seu foco principal:',
                options: opcoes
            });
            
            if (escolha !== null && escolha !== undefined) {
                const proj = projetos[Number(escolha)];
                if (proj) {
                    if (!state.perfil) state.perfil = {};
                    state.perfil.focoAtual = {
                        titulo: proj.nome,
                        descricao: proj.descricao,
                        statusTag: proj.statusTag
                    };
                    saveSystemData(state);
                    renderSystem();
                }
            }
            return;
        }

        // EDITAR PERFIL
        if (target.closest('#btn-edit-perfil')) {
            const nome = await customModal({
                title: 'Seu Nome',
                message: 'Digite o seu nome de usuário:',
                defaultValue: state.perfil?.nome || ''
            });
            if (nome === null) return;

            const cargo = await customModal({
                title: 'Seu Cargo',
                message: 'Digite sua profissão ou área de atuação:',
                defaultValue: state.perfil?.cargo || ''
            });
            if (cargo === null) return;

            const bio = await customModal({
                title: 'Sua Bio',
                message: 'Escreva uma breve apresentação sobre você',
                defaultValue: state.perfil?.bio || '',
                type: 'textarea'
            });
            if (bio === null) return;

            state.perfil = {...state.perfil, nome, cargo, bio};
            saveSystemData(state);
            await salvarPerfilAPI(state.perfil);
            renderSystem();
            return;
        }

        // ESTUDOS (ADD / EDIT / DELETE)
    if (target.closest('#btn-add-materia')) {
        const nome = await customModal({
            title: 'Nova Matéria',
            message: 'Digite o nome da matéria:'
        });
        if (!nome?.trim()) return;
        
        const progressoInput = await customModal({
            title: 'Progresso Inicial',
            message: `Qual a porcentagem já concluída de "${nome.trim()}"?`,
            defaultValue: '0',
            type: 'number'
        });
        if (progressoInput === null) return;

        const progressoNum = Math.min(100, Math.max(0, Number(progressoInput) || 0));

        if (!state.estudos) state.estudos = { materias: [] };
        if (!Array.isArray(state.estudos.materias)) state.estudos.materias = [];

        const payloadBackend = {
            id: 0,
            materia: nome.trim(),
            progresso: progressoNum,
            horasHoje: Number(state.estudos.horasHoje) || 0,
            horasTotais: Number(state.estudos.horasTotais) || 0,
            metaHorasSemanal: Number(state.estudos.metaHorasSemanal || state.estudos.metasHorasSemanal) || 0,
            ultimaAtualizacao: new Date().toISOString()
        };

        const retBackend = await salvarEstudosAPI(payloadBackend);

        state.estudos.materias.push({
            id: retBackend?.id || Date.now(),
            nome: nome.trim(),
            progresso: progressoNum
        });

        saveSystemData(state);
        renderSystem();
        return;
    }

    const btnEditMat = target.closest('.btn-edit-materia');
    if (btnEditMat) {
        const idx = Number(btnEditMat.getAttribute('data-idx'));
        const mat = state.estudos?.materias?.[idx];
        if (!mat) return;

        const novoNome = await customModal({
            title: 'Editar Matéria',
            message: 'Altere o nome da matéria:',
            defaultValue: mat.nome
        });
        if (novoNome === null) return;

        const novoProg = await customModal({
            title: 'Editar Progresso (%)',
            message: 'Altere o percentual concluído:',
            defaultValue: mat.progresso,
            type: 'number'
        });
        if (novoProg === null) return;

        const nomeFinal = novoNome.trim() || mat.nome;
        const progFinal = Math.min(100, Math.max(0, Number(novoProg) || 0));

        if (mat.id) {
            
            await salvarEstudosAPI({
                id: mat.id,
                materia: nomeFinal,
                progresso: progFinal,
                horasHoje: Number(state.estudos.horasHoje) || 0,
                horasTotais: Number(state.estudos.horasTotais) || 0,
                metaHorasSemanal: Number(state.estudos.metaHorasSemanal || state.estudos.metasHorasSemanal) || 0,
                ultimaAtualizacao: new Date().toISOString()
            });
        }

        state.estudos.materias[idx] = {
            ...mat,
            nome: nomeFinal,
            progresso: progFinal
        };

        saveSystemData(state);
        renderSystem();
        return;
    }

    const btnDelMat = target.closest('.btn-delete-materia');
    if (btnDelMat) {
        const idx = Number(btnDelMat.getAttribute('data-idx'));
        const mat = state.estudos?.materias?.[idx];
        if (!mat) return;

        const confirmou = await customModal({
            title: 'Excluir Matéria',
            message: `Tem certeza que deseja remover a matéria <strong>"${mat.nome}"</strong>?`,
            isConfirm: true,
            isDanger: true
        });

        if (confirmou) {
            if (mat.id) {
                await deletarEstudosAPI(mat.id);
            }
            state.estudos.materias.splice(idx, 1);
            saveSystemData(state);
            renderSystem();
        }
        return;
    }

    if (target.closest('#btn-add-horas-hoje')) {
        if (!state.estudos) state.estudos = {};

        const horasHojeAntigo = Number(state.estudos.horasHoje) || 0;

        const opcao = await customModal({
            title: 'Horas Diárias',
            message: `<strong>Hoje: ${horasHojeAntigo}h</strong><br>Escolha uma opção:`,
            options: [
                { value: '1', label: '1 - Somar horas estudadas hoje' },
                { value: '2', label: '2 - Redefinir horas de Hoje' }
            ]
        });

        if (!opcao) return;

        let novasHorasHoje = horasHojeAntigo;

        if (opcao === '1') {
            const inputAdd = await customModal({
                title: 'Somar Horas',
                message: 'Quantas horas você estudou hoje?',
                defaultValue: '1',
                type: 'number'
            });
            const numAdd = Number(inputAdd);

            if (inputAdd !== null && !isNaN(numAdd) && numAdd > 0) {
                novasHorasHoje = horasHojeAntigo + numAdd;
            }
        } else if (opcao === '2') {
            const inputHoje = await customModal({
                title: 'Redefinir Horas de Hoje',
                message: 'Digite o novo valor total de horas para HOJE:',
                defaultValue: horasHojeAntigo,
                type: 'number'
            });
            const numHoje = Number(inputHoje);

            if (inputHoje !== null && !isNaN(numHoje) && numHoje >= 0) {
                novasHorasHoje = numHoje;
            }
        }

        if (novasHorasHoje !== horasHojeAntigo) {
            const diff = novasHorasHoje - horasHojeAntigo;

            state.estudos.horasHoje = novasHorasHoje;

            const totalSemanalAntigo = Number(state.estudos.horasTotais) || 0;
            state.estudos.horasTotais = Math.max(0, totalSemanalAntigo + diff);

            const primeiraMateria = state.estudos.materias?.[0];
            if (primeiraMateria?.id) {
                await salvarEstudosAPI({
                    id: primeiraMateria.id,
                    materia: primeiraMateria.nome,
                    progresso: Number(primeiraMateria.progresso) || 0,
                    horasHoje: novasHorasHoje,
                    horasTotais: state.estudos.horasTotais,
                    metaHorasSemanal: Number(state.estudos.metaHorasSemanal || state.estudos.metasHorasSemanal) || 0,
                    ultimaAtualizacao: new Date().toISOString()
                });
            }

            saveSystemData(state);
            renderSystem();
        }
        return;
    }

    if (target.closest('#btn-edit-meta-horas')) {
        const atual = state.estudos?.metaHorasSemanal || state.estudos?.metasHorasSemanal || 0;
        const novaMeta = await customModal({
            title: 'Meta Semanal de Horas',
            message: 'Digite a sua nova meta semanal em horas:',
            defaultValue: atual,
            type: 'number'
        });

        const numMeta = Number(novaMeta);
        if (novaMeta !== null && !isNaN(numMeta) && numMeta >= 0) {
            if (!state.estudos) state.estudos = {};
            state.estudos.metaHorasSemanal = numMeta;
            state.estudos.metasHorasSemanal = numMeta;
            
            const primeiraMateria = state.estudos.materias?.[0];
            if (primeiraMateria?.id) {
                await salvarEstudosAPI({
                    id: primeiraMateria.id,
                    materia: primeiraMateria.nome,
                    progresso: Number(primeiraMateria.progresso) || 0, 
                    horasHoje: Number(state.estudos.horasHoje) || 0,
                    horasTotais: Number(state.estudos.horasTotais) || 0,
                    metaHorasSemanal: numMeta,
                    ultimaAtualizacao: new Date().toISOString()
                });
            }
            
            saveSystemData(state);
            renderSystem();
        }
        return;
    }

        // PROJETOS (ADD / EDIT / DELETE)
        if (target.closest('#btn-add-projeto')) {
            const nome = await customModal({
                title: 'Novo Projeto',
                message: 'Digite o nome do projeto:',
            });
            if (!nome?.trim()) return;

            const descricao = await customModal({
                title: 'Descrição do Projeto',
                message: 'Descreva brevemente o projeto:',
                type: 'textarea'
            }) || '';

            const status = await customModal({
                title: 'Status do Projeto',
                message: 'Selecione o status atual do projeto:',
                options: [
                    {value: 'Em Desenvolvimento', label: 'Em Desenvolvimento'},
                    {value: 'Planejamento', label: 'Planejamento'},
                    {value: 'Concluído', label: 'Concluído'},
                    {value: 'Pausado', label: 'Pausado'}
                ]
            }) || 'Em Desenvolvimento';

            // ENVIA PARA A API NO C# (MYSQL GERA O ID AUTO-INCREMENTADO):
            const novoProjeto = {
                nome: nome.trim(),
                descricao: descricao.trim(),
                statusTag: status
            };

            // ENVIA PARA O MYSQL VIA C#:
            await salvarProjetosAPI(novoProjeto);

            // RECARREGA OS DADOS DO MYSQL PARA OBTER O ESTADO ATUALIZADO COM OS IDS REAIS DO BANCO:
            state = await loadSystemData();
            renderSystem();
            return;
        }

        const btnEditProj = target.closest('.btn-edit-projeto');
        if (btnEditProj) {
            const idx = Number(btnEditProj.getAttribute('data-idx'));
            const proj = state.projetos[idx];
            if (!proj) return;

            const novoNome = await customModal({
                title: 'Editar Projeto',
                message: 'Altere o nome do projeto:',
                defaultValue: proj.nome
            });
            if (novoNome === null) return;

            const novaDescricao = await customModal({
                title: 'Editar Descrição',
                message: 'Altere a descrição do projeto:',
                defaultValue: proj.descricao,
                type: 'textarea'
            });
            if (novaDescricao === null) return;

            const novoStatus = await customModal({
                title: 'Editar Status',
                message: 'Selecione o novo status:',
                defaultValue: proj.statusTag,
                options: [
                    {value: 'Em Desenvolvimento', label: 'Em Desenvolvimento'},
                    {value: 'Planejamento', label: 'Planejamento'},
                    {value: 'Concluído', label: 'Concluído'},
                    {value: 'Pausado', label: 'Pausado'}
                ]
            });
            if (novoStatus === null) return;

            const projAtualizado = {
                id: proj.id,
                nome: novoNome.trim() || proj.nome,
                descricao: novaDescricao.trim(),
                statusTag: novoStatus
            };

            // ENVIA ATUALIZAÇÃO (PUT) PARA O MYSQL:
            await salvarProjetosAPI(projAtualizado);

            // RECARREGA OS DADOS ATUALIZADOS DO BANCO:
            state = await loadSystemData();
            renderSystem();
            return;
        }

        const btnDelProj = target.closest('.btn-delete-projeto');
        if (btnDelProj) {
            const idx = Number(btnDelProj.getAttribute('data-idx'));
            const projDeletado = state.projetos[idx];

            if (!projDeletado) return;

            const confirmou = await customModal({
                title: 'Excluir Projeto',
                message: `Deseja realmente excluir o projeto <strong>"${projDeletado.nome}"</strong>?`,
                isConfirm: true,
                isDanger: true
            });

            if (confirmou) {
                // SE O PROJETO TIVER ID NO BANCO, CHAMA A ROTA DE DELETE:
                if (projDeletado.id) {
                    await deletarProjetoAPI(projDeletado.id);
                }

                // RECARREGA OS DADOS ATUALIZADOS DO BANCO;
                state = await loadSystemData();
                renderSystem();
            }
            return;
        }

        // LAZER (ADD | EDIT | DELETE)
        if (target.closest('#btn-add-lazer')) {
            const catChave = await customModal({
                title: 'Adicionar Lazer',
                message: 'Selecione a categoria da mídia:',
                options: [
                    {value: 'jogos', label: 'Jogos'},
                    {value: 'livros', label: 'Livros'},
                    {value: 'filmes', label: 'Filmes'},
                    {value: 'series', label: 'Séries'}
                ]
            });

            if (catChave) {
                const nome = await customModal({
                    title: 'Nome do Item',
                    message: 'Digite o nome da mídia:'
                });

                if (nome && nome.trim()) {
                    const statusTxt = await customModal({
                        title: 'Status Inicial',
                        message:'Qual a situação atual?',
                        options: [
                            {value: 'Em Andamento', label: 'Em Andamento'},
                            {value: 'Concluído', label: 'Concluído'},
                            {value: 'Pausado', label: 'Pausado'}
                        ]
                    }) || 'Em Andamento';

                    if (!state.lazer) state.lazer = {};
                    if (!Array.isArray(state.lazer[catChave])) state.lazer[catChave] = [];

                    state.lazer[catChave].push({
                        nome: nome.trim(),
                        status: statusTxt
                    });

                    saveSystemData(state);
                    renderSystem();
                }
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

                const novoNome = await customModal({
                    title: 'Editar Item de Lazer',
                    message: 'Atualize o nome do item:',
                    defaultValue: nomeAtual
                });

                if (novoNome && novoNome.trim()) {
                    const novoStatus = await customModal({
                        title: 'Atualizar Status',
                        message: 'Selecione o novo status:',
                        defaultValue: statusAtual,
                        options: [
                            {value: 'Em Andamento', label: 'Em Andamento'},
                            {value: 'Concluído', label: 'Concluído'},
                            {value: 'Pausado', label: 'Pausado'}
                        ]
                    }) || statusAtual;

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
            
            if (state.lazer && Array.isArray(state.lazer[cat]) && state.lazer[cat][idx]) {
                    const item = state.lazer[cat][idx];
                    const itemNome = typeof item === 'object' ? item.nome : String(item);

                    const confirmou = await customModal({
                        title: 'Remover Item',
                        message: `Deseja realmente remover o item <strong>"${itemNome}"</strong> da sua lista?`,
                        isConfirm: true,
                        isDanger: true
                    });

                    if (confirmou) {
                        state.lazer[cat].splice(idx, 1);
                        saveSystemData(state);
                        renderSystem();
                    }
            }
            return;
        }

        // METAS (CHECK / EDIT / DELETE / ADD)
if (target.closest('#btn-add-meta')) {
    const texto = await customModal({
        title: 'Nova Meta',
        message: 'Digite a descrição da meta:'
    });

    if (texto && texto.trim()) {
        if (!Array.isArray(state.metas)) state.metas = [];

        // envia para o banco de dados (ID 0 para criar)
        const retBackend = await salvarMetasAPI({
            id: 0,
            texto: texto.trim(),
            concluida: false
        });

        // usa o ID númerico que veio do banco
        const idGerado = retBackend?.id || retBackend?.Id;

        // atualiza o estado local com o ID correto retornado
        if (idGerado) {
            state.metas.push({
                id: idGerado,
                texto: texto.trim(),
                concluida: false
            });

            saveSystemData(state);
            renderSystem();
        } else {
            console.error('Erro: O banco não retornou o ID da nova meta.');
        }
    }
    return;
}

        const btnEditMeta = target.closest('.btn-edit-meta');
        if (btnEditMeta) {
            const id = btnEditMeta.getAttribute('data-meta-id');
            const meta = state.metas.find(m => String(m.id) === String(id));
            if (!meta) return;

            const texto = await customModal({
                title: 'Editar Meta',
                message: 'Altere a descrição da meta:',
                defaultValue: meta.texto
            });

            if (texto && texto.trim()) {
                const idNumerico = Number(meta.id);

                // garante ID númerico igual no body e no parâmetro 
                const atualizou = await salvarMetasAPI({
                    id: idNumerico,
                    texto: texto.trim(),
                    concluida: Boolean(meta.concluida)
                });
                if (atualizou !== null) {
                    meta.texto = texto.trim();
                    saveSystemData(state);
                    renderSystem();
                }
            }
            return;
    }

        const btnDelMeta = target.closest('.btn-delete-meta');
        if (btnDelMeta) {
            const id = btnDelMeta.getAttribute('data-meta-id');
            const meta = state.metas?.find(m => String(m.id) === String(id));

            if (!meta) return;

            const confirmou = await customModal({
                title: 'Excluir Meta',
                message: `Remover a meta <strong>"${meta.texto}"</strong>?`,
                isConfirm: true,
                isDanger: true
            });

            if (confirmou) {
                const idNumerico = Number(id);
                if (idNumerico) {
                    await deletarMetaAPI(idNumerico);
                }

                state.metas = state.metas.filter(m => String(m.id) !== String(id));
                saveSystemData(state);
                renderSystem();
            }
            return;
        }

        if (target.matches('.checkbox-container input[type="checkbox"]')) {
            const id = target.getAttribute('data-meta-id');
            const meta = state.metas.find(m => String(m.id) === String(id));
            if (meta) {
                const novoStatus = target.checked;
                const idNumerico = Number(meta.id);
                
                const atualizou = await salvarMetasAPI({
                    id: idNumerico,
                    texto: meta.texto,
                    concluida: novoStatus
                });
                
                if (atualizou !== null) {
                    meta.concluida = novoStatus;
                    saveSystemData(state);
                    renderSystem();
                }
             }
            return;
        }

        // ALTERAR STATUS DO SISTEMA (ONLINE | AUSENTE | OFFLINE)
        if (target.closest('#stat-status') || target.closest('#btn-change-status') || target.closest('#user-profile-status')) {
            const novoStatus = await customModal({
                title: 'Status do Sistema',
                message: 'Selecione o status atual:',
                defaultValue: state.systemStatus || 'Online',
                options: [
                    {value: 'Online', label: 'Online'},
                    {value: 'Ausente', label: 'Ausente'},
                    {value: 'Offline', label: 'Offline'}
                ]
            });

            if (novoStatus) {
                state.systemStatus = novoStatus;
                saveSystemData(state);
                renderSystem();
            }
            return;
        }
    });
}

// INICIALIZADOR DO SISTEMA
document.addEventListener('DOMContentLoaded', async () => {
    // CARREGA OS DADOS ASSINCRONAMENTE DO BACKEND C# / MYSQL:
    state = await loadSystemData();
    
    // EXECUTA AS VERIFICAÇÕES E RENDERIZAÇÃO INICIAL:
    checkAndResetHorasDiarias(state);
    startClock();
    renderSystem();
    attachEventListeners();
});

// SE O USUÁRIO DEIXAR A ABA ABERTA DE MADRUGADA E VOLTAR PELA MANHÃ, O CICLO RESETA
window.addEventListener('focus', async () => {
    // RECARREGA O ESTADO ATUALIZADO CASO TENHA HAVIDO MUDANÇAS:
    state = await loadSystemData();
    checkAndResetHorasDiarias(state);
    renderSystem();
});
