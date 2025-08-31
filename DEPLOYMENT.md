# 🚀 Guia de Deploy - Roblox Discord Bot

## 📋 Pré-requisitos

- ✅ Node.js 16.9.0 ou superior ([Download](https://nodejs.org/))
- ✅ Git ([Download](https://git-scm.com/))
- ✅ Conta GitHub
- ✅ Token Discord Bot
- ✅ Cookie Roblox (.ROBLOSECURITY)

## 📤 1. Upload para GitHub

### Criar Repositório no GitHub:
1. Acesse [GitHub](https://github.com) e faça login
2. Clique em **"New"** ou **"+"** → **"New repository"**
3. Nome: `roblox-discord-bot` (ou outro nome)
4. Marque como **Private** (recomendado para bots)
5. NÃO marque "Add a README file"
6. Clique em **"Create repository"**

### Upload dos Arquivos:
```bash
# 1. Inicializar Git na pasta do projeto
git init

# 2. Adicionar remote do GitHub (substitua SEU_USUARIO e NOME_REPO)
git remote add origin https://github.com/SEU_USUARIO/NOME_REPO.git

# 3. Adicionar arquivos (o .gitignore vai ignorar o .env automaticamente)
git add .

# 4. Primeiro commit
git commit -m "🎉 Initial commit - Roblox Discord Bot"

# 5. Upload para GitHub
git push -u origin main
```

⚠️ **IMPORTANTE**: O arquivo `.env` com suas credenciais **NÃO** será enviado para o GitHub (protegido pelo `.gitignore`)!

## 💻 2. Como Rodar Localmente

### Primeira Vez (Setup):
```bash
# 1. Clonar o repositório
git clone https://github.com/eoshai/roblox-discord-bot.git
cd NOME_REPO

# 2. Setup automático (instala dependências e cria .env)
npm run setup

# 3. Editar .env com suas credenciais
nano .env
# ou
notepad .env
```

### Configurar .env:
```env
# Discord
DISCORD_TOKEN=SEU_TOKEN_AQUI
DISCORD_CLIENT_ID=SEU_CLIENT_ID_AQUI

# Roblox  
ROBLOX_COOKIE=SEU_COOKIE_ROBLOSECURITY_AQUI
ROBLOX_GROUP_ID=123456

# Discord Channels
DISCORD_CHANNEL_ID=123456789012345678
DISCORD_LOG_CHANNEL_ID=123456789012345678

# Roles
ROLE_FULL_ADMIN=1392589722970492949
ROLE_EXILE_ACCEPT=1392589794009153719
ROLE_INFO_VIEWER=1392589802129457204
```

### Executar o Bot:
```bash
# Produção
npm start

# Desenvolvimento (auto-reload)
npm run dev

# Verificar sintaxe
npm test

# Validar .env
npm run validate
```

## ☁️ 3. Deploy em VPS/Cloud

### 3.1 VPS Ubuntu (Recomendado):

```bash
# 1. Conectar no VPS
ssh usuario@SEU_IP

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar PM2 (gerenciador de processo)
sudo npm install -g pm2

# 4. Clonar projeto
git clone https://github.com/eoshai/roblox-discord-bot.git
cd NOME_REPO

# 5. Instalar dependências
npm install

# 6. Configurar .env
cp .env.example .env
nano .env

# 7. Iniciar com PM2
pm2 start start.js --name "roblox-bot"

# 8. Configurar auto-start
pm2 startup
pm2 save
```

### 3.2 Heroku (Gratuito/Pago):

1. **Criar conta no [Heroku](https://heroku.com)**

2. **Instalar Heroku CLI**:
```bash
# Windows/Mac: baixar do site
# Ubuntu:
sudo snap install --classic heroku
```

3. **Deploy**:
```bash
# 1. Login
heroku login

# 2. Criar app
heroku create nome-do-seu-bot

# 3. Configurar variáveis de ambiente
heroku config:set DISCORD_TOKEN=seu_token
heroku config:set ROBLOX_COOKIE=seu_cookie
heroku config:set ROBLOX_GROUP_ID=123456
heroku config:set DISCORD_CHANNEL_ID=123456789
heroku config:set ROLE_FULL_ADMIN=1392589722970492949
heroku config:set ROLE_EXILE_ACCEPT=1392589794009153719  
heroku config:set ROLE_INFO_VIEWER=1392589802129457204

# 4. Deploy
git push heroku main
```

### 3.3 Railway (Fácil e Gratuito):

1. **Acesse [Railway.app](https://railway.app)**
2. **Login com GitHub**
3. **"New Project" → "Deploy from GitHub repo"**
4. **Selecione seu repositório**
5. **Configure as variáveis de ambiente** na aba "Variables"
6. **Deploy automático** 🎉

## 🔧 4. Comandos Úteis

```bash
# Verificar logs (PM2)
pm2 logs roblox-bot

# Reiniciar bot (PM2)
pm2 restart roblox-bot

# Parar bot (PM2)
pm2 stop roblox-bot

# Atualizar do GitHub
git pull origin main
npm install
pm2 restart roblox-bot

# Backup configuração PM2
pm2 save

# Ver processos rodando
pm2 list
```

## 🛠️ 5. Troubleshooting

### Bot não inicia:
```bash
# Verificar .env
npm run validate

# Verificar sintaxe
npm test

# Ver logs detalhados
npm start
```

### "Permission denied" no VPS:
```bash
# Dar permissões
chmod +x start.js
sudo chown -R $USER:$USER .
```

### Bot desconecta constantemente:
```bash
# Usar PM2 com auto-restart
pm2 start start.js --name "roblox-bot" --watch --ignore-watch="node_modules"
```

### Heroku "Application error":
```bash
# Ver logs
heroku logs --tail

# Verificar variáveis
heroku config
```

## 📊 6. Monitoramento

### PM2 Monitoring (Grátis):
```bash
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY
pm2 monitor
```

### UptimeRobot (Gratuito):
1. Crie conta no [UptimeRobot](https://uptimerobot.com)
2. Monitore HTTP/HTTPS endpoint
3. Receba alertas por email/SMS

## 🔒 7. Segurança

- ✅ **Nunca** commite o arquivo `.env`
- ✅ Use repositório **Private** no GitHub
- ✅ Mude cookies/tokens se comprometidos
- ✅ Use 2FA no Roblox
- ✅ Monitore logs regularmente
- ✅ Mantenha dependências atualizadas

## 📱 8. Atualizações

```bash
# 1. Baixar atualizações
git pull origin main

# 2. Atualizar dependências
npm install

# 3. Reiniciar (PM2)
pm2 restart roblox-bot

# 4. Verificar status
pm2 logs roblox-bot
```

---

## 🆘 Suporte

- 🐛 **Issues**: [GitHub Issues](https://github.com/eoshai/roblox-discord-bot/issues)
- 💬 **Discord**: `shaiflm`
- 📧 **Email**: seu-email@exemplo.com