// admin-cupons.js - Gerenciamento de cupons para admin

let cupons = [];
let cupomEditando = null;

// Carregar todos os cupons
async function carregarCupons() {
    const loading = document.getElementById('loading');
    const message = document.getElementById('message');

    try {
        loading.style.display = 'block';
        message.style.display = 'none';

        const response = await fetch(`${API_BASE}/cupons`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // 🔥 CORREÇÃO: A API retorna { cupons: [], paginacao: {} }
        if (data && Array.isArray(data.cupons)) {
            cupons = data.cupons;
        } else if (Array.isArray(data)) {
            // Fallback: se for array diretamente
            cupons = data;
        } else {
            console.error('Formato de resposta inesperado:', data);
            cupons = [];
        }
        
        exibirCupons(cupons);
        atualizarEstatisticas();

    } catch (error) {
        console.error('Erro ao carregar cupons:', error);
        showMessage(`❌ Erro ao carregar cupons: ${error.message}`, 'error');
        cupons = [];
        exibirCupons([]);
    } finally {
        loading.style.display = 'none';
    }
}

// Exibir cupons na grid
function exibirCupons(cuponsParaExibir) {
    const listaCupons = document.getElementById('listaCupons');
    
    // Garantir que é um array
    if (!Array.isArray(cuponsParaExibir)) {
        console.error('cuponsParaExibir não é um array:', cuponsParaExibir);
        cuponsParaExibir = [];
    }
    
    if (cuponsParaExibir.length === 0) {
        listaCupons.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <p style="color: var(--muted); font-family: 'Share Tech Mono', monospace;">
                    📭 NENHUM CUPOM ENCONTRADO
                </p>
                <button class="btn btn-primary" onclick="abrirModalCriarCupom()" style="margin-top: 1rem;">
                    🎫 CRIAR PRIMEIRO CUPOM
                </button>
            </div>
        `;
        return;
    }

    listaCupons.innerHTML = cuponsParaExibir.map(cupom => `
        <div class="cupom-card" style="background: var(--panel); padding: 1.5rem; border-radius: var(--radius); border: 1px solid ${getBorderColorCupom(cupom)}; position: relative;">
            ${cupom.ativo ? '<span class="status-badge ativo">✅ ATIVO</span>' : '<span class="status-badge inativo">❌ INATIVO</span>'}
            ${isCupomExpirado(cupom) ? '<span class="status-badge expirado">📅 EXPIRADO</span>' : ''}
            
            <div style="margin-bottom: 1rem;">
                <h4 style="color: var(--accent3); margin: 0 0 0.5rem 0; font-family: 'Share Tech Mono', monospace;">${cupom.codigo}</h4>
                <p style="color: var(--accent2); font-size: 1.5rem; font-weight: bold; margin: 0;">${cupom.descontoPercentual}% OFF</p>
            </div>

            <div style="margin-bottom: 1rem;">
                <p style="color: var(--muted); margin: 0.25rem 0; font-size: 0.9rem;">
                    <strong>Validade:</strong> ${formatarData(cupom.dataValidade)}
                </p>
                <p style="color: var(--muted); margin: 0.25rem 0; font-size: 0.9rem;">
                    <strong>Uso Único:</strong> ${cupom.usoUnico ? '✅ Sim' : '❌ Não'}
                </p>
                <p style="color: var(--muted); margin: 0.25rem 0; font-size: 0.9rem;">
                    <strong>Status:</strong> ${getStatusCupom(cupom)}
                </p>
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-small btn-primary" onclick="editarCupom(${cupom.codCupom})" ${isCupomExpirado(cupom) ? 'disabled' : ''}>
                    ✏️ EDITAR
                </button>
                ${cupom.ativo ? 
                    `<button class="btn btn-small btn-secondary" onclick="desativarCupom(${cupom.codCupom})">
                        ❌ DESATIVAR
                    </button>` :
                    `<button class="btn btn-small btn-secondary" onclick="ativarCupom(${cupom.codCupom})">
                        ✅ ATIVAR
                    </button>`
                }
                <button class="btn btn-small btn-danger" onclick="deletarCupom(${cupom.codCupom})">
                    🗑️ EXCLUIR
                </button>
            </div>
        </div>
    `).join('');

    // Adicionar CSS para os badges
    const style = document.createElement('style');
    style.textContent = `
        .status-badge {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            padding: 0.25rem 0.5rem;
            border-radius: var(--radius);
            font-size: 0.7rem;
            font-family: 'Share Tech Mono', monospace;
        }
        .status-badge.ativo { background: rgba(0, 230, 168, 0.2); color: var(--accent2); border: 1px solid var(--accent2); }
        .status-badge.inativo { background: rgba(255, 45, 149, 0.2); color: var(--accent1); border: 1px solid var(--accent1); }
        .status-badge.expirado { background: rgba(255, 165, 0, 0.2); color: orange; border: 1px solid orange; }
        .btn-small { padding: 0.5rem 0.75rem; font-size: 0.8rem; }
        .btn-danger { background: linear-gradient(45deg, var(--accent1), #ff6b9d); }
        .cupons-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    `;
    if (!document.querySelector('style[data-cupons]')) {
        style.setAttribute('data-cupons', 'true');
        document.head.appendChild(style);
    }
}

// Atualizar estatísticas
function atualizarEstatisticas() {
    // Garantir que cupons é um array
    if (!Array.isArray(cupons)) {
        console.error('cupons não é um array:', cupons);
        cupons = [];
    }

    const total = cupons.length;
    const ativos = cupons.filter(c => c.ativo && !isCupomExpirado(c)).length;
    const expirados = cupons.filter(isCupomExpirado).length;

    document.getElementById('totalCupons').textContent = total;
    document.getElementById('cuponsAtivos').textContent = ativos;
    document.getElementById('cuponsExpirados').textContent = expirados;
}

// Funções auxiliares
function getBorderColorCupom(cupom) {
    if (isCupomExpirado(cupom)) return 'orange';
    if (!cupom.ativo) return 'var(--accent1)';
    return 'var(--accent2)';
}

function isCupomExpirado(cupom) {
    return new Date(cupom.dataValidade) < new Date();
}

function getStatusCupom(cupom) {
    if (isCupomExpirado(cupom)) return '📅 Expirado';
    if (!cupom.ativo) return '❌ Inativo';
    return '✅ Ativo';
}

function formatarData(dataString) {
    return new Date(dataString).toLocaleDateString('pt-BR');
}

// Filtrar cupons
function filtrarCupons(tipo) {
    // Garantir que cupons é um array
    if (!Array.isArray(cupons)) {
        console.error('cupons não é um array:', cupons);
        cupons = [];
    }

    let cuponsFiltrados = [...cupons];
    
    switch(tipo) {
        case 'ativos':
            cuponsFiltrados = cupons.filter(c => c.ativo && !isCupomExpirado(c));
            break;
        case 'expirados':
            cuponsFiltrados = cupons.filter(isCupomExpirado);
            break;
        default:
            // Todos os cupons
            break;
    }
    
    exibirCupons(cuponsFiltrados);
}

// Função auxiliar para validar dados do cupom
function validarDadosCupom(cupomData) {
    const errors = [];

    if (!cupomData.codigo || cupomData.codigo.length < 3) {
        errors.push('Código deve ter pelo menos 3 caracteres');
    }

    if (!cupomData.descontoPercentual || cupomData.descontoPercentual < 1 || cupomData.descontoPercentual > 100) {
        errors.push('Desconto deve ser entre 1% e 100%');
    }

    if (!cupomData.dataValidade) {
        errors.push('Data de validade é obrigatória');
    } else if (new Date(cupomData.dataValidade) < new Date()) {
        errors.push('Data de validade não pode ser no passado');
    }

    return errors;
}

// CRUD de Cupons
async function criarCupom(cupomData) {
    try {
        console.log('Dados enviados para API:', cupomData); // Debug
        
        const response = await fetch(`${API_BASE}/cupons`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(cupomData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro da API:', errorData); // Debug
            throw new Error(errorData.error || errorData.message || 'Erro ao criar cupom');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro completo:', error); // Debug
        throw error;
    }
}

async function atualizarCupom(id, cupomData) {
    try {
        console.log('Dados para atualizar:', cupomData); // Debug
        
        const response = await fetch(`${API_BASE}/cupons/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(cupomData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro da API:', errorData); // Debug
            throw new Error(errorData.error || errorData.message || 'Erro ao atualizar cupom');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro completo:', error); // Debug
        throw error;
    }
}

async function desativarCupom(id) {
    try {
        const response = await fetch(`${API_BASE}/cupons/${id}/desativar`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erro ao desativar cupom');

        carregarCupons();
        showMessage('✅ Cupom desativado com sucesso!', 'success');
    } catch (error) {
        showMessage(`❌ ${error.message}`, 'error');
    }
}

async function ativarCupom(id) {
    try {
        const response = await fetch(`${API_BASE}/cupons/${id}/ativar`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erro ao ativar cupom');

        carregarCupons();
        showMessage('✅ Cupom ativado com sucesso!', 'success');
    } catch (error) {
        showMessage(`❌ ${error.message}`, 'error');
    }
}

async function deletarCupom(id) {
    if (!confirm('Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/cupons/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erro ao excluir cupom');

        carregarCupons();
        showMessage('✅ Cupom excluído com sucesso!', 'success');
    } catch (error) {
        showMessage(`❌ ${error.message}`, 'error');
    }
}

// Editar cupom
function editarCupom(id) {
    const cupom = cupons.find(c => c.codCupom === id);
    if (!cupom) return;

    cupomEditando = cupom;
    
    document.getElementById('modalTitle').textContent = 'EDITAR CUPOM';
    document.getElementById('cupomId').value = cupom.codCupom;
    document.getElementById('codigo').value = cupom.codigo;
    document.getElementById('descontoPercentual').value = cupom.descontoPercentual;
    document.getElementById('dataValidade').value = cupom.dataValidade.split('T')[0];
    document.getElementById('usoUnico').checked = cupom.usoUnico;
    document.getElementById('ativo').checked = cupom.ativo;
    document.getElementById('btnSalvarCupom').textContent = 'ATUALIZAR CUPOM';
    
    document.getElementById('modalCupom').style.display = 'flex';
}

// Configurar formulário
document.addEventListener('DOMContentLoaded', function() {
    const cupomForm = document.getElementById('cupomForm');
    const message = document.getElementById('message');

    if (cupomForm) {
        cupomForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const cupomData = {
                codigo: formData.get('codigo').toUpperCase().trim(),
                descontoPercentual: parseFloat(formData.get('descontoPercentual')),
                dataValidade: formData.get('dataValidade') + 'T23:59:59.999Z',
                usoUnico: document.getElementById('usoUnico').checked,
                ativo: document.getElementById('ativo').checked
            };

            // Validações
            const errors = validarDadosCupom(cupomData);
            if (errors.length > 0) {
                showMessage(`❌ ${errors.join(', ')}`, 'error');
                return;
            }

            // Verificar código duplicado apenas para novos cupons
            const cupomId = document.getElementById('cupomId').value;
            if (!cupomId) {
                const codigoExistente = cupons.find(c => c.codigo === cupomData.codigo);
                if (codigoExistente) {
                    showMessage('❌ Já existe um cupom com este código!', 'error');
                    return;
                }
            }

            try {
                const btnSalvar = document.getElementById('btnSalvarCupom');
                btnSalvar.disabled = true;
                btnSalvar.textContent = 'SALVANDO...';

                console.log('Enviando dados:', cupomData); // Debug

                let resultado;

                if (cupomId) {
                    resultado = await atualizarCupom(cupomId, cupomData);
                    showMessage('✅ Cupom atualizado com sucesso!', 'success');
                } else {
                    resultado = await criarCupom(cupomData);
                    showMessage('✅ Cupom criado com sucesso!', 'success');
                }

                console.log('Resposta da API:', resultado); // Debug
                
                fecharModalCupom();
                await carregarCupons(); // Aguardar recarregar a lista
                
            } catch (error) {
                console.error('Erro completo:', error);
                showMessage(`❌ ${error.message}`, 'error');
            } finally {
                const btnSalvar = document.getElementById('btnSalvarCupom');
                btnSalvar.disabled = false;
                btnSalvar.textContent = cupomId ? 'ATUALIZAR CUPOM' : 'CRIAR CUPOM';
            }
        });
    }

    window.showMessage = function(text, type) {
        const message = document.getElementById('message');
        message.textContent = text;
        message.style.display = 'block';
        message.style.background = type === 'success' ? 'rgba(0, 230, 168, 0.1)' : 'rgba(255, 45, 149, 0.1)';
        message.style.color = type === 'success' ? 'var(--accent2)' : 'var(--accent1)';
        message.style.border = `1px solid ${type === 'success' ? 'var(--accent2)' : 'var(--accent1)'}`;

        setTimeout(() => {
            message.style.display = 'none';
        }, 5000);
    };
});

// Debug temporário - remover depois que funcionar
console.log('=== DEBUG CUPONS ===');
console.log('API_BASE:', API_BASE);
console.log('Headers:', getAuthHeaders());

// Teste a API manualmente
async function testarAPICupons() {
    try {
        const response = await fetch(`${API_BASE}/cupons`, {
            headers: getAuthHeaders()
        });
        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Dados recebidos:', data);
        console.log('Cupons array:', data.cupons);
        console.log('É array de cupons?', Array.isArray(data.cupons));
    } catch (error) {
        console.error('Erro no teste:', error);
    }
}

// Execute o teste
testarAPICupons();