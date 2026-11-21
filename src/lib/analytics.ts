export const analyticsId="G-PMGG1W3N6N";
export const analyticsChoiceKey="meta:analytics-consent:v1";
export type AnalyticsChoice="accepted"|"rejected";
const pages=new Set(["/","/login","/cadastro","/cadastro/confirmado","/cadastro/confirmacao-invalida","/recuperar-senha","/nova-senha","/dashboard","/questoes","/simulados","/historico","/estatisticas","/premium","/premium/estudos","/premium/pagamento","/quiz","/quiz/result","/quiz/result/saved","/suporte","/termos","/privacidade"]);
export function analyticsPath(value:string){
 const path=value.split(/[?#]/)[0];
 if(pages.has(path))return path;
 if(path.startsWith("/historico/"))return "/historico/atividade";
 if(path.startsWith("/simulados/"))return "/simulados/atividade";
 if(path.startsWith("/auth/"))return "/auth";
 return "/outra-pagina";
}
export function parseAnalyticsChoice(value:string|null,now=Date.now()):AnalyticsChoice|null{
 try{const v=JSON.parse(value??"");return v.version===1&&["accepted","rejected"].includes(v.choice)&&Number.isFinite(v.at)&&v.at<=now&&now-v.at<180*86400000?v.choice:null;}catch{return null;}
}
