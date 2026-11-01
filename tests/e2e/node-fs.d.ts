// The two node:fs calls the e2e specs use, so the project needs no @types/node dependency.
declare module 'node:fs' {
  export function readdirSync(path: string | URL): string[];
  export function readFileSync(path: string | URL, encoding: 'utf8'): string;
}
