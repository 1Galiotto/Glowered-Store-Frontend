// Sistema de Avaliações - Glowered Store
let avaliacoesProduto = [];

// Carregar avaliações de um produto
async function carregarAvaliacoes(codProduto) {
    try {
        const response = await fetch(`${API_BASE_URL}/avaliacoes/produto/${codProduto}`);

        if (response.ok) {
            const data = await response.json();
            avaliacoesProduto = data.avaliacoes;
            exibirAvaliacoes(data);
            return data.estatisticas;
        }
    } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
    }
    return { total: 0, media: 0 };
}

// Exibir avaliações na página do produto
function exibirAvaliacoes(data) {
    const container = document.getElementById('avaliacoes-container');
    if (!container) return;

    const { avaliacoes, estatisticas } = data;

    container.innerHTML = `
        <div class="avaliacoes-header">
            <h3>Avaliações (${estatisticas.total})</h3>
            <div class="media-estrelas">
                ${gerarEstrelas(estatisticas.media)}
                <span>${estatisticas.media.toFixed(1)} (${estatisticas.total} avaliações)</span>
            </div>
        </div>

        <div class="avaliacoes-lista">
            ${avaliacoes.map(av => criarCardAvaliacao(av)).join('')}
        </div>

        ${gerarFormularioAvaliacao()}
    `;
}

// Criar card de avaliação
function criarCardAvaliacao(avaliacao) {
    return `
        <div class="avaliacao-card">
            <div class="avaliacao-header">
                <strong>${avaliacao.usuario.nome}</strong>
                <div class="estrelas">
                    ${gerarEstrelas(avaliacao.estrelas)}
                </div>
                <small>${formatarData(avaliacao.dataAvaliacao)}</small>
            </div>
            ${avaliacao.comentario ? `<p class="comentario">${avaliacao.comentario}</p>` : ''}
        </div>
    `;
}

// Gerar estrelas visuais
function gerarEstrelas(nota) {
    let estrelas = '';
    for (let i = 1; i <= 5; i++) {
        estrelas += i <= nota ? '⭐' : '☆';
    }
    return estrelas;
}

// Formulário para nova avaliação
function gerarFormularioAvaliacao() {
    const usuario = verificarLogin();
    if (!usuario) {
        return '<p class="login-required">Faça login para avaliar este produto</p>';
    }

    return `
        <div class="nova-avaliacao">
            <h4>Sua Avaliação</h4>
            <form id="form-avaliacao">
                <div class="estrelas-input">
                    <label>Nota:</label>
                    <div class="estrelas-selecao">
                        ${[1,2,3,4,5].map(num => `
                            <input type="radio" name="estrelas" value="${num}" id="estrela${num}">
                            <label for="estrela${num}">⭐</label>
                        `).join('')}
                    </div>
                </div>
                <textarea name="comentario" placeholder="Deixe seu comentário (opcional)" maxlength="500"></textarea>
                <button type="submit" class="btn-primary">Enviar Avaliação</button>
            </form>
        </div>
    `;
}

// Enviar avaliação
async function enviarAvaliacao(codProduto, event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const estrelas = formData.get('estrelas');
    const comentario = formData.get('comentario');

    if (!estrelas) {
        alert('Selecione uma nota de 1 a 5 estrelas');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/avaliacoes`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                codProduto: parseInt(codProduto),
                estrelas: parseInt(estrelas),
                comentario: comentario.trim() || null
            })
        });

        if (response.ok) {
            alert('Avaliação enviada com sucesso!');
            event.target.reset();
            carregarAvaliacoes(codProduto);
        } else {
            const error = await response.json();
            alert(error.error || 'Erro ao enviar avaliação');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao enviar avaliação');
    }
}

// Formatar data
function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// Exportar funções
if (typeof window !== 'undefined') {
    window.carregarAvaliacoes = carregarAvaliacoes;
    window.enviarAvaliacao = enviarAvaliacao;
}
