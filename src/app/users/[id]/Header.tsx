export function Header({ id }: { id: string }) {
  return (
    <div className="flex text-4xl flex-col items-center justify-between p-4">
      User {id}
    </div>
  );
}
