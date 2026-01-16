import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://djxbhqoswgmgogefqlra.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeGJocW9zd2dtZ29nZWZxbHJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDM2MzY0NiwiZXhwIjoyMDQ1OTM5NjQ2fQ.HlQKdPJXLiAVEbV4kJ36kBHHtSKOtQXRLGMhTG_pNB0';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔍 Test de connexion à Supabase...\n');

// Test simple : vérifier la table profiles
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(1);

if (error) {
  console.error('❌ Erreur de connexion:', error);
  console.log('\n⚠️  Impossible de se connecter à Supabase via l\'API REST');
  console.log('\n📋 Migration manuelle requise :');
  console.log('');
  console.log('1️⃣ Ouvrir Supabase Dashboard :');
  console.log('   https://supabase.com/dashboard/project/djxbhqoswgmgogefqlra/editor');
  console.log('');
  console.log('2️⃣ Aller dans SQL Editor :');
  console.log('   https://supabase.com/dashboard/project/djxbhqoswgmgogefqlra/sql/new');
  console.log('');
  console.log('3️⃣ Copier et exécuter cette requête :');
  console.log('');
  console.log('-- Ajouter le champ avatar_url');
  console.log('ALTER TABLE public.profiles');
  console.log('ADD COLUMN IF NOT EXISTS avatar_url TEXT;');
  console.log('');
  console.log('4️⃣ Créer le bucket Storage :');
  console.log('   https://supabase.com/dashboard/project/djxbhqoswgmgogefqlra/storage/buckets');
  console.log('');
  console.log('   - Nom : avatars');
  console.log('   - Public : ✅ Oui');
  console.log('   - File size limit : 2097152 (2MB)');
  console.log('   - Allowed MIME types : image/jpeg, image/png, image/webp, image/gif');
  console.log('');
  console.log('5️⃣ Configurer les politiques RLS (voir le fichier de migration complet)');
  console.log('');
  console.log('📄 Fichier de migration complet :');
  console.log('   supabase/migrations/20251202100000_add_avatar_to_profiles.sql');
  console.log('');
} else {
  console.log('✅ Connexion réussie!');
  console.log(`📊 ${data?.length || 0} profil(s) trouvé(s)\n`);

  // Vérifier si le champ avatar_url existe déjà
  const firstProfile = data?.[0];
  if (firstProfile && 'avatar_url' in firstProfile) {
    console.log('✅ Le champ avatar_url existe déjà dans la table profiles\n');
  } else {
    console.log('⚠️  Le champ avatar_url n\'existe pas encore\n');
    console.log('📋 Veuillez appliquer la migration manuellement via Supabase Dashboard');
    console.log('Voir les instructions ci-dessus\n');
  }

  console.log('📋 Étapes suivantes :');
  console.log('1. Vérifier que le bucket "avatars" existe dans Storage');
  console.log('2. Configurer les politiques RLS (voir AVATAR_UPLOAD_README.md)');
  console.log('3. Tester l\'upload d\'avatar sur la page Profil\n');
}
