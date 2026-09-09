export interface SavedProgram {
  id: string;
  name: string;
  code: string;
  updatedAt: number;
}

const DRAFT_KEY = "codora_ide_draft";
const SAVED_KEY = "codora_ide_saved";

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const DEFAULT_IDE_CODE = `#include <iostream>
using namespace std;

int main() {

//start your program here

}`;

export function getDraft(): string {
  return safeGet<string>(DRAFT_KEY, DEFAULT_IDE_CODE);
}

export function setDraft(code: string): void {
  safeSet(DRAFT_KEY, code);
}

export function getSavedPrograms(): SavedProgram[] {
  return safeGet<SavedProgram[]>(SAVED_KEY, []);
}

export function saveProgram(name: string, code: string): SavedProgram[] {
  const programs = getSavedPrograms();
  const trimmed = name.trim() || `Program ${programs.length + 1}`;
  const existing = programs.find((p) => p.name.trim().toLowerCase() === trimmed.toLowerCase());
  const item: SavedProgram = {
    id: existing?.id ?? (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
    name: trimmed,
    code,
    updatedAt: Date.now(),
  };
  const next = existing
    ? programs.map((p) => (p.id === item.id ? item : p))
    : [...programs, item];
  safeSet(SAVED_KEY, next);
  return next;
}

export function deleteProgram(id: string): SavedProgram[] {
  const next = getSavedPrograms().filter((p) => p.id !== id);
  safeSet(SAVED_KEY, next);
  return next;
}