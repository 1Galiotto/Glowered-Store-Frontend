// Configurações da API
// const API_BASE = 'http://localhost:3000';
const API_BASE = 'glowered-store-backend-production.up.railway.app';

// Verificar se usuário está logado
function verificarLogin() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        return null; // Apenas retorna null, não redireciona
    }
    
    try {
        return JSON.parse(user);
    } catch {
        // Se der erro ao parsear, limpa os dados inválidos
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
    }
}

function verificarERedirecionar() {
    const usuario = verificarLogin();
    if (!usuario) {
        window.location.href = 'html/login.html';
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

        // CORREÇÃO: Verificar a estrutura da resposta
        if (data.token && data.user) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } else if (data.token && data.usuario) {
            // Se a API retornar 'usuario' em vez de 'user'
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
    
    // Aqui você pode adicionar verificação de expiração JWT
    // Por enquanto, só verifica se existe
    return true;
}
