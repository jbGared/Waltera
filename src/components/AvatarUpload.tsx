import { useState, useRef } from 'react';
import { Camera, Loader2, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadAvatar, deleteAvatar } from '@/services/profiles';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  userInitials: string;
  onAvatarChange: () => void;
}

export default function AvatarUpload({
  currentAvatarUrl,
  userInitials,
  onAvatarChange,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format non autorisé. Utilisez JPG, PNG, WEBP ou GIF.');
      return;
    }

    // Vérifier la taille (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setError('Fichier trop volumineux. Maximum 2MB.');
      return;
    }

    // Afficher la prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Uploader le fichier
    setIsUploading(true);
    try {
      const avatarUrl = await uploadAvatar(file);
      if (avatarUrl) {
        onAvatarChange(); // Notifier le parent pour recharger le profil
        setPreviewUrl(null);
      } else {
        setError('Erreur lors de l\'upload. Veuillez réessayer.');
        setPreviewUrl(null);
      }
    } catch (err) {
      setError('Erreur lors de l\'upload. Veuillez réessayer.');
      setPreviewUrl(null);
      console.error('Erreur upload:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentAvatarUrl) return;

    setIsDeleting(true);
    setError(null);

    try {
      const success = await deleteAvatar();
      if (success) {
        onAvatarChange(); // Notifier le parent pour recharger le profil
      } else {
        setError('Erreur lors de la suppression. Veuillez réessayer.');
      }
    } catch (err) {
      setError('Erreur lors de la suppression. Veuillez réessayer.');
      console.error('Erreur suppression:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="text-center">
      {/* Avatar avec overlay de chargement */}
      <div className="relative inline-block mb-4">
        {/* Avatar actuel ou initiales */}
        {currentAvatarUrl || previewUrl ? (
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img
              src={previewUrl || currentAvatarUrl || ''}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full bg-[#407b85] flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
            {userInitials}
          </div>
        )}

        {/* Overlay de chargement */}
        {(isUploading || isDeleting) && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Bouton Camera */}
        <button
          onClick={handleCameraClick}
          disabled={isUploading || isDeleting}
          className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Changer la photo"
        >
          <Camera className="w-4 h-4 text-gray-600" />
        </button>

        {/* Bouton Supprimer (si avatar existe) */}
        {currentAvatarUrl && !isUploading && !isDeleting && (
          <button
            onClick={handleDelete}
            className="absolute top-0 right-0 p-1.5 bg-red-500 rounded-full shadow-lg hover:bg-red-600 transition-colors"
            title="Supprimer la photo"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        )}
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Message d'erreur */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 max-w-xs mx-auto">
          {error}
        </div>
      )}

      {/* Instructions */}
      {!currentAvatarUrl && !isUploading && (
        <div className="mt-2">
          <Button
            onClick={handleCameraClick}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Upload className="w-3 h-3 mr-1" />
            Ajouter une photo
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG, WEBP ou GIF • Max 2MB
          </p>
        </div>
      )}
    </div>
  );
}
