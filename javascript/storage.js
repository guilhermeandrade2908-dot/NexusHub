// STORAGE.JS - GERENCIADOR DE ESTADO:

import { perfilInicial } from './data/perfil.js';
import { estudos as estudosIniciais } from './data/estudos.js';
import { projetos as projetosIniciais } from './data/projetos.js';
import { metas as metasIniciais } from './data/metas.js';
import { lazer as lazerInicial } from './data/lazer.js';

const STORAGE_KEY = 'NEXUSHUB_DATA_V3';
const API_PERFIL_URL = 'http://localhost:5107/api/perfil';

// CARREGA OS DADOS DO SISTEMA (PERFIL DO MYSQL + OUTROS MÓDULOS DO LOCALSTORAGE):
export async function loadSystemData() {
    let localData = {};

    // TENTA PEGAR OS DADOS JÁ SALVOS NO LOCALSTORAGE:
    const rawLocal = localStorage.getItem(STORAGE_KEY);
    if (rawLocal) {
        try {
            localData = JSON.parse(rawLocal);
        } catch (e) {
            console.error("Erro ao ler LocalStorage:", e);
        }
    }

    // BUSCA OS DADOS DO PERFIL ATUALIZADOS DIRETO DO MYSQL:
    let perfilBackend = null;
    try {
        const response = await fetch(API_PERFIL_URL);
        if (response.ok) {
            perfilBackend = await response.json();
        }
    } catch (error) {
        console.warn("API Backend offline ou indisponível. Usando fallback local.", error);
    }

    // MONTA O ESTADO UNIFICADO DA APLICAÇÃO:
    const fullData = {
        perfil: perfilBackend || localData.perfil || perfilInicial,
        estudos: localData.estudos || estudosIniciais || {materias: [], horasTotais: 0, metasHorasSemanal: 0},
        projetos: localData.projetos || projetosIniciais || [],
        metas: localData.metas || metasIniciais || [],
        lazer: localData.lazer || lazerInicial || {jogos: [], livros: [], filmes: [], series: []}
    };

    return fullData;
}

// SALVA AS ALTERAÇÕES NO SISTEMA:
export async function saveSystemData(data) {
    // SALVA A CÓPIA COMPLETA NO LOCALSTORAGE PARA OS DEMAIS MÓDULOS:
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Erro ao salvar:", error);
    }

    // SE O OBJETO CONTIVER DADOS DE PERFIL E TIVER ID, ENVIA O PUT PARA O MYSQL:
    if (data.perfil && data.perfil.id) {
        try {
            const response = await fetch(`${API_PERFIL_URL}/${data.perfil.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  nome: data.perfil.nome,
                  cargo: data.perfil.cargo,
                  bio: data.perfil.bio || ""  
                })
            });

            if (!response.ok) {
                console.error("Erro ao atualizar perfil no MySQL:", response.status);
            } else {
                console.log("Perfil sincronizado com sucesso no MySQL!");
            }
        } catch (error) {
            console.error("Erro ao conectar com o backend durante o save:", error);
        }
    }
}