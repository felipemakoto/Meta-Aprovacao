import { notFound } from "next/navigation";
import Simulations from "../simulations";
export const dynamic="force-dynamic";
export default function Preview(){if(process.env.NODE_ENV!=="development")notFound();return <Simulations preview/>;}
