"use client";
import {useState} from "react";
import styles from "../../information.module.css";

export default function CopySupportEmail(){
  const [message,setMessage]=useState("");
  async function copy(){
    try{await navigator.clipboard.writeText("metaaprovacao720@gmail.com");setMessage("E-mail copiado. Cole no destinatário da sua mensagem.");}
    catch{setMessage("Não foi possível copiar automaticamente. Selecione o endereço acima e copie pelo navegador.");}
  }
  return <><button className={styles.copyButton} type="button" onClick={copy}>Copiar e-mail</button><p role="status" aria-live="polite">{message}</p></>;
}
