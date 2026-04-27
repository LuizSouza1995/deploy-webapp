"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceStringsRecursivelyWithoutUrl = exports.replaceStringsRecursively = void 0;
const replaceStringsRecursively = (node, replacements) => {
    if (typeof node === "string") {
        let value = node;
        for (const { from, to } of replacements) {
            value = value.split(from).join(to);
        }
        return value;
    }
    if (Array.isArray(node)) {
        return node.map((item) => (0, exports.replaceStringsRecursively)(item, replacements));
    }
    if (node && typeof node === "object") {
        const obj = node;
        for (const key of Object.keys(obj)) {
            obj[key] = (0, exports.replaceStringsRecursively)(obj[key], replacements);
        }
        return obj;
    }
    return node;
};
exports.replaceStringsRecursively = replaceStringsRecursively;
const replaceStringsRecursivelyWithoutUrl = (node, replacements, urlQA) => {
    // Filtrar regras removendo a regra de URL (primeira regra)
    const filteredReplacements = urlQA
        ? replacements.filter((rule) => rule.from !== urlQA)
        : replacements.slice(1); // Se urlQA não for fornecido, remove apenas a primeira regra
    if (typeof node === "string") {
        let value = node;
        for (const { from, to } of filteredReplacements) {
            value = value.split(from).join(to);
        }
        return value;
    }
    if (Array.isArray(node)) {
        return node.map((item) => (0, exports.replaceStringsRecursivelyWithoutUrl)(item, replacements, urlQA));
    }
    if (node && typeof node === "object") {
        const obj = node;
        for (const key of Object.keys(obj)) {
            obj[key] = (0, exports.replaceStringsRecursivelyWithoutUrl)(obj[key], replacements, urlQA);
        }
        return obj;
    }
    return node;
};
exports.replaceStringsRecursivelyWithoutUrl = replaceStringsRecursivelyWithoutUrl;
