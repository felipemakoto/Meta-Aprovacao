import StudyShell from "../study-shell";
import DownloadPage from "./download-page";
export const metadata={title:"Baixe a Meta Aprovação",description:"Instale a Meta Aprovação pelo navegador no celular ou computador, sem lojas de aplicativos."};
export default function Page(){return <StudyShell focus menu plain homeHref="/"><main><DownloadPage/></main></StudyShell>;}
