-- Users (imported from Event Hub or Excel)
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(200)  NOT NULL,
  pin          CHAR(4)       NOT NULL UNIQUE,
  is_admin     BOOLEAN       DEFAULT FALSE,
  is_hidden    BOOLEAN       DEFAULT FALSE,
  heart_value  VARCHAR(100),                     -- e.g. Harmony, Excellence, etc.
  review_status VARCHAR(20),                      -- On Review | Accepted | Rejected | NULL (no submission yet) — gates the INITIAL COMMITMENT only
  review_reason TEXT,                              -- free-text Admin review comment (required when Rejected)
  initial_commitment TEXT,
  measurable_impact  TEXT,
  challenges         TEXT,                        -- private, admin-only
  status       VARCHAR(20),                        -- In Progress | Achieved | NULL (only settable once review_status = 'Accepted')
  attachment_url TEXT,                              -- legacy/unused column, kept only to match existing production data
  progress_status  VARCHAR(20),                    -- On Review | Rejected | NULL — gates each PROGRESS UPDATE (separate from review_status)
  progress_review_reason TEXT,                     -- free-text Admin comment when a progress update is declined
  commitment_locked BOOLEAN DEFAULT FALSE,         -- true after 3 declined commitment submissions; Admin can unlock
  created_at   TIMESTAMPTZ   DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   DEFAULT NOW()
);


-- Progress log (append-only audit trail: submissions, progress updates, admin review decisions)
CREATE TABLE IF NOT EXISTS progress_log (
  id           SERIAL PRIMARY KEY,
  user_id      INT REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR(20),
  measurable_impact TEXT,
  challenges        TEXT,
  updated_by_name   VARCHAR(200),
  updated_by_role   VARCHAR(50),
  attachment_url    TEXT,
  commitment_text   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
