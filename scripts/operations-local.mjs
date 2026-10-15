import path from 'node:path';import os from 'node:os';import {mkdir,readFile,writeFile} from 'node:fs/promises';import {randomBytes} from 'node:crypto';import {spawnSync} from 'node:child_process';
export const operationsDirectory=path.join(process.env.LOCALAPPDATA??os.homedir(),'MetaAprovacao','operations');
export async function initializeOperations(){await mkdir(operationsDirectory,{recursive:true});}
export async function backupKey(){
 if(process.platform!=='win32')throw Error('windows_key_required');await initializeOperations();const file=path.join(operationsDirectory,'backup-key.dpapi');
 function protect(bytes,encrypt){const method=encrypt?'Protect':'Unprotect';const command=`Add-Type -AssemblyName System.Security; $b=[Convert]::FromBase64String([Console]::In.ReadToEnd()); $r=[Security.Cryptography.ProtectedData]::${method}($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($r))`;const r=spawnSync('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-Command',command],{input:bytes.toString('base64'),encoding:'utf8',windowsHide:true,timeout:15000});if(r.status!==0||r.error)throw Error('backup_key_unavailable');return Buffer.from(r.stdout.trim(),'base64');}
 let protectedKey;try{protectedKey=await readFile(file);}catch(e){if(e.code!=='ENOENT')throw e;if(await latestManifest())throw Error('backup_key_unavailable');const fresh=randomBytes(32);protectedKey=protect(fresh,true);await writeFile(file,protectedKey,{flag:'wx',mode:0o600});}
 const key=protect(protectedKey,false);if(key.length!==32)throw Error('invalid_backup_key');return key;
}
export async function latestManifest(){try{return JSON.parse(await readFile(path.join(operationsDirectory,'latest-backup.json'),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw Error('backup_manifest_unavailable');}}
