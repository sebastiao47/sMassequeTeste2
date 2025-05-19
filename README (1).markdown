# Projeto Página Web Multitemática

## Descrição
Este projeto é uma aplicação web que demonstra a utilização de tecnologias modernas como AJAX, WebSocket, Node.js e Bootstrap. A aplicação simula uma Biblioteca Virtual com três layouts interativos: formulário de contato (AJAX), chat em tempo real (WebSocket), e galeria de livros (Bootstrap).

## Estrutura do Projeto
```
/projeto-pagina-web
├── public/
│   ├── index.html           // Página principal com AJAX
│   ├── chat.html            // Página de chat com WebSocket
│   ├── produtos.html        // Página de livros com Bootstrap
│   ├── css/
│   │   └── estilo.css       // Estilos personalizados
│   ├── js/
│   │   └── scripts.js       // Lógica AJAX e WebSocket
│   └── imagens/             // Imagens dos livros e editoras
├── server/
│   ├── app.js               // Servidor Node.js
│   └── routes.js            // Rotas para requisições AJAX
├── package.json             // Dependências do projeto
├── README.md                // Documentação do projeto
└── documentacao.pdf         // Documentação detalhada
```

## Tecnologias Utilizadas
- **HTML, CSS, JavaScript**: Base da aplicação.
- **Bootstrap**: Framework para design responsivo.
- **Node.js**: Servidor backend com Express.js.
- **Socket.IO**: Comunicação em tempo real via WebSocket.
- **AJAX**: Comunicação assíncrona com fetch().

## Instalação
1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/projeto-pagina-web.git
   ```
2. Instale as dependências:
   ```bash
   cd projeto-pagina-web
   npm install
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```
4. Acesse a aplicação em `http://localhost:3000`.

## Funcionalidades
1. **Formulário de Contato (index.html)**:
   - Envia mensagens assincronamente usando AJAX.
   - Feedback visual com modal Bootstrap.
2. **Chat em Tempo Real (chat.html)**:
   - Comunicação bidirecional via WebSocket.
   - Interface responsiva com Bootstrap.
3. **Galeria de Livros (produtos.html)**:
   - Layout responsivo com grid Bootstrap.
   - Navegação por categorias.

## Documentação
- **documentacao.pdf**: Contém explicação detalhada de cada componente, capturas de tela, e fluxos de dados.
- Este README fornece uma visão geral do projeto.

## Contribuição
Sinta-se à vontade para abrir issues ou pull requests no GitHub.

## Licença
MIT License.