#!/usr/bin/env node

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://syxsacbciqwrahjdixuc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eHNhY2JjaXF3cmFoamRpeHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA0NTc3OSwiZXhwIjoyMDczNjIxNzc5fQ.2_3iBqTlgwrTmeDLPU8NscvfLZIsCJ7aZnY8ltof5_4';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('🔄 Migration de la table profiles...\n');

async function migrate() {
  try {
    // Lire le fichier SQL
    const sql = readFileSync('./create_profiles_table.sql', 'utf8');

    // Note: L'API Supabase ne permet pas d'exécuter du SQL arbitraire
    // Vous devez exécuter ce SQL manuellement dans Supabase Dashboard

    console.log('📝 Veuillez copier et exécuter ce SQL dans Supabase Dashboard :');
    console.log('=' .repeat(80));
    console.log(sql);
    console.log('=' .repeat(80));
    console.log('\n✅ Instructions :');
    console.log('1. Allez sur https://syxsacbciqwrahjdixuc.supabase.co');
    console.log('2. Cliquez sur "SQL Editor"');
    console.log('3. Collez le SQL ci-dessus');
    console.log('4. Cliquez "Run" (ou Ctrl+Enter)');
    console.log('\n🎯 Cela va :');
    console.log('   - Supprimer l\'ancienne table profiles');
    console.log('   - Créer la nouvelle avec la bonne structure');
    console.log('   - Configurer les policies RLS');
    console.log('   - Créer le trigger pour auto-création');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

migrate();
