-- Users (imported from Event Hub or Excel)
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(200)  NOT NULL,
  pin          CHAR(4)       NOT NULL UNIQUE,
  is_admin     BOOLEAN       DEFAULT FALSE,
  heart_value  VARCHAR(100),                     -- e.g. Harmony, Excellence, etc.
  review_reason VARCHAR(20),                     -- NOT_MEASURABLE | TOO_OPTIMISTIC | NEW_USER | NULL
  initial_commitment TEXT,
  measurable_impact  TEXT,
  challenges         TEXT,                        -- private, never sent to public dashboard
  status       VARCHAR(20)   DEFAULT 'Not Started',
  created_at   TIMESTAMPTZ   DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   DEFAULT NOW()
);

-- Progress log (append-only audit trail)
CREATE TABLE IF NOT EXISTS progress_log (
  id           SERIAL PRIMARY KEY,
  user_id      INT REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR(20),
  measurable_impact TEXT,
  challenges        TEXT,
  updated_by_name   VARCHAR(200),
  updated_by_role   VARCHAR(50),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Commitment revisions by admin
CREATE TABLE IF NOT EXISTS commitment_revisions (
  id              SERIAL PRIMARY KEY,
  user_id         INT REFERENCES users(id) ON DELETE CASCADE,
  old_commitment  TEXT,
  new_commitment  TEXT,
  admin_id        INT REFERENCES users(id),
  admin_name      VARCHAR(200),
  revised_at      TIMESTAMPTZ DEFAULT NOW()
);
