-- Migration: Login flow - company selectie bij registratie
-- Maakt het mogelijk dat nieuwe users zichzelf aan een bedrijf koppelen

-- Companies moeten leesbaar zijn op de login pagina (voor de dropdown)
-- De anon key moet companies kunnen lezen
CREATE POLICY "companies_read_anon" ON companies
  FOR SELECT TO anon USING (true);

-- Authenticated users mogen ook companies lezen
CREATE POLICY "companies_read_auth" ON companies
  FOR SELECT TO authenticated USING (true);

-- Users mogen hun eigen company mapping aanmaken
CREATE POLICY "users_insert_own_mapping" ON user_company_mapping
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users mogen hun eigen mapping verwijderen (bij switch van bedrijf)
CREATE POLICY "users_delete_own_mapping" ON user_company_mapping
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
