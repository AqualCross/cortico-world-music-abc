const titleLine = /^T:[^\r\n]*/m;

export function scoreTitle(abc) {
  return (abc.match(titleLine)?.[0].slice(2).trim() ?? '').slice(0, 160);
}

export function withScoreTitle(abc, title) {
  if (titleLine.test(abc)) return abc.replace(titleLine, () => `T:${title}`);
  return abc.replace(/^(X:[^\r\n]*)/m, (_, index) => `${index}\nT:${title}`);
}
