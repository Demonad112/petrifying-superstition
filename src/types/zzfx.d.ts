declare module 'zzfx' {
  export function zzfx(...params: (number | undefined)[]): AudioBufferSourceNode;
  export const ZZFX: { volume: number; sampleRate: number; audioContext: AudioContext };
}
