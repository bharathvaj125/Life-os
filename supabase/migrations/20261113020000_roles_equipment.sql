-- Roles (household, installer, administrator), home profile, equipment, and installer-owned vendor listings.
-- Existing rows become households. Safe to run twice.

alter table app_users add column if not exists role text not null default 'citizen';
alter table app_users drop constraint if exists app_users_role_check;
alter table app_users add constraint app_users_role_check check (role in ('citizen', 'installer', 'admin'));

alter table app_users add column if not exists home_type text;
alter table app_users drop constraint if exists app_users_home_type_check;
alter table app_users add constraint app_users_home_type_check check (home_type is null or home_type in ('apartment', 'independent', 'row-house'));

alter table app_users add column if not exists ownership text;
alter table app_users drop constraint if exists app_users_ownership_check;
alter table app_users add constraint app_users_ownership_check check (ownership is null or ownership in ('owner', 'tenant'));

alter table app_users add column if not exists roof_access text;
alter table app_users drop constraint if exists app_users_roof_access_check;
alter table app_users add constraint app_users_roof_access_check check (roof_access is null or roof_access in ('none', 'shared', 'own'));

alter table app_users add column if not exists equipment jsonb;

alter table vendors add column if not exists owner_user_id text references app_users (id) on delete set null;
create index if not exists vendors_owner_idx on vendors (owner_user_id);
