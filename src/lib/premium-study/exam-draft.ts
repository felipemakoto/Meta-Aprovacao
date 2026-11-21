type Snapshot={answers:Record<string,string>;marked:string[]};
type Status={state:"saving"}|{state:"saved"}|{state:"error";error:unknown};

// Start each edit immediately; serialize full snapshots so older requests never overwrite newer ones.
export function createExamDraftSaver(revision:number,send:(draft:Snapshot&{revision:number})=>Promise<unknown>,notify:(status:Status)=>void){
 let latest:Snapshot|null=null,version=0,confirmed=0,running=false,blocked=false;
 async function drain(){
  if(running||blocked||!latest||confirmed===version)return;
  running=true;
  try{
   while(confirmed<version&&!blocked){
    const current=version,snapshot=latest!;
    notify({state:"saving"});
    await send({...snapshot,revision:++revision});
    confirmed=current;
   }
   if(confirmed===version)notify({state:"saved"});
  }catch(error){
   // A conflicting tab owns the newer draft. Never retry over its revision.
   blocked=error instanceof Error&&error.message.includes("outra aba");
   notify({state:"error",error});
  }finally{running=false;}
 }
 return {
  get pending(){return confirmed<version;},
  save(snapshot:Snapshot){latest={answers:{...snapshot.answers},marked:[...snapshot.marked]};version++;void drain();},
  retry(){void drain();},
 };
}
