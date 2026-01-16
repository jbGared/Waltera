import React from 'react';
import { ExternalLink } from 'lucide-react';

interface LinkPreviewCardProps {
  url: string;
  title?: string;
  description?: string;
  className?: string;
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({
  url,
  title,
  description,
  className = ''
}) => {
  // Extraire le domaine de l'URL
  const getDomain = (urlString: string) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return urlString;
    }
  };

  // Générer un titre par défaut si non fourni
  const displayTitle = title || getDomain(url);

  // Tronquer la description si elle est trop longue
  const displayDescription = description
    ? (description.length > 120 ? description.substring(0, 120) + '...' : description)
    : url;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-[#407b85] transition-colors group ${className}`}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate group-hover:text-[#407b85] transition-colors">
              {displayTitle}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
              {displayDescription}
            </p>
            <div className="flex items-center gap-1 text-xs text-[#407b85]">
              <ExternalLink size={12} />
              <span className="truncate">{getDomain(url)}</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
};

// Fonction utilitaire pour détecter et extraire les URLs d'un texte
export const extractUrls = (text: string): { url: string; start: number; end: number }[] => {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
  const matches: { url: string; start: number; end: number }[] = [];
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    matches.push({
      url: match[1],
      start: match.index,
      end: match.index + match[1].length
    });
  }

  return matches;
};

// Composant pour afficher un texte avec des liens convertis en cards
interface MessageWithLinksProps {
  content: string;
  className?: string;
}

export const MessageWithLinks: React.FC<MessageWithLinksProps> = ({
  content,
  className = ''
}) => {
  const urls = extractUrls(content);

  if (urls.length === 0) {
    return <div className={className}>{content}</div>;
  }

  // Diviser le contenu en segments (texte et URLs)
  const segments: Array<{ type: 'text' | 'url'; content: string }> = [];
  let lastIndex = 0;

  urls.forEach(({ url, start, end }) => {
    // Ajouter le texte avant l'URL
    if (start > lastIndex) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex, start)
      });
    }

    // Ajouter l'URL
    segments.push({
      type: 'url',
      content: url
    });

    lastIndex = end;
  });

  // Ajouter le texte restant après la dernière URL
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }

  return (
    <div className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return (
            <span key={index} className="whitespace-pre-wrap">
              {segment.content}
            </span>
          );
        } else {
          return (
            <LinkPreviewCard
              key={index}
              url={segment.content}
              className="my-2"
            />
          );
        }
      })}
    </div>
  );
};
