"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cor = exports.replacementRules = exports.ENV_PROD = exports.ENV_QA = exports.NEW_MOCK = exports.OLD_MOCK = exports.NEW_ENV = exports.OLD_ENV = exports.urlPROD = exports.passwordLoginPROD = exports.emailLoginPROD = exports.clientIdPROD = exports.urlQA = exports.passwordLoginQA = exports.emailLoginQA = exports.clientIdQA = exports.serviceKey = exports.client = void 0;
exports.clearHistoryUpdated = clearHistoryUpdated;
exports.clearHistoryCreated = clearHistoryCreated;
exports.addIdUpdated = addIdUpdated;
exports.addIdsCreated = addIdsCreated;
exports.checkIdUpdated = checkIdUpdated;
exports.checkIdCreated = checkIdCreated;
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Carregar .env da raiz do projeto
const projectRoot = process.cwd();
const rootEnv = path_1.default.resolve(projectRoot, ".env");
if (fs_1.default.existsSync(rootEnv)) {
    dotenv_1.default.config({ path: rootEnv });
}
else {
    dotenv_1.default.config(); // Fallback para comportamento padrão
}
// Determinar o diretório de trabalho correto
// Se estiver em node_modules, usar process.cwd() (raiz do projeto)
// Caso contrário, usar __dirname (modo desenvolvimento)
function getWorkingDirectory() {
    if (__dirname.includes('node_modules')) {
        return process.cwd();
    }
    return __dirname;
}
const logsDirectory = getWorkingDirectory();
exports.client = process.env.CLIENT;
exports.serviceKey = process.env.SERVICE_KEY;
exports.clientIdQA = process.env.CLIENT_ID_QA;
exports.emailLoginQA = process.env.EMAIL_LOGIN_QA;
exports.passwordLoginQA = process.env.PASSWORD_LOGIN_QA;
exports.urlQA = process.env.URL_QA;
exports.clientIdPROD = process.env.CLIENT_ID_PROD;
exports.emailLoginPROD = process.env.EMAIL_LOGIN_PROD;
exports.passwordLoginPROD = process.env.PASSWORD_LOGIN_PROD;
exports.urlPROD = process.env.URL_PROD;
if (!exports.client || !exports.clientIdQA || !exports.clientIdPROD || !exports.serviceKey || !exports.emailLoginQA || !exports.passwordLoginQA || !exports.emailLoginPROD || !exports.passwordLoginPROD || !exports.urlQA || !exports.urlPROD) {
    throw new Error("Variáveis de ambiente não definidas");
}
exports.OLD_ENV = `configEnv["qa"]`;
exports.NEW_ENV = `configEnv["prod"]`;
exports.OLD_MOCK = `let mock = true`;
exports.NEW_MOCK = `let mock = false`;
exports.ENV_QA = `env = 'hml'`;
exports.ENV_PROD = `env = 'prod'`;
/////////////////////// REVERSÃO DE AMBIENTES
// export const OLD_ENV = `configEnv["prod"]`;
// export const NEW_ENV = `configEnv["qa"]`;
// export const OLD_MOCK = `let mock = false`;
// export const NEW_MOCK = `let mock = true`;
// export const ENV_QA = `env = 'prod'`;
// export const ENV_PROD = `env = 'hml'`;
exports.replacementRules = [
    { from: exports.urlQA, to: exports.urlPROD },
    { from: exports.clientIdQA, to: exports.clientIdPROD },
    { from: exports.OLD_ENV, to: exports.NEW_ENV },
    { from: exports.OLD_MOCK, to: exports.NEW_MOCK },
    { from: exports.ENV_QA, to: exports.ENV_PROD },
];
function clearHistoryUpdated() {
    const historyPath = path_1.default.resolve(logsDirectory, "history_updated.txt");
    if (fs_1.default.existsSync(historyPath)) {
        fs_1.default.writeFileSync(historyPath, "");
    }
}
function clearHistoryCreated() {
    const historyPath = path_1.default.resolve(logsDirectory, "history_created.txt");
    if (fs_1.default.existsSync(historyPath)) {
        fs_1.default.writeFileSync(historyPath, "");
    }
}
function addIdUpdated(id, type) {
    const historyPath = path_1.default.resolve(logsDirectory, "history_updated.txt");
    fs_1.default.appendFileSync(historyPath, ` ${type}: ${id}\n`);
}
function historyEntryKey(type, id) {
    return `${type}:${id}`;
}
function addIdsCreated(id, type) {
    const historyPath = path_1.default.resolve(logsDirectory, "history_created.txt");
    fs_1.default.appendFileSync(historyPath, ` ${type}: ${id}\n`);
}
function checkIdUpdated(id, type) {
    const historyPath = path_1.default.resolve(logsDirectory, "history_updated.txt");
    if (!fs_1.default.existsSync(historyPath)) {
        return false;
    }
    const history = fs_1.default.readFileSync(historyPath, "utf8");
    const lines = history.split("\n");
    const typedKey = type ? historyEntryKey(type, id) : null;
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine)
            continue;
        const separatorIndex = trimmedLine.indexOf(":");
        if (separatorIndex === -1)
            continue;
        const lineType = trimmedLine.slice(0, separatorIndex).trim();
        const lineId = trimmedLine.slice(separatorIndex + 1).trim();
        if (type) {
            if (historyEntryKey(lineType, lineId) === typedKey) {
                return true;
            }
        }
        else if (lineId === id) {
            return true;
        }
    }
    return false;
}
function checkIdCreated(id) {
    const historyPath = path_1.default.resolve(logsDirectory, "history_created.txt");
    if (!fs_1.default.existsSync(historyPath)) {
        return false;
    }
    const history = fs_1.default.readFileSync(historyPath, "utf8");
    const lines = history.split("\n");
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine)
            continue;
        const parts = trimmedLine.split(":");
        if (parts.length >= 2) {
            const lineId = parts[parts.length - 1].trim();
            if (lineId === id) {
                return true;
            }
        }
    }
    return false;
}
exports.cor = {
    Red: "\x1b[31m",
    Green: "\x1b[32m",
    Yellow: "\x1b[33m",
    Blue: "\x1b[34m",
    Cyan: "\x1b[36m",
    Magenta: "\x1b[35m",
    White: "\x1b[37m",
    Reset: "\x1b[0m",
    Bold: "\x1b[1m",
    Purple: "\x1b[35;1m",
    Orange: "\x1b[38;5;208m",
};
