import type { Metadata } from "next";
import Quiz from "./quiz";
export const metadata: Metadata = { title: "Quiz diagnóstico | Meta Aprovação", robots: { index: false, follow: false } };
export default function QuizPage() { return <Quiz />; }
