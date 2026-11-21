export type Platform = "ios" | "android" | "mac" | "windows" | "linux";
export function installationContext(userAgent:string,platform:string,touchPoints:number) {
  const ios = /iPad|iPhone|iPod/i.test(userAgent) || (platform === "MacIntel" && touchPoints > 1);
  const os:Platform = ios ? "ios" : /Android/i.test(userAgent) ? "android" : /Mac/i.test(platform) ? "mac" : /Win/i.test(platform) ? "windows" : "linux";
  const firefox = /Firefox|FxiOS/i.test(userAgent);
  const safari = /Safari/i.test(userAgent) && !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS/i.test(userAgent);
  const instructions = ios
    ? "No Safari, abra Compartilhar e escolha Adicionar à Tela de Início. Se necessário, abra esta página no Safari primeiro."
    : firefox ? "Abra este site no Chrome ou Edge para instalar como aplicativo. No Firefox, você pode salvar um favorito para acesso rápido."
    : os === "android" ? "No menu do Chrome ou Edge, escolha Instalar aplicativo ou Adicionar à tela inicial. A opção depende do navegador."
    : safari && os === "mac" ? "No Safari compatível, abra Arquivo e escolha Adicionar ao Dock. Se a opção não existir, use Chrome ou Edge."
    : "No Chrome ou Edge, use o ícone de instalação na barra de endereço ou o menu do navegador: Instalar Meta Aprovação. A disponibilidade depende do navegador.";
  return {os,instructions};
}
export function isAppContext(displayStandalone:boolean,iosStandalone:boolean) {
  return displayStandalone || iosStandalone;
}
