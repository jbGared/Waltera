-- Correction des policies RLS pour éviter la récursion infinie

-- Supprimer toutes les policies existantes
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Policy 1: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy 3: Les admins peuvent voir tous les profils
-- CORRECTION: Utiliser auth.jwt()->>'is_admin' au lieu de faire un SELECT dans profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  (auth.jwt() ->> 'is_admin')::boolean = true
  OR auth.uid() = id
);

-- Policy 4: Les admins peuvent modifier tous les profils (pour la gestion)
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (
  (auth.jwt() ->> 'is_admin')::boolean = true
  OR auth.uid() = id
);

-- Vérifier les policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles';
