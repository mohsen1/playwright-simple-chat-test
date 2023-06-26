import { Header } from "./Header";
import { Input } from "./Input";
import { Messages } from "./Messages";

export default function UserPage({ params }: { params: { id: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 max-h-screen">
      <Header id={params.id} />
      <Messages id={params.id} />
      <Input id={params.id} />
    </main>
  );
}
