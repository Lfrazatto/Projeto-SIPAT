export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Navega até o painel administrativo, que usa a chave local configurada no Worker. */
export const startLogin = () => window.location.assign("/admin");
