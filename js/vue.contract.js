function applyMask(value, regex, mask) {
    const clearValue = value.replace(/\D/g, '');
    const maskedValue = clearValue.replace(regex, mask)
    console.log(maskedValue)

    return maskedValue
}
new Vue({
    el: '#app',
    data: {
        nome: "",
        rg: "",
        mask: {
            cpf: "",
            telefone: "",
        },
        endereco: "",
        email: "",
        dia_pagamento: 1,
        dataInicial: null,
        dataFinal: null,
        addTempoDeContrato: '',
        dataIgnorada: null,
        datasIgnoradas: [],
        datasParaIgnorar: [],
        simulado: false,
        tipoDeOrcamento: "individual", 
        valorDaHora: 50,
        valorDaHoraDupla: 45,
        valorDaHoraTrio: 40,
        desconto: 0,
        parcelamento: 0,
        deslocamento: 0,
        mostrarFeriados: false,
        diasDaSemana: {
            0: [],
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: []
        },
        diasSelecionados: [{
            dia: 0,
            nome: 'domingo',
            horario: null,
            turno: null,
            horas: 1,
            selected: false
        },
        {
            dia: 1,
            nome: 'segunda-feira',
            horario: null,
            turno: null,
            horas: 1,
            selected: false
        },
        {
            dia: 2,
            nome: 'terça-feira',
            horario: null,
            turno: null,
            horas: 1,
            selected: false
        },
        {
            dia: 3,
            nome: 'quarta-feira',
            horario: null,
            turno: null,
            horas: 1,
            selected: false
        },
        {
            dia: 4,
            nome: 'quinta-feira',
            horario: null,
            turno: null,
            horas: 1,
            selected: false
        },
        {
            dia: 5,
            nome: 'sexta-feira',
            horario: null,
            turno: null,
            horas: 1,
            selected: false
        },
        {
            dia: 6,
            nome: 'sábado',
            horario: null,
            turno: null,
            horas: 1,
            selected: false
        }
        ]
    },
    watch: {
        'mask.cpf'(novoValor) {
            this.mask.cpf = applyMask(novoValor, /(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        },
        'mask.telefone'(novoValor) {
            this.mask.telefone = applyMask(novoValor, /(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
        }
    },
    mounted() {
        const ano = new Date().toISOString().split('-')[0];
        fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`).then(response => response.json())
            .then(data => data.forEach(d => this.adicionarDataIgnorada(d.date, d.name)))
            .catch(error => console.error(error));
        fetch(`https://brasilapi.com.br/api/feriados/v1/${+ano + 1}`).then(response => response.json())
            .then(data => data.forEach(d => this.adicionarDataIgnorada(d.date, d.name)))
            .catch(error => console.error(error));
    },
    computed: {
        diasFiltered: function () {
            return this.diasSelecionados.filter(obj => obj.selected)
        },
        totalAulas: function() {
            return this.diasFiltered.reduce((acc, dia) => acc + this.diasDaSemana[dia.dia].length, 0)
        },
        totalDias: function () {
            return this.diasFiltered.length;
        },
        horasPorDia: function () {
            return this.diasFiltered.reduce((acc, dia) => acc + (dia?.horas ?? 0), 0)
        },
        mostrarDatas: function () {
            if (!this.mostrarFeriados) {
                return this.datasIgnoradas.filter(data => !data.split('').includes('-'))
            }

            return this.datasIgnoradas
        },
        valor_geral() {
            // Loop nos dias selecionados, verificando a quantidade de horas daquele dia * valor da hora
            const horas = this.diasFiltered.reduce((acc, dia) => acc + this.diasDaSemana[dia.dia].length * dia.horas, 0)
            const valores = {
                individual: this.valorDaHora,
                dupla: this.valorDaHoraDupla,
                trio: this.valorDaHoraTrio,
            }
            const valor = valores[this.tipoDeOrcamento];
            return valor * horas
        },
        valor_a_vista() {
            return this.valor_geral - (this.valor_geral * this.desconto / 100)
        },
        valor_deslocamento() {
            return this.totalDias * this.deslocamento
        },
        valor_parcelado() {
            return this.valor_geral / this.parcelamento
        },
        valor_parcela_deslocamento() {
            return this.valor_parcelado + (this.valor_deslocamento / this.parcelamento)
        }
    },
    methods: {
        adicionarDataIgnorada: function (date, name) {
            const dataIgnoradaFormatada = this.formatarData(date);
            if (!this.datasParaIgnorar.includes(date)) {
                this.datasIgnoradas.push(`${dataIgnoradaFormatada} ${name ? ' - ' + name : ''}`);
                this.datasParaIgnorar.push(date)
            }
        },
        monthsBetweenDates: function (startDate, endDate) {
            const years = endDate.getFullYear() - startDate.getFullYear();
            const months = endDate.getMonth() - startDate.getMonth();

            const calc = years * 12 + months;

            return calc;
        },
        updateEndDate() {
            if (this.dataInicial && this.addTempoDeContrato) {
              const startDate = new Date(this.dataInicial);
              const daysToAdd = parseInt(this.addTempoDeContrato, 10);
              startDate.setDate(startDate.getDate() + daysToAdd);
              this.dataFinal = startDate.toISOString().split('T')[0];
            }
        },
        removerDataIgnorada: function (date) {
            const index = this.datasIgnoradas.findIndex(data => data === date);
            if (date < 0) return;
            this.datasIgnoradas.splice(index, 1);
            this.datasParaIgnorar.splice(index, 1);
        },
        contarDiasDaSemana: function () {
            this.resetarDias()
            const dataInicial = new Date(this.dataInicial + 'T00:00:00Z');
            const dataFinal = new Date(this.dataFinal + 'T23:59:59Z');
            dataFinal.setHours(dataInicial.getHours());
            const umDiaEmMilissegundos = 86400000;
            let dataAtual = new Date(this.dataInicial + 'T03:00:00Z');
            while (dataAtual.getTime() <= dataFinal.getTime()) {
                const diaDaSemana = dataAtual.getDay();
                if (!this.datasParaIgnorar.includes(dataAtual.toISOString().split('T')[0])) {
                    this.diasDaSemana[diaDaSemana].push(new Date(dataAtual).toISOString());
                }
                dataAtual.setTime(dataAtual.getTime() + umDiaEmMilissegundos);
            }
            const meses = this.monthsBetweenDates(dataInicial, dataFinal)
            this.parcelamento = meses;
            this.simulado = true;
        },
        formatarData: function (data) {
            const partesData = data.split('-');
            return `${partesData[2]}/${partesData[1]}/${partesData[0]}`;
        },
        resetarDias() {
            return this.diasDaSemana = {
                0: [],
                1: [],
                2: [],
                3: [],
                4: [],
                5: [],
                6: []
            }
        },
        toggleFeriados() {
            this.mostrarFeriados = !this.mostrarFeriados
        },
        atualizarTurno(index) {
            const objeto = this.diasSelecionados[index];
            const hora = parseInt(objeto.horario.split(':')[0]);

            if (hora >= 8 && hora < 12) {
                objeto.turno = 'manhã';
            } else if (hora >= 12 && hora < 18) {
                objeto.turno = 'tarde';
            } else {
                objeto.turno = 'noite';
            }
        },
        submitForm() {
            const dataToSend = structuredClone(this.$data);
            Object.assign(dataToSend, dataToSend.mask)
            dataToSend.quantidade_aula = this.totalDias;
            dataToSend.quantidade_parcelas = this.parcelamento
            dataToSend.valor_parcela = this.parcelamento == 1 ? this.valor_a_vista : this.valor_parcelado
            dataToSend.valor_parcela = Number(dataToSend.valor_parcela).toFixed(2)
            dataToSend.inicio_contrato = this.dataInicial.split('T')[0].split('-').reverse().join('/');
            dataToSend.termino_contrato = this.dataFinal.split('T')[0].split('-').reverse().join('/');
            dataToSend.minutos_aula = this.horasPorDia * 60
            dataToSend.dias_aula = structuredClone(this.diasFiltered)
            dataToSend.tipo = this.valor_deslocamento ? "presencial" : "online"
            dataToSend.valor_extra_deslocamento = this.valor_deslocamento?.toFixed(2)
            dataToSend.valor_deslocamento_parcelado = this.valor_parcela_deslocamento?.toFixed(2)
            dataToSend.url = btoa(JSON.stringify({ dates: this.mostrarDatas, name: this.nome }))
            const dataInicial = new Date(this.dataInicial + 'T00:00:00Z');
            const dataFinal = new Date(this.dataFinal + 'T23:59:59Z');
            const meses = this.monthsBetweenDates(dataInicial, dataFinal)
            dataToSend.quantidade_meses = meses

            fetch('/contract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            })
                .then(response => {
                    const filename = this.getFilenameFromResponse(response);
                    return Promise.all([response.blob(), filename]);
                })
                .then(([blob, filename]) => {
                    const url = URL.createObjectURL(blob);

                    const newWindow = window.open(url, '_blank');
                    if (newWindow) {
                        newWindow.addEventListener('load', () => {
                            setTimeout(() => {
                                newWindow.document.title = filename;
                            }, 2000)
                        });
                    }

                    URL.revokeObjectURL(url);
                })
                .catch(error => {
                    console.error('Ocorreu um erro:', error);
                });

        },
        getFilenameFromResponse(response) {
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition && contentDisposition.includes('attachment')) {
                console.log({ contentDisposition })
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    return matches[1].replace(/['"]/g, '');
                }
            }
            const inicio_contrato = this.dataInicial.split('T')[0].split('-').reverse().join('/');
            const termino_contrato = this.dataFinal.split('T')[0].split('-').reverse().join('/');
            return `${this.nome} - CONTRATO (${inicio_contrato} ate ${termino_contrato}).pdf`;
        },
        sendToWhatsapp() {
            const dataInicial = new Date(this.dataInicial + 'T00:00:00Z');
            const dataFinal = new Date(this.dataFinal + 'T23:59:59Z');
            const inicio_contrato = this.dataInicial.split('T')[0].split('-').reverse().join('/');
            const termino_contrato = this.dataFinal.split('T')[0].split('-').reverse().join('/');
            const meses = this.monthsBetweenDates(dataInicial, dataFinal)
            const diasSelecionados = this.diasSelecionados.filter(obj => obj.selected)
const message = `*Orçamento Particular (${this.tipoDeOrcamento?.toUpperCase()})*

- ${diasSelecionados.length} vez(es) na semana por ${meses} meses:
${ 
    diasSelecionados.map( obj => {
        return `${obj.nome.charAt(0).toUpperCase() + obj.nome
        .slice(1)} (${obj.turno}): ${obj.horas}h`
    }).join(`
`)
}
Início do contrato: ${inicio_contrato}
Fim do contrato: ${termino_contrato}
Total de aulas: ${this.totalAulas}

Valor total do pacote${this.tipoDeOrcamento == "individual" ? "" : " individual"}:  R$ ${this.valor_geral.toFixed(2)}
Valor por parcela${this.tipoDeOrcamento == "individual" ? "" : " individual"}: ${this.parcelamento}x R$ ${this.valor_parcelado.toFixed(2)}

- Esse valor já foi retirado os feriados nacionais e as semanas de férias que ocorrem no decorrer no ano.`
            console.log(message);
            const url = `https://api.whatsapp.com/send/?phone=55${this.mask.telefone.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        }
    }
});