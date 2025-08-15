import ClientGameView from "./ClientGameView"

export default function GamePage({ params }: { params: { slug: string } }) {
  return <ClientGameView slug={params.slug} />
}
