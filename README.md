# 🤖 Roblox Discord Bot

Bot Discord para gerenciamento completo de grupos Roblox com sistema anti-raid, comandos administrativos e monitoramento em tempo real.

## ✨ Funcionalidades

### 📊 Monitoramento Automático
- ✅ Novos membros aceitos
- 📈 Promoções e rebaixamentos
- 🚪 Membros removidos
- 🚨 Detecção anti-raid automática

### ⚡ Comandos Administrativos
- `/promover` - Promover membros
- `/rebaixar` - Rebaixar membros  
- `/exilar` - Exilar membros
- `/aceitar` - Aceitar pedidos de entrada
- `/rejeitar` - Rejeitar pedidos de entrada

### 📋 Comandos Informativos
- `/status` - Status do grupo
- `/members` - Contagem de membros
- `/cargos` - Lista de cargos
- `/info` - Informações de usuário

## 🛠️ Instalação

### 1. Pré-requisitos
- Node.js 16.9.0 ou superior
- Uma conta no Discord Developer Portal
- Conta Roblox com permissões no grupo

### 2. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/roblox-discord-bot.git
cd roblox-discord-bot
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

Configure as seguintes variáveis no arquivo `.env`:

```env
# Discord Bot Configuration
DISCORD_TOKEN=seu_token_aqui
DISCORD_CLIENT_ID=seu_client_id_aqui

# Roblox Configuration
ROBLOX_COOKIE=seu_cookie_roblosecurity_aqui

# Group Settings
ROBLOX_GROUP_ID=123456
DISCORD_CHANNEL_ID=123456789012345678
DISCORD_LOG_CHANNEL_ID=123456789012345678

# Security Settings
ANTI_RAID_THRESHOLD=5
ANTI_RAID_TIME_WINDOW=120000

# Discord Role IDs for specific permissions  
ROLE_FULL_ADMIN=1392589722970492949
ROLE_EXILE_ACCEPT=1392589794009153719
ROLE_INFO_VIEWER=1392589802129457204
```

### 5. Como Obter as Credenciais

#### Discord Token:
1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie uma nova aplicação
3. Vá em "Bot" → "Add Bot"
4. Copie o token
5. Em "OAuth2" → "URL Generator":
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Send Messages`, `Use Slash Commands`, `Embed Links`

#### Roblox Cookie:
1. Faça login no Roblox no navegador
2. Abra o DevTools (F12)
3. Vá em Application → Cookies → https://www.roblox.com
4. Copie o valor do cookie `.ROBLOSECURITY`

### 💡 Como obter ID de um cargo Discord:
1. No Discord, vá nas configurações do servidor
2. Em "Cargos", clique direito no cargo desejado  
3. Selecione "Copiar ID"
4. Cole o ID no arquivo `.env`

⚠️ **Importante**: Ative o "Modo Desenvolvedor" nas configurações do Discord para ver a opção "Copiar ID".

### 6. Estrutura de Pastas
```
roblox-discord-bot/
├── config/
│   ├── commands.json
│   └── messages.json
├── .env
├── .env.example
├── index.js
├── package.json
└── README.md
```

### 7. Iniciar o Bot
```bash
# Produção
npm start

# Desenvolvimento (com auto-reload)
npm run dev
```

## ⚙️ Configuração Avançada

### Personalizar Comandos
Edite `config/commands.json` para modificar os comandos disponíveis:

```json
{
  "name": "novo_comando",
  "description": "Descrição do comando",
  "category": "admin",
  "adminOnly": true,
  "options": [...]
}
```

### Personalizar Mensagens
Edite `config/messages.json` para personalizar todas as mensagens do bot:

```json
{
  "errors": {
    "custom_error": "❌ Sua mensagem de erro personalizada"
  }
}
```

### Sistema Anti-Raid
Configurável através das variáveis:
- `ANTI_RAID_THRESHOLD`: Número máximo de ações
- `ANTI_RAID_TIME_WINDOW`: Janela de tempo em ms (padrão: 2 minutos)

## 🔒 Segurança

### Permissões Discord
Configure os cargos autorizados em `AUTHORIZED_ROLES`:
```env
AUTHORIZED_ROLES=Owner,Admin,Staff,Moderador
```

### Permissões Roblox
O bot precisa das seguintes permissões no grupo:
- ✅ Aceitar/Rejeitar pedidos
- ✅ Promover/Rebaixar membros
- ✅ Exilar membros
- ✅ Ver logs de auditoria

## 📝 Logs

O bot registra automaticamente:
- ✅ Todas as ações administrativas
- 🚨 Detecções de atividade suspeita
- ❌ Erros e exceções
- 📊 Status de inicialização

## 🐛 Troubleshooting

### Problema: "Token inválido"
- ✅ Verifique se o token Discord está correto
- ✅ Certifique-se de não ter espaços extras

### Problema: "Cookie expirado" 
- ✅ Renove o cookie `.ROBLOSECURITY`
- ✅ Verifique se a conta tem 2FA ativado

### Problema: "Sem permissões no grupo"
- ✅ Verifique se a conta bot tem rank suficiente
- ✅ Confirme as permissões no painel do grupo

### Problema: Comandos não aparecem
- ✅ Aguarde até 1 hora para sincronização
- ✅ Verifique se o `DISCORD_CLIENT_ID` está correto
- ✅ Reinicie o bot

## 📋 Changelog

### v1.0.0
- 🎉 Lançamento inicial
- ✅ Sistema de monitoramento completo
- ✅ Comandos administrativos
- ✅ Sistema anti-raid
- ✅ Configuração via JSON/ENV

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/roblox-discord-bot/issues)
- 💬 **Discord**: `shaiflm`
- 📧 **Email**: discroddda@gmail.com

---

**⚠️ Aviso Legal**: Este bot não é afiliado ao Roblox Corporation. Use por sua própria conta e risco.