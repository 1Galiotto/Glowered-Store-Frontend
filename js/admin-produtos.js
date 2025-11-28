// admin-produtos.js - Gerenciamento de produtos para admin

// Cadastrar novo produto
async function cadastrarProduto(produtoData) {
    try {
        const response = await fetch(`${API_BASE}/produtos`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(produtoData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao cadastrar produto');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Configurar formulário de cadastro
document.addEventListener('DOMContentLoaded', function() {
    const produtoForm = document.getElementById('produtoForm');
    const loading = document.getElementById('loading');
    const message = document.getElementById('message');

    if (produtoForm) {
        produtoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Coletar dados do formulário
            const formData = new FormData(this);
            const produtoData = {
                nome: formData.get('nome'),
                tipo: formData.get('tipo'),
                cor: formData.get('cor'),
                descricao: formData.get('descricao'),
                preco: parseFloat(formData.get('preco')),
                promocao: formData.get('promocao') ? parseInt(formData.get('promocao')) : null,
                material: formData.get('material'),
                tamanho: formData.get('tamanho'),
                imagem: formData.get('imagem'),
                quantidadeInicial: parseInt(formData.get('quantidadeInicial')) || 0
            };

            // Validações
            if (!produtoData.nome || !produtoData.tipo || !produtoData.cor || !produtoData.descricao || 
                !produtoData.preco || !produtoData.material || !produtoData.tamanho || !produtoData.imagem) {
                showMessage('Por favor, preencha todos os campos obrigatórios!', 'error');
                return;
            }

            if (produtoData.preco <= 0) {
                showMessage('O preço deve ser maior que zero!', 'error');
                return;
            }

            if (produtoData.promocao && (produtoData.promocao < 0 || produtoData.promocao > 100)) {
                showMessage('A promoção deve estar entre 0% e 100%!', 'error');
                return;
            }

            try {
                // Mostrar loading
                loading.style.display = 'block';
                message.style.display = 'none';
                
                // Cadastrar produto
                const resultado = await cadastrarProduto(produtoData);
                
                // Sucesso
                showMessage('✅ Produto cadastrado com sucesso!', 'success');
                limparFormulario();
                
            } catch (error) {
                showMessage(`❌ ${error.message}`, 'error');
            } finally {
                loading.style.display = 'none';
            }
        });
    }

    function showMessage(text, type) {
        message.textContent = text;
        message.style.display = 'block';
        message.style.background = type === 'success' ? 'rgba(0, 230, 168, 0.1)' : 'rgba(255, 45, 149, 0.1)';
        message.style.color = type === 'success' ? 'var(--accent2)' : 'var(--accent1)';
        message.style.border = `1px solid ${type === 'success' ? 'var(--accent2)' : 'var(--accent1)'}`;
    }
});

// Funções para gerenciar produtos
async function listarProdutosAdmin() {
    try {
        const response = await fetch(`${API_BASE}/produtos/todos`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erro ao carregar produtos');

        return await response.json();
    } catch (error) {
        throw error;
    }
}

async function atualizarProduto(id, dados) {
    try {
        const response = await fetch(`${API_BASE}/produtos/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(dados)
        });

        if (!response.ok) throw new Error('Erro ao atualizar produto');

        return await response.json();
    } catch (error) {
        throw error;
    }
}

async function desativarProduto(id) {
    try {
        const response = await fetch(`${API_BASE}/produtos/${id}/desativar`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erro ao desativar produto');

        return await response.json();
    } catch (error) {
        throw error;
    }
}

async function ativarProduto(id) {
    try {
        const response = await fetch(`${API_BASE}/produtos/${id}/ativar`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erro ao ativar produto');

        return await response.json();
    } catch (error) {
        throw error;
    }
}