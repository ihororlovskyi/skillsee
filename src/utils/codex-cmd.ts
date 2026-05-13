const READ_LIKE = new Set(['cat', 'sed', 'head', 'tail', 'bat', 'batcat', 'less', 'more']);

const SKILL_PATH_RE = /[^\s'"`]*\/([^\s'"`/]+)\/SKILL\.md/g;

function stripHeredocs(s: string): string {
  return s.replace(/<<-?\s*['"]?(\w+)['"]?[\s\S]*?\n[\t ]*\1\s*(?:\n|$)/g, '');
}

function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let buf = '';
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  while (i < s.length) {
    const c = s[i];
    const next = s[i + 1];
    if (!inDouble && !inBacktick && c === "'") {
      inSingle = !inSingle;
      buf += c;
      i++;
      continue;
    }
    if (!inSingle && !inBacktick && c === '"') {
      inDouble = !inDouble;
      buf += c;
      i++;
      continue;
    }
    if (!inSingle && !inDouble && c === '`') {
      inBacktick = !inBacktick;
      buf += c;
      i++;
      continue;
    }
    if (!inSingle && !inDouble && !inBacktick) {
      if ((c === '&' && next === '&') || (c === '|' && next === '|')) {
        out.push(buf);
        buf = '';
        i += 2;
        continue;
      }
      if (c === ';' || c === '|') {
        out.push(buf);
        buf = '';
        i++;
        continue;
      }
    }
    buf += c;
    i++;
  }
  out.push(buf);
  return out;
}

function hasRedirect(segment: string): boolean {
  return /(?<![<2])>>?|&>>?/.test(segment);
}

export function extractSkillReadsFromCmd(cmd: string): string[] {
  const stripped = stripHeredocs(cmd);
  const segments = splitTopLevel(stripped);
  const found = new Set<string>();

  for (const seg of segments) {
    if (hasRedirect(seg)) continue;
    const trimmed = seg.trimStart();
    const firstTokenMatch = trimmed.match(/^(\S+)/);
    if (!firstTokenMatch) continue;
    const firstToken = firstTokenMatch[1] ?? '';
    if (!READ_LIKE.has(firstToken)) continue;
    for (const m of seg.matchAll(SKILL_PATH_RE)) {
      if (m[1]) found.add(m[1]);
    }
  }
  return [...found];
}
