import { ExternalLink } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto">
      {/* Top border gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">WALTERA</span>
              <span className="text-border">|</span>
              <span>Conseil & Assurances</span>
              <span className="hidden sm:inline text-border">-</span>
              <span className="hidden sm:inline">{currentYear}</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              <a
                href="https://waltera.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                <span>waltera.fr</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

          {/* Version badge - subtle */}
          <div className="flex justify-center mt-6">
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
              Portail v1.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
