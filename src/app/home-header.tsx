"use client";

import {useSyncExternalStore,type ReactNode} from "react";
import styles from "./home.module.css";

function subscribe(notify:()=>void){
 window.addEventListener("scroll",notify,{passive:true});
 return()=>window.removeEventListener("scroll",notify);
}
const snapshot=()=>window.scrollY>0;
const serverSnapshot=()=>false;

export default function HomeHeader({children}:{children:ReactNode}){
 const scrolled=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
 return <header className={styles.header} data-scrolled={scrolled}>{children}</header>;
}
