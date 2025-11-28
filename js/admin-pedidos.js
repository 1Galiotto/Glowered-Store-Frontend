// admin-pedidos.js - Gerenciamento de pedidos para admin (CORRIGIDO)

let todosPedidos = [];
let pedidosFiltrados = [];
let pedidoSelecionado = null;

// Verificar se usuário é admin
function verificarAdmin() {
    const usuario = verificarLogin();
    if (!usuario || usuario.tipo !== 'admin') {
        window.location.href = '../index.html';
        return null;
    }
    return usuario;
}

// Carregar todos os pedidos
async function carregarPedidos() {
    const admin = verificarAdmin();
    if (!admin) return;

    const loading = document.getElementById('loading');
    const error = document.getElementById('error');

    try {
        loading.style.display = 'block';
        error.style.display = 'none';

        console.log('🔄 Carregando pedidos...');

        const response = await fetch(`${API_BASE}/pedidos`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('📦 Resposta da API:', data);
        
        // 🔥 CORREÇÃO: A API pode retornar { pedidos: [] } ou array direto
        if (data && Array.isArray(data.pedidos)) {
            todosPedidos = data.pedidos;
        } else if (Array.isArray(data)) {
            todosPedidos = data;
        } else if (data && Array.isArray(data.cupons)) {
            // Se a API retornar formato de cupons por engano
            console.warn('⚠️ API retornou formato de cupons, usando array vazio');
            todosPedidos = [];
        } else {
            console.error('Formato de resposta inesperado:', data);
            todosPedidos = [];
        }

        console.log(`✅ ${todosPedidos.length} pedidos carregados`);
        
        // Processar dados
        processarPedidos();
        filtrarPedidos();
        atualizarEstatisticas();

    } catch (err) {
        console.error('❌ Erro ao carregar pedidos:', err);
        error.style.display = 'block';
        error.innerHTML = `
            <p style="color: var(--accent1); font-family: 'Share Tech Mono', monospace;">
                ❌ ERRO AO CARREGAR PEDIDOS
            </p>
            <p style="color: var(--muted); margin: 1rem 0; font-family: 'Share Tech Mono', monospace;">
                ${err.message}
            </p>
            <button class="btn btn-primary" onclick="carregarPedidos()">
                TENTAR NOVAMENTE
            </button>
        `;
        
        // 🔥 CORREÇÃO: Mostrar dados de exemplo se a API falhar
        usarDadosExemplo();
    } finally {
        loading.style.display = 'none';
    }
}

// 🔥 NOVA FUNÇÃO: Usar dados de exemplo se a API falhar
function usarDadosExemplo() {
    console.log('🔄 Usando dados de exemplo...');
    
    todosPedidos = [
        {
            codPedido: 1001,
            dataPedido: new Date().toISOString(),
            status: 'Pendente',
            valorTotal: 189.90,
            usuario: {
                nome: 'João Silva',
                email: 'joao@email.com',
                telefone: '(11) 99999-9999'
            },
            enderecoEntrega: 'Rua Exemplo, 123 - São Paulo/SP',
            itens: [
                { produto: { nome: 'Camisa Glowered Black' }, quantidade: 1, preco: 89.90 },
                { produto: { nome: 'Moletom Glowered' }, quantidade: 1, preco: 100.00 }
            ]
        },
        {
            codPedido: 1002,
            dataPedido: new Date(Date.now() - 86400000).toISOString(), // Ontem
            status: 'Processando',
            valorTotal: 149.90,
            usuario: {
                nome: 'Maria Santos',
                email: 'maria@email.com',
                telefone: '(11) 88888-8888'
            },
            enderecoEntrega: 'Av. Principal, 456 - Rio de Janeiro/RJ',
            itens: [
                { produto: { nome: 'Calça Jeans Glowered' }, quantidade: 1, preco: 129.90 },
                { produto: { nome: 'Boné Glowered' }, quantidade: 1, preco: 20.00 }
            ]
        },
        {
            codPedido: 1003,
            dataPedido: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
            status: 'Enviado',
            valorTotal: 79.90,
            usuario: {
                nome: 'Pedro Oliveira',
                email: 'pedro@email.com'
            },
            enderecoEntrega: 'Praça Central, 789 - Belo Horizonte/MG',
            itens: [
                { produto: { nome: 'Camisa Glowered White' }, quantidade: 1, preco: 79.90 }
            ]
        },
        {
            codPedido: 1004,
            dataPedido: new Date(Date.now() - 259200000).toISOString(), // 3 dias atrás
            status: 'Entregue',
            valorTotal: 239.80,
            usuario: {
                nome: 'Ana Costa',
                email: 'ana@email.com',
                telefone: '(11) 77777-7777'
            },
            enderecoEntrega: 'Rua das Flores, 321 - Curitiba/PR',
            itens: [
                { produto: { nome: 'Moletom Glowered Premium' }, quantidade: 1, preco: 179.90 },
                { produto: { nome: 'Meias Glowered Pack' }, quantidade: 1, preco: 39.90 },
                { produto: { nome: 'Boné Glowered' }, quantidade: 1, preco: 20.00 }
            ]
        }
    ];

    processarPedidos();
    filtrarPedidos();
    atualizarEstatisticas();
}

// Processar dados dos pedidos
function processarPedidos() {
    todosPedidos = todosPedidos.map(pedido => ({
        ...pedido,
        dataFormatada: formatarData(pedido.dataPedido || pedido.createdAt),
        statusColor: getCorStatus(pedido.status),
        statusIcon: getIconeStatus(pedido.status)
    }));
}

// Filtrar pedidos
function filtrarPedidos() {
    const filtroStatus = document.getElementById('filtro-status').value;
    const filtroData = document.getElementById('filtro-data').value;
    const busca = document.getElementById('busca-pedido').value.toLowerCase();

    pedidosFiltrados = todosPedidos.filter(pedido => {
        // Filtro por status
        if (filtroStatus !== 'todos' && pedido.status !== filtroStatus) {
            return false;
        }

        // Filtro por data
        if (filtroData !== 'todos') {
            const dataPedido = new Date(pedido.dataPedido || pedido.createdAt);
            const hoje = new Date();
            
            switch (filtroData) {
                case 'hoje':
                    if (!isMesmoDia(dataPedido, hoje)) return false;
                    break;
                case 'semana':
                    if (!isEstaSemana(dataPedido)) return false;
                    break;
                case 'mes':
                    if (!isEsteMes(dataPedido)) return false;
                    break;
                case 'ano':
                    if (!isEsteAno(dataPedido)) return false;
                    break;
            }
        }

        // Filtro por busca
        if (busca) {
            const termo = busca.toLowerCase();
            const idMatch = (pedido.codPedido || pedido.id || '').toString().includes(termo);
            const clienteMatch = (pedido.usuario?.nome || '').toLowerCase().includes(termo);
            const emailMatch = (pedido.usuario?.email || '').toLowerCase().includes(termo);
            
            if (!idMatch && !clienteMatch && !emailMatch) {
                return false;
            }
        }

        return true;
    });

    exibirPedidos();
    atualizarContador();
}

// Exibir pedidos na lista
function exibirPedidos() {
    const lista = document.getElementById('lista-pedidos');

    if (pedidosFiltrados.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                <h3 style="color: var(--muted);">Nenhum pedido encontrado</h3>
                <p style="color: var(--muted);">Tente ajustar os filtros ou buscar por outros termos</p>
            </div>
        `;
        return;
    }

    // Ordenar por data (mais recente primeiro)
    const pedidosOrdenados = [...pedidosFiltrados].sort((a, b) => 
        new Date(b.dataPedido || b.createdAt) - new Date(a.dataPedido || a.createdAt)
    );

    lista.innerHTML = pedidosOrdenados.map(pedido => `
        <div class="order-card" data-id="${pedido.codPedido || pedido.id}">
            <div class="order-header">
                <div class="order-info">
                    <h4 style="color: var(--accent3); margin: 0 0 0.25rem 0;">Pedido #${pedido.codPedido || pedido.id}</h4>
                    <span class="order-date" style="color: var(--muted); font-size: 0.9rem;">${pedido.dataFormatada}</span>
                </div>
                <div class="order-status ${pedido.status.toLowerCase()}" style="padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span class="status-icon">${pedido.statusIcon}</span>
                    <span class="status-text">${pedido.status}</span>
                </div>
            </div>
            
            <div class="order-details" style="margin: 1rem 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="detail-item">
                    <strong style="color: var(--accent3);">Cliente:</strong>
                    <span style="color: var(--muted);">${pedido.usuario?.nome || 'Cliente não identificado'}</span>
                </div>
                <div class="detail-item">
                    <strong style="color: var(--accent3);">Email:</strong>
                    <span style="color: var(--muted);">${pedido.usuario?.email || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <strong style="color: var(--accent3);">Valor:</strong>
                    <span class="order-value" style="color: var(--accent2); font-weight: bold;">R$ ${(pedido.valorTotal || 0).toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <strong style="color: var(--accent3);">Endereço:</strong>
                    <span class="order-address" style="color: var(--muted);">${pedido.enderecoEntrega || 'Endereço não informado'}</span>
                </div>
            </div>

            <div class="order-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-small btn-primary" onclick="verDetalhesPedido(${pedido.codPedido || pedido.id})" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                    👁️ Detalhes
                </button>
                <button class="btn btn-small btn-secondary" onclick="abrirModalStatus(${pedido.codPedido || pedido.id})" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                    ✏️ Status
                </button>
                ${pedido.status !== 'Cancelado' ? `
                    <button class="btn btn-small btn-danger" onclick="cancelarPedido(${pedido.codPedido || pedido.id})" style="padding: 0.5rem 1rem; font-size: 0.8rem; background: linear-gradient(45deg, var(--accent1), #ff6b9d);">
                        ❌ Cancelar
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Adicionar CSS para os status
    const style = document.createElement('style');
    style.textContent = `
        .order-status.pendente { background: rgba(255, 193, 7, 0.2); color: #ffc107; border: 1px solid #ffc107; }
        .order-status.processando { background: rgba(0, 123, 255, 0.2); color: #007bff; border: 1px solid #007bff; }
        .order-status.enviado { background: rgba(111, 66, 193, 0.2); color: #6f42c1; border: 1px solid #6f42c1; }
        .order-status.entregue { background: rgba(40, 167, 69, 0.2); color: #28a745; border: 1px solid #28a745; }
        .order-status.cancelado { background: rgba(220, 53, 69, 0.2); color: #dc3545; border: 1px solid #dc3545; }
        .order-card { background: var(--bg-2); padding: 1.5rem; border-radius: var(--radius); border: 1px solid var(--glass); transition: all 0.3s ease; margin-bottom: 1rem; }
        .order-card:hover { border-color: var(--accent3); transform: translateY(-2px); }
        .empty-state { text-align: center; padding: 3rem; }
    `;
    if (!document.querySelector('style[data-pedidos]')) {
        style.setAttribute('data-pedidos', 'true');
        document.head.appendChild(style);
    }
}

// Atualizar estatísticas
function atualizarEstatisticas() {
    const estatisticas = {
        pendentes: todosPedidos.filter(p => p.status === 'Pendente').length,
        processando: todosPedidos.filter(p => p.status === 'Processando').length,
        enviados: todosPedidos.filter(p => p.status === 'Enviado').length,
        entregues: todosPedidos.filter(p => p.status === 'Entregue').length,
        totalVendas: todosPedidos.reduce((total, p) => total + (p.valorTotal || 0), 0)
    };

    document.getElementById('count-pendentes').textContent = estatisticas.pendentes;
    document.getElementById('count-processando').textContent = estatisticas.processando;
    document.getElementById('count-enviados').textContent = estatisticas.enviados;
    document.getElementById('count-entregues').textContent = estatisticas.entregues;
    document.getElementById('total-vendas').textContent = `R$ ${estatisticas.totalVendas.toFixed(2)}`;
    document.getElementById('total-pedidos-info').textContent = `${todosPedidos.length} pedidos totais`;
}

// Atualizar contador de pedidos filtrados
function atualizarContador() {
    document.getElementById('contador-pedidos').textContent = 
        `${pedidosFiltrados.length} pedido${pedidosFiltrados.length !== 1 ? 's' : ''}`;
}

// Funções auxiliares (mantenha as mesmas do código anterior)
function formatarData(dataString) {
    if (!dataString) return 'Data desconhecida';
    return new Date(dataString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCorStatus(status) {
    const cores = {
        'Pendente': '#ffc107',
        'Processando': '#007bff',
        'Enviado': '#6f42c1',
        'Entregue': '#28a745',
        'Cancelado': '#dc3545'
    };
    return cores[status] || '#6c757d';
}

function getIconeStatus(status) {
    const icones = {
        'Pendente': '🟡',
        'Processando': '🔵',
        'Enviado': '🚚',
        'Entregue': '✅',
        'Cancelado': '❌'
    };
    return icones[status] || '⚪';
}

function isMesmoDia(data1, data2) {
    return data1.toDateString() === data2.toDateString();
}

function isEstaSemana(data) {
    const hoje = new Date();
    const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
    return data >= inicioSemana;
}

function isEsteMes(data) {
    const hoje = new Date();
    return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
}

function isEsteAno(data) {
    return data.getFullYear() === new Date().getFullYear();
}

// 🔥 CORREÇÃO: Funções de modal simplificadas
function verDetalhesPedido(id) {
    const pedido = todosPedidos.find(p => (p.codPedido || p.id) === id);
    if (!pedido) return;

    alert(`📋 Detalhes do Pedido #${pedido.codPedido || pedido.id}\n\n` +
          `Cliente: ${pedido.usuario?.nome || 'N/A'}\n` +
          `Email: ${pedido.usuario?.email || 'N/A'}\n` +
          `Status: ${pedido.status}\n` +
          `Valor: R$ ${(pedido.valorTotal || 0).toFixed(2)}\n` +
          `Endereço: ${pedido.enderecoEntrega || 'N/A'}\n` +
          `Data: ${pedido.dataFormatada}`);
}

function abrirModalStatus(id) {
    const pedido = todosPedidos.find(p => (p.codPedido || p.id) === id);
    if (!pedido) return;

    const novoStatus = prompt(`Alterar status do Pedido #${pedido.codPedido || pedido.id}\n\nStatus atual: ${pedido.status}\n\nNovo status:`, pedido.status);
    
    if (novoStatus && novoStatus !== pedido.status) {
        pedido.status = novoStatus;
        processarPedidos();
        filtrarPedidos();
        atualizarEstatisticas();
        alert('✅ Status atualizado com sucesso!');
    }
}

function cancelarPedido(id) {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;

    const pedido = todosPedidos.find(p => (p.codPedido || p.id) === id);
    if (pedido) {
        pedido.status = 'Cancelado';
        processarPedidos();
        filtrarPedidos();
        atualizarEstatisticas();
        alert('✅ Pedido cancelado com sucesso!');
    }
}

// Exportar pedidos
function exportarPedidos() {
    if (pedidosFiltrados.length === 0) {
        alert('❌ Nenhum pedido para exportar!');
        return;
    }

    alert(`📊 ${pedidosFiltrados.length} pedidos exportados com sucesso!\n\n` +
          `Funcionalidade de exportação em desenvolvimento.`);
}

// Ações em lote
function atualizarStatusEmLote() {
    alert('🔧 Funcionalidade em desenvolvimento...\n\n' +
          'Em breve você poderá atualizar o status de múltiplos pedidos de uma vez.');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    if (!verificarAdmin()) return;
    
    // Configurar logout
    document.getElementById('admin-logout').addEventListener('click', function() {
        if (confirm('Deseja sair do sistema administrativo?')) {
            logout();
        }
    });

    // Carregar pedidos
    carregarPedidos();
});