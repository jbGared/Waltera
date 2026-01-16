import { supabase } from '@/integrations/supabase/client';

/**
 * Script de test pour vérifier les données Supabase
 */
export async function testSupabaseConnection() {
  console.log('=== TEST CONNEXION SUPABASE ===');

  try {
    // Test 1: Connexion générale
    const { data: _testData, error: testError } = await supabase
      .from('zones_sante')
      .select('count');

    if (testError) {
      console.error('❌ Erreur de connexion:', testError);
      return;
    }

    console.log('✅ Connexion Supabase OK');

    // Test 2: Compter les zones
    const { count: zonesCount, error: zonesError } = await supabase
      .from('zones_sante')
      .select('*', { count: 'exact', head: true });

    if (zonesError) {
      console.error('❌ Erreur zones:', zonesError);
    } else {
      console.log(`✅ Zones: ${zonesCount} lignes`);
    }

    // Test 3: Compter les tarifs
    const { count: tarifsCount, error: tarifsError } = await supabase
      .from('tarifs_sante')
      .select('*', { count: 'exact', head: true });

    if (tarifsError) {
      console.error('❌ Erreur tarifs:', tarifsError);
    } else {
      console.log(`✅ Tarifs: ${tarifsCount} lignes`);
    }

    // Test 4: Chercher Paris (75) pour SENIORS
    const { data: parisData, error: parisError } = await supabase
      .from('zones_sante')
      .select('*')
      .eq('type_zone', 'SENIORS')
      .eq('departement', '75');

    if (parisError) {
      console.error('❌ Erreur Paris:', parisError);
    } else {
      console.log('✅ Paris (75) SENIORS:', parisData);
    }

    // Test 5: Chercher département 27 pour TNS
    const { data: dept27Data, error: dept27Error } = await supabase
      .from('zones_sante')
      .select('*')
      .eq('type_zone', 'TNS')
      .eq('departement', '27');

    if (dept27Error) {
      console.error('❌ Erreur Eure (27):', dept27Error);
    } else {
      console.log('✅ Eure (27) TNS:', dept27Data);
    }

    // Test 6: Lister tous les types de zones disponibles
    const { data: typesData, error: typesError } = await supabase
      .from('zones_sante')
      .select('type_zone')
      .limit(10);

    if (typesError) {
      console.error('❌ Erreur types:', typesError);
    } else {
      const types = [...new Set(typesData?.map(d => (d as any).type_zone))];
      console.log('✅ Types de zones disponibles:', types);
    }

    // Test 7: Lister quelques exemples de zones
    const { data: examplesData, error: examplesError } = await supabase
      .from('zones_sante')
      .select('*')
      .limit(10);

    if (examplesError) {
      console.error('❌ Erreur exemples:', examplesError);
    } else {
      console.log('✅ Exemples de zones:', examplesData);
    }

  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

// Exporter pour utilisation dans la console
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testSupabaseConnection;
}
