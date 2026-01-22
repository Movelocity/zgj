/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * ICP备案号
   * 示例：京ICP备12345678号-1
   * 留空则不显示
   */
  readonly VITE_ICP_FILING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
