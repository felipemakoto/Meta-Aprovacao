import type { StudyStatistics,Period } from "@/lib/quiz/statistics-contract";
export function demoStatistics(period:Period="all"):StudyStatistics{
 const all=period==="all";
 const counts=all?[[30,18],[12,9],[6,5],[6,4],[6,6]]:[[26,16],[8,5],[2,2],[2,2],[2,2]];
 return {period,asOf:"2026-10-02T15:00:00Z",answered:all?60:40,correct:all?42:27,simulations:2,
 subjects:(["matematica","portugues","ciencias","historia","geografia"] as const).map((subject,i)=>({subject,answered:counts[i][0],correct:counts[i][1]})),
 recent:[{id:"00000000-0000-4000-8000-000000000032",title:"Matemática",at:"2026-09-30T15:00:00Z",score:12,total:20},{id:"00000000-0000-4000-8000-000000000031",title:"Simulado rápido",at:"2026-09-28T15:00:00Z",score:7,total:10}]};
}
