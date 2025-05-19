const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const routes = require('./routes');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 5000,
    pingInterval: 10000
});

// Configuração da sessão
const sessionMiddleware = session({
    secret: 'minha-chave-secreta-1234567890',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
});

app.use(sessionMiddleware);
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Middleware para verificar autenticação
app.use((req, res, next) => {
    const publicRoutes = ['/api/login', '/api/register', '/api/feedback', '/login.html', '/Registro.html', '/index.html', '/api/logout'];
    console.log('Rota acessada:', req.originalUrl, 'Usuário:', req.session.user ? req.session.user.username : 'Não autenticado');
    if (!req.session.user && !publicRoutes.some(route => req.originalUrl === route || req.originalUrl.startsWith(route))) {
        return res.redirect('/index.html');
    }
    next();
});

// Rotas
app.use('/api', routes);

// Armazenar usuários online
const users = new Set();

// WebSocket
io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);

    // Carregar histórico de mensagens
    if (fs.existsSync('chat.txt')) {
        const history = fs.readFileSync('chat.txt', 'utf8').split('\n').filter(line => line);
        history.forEach(line => {
            const [username, message] = line.split(': ');
            socket.emit('chat message', { username, message });
            console.log('Enviando mensagem histórica:', { username, message });
        });
    }

    // Verificar autenticação
    socket.on('check-auth', () => {
        const session = socket.request.session;
        console.log('Verificando autenticação para socket:', session.user);
        if (session.user) {
            socket.emit('auth-status', { isAuthenticated: true, username: session.user.username });
            console.log('Autenticação confirmada para:', session.user.username);
        } else {
            socket.emit('auth-status', { isAuthenticated: false });
            console.log('Sem autenticação para socket:', socket.id);
        }
    });

    // Novo usuário
    socket.on('new user', (username) => {
        const sessionUsername = socket.request.session.user?.username;
        socket.username = sessionUsername || username;
        users.add(socket.username);
        console.log('Usuário adicionado:', socket.username);
        io.emit('user joined', { username: socket.username });
        io.emit('update users', { users: Array.from(users), count: users.size });
    });

    // Mensagem do chat
    socket.on('chat message', (data) => {
        console.log('Mensagem de chat recebida:', data);
        const messageData = `${data.username}: ${data.message}\n`;
        fs.appendFileSync('chat.txt', messageData);
        io.emit('chat message', { username: data.username, message: data.message });
    });

    // Mensagem do bot
    socket.on('bot message', (message) => {
        console.log('Mensagem do bot recebida:', message);
        io.emit('bot message', message);
    });

    // Desconexão
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
        if (socket.username) {
            users.delete(socket.username);
            io.emit('user left', { username: socket.username });
            io.emit('update users', { users: Array.from(users), count: users.size });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});