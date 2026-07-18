-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor > New query > Run

create extension if not exists "pgcrypto";

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text,
  phone text,
  tags text[] default '{}',
  notes text,
  created_at timestamptz default now()
);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete set null,
  title text not null,
  value numeric default 0,
  stage text not null default 'lead',
  updated_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete set null,
  title text not null,
  due_date date,
  done boolean default false,
  created_at timestamptz default now()
);

-- Bật Row Level Security
alter table contacts enable row level security;
alter table deals enable row level security;
alter table tasks enable row level security;

-- Cho phép mọi thao tác qua khóa "anon" (phù hợp cho team nội bộ dùng chung 1 link,
-- KHÔNG phù hợp nếu ứng dụng công khai trên internet cho người lạ truy cập).
-- Nếu cần bảo mật hơn, hãy thêm Supabase Auth và thay policy bằng auth.uid() check.
create policy "cho phep doc contacts" on contacts for select using (true);
create policy "cho phep them contacts" on contacts for insert with check (true);
create policy "cho phep sua contacts" on contacts for update using (true);
create policy "cho phep xoa contacts" on contacts for delete using (true);

create policy "cho phep doc deals" on deals for select using (true);
create policy "cho phep them deals" on deals for insert with check (true);
create policy "cho phep sua deals" on deals for update using (true);
create policy "cho phep xoa deals" on deals for delete using (true);

create policy "cho phep doc tasks" on tasks for select using (true);
create policy "cho phep them tasks" on tasks for insert with check (true);
create policy "cho phep sua tasks" on tasks for update using (true);
create policy "cho phep xoa tasks" on tasks for delete using (true);

-- Bật realtime để các thành viên team thấy thay đổi của nhau ngay lập tức
alter publication supabase_realtime add table contacts;
alter publication supabase_realtime add table deals;
alter publication supabase_realtime add table tasks;
