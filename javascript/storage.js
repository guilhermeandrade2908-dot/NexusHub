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

async function sendAPI(endpoint, method = 'GET', body = undefined) {
    const url = `${API_BASE_URL}/${endpoint}`;
    try {
        const response = await fetch(url, {
            method,
            headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
            body: body !== undefined ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            console.error(`Erro HTTP ${response.status} ao acessar ${url}`);
            return null;
        }

        if (response.status === 204) {
            return true;
        }

        const text = await response.text();
        return text ? JSON.parse(text) : true;
    } catch (error) {
        console.error(`[API Offline] Falha ao enviar para ${url}`, error);
        return null;
    }
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
    const metasAPI = await carregarMetasAPI();
    const lazerAPI = await fetchAPI('lazer');

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

    let lazerFinal = localData.lazer || lazerInicial;

    if (Array.isArray(lazerAPI)) {
        lazerFinal = {
            jogos: [],
            livros: [],
            filmes: [],
            series: []
        };

        lazerAPI.forEach(item => {
            const tipo = item.tipo?.toLowerCase();

            if (!lazerFinal[tipo]) return;
            
                lazerFinal[tipo].push({
                    id: item.id,
                    nome: item.nome,
                    status: item.status
                });
        });
    }

    const state = {
        perfil: perfilAPI || localData.perfil || perfilInicial,
        projetos: Array.isArray(projetosAPI) ? projetosAPI : (localData.projetos || projetosIniciais),
        estudos: estudosFinais,
        metas: Array.isArray(metasAPI) ? metasAPI : (localData.metas || metasIniciais),
        lazer: lazerFinal,
        systemStatus: perfilAPI?.status || localData.systemStatus || 'Online'
    };

    saveSystemData(state);
    return state;
}

// INTEGRAÇÕES COM API - PERFIL
export async function salvarPerfilAPI(perfil) {
    if (!perfil?.id) {
        console.error('salvarPerfilAPI: perfil sem "id" — recarregue o estado antes de editar.');
        return null;
    }
    return await sendAPI(`perfil/${perfil.id}`, 'PUT', perfil);
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

// INTEGRAÇÕES COM API - METAS
export async function carregarMetasAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/metas`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Erro ao carregar metas:', error);
        return [];
    }
}

export async function salvarMetasAPI(payload) {
    try {
        const id = Number(payload.id) || 0;
        const ehEdicao = id > 0;
        const url = ehEdicao ? `${API_BASE_URL}/metas/${id}` : `${API_BASE_URL}/metas`;

        const response = await fetch(url, {
            method: ehEdicao ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!response.ok) return null;
        if (response.status === 204) return payload;

        return await response.json();
    } catch (error) {
        console.error('Erro ao salvar meta:', error);
        return null;
    }
}

export async function deletarMetaAPI(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/metas/${id}`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (error) {
        console.error('Erro ao deletar meta:', error);
        return false;
    }
}

// INTEGRAÇÕES COM API - LAZER
export async function carregarLazerAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/lazer`);

        if (!response.ok) return [];

        return await response.json();
    } catch (error) {
        console.error("Erro ao carregar itens de lazer:", error);
        return [];
    }
}

export async function salvarLazerAPI(payload) {
    try {
        const id = Number(payload.id) || 0;
        const ehEdicao = id > 0;

        const url = ehEdicao ? `${API_BASE_URL}/lazer/${id}` : `${API_BASE_URL}/lazer`;

        const response = await fetch(url, {
            method: ehEdicao ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!response.ok) return null;

        if (response.status === 204) return payload;

        return await response.json();
    } catch (error) {
        console.error("Erro ao salvar item de lazer:", error);
        return null;
    }
}

export async function deletarLazerAPI(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/lazer/${id}`, {
            method: 'DELETE'
        });

        return response.ok;
    } catch (error) {
        console.error("Erro ao excluir item de lazer:", error);
        return false;
    }
}