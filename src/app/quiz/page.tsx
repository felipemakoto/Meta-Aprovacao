import type { Metadata } from "next";
import Quiz from "./quiz";
export const metadata: Metadata = { title: "Quiz diagnóstico — ETEC / IF", robots: { index: false, follow: false } };
export default function QuizPage() { return <Quiz />; }
