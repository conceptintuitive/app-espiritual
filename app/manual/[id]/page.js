'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ManualPage() {
  const params = useParams();
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <Link href="/" className="text-blue-400 hover:text-blue-300">
        ← Voltar para Home
      </Link>
      <h1 className="text-4xl font-bold mt-8 mb-4">Manual dos Poderes Ocultos</h1>
      <p className="text-xl">ID da análise: {params.id}</p>
      <p className="mt-4 text-gray-300">Página do manual em construção...</p>
    </div>
  );
}