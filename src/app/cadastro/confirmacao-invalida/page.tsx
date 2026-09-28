import Link from "next/link";
import styles from "../signup.module.css";
export default function InvalidConfirmationPage() {
  return <section>
    <h1 className={styles.title}>Não foi possível confirmar</h1>
    <div className={styles.panel}>
      <p>O link pode ter expirado, já ter sido usado ou sido aberto em outro navegador. Também pode haver uma falha temporária de conexão.</p>
      <p>Abra o e-mail mais recente no navegador em que fez o cadastro. Se precisar de outro link, aguarde e envie o formulário novamente com o mesmo e-mail.</p>
    </div>
    <Link className={styles.skip} href="/cadastro">Voltar ao cadastro</Link>
  </section>;
}
