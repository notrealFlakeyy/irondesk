'use client';

export function csvEscape(value: string | number | null | undefined) {
  const stringValue = value == null ? '' : String(value);
  if (!/[",\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const serializedRows = rows.map((row) => row.map(csvEscape).join(','));
  return [headers.map(csvEscape).join(','), ...serializedRows].join('\n');
}

export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function openPrintWindow(title: string, body: string) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720');
  if (!printWindow) {
    throw new Error('Pop-up blocked. Allow pop-ups to print from IronDesk.');
  }

  printWindow.document.write(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { background: #111; color: #e8e6e0; font-family: Arial, sans-serif; margin: 0; padding: 24px; }
      h1, h2, h3 { margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.08em; }
      h1 { color: #e8a020; font-size: 26px; }
      h2 { font-size: 16px; margin-top: 24px; }
      p { margin: 0 0 8px; line-height: 1.5; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #363632; padding: 8px 10px; text-align: left; font-size: 12px; }
      th { background: #1f1f1d; text-transform: uppercase; letter-spacing: 0.12em; font-size: 10px; color: #a8a69f; }
      .mono { font-family: monospace; }
      .meta { color: #a8a69f; font-size: 12px; }
      .accent { color: #e8a020; }
      .section { margin-top: 24px; }
      @media print {
        body { background: white; color: black; padding: 18px; }
        th { background: #f1f1f1; color: #333; }
        .accent { color: #9a6100; }
      }
    </style>
  </head>
  <body>${body}</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
