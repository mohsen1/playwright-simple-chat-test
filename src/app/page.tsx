import Head from "next/head";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Head>
        <title>Simple Chat App</title>
      </Head>
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1>
          <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            Simple Chat App
          </span>
        </h1>
        <div className="flex flex-col my-10">
          <a href="/users/1">Login as user 1</a>
        </div>
        <div className="flex flex-col my-10">
          <a href="/users/2">Login as user 2</a>
        </div>
      </div>
    </main>
  );
}
