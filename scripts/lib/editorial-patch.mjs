import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
// PostgreSQL jsonb imprime chaves por comprimento em bytes e depois ordem binária.
// Arrays conservam ordem; separadores incluem espaço. Não usar JSON.stringify
// diretamente para comparar seu texto ao jsonb::text do servidor.
export function jsonbText(value){
 if(Array.isArray(value))return '['+value.map(jsonbText).join(', ')+']';
 if(value!==null&&typeof value==='object'){
  const keys=Object.keys(value).sort((a,b)=>Buffer.byteLength(a)-Buffer.byteLength(b)||Buffer.compare(Buffer.from(a),Buffer.from(b)));
  return '{'+keys.map(key=>JSON.stringify(key)+': '+jsonbText(value[key])).join(', ')+'}';
 }
 assert.ok(value!==undefined);
 if(typeof value==='number')assert.ok(Number.isFinite(value));
 return JSON.stringify(value);
}
export const fingerprint=value=>createHash('sha256').update(jsonbText(value),'utf8').digest('hex');
export function delta(change,target='after'){
 assert.ok(['before','after'].includes(target));
 const other=target==='before'?'after':'before';
 return Object.fromEntries(Object.entries(change[target]).filter(([key,value])=>JSON.stringify(value)!==JSON.stringify(change[other][key])));
}
export const projection=`jsonb_build_object('subject',q.subject,'topic',q.topic,'difficulty',q.difficulty,'statement',q.statement,
 'options',jsonb_build_array(q.option_a,q.option_b,q.option_c,q.option_d,q.option_e),'correctAnswer',a.correct_answer,
 'explanation',a.explanation,'status',q.status,'version',q.version,'targetExam',q.target_exam)`;
