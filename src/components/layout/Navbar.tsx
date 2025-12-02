import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, MessageSquare, LogOut } from 'lucide-react';
import { APP_CONFIG, ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Récupérer les initiales de l'utilisateur
  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  // Récupérer le nom complet
  const getFullName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || 'Utilisateur';
  };

  // Récupérer le rôle
  const getRole = () => {
    return profile?.role || 'Consultant';
  };

  const navItems = [
    { icon: FileText, label: 'Tableau de bord', path: ROUTES.DASHBOARD },
    { icon: MessageSquare, label: 'Historique', path: ROUTES.CONVERSATIONS },
  ];

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#407b85] to-[#407b85]/90 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={ROUTES.DASHBOARD} className="flex items-center">
              <img
                src={APP_CONFIG.logoHeader}
                alt="WALTERA"
                className="h-12 w-auto"
                onError={(e) => {
                  // Fallback si le logo local n'est pas trouvé
                  e.currentTarget.src = APP_CONFIG.logoFooter;
                }}
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 inline mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="flex items-center space-x-4">
            {/* User info - clickable pour aller au profil */}
            <Link to={ROUTES.PROFILE} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <span className="relative flex shrink-0 overflow-hidden rounded-full h-8 w-8 ring-2 ring-white/30">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-[#407b85] text-xs font-bold">
                    {getInitials()}
                  </span>
                )}
              </span>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white">{getFullName()}</p>
                <p className="text-xs text-white/70">{getRole()}</p>
              </div>
            </Link>

            {/* Logout button */}
            <Button
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
