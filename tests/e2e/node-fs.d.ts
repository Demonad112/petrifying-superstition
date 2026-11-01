// The few node:fs calls the specs and the autopilot fixture test use, so the project needs no @types/node dependency.
declare module 'node:fs' {
  export function readdirSync(path: string | URL): string[];
  export function readFileSync(path: string | URL, encoding: 'utf8'): string;
}
declare module 'node:fs' {
  export function writeFileSync(path: string | URL, data: string): void;
}
declare const process: { env: Record<string, string | undefined> };
