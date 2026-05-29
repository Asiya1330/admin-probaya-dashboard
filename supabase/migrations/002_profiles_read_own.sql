-- Allow users to read their own profile (fixes login bootstrap)
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);
