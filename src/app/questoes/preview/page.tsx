import { notFound } from "next/navigation";
import Practice from "../practice";
export const dynamic="force-dynamic";
export const metadata={title:"Prévia de questões",robots:{index:false,follow:false}};
export default function QuestionsPreview(){if(process.env.NODE_ENV!=="development")notFound();return <Practice preview />;}
