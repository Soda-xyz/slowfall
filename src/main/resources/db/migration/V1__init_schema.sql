-- V1__init_schema.sql
-- Initial schema converted from H2 export to PostgreSQL-compatible DDL
-- Idempotent: uses IF NOT EXISTS and ON CONFLICT clauses; allows DB-generated UUIDs via pgcrypto

BEGIN;

-- Ensure pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Airports
CREATE TABLE IF NOT EXISTS airports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icao_code VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  timezone VARCHAR(255) NOT NULL
);

INSERT INTO airports (id, icao_code, name, timezone) VALUES
  ('b527491d-6f91-465b-bca7-cd8667449b78'::uuid, 'EGLL', 'London Heathrow', 'Europe/London'),
  ('8eec31a8-17df-4279-a611-e7fe87983019'::uuid, 'EGGW', 'London Stansted', 'Europe/London')
ON CONFLICT (id) DO NOTHING;

-- Crafts
CREATE TABLE IF NOT EXISTS crafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capacity_persons INTEGER NOT NULL,
  capacity_weight INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(255) NOT NULL
);

INSERT INTO crafts (id, capacity_persons, capacity_weight, name, registration_number) VALUES
  ('28349d59-ba3b-432a-aee4-a50007276a57'::uuid, 4, 1000, 'Cessna 182', 'N182EX'),
  ('0190a77f-2294-42a2-a89b-bf811d0b64ff'::uuid, 6, 1200, 'Pilatus PC-6', 'HB-PC6')
ON CONFLICT (id) DO NOTHING;

-- Jumps
CREATE TABLE IF NOT EXISTS jumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airport_id UUID NOT NULL,
  altitude_feet INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  jump_time TIMESTAMPTZ NOT NULL
);

-- Persons
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  pilot BOOLEAN NOT NULL,
  skydiver BOOLEAN NOT NULL,
  weight INTEGER NOT NULL
);

INSERT INTO persons (id, email, first_name, last_name, pilot, skydiver, weight) VALUES
  ('34ed07d8-21b7-4074-a4e6-3832d9c7c701'::uuid, 'alice@example.com', 'Alice', 'Anderson', TRUE, TRUE, 70),
  ('6281282d-b0c1-457d-b060-d6ed5279c041'::uuid, 'bob@example.com', 'Bob', 'Brown', TRUE, FALSE, 85),
  ('b49259ca-a4fd-4e24-a52d-1dba2a3d02b9'::uuid, 'carol@example.com', 'Carol', 'Clark', FALSE, TRUE, 60),
  ('4a8253b6-ca98-4bb8-8020-c81dfe1c8288'::uuid, 'dave@example.com', 'Dave', 'Doe', FALSE, TRUE, 78)
ON CONFLICT (id) DO NOTHING;

-- Ensure unique emails (skip if index exists)
CREATE UNIQUE INDEX IF NOT EXISTS uq_persons_email ON persons (email);

-- Join tables for relationships
CREATE TABLE IF NOT EXISTS jump_pilots (
  jump_id UUID NOT NULL,
  person_id UUID NOT NULL,
  PRIMARY KEY (jump_id, person_id)
);

CREATE TABLE IF NOT EXISTS jump_skydiver (
  jump_id UUID NOT NULL,
  person_id UUID NOT NULL,
  PRIMARY KEY (jump_id, person_id)
);

-- Foreign keys (add if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_jumps_airport'
  ) THEN
    ALTER TABLE jumps
      ADD CONSTRAINT fk_jumps_airport FOREIGN KEY (airport_id) REFERENCES airports (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_jump_pilots_jump'
  ) THEN
    ALTER TABLE jump_pilots
      ADD CONSTRAINT fk_jump_pilots_jump FOREIGN KEY (jump_id) REFERENCES jumps (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_jump_pilots_person'
  ) THEN
    ALTER TABLE jump_pilots
      ADD CONSTRAINT fk_jump_pilots_person FOREIGN KEY (person_id) REFERENCES persons (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_jump_skydiver_person'
  ) THEN
    ALTER TABLE jump_skydiver
      ADD CONSTRAINT fk_jump_skydiver_person FOREIGN KEY (person_id) REFERENCES persons (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_jump_skydiver_jump'
  ) THEN
    ALTER TABLE jump_skydiver
      ADD CONSTRAINT fk_jump_skydiver_jump FOREIGN KEY (jump_id) REFERENCES jumps (id);
  END IF;
END$$;

COMMIT;
