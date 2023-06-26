export function Header({ id }: { id: string }) {
  return (
    <div className="flex flex-col items-center justify-between p-4">
      <div className="text-4xl ">Simple Chat App</div>
      <div>
        logged in as <span className="font-bold">user {id}</span>
      </div>
    </div>
  );
}
