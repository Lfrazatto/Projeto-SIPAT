ALTER TABLE quiz_questions ADD COLUMN sortOrder INTEGER NOT NULL DEFAULT 0;
UPDATE quiz_questions SET sortOrder = id;
CREATE INDEX IF NOT EXISTS quiz_questions_order_idx ON quiz_questions (gameType, active, sortOrder, id);
