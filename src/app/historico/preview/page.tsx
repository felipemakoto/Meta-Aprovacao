import { notFound } from "next/navigation";
import History from "../history";
export const dynamic="force-dynamic";
export default function Preview(){if(process.env.NODE_ENV!=="development")notFound();return <History preview/>;}

