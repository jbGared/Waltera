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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Welcome Banner - Ultra moderne */}
        <div className="mb-16">
          <h1 className="text-5xl font-bold mb-3 text-gray-900 tracking-tight">
            Bonjour Jean-Baptiste
          </h1>
          <p className="text-xl text-gray-500 font-light">
            Bienvenue sur votre portail de services WALTERA
          </p>
        </div>

        {/* Services Grid 2x2 - Design ultra moderne */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {SERVICES.map((service) => {
            const IconComponent = iconMap[service.icon];
            return (
              <Link key={service.id} to={service.route}>
                <div className="group relative h-full">
                  {/* Glow effect on hover */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#407b85] to-[#5a9aa5] rounded-2xl opacity-0 group-hover:opacity-10 blur transition duration-300"></div>

                  <Card className="relative h-full p-10 border border-gray-200/60 bg-white rounded-2xl group-hover:border-[#407b85]/30 transition-all duration-300 cursor-pointer">
                    <div className="flex flex-col h-full">
                      <div className="mb-6">
                        {/* Icône moderne avec effet */}
                        <div className="relative w-16 h-16 mb-6">
                          <div className="absolute inset-0 bg-[#407b85]/5 rounded-2xl group-hover:bg-[#407b85]/10 transition-colors duration-300"></div>
                          <div className="relative w-full h-full flex items-center justify-center">
                            {IconComponent && <IconComponent className="w-8 h-8 text-[#407b85] group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />}
                          </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                          {service.title}
                        </h3>
                        <p className="text-gray-500 text-base font-light leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      {/* Call to action moderne */}
                      <div className="mt-auto pt-6 flex items-center text-[#407b85] text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                        <span>Accéder au service</span>
                        <ChevronRight className="w-4 h-4 ml-2" strokeWidth={2.5} />
                      </div>
                    </div>
                  </Card>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Admin Access - Style ultra moderne */}
        {isAdmin && (
          <Link to={ROUTES.ADMIN}>
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#407b85] to-[#5a9aa5] rounded-2xl opacity-0 group-hover:opacity-10 blur transition duration-300"></div>

              <Card className="relative p-8 border border-gray-200/60 bg-white rounded-2xl group-hover:border-[#407b85]/30 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-5">
                    <div className="relative w-14 h-14">
                      <div className="absolute inset-0 bg-[#407b85]/5 rounded-xl group-hover:bg-[#407b85]/10 transition-colors duration-300"></div>
                      <div className="relative w-full h-full flex items-center justify-center">
                        <Shield className="w-7 h-7 text-[#407b85]" strokeWidth={1.5} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">
                        Administration
                      </h3>
                      <p className="text-gray-500 text-sm font-light">
                        Gérez les utilisateurs de la plateforme
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#407b85] group-hover:translate-x-2 transition-all duration-300" strokeWidth={2.5} />
                </div>
              </Card>
            </div>
          </Link>
        )}
      </main>

      <Footer />
    </div>
  );
}
