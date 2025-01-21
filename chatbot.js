const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const client = new Client();

const delay = ms => new Promise(res => setTimeout(res, ms)); // Função para criar delay

let userStep = {}; // Controle de estados do usuário
let userData = {}; // Armazenar dados do usuário
let completedUsers = new Set(); // Armazenar IDs de usuários que já completaram a interação

const menu = `Obrigado por entrar em contato com a 1001 Transportation. Selecione uma das opções abaixo:

1 - Miami
2 - Orlando
3 - Outras Cidades`;

const subOptionsMiami = `Você selecionou *Miami*. Escolha uma subopção:

1 - Transfer IN
2 - Transfer OUT
3 - Carro por Hora
4 - Outros Serviços`;

const subOptionsOrlando = `Você selecionou *Orlando*. Escolha uma subopção:

1 - Transfer IN
2 - Transfer OUT
3 - Carro por Hora
4 - Outros Serviços`;

const subOptionsOutras = `Você selecionou *Outras Cidades*. Por favor, informe o nome da cidade:`;

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

// Inicializar cliente
client.initialize();

client.on('message', async msg => {
    const chat = await msg.getChat();
    const contact = await msg.getContact();
    const userId = msg.from;

    // Verificar se é grupo
    if (chat.isGroup) {
        return; // Ignorar mensagens de grupos
    }

    // Verificar se o contato já finalizou o processo
    if (completedUsers.has(userId)) {
        return; // Não responder mais a este contato
    }

    // Verificar se o contato está salvo
    if (contact.isMyContact) {
        return; // Ignorar contatos salvos
    }

    // Iniciar o menu para qualquer mensagem recebida
    if (!userStep[userId]) {
        userStep[userId] = 'menu';
        userData[userId] = {}; // Resetando os dados do usuário
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(userId, menu);
        return;
    }

    // Processar escolha do menu
    if (userStep[userId] === 'menu') {
        if (msg.body === '1') {
            userStep[userId] = 'miami';
            await delay(2000);
            await chat.sendStateTyping();
            await delay(2000);
            await client.sendMessage(userId, subOptionsMiami);
        } else if (msg.body === '2') {
            userStep[userId] = 'orlando';
            await delay(2000);
            await chat.sendStateTyping();
            await delay(2000);
            await client.sendMessage(userId, subOptionsOrlando);
        } else if (msg.body === '3') {
            userStep[userId] = 'outras';
            await delay(2000);
            await chat.sendStateTyping();
            await delay(2000);
            await client.sendMessage(userId, subOptionsOutras);
        } else {
            await client.sendMessage(userId, `Opção inválida. Por favor, digite *menu* para reiniciar.`);
        }
        return;
    }

    // Processar subopções (Miami, Orlando e Outras Cidades)
    if (userStep[userId] === 'miami' || userStep[userId] === 'orlando') {
        if (['1', '2', '3', '4'].includes(msg.body)) {
            userData[userId].service = msg.body;
            userStep[userId] = 'data';
            await delay(2000);
            await chat.sendStateTyping();
            await delay(2000);
            await client.sendMessage(userId, 'Por favor, informe a data (DD/MM/YYYY):');
        } else {
            await client.sendMessage(userId, `Opção inválida. Por favor, selecione uma subopção válida.`);
        }
        return;
    }

    // Processar Outras Cidades
    if (userStep[userId] === 'outras') {
        userData[userId].cidade = msg.body;
        userStep[userId] = 'data';
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(userId, 'Por favor, informe a data (DD/MM/YYYY):');
        return;
    }

    // Captura da data
    if (userStep[userId] === 'data') {
        const dataRegex = /\d{2}\/\d{2}\/\d{4}/;
        if (!dataRegex.test(msg.body.trim())) {
            await client.sendMessage(userId, `Formato de data inválido. Por favor, use o formato DD/MM/YYYY.`);
            return;
        }
        userData[userId].data = msg.body;
        userStep[userId] = 'horario';
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(userId, 'Por favor, informe o horário (HH:MM):');
        return;
    }

    // Captura do horário
    if (userStep[userId] === 'horario') {
        const horarioRegex = /\d{2}:\d{2}/;
        if (!horarioRegex.test(msg.body.trim())) {
            await client.sendMessage(userId, `Formato de horário inválido. Por favor, use o formato HH:MM.`);
            return;
        }
        userData[userId].horario = msg.body;
        userStep[userId] = 'pessoas';
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(userId, 'Por favor, informe o número de pessoas:');
        return;
    }

    // Captura do número de pessoas
    if (userStep[userId] === 'pessoas') {
        userData[userId].pessoas = msg.body;
        userStep[userId] = 'malas';
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(userId, 'Por favor, informe o número de malas:');
        return;
    }

    // Captura do número de malas
    if (userStep[userId] === 'malas') {
        userData[userId].malas = msg.body;
        userStep[userId] = 'destino';
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(userId, 'Por favor, informe o destino:');
        return;
    }

    // Captura do destino e finalização
    if (userStep[userId] === 'destino') {
        userData[userId].destino = msg.body;
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);

        const cidadeInfo = userStep[userId] === 'outras' ? `Cidade: ${userData[userId].cidade}\n` : '';

        await client.sendMessage(userId, `Obrigado! Recebemos suas informações:

${cidadeInfo}Data: ${userData[userId].data}
Horário: ${userData[userId].horario}
Número de pessoas: ${userData[userId].pessoas}
Número de malas: ${userData[userId].malas}
Destino: ${userData[userId].destino}

A 1001 Transportation agradece pelo contato. Responderemos sua cotação em breve!`);
        completedUsers.add(userId); // Adicionar o usuário à lista de completados
        userStep[userId] = null; // Resetar estado do usuário
        return;
    }

    // Resposta padrão para mensagens não reconhecidas
    await client.sendMessage(userId, `Não entendi sua mensagem. Por favor, digite *menu* para iniciar.`);
});
