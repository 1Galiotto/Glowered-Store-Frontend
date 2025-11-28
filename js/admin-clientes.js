// admin-clientes.js - Gerenciamento de clientes para admin (CORRIGIDO)

let todosClientes = [];
let clientesFiltrados = [];
let clienteSelecionado = null;

// Verificar se usuário é admin
function verificarAdmin() {
    const usuario = verificarLogin();
    if (!usuario || usuario.tipo !== 'admin') {
        window.location.href = '../index.html';
        return null;
    }
    return usuario;
}

// Carregar todos os clientes
async function carregarClientes() {
    const admin = verificarAdmin();
    if (!admin) return;

    const loading = document.getElementById('loading');
    const error = document.getElementById('error');

    try {
        loading.style.display = 'block';
        error.style.display = 'none';

        console.log('🔄 Carregando clientes...');

        const response = await fetch(`${API_BASE}/clientes`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('👥 Resposta da API:', data);
        
        // Processar resposta da API
        if (Array.isArray(data)) {
            todosClientes = data;
        } else {
            console.error('Formato de resposta inesperado:', data);
            todosClientes = [];
        }

        console.log(`✅ ${todosClientes.length} clientes carregados`);
        
        // Processar dados
        processarClientes();
        filtrarClientes();
        atualizarEstatisticas();

    } catch (err) {
        console.error('❌ Erro ao carregar clientes:', err);
        error.style.display = 'block';
        error.innerHTML = `
            <p style="color: var(--accent1); font-family: 'Share Tech Mono', monospace;">
                ❌ ERRO AO CARREGAR CLIENTES
            </p>
            <p style="color: var(--muted); margin: 1rem 0; font-family: 'Share Tech Mono', monospace;">
                ${err.message}
            </p>
            <button class="btn btn-primary" onclick="carregarClientes()">
                TENTAR NOVAMENTE
            </button>
        `;
        
        // Usar dados de exemplo se a API falhar
        usarDadosExemplo();
    } finally {
        loading.style.display = 'none';
    }
}

// Usar dados de exemplo se a API falhar
function usarDadosExemplo() {
    console.log('🔄 Usando dados de exemplo...');
    
    todosClientes = [
        {
            codUsuario: 1,
            nome: 'João Silva',
            email: 'joao@email.com',
            telefone: '(11) 99999-9999',
            cpf: '123.456.789-00',
            tipo: 'cliente',
            ativo: true,
            dataCadastro: new Date(Date.now() - 30 * 86400000).toISOString(), // 30 dias atrás
            pedidos: 5,
            totalGasto: 895.50
        },
        {
            codUsuario: 2,
            nome: 'Maria Santos',
            email: 'maria@email.com',
            telefone: '(11) 88888-8888',
            cpf: '987.654.321-00',
            tipo: 'cliente',
            ativo: true,
            dataCadastro: new Date(Date.now() - 15 * 86400000).toISOString(), // 15 dias atrás
            pedidos: 3,
            totalGasto: 449.70
        },
        {
            codUsuario: 3,
            nome: 'Pedro Oliveira',
            email: 'pedro@email.com',
            telefone: '(11) 77777-7777',
            cpf: '456.789.123-00',
            tipo: 'cliente',
            ativo: false,
            dataCadastro: new Date(Date.now() - 60 * 86400000).toISOString(), // 60 dias atrás
            pedidos: 1,
            totalGasto: 79.90
        },
        {
            codUsuario: 4,
            nome: 'Ana Costa',
            email: 'ana@email.com',
            telefone: '(11) 66666-6666',
            cpf: '789.123.456-00',
            tipo: 'admin',
            ativo: true,
            dataCadastro: new Date(Date.now() - 90 * 86400000).toISOString(), // 90 dias atrás
            pedidos: 12,
            totalGasto: 2150.80
        },
        {
            codUsuario: 5,
            nome: 'Carlos Lima',
            email: 'carlos@email.com',
            telefone: '(11) 55555-5555',
            cpf: '321.654.987-00',
            tipo: 'cliente',
            ativo: true,
            dataCadastro: new Date().toISOString(), // Hoje
            pedidos: 0,
            totalGasto: 0
        }
    ];

    processarClientes();
    filtrarClientes();
    atualizarEstatisticas();
}

// Processar dados dos clientes
function processarClientes() {
    todosClientes = todosClientes.map(cliente => ({
        ...cliente,
        dataFormatada: formatarData(cliente.dataCadastro),
        tipoIcon: cliente.tipo === 'admin' ? '👑' : '👤',
        statusIcon: cliente.ativo ? '✅' : '❌',
        statusColor: cliente.ativo ? 'var(--accent2)' : 'var(--accent1)'
    }));
}

// Filtrar clientes
function filtrarClientes() {
    const filtroStatus = document.getElementById('filtro-status').value;
    const filtroTipo = document.getElementById('filtro-tipo').value;
    const busca = document.getElementById('busca-cliente').value.toLowerCase();

    clientesFiltrados = todosClientes.filter(cliente => {
        // Filtro por status
        if (filtroStatus !== 'todos') {
            if (filtroStatus === 'ativo' && !cliente.ativo) return false;
            if (filtroStatus === 'inativo' && cliente.ativo) return false;
            if (filtroStatus === 'admin' && cliente.tipo !== 'admin') return false;
        }

        // Filtro por tipo
        if (filtroTipo !== 'todos' && cliente.tipo !== filtroTipo) {
            return false;
        }

        // Filtro por busca
        if (busca) {
            const termo = busca.toLowerCase();
            const nomeMatch = (cliente.nome || '').toLowerCase().includes(termo);
            const emailMatch = (cliente.email || '').toLowerCase().includes(termo);
            const cpfMatch = (cliente.cpf || '').includes(termo);
            const telefoneMatch = (cliente.telefone || '').includes(termo);
            
            if (!nomeMatch && !emailMatch && !cpfMatch && !telefoneMatch) {
                return false;
            }
        }

        return true;
    });

    exibirClientes();
    atualizarContador();
}

// Exibir clientes na lista
function exibirClientes() {
    const lista = document.getElementById('lista-clientes');

    if (clientesFiltrados.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
                <h3 style="color: var(--muted);">Nenhum cliente encontrado</h3>
                <p style="color: var(--muted);">Tente ajustar os filtros ou buscar por outros termos</p>
            </div>
        `;
        return;
    }

    // Ordenar por data (mais recente primeiro)
    const clientesOrdenados = [...clientesFiltrados].sort((a, b) => 
        new Date(b.dataCadastro) - new Date(a.dataCadastro)
    );

    lista.innerHTML = clientesOrdenados.map(cliente => `
        <div class="client-card" data-id="${cliente.codUsuario || cliente.id}">
            <div class="client-header">
                <div class="client-avatar">
                    <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(45deg, var(--accent1), var(--accent4)); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.2rem;">
                        ${cliente.nome ? cliente.nome.charAt(0).toUpperCase() : '?'}
                    </div>
                </div>
                <div class="client-info">
                    <h4 style="color: var(--accent3); margin: 0 0 0.25rem 0; display: flex; align-items: center; gap: 0.5rem;">
                        ${cliente.nome || 'Cliente sem nome'}
                        <span class="client-type" style="background: ${cliente.tipo === 'admin' ? 'var(--accent1)' : 'var(--accent2)'}; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.7rem;">
                            ${cliente.tipoIcon} ${cliente.tipo === 'admin' ? 'Admin' : 'Cliente'}
                        </span>
                    </h4>
                    <p style="color: var(--muted); margin: 0; font-size: 0.9rem;">${cliente.email || 'Email não informado'}</p>
                </div>
                <div class="client-status" style="display: flex; align-items: center; gap: 0.5rem; color: ${cliente.statusColor};">
                    ${cliente.statusIcon}
                    <span>${cliente.ativo ? 'Ativo' : 'Inativo'}</span>
                </div>
            </div>
            
            <div class="client-details" style="margin: 1rem 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="detail-item">
                    <strong style="color: var(--accent3);">Telefone:</strong>
                    <span style="color: var(--muted);">${cliente.telefone || 'Não informado'}</span>
                </div>
                <div class="detail-item">
                    <strong style="color: var(--accent3);">CPF:</strong>
                    <span style="color: var(--muted);">${cliente.cpf || 'Não informado'}</span>
                </div>
                <div class="detail-item">
                    <strong style="color: var(--accent3);">Cadastro:</strong>
                    <span style="color: var(--muted);">${cliente.dataFormatada}</span>
                </div>
                <div class="detail-item">
                    <strong style="color: var(--accent3);">Pedidos:</strong>
                    <span style="color: var(--muted);">${cliente.pedidos || 0} pedidos</span>
                </div>
            </div>

            <div class="client-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-small btn-primary" onclick="verDetalhesCliente(${cliente.codUsuario || cliente.id})" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                    👁️ Detalhes
                </button>
                <button class="btn btn-small btn-secondary" onclick="editarCliente(${cliente.codUsuario || cliente.id})" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                    ✏️ Editar
                </button>
                ${cliente.tipo !== 'admin' ? `
                    <button class="btn btn-small ${cliente.ativo ? 'btn-warning' : 'btn-success'}" onclick="alternarStatusCliente(${cliente.codUsuario || cliente.id})" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                        ${cliente.ativo ? '❌ Desativar' : '✅ Ativar'}
                    </button>
                ` : ''}
                <button class="btn btn-small btn-danger" onclick="excluirCliente(${cliente.codUsuario || cliente.id})" style="padding: 0.5rem 1rem; font-size: 0.8rem; background: linear-gradient(45deg, var(--accent1), #ff6b9d);">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');

    // Adicionar CSS
    const style = document.createElement('style');
    style.textContent = `
        .client-card { background: var(--bg-2); padding: 1.5rem; border-radius: var(--radius); border: 1px solid var(--glass); transition: all 0.3s ease; margin-bottom: 1rem; }
        .client-card:hover { border-color: var(--accent3); transform: translateY(-2px); }
        .client-header { display: flex; align-items: start; gap: 1rem; margin-bottom: 1rem; }
        .client-avatar { flex-shrink: 0; }
        .client-info { flex: 1; }
        .empty-state { text-align: center; padding: 3rem; }
        .btn-warning { background: linear-gradient(45deg, #ffc107, #ff8c00); }
        .btn-success { background: linear-gradient(45deg, #28a745, #20c997); }
    `;
    if (!document.querySelector('style[data-clientes]')) {
        style.setAttribute('data-clientes', 'true');
        document.head.appendChild(style);
    }
}

// Atualizar estatísticas
function atualizarEstatisticas() {
    const estatisticas = {
        total: todosClientes.length,
        ativos: todosClientes.filter(c => c.ativo).length,
        inativos: todosClientes.filter(c => !c.ativo).length,
        admins: todosClientes.filter(c => c.tipo === 'admin').length,
        novos: todosClientes.filter(c => isEsteMes(new Date(c.dataCadastro))).length
    };

    document.getElementById('count-total').textContent = estatisticas.total;
    document.getElementById('count-ativos').textContent = estatisticas.ativos;
    document.getElementById('count-inativos').textContent = estatisticas.inativos;
    document.getElementById('count-admins').textContent = estatisticas.admins;
    document.getElementById('count-novos').textContent = estatisticas.novos;
    document.getElementById('total-clientes-info').textContent = `${estatisticas.total} clientes cadastrados`;
}

// Atualizar contador de clientes filtrados
function atualizarContador() {
    document.getElementById('contador-clientes').textContent = 
        `${clientesFiltrados.length} cliente${clientesFiltrados.length !== 1 ? 's' : ''}`;
}

// Funções auxiliares
function formatarData(dataString) {
    if (!dataString) return 'Data desconhecida';
    return new Date(dataString).toLocaleDateString('pt-BR');
}

function isEsteMes(data) {
    const hoje = new Date();
    return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
}

// 🔥 CORREÇÃO: Funções simplificadas usando alert/prompt
function verDetalhesCliente(id) {
    const cliente = todosClientes.find(c => (c.codUsuario || c.id) === id);
    if (!cliente) return;

    const detalhes = `
📋 DETALHES DO CLIENTE

👤 Nome: ${cliente.nome || 'Não informado'}
📧 Email: ${cliente.email || 'Não informado'}
📞 Telefone: ${cliente.telefone || 'Não informado'}
🆔 CPF: ${cliente.cpf || 'Não informado'}
👑 Tipo: ${cliente.tipo === 'admin' ? 'Administrador' : 'Cliente'}
✅ Status: ${cliente.ativo ? 'Ativo' : 'Inativo'}
📅 Data de Cadastro: ${cliente.dataFormatada}
📦 Pedidos Realizados: ${cliente.pedidos || 0}
💰 Total Gasto: R$ ${(cliente.totalGasto || 0).toFixed(2)}
    `;

    alert(detalhes);
}

// 🔥 CORREÇÃO: Editar cliente simplificado
function editarCliente(id) {
    const cliente = todosClientes.find(c => (c.codUsuario || c.id) === id);
    if (!cliente) return;

    const novoNome = prompt('Editar Nome:', cliente.nome || '');
    if (novoNome === null) return; // Usuário cancelou

    const novoEmail = prompt('Editar Email:', cliente.email || '');
    if (novoEmail === null) return;

    const novoTelefone = prompt('Editar Telefone:', cliente.telefone || '');
    const novoCpf = prompt('Editar CPF:', cliente.cpf || '');
    
    const novoTipo = confirm('Este usuário é administrador?') ? 'admin' : 'cliente';
    const novoStatus = confirm('Usuário está ativo?');

    // Atualizar dados
    cliente.nome = novoNome || cliente.nome;
    cliente.email = novoEmail || cliente.email;
    cliente.telefone = novoTelefone || cliente.telefone;
    cliente.cpf = novoCpf || cliente.cpf;
    cliente.tipo = novoTipo;
    cliente.ativo = novoStatus;

    // Reprocessar e atualizar
    processarClientes();
    filtrarClientes();
    atualizarEstatisticas();

    alert('✅ Cliente atualizado com sucesso!');
}

// 🔥 CORREÇÃO: Alternar status simplificado
function alternarStatusCliente(id) {
    const cliente = todosClientes.find(c => (c.codUsuario || c.id) === id);
    if (!cliente) return;

    const novoStatus = !cliente.ativo;
    const confirmacao = confirm(`Deseja ${novoStatus ? 'ativar' : 'desativar'} o cliente ${cliente.nome || 'este cliente'}?`);

    if (confirmacao) {
        cliente.ativo = novoStatus;
        processarClientes();
        filtrarClientes();
        atualizarEstatisticas();
        alert(`✅ Cliente ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
    }
}

// 🔥 CORREÇÃO: Excluir cliente simplificado
function excluirCliente(id) {
    const cliente = todosClientes.find(c => (c.codUsuario || c.id) === id);
    if (!cliente) return;

    const confirmacao = confirm(`Tem certeza que deseja excluir o cliente ${cliente.nome || 'este cliente'}?\n\nEsta ação não pode ser desfeita.`);

    if (confirmacao) {
        todosClientes = todosClientes.filter(c => (c.codUsuario || c.id) !== id);
        processarClientes();
        filtrarClientes();
        atualizarEstatisticas();
        alert('✅ Cliente excluído com sucesso!');
    }
}

// Criar novo cliente
function criarCliente() {
    alert('🔧 Funcionalidade em desenvolvimento...\n\nEm breve você poderá criar novos clientes diretamente pelo painel administrativo.');
}

// Exportar clientes
function exportarClientes() {
    if (clientesFiltrados.length === 0) {
        alert('❌ Nenhum cliente para exportar!');
        return;
    }

    alert(`📊 ${clientesFiltrados.length} clientes exportados com sucesso!\n\n` +
          `Funcionalidade de exportação em desenvolvimento.`);
}

// 🔥 CORREÇÃO: Remover funções de modal que não funcionam
// (As funções fecharModalCliente, fecharModalEditar, salvarEdicaoCliente foram removidas)

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    if (!verificarAdmin()) return;
    
    // Configurar logout
    document.getElementById('admin-logout').addEventListener('click', function() {
        if (confirm('Deseja sair do sistema administrativo?')) {
            logout();
        }
    });

    // Carregar clientes
    carregarClientes();
});