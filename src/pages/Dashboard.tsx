import { Link } from 'react-router-dom';
import { MessageCircle, ChevronRight, Shield, FileText, FolderTree, BookOpen, BarChart3, Calculator } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useProfile } from '@/hooks/useProfile';
import { SERVICES, ROUTES } from '@/constants';

// Map des icônes
const iconMap: Record<string, any> = {
  'FileText': FileText,
  'BookOpen': BookOpen,
  'BarChart3': BarChart3,
  'Calculator': Calculator,
};

export default function Dashboard() {
  const { profile } = useProfile();

  // Vérifier si l'utilisateur est admin
  const isAdmin = profile?.is_admin === true;

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

        {/* Services Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Vos Services</h2>
          <div className="space-y-6">
            {SERVICES.map((service) => {
              const IconComponent = iconMap[service.icon];
              return (
                <Card key={service.id} className="relative overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-500 group hover-lift cursor-pointer animate-fade-in">
                  <div className={`absolute inset-0 ${service.gradient} bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>

                  <div className="p-8 relative">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`p-4 rounded-2xl ${service.gradient} bg-gradient-to-br shadow-lg ring-4 ring-${service.color.replace('#', '')}/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                          {IconComponent && <IconComponent className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-500" />}
                        </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {service.title}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {service.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {service.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 group-hover:bg-[#407b85]/10 group-hover:text-[#407b85] transition-all duration-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Link to={service.route}>
                      <Button className="bg-gradient-to-r from-[#407b85] to-[#407b85]/80 hover:from-[#407b85]/90 hover:to-[#407b85]/70 text-white font-semibold shadow-md hover:shadow-xl transition-all duration-300 px-6 hover-scale">
                        Accéder
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#407b85]/10 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
              </Card>
              );
            })}
          </div>
        </div>

        {/* Admin Access (uniquement pour les admins) */}
        {isAdmin && (
          <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-500 group hover-lift cursor-pointer mt-6 animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5 group-hover:from-yellow-500/10 group-hover:to-orange-500/10 transition-all duration-500"></div>

            <div className="p-8 relative">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg ring-4 ring-yellow-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Shield className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-500" />
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
                  <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-md hover:shadow-xl transition-all duration-300 px-6 hover-scale">
                    Gérer les utilisateurs
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
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
