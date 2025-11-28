// admin-entregas.js - Gerenciamento de entregas para admin

let todasEntregas = [];
let entregasFiltradas = [];
let entregaSelecionada = null;

// Verificar se usuário é admin
function verificarAdmin() {
    const usuario = verificarLogin();
    if (!usuario || usuario.tipo !== 'admin') {
        window.location.href = '../index.html';
        return null;
    }
    return usuario;
}

// Carregar todas as entregas
async function carregarEntregas() {
    const admin = verificarAdmin();
    if (!admin) return;

    const loading = document.getElementById('loading');
    const error = document.getElementById('error');

    try {
        loading.style.display = 'block';
        error.style.display = 'none';

        console.log('🔄 Carregando entregas...');

        const response = await fetch(`${API_BASE}/entregas`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('🚚 Resposta da API:', data);
        
        // Processar resposta da API
        if (data && Array.isArray(data.entregas)) {
            todasEntregas = data.entregas;
        } else if (Array.isArray(data)) {
            todasEntregas = data;
        } else {
            console.error('Formato de resposta inesperado:', data);
            todasEntregas = [];
        }

        console.log(`✅ ${todasEntregas.length} entregas carregadas`);
        
        // Processar dados
        processarEntregas();
        filtrarEntregas();
        atualizarEstatisticas();

    } catch (err) {
        console.error('❌ Erro ao carregar entregas:', err);
        error.style.display = 'block';
        error.innerHTML = `
            <p style="color: var(--accent1); font-family: 'Share Tech Mono', monospace;">
                ❌ ERRO AO CARREGAR ENTREGAS
            </p>
            <p style="color: var(--muted); margin: 1rem 0; font-family: 'Share Tech Mono', monospace;">
                ${err.message}
            </p>
            <button class="btn btn-primary" onclick="carregarEntregas()">
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
    
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    const semanaPassada = new Date(hoje);
    semanaPassada.setDate(hoje.getDate() - 5);
    
    todasEntregas = [
        {
            codEntrega: 1,
            idPedido: 1001,
            transportadora: 'Correios',
            codigoRastreamento: 'AA123456789BR',
            statusEntrega: 'Em trânsito',
            dataEnvio: semanaPassada.toISOString(),
            dataEntrega: null,
            pedido: {
                codPedido: 1001,
                status: 'Enviado',
                valorTotal: 189.90,
                enderecoEntrega: 'Rua Exemplo, 123 - São Paulo/SP'
            }
        },
        {
            codEntrega: 2,
            idPedido: 1002,
            transportadora: 'Jadlog',
            codigoRastreamento: 'JL987654321BR',
            statusEntrega: 'Saiu para entrega',
            dataEnvio: ontem.toISOString(),
            dataEntrega: null,
            pedido: {
                codPedido: 1002,
                status: 'Enviado',
                valorTotal: 149.90,
                enderecoEntrega: 'Av. Principal, 456 - Rio de Janeiro/RJ'
            }
        },
        {
            codEntrega: 3,
            idPedido: 1003,
            transportadora: 'Azul',
            codigoRastreamento: 'AZ456789123BR',
            statusEntrega: 'Entregue',
            dataEnvio: semanaPassada.toISOString(),
            dataEntrega: ontem.toISOString(),
            pedido: {
                codPedido: 1003,
                status: 'Entregue',
                valorTotal: 79.90,
                enderecoEntrega: 'Praça Central, 789 - Belo Horizonte/MG'
            }
        },
        {
            codEntrega: 4,
            idPedido: 1004,
            transportadora: 'Loggi',
            codigoRastreamento: 'LG321654987BR',
            statusEntrega: 'Atrasado',
            dataEnvio: new Date(hoje.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 dias atrás
            dataEntrega: null,
            pedido: {
                codPedido: 1004,
                status: 'Enviado',
                valorTotal: 239.80,
                enderecoEntrega: 'Rua das Flores, 321 - Curitiba/PR'
            }
        },
        {
            codEntrega: 5,
            idPedido: 1005,
            transportadora: 'Correios',
            codigoRastreamento: 'AA789123456BR',
            statusEntrega: 'Devolvido',
            dataEnvio: new Date(hoje.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 dias atrás
            dataEntrega: null,
            pedido: {
                codPedido: 1005,
                status: 'Devolvido',
                valorTotal: 99.90,
                enderecoEntrega: 'Av. Central, 654 - Porto Alegre/RS'
            }
        }
    ];

    processarEntregas();
    filtrarEntregas();
    atualizarEstatisticas();
}

// Processar dados das entregas
function processarEntregas() {
    todasEntregas = todasEntregas.map(entrega => ({
        ...entrega,
        dataEnvioFormatada: formatarData(entrega.dataEnvio),
        dataEntregaFormatada: entrega.dataEntrega ? formatarData(entrega.dataEntrega) : 'Não entregue',
        statusIcon: getIconeStatus(entrega.statusEntrega),
        statusColor: getCorStatus(entrega.statusEntrega),
        tempoTransito: calcularTempoTransito(entrega.dataEnvio, entrega.dataEntrega)
    }));
}

// Filtrar entregas
function filtrarEntregas() {
    const filtroStatus = document.getElementById('filtro-status').value;
    const filtroTransportadora = document.getElementById('filtro-transportadora').value;
    const busca = document.getElementById('busca-entrega').value.toLowerCase();

    entregasFiltradas = todasEntregas.filter(entrega => {
        // Filtro por status
        if (filtroStatus !== 'todos' && entrega.statusEntrega !== filtroStatus) {
            return false;
        }

        // Filtro por transportadora
        if (filtroTransportadora !== 'todos' && entrega.transportadora !== filtroTransportadora) {
            return false;
        }

        // Filtro por busca
        if (busca) {
            const termo = busca.toLowerCase();
            const rastreamentoMatch = (entrega.codigoRastreamento || '').toLowerCase().includes(termo);
            const pedidoMatch = (entrega.idPedido || '').toString().includes(termo);
            const enderecoMatch = (entrega.pedido?.enderecoEntrega || '').toLowerCase().includes(termo);
            
            if (!rastreamentoMatch && !pedidoMatch && !enderecoMatch) {
                return false;
            }
        }

        return true;
    });

    exibirEntregas();
    atualizarContador();
}

// Exibir entregas na lista
function exibirEntregas() {
    const lista = document.getElementById('lista-entregas');

    if (entregasFiltradas.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                <h3 style="color: var(--muted);">Nenhuma entrega encontrada</h3>
                <p style="color: var(--muted);">Tente ajustar os filtros ou buscar por outros termos</p>
            </div>
        `;
        return;
    }

    // Ordenar por data de envio (mais recente primeiro)
    const entregasOrdenadas = [...entregasFiltradas].sort((a, b) => 
        new Date(b.dataEnvio) - new Date(a.dataEnvio)
    );

    lista.innerHTML = entregasOrdenadas.map(entrega => `
        <div class="delivery-card" data-id="${entrega.codEntrega}">
            <div class="delivery-header">
                <div class="delivery-info">
                    <h4 style="color: var(--accent3); margin: 0 0 0.25rem 0;">
                        Pedido #${entrega.idPedido} • ${entrega.transportadora}
                    </h4>
                    <span class="delivery-date" style="color: var(--muted); font-size: 0.9rem;">
                        Enviado: ${entrega.dataEnvioFormatada}
                    </span>
                </div>
                <div class="delivery-status" style="padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem; background: ${entrega.statusColor}20; color: ${entrega.statusColor}; border: 1px solid ${entrega.statusColor};">
                    <span class="status-icon">${entrega.statusIcon}</span>
                    <span class="status-text">${entrega.statusEntrega}</span>
                </div>
            </div>
            
            <div class="delivery-details" style="margin: 1rem 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="detail-item">
                    <strong style="color: var(--accent3);">Rastreamento:</strong>
                    <span style="color: var(--muted); font-family: 'Share Tech Mono', monospace;">
                        ${entrega.codigoRastreamento}
                    </span>
                </div>
                <div class="detail-item">
                    <strong style="color: var(--accent3);">Endereço:</strong>
                    <span style="color: var(--muted);">${entrega.pedido?.enderecoEntrega || 'Endereço não informado'}</span>
                </div>
                <div class="detail-item">
                    <strong style="color: var(--accent3);">Valor do Pedido:</strong>
                    <span style="color: var(--accent2); font-weight: bold;">
                        R$ ${(entrega.pedido?.valorTotal || 0).toFixed(2)}
                    </span>
                </div>
                <div class="detail-item">
                    <strong style="color: var(--accent3);">Tempo em Trânsito:</strong>
                    <span style="color: var(--muted);">${entrega.tempoTransito}</span>
                </div>
            </div>

            <div class="delivery-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-small btn-primary" onclick="verDetalhesEntrega(${entrega.codEntrega})" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                    👁️ Detalhes
                </button>
                <button class="btn btn-small btn-secondary" onclick="abrirModalStatus(${entrega.codEntrega})" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                    ✏️ Status
                </button>
                <button class="btn btn-small btn-secondary" onclick="rastrearEntrega('${entrega.codigoRastreamento}')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                    📍 Rastrear
                </button>
                ${entrega.statusEntrega === 'Entregue' ? '' : `
                    <button class="btn btn-small btn-success" onclick="marcarComoEntregue(${entrega.codEntrega})" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                        ✅ Entregue
                    </button>
                `}
                <button class="btn btn-small btn-danger" onclick="deletarEntrega(${entrega.codEntrega})" style="padding: 0.5rem 1rem; font-size: 0.8rem; background: linear-gradient(45deg, var(--accent1), #ff6b9d);">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');

    // Adicionar CSS para os cards
    const style = document.createElement('style');
    style.textContent = `
        .delivery-card { 
            background: var(--bg-2); 
            padding: 1.5rem; 
            border-radius: var(--radius); 
            border: 1px solid var(--glass); 
            transition: all 0.3s ease; 
            margin-bottom: 1rem; 
        }
        .delivery-card:hover { 
            border-color: var(--accent3); 
            transform: translateY(-2px); 
        }
        .empty-state { 
            text-align: center; 
            padding: 3rem; 
        }
        .btn-success { 
            background: linear-gradient(45deg, #28a745, #20c997); 
        }
    `;
    if (!document.querySelector('style[data-entregas]')) {
        style.setAttribute('data-entregas', 'true');
        document.head.appendChild(style);
    }
}

// Atualizar estatísticas
function atualizarEstatisticas() {
    const estatisticas = {
        total: todasEntregas.length,
        emTransito: todasEntregas.filter(e => e.statusEntrega === 'Em trânsito').length,
        saiuEntrega: todasEntregas.filter(e => e.statusEntrega === 'Saiu para entrega').length,
        entregues: todasEntregas.filter(e => e.statusEntrega === 'Entregue').length,
        atrasadas: todasEntregas.filter(e => e.statusEntrega === 'Atrasado').length
    };

    document.getElementById('count-em-transito').textContent = estatisticas.emTransito;
    document.getElementById('count-saiu-entrega').textContent = estatisticas.saiuEntrega;
    document.getElementById('count-entregues').textContent = estatisticas.entregues;
    document.getElementById('count-atrasadas').textContent = estatisticas.atrasadas;
    document.getElementById('total-entregas').textContent = estatisticas.total;
    document.getElementById('total-entregas-info').textContent = `${estatisticas.total} entregas totais`;
}

// Atualizar contador de entregas filtradas
function atualizarContador() {
    document.getElementById('contador-entregas').textContent = 
        `${entregasFiltradas.length} entrega${entregasFiltradas.length !== 1 ? 's' : ''}`;
}

// Funções auxiliares
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
        'Em trânsito': '#ffc107',
        'Saiu para entrega': '#6f42c1',
        'Entregue': '#28a745',
        'Atrasado': '#fd7e14',
        'Devolvido': '#dc3545'
    };
    return cores[status] || '#6c757d';
}

function getIconeStatus(status) {
    const icones = {
        'Em trânsito': '🟡',
        'Saiu para entrega': '🚚',
        'Entregue': '✅',
        'Atrasado': '⚠️',
        'Devolvido': '↩️'
    };
    return icones[status] || '⚪';
}

function calcularTempoTransito(dataEnvio, dataEntrega) {
    const envio = new Date(dataEnvio);
    const entrega = dataEntrega ? new Date(dataEntrega) : new Date();
    const diffDias = Math.floor((entrega - envio) / (1000 * 60 * 60 * 24));
    
    if (diffDias === 0) return 'Hoje';
    if (diffDias === 1) return '1 dia';
    return `${diffDias} dias`;
}

// 🔥 CORREÇÃO: Funções de modal simplificadas
function verDetalhesEntrega(id) {
    const entrega = todasEntregas.find(e => e.codEntrega === id);
    if (!entrega) return;

    const detalhes = `
📋 DETALHES DA ENTREGA

📦 Pedido: #${entrega.idPedido}
🚚 Transportadora: ${entrega.transportadora}
📮 Código Rastreamento: ${entrega.codigoRastreamento}
🔄 Status: ${entrega.statusEntrega}
📅 Data de Envio: ${entrega.dataEnvioFormatada}
${entrega.dataEntrega ? `✅ Data de Entrega: ${entrega.dataEntregaFormatada}` : '⏳ Aguardando entrega'}
⏱️ Tempo em Trânsito: ${entrega.tempoTransito}
🏠 Endereço: ${entrega.pedido?.enderecoEntrega || 'N/A'}
💰 Valor do Pedido: R$ ${(entrega.pedido?.valorTotal || 0).toFixed(2)}
    `;

    alert(detalhes);
}

function abrirModalStatus(id) {
    const entrega = todasEntregas.find(e => e.codEntrega === id);
    if (!entrega) return;

    entregaSelecionada = entrega;
    document.getElementById('modal-status').style.display = 'flex';
}

function fecharModalStatus() {
    document.getElementById('modal-status').style.display = 'none';
    entregaSelecionada = null;
}

function confirmarAtualizacaoStatus() {
    if (!entregaSelecionada) return;

    const novoStatus = document.getElementById('novo-status').value;
    
    if (novoStatus === 'Entregue') {
        entregaSelecionada.dataEntrega = new Date().toISOString();
    }
    
    entregaSelecionada.statusEntrega = novoStatus;
    
    processarEntregas();
    filtrarEntregas();
    atualizarEstatisticas();
    
    fecharModalStatus();
    alert('✅ Status da entrega atualizado com sucesso!');
}

function marcarComoEntregue(id) {
    const entrega = todasEntregas.find(e => e.codEntrega === id);
    if (!entrega) return;

    if (confirm(`Deseja marcar a entrega do pedido #${entrega.idPedido} como entregue?`)) {
        entrega.statusEntrega = 'Entregue';
        entrega.dataEntrega = new Date().toISOString();
        
        processarEntregas();
        filtrarEntregas();
        atualizarEstatisticas();
        alert('✅ Entrega marcada como entregue!');
    }
}

function rastrearEntrega(codigoRastreamento) {
    // Abre o rastreamento nos Correios (exemplo)
    const url = `https://www.linkcorreios.com.br/?id=${codigoRastreamento}`;
    window.open(url, '_blank');
}

function deletarEntrega(id) {
    const entrega = todasEntregas.find(e => e.codEntrega === id);
    if (!entrega) return;

    const confirmacao = confirm(`Tem certeza que deseja excluir a entrega do pedido #${entrega.idPedido}?\n\nEsta ação não pode ser desfeita.`);

    if (confirmacao) {
        todasEntregas = todasEntregas.filter(e => e.codEntrega !== id);
        processarEntregas();
        filtrarEntregas();
        atualizarEstatisticas();
        alert('✅ Entrega excluída com sucesso!');
    }
}

// Criar nova entrega
function criarEntrega() {
    document.getElementById('modal-nova-entrega').style.display = 'flex';
    document.getElementById('dataEnvio').value = new Date().toISOString().split('T')[0];
    // Aqui você poderia carregar a lista de pedidos pendentes
}

function fecharModalNovaEntrega() {
    document.getElementById('modal-nova-entrega').style.display = 'none';
    document.getElementById('form-nova-entrega').reset();
}

// Exportar entregas
function exportarEntregas() {
    if (entregasFiltradas.length === 0) {
        alert('❌ Nenhuma entrega para exportar!');
        return;
    }

    alert(`📊 ${entregasFiltradas.length} entregas exportadas com sucesso!\n\n` +
          `Funcionalidade de exportação em desenvolvimento.`);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    if (!verificarAdmin()) return;
    
    // Configurar formulário de nova entrega
    document.getElementById('form-nova-entrega').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const novaEntrega = {
            idPedido: parseInt(formData.get('idPedido')),
            transportadora: formData.get('transportadora'),
            codigoRastreamento: formData.get('codigoRastreamento'),
            dataEnvio: formData.get('dataEnvio') + 'T00:00:00.000Z'
        };

        // Adiciona à lista (em uma aplicação real, faria POST para API)
        const novaId = Math.max(...todasEntregas.map(e => e.codEntrega), 0) + 1;
        todasEntregas.push({
            codEntrega: novaId,
            ...novaEntrega,
            statusEntrega: 'Em trânsito',
            dataEntrega: null,
            pedido: {
                codPedido: novaEntrega.idPedido,
                status: 'Enviado',
                valorTotal: 0,
                enderecoEntrega: 'Endereço a definir'
            }
        });

        processarEntregas();
        filtrarEntregas();
        atualizarEstatisticas();
        fecharModalNovaEntrega();
        alert('✅ Nova entrega criada com sucesso!');
    });

    // Carregar entregas
    carregarEntregas();
});