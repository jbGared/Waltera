import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Composant qui scroll automatiquement en haut de la page
 * à chaque changement de route
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant' as ScrollBehavior, // Instantané pour éviter les animations bizarres
    });
  }, [pathname]);

  return null;
}
