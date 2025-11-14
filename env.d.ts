declare namespace NodeJS {
  interface ProcessEnv {
    CHROME_PATH: string;
    GLOBAL_AGENT_HTTP_PROXY: string;
    API_URL: string;
    HTTP_PORT: string;
  }
}