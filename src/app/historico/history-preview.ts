import type { HistoryItem,PracticeReview } from "@/lib/quiz/history-contract";
import type { QuizResult } from "@/lib/quiz/result-contract";
export const demoTests:HistoryItem[]=[
 {id:"00000000-0000-4000-8000-000000000020",at:"2026-09-30T15:00:00Z",score:7,total:10},
 {id:"00000000-0000-4000-8000-000000000019",at:"2026-09-28T15:00:00Z",score:6,total:10},
 {id:"00000000-0000-4000-8000-000000000018",at:"2026-09-27T15:00:00Z",score:8,total:10}
];
export const demoReview:PracticeReview={id:"00000000-0000-4000-8000-000000000021",at:"2026-09-30T16:00:00Z",subject:"matematica",topic:"Porcentagem",statement:"Uma mochila custa R$ 80,00. Com 15% de desconto, qual é o preço final?",options:["R$ 12,00","R$ 68,00","R$ 65,00","R$ 72,00","R$ 92,00"],answer:"D",correctAnswer:"B",correct:false,explanation:"15% de R$ 80,00 são R$ 12,00. Subtraindo o desconto: 80 − 12 = 68."};
export function demoResult(item:HistoryItem):QuizResult {
 const score=item.score??7;
 return {id:item.id,completedAt:item.at,total:10,score,questions:Array.from({length:10},(_,i)=>({id:"example-"+i,position:i+1,subject:demoReview.subject,topic:demoReview.topic,statement:demoReview.statement,options:demoReview.options,answer:i<score?"B":"D",correctAnswer:"B",correct:i<score,explanation:demoReview.explanation}))};
}

