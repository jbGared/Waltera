#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://syxsacbciqwrahjdixuc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eHNhY2JjaXF3cmFoamRpeHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3NzksImV4cCI6MjA3MzYyMTc3OX0.jnVjgixHQOHOakT0zEMKJBFDQU9WEAbJHgQ6w6UD0-U';

// Utiliser la clé ANON comme dans le frontend
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 Test avec clé ANON (comme frontend)\n');

async function testWithAnonKey() {
  // Test 1: zones_sante avec clé ANON
  console.log('Test 1: Lecture zones_sante...');
  const { data: zonesData, error: zonesError } = await supabase
    .from('zones_sante')
    .select('*')
    .limit(5);

  if (zonesError) {
    console.error('❌ ERREUR:', zonesError);
    console.log('Message:', zonesError.message);
    console.log('Details:', zonesError.details);
    console.log('Hint:', zonesError.hint);
  } else {
    console.log('✅ Zones trouvées:', zonesData?.length || 0);
    if (zonesData && zonesData.length > 0) {
      console.log('Exemple:', zonesData[0]);
    }
  }
  console.log('');

  // Test 2: Chercher Paris avec clé ANON
  console.log('Test 2: Chercher Paris (75) pour SENIORS...');
  const { data: parisData, error: parisError } = await supabase
    .from('zones_sante')
    .select('*')
    .eq('type_zone', 'SENIORS')
    .eq('departement', '75')
    .single();

  if (parisError) {
    console.error('❌ ERREUR:', parisError);
    console.log('Code:', parisError.code);
    console.log('Message:', parisError.message);
  } else {
    console.log('✅ Paris trouvé:', parisData);
  }
  console.log('');

  // Test 3: tarifs_sante avec clé ANON
  console.log('Test 3: Lecture tarifs_sante...');
  const { data: tarifsData, error: tarifsError } = await supabase
    .from('tarifs_sante')
    .select('*')
    .limit(1);

  if (tarifsError) {
    console.error('❌ ERREUR:', tarifsError);
    console.log('Message:', tarifsError.message);
  } else {
    console.log('✅ Tarifs accessibles:', tarifsData?.length || 0);
    if (tarifsData && tarifsData.length > 0) {
      console.log('Exemple:', tarifsData[0]);
    }
  }
  console.log('');

  // Résumé
  console.log('📊 RÉSUMÉ:');
  if (zonesError || parisError || tarifsError) {
    console.log('❌ Des erreurs ont été détectées');
    console.log('   → Les policies RLS ne sont peut-être pas correctement configurées');
    console.log('   → Vérifiez que vous avez bien exécuté le script SQL');
  } else {
    console.log('✅ Tout fonctionne !');
    console.log('   → Le tarificateur devrait fonctionner dans le navigateur');
  }
}

testWithAnonKey();
