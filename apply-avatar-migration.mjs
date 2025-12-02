import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://djxbhqoswgmgogefqlra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeGJocW9zd2dtZ29nZWZxbHJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDM2MzY0NiwiZXhwIjoyMDQ1OTM5NjQ2fQ.HlQKdPJXLiAVEbV4kJ36kBHHtSKOtQXRLGMhTG_pNB0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('📦 Application de la migration avatar...\n');

  try {
    // Lire le fichier de migration
    const migrationSQL = readFileSync(
      './supabase/migrations/20251202100000_add_avatar_to_profiles.sql',
      'utf8'
    );

    console.log('📄 Migration SQL chargée');
    console.log('🔧 Application de la migration...\n');

    // Exécuter la migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: migrationSQL
    });

    if (error) {
      console.error('❌ Erreur lors de l\'application de la migration:', error);

      // Essayer une approche alternative : exécuter les commandes une par une
      console.log('\n🔄 Tentative avec approche alternative...\n');

      // Ajouter le champ avatar_url
      console.log('1️⃣ Ajout du champ avatar_url...');
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql_string: `
          ALTER TABLE public.profiles
          ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        `
      });

      if (alterError) {
        console.error('❌ Erreur ALTER TABLE:', alterError);
        console.log('\n⚠️  Veuillez appliquer la migration manuellement via Supabase Dashboard');
        console.log('📋 Étapes :');
        console.log('1. Aller sur https://supabase.com/dashboard/project/djxbhqoswgmgogefqlra/sql');
        console.log('2. Copier le contenu de supabase/migrations/20251202100000_add_avatar_to_profiles.sql');
        console.log('3. Coller et exécuter la requête');
        console.log('4. Vérifier que le bucket "avatars" est créé dans Storage\n');
        process.exit(1);
      } else {
        console.log('✅ Champ avatar_url ajouté avec succès');
      }

      console.log('\n⚠️  La création du bucket et des politiques doit être faite manuellement');
      console.log('📋 Étapes restantes :');
      console.log('1. Aller sur https://supabase.com/dashboard/project/djxbhqoswgmgogefqlra/storage/buckets');
      console.log('2. Créer un nouveau bucket "avatars" avec :');
      console.log('   - Public : Oui');
      console.log('   - File size limit : 2097152 (2MB)');
      console.log('   - Allowed MIME types : image/jpeg, image/png, image/webp, image/gif');
      console.log('3. Configurer les politiques RLS (voir AVATAR_UPLOAD_README.md)\n');

    } else {
      console.log('✅ Migration appliquée avec succès!\n');
      console.log('📋 Vérifications à effectuer :');
      console.log('1. Le champ avatar_url a été ajouté à la table profiles');
      console.log('2. Le bucket "avatars" est créé dans Storage');
      console.log('3. Les politiques RLS sont actives\n');
    }

    // Vérifier que le champ a été ajouté
    console.log('🔍 Vérification de la table profiles...');
    const { data: profiles, error: selectError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .limit(1);

    if (selectError) {
      console.log('⚠️  Impossible de vérifier le champ avatar_url');
      console.log('Erreur:', selectError.message);
    } else {
      console.log('✅ Le champ avatar_url est accessible\n');
    }

    console.log('✨ Migration terminée!\n');
    console.log('📖 Consultez AVATAR_UPLOAD_README.md pour plus d\'informations');

  } catch (err) {
    console.error('❌ Erreur inattendue:', err);
    process.exit(1);
  }
}

applyMigration();
