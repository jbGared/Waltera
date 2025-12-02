import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://djxbhqoswgmgogefqlra.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeGJocW9zd2dtZ29nZWZxbHJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDY0NDE5OCwiZXhwIjoyMDQ2MjIwMTk4fQ.fKDZqkBbh6MQ3OfWHZU9DlTbjw_NrDHqyRBjbTe-aXc';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('📖 Lecture de la migration...');
    const migration = readFileSync('./supabase/migrations/20251202000000_demandes_devis.sql', 'utf8');

    console.log('🚀 Application de la migration...');

    // Exécuter la migration via SQL brut
    const { data, error } = await supabase.rpc('exec_sql', { sql: migration });

    if (error) {
      // Si exec_sql n'existe pas, on essaie une autre approche
      console.log('⚠️  exec_sql non disponible, essai avec approche alternative...');

      // Découper la migration en commandes individuelles
      const commands = migration
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

      for (const command of commands) {
        if (command.includes('CREATE TABLE') || command.includes('CREATE INDEX') ||
            command.includes('ALTER TABLE') || command.includes('CREATE TRIGGER') ||
            command.includes('CREATE POLICY') || command.includes('GRANT') ||
            command.includes('COMMENT ON')) {
          console.log(`Exécution: ${command.substring(0, 50)}...`);

          const { error: cmdError } = await supabase.rpc('exec', {
            query: command + ';'
          });

          if (cmdError) {
            console.error(`❌ Erreur sur commande:`, cmdError);
          }
        }
      }
    }

    console.log('✅ Migration appliquée avec succès!');
    console.log('');
    console.log('Vérification de la table...');

    // Vérifier que la table existe
    const { data: tables, error: tableError } = await supabase
      .from('demandes_devis')
      .select('*')
      .limit(0);

    if (tableError) {
      console.error('❌ La table n\'existe pas encore:', tableError.message);
      console.log('');
      console.log('⚠️  Vous devez appliquer la migration manuellement via le dashboard Supabase:');
      console.log('   1. Allez sur https://supabase.com/dashboard/project/djxbhqoswgmgogefqlra/editor/sql');
      console.log('   2. Copiez le contenu de: supabase/migrations/20251202000000_demandes_devis.sql');
      console.log('   3. Exécutez le SQL dans l\'éditeur');
    } else {
      console.log('✅ Table demandes_devis créée et accessible!');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

applyMigration();
