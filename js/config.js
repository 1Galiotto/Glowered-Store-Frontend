// CONFIGURAÇÕES DA APLICAÇÃO - GLOBAL

// URL da API - PRODUÇÃO
const API_BASE_URL = 'https://glowered-store-backend-production.up.railway.app';

// Modo de desenvolvimento (true para usar dados de fallback)
const MODO_DEVELOPMENT = false;

// Dados de fallback para quando a API estiver offline
const API_FALLBACK_DATA = {
    produtos: [
        {
            codProduto: 1,
            nome: "Camisa Glowered Black",
            tipo: "camisa",
            cor: "Preta",
            descricao: "Camisa de algodão premium com estampa exclusiva Glowered",
            preco: 89.90,
            promocao: 15,
            material: "Algodão",
            tamanho: "M",
            imagem: "https://i.ibb.co/Xf4BQHKg/image.png",
            ativo: true,
            estoque: 50
        },
        {
            codProduto: 2,
            nome: "Moletom Glowered Hoodie",
            tipo: "moletom",
            cor: "Cinza",
            descricao: "Moletom comfort com capuz e bolso kangaroo",
            preco: 149.90,
            promocao: 20,
            material: "Algodão",
            tamanho: "G",
            imagem: "https://i.ibb.co/PsczQfXx/image.png",
            ativo: true,
            estoque: 30
        },
        {
            codProduto: 3,
            nome: "Calça Jeans Glowered",
            tipo: "calca",
            cor: "Azul",
            descricao: "Calça jeans slim fit com lavagem moderna",
            preco: 129.90,
            promocao: 10,
            material: "Jeans",
            tamanho: "42",
            imagem: "https://i.ibb.co/0yYNCH87/calca.png",
            ativo: true,
            estoque: 25
        },
        {
            codProduto: 4,
            nome: "Boné Glowered Snapback",
            tipo: "acessorio",
            cor: "Preto",
            descricao: "Boné ajustável com logo bordado",
            preco: 59.90,
            promocao: null,
            material: "Algodão",
            tamanho: "Único",
            imagem: "https://i.ibb.co/4R17Pbgm/acessorios.png",
            ativo: true,
            estoque: 100
        },
        {
            codProduto: 5,
            nome: "Camisa Glowered White",
            tipo: "camisa",
            cor: "Branca",
            descricao: "Camisa básica branca com logo minimalista",
            preco: 79.90,
            promocao: 5,
            material: "Algodão",
            tamanho: "P",
            imagem: "https://i.ibb.co/8nNKrMdZ/camisa.png",
            ativo: true,
            estoque: 40
        },
        {
            codProduto: 6,
            nome: "Moletom Glowered Premium",
            tipo: "moletom",
            cor: "Preto",
            descricao: "Moletom premium com acabamento em veludo",
            preco: 179.90,
            promocao: 25,
            material: "Algodão",
            tamanho: "GG",
            imagem: "https://i.ibb.co/99CJr1qX/moletom.png",
            ativo: true,
            estoque: 20
        },
        {
            codProduto: 7,
            nome: "Calça Jogger Glowered",
            tipo: "calca",
            cor: "Verde",
            descricao: "Calça jogger estilo streetwear",
            preco: 139.90,
            promocao: 15,
            material: "Sarja",
            tamanho: "40",
            imagem: "https://i.ibb.co/0yYNCH87/calca.png",
            ativo: true,
            estoque: 35
        },
        {
            codProduto: 8,
            nome: "Mochila Glowered",
            tipo: "acessorio",
            cor: "Azul",
            descricao: "Mochila resistente com compartimento para notebook",
            preco: 199.90,
            promocao: null,
            material: "Poliéster",
            tamanho: "M",
            imagem: "https://i.ibb.co/4R17Pbgm/acessorios.png",
            ativo: true,
            estoque: 15
        },
        {
            codProduto: 9,
            nome: "Camisa Glowered Limited",
            tipo: "camisa",
            cor: "Vermelha",
            descricao: "Edição limitada com estampa especial",
            preco: 99.90,
            promocao: 30,
            material: "Algodão",
            tamanho: "G",
            imagem: "https://i.ibb.co/8nNKrMdZ/camisa.png",
            ativo: true,
            estoque: 10
        },
        {
            codProduto: 10,
            nome: "Meias Glowered Pack",
            tipo: "acessorio",
            cor: "Branco",
            descricao: "Pack com 3 pares de meias personalizadas",
            preco: 39.90,
            promocao: 10,
            material: "Algodão",
            tamanho: "Único",
            imagem: "https://i.ibb.co/4R17Pbgm/acessorios.png",
            ativo: true,
            estoque: 80
        }
    ],
    cupons: [
        {
            codCupom: 1,
            codigo: "GLOW10",
            descontoPercentual: 10,
            dataValidade: "2024-12-31",
            usoUnico: false,
            ativo: true
        },
        {
            codCupom: 2,
            codigo: "PRIMEIRACOMPRA",
            descontoPercentual: 15,
            dataValidade: "2024-12-31",
            usoUnico: true,
            ativo: true
        },
        {
            codCupom: 3,
            codigo: "BLACKFRIDAY",
            descontoPercentual: 20,
            dataValidade: "2024-12-31",
            usoUnico: false,
            ativo: true
        }
    ]
};

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