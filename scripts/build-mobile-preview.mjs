// Gera demonstrações locais de componentes em preview; nenhuma rota ou variável de servidor.
import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const project=process.cwd();
const screen=process.argv[3]||'questoes';
if(!['questoes','historico','site','simulados'].includes(screen))throw new Error('Prévia desconhecida.');
const component=screen==='site'?'scripts/mobile-site-preview.tsx':screen==='simulados'?'src/app/simulados/simulations.tsx':screen==='historico'?'src/app/historico/history.tsx':'src/app/questoes/practice.tsx';
const taskRoot=path.resolve(process.argv[2]||'');
if(!process.argv[2] || taskRoot===project)throw new Error('Informe uma pasta externa de ferramentas/prévia.');
const {build}=await import(pathToFileURL(path.join(taskRoot,'node_modules/esbuild/lib/main.js')).href);
const output=path.join(taskRoot,'public');await mkdir(output,{recursive:true});
await mkdir(path.join(output,'icons'),{recursive:true});await mkdir(path.join(output,'fonts'),{recursive:true});
await writeFile(path.join(taskRoot,'link.tsx'),`import React from ${JSON.stringify(path.join(project,'node_modules/react/index.js'))}; export default function Link({children,...props}:any){return <a {...props} href="#" aria-disabled="true" title="Navegação disponível na aplicação completa" onClick={e=>e.preventDefault()}>{children}</a>}`);
await writeFile(path.join(taskRoot,'image.tsx'),`import React from ${JSON.stringify(path.join(project,'node_modules/react/index.js'))}; export default function Image(props:any){return <img {...props}/>}`);
await writeFile(path.join(taskRoot,'entry.tsx'),`import React from ${JSON.stringify(path.join(project,'node_modules/react/index.js'))};import {createRoot} from ${JSON.stringify(path.join(project,'node_modules/react-dom/client.js'))};import Preview from ${JSON.stringify(path.join(project,component))};createRoot(document.getElementById('root')!).render(<Preview preview/>);`);
await writeFile(path.join(taskRoot,'navigation.ts'),`export function useRouter(){return {push(){},replace(){}}}`);
if(screen==='site'){
  await writeFile(path.join(taskRoot,'link.tsx'),`import React from ${JSON.stringify(path.join(project,'node_modules/react/index.js'))};
    export default function Link({children,href,...props}:any){
      const allowed=typeof href==='string' && (href==='/' || /^\\/(dashboard|historico|questoes|quiz|simulados)(\\/|\\?|$)/.test(href));
      return <a {...props} href="#" aria-disabled={allowed?undefined:true} title={allowed?undefined:"Disponível na aplicação completa"} onClick={e=>{e.preventDefault();if(allowed)window.dispatchEvent(new CustomEvent('etec-preview-navigation',{detail:href}));}}>{children}</a>;
    }`);
  await writeFile(path.join(taskRoot,'navigation.ts'),`const navigate=(path:string)=>window.dispatchEvent(new CustomEvent('etec-preview-navigation',{detail:path}));export function useRouter(){return {push:navigate,replace:navigate}}`);
}
await build({entryPoints:[path.join(taskRoot,'entry.tsx')],bundle:true,minify:true,platform:'browser',jsx:'automatic',outfile:path.join(output,'app.js'),nodePaths:[path.join(project,'node_modules')],alias:{'next/link':path.join(taskRoot,'link.tsx'),'next/image':path.join(taskRoot,'image.tsx'),'next/navigation':path.join(taskRoot,'navigation.ts'),'@':path.join(project,'src')},define:{'process.env.NODE_ENV':'"production"'},loader:{'.module.css':'local-css'},logLevel:'warning'});
const chunks=path.join(project,'.next/dev/static/chunks');
let globalCss='';
for(const file of await readdir(chunks)){if(!file.endsWith('.css'))continue;const css=await readFile(path.join(chunks,file),'utf8');if(css.includes('--color-action:')&&css.includes('font-family: DM Serif Display')){globalCss=css;break;}}
if(!globalCss)throw new Error('CSS/fontes locais não encontrados; inicie next dev antes de gerar.');
globalCss=globalCss.replaceAll('../media/','/fonts/');
await writeFile(path.join(output,'base.css'),globalCss+`\n:root{--font-display:"DM Serif Display","DM Serif Display Fallback";--font-geist-sans:Geist,"Geist Fallback";}\n`);
for(const file of await readdir(path.join(project,'.next/dev/static/media'))){if(file.endsWith('.woff2'))await copyFile(path.join(project,'.next/dev/static/media',file),path.join(output,'fonts',file));}
for(const file of ['arrow-up-right.svg','arrow-right.svg'])await copyFile(path.join(project,'public/icons',file),path.join(output,'icons',file));
await writeFile(path.join(output,'index.html'),'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Prévia de questões | ETEC / IF</title><link rel="stylesheet" href="/base.css"><link rel="stylesheet" href="/app.css"><script src="/app.js" defer></script></head><body><div id="root"></div><noscript>Ative o JavaScript para usar a demonstração.</noscript></body></html>');
console.log('Demonstração gerada a partir do componente real, com preview=true.');

// Alternativa portátil: inclui fontes, CSS, React e ícones no mesmo HTML.
let portableCss=await readFile(path.join(output,'base.css'),'utf8');
portableCss+='\n'+await readFile(path.join(output,'app.css'),'utf8');
for(const name of await readdir(path.join(output,'fonts'))){
  const encoded=(await readFile(path.join(output,'fonts',name))).toString('base64');
  portableCss=portableCss.replaceAll('/fonts/'+name,'data:font/woff2;base64,'+encoded);
}
portableCss=portableCss.replace(/\/\*# sourceMappingURL=.*?\*\//g,'');
let portableJs=await readFile(path.join(output,'app.js'),'utf8');
for(const name of ['arrow-up-right.svg','arrow-right.svg']){
  const encoded=(await readFile(path.join(output,'icons',name))).toString('base64');
  portableJs=portableJs.replaceAll('/icons/'+name,'data:image/svg+xml;base64,'+encoded);
}
portableJs=portableJs.replaceAll('</script','<\\/script');
await writeFile(path.join(taskRoot,screen+'-demonstracao.html'),`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Prévia de ${screen==='site'?'ETEC / IF':screen==='historico'?'histórico':'questões'}</title><style>${portableCss}</style></head><body><div id="root"></div><noscript>Ative o JavaScript para usar a demonstração.</noscript><script>${portableJs}</script></body></html>`);
console.log('Arquivo HTML portátil gerado, sem depender de localhost.');
