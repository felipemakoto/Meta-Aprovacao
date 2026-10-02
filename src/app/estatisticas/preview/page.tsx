import { notFound } from "next/navigation";
import Statistics from "../statistics";
export const dynamic="force-dynamic";
export const metadata={title:"Prévia de estatísticas",robots:{index:false,follow:false}};
export default function Preview(){if(process.env.NODE_ENV!=="development")notFound();return <Statistics preview/>;}
