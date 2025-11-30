// Sistema de Favoritos - Glowered Store
let produtosFavoritos = [];

// Carregar favoritos do usuário
async function carregarFavoritos() {
    const usuario = verificarLogin();
    if (!usuario) {
        mostrarFavoritosVazio();
        return;
    }

    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const favoritosVazio = document.getElementById('favoritos-vazio');

    try {
        if (loading) loading.style.display = 'block';
        if (error) error.style.display = 'none';
        if (favoritosVazio) favoritosVazio.style.display = 'none';

        console.log('🔄 Carregando favoritos...');

        // Tentar carregar da API
        const apiOnline = await verificarConexaoAPI();
        let favoritos = [];

        if (apiOnline) {
            const response = await fetch(`${API_BASE_URL}/favoritos/${usuario.codUsuario}`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                favoritos = await response.json();
                console.log('✅ Favoritos carregados da API:', favoritos);
                console.log('Tipo de dados:', typeof favoritos, Array.isArray(favoritos) ? 'array' : 'não array');

                // Verificar se é um array
                if (!Array.isArray(favoritos)) {
                    console.warn('API não retornou array, tentando converter...');
                    favoritos = [favoritos].filter(f => f);
                }

                // Filtrar produtos válidos
                favoritos = favoritos.filter(f => f && typeof f === 'object');
                console.log('Favoritos após filtragem:', favoritos.length);
            } else {
                throw new Error(`API retornou status ${response.status}`);
            }
        } else {
            // Fallback: carregar do localStorage
            const favoritosLocal = JSON.parse(localStorage.getItem(`favoritos_${usuario.codUsuario}`) || '[]');
            console.log('📱 Usando favoritos do localStorage:', favoritosLocal.length);

            // Converter IDs para objetos de produto (simulado)
            favoritos = await Promise.all(favoritosLocal.map(async (idProduto) => {
                try {
                    const response = await fetch(`${API_BASE_URL}/produtos/${idProduto}`, {
                        headers: getAuthHeaders()
                    });
                    if (response.ok) {
                        return await response.json();
                    }
                } catch (err) {
                    console.warn(`Produto ${idProduto} não encontrado`);
                }
                return null;
            })).then(produtos => produtos.filter(p => p !== null));
        }

        produtosFavoritos = favoritos;

        if (favoritos.length === 0) {
            mostrarFavoritosVazio();
        } else {
            exibirFavoritos(favoritos);
            atualizarContadorFavoritos(favoritos.length);
        }

        esconderLoading();

    } catch (err) {
        console.error('❌ Erro ao carregar favoritos:', err);
        // Não mostrar erro para o usuário, apenas usar modo demo
        usarModoDemoFavoritos();
    }
}

// Exibir produtos favoritos
function exibirFavoritos(produtos) {
    const grid = document.getElementById('favorites-grid');
    if (!grid) return;

    grid.innerHTML = produtos.map(produto => criarCardFavorito(produto)).join('');
}

// Criar card de produto favorito
function criarCardFavorito(produto) {
    // Verificar se produto existe
    if (!produto || typeof produto !== 'object') {
        console.warn('Produto inválido:', produto);
        return '';
    }

    const preco = produto.preco && typeof produto.preco === 'number' ? produto.preco : 0;
    const precoFinal = calcularPrecoComDesconto(preco, produto.promocao);
    const temPromocao = produto.promocao && produto.promocao > 0;
    const estaAtivo = produto.ativo !== false;

    return `
        <div class="product-card favorito ${temPromocao ? 'featured' : ''} ${!estaAtivo ? 'disabled' : ''}"
             data-id="${produto.codProduto}">
            <div class="product-badge-favorito">
                <button class="btn-remover-favorito" onclick="removerDosFavoritos(${produto.codProduto})"
                        title="Remover dos favoritos">
                    ❌
                </button>
            </div>

            ${temPromocao ? `<div class="product-badge">-${produto.promocao}%</div>` : ''}
            ${!estaAtivo ? `<div class="product-badge unavailable">INDISPONÍVEL</div>` : ''}

            <div class="product-image">
                <img src="${produto.imagem}" alt="${produto.nome}"
                     onerror="this.src='data:image/svg+xml;charset=UTF-8,%3csvg width%3d%22300%22 height%3d%22300%22 xmlns%3d%22http%3a//www.w3.org/2000/svg%22%3e%3crect width%3d%22300%22 height%3d%22300%22 fill%3d%22%23cccccc%22/%3e%3ctext x%3d%2250%25%22 y%3d%2250%25%22 font-family%3d%22Arial%22 font-size%3d%2214%22 fill%3d%22%23666666%22 text-anchor%3d%22middle%22 dy%3d%22.3em%22%3eImagem Nao Disponivel%3c/text%3e%3c/svg%3e'">
            </div>

            <h3 class="product-name">${produto.nome}</h3>

            <p class="product-description">${produto.descricao}</p>

            <div class="product-price">
                ${temPromocao ? `
                    <span class="old-price">R$ ${preco.toFixed(2)}</span>
                    <span class="new-price">R$ ${precoFinal.toFixed(2)}</span>
                ` : `
                    <span>R$ ${preco.toFixed(2)}</span>
                `}
            </div>

            <div class="product-info">
                <span class="product-size">Tamanho: ${produto.tamanho}</span>
                <span class="product-material">${produto.material}</span>
            </div>

            <div class="product-actions">
                <button class="btn-add-cart"
                        onclick="adicionarAoCarrinho(${produto.codProduto})"
                        ${!estaAtivo ? 'disabled' : ''}>
                    ${estaAtivo ? '🛒 Adicionar' : '❌ Indisponível'}
                </button>
                <button class="btn-favorite favoritado"
                        onclick="removerDosFavoritos(${produto.codProduto})">
                    ❤️
                </button>
            </div>
        </div>
    `;
}

// Adicionar aos favoritos
async function adicionarAosFavoritos(idProduto) {
    const usuario = verificarLogin();
    if (!usuario) {
        alert('⚠️ Faça login para adicionar aos favoritos');
        return;
    }

    try {
        // Tentar adicionar na API
        const apiOnline = await verificarConexaoAPI();

        if (apiOnline) {
            const response = await fetch(`${API_BASE_URL}/favoritos`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    idUsuario: usuario.codUsuario,
                    idProduto: idProduto
                })
            });

            if (!response.ok) {
                throw new Error('Erro na API');
            }
        }

        // Sempre salvar no localStorage como backup
        const favoritosLocal = JSON.parse(localStorage.getItem(`favoritos_${usuario.codUsuario}`) || '[]');
        if (!favoritosLocal.includes(idProduto)) {
            favoritosLocal.push(idProduto);
            localStorage.setItem(`favoritos_${usuario.codUsuario}`, JSON.stringify(favoritosLocal));
        }

        // Feedback visual
        const botao = event.target;
        botao.style.color = 'var(--accent1)';
        botao.title = 'Remover dos favoritos';

        console.log('💚 Produto adicionado aos favoritos:', idProduto);

        // Mostrar notificação
        mostrarNotificacao('Produto adicionado aos favoritos!', 'success');

    } catch (err) {
        console.error('Erro ao adicionar favorito:', err);

        // Mesmo com erro, tentar salvar localmente
        const favoritosLocal = JSON.parse(localStorage.getItem(`favoritos_${usuario.codUsuario}`) || '[]');
        if (!favoritosLocal.includes(idProduto)) {
            favoritosLocal.push(idProduto);
            localStorage.setItem(`favoritos_${usuario.codUsuario}`, JSON.stringify(favoritosLocal));
            mostrarNotificacao('Produto salvo localmente nos favoritos!', 'warning');
        }
    }
}

// Remover dos favoritos
async function removerDosFavoritos(idProduto) {
    if (!confirm('Deseja remover este produto dos favoritos?')) return;

    const usuario = verificarLogin();
    if (!usuario) return;

    try {
        // Tentar remover da API
        const apiOnline = await verificarConexaoAPI();

        if (apiOnline) {
            const response = await fetch(`${API_BASE_URL}/favoritos/${usuario.codUsuario}/${idProduto}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                console.warn('Erro ao remover da API, removendo apenas localmente');
            }
        }

        // Sempre remover do localStorage
        const favoritosLocal = JSON.parse(localStorage.getItem(`favoritos_${usuario.codUsuario}`) || '[]');
        const index = favoritosLocal.indexOf(idProduto);
        if (index > -1) {
            favoritosLocal.splice(index, 1);
            localStorage.setItem(`favoritos_${usuario.codUsuario}`, JSON.stringify(favoritosLocal));
        }

        // Remover da lista atual
        produtosFavoritos = produtosFavoritos.filter(p => p.codProduto !== idProduto);

        if (produtosFavoritos.length === 0) {
            mostrarFavoritosVazio();
        } else {
            exibirFavoritos(produtosFavoritos);
        }

        atualizarContadorFavoritos(produtosFavoritos.length);

        console.log('💔 Produto removido dos favoritos:', idProduto);
        mostrarNotificacao('Produto removido dos favoritos!', 'info');

    } catch (err) {
        console.error('Erro ao remover favorito:', err);
        mostrarNotificacao('Erro ao remover dos favoritos', 'error');
    }
}

// Atualizar contador de favoritos no header
function atualizarContadorFavoritos(quantidade) {
    // Esta função pode ser chamada para atualizar badges no header
    console.log(`📊 Total de favoritos: ${quantidade}`);
}

// Mostrar favoritos vazios
function mostrarFavoritosVazio() {
    const grid = document.getElementById('favorites-grid');
    const vazio = document.getElementById('favoritos-vazio');

    if (grid) grid.innerHTML = '';
    if (vazio) vazio.style.display = 'block';

    esconderLoading();
}

// Mostrar erro
function mostrarErro(erro) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = `
            <p style="color: var(--accent1); font-family: 'Share Tech Mono', monospace; margin-bottom: 1rem;">
                ❌ ERRO AO CARREGAR FAVORITOS
            </p>
            <p style="color: var(--muted); margin-bottom: 1rem;">${erro.message}</p>
            <button class="btn btn-primary" onclick="carregarFavoritos()">
                🔄 TENTAR NOVAMENTE
            </button>
        `;
    }
    esconderLoading();
}

// Esconder loading
function esconderLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}

// Usar modo demo para favoritos
function usarModoDemoFavoritos() {
    console.log('🎮 Iniciando modo demo para favoritos...');

    // Produtos de exemplo
    const produtosDemo = [
        {
            codProduto: 1,
            nome: "Moletom Glowered Premium",
            descricao: "Moletom comfort preto com detalhes em neon",
            preco: 129.90,
            promocao: 15,
            imagem: "https://i.ibb.co/99CJr1qX/moletom.png",
            tamanho: "M",
            material: "Algodão",
            ativo: true
        },
        {
            codProduto: 2,
            nome: "Camisa Cyberpunk",
            descricao: "Camisa com design futurista e cores vibrantes",
            preco: 79.90,
            promocao: 0,
            imagem: "https://i.ibb.co/8nNKrMdZ/camisa.png",
            tamanho: "G",
            material: "Poliéster",
            ativo: true
        }
    ];

    produtosFavoritos = produtosDemo;
    exibirFavoritos(produtosDemo);
    esconderLoading();

    if (!localStorage.getItem('demo_favoritos_alert_shown')) {
        setTimeout(() => {
            alert('🔧 Modo Demo Ativado para Favoritos\n\nUsando produtos de exemplo.');
            localStorage.setItem('demo_favoritos_alert_shown', 'true');
        }, 500);
    }
}

// Mostrar notificações
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Criar elemento de notificação se não existir
    let notificacao = document.getElementById('notificacao-favoritos');
    if (!notificacao) {
        notificacao = document.createElement('div');
        notificacao.id = 'notificacao-favoritos';
        notificacao.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: var(--radius);
            color: white;
            font-family: 'Share Tech Mono', monospace;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(notificacao);
    }

    // Definir cor baseada no tipo
    const cores = {
        success: 'var(--success)',
        error: 'var(--accent1)',
        warning: 'var(--accent3)',
        info: 'var(--accent2)'
    };

    notificacao.style.background = cores[tipo] || cores.info;
    notificacao.textContent = mensagem;
    notificacao.style.display = 'block';

    // Esconder após 3 segundos
    setTimeout(() => {
        notificacao.style.display = 'none';
    }, 3000);
}

// Verificar conexão com API
async function verificarConexaoAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return response.ok;
    } catch {
        return false;
    }
}

// Calcular preço com desconto
function calcularPrecoComDesconto(preco, descontoPercentual) {
    if (!descontoPercentual || descontoPercentual <= 0) return preco;
    return preco * (1 - descontoPercentual / 100);
}

// Função auxiliar para adicionar ao carrinho (importada de produtos.js)
async function adicionarAoCarrinho(idProduto) {
    // Esta função deve ser definida globalmente ou importada
    if (typeof window.adicionarAoCarrinhoGlobal === 'function') {
        window.adicionarAoCarrinhoGlobal(idProduto);
    } else {
        console.warn('Função adicionarAoCarrinho não disponível');
        alert('Funcionalidade de carrinho não carregada nesta página');
    }
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
    window.adicionarAosFavoritos = adicionarAosFavoritos;
    window.removerDosFavoritos = removerDosFavoritos;
    window.carregarFavoritos = carregarFavoritos;
    window.usarModoDemoFavoritos = usarModoDemoFavoritos;
}
