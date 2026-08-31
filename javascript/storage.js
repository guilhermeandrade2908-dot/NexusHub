// STORAGE.JS - GERENCIADOR DE ESTADO E COMUNICAÇÃO COM API (C# / MYSQL)

import { perfilInicial } from './data/perfil.js';
import { estudos as estudosIniciais } from './data/estudos.js';
import { projetos as projetosIniciais } from './data/projetos.js';
import { metas as metasIniciais } from './data/metas.js';
import { lazer as lazerInicial } from './data/lazer.js';

const STORAGE_KEY = 'NEXUSHUB_DATA_V3';
const API_BASE_URL = 'http://localhost:5107/api';

// Variável bool que servirá para informar se a API está disponível:
let apiDisponivel = true;

// HELPERS DE REQUISIÇÃO (FETCH API)
async function fetchAPI(endpoint) {
    const url = `${API_BASE_URL}/${endpoint}`;
    
    try {
        const response = await fetch(url, {
            cache: 'no-store'
        });
        
        // Erro HTTP:
        if (!response.ok) {
            apiDisponivel = false;

        console.error(`[API] Erro HTTP ${response.status} em GET ${url}`);

        return null;
        
    }

    // API respondeu corretamente:
    apiDisponivel = true;

    return await response.json();

} catch (error) {
    // Erro de conexão:
    apiDisponivel = false;
    
    console.error(`[API Offline] Falha ao carregar ${url}`, error);
    
    
    return null;
    }
}

async function sendAPI(endpoint, method = 'GET', body = undefined) {
    const url = `${API_BASE_URL}/${endpoint}`;
    try {
        const response = await fetch(url, {
            method,
            cache: 'no-store',
            headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
            body: body !== undefined ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            console.error(`[API] Erro HTTP ${response.status} em ${method} ${url}`);
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
    const estudosGlobalAPI = await fetchAPI('estudoglobal');
    const metasAPI = await carregarMetasAPI();
    const lazerAPI = await fetchAPI('lazer');

    // Unifica os estudos do banco com a estrutura do frontend
    let estudosFinais = localData.estudos || estudosIniciais;
    
    const materiasConvertidas = Array.isArray(estudosAPI) 
        ? estudosAPI.map(e => ({
            id: e.id,
            nome: e.materia || e.nome || 'Sem nome',
            progresso: e.progresso ?? 0,
            horasHoje: e.horasHoje ?? 0,
            horasTotais: e.horasTotais ?? 0
        }))
        : [];

    if (estudosGlobalAPI) {
        estudosFinais = {
            idGlobal: estudosGlobalAPI.id ?? null, 

            horasHoje: estudosGlobalAPI.horasHoje ?? 0,
            horasTotais: estudosGlobalAPI.horasTotais ?? 0,
            metaHorasSemanal: estudosGlobalAPI.metaHorasSemanal ?? 0,

            ultimoReset: estudosGlobalAPI.ultimoReset ?? null,
            ultimoResetSemanal: estudosGlobalAPI.ultimoResetSemanal ?? null,

            materias: materiasConvertidas
        };
    } else {
        estudosFinais = {
            ...estudosFinais,
            materias: materiasConvertidas
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
        await fetch(`${API_BASE_URL}/estudos/${id}`, { method: 'DELETE' }, {cache: 'no-store'});
    } catch (e) {
        console.warn(`[API Offline] Não foi possível deletar estudo ${id}`, e);
    }
}

// INTEGRAÇÕES COM API - ESTUDO GLOBAL
export async function carregarEstudoGlobalAPI() {
    return await fetchAPI('estudoglobal');
}

export async function salvarEstudoGlobalAPI(global) {
    if (!global?.id) {
        console.error('salvarEstudoGlobalAPI: estudo global sem "id".');

        return null;
    }

    return await sendAPI(`estudoglobal/${global.id}`, 'PUT', global);
}

// INTEGRAÇÕES COM API - METAS
export async function carregarMetasAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/metas`, {cache: 'no-store'});
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