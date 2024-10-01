const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let games = {};
let currentGameId = 1;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinGame', () => {
        let gameId;

        // Encontre uma sala que tenha menos de 2 jogadores ou crie uma nova
        for (const id in games) {
            if (games[id].players.length < 2) {
                gameId = id;
                break;
            }
        }

        // Se não encontrou, cria uma nova sala
        if (!gameId) {
            gameId = `game${currentGameId++}`;
            games[gameId] = { players: [], choices: {}, numbers: {} };
        }

        socket.join(gameId);

        // Se ainda houver espaço, adicione o jogador à sala
        if (games[gameId].players.length < 2) {
            games[gameId].players.push(socket.id);
        }

        // Envia informações sobre as escolhas disponíveis para o segundo jogador
        const chosenChoice = Object.values(games[gameId].choices)[0];
        io.to(socket.id).emit('choiceRestrictions', chosenChoice);

        io.to(socket.id).emit('joinedGame', { gameId });
        io.to(gameId).emit('gameUpdate', games[gameId]);
    });

    socket.on('makeChoice', (data) => {
        const { gameId, choice, number } = data;

        // Verifica se a escolha já foi feita por outro jogador
        const choices = Object.values(games[gameId].choices);
        if (choices.includes(choice)) {
            socket.emit('invalidChoice', 'Essa opção já foi escolhida pelo outro jogador.');
            return;
        }

        games[gameId].choices[socket.id] = choice;
        games[gameId].numbers[socket.id] = number;

        // Se ambos os jogadores escolheram, determine o vencedor
        if (Object.keys(games[gameId].choices).length === 2 && Object.keys(games[gameId].numbers).length === 2) {
            const result = determineWinner(games[gameId].choices, games[gameId].numbers);
            games[gameId].choices = {}; // Reseta as escolhas para a próxima rodada
            games[gameId].numbers = {}; // Reseta os números para a próxima rodada
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

function determineWinner(choices, numbers) {
    const playerIds = Object.keys(choices);
    const num1 = numbers[playerIds[0]];
    const num2 = numbers[playerIds[1]];

    const sum = parseInt(num1) + parseInt(num2);
    const isEven = sum % 2 === 0;

    // Verifica quem venceu
    const winnerId = (choices[playerIds[0]] === 'even' && isEven) || (choices[playerIds[0]] === 'odd' && !isEven)
        ? playerIds[0]
        : playerIds[1];
    const loserId = winnerId === playerIds[0] ? playerIds[1] : playerIds[0];

    // Envia o resultado personalizado para cada jogador
    io.to(winnerId).emit('gameResult', { result: 'Você venceu!', sum: sum, isEven: isEven });
    io.to(loserId).emit('gameResult', { result: 'Você perdeu!', sum: sum, isEven: isEven });

    // Retorno do vencedor e informações da rodada (sem a mensagem personalizada)
    return { winner: winnerId, loser: loserId, sum: sum, isEven: isEven };
}


server.listen(3000, () => {
    console.log('Listening on *:3000');
});
