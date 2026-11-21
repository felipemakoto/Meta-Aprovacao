import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

// Render from the original vector, never from an enlarged 64px bitmap.
const logo=readFileSync(new URL('../src/app/icon.svg',import.meta.url));
const render=size=>sharp(logo,{density:1152}).resize(size,size).png().toBuffer();
const sizes=[16,32,48,64,256],frames=await Promise.all(sizes.map(render));
const directory=Buffer.alloc(6+16*sizes.length);
directory.writeUInt16LE(1,2);directory.writeUInt16LE(sizes.length,4);
let offset=directory.length;
frames.forEach((png,index)=>{
 const entry=6+16*index,size=sizes[index];
 directory[entry]=size===256?0:size;directory[entry+1]=size===256?0:size;
 directory.writeUInt16LE(1,entry+4);directory.writeUInt16LE(32,entry+6);
 directory.writeUInt32LE(png.length,entry+8);directory.writeUInt32LE(offset,entry+12);offset+=png.length;
});
writeFileSync(new URL('../public/favicon.ico',import.meta.url),Buffer.concat([directory,...frames]));

mkdirSync(new URL('../public/pwa/',import.meta.url),{recursive:true});
for(const [name,size,padding] of [['icon-192',192,.10],['icon-512',512,.10],['maskable-512',512,.18],['apple-180',180,.12]]){
 const mark=await render(Math.round(size*(1-padding*2)));
 await sharp({create:{width:size,height:size,channels:4,background:'#ffffff'}})
  .composite([{input:mark,gravity:'center'}]).png()
  .toFile(fileURLToPath(new URL(`../public/pwa/${name}.png`,import.meta.url)));
}
console.log('Favicon transparente e ícones do aplicativo gerados do SVG original.');
