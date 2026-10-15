// Ten-second presentation requested by the owner, shared by preview and correction.
// Start the operation immediately; slow responses do not receive another delay.
export const RESULT_TRANSITION_MS=10000;
export async function withResultTransition<T>(operation:()=>Promise<T>):Promise<T> {
  const visible=new Promise<void>(resolve=>setTimeout(resolve,RESULT_TRANSITION_MS));
  try {return await operation();}
  finally {await visible;}
}
