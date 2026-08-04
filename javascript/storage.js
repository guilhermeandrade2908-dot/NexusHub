// STORAGE.JS - GERENCIADOR DE ESTADO E COMUNICAÇÃO COM API (C# / MYSQL)

import { perfilInicial } from './data/perfil.js';
import { estudos as estudosIniciais } from './data/estudos.js';
import { projetos as projetosIniciais } from './data/projetos.js';
import { metas as metasIniciais } from './data/metas.js';
import { lazer as lazerInicial } from './data/lazer.js';

const STORAGE_KEY = 'NEXUSHUB_DATA_V3';
const API_BASE_URL = 'http://localhost:5107/api';

// HELPERS DE REQUISIÇÃO (FETCH API)

async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.warn(`[API Offline] Falha ao carregar ${endpoint}`, error);
    }
    return null;
}

async function sendAPI(endpoint, method, data) {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.warn(`[API Offline] Falha ao enviar para ${endpoint}`, error);
    }
    return null;
}

// LOCALSTORAGE

export function saveSystemData(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Erro ao salvar dados no localStorage:', e);
    }
}

// CARREGAMENTO UNIFICADO (MYSQL + LOCALSTORAGE)

export async function loadSystemData() {
    let localData = {};
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) localData = JSON.parse(saved);
    } catch (e) {
        console.error('Erro ao ler localStorage:', e);
    }

    // Buscar dados da API C#
    const perfilAPI = await fetchAPI('perfil');
    const projetosAPI = await fetchAPI('projetos');
    const estudosAPI = await fetchAPI('estudos');

    // Unifica os estudos do banco com a estrutura do frontend
    let estudosFinais = localData.estudos || estudosIniciais;
    if (Array.isArray(estudosAPI) && estudosAPI.length > 0) {
        const materiasConvertidas = estudosAPI.map(e => ({
            id: e.id,
            nome: e.materia || e.nome || 'Sem nome',
            progresso: e.progresso ?? 0
        }));

        const primeiroRegistro = estudosAPI[0];
        estudosFinais = {
            horasHoje: primeiroRegistro.horasHoje ?? estudosFinais.horasHoje ?? 0,
            horasTotais: primeiroRegistro.horasTotais ?? estudosFinais.horasTotais ?? 0,
            metasHorasSemanal: primeiroRegistro.metaHorasSemanal ?? estudosFinais.metasHorasSemanal ?? 0,
            materias: materiasConvertidas,
            ultimoReset: localData.estudos?.ultimoReset || null,
            ultimoResetSemana: localData.estudos?.ultimoResetSemana || null
        };
    }

    const state = {
        perfil: perfilAPI || localData.perfil || perfilInicial,
        projetos: Array.isArray(projetosAPI) ? projetosAPI : (localData.projetos || projetosIniciais),
        estudos: estudosFinais,
        metas: localData.metas || metasIniciais,
        lazer: localData.lazer || lazerInicial,
        systemStatus: localData.systemStatus || 'Online'
    };

    saveSystemData(state);
    return state;
}

// INTEGRAÇÕES COM API - PERFIL

export async function salvarPerfilAPI(perfil) {
    return await sendAPI('perfil', 'POST', perfil);
}

// INTEGRAÇÕES COM API - PROJETOS

export async function salvarProjetosAPI(projeto) {
    const method = projeto.id ? 'PUT' : 'POST';
    const endpoint = projeto.id ? `projetos/${projeto.id}` : 'projetos';
    return await sendAPI(endpoint, method, projeto);
}

export async function deletarProjetoAPI(id) {
    try {
        await fetch(`${API_BASE_URL}/projetos/${id}`, { method: 'DELETE' });
    } catch (e) {
        console.warn(`[API Offline] Não foi possível deletar projeto ${id}`, e);
    }
}

// INTEGRAÇÕES COM API - ESTUDOS

export async function salvarEstudosAPI(estudo) {
    const method = estudo.id ? 'PUT' : 'POST';
    const endpoint = estudo.id ? `estudos/${estudo.id}` : 'estudos';
    return await sendAPI(endpoint, method, estudo);
}

export async function deletarEstudosAPI(id) {
    try {
        await fetch(`${API_BASE_URL}/estudos/${id}`, { method: 'DELETE' });
    } catch (e) {
        console.warn(`[API Offline] Não foi possível deletar estudo ${id}`, e);
    }
}
