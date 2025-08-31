const Discord = require('discord.js');
const noblox = require('noblox.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Carregar configurações
const commands = require('./config/commands.json');
const messages = require('./config/messages.json');

// Configurações do ambiente
const CONFIG = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    ROBLOX_COOKIE: process.env.ROBLOX_COOKIE,
    GROUP_ID: parseInt(process.env.ROBLOX_GROUP_ID),
    CHANNEL_ID: process.env.DISCORD_CHANNEL_ID,
    LOG_CHANNEL_ID: process.env.DISCORD_LOG_CHANNEL_ID,
    ANTI_RAID_THRESHOLD: parseInt(process.env.ANTI_RAID_THRESHOLD) || 5,
    ANTI_RAID_TIME_WINDOW: parseInt(process.env.ANTI_RAID_TIME_WINDOW) || 120000,
    ROLE_FULL_ADMIN: process.env.ROLE_FULL_ADMIN,
    ROLE_EXILE_ACCEPT: process.env.ROLE_EXILE_ACCEPT,
    ROLE_INFO_VIEWER: process.env.ROLE_INFO_VIEWER,
    NODE_ENV: process.env.NODE_ENV || 'development'
};

async function getHeadshotUrl(userId) {
    const response = await fetch(`https://thumbnails.roproxy.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
    const data = await response.json();
    if (data.data && data.data[0] && data.data[0].imageUrl) {
        return data.data[0].imageUrl;
    }
    return null; // fallback caso algo dê errado
}


// Validar configurações obrigatórias
function validateConfig() {
    const required = ['DISCORD_TOKEN', 'ROBLOX_COOKIE', 'GROUP_ID', 'CHANNEL_ID'];
    const roleRequired = ['ROLE_FULL_ADMIN', 'ROLE_EXILE_ACCEPT', 'ROLE_INFO_VIEWER'];
    
    const missing = required.filter(key => !CONFIG[key]);
    const missingRoles = roleRequired.filter(key => !CONFIG[key]);
    
    if (missing.length > 0) {
        console.error('❌ Configurações obrigatórias não encontradas:', missing);
        console.error('Verifique o arquivo .env');
        process.exit(1);
    }
    
    if (missingRoles.length > 0) {
        console.error('❌ IDs de cargos não configurados:', missingRoles);
        console.error('Configure os ROLE_* no arquivo .env');
        process.exit(1);
    }
    
    console.log('✅ Configurações carregadas com sucesso!');
}

const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages
    ]
});

class RobloxGroupBot {
    constructor() {
        this.recentActions = [];
        this.isMonitoring = false;
        this.colors = messages.embeds.colors;
        this.emojis = messages.embeds.emojis;
    }

    async initialize() {
        try {
            validateConfig();
            
            // Login no Roblox
            await noblox.setCookie(CONFIG.ROBLOX_COOKIE);
            console.log('✅ Logado no Roblox!');
            
            // Login no Discord
            await client.login(CONFIG.DISCORD_TOKEN);
            console.log('✅ Bot Discord conectado!');
            
            this.startMonitoring();
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            process.exit(1);
        }
    }

    startMonitoring() {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        // Monitorar logs de auditoria em tempo real
        noblox.onAuditLog(CONFIG.GROUP_ID).on('data', (auditData) => {
            this.handleAuditLogEvent(auditData);
        });

        console.log('🔍 Monitoramento iniciado!');
    }

    async handleAuditLogEvent(data) {
        const channel = client.channels.cache.get(CONFIG.CHANNEL_ID);
        if (!channel) return;

        // Registrar ação recente para detecção anti-raid
        this.recentActions.push({
            timestamp: Date.now(),
            action: data.actionType,
            actor: data.actor
        });

        // Limpar ações antigas
        this.cleanOldActions();

        // Verificar se é possível raid
        if (this.detectSuspiciousActivity()) {
            await this.handleSuspiciousActivity(channel);
            return;
        }

        // Processar diferentes tipos de ações
        switch (data.actionType) {
            case 'Accept Join Request':
                await this.handleNewMember(data, channel);
                break;
            
            case 'Change Rank':
                await this.handleRankChange(data, channel);
                break;
            
            case 'Remove Member':
                await this.handleMemberRemoval(data, channel);
                break;
        }
    }

    async handleNewMember(data, channel) {
        const embed = new Discord.EmbedBuilder()
            .setTitle(messages.audit_log.new_member_title)
            .setColor(this.colors.success)
            .addFields([
                { name: messages.audit_log.user_field, value: data.description.TargetName || 'Desconhecido', inline: true },
                { name: messages.audit_log.accepted_by, value: data.actor.user.username, inline: true },
                { name: messages.audit_log.timestamp, value: new Date().toLocaleString('pt-BR'), inline: true }
            ])
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }

    async handleRankChange(data, channel) {
        const isPromotion = data.description.NewRank > data.description.OldRank;
        const embed = new Discord.EmbedBuilder()
            .setTitle(isPromotion ? messages.audit_log.promotion_title : messages.audit_log.demotion_title)
            .setColor(isPromotion ? this.colors.success : this.colors.warning)
            .addFields([
                { name: messages.audit_log.user_field, value: data.description.TargetName || 'Desconhecido', inline: true },
                { name: messages.audit_log.old_rank, value: `${data.description.OldRank}`, inline: true },
                { name: messages.audit_log.new_rank, value: `${data.description.NewRank}`, inline: true },
                { name: messages.audit_log.changed_by, value: data.actor.user.username, inline: true },
                { name: messages.audit_log.timestamp, value: new Date().toLocaleString('pt-BR'), inline: true }
            ])
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }

    async handleMemberRemoval(data, channel) {
        const embed = new Discord.EmbedBuilder()
            .setTitle(messages.audit_log.member_removal_title)
            .setColor(this.colors.error)
            .addFields([
                { name: messages.audit_log.user_field, value: data.description.TargetName || 'Desconhecido', inline: true },
                { name: messages.audit_log.removed_by, value: data.actor.user.username, inline: true },
                { name: messages.audit_log.timestamp, value: new Date().toLocaleString('pt-BR'), inline: true }
            ])
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }

    detectSuspiciousActivity() {
        const timeWindow = Date.now() - CONFIG.ANTI_RAID_TIME_WINDOW;
        const recentActionCount = this.recentActions.filter(
            action => action.timestamp > timeWindow
        ).length;

        return recentActionCount >= CONFIG.ANTI_RAID_THRESHOLD;
    }

    async handleSuspiciousActivity(channel) {
        const embed = new Discord.EmbedBuilder()
            .setTitle(messages.audit_log.raid_alert_title)
            .setDescription(messages.audit_log.raid_alert_description)
            .setColor(this.colors.raid_alert)
            .addFields([
                { 
                    name: messages.audit_log.recent_actions, 
                    value: `${this.recentActions.length} ações nos últimos ${CONFIG.ANTI_RAID_TIME_WINDOW/60000} minutos`, 
                    inline: true 
                },
                { 
                    name: 'Recomendação', 
                    value: messages.audit_log.raid_recommendation, 
                    inline: true 
                }
            ])
            .setTimestamp();

        await channel.send({ 
            content: '@everyone', 
            embeds: [embed] 
        });
    }

    cleanOldActions() {
        const timeWindow = Date.now() - CONFIG.ANTI_RAID_TIME_WINDOW;
        this.recentActions = this.recentActions.filter(
            action => action.timestamp > timeWindow
        );
    }

    // Comandos slash do arquivo JSON
    async setupSlashCommands() {
        try {
            const rest = new Discord.REST({ version: '10' }).setToken(CONFIG.DISCORD_TOKEN);
            await rest.put(
                Discord.Routes.applicationCommands(CONFIG.DISCORD_CLIENT_ID),
                { body: commands.commands }
            );
            console.log('✅ Comandos slash registrados!');
        } catch (error) {
            console.error('❌ Erro ao registrar comandos:', error);
        }
    }

    // Sistema de permissões hierárquico cumulativo
    hasPermission(interaction, commandName) {
        const memberRoleIds = interaction.member.roles.cache.map(role => role.id);
        
        // Definir hierarquia de permissões (do maior para o menor)
        const hasFullAdmin = memberRoleIds.includes(CONFIG.ROLE_FULL_ADMIN);
        const hasExileAccept = memberRoleIds.includes(CONFIG.ROLE_EXILE_ACCEPT);
        const hasInfoViewer = memberRoleIds.includes(CONFIG.ROLE_INFO_VIEWER);
        
        // Determinar nível de permissão do usuário
        let userLevel = 0; // Público
        if (hasInfoViewer) userLevel = 1; // Info Viewer
        if (hasExileAccept) userLevel = 2; // Exile & Accept (herda Info Viewer)
        if (hasFullAdmin) userLevel = 3;   // Admin Completo (herda tudo)
        
        // Definir comandos por nível
        const commandLevels = {
            // Nível 0 - Público
            'status': 0,
            
            // Nível 1 - Info Viewer
            'info': 1,
            'cargos': 1, 
            'members': 1,
            
            // Nível 2 - Exile & Accept (+ anteriores)
            'aceitar': 2,
            'rejeitar': 2,
            
            // Nível 3 - Admin Completo (+ anteriores)
            'promover': 3,
            'rebaixar': 3,
            'exilar': 3
        };
        
        const requiredLevel = commandLevels[commandName] || 999;
        const hasAccess = userLevel >= requiredLevel;
        
        // Retornar resultado detalhado
        return { 
            hasPermission: hasAccess,
            userLevel: userLevel,
            requiredLevel: requiredLevel,
            permissionLevel: this.getLevelName(userLevel),
            commandLevel: this.getLevelName(requiredLevel)
        };
    }
    
    // Obter nome do nível de permissão
    getLevelName(level) {
        const levelNames = {
            0: 'public',
            1: 'info_viewer', 
            2: 'exile_accept',
            3: 'full_admin'
        };
        return levelNames[level] || 'unknown';
    }

    // Obter mensagem de erro baseada no nível necessário
    getPermissionErrorMessage(permissionResult) {
        const requiredLevel = permissionResult.requiredLevel;
        
        switch (requiredLevel) {
            case 1:
                return "❌ Você precisa ser um **Praça** ou superior para usar este comando.";
            case 2:
                return "❌ Você precisa ser um **Graduado** ou superior para usar este comando.";
            case 3:
                return "❌ Você precisa ser um **Oficial** para usar este comando.";
            default:
                return messages.errors.no_permission;
        }
    }

    // Buscar usuário do Roblox
    async findRobloxUser(username) {
        try {
            const userId = await noblox.getIdFromUsername(username);
            if (!userId) return null;
            
            const userInfo = await noblox.getPlayerInfo(userId);
            return { ...userInfo, userId };
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            return null;
        }
    }

    // Verificar membro no grupo
    async getUserInGroup(userId) {
        try {
            const rank = await noblox.getRankInGroup(CONFIG.GROUP_ID, userId);
            if (rank === 0) return null;
            
            const role = await noblox.getRole(CONFIG.GROUP_ID, userId);
            return { rank, role: role.name };
        } catch (error) {
            console.error('Erro ao verificar membro:', error);
            return null;
        }
    }

    // Formatar mensagem com placeholders
    formatMessage(template, data) {
        let message = template;
        Object.keys(data).forEach(key => {
            message = message.replace(`{${key}}`, data[key]);
        });
        return message;
    }
}

// Inicializar bot
client.on('ready', async () => {
    console.log(`🤖 ${client.user.tag} está online!`);
    const bot = new RobloxGroupBot();
    global.botInstance = bot;
    await bot.initialize();
    await bot.setupSlashCommands();
});

// Lidar com comandos slash
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const bot = global.botInstance;
    const commandData = commands.commands.find(cmd => cmd.name === interaction.commandName);
    
    if (!commandData) return;

    // Verificar permissões para comandos administrativos
    if (commandData.adminOnly) {
        const permissionResult = bot.hasPermission(interaction, interaction.commandName);
        
        if (!permissionResult.hasPermission) {
            const errorMessage = bot.getPermissionErrorMessage(permissionResult);
            await interaction.reply({
                content: errorMessage,
                ephemeral: true
            });
            return;
        }
    }

    try {
        // Processar comandos
        switch (interaction.commandName) {
            case 'status':
                await handleStatusCommand(interaction);
                break;
            case 'members':
                await handleMembersCommand(interaction);
                break;
            case 'cargos':
                await handleRolesCommand(interaction);
                break;
            case 'info':
                await handleInfoCommand(interaction, bot);
                break;
            case 'promover':
                await handlePromoteCommand(interaction, bot);
                break;
            case 'rebaixar':
                await handleDemoteCommand(interaction, bot);
                break;
            case 'exilar':
                await handleExileCommand(interaction, bot);
                break;
            case 'aceitar':
                await handleAcceptCommand(interaction, bot);
                break;
            case 'rejeitar':
                await handleRejectCommand(interaction, bot);
                break;
        }
    } catch (error) {
        console.error(`Erro no comando ${interaction.commandName}:`, error);
        
        const errorMessage = error.message.includes('API') 
            ? messages.errors.roblox_api_error 
            : messages.errors.command_execution_error;
            
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(errorMessage);
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
});

// Funções dos comandos
async function handleStatusCommand(interaction) {
    const groupInfo = await noblox.getGroup(CONFIG.GROUP_ID);
    const embed = new Discord.EmbedBuilder()
        .setTitle(messages.info.group_status_title.replace('{groupName}', groupInfo.name))
        .setColor(messages.embeds.colors.info)
        .addFields([
            { name: 'Membros', value: `${groupInfo.memberCount}`, inline: true },
            { name: 'Proprietário', value: groupInfo.owner.username, inline: true },
            { name: 'Status', value: messages.info.monitoring_status, inline: true }
        ]);
    
    await interaction.reply({ embeds: [embed] });
}

async function handleMembersCommand(interaction) {
    const groupInfo = await noblox.getGroup(CONFIG.GROUP_ID);
    const message = messages.info.member_count
        .replace('{groupName}', groupInfo.name)
        .replace('{count}', groupInfo.memberCount);
    
    await interaction.reply(message);
}

async function handleRolesCommand(interaction) {
    const roles = await noblox.getRoles(CONFIG.GROUP_ID);
    const roleList = roles
        .sort((a, b) => b.rank - a.rank)
        .map(role => `**${role.rank}** - ${role.name}`)
        .join('\n');

    const embed = new Discord.EmbedBuilder()
        .setTitle(messages.info.roles_title)
        .setDescription(roleList)
        .setColor(messages.embeds.colors.info)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleInfoCommand(interaction, bot) {
    const username = interaction.options.getString('usuario');
    await interaction.deferReply();
    
    const userInfo = await bot.findRobloxUser(username);
    if (!userInfo) {
        await interaction.editReply(messages.errors.user_not_found);
        return;
    }

    const groupInfo = await bot.getUserInGroup(userInfo.userId);
    const headshotUrl = await getHeadshotUrl(userInfo.userId);
    const embed = new Discord.EmbedBuilder()
        .setTitle(messages.info.user_info_title.replace('{username}', userInfo.username))
        .setThumbnail(headshotUrl || 'https://st.depositphotos.com/2074779/2629/i/950/depositphotos_26292095-stock-photo-question-mark.jpg')
        .setColor(messages.embeds.colors.info)
        .addFields([
            { name: 'ID', value: `${userInfo.userId}`, inline: true },
            { name: messages.info.created_date, value: new Date(userInfo.joinDate).toLocaleDateString('pt-BR'), inline: true },
            { 
                name: 'Status no Grupo', 
                value: groupInfo ? 
                    messages.info.member_status.replace('{rank}', groupInfo.rank).replace('{role}', groupInfo.role) : 
                    messages.info.not_member_status, 
                inline: true 
            }
        ])
        .setTimestamp();

    if (userInfo.blurb) {
        embed.addFields([{ name: messages.info.biography, value: userInfo.blurb.substring(0, 200) }]);
    }

    await interaction.editReply({ embeds: [embed] });
}

async function handlePromoteCommand(interaction, bot) {
    const username = interaction.options.getString('usuario');
    const newRank = interaction.options.getInteger('cargo');
    
    await interaction.deferReply();
    
    const userInfo = await bot.findRobloxUser(username);
    if (!userInfo) {
        await interaction.editReply(messages.errors.user_not_found);
        return;
    }

    const groupInfo = await bot.getUserInGroup(userInfo.userId);
    if (!groupInfo) {
        await interaction.editReply(messages.errors.not_group_member);
        return;
    }

    if (newRank <= groupInfo.rank) {
        await interaction.editReply(messages.errors.invalid_rank_promotion);
        return;
    }

    await noblox.setRank(CONFIG.GROUP_ID, userInfo.userId, newRank);
    
    const embed = new Discord.EmbedBuilder()
        .setTitle(messages.audit_log.promotion_title)
        .setColor(messages.embeds.colors.success)
        .addFields([
            { name: messages.audit_log.user_field, value: userInfo.username, inline: true },
            { name: messages.audit_log.new_rank, value: `${newRank}`, inline: true },
            { name: messages.audit_log.promoted_by, value: interaction.user.tag, inline: true }
        ])
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function handleDemoteCommand(interaction, bot) {
    const username = interaction.options.getString('usuario');
    const newRank = interaction.options.getInteger('cargo');
    
    await interaction.deferReply();
    
    const userInfo = await bot.findRobloxUser(username);
    if (!userInfo) {
        await interaction.editReply(messages.errors.user_not_found);
        return;
    }

    const groupInfo = await bot.getUserInGroup(userInfo.userId);
    if (!groupInfo) {
        await interaction.editReply(messages.errors.not_group_member);
        return;
    }

    if (newRank >= groupInfo.rank) {
        await interaction.editReply(messages.errors.invalid_rank_demotion);
        return;
    }

    await noblox.setRank(CONFIG.GROUP_ID, userInfo.userId, newRank);
    
    const embed = new Discord.EmbedBuilder()
        .setTitle(messages.audit_log.demotion_title)
        .setColor(messages.embeds.colors.warning)
        .addFields([
            { name: messages.audit_log.user_field, value: userInfo.username, inline: true },
            { name: messages.audit_log.new_rank, value: `${newRank}`, inline: true },
            { name: messages.audit_log.demoted_by, value: interaction.user.tag, inline: true }
        ])
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function handleExileCommand(interaction, bot) {
    const username = interaction.options.getString('usuario');
    const motivo = interaction.options.getString('motivo') || 'Não especificado';
    
    await interaction.deferReply();
    
    const userInfo = await bot.findRobloxUser(username);
    if (!userInfo) {
        await interaction.editReply(messages.errors.user_not_found);
        return;
    }

    const groupInfo = await bot.getUserInGroup(userInfo.userId);
    if (!groupInfo) {
        await interaction.editReply(messages.errors.not_group_member);
        return;
    }

    await noblox.exile(CONFIG.GROUP_ID, userInfo.userId);
    
    const embed = new Discord.EmbedBuilder()
        .setTitle(messages.audit_log.exile_title)
        .setColor(messages.embeds.colors.error)
        .addFields([
            { name: messages.audit_log.user_field, value: userInfo.username, inline: true },
            { name: messages.audit_log.reason, value: motivo, inline: true },
            { name: messages.audit_log.exiled_by, value: interaction.user.tag, inline: true }
        ])
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    
    // Log no canal principal
    const logChannel = client.channels.cache.get(CONFIG.LOG_CHANNEL_ID || CONFIG.CHANNEL_ID);
    if (logChannel) {
        await logChannel.send({ embeds: [embed] });
    }
}

async function handleAcceptCommand(interaction, bot) {
    const username = interaction.options.getString('usuario');
    
    await interaction.deferReply();
    
    const userInfo = await bot.findRobloxUser(username);
    if (!userInfo) {
        await interaction.editReply(messages.errors.user_not_found);
        return;
    }

    // Verificar se já é membro
    const groupInfo = await bot.getUserInGroup(userInfo.userId);
    if (groupInfo) {
        await interaction.editReply(messages.errors.already_member);
        return;
    }

    try {
        // Aceitar pedido de entrada
        await noblox.handleJoinRequest(CONFIG.GROUP_ID, userInfo.userId, true);
        
        const successMessage = messages.success.accept_request.replace('{username}', userInfo.username);
        await interaction.editReply(successMessage);
        
    } catch (error) {
        if (error.message.includes('not found')) {
            await interaction.editReply(messages.errors.no_join_request);
        } else {
            throw error;
        }
    }
}

async function handleRejectCommand(interaction, bot) {
    const username = interaction.options.getString('usuario');
    const motivo = interaction.options.getString('motivo') || 'Não especificado';
    
    await interaction.deferReply();
    
    const userInfo = await bot.findRobloxUser(username);
    if (!userInfo) {
        await interaction.editReply(messages.errors.user_not_found);
        return;
    }

    try {
        // Rejeitar pedido de entrada
        await noblox.handleJoinRequest(CONFIG.GROUP_ID, userInfo.userId, false);
        
        const successMessage = messages.success.reject_request.replace('{username}', userInfo.username);
        await interaction.editReply(successMessage);
        
        // Log da rejeição
        const logChannel = client.channels.cache.get(CONFIG.LOG_CHANNEL_ID || CONFIG.CHANNEL_ID);
        if (logChannel) {
            const embed = new Discord.EmbedBuilder()
                .setTitle('❌ Pedido Rejeitado')
                .setColor(messages.embeds.colors.error)
                .addFields([
                    { name: 'Usuário', value: userInfo.username, inline: true },
                    { name: 'Motivo', value: motivo, inline: true },
                    { name: 'Rejeitado por', value: interaction.user.tag, inline: true }
                ])
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        }
        
    } catch (error) {
        if (error.message.includes('not found')) {
            await interaction.editReply(messages.errors.no_join_request);
        } else {
            throw error;
        }
    }
}

// Tratamento de erros
process.on('unhandledRejection', (error) => {
    console.error('❌ Erro não tratado:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Exceção não capturada:', error);
    process.exit(1);
});

client.on('error', (error) => {
    console.error('❌ Erro do Discord:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Encerrando bot...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Encerrando bot...');
    client.destroy();
    process.exit(0);
});