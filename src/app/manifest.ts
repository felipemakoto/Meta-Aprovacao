import type {MetadataRoute} from "next";
export default function manifest():MetadataRoute.Manifest {
  return {
    id:"/",name:"Meta Aprovação",short_name:"Meta Aprovação",lang:"pt-BR",
    description:"Questões, simulados e organização dos estudos para ETEC e IF.",
    start_url:"/login",scope:"/",display:"standalone",background_color:"#ffffff",theme_color:"#237b38",
    icons:[
      {src:"/pwa/icon-192.png",sizes:"192x192",type:"image/png",purpose:"any"},
      {src:"/pwa/icon-512.png",sizes:"512x512",type:"image/png",purpose:"any"},
      {src:"/pwa/maskable-512.png",sizes:"512x512",type:"image/png",purpose:"maskable"},
    ],
    shortcuts:[{name:"Meus estudos",url:"/dashboard"},{name:"Questões",url:"/questoes"}],
  };
}
