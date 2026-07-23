// GERENCIADOR DE ARMAZENAMENTO (LOCALSTORAGE)

import {perfilInicial} from './data/perfil.js';
import {estudos as estudosIniciais} from './data/estudos.js';
import {projetos as projetosIniciais} from './data/projetos.js';
import {metas as metasIniciais} from './data/metas.js';
import {lazer as lazerInicial} from './data/lazer.js';

// CHAVE BASE PARA IDENTIFICAR OS DADOS DO NEXUSHUB NO NAVEGADOR
const STORAGE_KEY = 'NEXUSHUB_DATA_V2';

// FUNÇÃO QUE CARREGA TODOS OS DADOS DO NEXUSHUB. SE NÃO HOUVER NADA SALVO, INICIALIZA COM OS DADOS PADRÃO DOS ARQUIVOS EM DATA
export function loadSystemData() {
    const localData = localStorage.getItem(STORAGE_KEY);

    if (!localData) {
        // EM CASO DE PRIMEIRO ACESSO: CRIA A ESTRUTURA INICIAL E SALVA NO LOCALSTORAGE
        const defaultData = {
            perfil: perfilInicial,
            estudos: estudosIniciais,
            projetos: projetosIniciais,
            metas: metasIniciais,
            lazer: lazerInicial
        };
        saveSystemData(defaultData);
        return defaultData;
    }

    try {
        return JSON.parse(localData);
    } catch (error) {
        console.error("Erro ao ler dados do LocalStorage, restaurando padrões:", error);
        return {
            perfil: perfilInicial,
            estudos: estudosIniciais,
            projetos: projetosIniciais,
            metas: metasIniciais,
            lazer: lazerInicial
        };
    }
}

// SALVA TODO O OBJETO DE DADOS DA APLICAÇÃO DE VOLTA NO LOCALSTORAGE:
export function saveSystemData(data) {
    try {
        localStorage,setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Erro ao salvar no LocalStorage:", error);
    }
}

// SALVA APENAS O MÓDULO ESPECÍFICO (EX: 'PERFIL', 'METAS', ETC):
export function saveModuleData(moduleName, moduleData) {
    const currentData = loadSystemData();
    currentData[moduleName] = moduleData;
    saveSystemData(currentData);
}

// RESTAURA O PAINEL PARA AS INFORMAÇÕES DE FÁBRICA/INICIAL:
export function resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    return loadSystemData();
}