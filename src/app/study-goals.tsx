"use client";
import {useEffect,useState} from "react";
import {devicePreferences,preferenceEvent} from "@/lib/account/settings-device";
import {daysToExam,type Preferences} from "@/lib/account/settings-contract";
import {useDailyLimits} from "@/lib/quiz/use-daily-limits";
import Link from "next/link";
export default function StudyGoals(){const [p,setP]=useState<Preferences|null>(null);const quota=useDailyLimits(false,false);useEffect(()=>{const update=()=>setP(devicePreferences());update();window.addEventListener(preferenceEvent,update);return()=>window.removeEventListener(preferenceEvent,update);},[]);if(!p)return null;const days=daysToExam(p.examDate);return <section style={{overflowWrap:"anywhere"}} aria-label="Seus objetivos" data-goal-priority={p.dashboard==='goals'}><h2>{p.dashboard==='goals'?'Sua meta de hoje':'Seus objetivos'}</h2><p>{p.institution==='both'?'ETEC e IF':p.institution.toUpperCase()}{p.course?' · '+p.course:''}{p.school?' · '+p.school:''}</p><p>Questões iniciadas hoje: {quota.limits?Math.min(quota.limits.practice.used,p.dailyGoal):'—'} de {p.dailyGoal} questões · {p.weekdays.length*p.minutes} minutos disponíveis por semana.</p>{days!==null&&<p>{days>0?`${days} dias até a prova`:days===0?'Sua prova é hoje.':'A data de prova informada já passou.'}</p>}<Link href="/configuracoes">Ajustar objetivos</Link></section>;}
