declare module 'mammoth/mammoth.browser.js' {
  export interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface MammothApi {
    convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<MammothResult>;
    extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<MammothResult>;
  }

  const mammoth: MammothApi;
  export default mammoth;
}
