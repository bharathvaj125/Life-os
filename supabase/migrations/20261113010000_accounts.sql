-- Optional email and password accounts. Anonymous households keep working: both columns stay null for them.
-- password_hash holds a salted scrypt hash and is only ever read by the server with the service-role key.

alter table app_users add column if not exists email text;
alter table app_users add column if not exists password_hash text;

alter table app_users drop constraint if exists app_users_email_lower_check;
alter table app_users add constraint app_users_email_lower_check check (email is null or (email = lower(email) and char_length(email) <= 120));

create unique index if not exists app_users_email_key on app_users (email) where email is not null;
