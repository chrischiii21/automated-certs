/**
 * Turns a name into the key used for matching, so that
 * "  JOSÉ  dela-Cruz Jr. " and "jose dela cruz jr" are treated as the same person.
 */
export function nameKey(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/['’`.]/g, '') // O'Neil → oneil, Jr. → jr
    .replace(/[^\p{L}\p{N}]+/gu, ' ') // other punctuation, hyphens → space
    .trim()
    .replace(/\s+/g, ' ');
}

/** Tidies whitespace without changing how the organizer spelled the name. */
export function cleanName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

const NAME_HEADER = /^(full ?name|name|participant( name)?|attendee( name)?|student( name)?|recipient( name)?)$/i;
const FIRST_HEADER = /^(first ?name|given ?name|first)$/i;
const LAST_HEADER = /^(last ?name|surname|family ?name|last)$/i;

function parseCsvRows(text: string): string[][] {
  const delimiter = text.includes('\t') && !text.includes(',') ? '\t' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  row.push(cell);
  rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim()));
}

/**
 * Extracts participant names from pasted text or a CSV/TSV export.
 * Understands a "Name" column, or "First name" + "Last name" columns;
 * otherwise takes the first column of every row.
 */
export function parseNames(text: string): string[] {
  const rows = parseCsvRows(text.replace(/^﻿/, ''));
  if (rows.length === 0) return [];

  const header = rows[0].map((c) => c.trim());
  const nameCol = header.findIndex((h) => NAME_HEADER.test(h));
  const firstCol = header.findIndex((h) => FIRST_HEADER.test(h));
  const lastCol = header.findIndex((h) => LAST_HEADER.test(h));

  let names: string[];
  if (nameCol >= 0) {
    names = rows.slice(1).map((r) => r[nameCol] ?? '');
  } else if (firstCol >= 0 && lastCol >= 0) {
    names = rows.slice(1).map((r) => `${r[firstCol] ?? ''} ${r[lastCol] ?? ''}`);
  } else {
    names = rows.map((r) => r[0] ?? '');
  }
  return names.map(cleanName).filter(Boolean);
}
