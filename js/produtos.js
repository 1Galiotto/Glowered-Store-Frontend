let produtos = [];
let usuarioLogado = null;

function isCarrinhoPage() {
    return window.location.pathname.includes('carrinho.html');
}

async function atualizarContadorCarrinho() {
    try {
        const usuario = verificarLogin();
        if (!usuario) return;

        const response = await fetch(`${API_BASE}/carrinho/quantidade/${usuario.codUsuario}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            const contador = document.getElementById('cart-count');
            if (contador) {
                contador.textContent = data.quantidadeTotal || 0;
            }
        }
    } catch (err) {
        console.error('Erro ao atualizar contador:', err);
    }
}

async function filtrarPorTipo(tipo) {
    try {
        const loading = document.getElementById('loading');
        const grid = document.getElementById('products-grid');
        
        loading.style.display = 'block';
        grid.innerHTML = '';

        const response = await fetch(`${API_BASE}/produtos/tipo/${tipo}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erro ao filtrar produtos');

        const produtosFiltrados = await response.json();
        exibirProdutos(produtosFiltrados);
        
        document.getElementById('featured-title').textContent = 
            `${tipo.toUpperCase()} (${produtosFiltrados.length})`;

    } catch (err) {
        console.error('Erro:', err);
        document.getElementById('featured-title').textContent = 'ERRO AO FILTRAR';
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// E também para buscar produtos
async function buscarProdutos(termo) {
    try {
        // Primeiro tenta buscar na lista local
        const produtosFiltrados = produtos.filter(produto => 
            produto.nome.toLowerCase().includes(termo.toLowerCase()) ||
            produto.descricao.toLowerCase().includes(termo.toLowerCase()) ||
            produto.tipo.toLowerCase().includes(termo.toLowerCase())
        );

        if (produtosFiltrados.length > 0) {
            exibirProdutos(produtosFiltrados);
            document.getElementById('featured-title').textContent = 
                `RESULTADOS PARA: "${termo}" (${produtosFiltrados.length})`;
        } else {
            document.getElementById('featured-title').textContent = 
                `NENHUM RESULTADO PARA: "${termo}"`;
            exibirProdutos([]);
        }
    } catch (err) {
        console.error('Erro na busca:', err);
    }
}

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
        
        // Feedback visual
        botao.textContent = '🔄 ADICIONANDO...';
        botao.disabled = true;

        // Dados para a API
        const dadosCarrinho = {
            idUsuario: usuario.codUsuario,
            idProduto: idProduto,
            quantidade: 1
        };

        console.log('🔄 Adicionando ao carrinho:', dadosCarrinho);

        const response = await fetch(`${API_BASE}/carrinho/adicionar`, {
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
            
            // Atualizar contador do carrinho
            atualizarContadorCarrinho();
            
            // Restaurar botão após 2 segundos
            setTimeout(() => {
                botao.textContent = '🛒 ADICIONAR';
                botao.style.background = '';
                botao.disabled = false;
            }, 2000);
            
        } else {
            const erro = await response.json();
            throw new Error(erro.error || 'Erro ao adicionar ao carrinho');
        }

    } catch (err) {
        console.error('❌ Erro ao adicionar ao carrinho:', err);
        
        // Feedback visual de erro
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

// Carregar produtos da API
async function carregarProdutos() {
    usuarioLogado = verificarLogin();
    if (!usuarioLogado) return;

    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const grid = document.getElementById('products-grid');
    const title = document.getElementById('section-title');

    try {
        loading.style.display = 'block';
        error.style.display = 'none';
        grid.innerHTML = '';

        const response = await fetch(`${API_BASE}/produtos`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erro ao carregar produtos');

        produtos = await response.json();
        exibirProdutos(produtos);
        
        title.textContent = `PRODUTOS DISPONÍVEIS (${produtos.length})`;

    } catch (err) {
        console.error('Erro:', err);
        error.style.display = 'block';
        title.textContent = 'ERRO AO CARREGAR PRODUTOS';
    } finally {
        loading.style.display = 'none';
    }
}

// Exibir produtos no grid
function exibirProdutos(produtosParaExibir) {
    const grid = document.getElementById('products-grid');
    
    if (produtosParaExibir.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <p style="color: var(--muted); font-family: 'Share Tech Mono', monospace;">
                    NENHUM PRODUTO ENCONTRADO
                </p>
            </div>
        `;
        return;
    }

    grid.innerHTML = produtosParaExibir.map(produto => `
        <div class="product-card" data-id="${produto.codProduto}">
            ${produto.promocao ? '<span class="product-badge">-${produto.promocao}%</span>' : ''}
            
            <div class="product-image">
                ${produto.imagem ? 
                    `<img src="${produto.imagem}" alt="${produto.nome}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius);">` : 
                    `<span>🖼️ SEM IMAGEM</span>`
                }
            </div>
            
            <h3 class="product-name">${produto.nome.toUpperCase()}</h3>
            
            <p class="product-description">${produto.descricao}</p>
            
            <div class="product-price">
                ${produto.promocao ? `
                    <span class="old-price">R$ ${produto.preco.toFixed(2)}</span>
                    <span class="new-price">R$ ${calcularPrecoComDesconto(produto.preco, produto.promocao).toFixed(2)}</span>
                ` : `
                    R$ ${produto.preco.toFixed(2)}
                `}
            </div>
            
            <div class="product-actions">
                <button class="btn-add-cart" onclick="adicionarAoCarrinho(${produto.codProduto})" 
                        ${!produto.ativo ? 'disabled' : ''}>
                    ${produto.ativo ? '🛒 ADICIONAR' : '❌ INDISPONÍVEL'}
                </button>
                <button class="btn-favorite" onclick="adicionarAosFavoritos(${produto.codProduto})">
                    ♥
                </button>
            </div>
        </div>
    `).join('');
}

// Filtrar produtos
function filtrarProdutos(tipo) {
    let produtosFiltrados = [...produtos];
    
    switch(tipo) {
        case 'promocoes':
            produtosFiltrados = produtos.filter(p => p.promocao > 0);
            document.getElementById('section-title').textContent = `PROMOÇÕES (${produtosFiltrados.length})`;
            break;
        case 'all':
        default:
            produtosFiltrados = produtos;
            document.getElementById('section-title').textContent = `TODOS OS PRODUTOS (${produtos.length})`;
            break;
    }
    
    exibirProdutos(produtosFiltrados);
}

// Calcular preço com desconto
function calcularPrecoComDesconto(preco, descontoPercentual) {
    return preco * (1 - descontoPercentual / 100);
}

// Adicionar aos favoritos
function adicionarAosFavoritos(idProduto) {
    if (!verificarLogin()) return;
    
    const botao = event.target;
    botao.style.color = botao.style.color === 'var(--accent1)' ? 'var(--muted)' : 'var(--accent1)';
    // Implementar API de favoritos posteriormente
}

// Inicializar produtos
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('products-grid')) {
        carregarProdutos();
    }
});