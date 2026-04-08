/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_URL?: string;
	readonly VITE_SERVER_URL: string;
	readonly VITE_USE_EDGE_PROXY?: "true" | "false";
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
