declare module "pdf-parse" {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: Record<string, any>;
    metadata: Record<string, any>;
    text: string;
    version: string;
  }

  function parse(
    dataBuffer: Buffer,
    options?: Record<string, any>,
  ): Promise<PDFData>;

  export = parse;
}
