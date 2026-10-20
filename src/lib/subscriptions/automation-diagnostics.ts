import {CaktoReadError} from './cakto-api.ts';
export const automationPhases=['lease','validation','discovery','jobs','finish'] as const;
export type AutomationPhase=typeof automationPhases[number];
type Category='configuration_missing'|'provider_unauthorized'|'provider_rate_limited'|'provider_not_found'|'provider_invalid_response'|'provider_unavailable'|'provider_timeout'|'storage_unavailable'|'invalid_worker_state'|'internal_error';
// Keep the persisted operation vocabulary compatible with the deployed RPC.
const operations=['authentication','orders_list','order','subscription'] as const;
export type AutomationDiagnostic={phase:AutomationPhase;category:Category;operation?:typeof operations[number];status?:number};
export class AutomationStorageError extends Error {constructor(){super('automation_storage_unavailable');}}
export class AutomationRunError extends Error {
 readonly diagnostic:AutomationDiagnostic;
 constructor(diagnostic:AutomationDiagnostic){super('automation_unavailable');this.diagnostic=diagnostic;}
}
export function automationDiagnostic(error:unknown,phase:AutomationPhase):AutomationDiagnostic {
 if(error instanceof AutomationStorageError)return {phase,category:'storage_unavailable'};
 if(error instanceof CaktoReadError){
  if(phase==='validation'&&!error.operation)return {phase,category:'invalid_worker_state'};
  const category:Category=error.timedOut?'provider_timeout':({configuration_missing:'configuration_missing',unauthorized:'provider_unauthorized',rate_limited:'provider_rate_limited',not_found:'provider_not_found',invalid_response:'provider_invalid_response',invalid_id:'invalid_worker_state',unavailable:'provider_unavailable'} as Record<string,Category>)[error.reason]??'internal_error';
  const operation=operations.find(value=>value===error.operation);
  return {phase,category,...(operation?{operation}:{}),...(typeof error.status==='number'&&Number.isInteger(error.status)&&error.status>=100&&error.status<=599?{status:error.status}:{})};
 }
 return {phase,category:phase==='validation'?'invalid_worker_state':'internal_error'};
}
