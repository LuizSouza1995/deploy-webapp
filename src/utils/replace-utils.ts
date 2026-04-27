export interface StringReplacement {
  from: string;
  to: string;
}

export const replaceStringsRecursively = (node: any, replacements: StringReplacement[]): any => {
  if (typeof node === "string") {
    let value = node;
    for (const { from, to } of replacements) {
      value = value.split(from).join(to);
    }
    return value;
  }
  if (Array.isArray(node)) {
    return node.map((item) => replaceStringsRecursively(item, replacements));
  }
  if (node && typeof node === "object") {
    const obj: any = node;
    for (const key of Object.keys(obj)) {
      obj[key] = replaceStringsRecursively(obj[key], replacements);
    }
    return obj;
  }
  return node;
};

export const replaceStringsRecursivelyWithoutUrl = (node: any, replacements: StringReplacement[], urlQA?: string): any => {
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
    return node.map((item) => replaceStringsRecursivelyWithoutUrl(item, replacements, urlQA));
  }
  if (node && typeof node === "object") {
    const obj: any = node;
    for (const key of Object.keys(obj)) {
      obj[key] = replaceStringsRecursivelyWithoutUrl(obj[key], replacements, urlQA);
    }
    return obj;
  }
  return node;
};