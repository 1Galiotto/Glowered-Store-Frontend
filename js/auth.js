// Configurações da API
const API_BASE = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'https://glowered-store-backend-production.up.railway.app';

// Verificar se usuário está logado
function verificarLogin() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        return null;
    }
    
    try {
        return JSON.parse(user);
    } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
    }
}

function verificarERedirecionar() {
    const usuario = verificarLogin();
    if (!usuario) {
        window.location.href = './html/login.html';
        return null;
    }
    return usuario;
}

// Fazer login
async function login(email, senha) {
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Credenciais inválidas');
        }

        if (data.token && data.user) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } else if (data.token && data.usuario) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.usuario));
            return data;
        } else {
            throw new Error('Estrutura de resposta inválida');
        }
    } catch (error) {
        throw new Error(error.message || 'Erro de conexão');
    }
}

// Fazer cadastro
async function cadastrar(usuarioData) {
    try {
        const response = await fetch(`${API_BASE}/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usuarioData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro no cadastro');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Fazer logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './login.html';
}

// Obter headers de autenticação
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Verificar token expirado
function verificarToken() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const agora = Math.floor(Date.now() / 1000);
        return payload.exp > agora;
    } catch {
        return false;
    }
}

// Atualizar dados do usuário
async function atualizarUsuario(dadosAtualizados) {
    try {
        const usuario = verificarLogin();
        if (!usuario) throw new Error('Usuário não autenticado');

        const response = await fetch(`${API_BASE}/usuarios/${usuario.codUsuario}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(dadosAtualizados)
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar usuário');
        }

        const usuarioAtualizado = await response.json();
        localStorage.setItem('user', JSON.stringify(usuarioAtualizado));
        return usuarioAtualizado;

    } catch (error) {
        throw error;
    }
}

// Alterar senha
async function alterarSenha(senhaAtual, novaSenha) {
    try {
        const usuario = verificarLogin();
        if (!usuario) throw new Error('Usuário não autenticado');

        const response = await fetch(`${API_BASE}/usuarios/${usuario.codUsuario}/senha`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                senhaAtual,
                novaSenha
            })
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.message || 'Erro ao alterar senha');
        }

        return await response.json();

    } catch (error) {
        throw error;
    }
}

// Obter headers de autenticação
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Verificar permissões de admin
function isAdmin() {
    const usuario = verificarLogin();
    return usuario && usuario.tipo === 'admin';
}

// Redirecionar se não for admin
function redirecionarSeNaoAdmin() {
    if (!isAdmin()) {
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

// Recuperar senha
async function recuperarSenha(email) {
    try {
        const response = await fetch(`${API_BASE}/recuperar-senha`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            throw new Error('Erro ao solicitar recuperação de senha');
        }

        return await response.json();

    } catch (error) {
        throw error;
    }
}