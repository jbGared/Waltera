import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
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

  // Recuperer les initiales de l'utilisateur
  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  // Recuperer le nom complet
  const getFullName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || 'Utilisateur';
  };

  // Recuperer le role
  const getRole = () => {
    return profile?.role || 'Consultant';
  };

  const navItems: Array<{ icon: any; label: string; path: string }> = [];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glassmorphism navbar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link
                to={ROUTES.DASHBOARD}
                className="flex items-center group transition-opacity hover:opacity-80"
              >
                <img
                  src={APP_CONFIG.logoHeader}
                  alt="WALTERA"
                  className="h-12 w-auto"
                  onError={(e) => {
                    e.currentTarget.src = APP_CONFIG.logoFooter;
                  }}
                />
              </Link>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      relative px-4 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200
                      ${isActive
                        ? 'text-primary bg-primary/8'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User section */}
            <div className="flex items-center gap-3">
              {/* User info - clickable pour aller au profil */}
              <Link
                to={ROUTES.PROFILE}
                className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-muted/60 transition-colors duration-200 group"
              >
                {/* Avatar */}
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/10 group-hover:ring-primary/25 transition-all"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/10 group-hover:ring-primary/25 transition-all">
                      <span className="text-sm font-semibold text-primary">
                        {getInitials()}
                      </span>
                    </div>
                  )}
                  {/* Status indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                </div>

                {/* User info text */}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {getFullName()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getRole()}
                  </p>
                </div>

                <ChevronDown className="hidden sm:block w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>

              {/* Divider */}
              <div className="h-6 w-px bg-border/60" />

              {/* Logout button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg px-3"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
