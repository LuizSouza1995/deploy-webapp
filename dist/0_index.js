"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigration = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const _0_1_migrator_1 = require("./0.1_migrator");
Object.defineProperty(exports, "runMigration", { enumerable: true, get: function () { return _0_1_migrator_1.runMigration; } });
if (require.main === module) {
    dotenv_1.default.config();
    (0, _0_1_migrator_1.runMigration)().catch(error => {
        console.error("Migration failed:", error);
        process.exit(1);
    });
}
