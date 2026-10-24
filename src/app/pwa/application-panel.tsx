"use client";
import {MetaMark} from "../home-art";
import {appRelease,releaseLabel,usePwa} from "./provider";
import styles from "./pwa.module.css";
export default function ApplicationPanel(){
 const pwa=usePwa(),installed=pwa.standalone===true;
 return <div className={styles.application}><div className={styles.identity}><MetaMark/><strong>Meta Aprovação</strong></div>
 {pwa.standalone===null?<p>Identificando o modo de execução…</p>:<>
 <p className={styles.status}>{installed?'Aplicativo instalado':'Versão web'}</p>
 <p>{installed?'Versão atual':'Versão disponível'}: {releaseLabel(installed?appRelease:(pwa.available??appRelease))}</p>
 {installed?<p>Você está utilizando a versão instalada da Meta Aprovação.</p>:<><p>Acesso rápido e progresso sincronizado na mesma conta.</p><button type="button" className={styles.primary} onClick={()=>void pwa.install()}>Instalar Meta Aprovação</button><p>{pwa.instructions}</p></>}
 </>}
 {(pwa.waiting||(pwa.available?.build&&pwa.available.build!==appRelease.build))&&<section className={styles.update}><h3>Atualização disponível</h3><p>Salve suas atividades antes de atualizar. Outras abas permanecem abertas.</p><button type="button" className={styles.secondary} onClick={pwa.update}>Atualizar quando estiver pronto</button></section>}
 {pwa.workerError&&<p>Modo offline indisponível. Continue pela versão web.</p>}
 {pwa.message&&<p role="status">{pwa.message}</p>}
 <p>Requer internet. Seu plano e limites permanecem iguais.</p></div>;
}
