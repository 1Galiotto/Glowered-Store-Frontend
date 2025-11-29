// Função para validar CPF
function validarCPF(cpf) {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');

    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) {
        return false;
    }

    // Verifica se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1+$/.test(cpf)) {
        return false;
    }

    // Calcula primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) {
        return false;
    }

    // Calcula segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) {
        return false;
    }

    return true;
}

// Função para formatar CPF
function formatarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11) return cpf;
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para remover formatação do CPF
function limparCPF(cpf) {
    return cpf.replace(/[^\d]/g, '');
}

// Event listener para campos de CPF
function configurarCampoCPF(campoId) {
    const campo = document.getElementById(campoId);
    if (!campo) return;

    campo.addEventListener('input', function(e) {
        let valor = e.target.value;

        // Remove caracteres não numéricos
        valor = valor.replace(/[^\d]/g, '');

        // Limita a 11 dígitos
        if (valor.length > 11) {
            valor = valor.substring(0, 11);
        }

        // Formata automaticamente
        if (valor.length <= 11) {
            valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }

        e.target.value = valor;
    });

    campo.addEventListener('blur', function(e) {
        const cpf = limparCPF(e.target.value);
        if (cpf && !validarCPF(cpf)) {
            mostrarErroCPF(campoId, 'CPF inválido');
        } else {
            limparErroCPF(campoId);
        }
    });
}

// Função para mostrar erro no campo CPF
function mostrarErroCPF(campoId, mensagem) {
    const campo = document.getElementById(campoId);
    if (!campo) return;

    campo.classList.add('erro');

    // Remove erro anterior
    const erroAnterior = campo.parentElement.querySelector('.erro-cpf');
    if (erroAnterior) {
        erroAnterior.remove();
    }

    // Adiciona novo erro
    const erroDiv = document.createElement('div');
    erroDiv.className = 'erro-cpf';
    erroDiv.style.color = 'red';
    erroDiv.style.fontSize = '0.8rem';
    erroDiv.style.marginTop = '0.25rem';
    erroDiv.textContent = mensagem;

    campo.parentElement.appendChild(erroDiv);
}

// Função para limpar erro do campo CPF
function limparErroCPF(campoId) {
    const campo = document.getElementById(campoId);
    if (!campo) return;

    campo.classList.remove('erro');

    const erroDiv = campo.parentElement.querySelector('.erro-cpf');
    if (erroDiv) {
        erroDiv.remove();
    }
}

// Validação de CPF para formulários
function validarFormularioCPF(campoId) {
    const campo = document.getElementById(campoId);
    if (!campo) return false;

    const cpf = limparCPF(campo.value);
    if (!cpf) return true; // CPF opcional

    if (!validarCPF(cpf)) {
        mostrarErroCPF(campoId, 'CPF inválido');
        return false;
    }

    limparErroCPF(campoId);
    return true;
}
