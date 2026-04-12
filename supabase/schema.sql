-- ============================================
-- NÚCLEO PARENTAL PRO - Supabase Schema
-- Database: PostgreSQL
-- Language: English (for DB), UI in pt-PT
-- ============================================

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent_a', 'parent_b')),
  avatar_url TEXT,
  municipality_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- 2. PARENTAL UNITS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS parental_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_name TEXT NOT NULL,
  parent_a_id UUID NOT NULL REFERENCES profiles(id),
  parent_b_id UUID NOT NULL REFERENCES profiles(id),
  municipality_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parental_units_parent_a ON parental_units(parent_a_id);
CREATE INDEX idx_parental_units_parent_b ON parental_units(parent_b_id);

-- ============================================
-- 3. CHILDREN TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parental_unit_id UUID NOT NULL REFERENCES parental_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_children_parental_unit ON children(parental_unit_id);

-- ============================================
-- 4. CALENDAR EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parental_unit_id UUID NOT NULL REFERENCES parental_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  type TEXT NOT NULL CHECK (type IN ('custody', 'health', 'education', 'holiday', 'activity')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_parental_unit ON calendar_events(parental_unit_id);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_type ON calendar_events(type);

-- ============================================
-- 5. EXPENSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parental_unit_id UUID NOT NULL REFERENCES parental_units(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  category TEXT NOT NULL CHECK (category IN ('education', 'health', 'food', 'clothing', 'leisure', 'transport', 'housing', 'other')),
  paid_by_id UUID NOT NULL REFERENCES profiles(id),
  split_ratio NUMERIC(3,2) DEFAULT 0.50 CHECK (split_ratio >= 0 AND split_ratio <= 1),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'disputed')),
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_parental_unit ON expenses(parental_unit_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_category ON expenses(category);

-- ============================================
-- 6. MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parental_unit_id UUID NOT NULL REFERENCES parental_units(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  original_content TEXT,
  is_mediated BOOLEAN DEFAULT FALSE,
  tone TEXT CHECK (tone IN ('positive', 'neutral', 'negative')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_parental_unit ON messages(parental_unit_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- 7. NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_expense', 'new_event', 'custody_swap_reminder', 'approval_request', 'message_received')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read, created_at DESC);

-- ============================================
-- 8. MUNICIPALITIES (Reference)
-- ============================================

CREATE TABLE IF NOT EXISTS municipalities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  holiday_date TEXT NOT NULL,
  holiday_name TEXT NOT NULL
);

-- Insert Portuguese municipalities with their holidays
INSERT INTO municipalities (id, name, holiday_date, holiday_name) VALUES
('aveiro', 'Aveiro', '12-05', 'Dia do Município'),
('beja', 'Beja', '19-06', 'Dia do Município'),
('braga', 'Braga', '24-06', 'Dia de São João'),
('braganca', 'Bragança', '22-08', 'Dia do Município'),
('castelo-branco', 'Castelo Branco', '01-04', 'Segunda-feira de Páscoa'),
('coimbra', 'Coimbra', '04-07', 'Dia do Município'),
('evora', 'Évora', '29-06', 'Dia do Município'),
('faro', 'Faro', '07-09', 'Dia do Município'),
('funchal', 'Funchal', '21-08', 'Dia do Município'),
('guarda', 'Guarda', '27-11', 'Dia do Município'),
('leiria', 'Leiria', '22-05', 'Dia do Município'),
('lisboa', 'Lisboa', '13-06', 'Dia de Santo António'),
('ponta-delgada', 'Ponta Delgada', '21-08', 'Dia do Município'),
('portalegre', 'Portalegre', '23-05', 'Dia do Município'),
('porto', 'Porto', '24-06', 'Dia de São João'),
('santarem', 'Santarém', '19-03', 'Dia de São José'),
('setubal', 'Setúbal', '15-09', 'Dia do Município'),
('viana-castelo', 'Viana do Castelo', '20-08', 'Dia do Município'),
('vila-real', 'Vila Real', '13-06', 'Dia de Santo António'),
('viseu', 'Viseu', '21-09', 'Dia do Município');

-- ============================================
-- 9. NATIONAL HOLIDAYS 2026 (PORTUGAL)
-- ============================================

CREATE TABLE IF NOT EXISTS holidays_2026 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('national', 'municipal'))
);

INSERT INTO holidays_2026 (date, name, type) VALUES
('01-01', 'Ano Novo', 'national'),
('13-04', 'Segunda-feira de Páscoa', 'national'),
('25-04', 'Dia da Liberdade', 'national'),
('01-05', 'Dia do Trabalhador', 'national'),
('10-06', 'Dia de Portugal', 'national'),
('15-08', 'Assunção de Nossa Senhora', 'national'),
('01-11', 'Todos os Santos', 'national'),
('01-12', 'Restauração da Independência', 'national'),
('08-12', 'Imaculada Conceição', 'national'),
('25-12', 'Natal', 'national');

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parental_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read their own profile, and the other parent's profile in their parental unit
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- PARENTAL UNITS: Both parents can view their parental unit
CREATE POLICY "Parents can view their parental unit" ON parental_units
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = parent_a_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = parent_b_id)
  );

-- CHILDREN: Both parents can view children in their parental unit
CREATE POLICY "Parents can view children" ON children
  FOR SELECT USING (
    parental_unit_id IN (
      SELECT id FROM parental_units WHERE
        parent_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR parent_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- CALENDAR EVENTS: Both parents can view all events
CREATE POLICY "Parents can view calendar events" ON calendar_events
  FOR SELECT USING (
    parental_unit_id IN (
      SELECT id FROM parental_units WHERE
        parent_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR parent_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Both parents can create events
CREATE POLICY "Parents can create calendar events" ON calendar_events
  FOR INSERT WITH CHECK (created_by IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Only event creator can update/delete
CREATE POLICY "Event creator can update" ON calendar_events
  FOR UPDATE USING (created_by IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- EXPENSES: Both parents can view expenses
CREATE POLICY "Parents can view expenses" ON expenses
  FOR SELECT USING (
    parental_unit_id IN (
      SELECT id FROM parental_units WHERE
        parent_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR parent_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Both parents can create expenses
CREATE POLICY "Parents can create expenses" ON expenses
  FOR INSERT WITH CHECK (paid_by_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Only expense creator can update/delete their own expenses
CREATE POLICY "Expense creator can update" ON expenses
  FOR UPDATE USING (paid_by_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- MESSAGES: Both parents can view messages in their parental unit
CREATE POLICY "Parents can view messages" ON messages
  FOR SELECT USING (
    parental_unit_id IN (
      SELECT id FROM parental_units WHERE
        parent_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR parent_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Both parents can send messages
CREATE POLICY "Parents can send messages" ON messages
  FOR INSERT WITH CHECK (sender_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- NOTIFICATIONS: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate balance for a user in a parental unit
CREATE OR REPLACE FUNCTION calculate_balance(parental_unit_uuid UUID, user_profile_id UUID)
RETURNS TABLE (
  total_expenses_cents BIGINT,
  paid_by_user_cents BIGINT,
  paid_by_other_cents BIGINT,
  user_share_cents BIGINT,
  balance_cents BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH expenses AS (
    SELECT 
      e.amount_cents,
      e.paid_by_id,
      e.split_ratio,
      CASE WHEN e.paid_by_id = user_profile_id THEN e.amount_cents ELSE 0 END AS paid_by_user,
      CASE WHEN e.paid_by_id != user_profile_id THEN e.amount_cents ELSE 0 END AS paid_by_other
    FROM expenses e
    WHERE e.parental_unit_id = parental_unit_uuid
  )
  SELECT
    COALESCE(SUM(amount_cents), 0)::BIGINT,
    COALESCE(SUM(paid_by_user), 0)::BIGINT,
    COALESCE(SUM(paid_by_other), 0)::BIGINT,
    COALESCE(SUM(amount_cents * split_ratio), 0)::BIGINT,
    (COALESCE(SUM(paid_by_user), 0) - COALESCE(SUM(amount_cents * split_ratio), 0))::BIGINT
  FROM expenses;
END;
$$ LANGUAGE plpgsql;

-- Function to check if expense requires approval (Antigravity rule: > 250€)
CREATE OR REPLACE FUNCTION expense_requires_approval(amount_cents INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN amount_cents > 25000; -- 250€ in cents
END;
$$ LANGUAGE plpgsql;

-- Function to get municipality holiday
CREATE OR REPLACE FUNCTION get_municipality_holiday(municipality_id TEXT)
RETURNS TABLE(date TEXT, name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT m.holiday_date, m.holiday_name
  FROM municipalities m
  WHERE m.id = municipality_id;
END;
$$ LANGUAGE plpgsql;