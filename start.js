const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando Roblox Discord Bot...\n');

// Verificar se o arquivo .env existe
if (!fs.existsSync('.env')) {
    console.error('❌ Arquivo .env não encontrado!');
    console.log('📝 Copie o arquivo .env.example para .env e configure suas credenciais:');
    console.log('   cp .env.example .env');
    console.log('   nano .env\n');
    process.exit(1);
}

// Verificar se as pastas necessárias existem
const requiredDirs = ['config'];
requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        console.log(`📁 Criando pasta: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Verificar se os arquivos de configuração existem
const configFiles = ['config/commands.json', 'config/messages.json'];
configFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        console.error(`❌ Arquivo de configuração não encontrado: ${file}`);
        console.log('📥 Certifique-se de que todos os arquivos foram baixados do repositório.\n');
        process.exit(1);
    }
});

console.log('✅ Verificações iniciais concluídas!');
console.log('🤖 Carregando bot principal...\n');

// Iniciar o bot principal
require('./index.js');