import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DevisForm from '@/components/DevisForm';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function Tarificateur() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-[#407b85] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tarificateur Santé</h1>
          <p className="text-gray-600">
            Calculez en temps réel le tarif d'un contrat de complémentaire santé individuelle
          </p>
        </div>

        <DevisForm />
      </main>

      <Footer />
    </div>
  );
}
