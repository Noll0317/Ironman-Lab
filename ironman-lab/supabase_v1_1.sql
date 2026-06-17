-- Ironman Lab V1.1 upgrade: planned workouts, daily readiness, sweat-rate fields

alter table workouts add column if not exists planned_id uuid;
alter table workouts add column if not exists pre_weight numeric;
alter table workouts add column if not exists post_weight numeric;
alter table workouts add column if not exists humidity numeric;
alter table workouts add column if not exists sodium_per_hr numeric;
alter table workouts add column if not exists carbs_per_hr numeric;
alter table workouts add column if not exists fluid_per_hr numeric;
alter table workouts add column if not exists sweat_rate_oz_hr numeric;

create table if not exists planned_workouts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  date date not null,
  type text not null,
  title text,
  planned_duration numeric,
  planned_distance numeric,
  intensity text,
  workout_details text,
  fueling_target text,
  notes text,
  completed boolean default false
);

create table if not exists daily_readiness (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  date date not null unique,
  weight numeric,
  resting_hr numeric,
  sleep_hours numeric,
  hrv numeric,
  energy numeric,
  soreness numeric,
  mood numeric,
  notes text
);

alter table planned_workouts enable row level security;
alter table daily_readiness enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='planned_workouts' AND policyname='public read planned_workouts') THEN
    CREATE POLICY "public read planned_workouts" ON planned_workouts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='planned_workouts' AND policyname='public insert planned_workouts') THEN
    CREATE POLICY "public insert planned_workouts" ON planned_workouts FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='planned_workouts' AND policyname='public update planned_workouts') THEN
    CREATE POLICY "public update planned_workouts" ON planned_workouts FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='planned_workouts' AND policyname='public delete planned_workouts') THEN
    CREATE POLICY "public delete planned_workouts" ON planned_workouts FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_readiness' AND policyname='public read daily_readiness') THEN
    CREATE POLICY "public read daily_readiness" ON daily_readiness FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_readiness' AND policyname='public insert daily_readiness') THEN
    CREATE POLICY "public insert daily_readiness" ON daily_readiness FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_readiness' AND policyname='public update daily_readiness') THEN
    CREATE POLICY "public update daily_readiness" ON daily_readiness FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_readiness' AND policyname='public delete daily_readiness') THEN
    CREATE POLICY "public delete daily_readiness" ON daily_readiness FOR DELETE USING (true);
  END IF;
END $$;
