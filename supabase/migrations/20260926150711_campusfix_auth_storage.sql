-- CampusFix: authenticated campus reporting with a single verified-email administrator.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create function private.campus_role() returns text language sql stable security definer set search_path = '' as $$
  select case when lower(u.email) = 'dkhando@ncsu.edu' then 'admin' else 'student' end
  from auth.users u where u.id = (select auth.uid()) and u.email_confirmed_at is not null
    and lower(u.email) ~ '^[^[:space:]@]+@ncsu[.]edu$';
$$;
revoke all on function private.campus_role() from public, anon;
grant execute on function private.campus_role() to authenticated;

create function private.restrict_campus_signup() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null or lower(new.email) !~ '^[^[:space:]@]+@ncsu[.]edu$' then
    raise exception 'Only @ncsu.edu email addresses may register.' using errcode = '23514';
  end if;
  return new;
end; $$;
revoke all on function private.restrict_campus_signup() from public, anon, authenticated;
create trigger campusfix_email_domain before insert or update of email on auth.users for each row execute function private.restrict_campus_signup();

create sequence public.incident_number start 1026;
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  submission_key uuid not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (reporter_id, submission_key),
  constraint incident_object check (jsonb_typeof(data)='object' and data->>'id'=id::text),
  constraint incident_status check (data->>'status' in ('reported','acknowledged','assigned','in_progress','resolved'))
);
create index incidents_reporter_created_idx on public.incidents(reporter_id,created_at desc);
create index incidents_created_idx on public.incidents(created_at desc);
create index incidents_open_match_idx on public.incidents((data->'analysis'->>'category'),(lower(data->'location'->>'building')),created_at desc) where data->>'status'<>'resolved';
create table public.incident_confirmations (
  incident_id uuid not null references public.incidents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (incident_id,user_id)
);
create index confirmations_user_idx on public.incident_confirmations(user_id,incident_id);
create table public.incident_uploads (
  filename text primary key check (filename ~ '^[a-f0-9-]{36}[.](jpg|png|webp)$'),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  object_path text not null unique,
  created_at timestamptz not null default now(),
  constraint upload_owner_path check (object_path=owner_id::text||'/'||filename)
);
create index uploads_owner_idx on public.incident_uploads(owner_id);
alter table public.incidents enable row level security;
alter table public.incident_confirmations enable row level security;
alter table public.incident_uploads enable row level security;
revoke all on public.incidents,public.incident_confirmations,public.incident_uploads from anon,authenticated;
grant select on public.incidents,public.incident_confirmations,public.incident_uploads to authenticated;
grant insert,delete on public.incident_uploads to authenticated;

create function private.can_read_incident(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and (select private.campus_role()) is not null and (
   (select private.campus_role())='admin' or exists(select 1 from public.incidents i where i.id=p_id and i.reporter_id=(select auth.uid()))
   or exists(select 1 from public.incident_confirmations c where c.incident_id=p_id and c.user_id=(select auth.uid()))
 );
$$;
revoke all on function private.can_read_incident(uuid) from public,anon;
grant execute on function private.can_read_incident(uuid) to authenticated;
create policy incidents_read on public.incidents for select to authenticated using (private.can_read_incident(id));
create policy confirmations_read on public.incident_confirmations for select to authenticated using ((select private.campus_role()) is not null and (user_id=(select auth.uid()) or (select private.campus_role())='admin'));

create function private.can_read_upload(p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and (select private.campus_role()) is not null and (
   (select private.campus_role())='admin' or split_part(p_path,'/',1)=(select auth.uid())::text
   or exists(select 1 from public.incidents i where i.data->>'image'='/api/uploads/'||split_part(p_path,'/',2) and private.can_read_incident(i.id))
 );
$$;
revoke all on function private.can_read_upload(text) from public,anon;
grant execute on function private.can_read_upload(text) to authenticated;
create policy uploads_read on public.incident_uploads for select to authenticated using(private.can_read_upload(object_path));
create policy uploads_insert on public.incident_uploads for insert to authenticated with check ((select private.campus_role()) is not null and owner_id=(select auth.uid()));
create policy uploads_delete on public.incident_uploads for delete to authenticated using ((select private.campus_role()) is not null and owner_id=(select auth.uid()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('incident-photos','incident-photos',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy campusfix_photos_insert on storage.objects for insert to authenticated with check (bucket_id='incident-photos' and (select private.campus_role()) is not null and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy campusfix_photos_read on storage.objects for select to authenticated using (bucket_id='incident-photos' and private.can_read_upload(name));
create policy campusfix_photos_delete on storage.objects for delete to authenticated using (bucket_id='incident-photos' and (select private.campus_role()) is not null and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Privileged mutation implementations live outside the exposed schema and check the actor.
create function private.submit_incident(p_draft jsonb,p_submission_key uuid,p_user_approved boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid := auth.uid(); v_id uuid := gen_random_uuid(); v_data jsonb; v_existing jsonb; v_now timestamptz := now(); a jsonb := p_draft->'analysis'; l jsonb := p_draft->'location';
begin
 if v_user is null or private.campus_role() is null then raise exception 'UNAUTHORIZED' using errcode='42501'; end if;
 if p_user_approved is distinct from true then raise exception 'APPROVAL_REQUIRED' using errcode='22023'; end if;
 if p_submission_key is null or jsonb_typeof(a) is distinct from 'object' or jsonb_typeof(l) is distinct from 'object'
   or coalesce(length(trim(a->>'issueTitle')),0)<1 or coalesce(length(trim(a->>'summary')),0)<1
   or (coalesce(length(trim(l->>'building')),0)<3 and coalesce(length(trim(l->>'locationDescription')),0)<5)
   or not coalesce(a->>'category'=any(array['plumbing','electrical','hvac','furniture','building','elevator','technology','network','parking','accessibility','sanitation','grounds','safety','other']),false)
   or not coalesce(a->>'severity'=any(array['routine','priority','urgent','emergency']),false)
   or not coalesce(a->>'suggestedDepartment'=any(array['Facilities','University Housing','Transportation','OIT','CampusFix Review']),false)
   or not coalesce(p_draft->>'mode'=any(array['live','demo']),false)
 then raise exception 'INVALID_REPORT' using errcode='22023'; end if;
 if p_draft->>'image' is not null and not exists(select 1 from public.incident_uploads u where u.owner_id=v_user and '/api/uploads/'||u.filename=p_draft->>'image') then raise exception 'INVALID_IMAGE' using errcode='42501'; end if;
 -- Serialize retries from the same account and submission token; other reports proceed independently.
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||p_submission_key::text,0));
 select data into v_existing from public.incidents where reporter_id=v_user and submission_key=p_submission_key;
 if found then return v_existing; end if;
 v_data := jsonb_build_object('id',v_id,'displayId','CF-'||nextval('public.incident_number'),'analysis',a,'location',l,'image',p_draft->'image','mode',p_draft->>'mode','department',a->>'suggestedDepartment','status','reported','confirmations',0,'confirmationKeys','[]'::jsonb,'submissionKey',p_submission_key,'createdAt',v_now,'updatedAt',v_now,'timeline',jsonb_build_array(jsonb_build_object('status','reported','at',v_now)),'seeded',false);
 insert into public.incidents(id,reporter_id,submission_key,data,created_at) values(v_id,v_user,p_submission_key,v_data,v_now);
 return v_data;
end; $$;
create function private.advance_incident(p_id uuid,p_status text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_data jsonb; v_steps text[] := array['reported','acknowledged','assigned','in_progress','resolved']; v_now timestamptz := now();
begin
 if auth.uid() is null or private.campus_role() is distinct from 'admin' then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
 select data into v_data from public.incidents where id=p_id for update;
 if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
 if p_status=v_data->>'status' then return v_data; end if;
 if array_position(v_steps,p_status) is null or array_position(v_steps,p_status)<>array_position(v_steps,v_data->>'status')+1 then raise exception 'INVALID_TRANSITION' using errcode='22023'; end if;
 v_data:=v_data||jsonb_build_object('status',p_status,'updatedAt',v_now,'timeline',(v_data->'timeline')||jsonb_build_array(jsonb_build_object('status',p_status,'at',v_now)));
 update public.incidents set data=v_data where id=p_id;
 return v_data;
end; $$;
create function private.confirm_incident(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_data jsonb; v_count integer;
begin
 if v_user is null or private.campus_role() is null then raise exception 'UNAUTHORIZED' using errcode='42501'; end if;
 select data into v_data from public.incidents where id=p_id for update;
 if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
 if v_data->>'status'='resolved' then raise exception 'ALREADY_RESOLVED' using errcode='22023'; end if;
 insert into public.incident_confirmations(incident_id,user_id) values(p_id,v_user) on conflict do nothing;
 select count(*) into v_count from public.incident_confirmations where incident_id=p_id;
 v_data:=v_data||jsonb_build_object('confirmations',v_count,'updatedAt',now());
 update public.incidents set data=v_data where id=p_id;
 return v_data;
end; $$;
create function private.find_duplicate_candidates(p_category text,p_building text) returns setof jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or private.campus_role() is null then raise exception 'UNAUTHORIZED' using errcode='42501'; end if;
 if coalesce(length(trim(p_building)),0)<3 then return; end if;
 return query select i.data || jsonb_build_object('image',null,'submissionKey','','confirmationKeys','[]'::jsonb)
 from public.incidents i where i.data->>'status'<>'resolved' and i.created_at>now()-interval '30 days'
 and i.data->'analysis'->>'category'=p_category and lower(i.data->'location'->>'building')=lower(trim(p_building)) order by i.created_at desc limit 12;
end; $$;
revoke all on function private.submit_incident(jsonb,uuid,boolean),private.advance_incident(uuid,text),private.confirm_incident(uuid),private.find_duplicate_candidates(text,text) from public,anon;
grant execute on function private.submit_incident(jsonb,uuid,boolean),private.advance_incident(uuid,text),private.confirm_incident(uuid),private.find_duplicate_candidates(text,text) to authenticated;

create function public.submit_incident(p_draft jsonb,p_submission_key uuid,p_user_approved boolean) returns jsonb language sql security invoker set search_path='' as $$ select private.submit_incident(p_draft,p_submission_key,p_user_approved); $$;
create function public.advance_incident(p_id uuid,p_status text) returns jsonb language sql security invoker set search_path='' as $$ select private.advance_incident(p_id,p_status); $$;
create function public.confirm_incident(p_id uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.confirm_incident(p_id); $$;
create function public.find_duplicate_candidates(p_category text,p_building text) returns setof jsonb language sql security invoker set search_path='' as $$ select private.find_duplicate_candidates(p_category,p_building); $$;
revoke all on function public.submit_incident(jsonb,uuid,boolean),public.advance_incident(uuid,text),public.confirm_incident(uuid),public.find_duplicate_candidates(text,text) from public,anon;
grant execute on function public.submit_incident(jsonb,uuid,boolean),public.advance_incident(uuid,text),public.confirm_incident(uuid),public.find_duplicate_candidates(text,text) to authenticated;
