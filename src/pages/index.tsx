import {useState} from 'react';
import {useSession, signIn} from 'next-auth/react';

export default function Home() {
  const {data: session, status} = useSession();
  const [username, setUsername] = useState('');

  const handleSubmit = () => {
    signIn('credentials', {username, redirect: false});
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-8">Todo App</h1>
        {status === 'authenticated' && session?.user?.name && (
          <p className="text-center text-lg">Welcome, {session.user.name}</p>
        )}
        {status === 'unauthenticated' && (
          <form
            aria-label="Login form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            <input
              aria-label="Username input"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="w-full px-4 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
