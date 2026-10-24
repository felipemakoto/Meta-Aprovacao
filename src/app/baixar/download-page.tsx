"use client";
import Link from "next/link";
import {MetaMark} from "../home-art";
import ApplicationPanel from "../pwa/application-panel";
import {usePwa} from "../pwa/provider";
import styles from "../pwa/pwa.module.css";
export default function DownloadPage(){
 const {standalone,os}=usePwa();
 if(standalone===null)return <div className={styles.page}><h1>Baixe a Meta Aprovação</h1><p>Identificando seu dispositivo…</p></div>;
 if(standalone)return <div className={`${styles.page} ${styles.alternative}`}><h1>Seu aplicativo já está aberto.</h1><p>Continue seus estudos ou consulte a versão em Configurações → Aplicativo.</p><Link href="/dashboard">Ir para meus estudos</Link><br/><Link href="/configuracoes?secao=app">Configurações do aplicativo</Link></div>;
 return <div className={styles.page}>
 <section className={styles.hero}><div className={styles.copy}><MetaMark/><h1>Seus estudos.<br/>A um toque.</h1><p>Baixe a Meta Aprovação direto do navegador. A mesma plataforma, com um lugar só dela no seu dispositivo.</p></div><div><h2 className="sr-only">Baixe a Meta Aprovação</h2><ApplicationPanel/></div></section>
 <section className={styles.benefits} aria-label="Vantagens do aplicativo"><div><h2>Abra e comece.</h2><p>Um ícone na tela inicial para voltar aos estudos com facilidade.</p></div><div><h2>Uma janela só sua.</h2><p>Use a plataforma em uma janela independente, nos navegadores compatíveis.</p></div><div><h2>Seu progresso acompanha.</h2><p>Entre na mesma conta para acessar seus dados sincronizados quando estiver online.</p></div></section>
 <section className={styles.platforms} aria-labelledby="devices-title"><h2 id="devices-title">No celular ou no computador.</h2>
 <article className={styles.platform}><h3>Android{os==='android'&&<span className={styles.badge}>Seu dispositivo</span>}</h3><p>No Chrome ou Edge, toque em Instalar Meta Aprovação. Se o pedido não aparecer, abra o menu do navegador e procure Instalar aplicativo ou Adicionar à tela inicial.</p></article>
 <article className={styles.platform}><h3>iPhone e iPad{os==='ios'&&<span className={styles.badge}>Seu dispositivo</span>}</h3><p>Abra no Safari, toque em Compartilhar e depois em Adicionar à Tela de Início. Confirme em Adicionar e abra pelo novo ícone.</p></article>
 <article className={styles.platform}><h3>Computador{os&&os!=='ios'&&os!=='android'&&<span className={styles.badge}>Seu dispositivo</span>}</h3><p>No Windows, macOS ou Linux, use Chrome ou Edge e procure o ícone de instalação na barra de endereço. No Safari compatível do Mac, use Arquivo → Adicionar ao Dock. O Firefox pode exigir outro navegador para instalar.</p></article>
 </section></div>;
}
