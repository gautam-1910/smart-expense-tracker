type Line = {
    text: string;
    boundingBox: { x: number; y: number; width: number; height: number };
  };
  type OcrResult = { blocks: { lines: Line[] }[] };
  
  export function buildRows(result: OcrResult): string[] {
    const lines = result.blocks.flatMap((b) => b.lines);
    if (lines.length === 0) return [];
  
    const items = lines.map((l) => ({
      text: l.text,
      x: l.boundingBox.x,
      cy: l.boundingBox.y + l.boundingBox.height / 2,
      h: l.boundingBox.height,
    }));
  
    const heights = items.map((i) => i.h).sort((a, b) => a - b);
    const tolerance = heights[Math.floor(heights.length / 2)] * 0.6;
  
    items.sort((a, b) => a.cy - b.cy);
  
    const rows: { cy: number; items: typeof items }[] = [];
    for (const item of items) {
      const last = rows[rows.length - 1];
      if (last && Math.abs(item.cy - last.cy) <= tolerance) {
        last.items.push(item);
        last.cy = last.items.reduce((sum, i) => sum + i.cy, 0) / last.items.length;
      } else {
        rows.push({ cy: item.cy, items: [item] });
      }
    }
  
    return rows.map((r) =>
      r.items
        .sort((a, b) => a.x - b.x)
        .map((i) => i.text)
        .join(' | ')
    );
  }