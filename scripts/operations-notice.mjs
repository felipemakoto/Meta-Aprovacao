import {readFile,writeFile,rename} from 'node:fs/promises';import path from 'node:path';import {randomUUID} from 'node:crypto';import {readOperations} from './operations-read.mjs';import {initializeOperations,operationsDirectory} from './operations-local.mjs';import {nextNotice,operationMessages} from '../src/lib/operations/check.ts';
const file=path.join(operationsDirectory,'notice-state.json');
async function readState(){try{const s=JSON.parse(await readFile(file,'utf8'));if(typeof s.candidate!=='string'||typeof s.notified!=='string'||!Number.isSafeInteger(s.count)||s.count<0||![s.candidate,s.notified].every(k=>!k||k.split(',').every(c=>Object.hasOwn(operationMessages,c))))throw Error();return s;}catch(e){if(e.code==='ENOENT')return {candidate:'',count:0,notified:''};throw Error('invalid_notice_state');}}
async function save(s){const temporary=file+'.'+randomUUID();await writeFile(temporary,JSON.stringify(s),{mode:0o600});await rename(temporary,file);}
try{
 await initializeOperations();const previous=await readState(),mode=process.argv[2]??'prepare';
 if(mode==='acknowledge'){const id=process.argv[3];if(!previous.pending||previous.pending.id!==id)throw Error();previous.notified=previous.pending.kind==='recovery'?'':previous.pending.key;delete previous.pending;await save(previous);console.log(JSON.stringify({acknowledged:true}));}
 else if(mode==='prepare'){
  const to=process.env.OPERATIONS_ALERT_TO;if(!to||!/^[-.\w+]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(to))throw Error();
  const snapshot=await readOperations(),next=nextNotice(previous,snapshot);let notice=null;
  if(next.action!=='silent'){const id=randomUUID(),recovery=next.action==='recovery';next.state.pending={id,key:next.key,kind:next.action};notice={id,to,subject:recovery?'Meta Aprovação: operação normalizada':'Meta Aprovação: atenção na operação',text:recovery?'A verificação voltou ao normal. Site, monitor de pagamentos e cópia de segurança passaram nesta amostra.':'Duas verificações consecutivas identificaram: '+snapshot.messages.join(' ')+' Confira a operação antes de alterar acessos ou pagamentos.'};}
  await save(next.state);console.log(JSON.stringify({action:next.action,checkedAt:snapshot.sampledAt,notice}));
 }else throw Error();
}catch{console.error('Não foi possível preparar o alerta; nenhum e-mail foi enviado e o destinatário não foi exibido.');process.exitCode=1;}
