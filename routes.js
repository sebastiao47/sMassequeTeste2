const express = require('express');
const router = express.Router();
const fs = require('fs');

router.post('contact', (req, res) => {
    const { firstname, lastname, country, subject } = req.body;
    console.log('Mensagem recebida:', { firstname, lastname, country, subject });
    res.status(200).json({ message: 'Mensagem enviada com sucesso' });
});

router.post('login', (req, res) => {
    const { username, password } = req.body;
    console.log('Tentativa de login:', { username, password });
    if (!username || !password) {
        return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
    }
    if (username && password) {
        req.session.user = { username };
        console.log('Sessão criada:', req.session.user);
        return res.status(200).json({ message: 'Login realizado com sucesso' });
    }
    res.status(401).json({ message: 'Credenciais inválidas' });
});

router.post('register', (req, res) => {
    const { username, email, password } = req.body;
    console.log('Novo registro:', { username, email });
    req.session.user = { username };
    res.status(200).json({ message: 'Conta criada com sucesso' });
});

router.get('check-auth', (req, res) => {
    console.log('Verificando autenticação:', req.session.user);
    if (req.session.user) {
        res.status(200).json({ isAuthenticated: true, username: req.session.user.username });
    } else {
        res.status(200).json({ isAuthenticated: false });
    }
});

router.post('update-profile', (req, res) => {
    const { email } = req.body;
    console.log('Atualizando perfil:', { email });
    if (req.session.user) {
        req.session.user.email = email;
        res.status(200).json({ message: 'Perfil atualizado com sucesso' });
    } else {
        res.status(401).json({ message: 'Usuário não autenticado' });
    }
});

router.get('logout', (req, res) => {
    console.log('Fazendo logout:', req.session.user);
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao destruir sessão:', err);
            return res.status(500).json({ message: 'Erro ao fazer logout' });
        }
        res.redirect('index.html');
    });
});

router.post('feedback', (req, res) => {
    const { feedback } = req.body;
    const username = req.session.user?.username || 'Anônimo';
    console.log('Feedback recebido:', { username, feedback });

    if (!feedback) {
        return res.status(400).json({ message: 'Feedback é obrigatório' });
    }

    // Salvar feedback em um arquivo
    const feedbackData = `${new Date().toISOString()} - ${username}: ${feedback}\n`;
    try {
        fs.appendFileSync('feedback.txt', feedbackData);
        console.log('Feedback salvo em feedback.txt:', feedbackData);
        res.status(200).json({ message: 'Feedback enviado com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar feedback:', error.message);
        res.status(500).json({ message: 'Erro ao salvar feedback' });
    }
});

module.exports = router;