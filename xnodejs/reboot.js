const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = 80;

let players = {};
let chatHistory = [];
let games = [];

// Serve file statici dalla directory corrente
app.use(express.static(__dirname));

// Servi index.html alla radice
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Servi lobby.html
app.get('/lobby', (req, res) => {
    res.sendFile(path.join(__dirname, 'lobby.html'));
});

// Servi game.html
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
});

// Gestisci connessioni Socket.IO
io.on('connection', (socket) => {

    socket.on('update participants', (partecipanti) =>{
        console.log("in lobby:");
        console.log(partecipanti);
    });

    // Invia la cronologia della chat, l'elenco dei giocatori e delle partite al nuovo client
    socket.emit('init', { chatHistory, players: Object.values(players), games });

    // Gestisci la registrazione del nickname
    socket.on('register', (nickname) => {
        players[socket.id] = nickname;
        io.emit('update players', Object.values(players));
    });

    // Ricevi messaggi dal client
    socket.on('chat message', (data) => {
        chatHistory.push(data);
        // Invia il messaggio a tutti i client connessi
        io.emit('chat message', data);
    });

    // Gestisci la creazione di una nuova partita
    socket.on('create game', (data) => {
        const gameId = `game-${Date.now()}`;
        const newGame = { id: gameId, host: data.nickname, maxPlayers: data.maxPlayers, players: [data.nickname], started: false };
        games.push(newGame);
        socket.join(gameId);
        socket.emit('game created', gameId);
        io.emit('update games', games);
    });

    // Gestisci la partecipazione a una partita
    socket.on('join game', (data) => {
        const game = games.find(game => game.id === data.gameId);
        if (game && !game.started && game.players.length < game.maxPlayers) {
            game.players.push(data.nickname);
            socket.join(data.gameId);
            io.to(data.gameId).emit('update participants', game.players);
        }
    });

    // Gestisci i messaggi di chat specifici della partita
    socket.on('game chat message', (data) => {
        io.to(data.gameId).emit('chat message', { nickname: data.nickname, msg: data.msg });
    });

    // Gestisci quando un giocatore è pronto
    socket.on('player ready', (data) => {
        const game = games.find(game => game.id === data.gameId);
        if (game) {
            game.readyPlayers = game.readyPlayers || [];
            game.readyPlayers.push(players[socket.id]);
            io.to(data.gameId).emit('update ready list', game.readyPlayers);
            if (game.readyPlayers.length === game.maxPlayers) {
                io.to(data.gameId).emit('game start countdown');
                setTimeout(() => {
                    game.started = true;
                    io.emit('update games', games);
                    io.to(data.gameId).emit('game start');
                }, 10000);
            }
        }
    });

    // Gestisci la disconnessione
    socket.on('disconnect', () => {
        const nickname = players[socket.id];
        delete players[socket.id];
        games.forEach(game => {
            const index = game.players.indexOf(nickname);
            if (index !== -1) {
                game.players.splice(index, 1);
                io.to(game.id).emit('update participants', game.players);
            }
        });
        io.emit('update players', Object.values(players));
        console.log('User disconnected');
    });
});

// Avvia il server su tutte le interfacce di rete
server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
