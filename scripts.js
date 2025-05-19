document.addEventListener('DOMContentLoaded', () => {
    // Toggle da navbar em dispositivos móveis
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarNav = document.getElementById('navbarNav');
    if (navbarToggle && navbarNav) {
        navbarToggle.addEventListener('click', () => {
            navbarNav.classList.toggle('hidden');
        });
    }

    // Verificar autenticação com timeout
    if (!window.location.pathname.includes('index.html') && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('Registro.html')) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.error('Timeout ao verificar autenticação');
            window.location.href = 'index.html';
        }, 5000);

        fetch('/api/check-auth', {
            method: 'GET',
            credentials: 'include',
            signal: controller.signal
        })
            .then(response => {
                clearTimeout(timeoutId);
                if (!response.ok) throw new Error(`Erro na resposta do servidor: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (!data.isAuthenticated) {
                    console.log('Usuário não autenticado, redirecionando para index.html');
                    window.location.href = 'index.html';
                } else {
                    console.log('Usuário autenticado:', data.username);
                }
            })
            .catch(error => {
                clearTimeout(timeoutId);
                console.error('Erro ao verificar autenticação:', error.message);
                window.location.href = 'index.html';
            });
    }

    // Formulário de login
    const loginForm = document.getElementById('loginForm');
    const loginSuccess = document.getElementById('login-success');
    const successMessage = document.getElementById('success-message');
    if (loginForm && loginSuccess) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData);
            console.log('Dados enviados para login:', data);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                console.error('Timeout ao fazer login');
                alert('Erro: Tempo limite atingido ao fazer login. Tente novamente.');
            }, 5000);

            fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include',
                signal: controller.signal
            })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        throw new Error(`Erro na resposta do servidor: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Resposta do login:', data);
                    if (data.message === 'Login realizado com sucesso') {
                        loginSuccess.classList.remove('hidden');
                        setTimeout(() => {
                            loginSuccess.classList.add('hidden');
                            window.location.href = 'chat.html';
                        }, 2000); // Oculta após 2 segundos e redireciona
                    } else {
                        alert(data.message || 'Credenciais inválidas');
                    }
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    console.error('Erro ao fazer login:', error.message);
                    alert('Erro ao fazer login. Verifique sua conexão e tente novamente.');
                });
        });
    }

    // Formulário de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData);

            if (data.password !== data.confirm_password) {
                alert('As senhas não coincidem');
                return;
            }

            fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            })
                .then(response => {
                    if (!response.ok) throw new Error('Erro ao criar conta');
                    return response.json();
                })
                .then(data => {
                    alert('Conta criada com sucesso!');
                    window.location.href = 'login.html';
                })
                .catch(error => {
                    console.error('Erro ao criar conta:', error.message);
                    alert('Erro ao criar conta. Tente novamente.');
                });
        });
    }

    // Formulário de feedback (para produtos.html)
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackInput = document.getElementById('feedbackInput');
    if (feedbackForm && feedbackInput) {
        feedbackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const feedback = feedbackInput.value.trim();
            if (!feedback) {
                alert('Por favor, digite sua sugestão antes de enviar.');
                return;
            }

            console.log('Enviando feedback:', feedback);
            fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback }),
                credentials: 'include'
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro na resposta do servidor: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Resposta do servidor:', data);
                    alert('Sugestão enviada com sucesso!');
                    feedbackInput.value = '';
                })
                .catch(error => {
                    console.error('Erro ao enviar feedback:', error.message);
                    alert('Erro ao enviar sugestão. Tente novamente.');
                });
        });
    }

    // Lógica do chat
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');
    const userList = document.getElementById('user-list');
    const questionCounter = document.getElementById('question-counter');
    let username = '';
    let questionCount = 3;
    let limitReached = false;

    if (messageForm && messageInput && chatMessages && typingIndicator && userList && questionCounter) {
        const socket = io('http://localhost:3000', {
            withCredentials: true,
            reconnectionAttempts: 5,
            timeout: 10000
        });

        socket.on('connect', () => {
            console.log('Conectado ao servidor WebSocket com ID:', socket.id);
            socket.emit('check-auth');
        });

        socket.on('connect_error', (error) => {
            console.error('Erro de conexão WebSocket:', error.message);
            const messageElement = document.createElement('div');
            messageElement.classList.add('message-animation', 'flex', 'mb-4');
            messageElement.innerHTML = `
                <div class="flex-shrink-0 h-10 w-10 rounded-full bg-red-500 flex items-center justify-center text-white">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <div class="ml-3">
                    <div class="font-semibold text-gray-800">Sistema</div>
                    <div class="mt-1 text-sm text-gray-600 bg-gray-100 rounded-lg p-3 max-w-xs md:max-w-md">
                        Erro: Não foi possível conectar ao servidor. Verifique sua conexão.
                    </div>
                    <div class="text-xs text-gray-500 mt-1">Agora</div>
                </div>
            `;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        socket.on('auth-status', (data) => {
            console.log('Status de autenticação recebido:', data);
            if (data.isAuthenticated) {
                username = data.username;
                console.log('Usuário autenticado no chat:', username);
                socket.emit('new user', username);
            } else {
                window.location.href = 'index.html';
            }
        });

        // Update question counter
        function updateQuestionCounter() {
            if (questionCount > 0) {
                questionCounter.textContent = `Perguntas restantes: ${questionCount}`;
            } else {
                questionCounter.textContent = `Limite atingido! Converse com outros usuários.`;
            }
            if (questionCount === 0) {
                questionCounter.classList.add('text-red-500');
                questionCounter.classList.remove('text-gray-500');
            } else {
                questionCounter.classList.remove('text-red-500');
                questionCounter.classList.add('text-gray-500');
            }
        }

        // Bot responses for specific commands
        const botResponses = {
            '/ajuda': 'Posso ajudar com: /livros - categorias de livros, /horario - horário de funcionamento, /emprestimo - regras de empréstimo, /contato - informações de contato.',
            '/livros': 'Temos estas categorias: Ficção, Não-ficção, Biografias, Ciência, Tecnologia, Arte, História e Infantil.',
            '/categorias': 'Temos estas categorias: Ficção, Não-ficção, Biografias, Ciência, Tecnologia, Arte, História e Infantil.',
            '/horario': 'Funcionamos de segunda a sexta das 8h às 20h, e sábados das 9h às 14h.',
            '/emprestimo': 'O prazo de empréstimo é de 15 dias, renovável por mais 15 se não houver reservas. Limite de 5 livros por usuário.',
            '/contato': 'Email: biblioteca@exemplo.com | Telefone: (11) 1234-5678 | Endereço: Rua da Biblioteca, 123',
            'default': 'Desculpe, não entendi sua pergunta. Tente reformular ou digite /ajuda para ver os comandos disponíveis.'
        };

        // Common questions and answers
        const commonQuestions = {
            'olá': 'Olá! Como posso ajudar você hoje?',
            'oi': 'Oi! Como posso ajudar você hoje?',
            'livros disponíveis': 'Temos muitos livros disponíveis! Algumas categorias incluem Ficção, Ciência e Tecnologia. Digite /livros para ver todas as categorias.',
            'categorias': 'Temos estas categorias: Ficção, Não-ficção, Biografias, Ciência, Tecnologia, Arte, História e Infantil.',
            'como faço para pegar um livro emprestado': 'Você precisa se cadastrar na biblioteca com documento de identidade e comprovante de residência. Depois pode levar até 5 livros por 15 dias.',
            'quais são os livros mais populares': 'Atualmente os mais populares são: "O poder do hábito", "Sapiens", "1984", "A revolução dos bichos" e "O pequeno príncipe".',
            'posso renovar meu empréstimo online': 'Sim, acesse nosso site, faça login e clique em "Renovar empréstimos". Você pode renovar uma vez se não houver reservas.',
            'a biblioteca tem e-books': 'Sim, temos uma coleção de e-books disponíveis. Acesse nosso site e faça login para ver a coleção digital.',
            'como faço uma doação de livros': 'Aceitamos doações em bom estado na recepção da biblioteca. Livros didáticos devem ter menos de 5 anos de publicação.',
            'qual é o horário': 'Funcionamos de segunda a sexta das 8h às 20h, e sábados das 9h às 14h.',
            'quem escreveu dom casmurro': 'Dom Casmurro foi escrito por Machado de Assis, um dos maiores escritores brasileiros. Publicado em 1899, é uma obra-prima da literatura brasileira.',
            'qual é o clima hoje': 'Não tenho acesso a informações de clima em tempo real, mas posso ajudar com outras perguntas! Você gostaria de saber sobre livros ou serviços da biblioteca?'
        };

        // Process message and get bot response
        function getBotResponse(message) {
            message = message.toLowerCase().trim();
            
            // Verificar se o limite de perguntas foi atingido
            if (limitReached) {
                return null; // Bot não responde mais
            }

            if (questionCount <= 0) {
                limitReached = true;
                return "Você atingiu o limite de 3 perguntas. Agora você pode conversar com outros usuários online!";
            }

            // Responder a comandos
            if (botResponses[message]) {
                questionCount--;
                updateQuestionCounter();
                return botResponses[message];
            }

            // Responder a perguntas comuns
            for (const [question, answer] of Object.entries(commonQuestions)) {
                if (message.includes(question)) {
                    questionCount--;
                    updateQuestionCounter();
                    return answer;
                }
            }

            // Responder a perguntas genéricas
            const questionWords = ['quem', 'o que', 'onde', 'quando', 'por que', 'como', 'qual', 'existe', 'posso', 'tem'];
            const isQuestion = questionWords.some(word => message.startsWith(word)) || message.endsWith('?');

            if (isQuestion) {
                questionCount--;
                updateQuestionCounter();

                // Respostas para perguntas específicas
                if (message.includes('livro') && message.includes('disponível')) {
                    return 'Temos muitos livros disponíveis! Algumas categorias incluem Ficção, Ciência e Tecnologia. Digite /livros para ver todas as categorias.';
                }
                if (message.includes('categoria')) {
                    return 'Temos estas categorias: Ficção, Não-ficção, Biografias, Ciência, Tecnologia, Arte, História e Infantil.';
                }
                if (message.includes('horário') || message.includes('funciona')) {
                    return 'Funcionamos de segunda a sexta das 8h às 20h, e sábados das 9h às 14h.';
                }
                if (message.includes('emprestar') || message.includes('pegar um livro')) {
                    return 'Você precisa se cadastrar na biblioteca com documento de identidade e comprovante de residência. Depois pode levar até 5 livros por 15 dias.';
                }
                if (message.includes('renovar')) {
                    return 'Sim, acesse nosso site, faça login e clique em "Renovar empréstimos". Você pode renovar uma vez se não houver reservas.';
                }
                if (message.includes('doação') || message.includes('doar')) {
                    return 'Aceitamos doações em bom estado na recepção da biblioteca. Livros didáticos devem ter menos de 5 anos de publicação.';
                }
                if (message.includes('e-books') || message.includes('livros digitais')) {
                    return 'Sim, temos uma coleção de e-books disponíveis. Acesse nosso site e faça login para ver a coleção digital.';
                }
                if (message.includes('contato') || message.includes('falar com alguém')) {
                    return 'Email: biblioteca@exemplo.com | Telefone: (11) 1234-5678 | Endereço: Rua da Biblioteca, 123';
                }
                if (message.includes('livros mais populares') || message.includes('mais lidos')) {
                    return 'Atualmente os mais populares são: "O poder do hábito", "Sapiens", "1984", "A revolução dos bichos" e "O pequeno príncipe".';
                }
                if (message.includes('machado de assis') || message.includes('dom casmurro')) {
                    return 'Dom Casmurro foi escrito por Machado de Assis, um dos maiores escritores brasileiros. Publicado em 1899, é uma obra-prima da literatura brasileira.';
                }
                if (message.includes('autor') || message.includes('quem escreveu')) {
                    if (message.includes('1984')) return '1984 foi escrito por George Orwell, publicado em 1949.';
                    if (message.includes('o pequeno príncipe')) return 'O Pequeno Príncipe foi escrito por Antoine de Saint-Exupéry, publicado em 1943.';
                    if (message.includes('sapiens')) return 'Sapiens: Uma Breve História da Humanidade foi escrito por Yuval Noah Harari, publicado em 2011.';
                    return 'Pode me dizer o nome do livro que você está procurando? Eu te ajudo a encontrar o autor!';
                }
                if (message.includes('clima') || message.includes('tempo hoje')) {
                    return 'Não tenho acesso a informações de clima em tempo real, mas posso ajudar com outras perguntas! Você gostaria de saber sobre livros ou serviços da biblioteca?';
                }
                if (message.includes('recomendar um livro')) {
                    return 'Claro! Se você gosta de ficção, recomendo "1984" de George Orwell. Para não-ficção, "Sapiens" de Yuval Noah Harari é ótimo. Qual gênero você prefere?';
                }
                if (message.includes('eventos') || message.includes('atividades')) {
                    return 'Realizamos eventos como clubes de leitura e oficinas de escrita. Você pode verificar a programação no nosso site ou entrar em contato pelo email biblioteca@exemplo.com.';
                }
                if (message.includes('wifi') || message.includes('internet')) {
                    return 'Sim, temos Wi-Fi gratuito na biblioteca! A senha está disponível na recepção. Traga seu dispositivo e aproveite!';
                }
                if (message.includes('estudo') || message.includes('espaço para estudar')) {
                    return 'Temos uma sala de estudos tranquila no segundo andar, com mesas e cadeiras confortáveis. É só chegar e usar!';
                }
                if (message.includes('crianças') || message.includes('infantil')) {
                    return 'Temos uma seção infantil com livros, jogos e atividades para crianças. Também organizamos contação de histórias aos sábados às 10h.';
                }
                return botResponses['default'];
            }

            // Responder a saudações
            if (message === 'olá' || message === 'oi' || message === 'ola' || message === 'bom dia' || message === 'boa tarde' || message === 'boa noite') {
                questionCount--;
                updateQuestionCounter();
                return commonQuestions[message] || 'Olá! Como posso ajudar você hoje?';
            }

            return null; // Não responder se não for uma pergunta ou saudação
        }

        // Add a message to the chat
        function addMessage(sender, message, isBot = false) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message-animation', 'flex', 'mb-4');
            
            if (isBot) {
                messageElement.innerHTML = `
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="ml-3">
                        <div class="font-semibold text-gray-800">Bibliotecário Virtual</div>
                        <div class="mt-1 text-sm text-gray-600 bg-gray-100 rounded-lg p-3 max-w-xs md:max-w-md">
                            ${message}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">Agora</div>
                    </div>
                `;
            } else {
                messageElement.innerHTML = `
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-500 flex items-center justify-center text-white">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="ml-3">
                        <div class="font-semibold text-gray-800">${sender}</div>
                        <div class="mt-1 text-sm text-gray-600 bg-indigo-100 rounded-lg p-3 max-w-xs md:max-w-md">
                            ${message}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">Agora</div>
                    </div>
                `;
            }
            
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Show typing indicator
        function showTypingIndicator() {
            typingIndicator.classList.remove('hidden');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Hide typing indicator
        function hideTypingIndicator() {
            typingIndicator.classList.add('hidden');
        }

        // Update user list
        function updateUserList(users) {
            userList.innerHTML = '';
            if (users.length === 0) {
                userList.innerHTML = '<li class="text-gray-500">Nenhum usuário online</li>';
            } else {
                users.forEach(user => {
                    const userElement = document.createElement('li');
                    userElement.className = 'flex items-center';
                    userElement.innerHTML = `
                        <span class="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        ${user}
                    `;
                    userList.appendChild(userElement);
                });
            }
        }

        // Form submission
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const message = messageInput.value.trim();
            if (!message) return;
            
            console.log('Enviando mensagem:', { username, message });
            addMessage(username, message);
            
            socket.emit('chat message', { username, message });
            
            const botResponse = getBotResponse(message);
            if (botResponse !== null && !limitReached) {
                console.log('Bot vai responder:', botResponse);
                showTypingIndicator();
                
                setTimeout(() => {
                    hideTypingIndicator();
                    addMessage('Bibliotecário Virtual', botResponse, true);
                    // Não emitir 'bot message' para evitar duplicação
                    console.log('Mensagem do bot exibida localmente:', botResponse);
                }, 1000 + Math.random() * 2000);
            }
            
            messageInput.value = '';
        });

        // Socket events
        socket.on('user joined', (data) => {
            console.log('Usuário entrou:', data);
            addMessage('Sistema', `${data.username} entrou no chat.`, true);
        });

        socket.on('user left', (data) => {
            console.log('Usuário saiu:', data);
            addMessage('Sistema', `${data.username} saiu do chat.`, true);
        });

        socket.on('chat message', (data) => {
            console.log('Mensagem de chat recebida:', data);
            if (data.username !== username) {
                addMessage(data.username, data.message);
            }
        });

        socket.on('bot message', (message) => {
            console.log('Mensagem do bot recebida do servidor (ignorado):', message);
            // Ignorar mensagens do bot retransmitidas para evitar duplicação
        });

        socket.on('update users', (data) => {
            console.log('Atualizando lista de usuários:', data);
            updateUserList(data.users);
        });

        // Initial setup
        updateQuestionCounter();
    } else {
        console.warn('Elementos do chat não encontrados no DOM:', {
            messageForm: !!messageForm,
            messageInput: !!messageInput,
            chatMessages: !!chatMessages,
            typingIndicator: !!typingIndicator,
            userList: !!userList,
            questionCounter: !!questionCounter
        });
    }
});