# Lafé — Sistema de Caixa para Cantina

> Sistema de PDV (ponto de venda) completo para cantinas de igrejas e eventos.  
> Funciona **100% offline**, pode ser **instalado na tela inicial** do celular e notebook.

---

## ✨ Funcionalidades

| Recurso | Descrição |
|---|---|
| 🛒 **PDV** | Adicione produtos ao carrinho, ajuste quantidade, busque por nome ou categoria |
| 💵 **Dinheiro** | Calcula o troco automaticamente |
| 📱 **Pix / QR Code** | Gera QR code na hora, exibe o valor atualizado em tempo real |
| 📦 **Estoque** | Cadastre, edite e exclua produtos com controle de quantidade |
| 📊 **Vendas** | Histórico completo com resumo por forma de pagamento |
| 🔒 **Senha** | Protege as abas Estoque e Vendas com senha de 4 dígitos |
| ⚙️ **Configurações** | Altere a chave Pix, troque a senha e instale o app |
| 🔤 **Fonte** | Ajuste o tamanho da fonte para melhor leitura |
| 📲 **PWA** | Instale como app nativo no celular ou computador |
| ✈️ **Offline** | Funciona sem internet após a primeira visita |

---

## 📁 Estrutura de Arquivos

```
lafé-cantina/
├── index.html       ← Página principal (HTML)
├── style.css        ← Todos os estilos
├── app.js           ← Lógica do sistema
├── qr.js            ← Gerador de QR Code (sem CDN, offline)
├── sw.js            ← Service Worker (modo offline)
├── manifest.json    ← Configuração PWA (instalar como app)
├── icon-192.png     ← Ícone do app (192×192)
├── icon-512.png     ← Ícone do app (512×512)
└── README.md        ← Este arquivo
```

---

## 🚀 Como publicar no GitHub Pages

### 1. Criar o repositório

1. Acesse [github.com/new](https://github.com/new)
2. Nome sugerido: `lafe-cantina`
3. Deixe **público** e clique em **Create repository**

### 2. Fazer upload dos arquivos

1. Clique em **uploading an existing file**
2. Arraste **todos os arquivos** da pasta (não a pasta em si, os arquivos dentro dela)
3. Clique em **Commit changes**

### 3. Ativar o GitHub Pages

1. Vá em **Settings → Pages**
2. Em *Branch*, selecione **main** e pasta **/ (root)**
3. Clique em **Save**

### 4. Acessar o app

Após 1–2 minutos, o app estará disponível em:

```
https://seu-usuario.github.io/lafe-cantina/
```

---

## 📲 Instalar na tela inicial

### iPhone / iPad (Safari)
1. Abra o link no **Safari**
2. Toque em **Compartilhar** (ícone de caixa com seta)
3. Toque em **Adicionar à Tela de Início**

### Android (Chrome)
1. Abra o link no **Chrome**
2. Toque nos **3 pontos** (menu)
3. Toque em **Adicionar à tela inicial**
4. Ou aguarde o banner de instalação aparecer automaticamente

### Computador (Chrome / Edge)
1. Abra o link no navegador
2. Clique no ícone **⊕** na barra de endereços
3. Clique em **Instalar**

---

## ⚙️ Configurações do sistema

Clique no botão **⚙️** no canto superior direito para:

- **💳 Chave Pix** — altere a chave, o nome do recebedor e o código Pix Copia e Cola
- **🔑 Senha** — crie, troque ou remova a senha de acesso ao Estoque e Vendas
- **📲 Instalar** — instale o app diretamente pelo menu de configurações

---

## 💾 Armazenamento de dados

Todos os dados (produtos, vendas, configurações) são salvos localmente no navegador via `localStorage`. Não há servidor — os dados ficam no próprio dispositivo.

> ⚠️ Limpar os dados do navegador apaga os dados do app. Para backup, exporte os dados pelo histórico de vendas.

---

## 🛠️ Tecnologias utilizadas

- **HTML5 / CSS3 / JavaScript** — sem frameworks, sem dependências externas
- **QR Code** — gerado localmente em JavaScript puro (sem APIs externas)
- **Service Worker** — cache offline via PWA
- **Web App Manifest** — instalação como app nativo
- **localStorage** — persistência de dados no dispositivo

---

## 📞 Chave Pix padrão

A chave Pix pode ser alterada a qualquer momento nas **Configurações ⚙️** do app.

---

*Desenvolvido com ❤️ para a Cantina Lafé*
