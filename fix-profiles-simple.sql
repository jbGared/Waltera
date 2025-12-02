-- Solution simple : Policies RLS sans récursion

-- Supprimer toutes les policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Policy 1: Tout le monde peut lire tous les profils
-- (car pas de données sensibles, juste nom/prénom/rôle)
CREATE POLICY "Anyone can view profiles"
ON public.profiles FOR SELECT
USING (true);

-- Policy 2: Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- C'est tout ! Simple et efficace
-- L'admin check sera fait côté application
