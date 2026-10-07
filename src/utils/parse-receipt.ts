export type ParsedReceipt = {
    amount: number | null;
    merchant: string | null;
    date: string | null; // YYYY-MM-DD
  };
  
  const NUM = /(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
  const LONE_NUMBER = /^\s*(?:₹|rs\.?|inr|\?)?\s*\d[\d,]*(?:\.\d{1,2})?\s*$/i;
  const ID_ROW = /\b(no|id|ref|token|receipt|hosp|phone|mobile|mob|gstin|invoice|order|txn|utr|age|pin|pincode)\b/i;
  const DATE_OR_TIME_ROW = /\d{1,2}[\/\-.:]\d{1,2}/;
  
  const STRONG_TOTAL = /grand\s*total|net\s*(amount|payable)|amount\s*payable|total\s*payable|amount\s*due/i;
  const PLAIN_TOTAL = /\btotal\b/i;
  const NOT_TOTAL = /sub\s*total|total\s*(items?|qty|quantity|tax|gst|discount|saving)/i;
  const WEAK_TOTAL = /amount\s*paid|paid\s*amount|\bpaid\b|\bamount\b/i;
  
  const GENERIC_TITLE =
    /^(cash\s*receipt|receipt|tax\s*invoice|invoice|bill|cash\s*memo|cash\s*bill|welcome|thank\s*you|original|duplicate|customer\s*copy)\b/i;
  
  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  function numbersIn(row: string): number[] {
    const out: number[] = [];
    for (const m of row.matchAll(NUM)) {
      const v = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(v)) out.push(v);
    }
    return out;
  }
  
  function lastNumberOnRow(rows: string[], test: (r: string) => boolean): number | null {
    for (let i = rows.length - 1; i >= 0; i--) {
      if (!test(rows[i])) continue;
      const nums = numbersIn(rows[i]);
      if (nums.length) return nums[nums.length - 1];
    }
    return null;
  }
  
  function findAmount(rows: string[]): number | null {
    const strong = lastNumberOnRow(rows, (r) => STRONG_TOTAL.test(r));
    if (strong !== null) return strong;
  
    const plain = lastNumberOnRow(rows, (r) => PLAIN_TOTAL.test(r) && !NOT_TOTAL.test(r));
    if (plain !== null) return plain;
  
    // UPI style: a lone amount near the top of the screenshot
    for (const row of rows.slice(0, 5)) {
      if (LONE_NUMBER.test(row)) {
        const nums = numbersIn(row);
        if (nums.length) return nums[0];
      }
    }
  
    const weak = lastNumberOnRow(rows, (r) => WEAK_TOTAL.test(r));
    if (weak !== null) return weak;
  
    // last resort: largest number on rows that don't look like IDs, dates or times
    let max: number | null = null;
    for (const row of rows) {
      if (ID_ROW.test(row) || DATE_OR_TIME_ROW.test(row)) continue;
      for (const n of numbersIn(row)) if (max === null || n > max) max = n;
    }
    return max;
  }
  
  function toIso(y: number, m: number, d: number): string | null {
    if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  
  function monthFromName(name: string): number {
    return MONTHS.indexOf(name.slice(0, 3).toLowerCase()) + 1;
  }
  
  function findDate(rows: string[]): string | null {
    const text = rows.join('\n');
  
    // 08/08/2026, 8-8-26, 08.08.2026 (day first, as on Indian receipts)
    let m = text.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4}|\d{2})\b/);
    if (m) {
      const y = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
      const iso = toIso(y, parseInt(m[2], 10), parseInt(m[1], 10));
      if (iso) return iso;
    }
  
    // 2 October 2026, 2nd Oct 2026
    m = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?[\s,-]+([A-Za-z]{3,9})[\s,.-]+(\d{4})\b/);
    if (m) {
      const mon = monthFromName(m[2]);
      if (mon) {
        const iso = toIso(parseInt(m[3], 10), mon, parseInt(m[1], 10));
        if (iso) return iso;
      }
    }
  
    // Oct 2, 2026
    m = text.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/);
    if (m) {
      const mon = monthFromName(m[1]);
      if (mon) {
        const iso = toIso(parseInt(m[3], 10), mon, parseInt(m[2], 10));
        if (iso) return iso;
      }
    }
  
    return null;
  }
  
  function cleanName(s: string): string {
    let out = s.replace(/^[\s:.\-]+|[\s:.\-]+$/g, '').replace(/\s+/g, ' ');
    if (out === out.toUpperCase()) {
      out = out.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return out;
  }
  
  function findMerchant(rows: string[]): string | null {
    // UPI style: "Paid to" then the name on the next row (or same row)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].trim();
      const inline = row.match(/^(?:paid\s*to|payment\s*to|sent\s*to|paying)\s*[:\-]?\s*(.+)$/i);
      if (inline) return cleanName(inline[1]);
      if (/^(paid\s*to|payment\s*to|sent\s*to|paying)\s*:?\s*$/i.test(row)) {
        const next = rows[i + 1]?.trim();
        if (next) return cleanName(next);
      }
    }
  
    // printed bills: first name-like row near the top
    for (const row of rows.slice(0, 8)) {
      const r = row.trim();
      if (r.includes('|') || GENERIC_TITLE.test(r)) continue;
      const letters = (r.match(/[A-Za-z]/g) || []).length;
      const digits = (r.match(/\d/g) || []).length;
      if (letters >= 3 && digits / r.length < 0.2) return cleanName(r);
    }
    return null;
  }
  
  export function parseReceipt(rows: string[]): ParsedReceipt {
    return {
      amount: findAmount(rows),
      merchant: findMerchant(rows),
      date: findDate(rows),
    };
  }