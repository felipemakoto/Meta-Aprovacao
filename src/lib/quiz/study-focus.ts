import type {QuizResult} from "./result-contract.ts";
export function studyFocus(result:QuizResult) {
  const topics=new Map<string,{subject:string;topic:string;positions:number[]}>();
  for(const question of result.questions) {
    if(question.correct) continue;
    const key=JSON.stringify([question.subject,question.topic]);
    const topic=topics.get(key)??{subject:question.subject,topic:question.topic,positions:[]};
    topic.positions.push(question.position);topics.set(key,topic);
  }
  return [...topics.values()];
}
