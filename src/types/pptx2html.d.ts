declare module 'pptx2html' {
  export function convert(buffer: ArrayBuffer): Promise<{ html: string }>;
}