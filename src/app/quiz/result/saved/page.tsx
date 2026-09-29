import Result from "../result";
export const metadata = { title: "Resultado salvo | ETEC / IF", robots: { index: false, follow: false } };
export default async function SavedResultPage({ searchParams }: { searchParams: Promise<{ review?: string }> }) {
  const { review } = await searchParams;
  return <Result saved initialReview={review === "errors" || review === "all" ? review : undefined} />;
}
