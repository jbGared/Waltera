import { Link } from 'react-router-dom';
import { MessageCircle, Clock, TrendingUp, ChevronRight, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useProfile } from '@/hooks/useProfile';
import { SERVICES, ROUTES } from '@/constants';

export default function Dashboard() {
  const { profile } = useProfile();

  // Vérifier si l'utilisateur est admin
  const isAdmin = profile?.is_admin === true;

  // Stats vides par défaut - à connecter avec Supabase
  const stats = [
    { label: 'Conversations totales', value: '-', icon: MessageCircle },
    { label: 'Aujourd\'hui', value: '-', icon: Clock },
    { label: 'Services disponibles', value: '4', icon: TrendingUp }, // 4 services réels
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl p-8 mb-8 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">
                Bonjour Jean-Baptiste 👋
              </h1>
              <p className="text-lg text-gray-700">
                Bienvenue sur votre portail de services WALTERA
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = [
              { bg: 'from-[#407b85] to-[#407b85]/80', icon: 'text-[#407b85]', ring: 'ring-[#407b85]/20' },
              { bg: 'from-green-500 to-green-600', icon: 'text-green-500', ring: 'ring-green-500/20' },
              { bg: 'from-purple-500 to-purple-600', icon: 'text-purple-500', ring: 'ring-purple-500/20' },
            ];
            const color = colors[index];

            return (
              <Card key={stat.label} className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group">
                {/* Gradient decoration */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color.bg} opacity-5 rounded-bl-full`}></div>

                <div className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${color.bg} shadow-md ring-2 ${color.ring} group-hover:scale-105 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Services Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Vos Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {SERVICES.map((service) => (
              <Link key={service.id} to={service.route}>
                <Card className="relative overflow-hidden rounded-2xl border-0 bg-white shadow-md group hover:shadow-2xl transition-all duration-500 cursor-pointer h-full">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 ${service.gradient} bg-gradient-to-br`}></div>

                  {/* Content */}
                  <div className="relative p-6 flex flex-col h-full">
                    {/* Header avec Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2.5 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-all duration-300">
                        <span className="text-xl opacity-70 group-hover:opacity-90 transition-opacity">{service.icon}</span>
                      </div>
                      <div className="p-1.5 rounded-full bg-gray-50 group-hover:bg-[#407b85] transition-all duration-300">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-lg mb-3 text-gray-900 group-hover:text-[#407b85] transition-colors duration-300">
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                      {service.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {service.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 group-hover:bg-[#407b85]/10 group-hover:text-[#407b85] transition-all duration-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Button */}
                    <Button className="w-full bg-gradient-to-r from-[#407b85] to-[#407b85]/80 hover:from-[#407b85]/90 hover:to-[#407b85]/70 text-white font-semibold shadow-md group-hover:shadow-lg transition-all duration-300">
                      <span>Accéder</span>
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>

                  {/* Decorative element */}
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-gray-50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#407b85]/5 via-transparent to-purple-500/5"></div>

          <div className="p-8 relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#407b85] to-[#407b85]/80 shadow-lg ring-4 ring-[#407b85]/20">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Accès Rapide
                  </h3>
                  <p className="text-gray-600">
                    Consultez l'historique de toutes vos conversations
                  </p>
                </div>
              </div>
              <Link to={ROUTES.CONVERSATIONS}>
                <Button className="bg-gradient-to-r from-[#407b85] to-[#407b85]/80 hover:from-[#407b85]/90 hover:to-[#407b85]/70 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 px-6">
                  Voir l'historique
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#407b85]/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
        </Card>

        {/* Admin Access (uniquement pour les admins) */}
        {isAdmin && (
          <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group mt-6">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5"></div>

            <div className="p-8 relative">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg ring-4 ring-yellow-500/20">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Administration
                    </h3>
                    <p className="text-gray-600">
                      Gérez les utilisateurs de la plateforme
                    </p>
                  </div>
                </div>
                <Link to={ROUTES.ADMIN}>
                  <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 px-6">
                    Gérer les utilisateurs
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-3xl"></div>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
