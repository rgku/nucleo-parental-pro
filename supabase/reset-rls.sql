-- ============================================
-- RESET ALL RLS POLICIES
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (true);

-- Parental Units
ALTER TABLE parental_units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can view their parental unit" ON parental_units;
CREATE POLICY "parental_units_select" ON parental_units FOR SELECT USING (true);
CREATE POLICY "parental_units_insert" ON parental_units FOR INSERT WITH CHECK (true);
CREATE POLICY "parental_units_update" ON parental_units FOR UPDATE USING (true);

-- Children
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can view children" ON children;
CREATE POLICY "children_select" ON children FOR SELECT USING (true);
CREATE POLICY "children_insert" ON children FOR INSERT WITH CHECK (true);

-- Calendar Events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can view calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Parents can create calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Event creator can update" ON calendar_events;
CREATE POLICY "calendar_events_select" ON calendar_events FOR SELECT USING (true);
CREATE POLICY "calendar_events_insert" ON calendar_events FOR INSERT WITH CHECK (true);
CREATE POLICY "calendar_events_update" ON calendar_events FOR UPDATE USING (true);

-- Expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can view expenses" ON expenses;
DROP POLICY IF EXISTS "Parents can create expenses" ON expenses;
DROP POLICY IF EXISTS "Expense creator can update" ON expenses;
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (true);
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (true);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can view messages" ON messages;
DROP POLICY IF EXISTS "Parents can send messages" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (true);

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);

-- Documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can view documents" ON documents;
DROP POLICY IF EXISTS "Parents can upload documents" ON documents;
DROP POLICY IF EXISTS "Document creator can delete" ON documents;
CREATE POLICY "documents_select" ON documents FOR SELECT USING (true);
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "documents_delete" ON documents FOR DELETE USING (true);