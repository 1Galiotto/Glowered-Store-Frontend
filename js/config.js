// CONFIGURAÇÕES DA APLICAÇÃO - GLOBAL

// URL da API - PRODUÇÃO
const API_BASE_URL = 'https://glowered-store-backend-production-bd02.up.railway.app';

// Modo de desenvolvimento (true para usar dados de fallback)
const MODO_DEVELOPMENT = false;

// Dados de fallback removidos - apenas produtos do backend serão exibidos

// Verificar se a API está online
async function verificarConexaoAPI() {
    if (MODO_DEVELOPMENT) {
        console.log('🔧 Modo desenvolvimento ativo - usando fallback');
        return false;
    }

    try {
        console.log('🌐 Verificando conexão com API...');

        // Primeiro tentar endpoint público de health check
        let response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Se health check não existir, tentar produtos com auth
        if (!response.ok) {
            const token = localStorage.getItem('token');
            if (token) {
                response = await fetch(`${API_BASE_URL}/produtos`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        }

        const estaOnline = response.ok;
        console.log(estaOnline ? '✅ API Online' : '❌ API Offline');
        return estaOnline;

    } catch (error) {
        console.log('❌ Erro na conexão com API:', error.message);
        return false;
    }
}

// Utilitários globais
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function calcularPrecoComDesconto(preco, descontoPercentual) {
    if (!descontoPercentual || descontoPercentual <= 0) return preco;
    return preco * (1 - descontoPercentual / 100);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Storage utilities
function salvarNoLocalStorage(chave, dados) {
    try {
        localStorage.setItem(chave, JSON.stringify(dados));
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        return false;
    }
}

function carregarDoLocalStorage(chave) {
    try {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : null;
    } catch (error) {
        console.error('❌ Erro ao carregar do localStorage:', error);
        return null;
    }
}

// Configuração de logs
const LOG_CONFIG = {
    debug: true,
    colors: {
        info: '#00ff88',
        warn: '#ffaa00',
        error: '#ff4444',
        success: '#00ff88'
    }
};

function log(tipo, mensagem, dados = null) {
    if (!LOG_CONFIG.debug) return;
    
    const cores = LOG_CONFIG.colors;
    const cor = cores[tipo] || '#ffffff';
    
    console.log(
        `%c${mensagem}`,
        `color: ${cor}; font-weight: bold;`,
        dados || ''
    );
}