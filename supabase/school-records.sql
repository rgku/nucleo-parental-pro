-- ============================================
-- Add SCHOOL RECORDS to existing database
-- ============================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS school_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parental_unit_id UUID NOT NULL REFERENCES parental_units(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('grade', 'notice', 'schedule', 'calendar')),
  grade_value TEXT,
  content TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_school_records_parental_unit ON school_records(parental_unit_id);
CREATE INDEX IF NOT EXISTS idx_school_records_child ON school_records(child_id);
CREATE INDEX IF NOT EXISTS idx_school_records_category ON school_records(category);

-- Enable RLS
ALTER TABLE school_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies - simplified version
DROP POLICY IF EXISTS "Parents can view school records" ON school_records;
CREATE POLICY "Parents can view school records" ON school_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Parents can create school records" ON school_records;
CREATE POLICY "Parents can create school records" ON school_records FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "School record creator can update" ON school_records;
CREATE POLICY "School record creator can update" ON school_records FOR UPDATE USING (true);

DROP POLICY IF EXISTS "School record creator can delete" ON school_records;
CREATE POLICY "School record creator can delete" ON school_records FOR DELETE USING (true);

-- Notifications trigger
CREATE OR REPLACE FUNCTION notify_school_record_added()
RETURNS TRIGGER AS $$
DECLARE
  other_parent_id UUID;
  child_name TEXT;
  category_label TEXT;
BEGIN
  other_parent_id := (
    SELECT CASE 
      WHEN NEW.created_by = (SELECT parent_a_id FROM parental_units WHERE id = NEW.parental_unit_id)
      THEN parent_b_id
      ELSE parent_a_id
    END
    FROM parental_units WHERE id = NEW.parental_unit_id
  );
  
  child_name := (
    SELECT name FROM children WHERE id = NEW.child_id
  );
  
  category_label := CASE NEW.category
    WHEN 'grade' THEN 'Nota'
    WHEN 'notice' THEN 'Recado'
    WHEN 'schedule' THEN 'Horario'
    WHEN 'calendar' THEN 'Calendario'
    ELSE 'Registo'
  END;
  
  IF other_parent_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      other_parent_id,
      'new_school_record',
      'Novo ' || category_label || ' escolar',
      child_name || ': ' || category_label || ' - ' || NEW.subject
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_school_record ON school_records;
CREATE TRIGGER trigger_notify_school_record
AFTER INSERT ON school_records
FOR EACH ROW
EXECUTE FUNCTION notify_school_record_added();