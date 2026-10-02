import { notFound } from "next/navigation";
import Simulations from "../simulations";
export const dynamic="force-dynamic";
export default async function Preview({searchParams}:{searchParams:Promise<{limit?:string}>}){if(process.env.NODE_ENV!=="development")notFound();const query=await searchParams;return <Simulations preview limitReached={query.limit==="1"}/>;}
