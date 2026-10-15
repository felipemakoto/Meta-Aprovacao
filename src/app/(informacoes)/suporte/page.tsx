import Link from "next/link";
import styles from "../../information.module.css";
export const metadata={title:"Suporte | Meta Aprovação",description:"Ajuda com sua conta, estudos e plano na Meta Aprovação."};

export default function SupportPage() {
  return <article><h1>Como podemos ajudar?</h1><p>Fale com a Meta Aprovação sobre sua conta, seus estudos ou seu plano.</p>
    <section className={styles.contact} aria-labelledby="contact-title"><h2 id="contact-title">Suporte por e-mail</h2>
      <a href="mailto:metaaprovacao720@gmail.com">metaaprovacao720@gmail.com</a>
      <p>Conte o que aconteceu, a tela em que estava e o e-mail da sua conta. Se enviar uma captura, esconda dados pessoais que não sejam necessários.</p>
      <a className={styles.contactButton} href="mailto:metaaprovacao720@gmail.com?subject=Ajuda%20com%20a%20Meta%20Aprova%C3%A7%C3%A3o">Falar com o suporte</a>
    </section>
    <h2>Dúvidas frequentes</h2><div className={styles.faq}>
      <details><summary>Não consigo entrar na minha conta</summary><p>Confira seu e-mail e a confirmação do cadastro. Se esqueceu a senha, use <Link href="/recuperar-senha">a recuperação de senha</Link> e abra o link no mesmo navegador em que fez o pedido.</p></details>
      <details><summary>Como funcionam os limites do gratuito?</summary><p>Você pode iniciar dez questões de prática e um simulado rápido por dia. O saldo renova à meia-noite, no horário de São Paulo. Atividades já iniciadas podem ser retomadas.</p></details>
      <details><summary>Onde vejo meu plano?</summary><p>Acesse <Link href="/premium">a página de planos</Link>. Se houver divergência no acesso ou numa cobrança, envie ao suporte o e-mail da conta e a referência do pedido. Não envie senha, código de acesso ou dados completos de cartão.</p></details>
      <details><summary>Encontrei um problema em uma questão</summary><p>Envie o assunto, o enunciado ou uma captura da questão e explique a dúvida. Isso ajuda a localizar e conferir o conteúdo.</p></details>
      <details><summary>Quero consultar, corrigir ou excluir meus dados</summary><p>Escreva para o mesmo e-mail de suporte. Poderemos pedir uma confirmação de identidade para proteger a conta. Veja como usamos os dados na <Link href="/privacidade">política de privacidade</Link>.</p></details>
    </div><p className={styles.updated}>Responsável pelo atendimento: Meta Aprovação. O botão abre seu aplicativo de e-mail.</p>
  </article>;
}
