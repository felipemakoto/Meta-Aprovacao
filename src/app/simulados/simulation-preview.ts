import type { Simulation,SimulationState } from "@/lib/quiz/simulation-contract";
import type { Answers } from "@/lib/quiz/result-contract";
import { demoReview } from "../historico/history-preview";
export const demoSimulations:Simulation[]=[{id:"00000000-0000-4000-8000-000000000031",title:"Simulado rápido",count:10,subject:null},{id:"00000000-0000-4000-8000-000000000032",title:"Matemática",count:20,subject:"matematica"}];
export function previewSimulation(item:Simulation):SimulationState{
 return {quiz:{id:item.id,title:item.title,startedAt:"2026-09-30T18:00:00Z",expiresAt:"2099-01-01T00:00:00Z",questionCount:item.count,questions:Array.from({length:item.count},(_,i)=>({id:"00000000-0000-4000-8000-"+String(100+i).padStart(12,"0"),position:i+1,version:1,subject:demoReview.subject,topic:demoReview.topic,statement:demoReview.statement,options:demoReview.options}))}};
}
// Somente demonstração: correção local de fixture repetida, sem conteúdo de produção.
export function previewCorrection(state:SimulationState,answers:Answers):SimulationState{
 if(!("quiz" in state))return state;
 const questions=state.quiz.questions.map(q=>({...q,answer:answers.find(a=>a.questionId===q.id)!.answer,correctAnswer:"B",correct:answers.find(a=>a.questionId===q.id)!.answer==="B",explanation:demoReview.explanation}));
 return {result:{id:state.quiz.id,title:state.quiz.title,completedAt:"2026-09-30T18:04:00Z",durationSeconds:240,total:questions.length,score:questions.filter(q=>q.correct).length,questions}};
}
