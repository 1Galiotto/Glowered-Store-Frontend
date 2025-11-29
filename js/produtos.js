// Gerenciamento de produtos - VERSÃO CORRIGIDA
let produtosCarregados = [];
let produtosFiltrados = [];
let usuarioLogado = null;

// Inicializar elementos DOM
function inicializarElementosDOM() {
    const elements = {
        productsGrid: document.getElementById('products-grid'),
        promoGrid: document.getElementById('promo-grid'),
        loading: document.getElementById('loading'),
        error: document.getElementById('error'),
        featuredTitle: document.getElementById('featured-title'),
        offersTitle: document.getElementById('offers-title')
    };
    
    // Verificar elementos críticos
    if (!elements.productsGrid) {
        console.error('❌ Elemento #products-grid não encontrado');
        return null;
    }
    
    return elements;
}

// Verificar se está na página do carrinho
function isCarrinhoPage() {
    return window.location.pathname.includes('carrinho.html');
}

// Atualizar contador do carrinho
async function atualizarContadorCarrinho() {
    try {
        const usuario = verificarLogin();
        if (!usuario) return;

        const response = await fetch(`${API_BASE_URL}/carrinho/quantidade/${usuario.codUsuario}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            const contador = document.getElementById('cart-count');
            if (contador) {
                contador.textContent = data.quantidadeTotal || 0;
                contador.style.display = data.quantidadeTotal > 0 ? 'flex' : 'none';
            }
        }
    } catch (err) {
        console.error('Erro ao atualizar contador:', err);
    }
}

// Filtrar por tipo
async function filtrarPorTipo(tipo) {
    const elements = inicializarElementosDOM();
    if (!elements) return;

    try {
        elements.loading.style.display = 'block';
        elements.productsGrid.innerHTML = '';

        // Primeiro tenta API
        const apiOnline = await verificarConexaoAPI();
        let produtosFiltrados = [];

        if (apiOnline) {
            const response = await fetch(`${API_BASE_URL}/produtos/tipo/${tipo}`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                produtosFiltrados = await response.json();
            } else {
                throw new Error(`API retornou status ${response.status}`);
            }
        } else {
            // Fallback local
            produtosFiltrados = produtosCarregados.filter(p => p.tipo === tipo);
        }

        exibirProdutos(produtosFiltrados, elements.productsGrid);
        
        if (elements.featuredTitle) {
            elements.featuredTitle.textContent = 
                `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} (${produtosFiltrados.length})`;
        }

    } catch (err) {
        console.error('Erro ao filtrar:', err);
        if (elements.featuredTitle) {
            elements.featuredTitle.textContent = 'ERRO AO FILTRAR';
        }
        mostrarErroFiltro(err, elements);
    } finally {
        elements.loading.style.display = 'none';
    }
}

// Buscar produtos
async function buscarProdutos(termo) {
    const elements = inicializarElementosDOM();
    if (!elements) return;

    try {
        elements.loading.style.display = 'block';
        
        let resultados = [];

        if (produtosCarregados.length > 0) {
            // Busca local
            resultados = produtosCarregados.filter(produto => 
                produto.nome.toLowerCase().includes(termo.toLowerCase()) ||
                produto.descricao.toLowerCase().includes(termo.toLowerCase()) ||
                produto.tipo.toLowerCase().includes(termo.toLowerCase()) ||
                produto.material.toLowerCase().includes(termo.toLowerCase())
            );
        } else {
            // Busca na API
            const apiOnline = await verificarConexaoAPI();
            if (apiOnline) {
                const response = await fetch(`${API_BASE_URL}/produtos/buscar?q=${encodeURIComponent(termo)}`, {
                    headers: getAuthHeaders()
                });
                
                if (response.ok) {
                    resultados = await response.json();
                }
            }
        }

        if (resultados.length > 0) {
            exibirProdutos(resultados, elements.productsGrid);
            if (elements.featuredTitle) {
                elements.featuredTitle.textContent = 
                    `RESULTADOS PARA: "${termo}" (${resultados.length})`;
            }
        } else {
            if (elements.featuredTitle) {
                elements.featuredTitle.textContent = `NENHUM RESULTADO PARA: "${termo}"`;
            }
            elements.productsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <p style="color: var(--muted); font-size: 1.1rem; margin-bottom: 1rem;">
                        🔍 Nenhum produto encontrado para "${termo}"
                    </p>
                    <button class="btn btn-primary" onclick="carregarProdutos()">
                        📋 Ver Todos os Produtos
                    </button>
                </div>
            `;
        }

    } catch (err) {
        console.error('Erro na busca:', err);
        mostrarErroFiltro(err, elements);
    } finally {
        elements.loading.style.display = 'none';
    }
}

// Adicionar ao carrinho
async function adicionarAoCarrinho(idProduto) {
    try {
        const usuario = verificarLogin();
        if (!usuario) {
            alert('⚠️ Faça login para adicionar produtos ao carrinho');
            window.location.href = './html/login.html';
            return;
        }

        const botao = event.target;
        const textoOriginal = botao.textContent;
        const corOriginal = botao.style.background;
        
        // Feedback visual
        botao.textContent = '🔄 ADICIONANDO...';
        botao.disabled = true;
        botao.style.background = 'var(--accent3)';

        const dadosCarrinho = {
            idUsuario: usuario.codUsuario,
            idProduto: idProduto,
            quantidade: 1
        };

        console.log('🔄 Adicionando ao carrinho:', dadosCarrinho);

        const response = await fetch(`${API_BASE_URL}/carrinho/adicionar`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dadosCarrinho)
        });

        if (response.ok) {
            const resultado = await response.json();
            console.log('✅ Produto adicionado:', resultado);
            
            // Feedback visual de sucesso
            botao.textContent = '✅ ADICIONADO!';
            botao.style.background = 'var(--success)';
            
            // Atualizar contador
            await atualizarContadorCarrinho();
            
            // Restaurar botão
            setTimeout(() => {
                botao.textContent = textoOriginal;
                botao.style.background = corOriginal;
                botao.disabled = false;
            }, 2000);
            
        } else {
            const erro = await response.json();
            throw new Error(erro.error || 'Erro ao adicionar ao carrinho');
        }

    } catch (err) {
        console.error('❌ Erro ao adicionar ao carrinho:', err);
        
        const botao = event.target;
        botao.textContent = '❌ ERRO';
        botao.style.background = 'var(--accent1)';
        
        setTimeout(() => {
            botao.textContent = '🛒 ADICIONAR';
            botao.style.background = '';
            botao.disabled = false;
        }, 2000);
        
        alert('Erro ao adicionar produto: ' + err.message);
    }
}

// Carregar produtos principal
async function carregarProdutos() {
    const elements = inicializarElementosDOM();
    if (!elements) return;

    usuarioLogado = verificarLogin();
    if (!usuarioLogado) {
        mostrarLoginRequerido();
        return;
    }

    try {
        mostrarLoading(elements);
        limparErro(elements);

        console.log('🔄 Carregando produtos...');

        const apiOnline = await verificarConexaoAPI();
        let produtos = [];

        if (apiOnline) {
            const response = await fetch(`${API_BASE_URL}/produtos`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                produtos = await response.json();
                console.log('✅ Produtos carregados da API:', produtos.length);
            } else {
                throw new Error(`API retornou status ${response.status}`);
            }
        } else {
            throw new Error('API offline - não é possível carregar produtos sem conexão com o backend');
        }

        produtosCarregados = produtos;
        produtosFiltrados = produtos;

        exibirProdutos(produtos, elements.productsGrid);
        exibirPromocoes(produtos, elements.promoGrid);
        atualizarTitulos(produtos, elements);
        esconderLoading(elements);

    } catch (err) {
        console.error('❌ Erro ao carregar produtos:', err);
        mostrarErro(err, elements);
    }
}

// Mostrar loading
function mostrarLoading(elements) {
    if (elements.loading) {
        elements.loading.style.display = 'block';
        elements.loading.innerHTML = `
            <p style="color: var(--accent3); font-family: 'Share Tech Mono', monospace;">
                🌀 CARREGANDO PRODUTOS...
            </p>
        `;
    }
    if (elements.error) elements.error.style.display = 'none';
}

// Esconder loading
function esconderLoading(elements) {
    if (elements.loading) elements.loading.style.display = 'none';
}

// Mostrar erro
function mostrarErro(erro, elements) {
    if (elements.error) {
        elements.error.style.display = 'block';
        elements.error.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="color: var(--accent1); font-family: 'Share Tech Mono', monospace; margin-bottom: 1rem;">
                    ❌ ERRO AO CARREGAR PRODUTOS
                </p>
                <p style="color: var(--muted); margin-bottom: 1rem;">${erro.message}</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="btn btn-primary" onclick="carregarProdutos()">
                        🔄 TENTAR NOVAMENTE
                    </button>
                </div>
            </div>
        `;
    }
}

// Mostrar erro de filtro
function mostrarErroFiltro(erro, elements) {
    if (elements.error) {
        elements.error.style.display = 'block';
        elements.error.innerHTML = `
            <div style="text-align: center; padding: 1rem;">
                <p style="color: var(--accent1); margin-bottom: 0.5rem;">
                    ❌ Erro na filtragem
                </p>
                <p style="color: var(--muted); font-size: 0.9rem;">${erro.message}</p>
            </div>
        `;
        
        setTimeout(() => {
            elements.error.style.display = 'none';
        }, 3000);
    }
}

// Limpar erro
function limparErro(elements) {
    if (elements.error) {
        elements.error.style.display = 'none';
        elements.error.innerHTML = '';
    }
}



// Exibir produtos no grid
function exibirProdutos(produtosParaExibir, gridElement) {
    if (!gridElement) return;
    
    if (!produtosParaExibir || produtosParaExibir.length === 0) {
        gridElement.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <p style="color: var(--muted); font-size: 1.1rem;">
                    📭 Nenhum produto encontrado
                </p>
            </div>
        `;
        return;
    }

    gridElement.innerHTML = produtosParaExibir.map(produto => criarCardProduto(produto)).join('');
}

// Exibir promoções
function exibirPromocoes(produtos, promoGrid) {
    if (!promoGrid) return;
    
    const produtosPromocao = produtos.filter(p => p.promocao && p.promocao > 0);
    
    if (produtosPromocao.length === 0) {
        promoGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <p style="color: var(--muted);">
                    🎁 Nenhuma oferta especial no momento
                </p>
                <p style="color: var(--muted-light); font-size: 0.9rem; margin-top: 0.5rem;">
                    Volte em breve para conferir nossas promoções!
                </p>
            </div>
        `;
        return;
    }

    promoGrid.innerHTML = produtosPromocao.map(produto => criarCardProduto(produto)).join('');
}

// Atualizar títulos
function atualizarTitulos(produtos, elements) {
    if (elements.featuredTitle) {
        elements.featuredTitle.textContent = `PRODUTOS EM DESTAQUE (${produtos.length})`;
    }
    if (elements.offersTitle) {
        const promocoes = produtos.filter(p => p.promocao > 0).length;
        elements.offersTitle.textContent = `OFERTAS ESPECIAIS (${promocoes})`;
    }
}

// Criar card do produto
function criarCardProduto(produto) {
    const precoFinal = calcularPrecoComDesconto(produto.preco, produto.promocao);
    const temPromocao = produto.promocao && produto.promocao > 0;
    const estaAtivo = produto.ativo !== false;
    const estaFavoritado = verificarSeFavoritado(produto.codProduto);

    return `
        <div class="product-card ${temPromocao ? 'featured' : ''} ${!estaAtivo ? 'disabled' : ''}"
             data-id="${produto.codProduto}">
            ${temPromocao ? `<div class="product-badge">-${produto.promocao}%</div>` : ''}
            ${!estaAtivo ? `<div class="product-badge unavailable">INDISPONÍVEL</div>` : ''}

            <div class="product-image">
                <img src="${produto.imagem}" alt="${produto.nome}"
                     onerror="this.src='https://via.placeholder.com/300x300/2a2a2a/666666?text=Imagem+Não+Disponível'">
            </div>

            <h3 class="product-name">${produto.nome}</h3>

            <p class="product-description">${produto.descricao}</p>

            <div class="product-price">
                ${temPromocao ? `
                    <span class="old-price">R$ ${produto.preco.toFixed(2)}</span>
                    <span class="new-price">R$ ${precoFinal.toFixed(2)}</span>
                ` : `
                    <span>R$ ${produto.preco.toFixed(2)}</span>
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
                <button class="btn-favorite ${estaFavoritado ? 'favoritado' : ''}"
                        onclick="adicionarAosFavoritos(${produto.codProduto})"
                        title="${estaFavoritado ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                    ♥
                </button>
            </div>
        </div>
    `;
}

// Verificar se produto está favoritado
function verificarSeFavoritado(idProduto) {
    // Usar a função do sistema de favoritos se disponível
    if (typeof window.verificarFavorito === 'function') {
        return window.verificarFavorito(idProduto);
    }

    // Fallback: implementação básica usando localStorage
    const usuario = verificarLogin();
    if (!usuario) return false;

    const chaveFavoritos = `favoritos_${usuario.codUsuario}`;
    const favoritos = JSON.parse(localStorage.getItem(chaveFavoritos) || '[]');
    return favoritos.includes(idProduto);
}

// Filtrar produtos (all, promocoes)
function filtrarProdutos(tipo) {
    const elements = inicializarElementosDOM();
    if (!elements) return;

    let produtosFiltrados = [...produtosCarregados];
    
    switch(tipo) {
        case 'promocoes':
            produtosFiltrados = produtosCarregados.filter(p => p.promocao > 0);
            if (elements.featuredTitle) {
                elements.featuredTitle.textContent = `PROMOÇÕES (${produtosFiltrados.length})`;
            }
            break;
        case 'all':
        default:
            produtosFiltrados = produtosCarregados;
            if (elements.featuredTitle) {
                elements.featuredTitle.textContent = `TODOS OS PRODUTOS (${produtosFiltrados.length})`;
            }
            break;
    }
    
    exibirProdutos(produtosFiltrados, elements.productsGrid);
}

// Calcular preço com desconto
function calcularPrecoComDesconto(preco, descontoPercentual) {
    if (!descontoPercentual || descontoPercentual <= 0) return preco;
    return preco * (1 - descontoPercentual / 100);
}

// Adicionar aos favoritos
async function adicionarAosFavoritos(idProduto) {
    const usuario = verificarLogin();
    if (!usuario) {
        alert('⚠️ Faça login para adicionar aos favoritos');
        return;
    }

    try {
        const botao = event.target;
        const estaFavoritado = botao.classList.contains('favoritado');

        // Tentar API primeiro
        const apiOnline = await verificarConexaoAPI();

        if (apiOnline) {
            const method = estaFavoritado ? 'DELETE' : 'POST';
            const url = estaFavoritado
                ? `${API_BASE_URL}/favoritos/${usuario.codUsuario}/${idProduto}`
                : `${API_BASE_URL}/favoritos`;

            const body = estaFavoritado ? null : JSON.stringify({
                idUsuario: usuario.codUsuario,
                idProduto: idProduto
            });

            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: body
            });

            if (!response.ok) {
                throw new Error('Erro na API');
            }
        }

        // Sempre atualizar localStorage como backup
        const chaveFavoritos = `favoritos_${usuario.codUsuario}`;
        const favoritos = JSON.parse(localStorage.getItem(chaveFavoritos) || '[]');
        const index = favoritos.indexOf(idProduto);

        if (estaFavoritado) {
            // Remover dos favoritos
            if (index > -1) {
                favoritos.splice(index, 1);
            }
            botao.classList.remove('favoritado');
            botao.title = 'Adicionar aos favoritos';
            console.log('❤️ Removido dos favoritos:', idProduto);
            mostrarNotificacaoFavoritos('Produto removido dos favoritos!', 'info');
        } else {
            // Adicionar aos favoritos
            if (index === -1) {
                favoritos.push(idProduto);
            }
            botao.classList.add('favoritado');
            botao.title = 'Remover dos favoritos';
            console.log('💚 Adicionado aos favoritos:', idProduto);
            mostrarNotificacaoFavoritos('Produto adicionado aos favoritos!', 'success');
        }

        localStorage.setItem(chaveFavoritos, JSON.stringify(favoritos));

        // Atualizar UI se necessário
        setTimeout(() => {
            if (document.getElementById('products-grid')) {
                carregarProdutos();
            }
        }, 100);

    } catch (err) {
        console.error('Erro ao gerenciar favoritos:', err);
        mostrarNotificacaoFavoritos('Erro ao atualizar favoritos', 'error');
    }
}

// Função auxiliar para mostrar notificações de favoritos
function mostrarNotificacaoFavoritos(mensagem, tipo = 'info') {
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
            backdrop-filter: blur(10px);
            border: 1px solid var(--glass);
        `;
        document.body.appendChild(notificacao);
    }

    // Definir cor baseada no tipo
    const cores = {
        success: 'var(--accent2)',
        error: 'var(--accent1)',
        warning: 'var(--accent3)',
        info: 'var(--accent4)'
    };

    notificacao.style.background = cores[tipo] || cores.info;
    notificacao.textContent = mensagem;
    notificacao.style.display = 'block';

    // Esconder após 3 segundos
    setTimeout(() => {
        notificacao.style.display = 'none';
    }, 3000);
}

// Mostrar login requerido
function mostrarLoginRequerido() {
    const elements = inicializarElementosDOM();
    if (!elements) return;

    elements.productsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
            <h3 style="color: var(--accent3); margin-bottom: 1rem;">🔐 Acesso Restrito</h3>
            <p style="color: var(--muted); margin-bottom: 2rem;">
                Faça login para explorar nossa coleção exclusiva
            </p>
            <a href="./html/login.html" class="btn btn-primary" style="font-size: 1.1rem;">
                🚀 Fazer Login
            </a>
            <a href="./html/cadastro.html" class="btn btn-secondary" style="font-size: 1.1rem; margin-left: 1rem;">
                📝 Criar Conta
            </a>
        </div>
    `;
    
    if (elements.promoGrid) elements.promoGrid.innerHTML = '';
    esconderLoading(elements);
}

// Inicializar produtos quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Só inicializar se estiver na página principal
    if (document.getElementById('products-grid')) {
        console.log('📦 Inicializando sistema de produtos...');
        setTimeout(() => {
            carregarProdutos();
            atualizarContadorCarrinho();
        }, 100);
    }
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.filtrarPorTipo = filtrarPorTipo;
    window.filtrarProdutos = filtrarProdutos;
    window.buscarProdutos = buscarProdutos;
    window.adicionarAoCarrinho = adicionarAoCarrinho;
    window.adicionarAosFavoritos = adicionarAosFavoritos;
    window.carregarProdutos = carregarProdutos;
    window.usarModoDemo = usarModoDemo;
}