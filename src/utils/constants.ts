import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Carregar .env da raiz do projeto
const projectRoot = process.cwd();
const rootEnv = path.resolve(projectRoot, ".env");

if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config(); // Fallback para comportamento padrão
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

export const client = process.env.CLIENT;
export const serviceKey = process.env.SERVICE_KEY;

export const clientIdQA = process.env.CLIENT_ID_QA;
export const emailLoginQA = process.env.EMAIL_LOGIN_QA;
export const passwordLoginQA = process.env.PASSWORD_LOGIN_QA;
export const urlQA = process.env.URL_QA;

export const clientIdPROD = process.env.CLIENT_ID_PROD;
export const emailLoginPROD = process.env.EMAIL_LOGIN_PROD;
export const passwordLoginPROD = process.env.PASSWORD_LOGIN_PROD;
export const urlPROD = process.env.URL_PROD;

if (!client || !clientIdQA || !clientIdPROD || !serviceKey || !emailLoginQA || !passwordLoginQA || !emailLoginPROD || !passwordLoginPROD || !urlQA || !urlPROD) {
  throw new Error("Variáveis de ambiente não definidas");
}

export const OLD_ENV = `configEnv["qa"]`;
export const NEW_ENV = `configEnv["prod"]`;
export const OLD_MOCK = `let mock = true`;
export const NEW_MOCK = `let mock = false`;
export const ENV_QA = `env = 'hml'`;
export const ENV_PROD = `env = 'prod'`;

/////////////////////// REVERSÃO DE AMBIENTES
// export const OLD_ENV = `configEnv["prod"]`;
// export const NEW_ENV = `configEnv["qa"]`;
// export const OLD_MOCK = `let mock = false`;
// export const NEW_MOCK = `let mock = true`;
// export const ENV_QA = `env = 'prod'`;
// export const ENV_PROD = `env = 'hml'`;

export const replacementRules = [
  { from: urlQA, to: urlPROD },
  { from: clientIdQA, to: clientIdPROD },
  { from: OLD_ENV, to: NEW_ENV },
  { from: OLD_MOCK, to: NEW_MOCK },
  { from: ENV_QA, to: ENV_PROD },
];

export function clearHistoryUpdated() {
  const historyPath = path.resolve(logsDirectory, "history_updated.txt");
  if (fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, "");
  }
}

export function clearHistoryCreated() {
  const historyPath = path.resolve(logsDirectory, "history_created.txt");
  if (fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, "");
  }
}

export function addIdUpdated(id: string, type: string) {
  const historyPath = path.resolve(logsDirectory, "history_updated.txt");
  fs.appendFileSync(historyPath, ` ${type}: ${id}\n`);
}

export function addIdsCreated(id: string, type: string) {
  const historyPath = path.resolve(logsDirectory, "history_created.txt");
  fs.appendFileSync(historyPath, ` ${type}: ${id}\n`);
}

export function checkIdUpdated(id: string) {
  const historyPath = path.resolve(logsDirectory, "history_updated.txt");

  if (!fs.existsSync(historyPath)) {
    return false;
  }

  const history = fs.readFileSync(historyPath, "utf8");
  const lines = history.split("\n");

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

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

export function checkIdCreated(id: string) {
  const historyPath = path.resolve(logsDirectory, "history_created.txt");

  if (!fs.existsSync(historyPath)) {
    return false;
  }

  const history = fs.readFileSync(historyPath, "utf8");
  const lines = history.split("\n");

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

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

export const cor = {
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