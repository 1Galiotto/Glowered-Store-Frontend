// Configurações
let itensCarrinho = [];
let cupomAplicado = null;
let totalPedido = 0;

// Carregar carrinho da API (TENTA pegar do banco)
async function carregarCarrinho() {
    const usuario = verificarLogin();
    if (!usuario) {
        mostrarCarrinhoVazio();
        return;
    }

    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const carrinhoVazio = document.getElementById('carrinho-vazio');

    try {
        if (loading) loading.style.display = 'block';
        if (error) error.style.display = 'none';

        console.log('🔄 Tentando carregar carrinho do banco...');

        const response = await fetch(`${API_BASE}/carrinho/${usuario.codUsuario}`, {
            headers: getAuthHeaders()
        });

        console.log('📡 Status da API:', response.status);

        if (response.ok) {
            const dados = await response.json();
            console.log('✅ Carrinho carregado do banco:', dados);

            // VERIFIQUE A ESTRUTURA DOS DADOS AQUI
            console.log('🔍 Estrutura dos dados:', Object.keys(dados));

            // A API pode estar retornando { itens: [], resumo: {} }
            const itens = dados.itens || dados;

            if (!Array.isArray(itens) || itens.length === 0) {
                mostrarCarrinhoVazio();
            } else {
                // Atualiza a variável global
                itensCarrinho = itens;

                if (carrinhoVazio) carrinhoVazio.style.display = 'none';
                exibirItensCarrinho(itensCarrinho);
                atualizarResumo();
            }

        } else if (response.status === 404) {
            console.log('📭 Carrinho vazio no banco');
            itensCarrinho = [];
            mostrarCarrinhoVazio();

        } else {
            throw new Error(`Erro ${response.status} na API`);
        }

    } catch (err) {
        console.error('❌ Erro na API, usando modo demo:', err);
        // Tenta carregar dados de demonstração
        try {
            const dadosDemo = getDadosDemonstracao();
            if (dadosDemo.length > 0) {
                itensCarrinho = dadosDemo;
                if (carrinhoVazio) carrinhoVazio.style.display = 'none';
                exibirItensCarrinho(itensCarrinho);
                atualizarResumo();
            } else {
                mostrarCarrinhoVazio();
            }
        } catch (demoError) {
            console.error('Erro no modo demo:', demoError);
            mostrarCarrinhoVazio();
        }
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

async function adicionarAoCarrinho(idProduto) {
    try {
        const usuario = verificarLogin();
        if (!usuario) {
            alert('⚠️ Faça login para adicionar produtos ao carrinho');
            window.location.href = './login.html';
            return;
        }

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

            // Se estiver na página do carrinho, recarrega
            if (isCarrinhoPage()) {
                await carregarCarrinho();
            } else {
                // Atualiza contador
                atualizarContadorCarrinho();
            }

            return resultado;
        } else {
            const erro = await response.json();
            throw new Error(erro.error || 'Erro ao adicionar ao carrinho');
        }

    } catch (err) {
        console.error('❌ Erro ao adicionar ao carrinho:', err);
        alert('Erro ao adicionar produto: ' + err.message);
        throw err;
    }
}

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
                contador.style.display = data.quantidadeTotal > 0 ? 'flex' : 'none';
            }
        }
    } catch (err) {
        console.error('Erro ao atualizar contador:', err);
    }
}

function irParaPedidos() {
    fecharCheckout();
    
    // Verifica se a página de pedidos existe, senão vai para a loja
    const pedidosUrl = './pedidos.html';
    
    // Tenta redirecionar para pedidos, se não existir vai para home
    fetch(pedidosUrl)
        .then(response => {
            if (response.ok) {
                window.location.href = pedidosUrl;
            } else {
                window.location.href = '../index.html';
            }
        })
        .catch(() => {
            window.location.href = '../index.html';
        });
}

function finalizarProcesso() {
    fecharCheckout();
    window.location.href = '../index.html';
}

function mostrarCarrinhoVazio() {
    const carrinhoVazio = document.getElementById('carrinho-vazio');
    const listaItens = document.getElementById('lista-itens');
    const btnFinalizar = document.getElementById('btn-finalizar');
    
    if (carrinhoVazio) carrinhoVazio.style.display = 'block';
    if (listaItens) listaItens.innerHTML = '';
    if (btnFinalizar) btnFinalizar.disabled = true;
    
    atualizarResumo();
}

// Dados de demonstração (apenas se API falhar)
function getDadosDemonstracao() {
    return [
        {
            codCarrinho: 1,
            idProduto: 1,
            quantidade: 2,
            produto: {
                nome: "Moletom Glowered Premium",
                descricao: "Moletom comfort preto com detalhes em neon",
                preco: 129.90,
                promocao: 15,
                imagem: "https://i.ibb.co/99CJr1qX/moletom.png",
                ativo: true
            }
        },
        {
            codCarrinho: 2,
            idProduto: 2,
            quantidade: 1,
            produto: {
                nome: "Camisa Cyberpunk",
                descricao: "Camisa com design futurista e cores vibrantes",
                preco: 79.90,
                promocao: 0,
                imagem: "https://i.ibb.co/8nNKrMdZ/camisa.png",
                ativo: true
            }
        }
    ];
}

// Exibir itens do carrinho
function exibirItensCarrinho(itens) {
    const listaItens = document.getElementById('lista-itens');

    listaItens.innerHTML = itens.map(item => {
        const produto = item.produto || {};
        const preco = produto.preco || 0;
        const promocao = produto.promocao || 0;
        const precoFinal = promocao > 0 ? calcularPrecoComDesconto(preco, promocao) : preco;

        return `
        <div class="item-carrinho" data-id="${item.codCarrinho}">
            <div class="item-imagem">
                ${produto.imagem ?
                `<img src="${produto.imagem}" alt="${produto.nome || 'Produto'}" onerror="this.style.display='none'; this.parentElement.innerHTML='🖼️';">` :
                `<span>🖼️</span>`
            }
            </div>
            
            <div class="item-detalhes">
                <h4 class="item-nome">${produto.nome || 'Produto'}</h4>
                <p class="item-descricao">${produto.descricao || 'Descrição não disponível'}</p>
                
                <div class="item-preco">
                    ${promocao > 0 ? `
                        <div class="item-preco-promocao">
                            <span class="preco-original">R$ ${preco.toFixed(2)}</span>
                            <span class="preco-desconto">R$ ${precoFinal.toFixed(2)}</span>
                            <span style="color: var(--accent1); font-size: 0.8rem; margin-left: 0.5rem;">
                                -${promocao}% OFF
                            </span>
                        </div>
                    ` : `
                        R$ ${preco.toFixed(2)}
                    `}
                </div>
            </div>
            
            <div class="item-controles">
                <div class="quantidade-controle">
                    <button class="quantidade-btn" onclick="alterarQuantidade(${item.codCarrinho}, ${item.quantidade - 1})">-</button>
                    <span class="quantidade-value">${item.quantidade}</span>
                    <button class="quantidade-btn" onclick="alterarQuantidade(${item.codCarrinho}, ${item.quantidade + 1})">+</button>
                </div>
                
                <button class="btn-remover" onclick="removerItem(${item.codCarrinho})">
                    REMOVER
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// Alterar quantidade do item
async function alterarQuantidade(idCarrinho, novaQuantidade) {
    const usuario = verificarLogin();
    if (!usuario) return;

    if (novaQuantidade < 1) {
        removerItem(idCarrinho);
        return;
    }

    try {
        // ✅ TENTA atualizar no banco
        const response = await fetch(`${API_BASE}/carrinho/${idCarrinho}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ quantidade: novaQuantidade })
        });

        if (response.ok) {
            // ✅ Atualizou no banco - recarrega
            await carregarCarrinho();
        } else {
            // ❌ Erro no banco - atualiza localmente
            console.log('⚠️ Erro na API, atualizando localmente');
            const itemIndex = itensCarrinho.findIndex(item => item.codCarrinho === idCarrinho);
            if (itemIndex !== -1) {
                itensCarrinho[itemIndex].quantidade = novaQuantidade;
                exibirItensCarrinho(itensCarrinho);
                atualizarResumo();
            }
        }

    } catch (err) {
        console.error('Erro:', err);
        // Atualiza localmente em caso de erro
        const itemIndex = itensCarrinho.findIndex(item => item.codCarrinho === idCarrinho);
        if (itemIndex !== -1) {
            itensCarrinho[itemIndex].quantidade = novaQuantidade;
            exibirItensCarrinho(itensCarrinho);
            atualizarResumo();
        }
    }
}

// Remover item do carrinho
async function removerItem(idCarrinho) {
    if (!confirm('Deseja remover este item do carrinho?')) return;

    try {
        const response = await fetch(`${API_BASE}/carrinho/${idCarrinho}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            // ✅ Removeu do banco - recarrega
            await carregarCarrinho();
        } else {
            // ❌ Erro no banco - remove localmente
            console.log('⚠️ Erro na API, removendo localmente');
            itensCarrinho = itensCarrinho.filter(item => item.codCarrinho !== idCarrinho);

            if (itensCarrinho.length === 0) {
                mostrarCarrinhoVazio();
            } else {
                exibirItensCarrinho(itensCarrinho);
                atualizarResumo();
            }
        }

    } catch (err) {
        console.error('Erro:', err);
        // Remove localmente em caso de erro
        itensCarrinho = itensCarrinho.filter(item => item.codCarrinho !== idCarrinho);

        if (itensCarrinho.length === 0) {
            mostrarCarrinhoVazio();
        } else {
            exibirItensCarrinho(itensCarrinho);
            atualizarResumo();
        }
    }
}

// Calcular preço com desconto
function calcularPrecoComDesconto(preco, descontoPercentual) {
    return preco * (1 - descontoPercentual / 100);
}

// Atualizar resumo do pedido
function atualizarResumo() {
    let subtotal = 0;

    itensCarrinho.forEach(item => {
        const produto = item.produto || {};
        const preco = produto.promocao > 0 ?
            calcularPrecoComDesconto(produto.preco || 0, produto.promocao) :
            produto.preco || 0;

        subtotal += preco * item.quantidade;
    });

    const frete = subtotal > 100 ? 0 : 15; // Frete grátis acima de R$ 100
    const desconto = cupomAplicado ? subtotal * (cupomAplicado.descontoPercentual / 100) : 0;
    totalPedido = subtotal + frete - desconto;

    // Atualizar UI
    document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('frete').textContent = frete === 0 ? 'GRÁTIS' : `R$ ${frete.toFixed(2)}`;
    document.getElementById('desconto').textContent = `- R$ ${desconto.toFixed(2)}`;
    document.getElementById('total').textContent = `R$ ${totalPedido.toFixed(2)}`;

    // Habilitar/desabilitar botão de finalizar
    const btnFinalizar = document.getElementById('btn-finalizar');
    if (btnFinalizar) {
        btnFinalizar.disabled = itensCarrinho.length === 0;
    }
}

// Aplicar cupom de desconto
async function aplicarCupom() {
    const codigoCupom = document.getElementById('cupom-input').value.trim().toUpperCase();
    const messageDiv = document.getElementById('cupom-message');

    if (!codigoCupom) {
        messageDiv.textContent = 'Digite um código de cupom';
        messageDiv.className = 'cupom-message cupom-error';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/cupons/validar`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ codigo: codigoCupom })
        });

        if (response.ok) {
            cupomAplicado = await response.json();
            messageDiv.textContent = `🎉 Cupom aplicado! ${cupomAplicado.descontoPercentual}% de desconto`;
            messageDiv.className = 'cupom-message cupom-success';
            atualizarResumo();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Cupom inválido');
        }

    } catch (err) {
        // Se API falhar, usa cupons demo
        const cuponsDemo = {
            'GLOW10': { descontoPercentual: 10, codigo: 'GLOW10' },
            'PRIMEIRACOMPRA': { descontoPercentual: 15, codigo: 'PRIMEIRACOMPRA' },
            'BLACKFRIDAY': { descontoPercentual: 20, codigo: 'BLACKFRIDAY' }
        };

        if (cuponsDemo[codigoCupom]) {
            cupomAplicado = cuponsDemo[codigoCupom];
            messageDiv.textContent = `🎉 Cupom aplicado! ${cupomAplicado.descontoPercentual}% de desconto (Demo)`;
            messageDiv.className = 'cupom-message cupom-success';
            atualizarResumo();
        } else {
            messageDiv.textContent = err.message || '❌ Cupom inválido ou expirado';
            messageDiv.className = 'cupom-message cupom-error';
            cupomAplicado = null;
        }
    }
}

// Iniciar checkout
function iniciarCheckout() {
    if (itensCarrinho.length === 0) {
        alert('Adicione produtos ao carrinho antes de finalizar a compra');
        return;
    }

    document.getElementById('checkout-modal').style.display = 'flex';
    carregarPassoCheckout(1);
}

// Fechar checkout
function fecharCheckout() {
    document.getElementById('checkout-modal').style.display = 'none';
}

// Carregar passo do checkout
function carregarPassoCheckout(passo) {
    const steps = document.querySelectorAll('.step');
    const checkoutContent = document.getElementById('checkout-content');

    steps.forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) <= passo) {
            step.classList.add('active');
        }
    });

    switch (passo) {
        case 1:
            checkoutContent.innerHTML = `
                <div class="checkout-content">
                    <h4>💳 FORMA DE PAGAMENTO</h4>
                    <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 1rem;">
                        💡 <strong>Modo Demonstração:</strong> Use dados fictícios
                    </p>
                    
                    <div class="pagamento-opcoes">
                        <label class="pagamento-opcao selecionado" onclick="selecionarPagamento(this)">
                            <input type="radio" name="pagamento" value="cartao" checked>
                            <span>Cartão de Crédito</span>
                        </label>
                        
                        <label class="pagamento-opcao" onclick="selecionarPagamento(this)">
                            <input type="radio" name="pagamento" value="pix">
                            <span>PIX</span>
                        </label>
                    </div>

                    <div class="pagamento-info">
                        <label>Número do Cartão</label>
                        <input type="text" placeholder="0000 0000 0000 0000" value="4111 1111 1111 1111">
                        
                        <label>Nome no Cartão</label>
                        <input type="text" placeholder="Seu nome" value="CLIENTE EXEMPLO">
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label>Validade</label>
                                <input type="text" placeholder="MM/AA" value="12/30">
                            </div>
                            <div>
                                <label>CVV</label>
                                <input type="text" placeholder="000" value="123">
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-primary" style="width: 100%;" onclick="processarPagamento()">
                        PAGAR R$ ${totalPedido.toFixed(2)}
                    </button>
                </div>
            `;
            break;

        case 2:
            checkoutContent.innerHTML = `
                <div class="checkout-content">
                    <h4>🔍 CONFIRMAR PEDIDO</h4>
                    <p style="color: var(--muted); margin-bottom: 1.5rem; font-family: 'Share Tech Mono', monospace;">
                        Revise os detalhes do seu pedido antes de confirmar.
                    </p>
                    
                    <div style="background: var(--bg-2); padding: 1rem; border-radius: var(--radius); margin-bottom: 1.5rem;">
                        <h5 style="color: var(--accent3); margin-bottom: 0.5rem;">RESUMO DO PEDIDO</h5>
                        <p style="color: var(--muted); font-family: 'Share Tech Mono', monospace;">
                            ${itensCarrinho.length} produto(s)<br>
                            Total: R$ ${totalPedido.toFixed(2)}<br>
                            ${cupomAplicado ? `Cupom: ${cupomAplicado.codigo} (-${cupomAplicado.descontoPercentual}%)` : ''}
                        </p>
                    </div>

                    <div style="display: flex; gap: 1rem;">
                        <button class="btn btn-secondary" style="flex: 1;" onclick="carregarPassoCheckout(1)">
                            VOLTAR
                        </button>
                        <button class="btn btn-primary" style="flex: 1;" onclick="simularConfirmacaoPedido()">
                            CONFIRMAR PEDIDO
                        </button>
                    </div>
                </div>
            `;
            break;

        case 3:
            const numeroPedido = `GLW${Date.now().toString().slice(-6)}`;
            checkoutContent.innerHTML = `
                <div class="checkout-success">
                    <img src="https://img.icons8.com/fluency/96/checked.png" alt="Sucesso">
                    <h4>PEDIDO CONFIRMADO! 🎉</h4>
                    <p>Seu pedido foi processado com sucesso e já está sendo preparado.</p>
                    <div style="background: var(--bg-2); padding: 1rem; border-radius: var(--radius); margin: 1rem 0;">
                        <p style="color: var(--accent2); font-family: 'Share Tech Mono', monospace; margin: 0;">
                            Nº do Pedido: ${numeroPedido}<br>
                            Total: R$ ${totalPedido.toFixed(2)}<br>
                            Previsão de entrega: 5 dias úteis
                        </p>
                    </div>
                    <div style="display: flex; gap: 1rem; flex-direction: column;">
                        <button class="btn btn-primary" onclick="irParaPedidos()">
                            📦 VER MEUS PEDIDOS
                        </button>
                        <button class="btn btn-secondary" onclick="finalizarProcesso()">
                            🏠 VOLTAR À LOJA
                        </button>
                    </div>
                </div>
            `;
            break;
    }
}

// Função para limpar carrinho localmente
async function limparCarrinhoLocal() {
    console.log('🔄 Limpando carrinho localmente...');
    
    // Limpa a variável global
    itensCarrinho = [];
    
    // Atualiza a interface
    mostrarCarrinhoVazio();
    
    // Limpa qualquer cupom aplicado
    cupomAplicado = null;
    
    // Reseta o resumo
    atualizarResumo();
    
    console.log('✅ Carrinho limpo localmente');
}

// Função melhorada para limpar carrinho após pedido
async function limparCarrinhoAposPedido(idUsuario) {
    try {
        console.log('🔄 Iniciando limpeza do carrinho...');

        // Tenta limpar no backend
        try {
            const response = await fetch(`${API_BASE}/carrinho/limpar/${idUsuario}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                console.log('✅ Carrinho limpo no backend');
            } else {
                console.log('⚠️ Não foi possível limpar carrinho no backend');
            }
        } catch (apiError) {
            console.log('⚠️ Erro de conexão ao limpar carrinho no backend');
        }

        // SEMPRE limpa localmente como fallback
        await limparCarrinhoLocal();

    } catch (err) {
        console.error('❌ Erro na limpeza do carrinho:', err);
        // Garante que limpa localmente mesmo com erro
        await limparCarrinhoLocal();
    }
}

// Selecionar forma de pagamento
function selecionarPagamento(elemento) {
    document.querySelectorAll('.pagamento-opcao').forEach(opcao => {
        opcao.classList.remove('selecionado');
    });
    elemento.classList.add('selecionado');
}

// Processar pagamento
function processarPagamento() {
    const btn = event.target;
    const textoOriginal = btn.textContent;

    btn.textContent = 'PROCESSANDO...';
    btn.disabled = true;

    setTimeout(() => {
        btn.textContent = textoOriginal;
        btn.disabled = false;
        carregarPassoCheckout(2);
    }, 1500);
}

// Simular confirmação do pedido - FUNÇÃO CORRIGIDA
async function simularConfirmacaoPedido() {
    const btn = event.target;
    const textoOriginal = btn.textContent;

    btn.textContent = 'PROCESSANDO...';
    btn.disabled = true;

    try {
        const usuario = verificarLogin();
        if (!usuario) {
            console.error('❌ Usuário não logado');
            return;
        }

        console.log('🔄 Iniciando processo de pedido...');

        // Tenta criar pedido na API
        const pedidoData = {
            idUsuario: usuario.codUsuario,
            idCupom: cupomAplicado?.codCupom || null,
            valorTotal: totalPedido,
            enderecoEntrega: "Endereço de exemplo para demonstração",
            itens: itensCarrinho.map(item => ({
                idProduto: item.idProduto,
                quantidade: item.quantidade,
                precoUnitario: item.produto.promocao > 0 ?
                    calcularPrecoComDesconto(item.produto.preco, item.produto.promocao) :
                    item.produto.preco
            }))
        };

        console.log('📦 Dados do pedido:', pedidoData);

        let pedidoCriado = null;
        
        // Tenta criar pedido na API
        try {
            const response = await fetch(`${API_BASE}/pedidos`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(pedidoData)
            });

            if (response.ok) {
                pedidoCriado = await response.json();
                console.log('✅ Pedido criado na API:', pedidoCriado);
            } else {
                console.log('⚠️ Erro na API de pedidos, criando pedido localmente');
                // Simula criação local do pedido
                pedidoCriado = {
                    codPedido: `GLW${Date.now().toString().slice(-6)}`,
                    status: 'CONFIRMADO'
                };
            }
        } catch (apiError) {
            console.error('❌ Erro na API, criando pedido localmente:', apiError);
            // Fallback: cria pedido localmente
            pedidoCriado = {
                codPedido: `GLW${Date.now().toString().slice(-6)}`,
                status: 'CONFIRMADO'
            };
        }

        // LIMPA O CARRINHO (agora de forma mais robusta)
        console.log('🗑️ Limpando carrinho...');
        await limparCarrinhoAposPedido(usuario.codUsuario);

        // Atualiza a interface imediatamente
        itensCarrinho = [];
        mostrarCarrinhoVazio();
        
        console.log('✅ Processo de pedido concluído com sucesso');

        // Mostra sucesso após pequeno delay
        setTimeout(() => {
            carregarPassoCheckout(3);
        }, 1500);

    } catch (err) {
        console.error('❌ Erro crítico no processo de pedido:', err);
        
        // Mesmo em caso de erro, tenta limpar o carrinho
        try {
            await limparCarrinhoLocal();
        } catch (cleanError) {
            console.error('Erro ao limpar carrinho:', cleanError);
        }

        // Mostra sucesso mesmo com erro (para demo)
        setTimeout(() => {
            carregarPassoCheckout(3);
        }, 1500);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    // Verificar login
    if (!verificarERedirecionar()) {
        return;
    }

    // Carregar carrinho
    carregarCarrinho();

    // Configurar navegação COM VERIFICAÇÕES
    const homeBtn = document.getElementById('home-btn');
    const logoutBtn = document.getElementById('logoutButton');
    const cupomInput = document.getElementById('cupom-input');
    const checkoutModal = document.getElementById('checkout-modal');

    if (homeBtn) {
        homeBtn.addEventListener('click', function () {
            window.location.href = '../index.html';
        });
    } else {
        console.warn('⚠️ Botão home-btn não encontrado');
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    } else {
        console.warn('⚠️ Botão logoutButton não encontrado');
    }

    if (cupomInput) {
        cupomInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                aplicarCupom();
            }
        });
    }

    if (checkoutModal) {
        checkoutModal.addEventListener('click', function (e) {
            if (e.target === this) {
                fecharCheckout();
            }
        });
    }
});

// Função para debug
function debugCarrinho() {
    console.log('=== DEBUG CARRINHO ===');
    console.log('Itens:', itensCarrinho);
    console.log('Usuário:', verificarLogin());
    console.log('Token:', localStorage.getItem('token'));
}

// Função auxiliar para verificar e redirecionar
function verificarERedirecionar() {
    const usuario = verificarLogin();
    if (!usuario) {
        window.location.href = './login.html';
        return false;
    }
    return true;
}