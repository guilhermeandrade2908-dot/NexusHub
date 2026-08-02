// STORAGE.JS - GERENCIADOR DE ESTADO:

import { perfilInicial } from './data/perfil.js';
import { estudos as estudosIniciais } from './data/estudos.js';
import { projetos as projetosIniciais } from './data/projetos.js';
import { metas as metasIniciais } from './data/metas.js';
import { lazer as lazerInicial } from './data/lazer.js';

const STORAGE_KEY = 'NEXUSHUB_DATA_V3';

export function loadSystemData() {
    const localData = localStorage.getItem(STORAGE_KEY);

    if (!localData) {
        const defaultData = {
            perfil: perfilInicial || { nome: 'Dev', cargo: 'System Operator', status: 'Online', bio: 'Dev focado em dominar tecnologias modernas.' },
            estudos: estudosIniciais || { materias: [], horasTotais: 0, metasHorasSemanal: 0 },
            projetos: projetosIniciais || [],
            metas: metasIniciais || [],
            lazer: lazerInicial || { jogos: [], livros: [], filmes: [] }
        };
        saveSystemData(defaultData);
        return defaultData;
    }

    try {
        return JSON.parse(localData);
    } catch (error) {
        console.error("Erro no LocalStorage:", error);
        return {};
    }
}

export function saveSystemData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Erro ao salvar:", error);
    }
}