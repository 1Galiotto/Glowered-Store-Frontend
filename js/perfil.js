// Configurações da API
let usuarioDados = null;

// Função específica para verificar e redirecionar (usar em páginas protegidas)
function verificarERedirecionar() {
    const usuario = verificarLogin();
    if (!usuario) {
        window.location.href = 'login.html';
        return null;
    }
    return usuario;
}

// Carregar dados do usuário
async function carregarDadosUsuario() {
    const usuario = verificarERedirecionar(); // CORREÇÃO: Usar função que redireciona
    if (!usuario) return;

    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const profileForm = document.getElementById('profileForm');

    try {
        loading.style.display = 'block';
        error.style.display = 'none';
        profileForm.style.display = 'none';

        // Buscar usuário específico por ID
        const response = await fetch(`${API_BASE}/clientes/${usuario.codUsuario}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erro ao carregar dados');

        usuarioDados = await response.json();
        
        if (!usuarioDados) throw new Error('Usuário não encontrado');

        preencherFormulario(usuarioDados);
        profileForm.style.display = 'block';

    } catch (err) {
        console.error('Erro:', err);
        error.style.display = 'block';
        error.innerHTML = `
            <p style="color: var(--accent1); font-family: 'Share Tech Mono', monospace;">
                ❌ ERRO AO CARREGAR DADOS
            </p>
            <button class="btn btn-primary" onclick="carregarDadosUsuario()">TENTAR NOVAMENTE</button>
        `;
    } finally {
        loading.style.display = 'none';
    }
}

// Preencher formulário com dados do usuário
function preencherFormulario(dados) {
    document.getElementById('nome').value = dados.nome || '';
    document.getElementById('email').value = dados.email || '';
    document.getElementById('cpf').value = formatarCPF(dados.cpf) || 'Não informado';
    document.getElementById('telefone').value = dados.telefone || '';
}

// Formatadores
function formatarCPF(cpf) {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarTelefone(telefone) {
    if (!telefone) return '';
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

// Salvar alterações do perfil
async function salvarPerfil(dados) {
    try {
        const usuario = verificarERedirecionar();
        if (!usuario) return;

        const response = await fetch(`${API_BASE}/clientes/${usuario.codUsuario}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao salvar alterações');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Alterar senha
async function alterarSenha() {
    const novaSenha = prompt('Digite sua nova senha:');
    if (novaSenha && novaSenha.length >= 6) {
        try {
            // Implementar lógica de alteração de senha
            mostrarMensagem('Senha alterada com sucesso!', 'success');
        } catch (error) {
            mostrarMensagem('Erro ao alterar senha.', 'error');
        }
    } else if (novaSenha) {
        mostrarMensagem('A senha deve ter pelo menos 6 caracteres.', 'error');
    }
}

// Ver meus pedidos
function verMeusPedidos() {
    const usuario = verificarERedirecionar();
    if (usuario) {
        // Redirecionar para página de pedidos (a criar)
        alert('Redirecionando para página de pedidos...');
        // window.location.href = 'pedidos.html';
    }
}

// Exportar dados
function exportarDados() {
    if (usuarioDados) {
        const dadosStr = JSON.stringify(usuarioDados, null, 2);
        const blob = new Blob([dadosStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dados_glowered_${usuarioDados.codUsuario}.json`;
        a.click();
        URL.revokeObjectURL(url);
        mostrarMensagem('Dados exportados com sucesso!', 'success');
    }
}

// Excluir conta
async function excluirConta() {
    const confirmacao = confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.');
    
    if (confirmacao) {
        try {
            const usuario = verificarERedirecionar();
            if (!usuario) return;

            const response = await fetch(`${API_BASE}/clientes/${usuario.codUsuario}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                logout();
                mostrarMensagem('Conta excluída com sucesso.', 'success');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
            } else {
                throw new Error('Erro ao excluir conta');
            }
        } catch (error) {
            mostrarMensagem('Erro ao excluir conta.', 'error');
        }
    }
}

// Mostrar mensagens
function mostrarMensagem(mensagem, tipo) {
    const messageDiv = document.getElementById('form-message');
    messageDiv.textContent = mensagem;
    messageDiv.style.display = 'block';
    messageDiv.style.background = tipo === 'success' ? 'rgba(0, 230, 168, 0.1)' : 'rgba(255, 45, 149, 0.1)';
    messageDiv.style.color = tipo === 'success' ? 'var(--accent2)' : 'var(--accent1)';
    messageDiv.style.border = `1px solid ${tipo === 'success' ? 'var(--accent2)' : 'var(--accent1)'}`;

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // CORREÇÃO: Usar função que verifica E redireciona
    if (!verificarERedirecionar()) {
        return; // Já redirecionou para login
    }

    // Carregar dados do usuário
    carregarDadosUsuario();

    // Configurar máscara de telefone
    document.getElementById('telefone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{2})(\d)/, '($1) $2')
                        .replace(/(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = value;
    });

    // Configurar formulário
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const btnSubmit = this.querySelector('button[type="submit"]');
        const usuario = verificarERedirecionar();
        if (!usuario) return;

        const dadosAtualizados = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value
        };

        try {
            btnSubmit.textContent = 'SALVANDO...';
            btnSubmit.disabled = true;

            await salvarPerfil(dadosAtualizados);
            mostrarMensagem('Perfil atualizado com sucesso!', 'success');
            
            // Atualizar localStorage
            const usuarioStorage = JSON.parse(localStorage.getItem('user'));
            usuarioStorage.nome = dadosAtualizados.nome;
            usuarioStorage.email = dadosAtualizados.email;
            localStorage.setItem('user', JSON.stringify(usuarioStorage));

        } catch (error) {
            mostrarMensagem(error.message || 'Erro ao salvar alterações.', 'error');
        } finally {
            btnSubmit.textContent = 'SALVAR ALTERAÇÕES';
            btnSubmit.disabled = false;
        }
    });

    // Configurar logout
    document.getElementById('logoutButton').addEventListener('click', function() {
        logout();
    });

    // Configurar carrinho
    document.getElementById('cart-btn').addEventListener('click', function() {
        window.location.href = '../index.html';
    });

    // Efeitos hover nos cards de ação
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.borderColor = 'var(--accent3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.borderColor = 'var(--glass)';
        });
    });
});