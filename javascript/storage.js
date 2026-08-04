// STORAGE.JS - GERENCIADOR DE ESTADO:

import { perfilInicial } from './data/perfil.js';
import { estudos as estudosIniciais } from './data/estudos.js';
import { projetos as projetosIniciais } from './data/projetos.js';
import { metas as metasIniciais } from './data/metas.js';
import { lazer as lazerInicial } from './data/lazer.js';

const STORAGE_KEY = 'NEXUSHUB_DATA_V3';
const API_BASE_URL = 'http://localhost:5107/api';

// HELPERS DE REQUISIÇÃO (FETCH):
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

// CARREGA OS DADOS DO SISTEMA (PERFIL DO MYSQL + OUTROS MÓDULOS DO LOCALSTORAGE):
export async function loadSystemData() {
    // TENTA PEGAR OS DADOS JÁ SALVOS NO LOCALSTORAGE:
    let localData = {};

    const rawLocal = localStorage.getItem(STORAGE_KEY);
    if (rawLocal) {
        try {
            localData = JSON.parse(rawLocal);
        } catch (e) {
            console.error("Erro ao ler LocalStorage:", e);
        }
    }

    // BUSCA OS DADOS DO PERFIL E PROJETOS EM PARALELO DO MYSQL:
    const [perfilBackend, projetosBackend] = await Promise.all([
        fetchAPI('perfil'),
        fetchAPI('projetos')
    ]);

    // MONTA O ESTADO UNIFICADO DA APLICAÇÃO:
    return {
        perfil: perfilBackend || localData.perfil || perfilInicial,
        projetos: projetosBackend || localData.projetos || projetosIniciais || [],
        estudos: localData.estudos || estudosIniciais || {materias: [], horasTotais: 0, metasHorasSemanal: 0},
        metas: localData.metas || metasIniciais || [],
        lazer: localData.lazer || lazerInicial || {jogos: [], livros: [], filmes: [], series: []}
    };
}

// === PERSISTÊNCIA E OPERAÇÕES DO BANCO ===

// PERFIL:
export async function salvarPerfilAPI(perfil) {
    const perfilId = perfil?.id || 1;
    try {
        const response = await fetch(`${API_BASE_URL}/perfil/${perfilId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                nome: perfil.nome,
                cargo: perfil.cargo,
                bio: perfil.bio || ""
            })
        });

        if (response.ok) {
            console.log("Perfil salvo no MySQL!");
            return true;
        }
    } catch (error) {
        console.error("Erro ao salvar perfil no backend:", error);
    }
    return false;
}

// PROJETOS (CRIAR / EDITAR):
export async function salvarProjetosAPI(projeto) {
    const ehEdicao = Boolean(projeto.id); // SE POSSUI ID, ATUALIZA. SE NÃO POSSUI, CRIA:
    const url = ehEdicao ? `${API_BASE_URL}/projetos/${projeto.id}` : `${API_BASE_URL}/projetos`;
    const metodo = ehEdicao ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(projeto)
        });

        if (response.ok) {
            console.log(`Projeto ${ehEdicao ? 'atualizado' : 'criado'} no MySQL!`);
            return ehEdicao ? await response.json() : true;
        }
    } catch (error) {
        console.log("Erro ao salvar projeto no backend:", error);
    }
    return false;
}

// PROJETOS (EXCLUIR):
export async function deletarProjetoAPI(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/projetos/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            console.log("Projeto removido do MySQL!");
            return true;
        }
    } catch (error) {
        console.error("Erro ao deletar projeto no backend:", error);
    }
    return false;
}

// SALVA AS ALTERAÇÕES NO SISTEMA:
export async function saveSystemData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Erro ao salvar no LocalStorage", error);
    }

    // DISPARA A SINCRONIZAÇÃO DO PERFIL CASO ELE TENHA MUDADO:
    if (data.perfil) {
        salvarPerfilAPI(data.perfil);
    }
}