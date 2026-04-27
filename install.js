const fs = require('fs');
const path = require('path');

// Caminho do pacote instalado
const packagePath = __dirname;
const utilsPath = path.join(packagePath, 'src', 'utils');

// Encontrar a raiz do projeto (subir de node_modules até encontrar package.json do projeto)
function findProjectRoot(startPath) {
  // Se estamos em node_modules, subir até a raiz do projeto
  if (startPath.includes('node_modules')) {
    // Encontrar o índice de node_modules e pegar o diretório pai
    const nodeModulesIndex = startPath.indexOf('node_modules');
    const candidateRoot = startPath.substring(0, nodeModulesIndex);

    // Normalizar o caminho (remover barra final se houver)
    const normalizedRoot = candidateRoot.replace(/[\/\\]$/, '');

    // Verificar se existe package.json nesse diretório (raiz do projeto)
    const packageJsonPath = path.join(normalizedRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      // Verificar se não é o package.json do próprio pacote deploy-webapp
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.name !== 'deploy-webapp') {
          return normalizedRoot;
        }
      } catch (e) {
        // Se não conseguir ler, assumir que é a raiz
        return normalizedRoot;
      }
    }
    // Se não encontrou package.json, ainda assim usar o diretório acima de node_modules
    return normalizedRoot;
  }

  // Fallback: usar process.cwd() (diretório onde o comando foi executado)
  // Isso funciona porque quando yarn/npm instala, o cwd é a raiz do projeto
  return process.cwd();
}

const projectRoot = findProjectRoot(packagePath);

// Arquivos a serem copiados (com seus caminhos de origem)
const filesToCopy = [
  { source: path.join(utilsPath, 'ids.csv'), dest: 'ids.csv' },
  { source: path.join(utilsPath, 'updateWorkflow.json'), dest: 'updateWorkflow.json' },
  { source: path.join(packagePath, 'README.md'), dest: 'README.md' },
  { source: path.join(utilsPath, 'history_created.txt'), dest: 'history_created.txt' },
  { source: path.join(utilsPath, 'history_updated.txt'), dest: 'history_updated.txt' },
];

// Conteúdo do arquivo migrate.js a ser criado
const migrateJsContent = "require('dotenv').config();\n" +
  "const { runMigration } = require('deploy-webapp');\n\n" +
  "console.log('🚀 Iniciando deploy...');\n\n" +
  "runMigration()\n" +
  "  .then(() => {\n" +
  "    console.log('\\n✅ Deploy concluído com sucesso!');\n" +
  "    process.exit(0);\n" +
  "  })\n" +
  "  .catch((error) => {\n" +
  "    console.error('\\n❌ Erro no deploy:', error);\n" +
  "    process.exit(1);\n" +
  "  });\n";

// Conteúdo do arquivo .env template a ser criado
const envTemplateContent = `# Configurações Gerais
CLIENT=seu_client_id
SERVICE_KEY=sua_service_key

# Ambiente QA
CLIENT_ID_QA=client_id_qa
EMAIL_LOGIN_QA=email@qa.com
PASSWORD_LOGIN_QA=senha_qa
URL_QA=https://url-qa.com

# Ambiente PROD
CLIENT_ID_PROD=client_id_prod
EMAIL_LOGIN_PROD=email@prod.com
PASSWORD_LOGIN_PROD=senha_prod
URL_PROD=https://url-prod.com
`;

// Verificar se estamos em node_modules (instalação do pacote)
const isInstalled = packagePath.includes('node_modules');

if (!isInstalled) {
  // Modo desenvolvimento - não fazer nada
  process.exit(0);
}

console.log('📦 deploy-webapp: Configurando arquivos de configuração...');
console.log(`   📍 Pacote instalado em: ${packagePath}`);
console.log(`   📍 Raiz do projeto: ${projectRoot}`);

// Criar função para copiar arquivo
function copyFileIfNotExists(sourcePath, destFile) {
  const destPath = path.join(projectRoot, destFile);

  // Verificar se o arquivo fonte existe
  if (!fs.existsSync(sourcePath)) {
    console.log(`⚠️  deploy-webapp: Arquivo ${path.basename(sourcePath)} não encontrado no pacote.`);
    return false;
  }

  // Se o arquivo destino já existe, não sobrescrever (protege configurações do usuário)
  if (fs.existsSync(destPath)) {
    console.log(`ℹ️  deploy-webapp: ${destFile} já existe na raiz do projeto, mantendo arquivo existente.`);
    return false;
  }

  try {
    // Copiar arquivo
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ deploy-webapp: ${destFile} criado com sucesso!`);
    return true;
  } catch (error) {
    console.error(`❌ deploy-webapp: Erro ao copiar ${destFile}:`, error.message);
    return false;
  }
}

// Copiar arquivos
let copiedCount = 0;
filesToCopy.forEach(({ source, dest }) => {
  if (copyFileIfNotExists(source, dest)) {
    copiedCount++;
  }
});

// Criar arquivo migrate.js se não existir
const migrateJsPath = path.join(projectRoot, 'migrate.js');
if (!fs.existsSync(migrateJsPath)) {
  try {
    fs.writeFileSync(migrateJsPath, migrateJsContent, 'utf8');
    console.log('✅ deploy-webapp: migrate.js criado com sucesso!');
    copiedCount++;
  } catch (error) {
    console.error('❌ deploy-webapp: Erro ao criar migrate.js:', error.message);
  }
} else {
  console.log('ℹ️  deploy-webapp: migrate.js já existe, mantendo arquivo existente.');
}

// Criar arquivo .env se não existir
const envPath = path.join(projectRoot, '.env');
if (!fs.existsSync(envPath)) {
  try {
    fs.writeFileSync(envPath, envTemplateContent, 'utf8');
    console.log('✅ deploy-webapp: .env criado com sucesso!');
    copiedCount++;
  } catch (error) {
    console.error('❌ deploy-webapp: Erro ao criar .env:', error.message);
  }
} else {
  console.log('ℹ️  deploy-webapp: .env já existe, mantendo arquivo existente.');
}

// Atualizar package.json com scripts se necessário
const packageJsonPath = path.join(projectRoot, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    let packageJson = {};
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');

    // Tentar parsear o JSON, se falhar criar um novo objeto
    try {
      packageJson = JSON.parse(packageJsonContent);
    } catch (parseError) {
      console.log('⚠️  deploy-webapp: package.json inválido, criando novo...');
      packageJson = {};
    }

    let updated = false;

    // Garantir que name e version existam
    if (!packageJson.name) {
      packageJson.name = path.basename(projectRoot);
      updated = true;
    }
    if (!packageJson.version) {
      packageJson.version = '1.0.0';
      updated = true;
    }

    // Criar scripts se não existir
    if (!packageJson.scripts) {
      packageJson.scripts = {};
      updated = true;
    }

    // Adicionar script start se não existir ou se for diferente
    if (!packageJson.scripts.start || packageJson.scripts.start !== 'node migrate.js') {
      packageJson.scripts.start = 'node migrate.js';
      updated = true;
    }

    // Adicionar script migrate se não existir ou se for diferente
    if (!packageJson.scripts.migrate || packageJson.scripts.migrate !== 'node migrate.js') {
      packageJson.scripts.migrate = 'node migrate.js';
      updated = true;
    }

    // Garantir que dependencies existe
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }

    // Salvar sempre (mesmo que não tenha atualizado, garante formatação correta)
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    if (updated) {
      console.log('✅ deploy-webapp: Scripts adicionados/atualizados no package.json!');
      copiedCount++;
    } else {
      console.log('ℹ️  deploy-webapp: Scripts já existem no package.json.');
    }
  } catch (error) {
    console.error('❌ deploy-webapp: Erro ao atualizar package.json:', error.message);
    console.error('   Stack:', error.stack);
  }
} else {
  // Se não existe package.json, criar um novo
  try {
    const newPackageJson = {
      name: path.basename(projectRoot),
      version: '1.0.0',
      scripts: {
        start: 'node migrate.js',
        migrate: 'node migrate.js'
      },
      dependencies: {
        'deploy-webapp': require(path.join(packagePath, 'package.json')).version || 'latest'
      }
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(newPackageJson, null, 2) + '\n', 'utf8');
    console.log('✅ deploy-webapp: package.json criado com scripts!');
    copiedCount++;
  } catch (error) {
    console.error('❌ deploy-webapp: Erro ao criar package.json:', error.message);
  }
}

if (copiedCount > 0) {
  console.log(`\n✨ deploy-webapp: ${copiedCount} arquivo(s) criado(s) automaticamente na raiz do projeto!`);
  console.log(`\n📝 Arquivos criados em: ${projectRoot}`);
  console.log('\n📋 Próximos passos:');
  console.log('   1. 🔐 Edite .env com suas credenciais (substitua os valores de exemplo)');
  console.log('   2. ✏️  Edite ids.csv com os IDs dos workflows que deseja migrar');
  console.log('   3. ✏️  Edite updateWorkflow.json com suas configurações específicas');
  console.log('   4. 🚀 Execute: yarn start ou npm start\n');
  console.log('💡 Dica: Tudo está configurado! Basta preencher os valores e executar yarn start!\n');
} else {
  console.log('\nℹ️  deploy-webapp: Todos os arquivos já existem na raiz do projeto.');
  console.log('   Execute: yarn start ou npm start para iniciar a migração.\n');
}

