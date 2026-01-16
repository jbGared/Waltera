import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const LOADING_MESSAGES = [
  // Phase 1 : Démarrage
  "Démarrage de l'analyse...",
  "Initialisation des algorithmes...",
  "Connexion aux serveurs d'analyse...",

  // Phase 2 : Exploration
  "Exploration de votre réseau de fichiers...",
  "Cartographie de votre infrastructure documentaire...",
  "Analyse des relations entre vos documents...",
  "Identification des flux d'information...",
  "Détection des silos documentaires...",

  // Phase 3 : Analyse
  "Analyse de la cohérence des données...",
  "Évaluation de l'efficacité du système RAG...",
  "Recherche d'opportunités d'optimisation...",
  "Identification des doublons et redondances...",
  "Analyse des métadonnées...",
  "Calcul des métriques de performance...",

  // Phase 4 : Recommandations
  "Génération des recommandations...",
  "Élaboration du plan d'optimisation...",
  "Priorisation des actions correctives...",
  "Évaluation du potentiel d'amélioration...",

  // Phase 5 : Création du rapport
  "Création de votre présentation Gamma...",
  "Structuration du rapport d'analyse...",
  "Génération des graphiques...",
  "Mise en forme des résultats...",
  "Compilation des recommandations...",

  // Phase 6 : Finalisation
  "Finalisation du document...",
  "Génération du PDF exportable...",
  "Dernières vérifications...",

  // Messages humoristiques
  "On dirait que vos fichiers ont beaucoup de choses à se dire...",
  "Vos documents sont en pleine discussion... 🗂️",
  "Analyse en cours... Café recommandé ☕",
  "Notre IA lit vos fichiers plus vite que vous !",
  "Patience... Rome ne s'est pas optimisée en un jour !",
  "Même l'IA a besoin de temps pour réfléchir... 🤔",
  "Votre réseau se dévoile peu à peu...",
  "L'algorithme fait des heures sup' pour vous !",
  "Analyse approfondie... Très approfondie... Vraiment très approfondie...",
  "On compte les octets... Un par un... 😅",
];

interface AnalyseLoaderProps {
  className?: string;
}

export default function AnalyseLoader({ className = '' }: AnalyseLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [usedMessages, setUsedMessages] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Sélectionner un message aléatoire au démarrage
    const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
    setCurrentMessage(LOADING_MESSAGES[randomIndex]);
    setUsedMessages(new Set([randomIndex]));

    // Changer de message avec un intervalle variable (3-7 secondes)
    const changeMessage = () => {
      const nextInterval = 3000 + Math.random() * 4000; // 3-7 secondes

      setTimeout(() => {
        let availableIndices = Array.from({ length: LOADING_MESSAGES.length }, (_, i) => i);

        // Si tous les messages ont été utilisés, reset
        if (usedMessages.size >= LOADING_MESSAGES.length - 3) {
          setUsedMessages(new Set());
        } else {
          // Filtrer les messages déjà utilisés
          availableIndices = availableIndices.filter(i => !usedMessages.has(i));
        }

        // Sélectionner un message aléatoire parmi les disponibles
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        setCurrentMessage(LOADING_MESSAGES[randomIndex]);
        setUsedMessages(prev => new Set([...prev, randomIndex]));

        changeMessage(); // Récursion pour continuer
      }, nextInterval);
    };

    changeMessage();

    // Compter le temps écoulé
    const timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`text-center py-8 ${className}`}>
      {/* Loader circulaire animé */}
      <div className="relative inline-block mb-8">
        <Loader2 className="w-20 h-20 animate-spin text-[#407b85]" />
        <div className="absolute inset-0 w-20 h-20 border-4 border-[#407b85]/10 rounded-full"></div>
      </div>

      {/* Message rotatif avec animation de fondu */}
      <div className="min-h-[80px] flex items-center justify-center px-4">
        <p
          key={currentMessage}
          className="text-lg font-medium text-gray-700 animate-fade-in max-w-lg"
        >
          {currentMessage}
        </p>
      </div>

      {/* Informations supplémentaires */}
      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-center space-x-3">
          <p className="text-sm text-gray-500">Temps écoulé :</p>
          <p className="font-mono text-xl font-bold text-[#407b85]">{formatTime(elapsedTime)}</p>
        </div>

        <p className="text-xs text-gray-400">
          L'analyse peut prendre jusqu'à 5 minutes ⏱️
        </p>
      </div>

      {/* Points d'attente animés */}
      <div className="mt-6 flex justify-center space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-[#407b85] rounded-full animate-pulse"
            style={{
              animationDelay: `${i * 0.3}s`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}
