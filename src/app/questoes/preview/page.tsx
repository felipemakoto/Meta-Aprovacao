import { notFound } from "next/navigation";
import Practice from "../practice";
export const dynamic="force-dynamic";
export const metadata={title:"Prévia de questões",robots:{index:false,follow:false}};
export default async function QuestionsPreview({searchParams}:{searchParams:Promise<{limit?:string}>}){if(process.env.NODE_ENV!=="development")notFound();const query=await searchParams;return <Practice preview limitReached={query.limit==="1"} />;}
