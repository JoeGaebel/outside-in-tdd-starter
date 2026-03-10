import {useState} from 'react';
import {useSession, signIn} from 'next-auth/react';

export default function Home() {
  const {data: session, status} = useSession();
  const [username, setUsername] = useState('');

  const handleSubmit = () => {
    signIn('credentials', {username, redirect: false});
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Todo App</h1>
      {status === 'authenticated' && session?.user?.name && (
        <p>Welcome, {session.user.name}</p>
      )}
      {status === 'unauthenticated' && (
        <form
          aria-label="Login form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <input
            aria-label="Username input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button type="submit">Sign In</button>
        </form>
      )}
    </main>
  );
}
