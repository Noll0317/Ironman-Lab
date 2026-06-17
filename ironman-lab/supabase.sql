create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  date date not null,
  type text not null,
  title text,
  duration numeric,
  distance numeric,
  avg_hr numeric,
  temp numeric,
  rpe numeric,
  gut numeric,
  heat numeric,
  energy numeric,
  cramps boolean default false,
  carbs numeric,
  sodium numeric,
  fluid numeric,
  notes text
);

alter table workouts enable row level security;
create policy "public read workouts" on workouts for select using (true);
create policy "public insert workouts" on workouts for insert with check (true);
create policy "public delete workouts" on workouts for delete using (true);
