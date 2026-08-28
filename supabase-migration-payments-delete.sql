-- Doplnění RLS o DELETE pro payments (mazání platby z appky).
-- Navazuje na supabase-migration-payments-rls.sql, který řešil jen select/insert/update.

DROP POLICY IF EXISTS "anon can delete payments" ON payments;
DROP POLICY IF EXISTS "authenticated can delete own payments" ON payments;

CREATE POLICY "anon can delete payments" ON payments FOR DELETE TO anon USING (true);

CREATE POLICY "authenticated can delete own payments" ON payments FOR DELETE TO authenticated
  USING (property_id IS NULL OR property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));
