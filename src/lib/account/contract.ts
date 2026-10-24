import {themes,type Theme} from "./theme.ts";
export type AccountPlan="normal"|"premium"|"unknown";
export type AccountProfile={nickname:string;reduceMotion:boolean;avatarVersion:string|null;theme:Theme};
export type AccountCommand={action:"save";nickname:string;reduceMotion:boolean;theme?:Theme}|{action:"avatar";image:string}|{action:"remove_avatar"};
export function parseAccountCommand(value:unknown):AccountCommand{
 if(!value||typeof value!=="object"||Array.isArray(value))throw Error("invalid_input");
 const v=value as Record<string,unknown>,keys=Object.keys(v).sort().join();
 if(v.action==="save"&&["action,nickname,reduceMotion","action,nickname,reduceMotion,theme"].includes(keys)&&typeof v.nickname==="string"&&typeof v.reduceMotion==="boolean"){
  const nickname=v.nickname.normalize("NFC").trim();
  if(nickname.length>32||(nickname!==""&&!/^[\p{L}\p{M}\p{N}_. -]{2,32}$/u.test(nickname)))throw Error("invalid_input");
  if("theme" in v&&!themes.includes(v.theme as Theme))throw Error("invalid_input");
  return {action:"save",nickname,reduceMotion:v.reduceMotion,...("theme" in v?{theme:v.theme as Theme}:{})};
 }
 if(v.action==="avatar"&&keys==="action,image"&&typeof v.image==="string"){
  if(v.image.length>2796204)throw Error("upload_too_large");
  if(!v.image.length||v.image.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(v.image))throw Error("invalid_image");
  return {action:"avatar",image:v.image};
 }
 if(v.action==="remove_avatar"&&keys==="action")return {action:"remove_avatar"};
 throw Error("invalid_input");
}
export function parseAccountProfile(value:unknown):AccountProfile{
 if(!value||typeof value!=="object"||Array.isArray(value))throw Error("profile_unavailable");
 const v=value as Record<string,unknown>;
 if(typeof v.nickname!=="string"||v.nickname.length>32||typeof v.reduceMotion!=="boolean"||(v.avatarVersion!==null&&(typeof v.avatarVersion!=="string"||!/^[a-f0-9-]{36}$/.test(v.avatarVersion))))throw Error("profile_unavailable");
 if(v.theme!==undefined&&!themes.includes(v.theme as Theme))throw Error("profile_unavailable");
 return {nickname:v.nickname,reduceMotion:v.reduceMotion,avatarVersion:v.avatarVersion as string|null,theme:(v.theme??"light") as Theme};
}
