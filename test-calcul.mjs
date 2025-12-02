#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://syxsacbciqwrahjdixuc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eHNhY2JjaXF3cmFoamRpeHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3NzksImV4cCI6MjA3MzYyMTc3OX0.jnVjgixHQOHOakT0zEMKJBFDQU9WEAbJHgQ6w6UD0-U';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧮 Test de calcul complet pour code postal 27730 (TNS)\n');

async function testCalcul() {
  const codePostal = '27730';
  const gamme = 'TNS_FORMULES';

  // Étape 1: Récupérer la zone
  console.log('Étape 1: Récupération de la zone...');
  console.log(`  Code postal: ${codePostal}`);
  console.log(`  Département: ${codePostal.substring(0, 2)}`);
  console.log(`  Gamme: ${gamme}`);
  console.log(`  Type zone: TNS\n`);

  const dept = codePostal.substring(0, 2);
  const { data: zoneData, error: zoneError } = await supabase
    .from('zones_sante')
    .select('code_zone')
    .eq('type_zone', 'TNS')
    .eq('departement', dept)
    .single();

  if (zoneError) {
    console.error('❌ Erreur récupération zone:', zoneError.message);
    console.error('   Code:', zoneError.code);
    console.error('   Details:', zoneError.details);
    return;
  }

  const zone = zoneData.code_zone;
  console.log(`✅ Zone trouvée: ${zone}\n`);

  // Étape 2: Déterminer le produit
  const commission = 15;
  const produit = `CONTRASSUR TNS 1228${commission === 10 ? '1' : commission === 15 ? '2' : '3'} RESPONSABLE`;
  console.log(`Étape 2: Produit déterminé`);
  console.log(`  Commission: ${commission}%`);
  console.log(`  Produit: ${produit}\n`);

  // Étape 3: Récupérer un tarif exemple
  console.log('Étape 3: Récupération d\'un tarif...');
  const { data: tarifData, error: tarifError } = await supabase
    .from('tarifs_sante')
    .select('*')
    .eq('gamme', gamme)
    .eq('produit', produit)
    .eq('zone', zone)
    .eq('qualite', 'Assuré')
    .eq('age', '45')
    .single();

  if (tarifError) {
    console.error('❌ Erreur récupération tarif:', tarifError.message);
    console.error('   Requête:');
    console.error(`     gamme = ${gamme}`);
    console.error(`     produit = ${produit}`);
    console.error(`     zone = ${zone}`);
    console.error(`     qualite = Assuré`);
    console.error(`     age = 45`);
    return;
  }

  console.log('✅ Tarif trouvé:', {
    option1: tarifData.option1,
    option2: tarifData.option2,
    option3: tarifData.option3,
    option4: tarifData.option4,
  });

  console.log('\n🎉 SUCCÈS: Le calcul complet fonctionne !');
}

testCalcul();
