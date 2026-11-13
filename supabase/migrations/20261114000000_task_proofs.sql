-- Photo evidence for high-impact actions. The photo is kept only until an administrator has reviewed it, then the
-- image column is set to null. Same access model as the other tables: server-only, service-role key, RLS on, no policy.

create table if not exists task_proofs (
  id           text primary key,
  user_id      text not null references app_users (id) on delete cascade,
  task_id      text not null,
  image        text check (image is null or char_length(image) <= 600000),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);

-- One live proof per user and task: a pending or approved one blocks another, a rejected one does not.
create unique index if not exists task_proofs_live_key on task_proofs (user_id, task_id) where status in ('pending', 'approved');
create index if not exists task_proofs_status_idx on task_proofs (status);

alter table task_proofs enable row level security;
