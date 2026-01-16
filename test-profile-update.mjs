#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://syxsacbciqwrahjdixuc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eHNhY2JjaXF3cmFoamRpeHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3NzksImV4cCI6MjA3MzYyMTc3OX0.jnVjgixHQOHOakT0zEMKJBFDQU9WEAbJHgQ6w6UD0-U';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

console.log('🧪 Test de lecture/écriture table profiles\n');

async function testProfiles() {
  try {
    // Test 1: Lire les profils avec clé ANON
    console.log('1️⃣ Test lecture profiles...');
    const { data: profiles, error: readError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);

    if (readError) {
      console.error('❌ Erreur lecture:', readError.message);
      console.error('   Code:', readError.code);
      console.error('   Details:', readError.details);
    } else {
      console.log(`✅ ${profiles?.length || 0} profils trouvés`);
      if (profiles && profiles.length > 0) {
        console.log('   Exemple:', profiles[0]);
      }
    }

    // Test 2: Tester l'update (nécessite d'être connecté)
    console.log('\n2️⃣ Pour tester l\'update, il faut être connecté');
    console.log('   → Testez directement dans l\'application');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testProfiles();
