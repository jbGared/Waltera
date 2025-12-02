import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Bouton "Retour en haut" qui apparaît après 200px de scroll
 */
export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-[#407b85] to-[#407b85]/80 hover:from-[#407b85]/90 hover:to-[#407b85]/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 p-0"
      aria-label="Retour en haut"
    >
      <ChevronUp className="w-6 h-6" />
    </Button>
  );
}
