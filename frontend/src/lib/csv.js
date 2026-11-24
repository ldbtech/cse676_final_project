// Minimal RFC-4180-ish CSV parser: commas, quoted fields, escaped quotes.
// Pure module with no DOM use, so node tests can import it directly.
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      pushField();
    } else if (c === '\n') {
      pushField();
      pushRow();
    } else if (c === '\r') {
      // skip, handled with \n
    } else {
      field += c;
    }
  }
  if (quoted) throw new Error('unterminated quoted field');
  pushField();
  pushRow();

  const nonEmpty = rows.filter((r) => r.some((cell) => cell.trim() !== ''));
  if (nonEmpty.length === 0) return { columns: [], rows: [] };
  const [header, ...rest] = nonEmpty;
  return { columns: header.map((c) => c.trim()), rows: rest };
}
