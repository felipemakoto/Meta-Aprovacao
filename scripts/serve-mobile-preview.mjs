import {createServer} from 'node:http';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const folder=path.resolve(process.argv[2]||'');
if(!process.argv[2])throw new Error('Informe a pasta public da demonstração.');
const assets=new Map();
for(const name of ['index.html','app.js','app.css','base.css'])assets.set('/'+name,await readFile(path.join(folder,name)));
for(const category of ['fonts','icons'])for(const name of await readdir(path.join(folder,category))){if(/^[\w.-]+\.(woff2|svg)$/.test(name))assets.set('/'+category+'/'+name,await readFile(path.join(folder,category,name)));}
assets.set('/',assets.get('/index.html'));
const mime={'.js':'application/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  let key;try{key=new URL(req.url,'http://preview.local').pathname;}catch{res.writeHead(400);return res.end();}
  if(!assets.has(key)){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',mime[path.extname(key)]||'text/html');res.writeHead(200);res.end(req.method==='HEAD'?undefined:assets.get(key));
});
server.listen(4175,'127.0.0.1',()=>console.log('Demonstração estática: 4175; sem APIs, cookies ou banco.'));
setTimeout(()=>server.close(()=>process.exit(0)),12*60*60*1000).unref();
