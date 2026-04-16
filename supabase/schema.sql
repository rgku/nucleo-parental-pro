-- ============================================
-- CLEAN START: Drop all existing objects
-- ============================================

-- Drop trigger and function first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS children CASCADE;
DROP TABLE IF EXISTS parental_units CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS holidays_2026 CASCADE;
DROP TABLE IF EXISTS municipalities CASCADE;

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

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- 2. PARENTAL UNITS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS parental_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_name TEXT NOT NULL,
  parent_a_id UUID REFERENCES profiles(id),
  parent_b_id UUID REFERENCES profiles(id),
  municipality_id TEXT NOT NULL,
  agreement_date DATE,
  custody_schedule JSONB,
  join_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parental_units_join_code ON parental_units(join_code);

CREATE INDEX IF NOT EXISTS idx_parental_units_parent_a ON parental_units(parent_a_id);
CREATE INDEX IF NOT EXISTS idx_parental_units_parent_b ON parental_units(parent_b_id);

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

CREATE INDEX IF NOT EXISTS idx_children_parental_unit ON children(parental_unit_id);

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
  parent TEXT CHECK (parent IN ('parent_a', 'parent_b')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_parental_unit ON calendar_events(parental_unit_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);

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

CREATE INDEX IF NOT EXISTS idx_expenses_parental_unit ON expenses(parental_unit_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

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

CREATE INDEX IF NOT EXISTS idx_messages_parental_unit ON messages(parental_unit_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read, created_at DESC);

-- ============================================
-- 8. MUNICIPALITIES (Reference)
-- ============================================

CREATE TABLE IF NOT EXISTS municipalities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  holiday_date TEXT NOT NULL,
  holiday_name TEXT NOT NULL
);

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
('viseu', 'Viseu', '21-09', 'Dia do Município')
ON CONFLICT (id) DO NOTHING;

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
('25-12', 'Natal', 'national')
ON CONFLICT (date) DO NOTHING;

-- ============================================
-- 10. DOCUMENTS TABLE (for file sharing)
-- ============================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parental_unit_id UUID NOT NULL REFERENCES parental_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('agreement', 'medical', 'education', 'receipt', 'other')),
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_parental_unit ON documents(parental_unit_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for documents
CREATE POLICY "Anyone can view documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parental_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- PARENTAL UNITS
CREATE POLICY "Parents can view their parental unit" ON parental_units FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = parent_a_id)
  OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = parent_b_id)
);

-- CHILDREN
CREATE POLICY "Parents can view children" ON children FOR SELECT USING (
  parental_unit_id IN (SELECT id FROM parental_units WHERE parent_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR parent_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- CALENDAR EVENTS
CREATE POLICY "Parents can view calendar events" ON calendar_events FOR SELECT USING (
  parental_unit_id IN (SELECT id FROM parental_units WHERE parent_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR parent_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Parents can create calendar events" ON calendar_events FOR INSERT WITH CHECK (created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Event creator can update" ON calendar_events FOR UPDATE USING (created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- EXPENSES
CREATE POLICY "Parents can view expenses" ON expenses FOR SELECT USING (
  parental_unit_id IN (SELECT id FROM parental_units WHERE parent_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR parent_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Parents can create expenses" ON expenses FOR INSERT WITH CHECK (paid_by_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Expense creator can update" ON expenses FOR UPDATE USING (paid_by_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- MESSAGES
CREATE POLICY "Parents can view messages" ON messages FOR SELECT USING (
  parental_unit_id IN (SELECT id FROM parental_units WHERE parent_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR parent_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Parents can send messages" ON messages FOR INSERT WITH CHECK (sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- DOCUMENTS
CREATE POLICY "Parents can view documents" ON documents FOR SELECT USING (
  parental_unit_id IN (SELECT id FROM parental_units WHERE parent_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR parent_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Parents can upload documents" ON documents FOR INSERT WITH CHECK (uploaded_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Document creator can delete" ON documents FOR DELETE USING (uploaded_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION calculate_balance(parental_unit_uuid UUID, user_profile_id UUID)
RETURNS TABLE (total_expenses_cents BIGINT, paid_by_user_cents BIGINT, paid_by_other_cents BIGINT, user_share_cents BIGINT, balance_cents BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH expenses AS (
    SELECT e.amount_cents, e.paid_by_id, e.split_ratio,
      CASE WHEN e.paid_by_id = user_profile_id THEN e.amount_cents ELSE 0 END AS paid_by_user,
      CASE WHEN e.paid_by_id != user_profile_id THEN e.amount_cents ELSE 0 END AS paid_by_other
    FROM expenses e WHERE e.parental_unit_id = parental_unit_uuid
  )
  SELECT COALESCE(SUM(amount_cents), 0)::BIGINT, COALESCE(SUM(paid_by_user), 0)::BIGINT, COALESCE(SUM(paid_by_other), 0)::BIGINT, COALESCE(SUM(amount_cents * split_ratio), 0)::BIGINT, (COALESCE(SUM(paid_by_user), 0) - COALESCE(SUM(amount_cents * split_ratio), 0))::BIGINT FROM expenses;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION expense_requires_approval(amount_cents INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN amount_cents > 25000;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_municipality_holiday(municipality_id TEXT)
RETURNS TABLE(date TEXT, name TEXT) AS $$
BEGIN
  RETURN QUERY SELECT m.holiday_date, m.holiday_name FROM municipalities m WHERE m.id = municipality_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER (auto-create profile on signup)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, name, role, municipality_id)
  VALUES (NEW.id, NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Utilizador'), COALESCE(NEW.raw_user_meta_data->>'role', 'parent_a'), COALESCE(NEW.raw_user_meta_data->>'municipality_id', 'lisboa'))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PUSH SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- ============================================
-- SCHEDULED REMINDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parental_unit_id UUID NOT NULL REFERENCES parental_units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES calendar_events(id),
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('custody_swap', 'expense_approval', 'payment_due')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_scheduled ON scheduled_reminders(scheduled_for, sent);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_parental_unit ON scheduled_reminders(parental_unit_id);

-- ============================================
-- SCHEDULER FUNCTION (Run every minute)
-- ============================================

CREATE OR REPLACE FUNCTION process_scheduled_reminders()
RETURNS void AS $$
DECLARE
  pending_reminder RECORD;
  user_sub RECORD;
  notification_body TEXT;
BEGIN
  FOR pending_reminder IN
    SELECT sr.id, sr.parental_unit_id, sr.user_id, sr.reminder_type, sr.message, sr.event_id
    FROM scheduled_reminders sr
    WHERE sr.sent = FALSE
    AND sr.scheduled_for <= NOW()
  LOOP
    SELECT ps.endpoint, ps.keys_p256dh, ps.keys_auth
    INTO user_sub
    FROM push_subscriptions ps
    WHERE ps.user_id = pending_reminder.user_id;

    IF FOUND AND user_sub.endpoint IS NOT NULL THEN
      notification_body := json_build_object(
        'title', CASE pending_reminder.reminder_type
          WHEN 'custody_swap' THEN 'Troca de Custódia'
          WHEN 'expense_approval' THEN 'Despesa por Aprovar'
          WHEN 'payment_due' THEN 'Pagamento Pendente'
        END,
        'message', pending_reminder.message,
        'url', CASE pending_reminder.reminder_type
          WHEN 'custody_swap' THEN '/calendar'
          WHEN 'expense_approval' THEN '/finances'
          WHEN 'payment_due' THEN '/finances'
        END
      )::text;

      INSERT INTO notifications (user_id, type, title, message)
      VALUES (
        pending_reminder.user_id,
        CASE pending_reminder.reminder_type
          WHEN 'custody_swap' THEN 'custody_swap_reminder'
          WHEN 'expense_approval' THEN 'approval_request'
          WHEN 'payment_due' THEN 'new_expense'
        END,
        CASE pending_reminder.reminder_type
          WHEN 'custody_swap' THEN 'Lembrete: Troca de Custódia'
          WHEN 'expense_approval' THEN 'Despesa requer aprovação'
          WHEN 'payment_due' THEN 'Pagamento pendente'
        END,
        pending_reminder.message
      );
    END IF;

    UPDATE scheduled_reminders SET sent = TRUE WHERE id = pending_reminder.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUTO-CREATE CUSTODY SWAP REMINDER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION create_custody_swap_reminder()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'custody' AND NEW.start_date > NOW() + INTERVAL '23 hours' THEN
    INSERT INTO scheduled_reminders (parental_unit_id, user_id, event_id, reminder_type, scheduled_for, message)
    SELECT 
      NEW.parental_unit_id,
      CASE WHEN NEW.created_by = (SELECT parent_a_id FROM parental_units WHERE id = NEW.parental_unit_id)
        THEN (SELECT parent_b_id FROM parental_units WHERE id = NEW.parental_unit_id)
        ELSE (SELECT parent_a_id FROM parental_units WHERE id = NEW.parental_unit_id)
      END,
      NEW.id,
      'custody_swap',
      NEW.start_date - INTERVAL '24 hours',
      'A troca de custódia ocorre em 24 horas: ' || NEW.title;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_custody_reminder
AFTER INSERT ON calendar_events
FOR EACH ROW
EXECUTE FUNCTION create_custody_swap_reminder();