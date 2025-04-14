-- Remove as políticas antigas que causam recursão
DROP POLICY IF EXISTS "Users can view their own data and admins can view all" ON users;
DROP POLICY IF EXISTS "Users can update their own data and admins can update all" ON users;

-- Cria novas políticas sem recursão
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  ); 