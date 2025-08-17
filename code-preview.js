const element = document.getElementById("code-example");
let raw = element.textContent;

raw = raw.replace(/\bnew\b(?![^<]*>)/g, '<span class="kw">new</span>');
raw = raw.replace(/\b\d+(\.\d+)?\b(?![^<]*>)/g, '<span class="num">$&</span>');
raw = raw.replace(
  /("[^"]*"|'[^']*')(?![^<]*>)/g,
  '<span class="str">$1</span>',
);
raw = raw.replace(
  /\b([A-Z_]{2,})\b(?![^<]*>)/g,
  '<span class="const">$1</span>',
);
raw = raw.replace(
  /\b([A-Z][A-Za-z0-9_]+)\b(?![^<]*>)/g,
  '<span class="fn">$1</span>',
);

element.innerHTML = raw;
