// app.js - Controller Geral

import { loadSystemData, saveSystemData } from './storage.js';
import {
    renderPerfilCard,
    renderPerfilPage,
    renderEstudosCard,
    renderProjetosCard,
    renderMetasCard,
    renderLazerCard
} from './components.js';

let state = loadSystemData();

function startClock() {
    const clockEl = document.getElementById('clock-display');
    if (!clockEl) return;
    const update = () => { clockEl.textContent = new Date().toLocaleTimeString('pt-BR'); };
    update();
    setInterval(update, 1000);
}

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
        activeSection.style.display = 'block';
    }
}

export function renderSystem() {
    const userNameEl = document.getElementById('user-display-name');
    if (userNameEl && state.perfil?.nome) userNameEl.textContent = state.perfil.nome;

    // Stats
    const statEstudos = document.querySelector('#stat-estudos .stat-value');
    if (statEstudos) statEstudos.textContent = `${state.estudos?.horasTotais || 0} h`;

    const statProjetos = document.querySelector('#stat-projetos .stat-value');
    if (statProjetos) statProjetos.textContent = Array.isArray(state.projetos) ? state.projetos.length : 0;

    const statMetas = document.querySelector('#stat-metas .stat-value');
    if (statMetas && Array.isArray(state.metas)) {
        const total = state.metas.length;
        const concluidas = state.metas.filter(m => m.concluida).length;
        statMetas.textContent = total > 0 ? `${Math.round((concluidas / total) * 100)}%` : '0%';
    }

    // Containers Injetados
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
    if (perfilEl) perfilEl.innerHTML = renderPerfilPage(state.perfil);
}

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

        // 🎯 1. ESCOLHER FOCO A PARTIR DOS PROJETOS
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

        // 👤 2. EDITAR PERFIL
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

        // 📚 3. ESTUDOS (ADD / EDIT / DELETE)
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

        // 🚀 4. PROJETOS (ADD / EDIT / DELETE)
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
            const idx = btnEditProj.getAttribute('data-idx');
            const proj = state.projetos[idx];
            const nome = prompt('Nome do Projeto:', proj.nome);
            const descricao = prompt('Descrição:', proj.descricao);
            const status = prompt('Status:', proj.status);
            if (nome) {
                state.projetos[idx] = { ...proj, nome, descricao, status };
                saveSystemData(state);
                renderSystem();
            }
            return;
        }

        const btnDelProj = target.closest('.btn-delete-projeto');
        if (btnDelProj) {
            const idx = btnDelProj.getAttribute('data-idx');
            state.projetos.splice(idx, 1);
            saveSystemData(state);
            renderSystem();
            return;
        }

        // 🎮 5. LAZER (ADD / DELETE)
        if (target.closest('#btn-add-lazer')) {
            const cat = prompt('Categoria (jogos, livros ou filmes):')?.toLowerCase().trim();
            if (['jogos', 'livros', 'filmes'].includes(cat)) {
                const titulo = prompt(`Título do ${cat.slice(0, -1)}:`);
                const info = prompt('Detalhes/Status:', 'Ativo');
                if (titulo) {
                    if (!state.lazer[cat]) state.lazer[cat] = [];
                    state.lazer[cat].push({ titulo, info });
                    saveSystemData(state);
                    renderSystem();
                }
            }
            return;
        }

        const btnDelLazer = target.closest('.btn-delete-lazer');
        if (btnDelLazer) {
            const cat = btnDelLazer.getAttribute('data-cat');
            const idx = btnDelLazer.getAttribute('data-idx');
            state.lazer[cat].splice(idx, 1);
            saveSystemData(state);
            renderSystem();
            return;
        }

        // 🎯 6. METAS (CHECK / EDIT / DELETE / ADD)
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
    });
}

document.addEventListener('DOMContentLoaded', () => {
    startClock();
    renderSystem();
    attachEventListeners();
});