-- CampusFix: employee role, admin -> employee ticket assignment with admin verification,
-- and an in-app notification center.
--
-- Lifecycle (enforced by private.act_on_incident):
--   reported -> acknowledged (admin) -> assigned (admin picks an employee)
--   -> in_progress (assigned employee, optional) -> awaiting_verification (employee submits work)
--   -> resolved (admin verifies) | assigned (admin sends it back with a note)

-- Employees are managed by the administrator by campus email, so they can be added before signing up.
create table public.employees (
  email text primary key check (email = lower(email) and email ~ '^[^[:space:]@]+@ncsu[.]edu$'),
  added_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.employees enable row level security;
revoke all on public.employees from anon, authenticated;
-- Initial maintenance staff. The administrator can add or remove employees from the Team panel.
insert into public.employees(email, added_by) values ('employee1@ncsu.edu', null), ('employee2@ncsu.edu', null);

create function private.current_email() returns text language sql stable security definer set search_path = '' as $$
  select lower(u.email) from auth.users u where u.id = (select auth.uid()) and u.email_confirmed_at is not null;
$$;
revoke all on function private.current_email() from public, anon;
grant execute on function private.current_email() to authenticated;

create or replace function private.campus_role() returns text language sql stable security definer set search_path = '' as $$
  select case
    when lower(u.email) = 'dkhando@ncsu.edu' then 'admin'
    when exists(select 1 from public.employees e where e.email = lower(u.email)) then 'employee'
    else 'student' end
  from auth.users u where u.id = (select auth.uid()) and u.email_confirmed_at is not null
    and lower(u.email) ~ '^[^[:space:]@]+@ncsu[.]edu$';
$$;

alter table public.incidents drop constraint incident_status;
alter table public.incidents add constraint incident_status check (
  data->>'status' in ('reported','acknowledged','assigned','in_progress','awaiting_verification','resolved'));
create index incidents_assignee_idx on public.incidents((lower(data->>'assignedTo'))) where data->>'assignedTo' is not null;

-- Assigned employees can read their tickets in addition to admins, reporters and confirmers.
create or replace function private.can_read_incident(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and (select private.campus_role()) is not null and (
   (select private.campus_role())='admin' or exists(select 1 from public.incidents i where i.id=p_id and i.reporter_id=(select auth.uid()))
   or exists(select 1 from public.incident_confirmations c where c.incident_id=p_id and c.user_id=(select auth.uid()))
   or ((select private.campus_role())='employee' and exists(select 1 from public.incidents i where i.id=p_id
       and lower(i.data->>'assignedTo')=(select private.current_email())))
 );
$$;

-- Resolution photos live in timeline entries; anyone who can read the ticket can see them.
create or replace function private.can_read_upload(p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and (select private.campus_role()) is not null and (
   (select private.campus_role())='admin' or split_part(p_path,'/',1)=(select auth.uid())::text
   or exists(select 1 from public.incidents i where (i.data->>'image'='/api/uploads/'||split_part(p_path,'/',2)
       or i.data->'timeline' @> jsonb_build_array(jsonb_build_object('image','/api/uploads/'||split_part(p_path,'/',2))))
     and private.can_read_incident(i.id))
 );
$$;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_email text check (recipient_email = lower(recipient_email)),
  recipient_role text check (recipient_role in ('admin')),
  incident_id uuid references public.incidents(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notification_recipient check ((recipient_email is null) <> (recipient_role is null))
);
create index notifications_email_idx on public.notifications(recipient_email, created_at desc) where recipient_email is not null;
create index notifications_role_idx on public.notifications(recipient_role, created_at desc) where recipient_role is not null;
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
create policy notifications_read on public.notifications for select to authenticated using (
  recipient_email = (select private.current_email())
  or (recipient_role = 'admin' and (select private.campus_role()) = 'admin'));

-- Internal only: called from the security-definer workflow functions. Never notifies the actor.
create function private.notify(p_email text, p_role text, p_incident uuid, p_kind text, p_title text, p_body text)
returns void language sql security definer set search_path='' as $$
 insert into public.notifications(recipient_email, recipient_role, incident_id, kind, title, body)
 select case when p_role is null then lower(p_email) end, p_role, p_incident, p_kind, p_title, left(coalesce(p_body,''), 500)
 where p_role is not null or (coalesce(p_email,'') <> '' and lower(p_email) is distinct from private.current_email());
$$;
revoke all on function private.notify(text,text,uuid,text,text,text) from public, anon, authenticated;

create or replace function private.submit_incident(p_draft jsonb,p_submission_key uuid,p_user_approved boolean) returns jsonb language plpgsql security definer set search_path='' as $$
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
 v_data := jsonb_build_object('id',v_id,'displayId','CF-'||nextval('public.incident_number'),'analysis',a,'location',l,'image',p_draft->'image','mode',p_draft->>'mode','department',a->>'suggestedDepartment','status','reported','confirmations',0,'confirmationKeys','[]'::jsonb,'submissionKey',p_submission_key,'assignedTo',null,'createdAt',v_now,'updatedAt',v_now,'timeline',jsonb_build_array(jsonb_build_object('status','reported','at',v_now)),'seeded',false);
 insert into public.incidents(id,reporter_id,submission_key,data,created_at) values(v_id,v_user,p_submission_key,v_data,v_now);
 perform private.notify(null,'admin',v_id,'reported','New issue reported',
   (v_data->>'displayId')||' · '||(a->>'issueTitle')||coalesce(' · '||nullif(l->>'building',''),'')||' · '||(a->>'severity'));
 return v_data;
end; $$;

create function private.act_on_incident(p_id uuid, p_action text, p_details jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_user uuid := auth.uid(); v_role text := private.campus_role(); v_email text := private.current_email();
 v_data jsonb; v_reporter uuid; v_reporter_email text; v_status text; v_next text; v_now timestamptz := now();
 v_entry jsonb; v_note text := nullif(trim(coalesce(p_details->>'note','')),''); v_image text := p_details->>'image';
 v_previous text; v_assignee text; v_ref text;
begin
 if v_user is null or v_role is null then raise exception 'UNAUTHORIZED' using errcode='42501'; end if;
 if length(v_note) > 2000 then raise exception 'INVALID_REPORT' using errcode='22023'; end if;
 select data, reporter_id into v_data, v_reporter from public.incidents where id=p_id for update;
 if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
 v_status := v_data->>'status';
 v_previous := lower(v_data->>'assignedTo');
 if p_action in ('acknowledge','assign','verify','reject') then
   if v_role <> 'admin' then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
 elsif p_action in ('start','complete') then
   if v_role <> 'employee' or v_previous is distinct from v_email then raise exception 'NOT_ASSIGNED' using errcode='42501'; end if;
 else
   raise exception 'INVALID_ACTION' using errcode='22023';
 end if;
 if not ((p_action='acknowledge' and v_status='reported')
   or (p_action='assign' and v_status in ('acknowledged','assigned','in_progress'))
   or (p_action='start' and v_status='assigned')
   or (p_action='complete' and v_status in ('assigned','in_progress'))
   or (p_action in ('verify','reject') and v_status='awaiting_verification'))
 then raise exception 'INVALID_TRANSITION' using errcode='22023'; end if;
 v_next := case p_action when 'acknowledge' then 'acknowledged' when 'assign' then 'assigned' when 'start' then 'in_progress'
   when 'complete' then 'awaiting_verification' when 'verify' then 'resolved' else 'assigned' end;
 v_entry := jsonb_build_object('status',v_next,'at',v_now,'actor',v_email);
 if p_action = 'assign' then
   v_assignee := lower(trim(coalesce(p_details->>'assignee','')));
   if not exists(select 1 from public.employees e where e.email=v_assignee) then raise exception 'NOT_EMPLOYEE' using errcode='22023'; end if;
   v_data := v_data || jsonb_build_object('assignedTo',v_assignee);
   v_note := coalesce(v_note,'Assigned to '||v_assignee);
 end if;
 if p_action = 'reject' and coalesce(length(v_note),0) < 3 then raise exception 'NOTE_REQUIRED' using errcode='22023'; end if;
 if p_action = 'complete' and v_image is not null then
   if not exists(select 1 from public.incident_uploads u where u.owner_id=v_user and '/api/uploads/'||u.filename=v_image)
   then raise exception 'INVALID_IMAGE' using errcode='42501'; end if;
   v_entry := v_entry || jsonb_build_object('image',v_image);
 end if;
 if v_note is not null then v_entry := v_entry || jsonb_build_object('note',v_note); end if;
 v_data := v_data || jsonb_build_object('status',v_next,'updatedAt',v_now,'timeline',(v_data->'timeline')||jsonb_build_array(v_entry));
 update public.incidents set data=v_data where id=p_id;

 v_ref := (v_data->>'displayId')||' · '||(v_data->'analysis'->>'issueTitle');
 select lower(u.email) into v_reporter_email from auth.users u where u.id=v_reporter;
 case p_action
   when 'acknowledge' then
     perform private.notify(v_reporter_email,null,p_id,'acknowledged','Your report was acknowledged',v_ref);
   when 'assign' then
     perform private.notify(v_assignee,null,p_id,'assigned','New ticket assigned to you',v_ref);
     if v_previous is not null and v_previous <> v_assignee then
       perform private.notify(v_previous,null,p_id,'unassigned','Ticket reassigned to a teammate',v_ref);
     end if;
     if v_status = 'acknowledged' then
       perform private.notify(v_reporter_email,null,p_id,'assigned','A team member is on your report',v_ref);
     end if;
   when 'start' then
     perform private.notify(v_reporter_email,null,p_id,'in_progress','Work has started on your report',v_ref);
   when 'complete' then
     perform private.notify(null,'admin',p_id,'awaiting_verification','Work completed — ready to verify',v_ref||' · by '||v_email);
   when 'verify' then
     perform private.notify(v_reporter_email,null,p_id,'resolved','Your report is resolved',v_ref);
     perform private.notify(v_previous,null,p_id,'verified','Your work was verified',v_ref);
   when 'reject' then
     perform private.notify(v_reporter_email,null,p_id,'not_resolved','Your report is not resolved yet',v_ref||' · the team is still working on it');
     perform private.notify(v_previous,null,p_id,'sent_back','Ticket sent back for more work',v_ref||' · '||v_note);
 end case;
 return v_data;
end; $$;

-- Duplicate candidates are shown to other reporters: hide staff notes, photos and emails.
create or replace function private.find_duplicate_candidates(p_category text,p_building text) returns setof jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or private.campus_role() is null then raise exception 'UNAUTHORIZED' using errcode='42501'; end if;
 if coalesce(length(trim(p_building)),0)<3 then return; end if;
 return query select i.data || jsonb_build_object('image',null,'submissionKey','','confirmationKeys','[]'::jsonb,'assignedTo',null,
   'timeline',(select jsonb_agg(jsonb_build_object('status',t->>'status','at',t->>'at')) from jsonb_array_elements(i.data->'timeline') t))
 from public.incidents i where i.data->>'status'<>'resolved' and i.created_at>now()-interval '30 days'
 and i.data->'analysis'->>'category'=p_category and lower(i.data->'location'->>'building')=lower(trim(p_building)) order by i.created_at desc limit 12;
end; $$;

create function private.mark_notifications_read(p_ids uuid[]) returns integer language plpgsql security definer set search_path='' as $$
declare v_count integer;
begin
 if auth.uid() is null or private.campus_role() is null then raise exception 'UNAUTHORIZED' using errcode='42501'; end if;
 update public.notifications n set read_at=now()
 where n.read_at is null and (p_ids is null or n.id=any(p_ids))
   and (n.recipient_email=private.current_email() or (n.recipient_role='admin' and private.campus_role()='admin'));
 get diagnostics v_count = row_count;
 return v_count;
end; $$;

create function private.list_employees() returns setof jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or private.campus_role() is distinct from 'admin' then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
 return query select jsonb_build_object('email',e.email,'addedAt',e.created_at,
   'registered',exists(select 1 from auth.users u where lower(u.email)=e.email and u.email_confirmed_at is not null),
   'openTickets',(select count(*) from public.incidents i where lower(i.data->>'assignedTo')=e.email and i.data->>'status'<>'resolved'))
 from public.employees e order by e.email;
end; $$;
create function private.add_employee(p_email text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_email text := lower(trim(coalesce(p_email,'')));
begin
 if auth.uid() is null or private.campus_role() is distinct from 'admin' then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
 if v_email !~ '^[^[:space:]@]+@ncsu[.]edu$' or v_email = 'dkhando@ncsu.edu' then raise exception 'INVALID_EMPLOYEE' using errcode='22023'; end if;
 insert into public.employees(email) values(v_email) on conflict do nothing;
 return jsonb_build_object('email',v_email);
end; $$;
create function private.remove_employee(p_email text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or private.campus_role() is distinct from 'admin' then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
 delete from public.employees where email=lower(trim(p_email));
end; $$;

drop function public.advance_incident(uuid,text);
drop function private.advance_incident(uuid,text);

revoke all on function private.act_on_incident(uuid,text,jsonb),private.mark_notifications_read(uuid[]),private.list_employees(),private.add_employee(text),private.remove_employee(text) from public,anon;
grant execute on function private.act_on_incident(uuid,text,jsonb),private.mark_notifications_read(uuid[]),private.list_employees(),private.add_employee(text),private.remove_employee(text) to authenticated;

create function public.campus_role() returns text language sql stable security invoker set search_path='' as $$ select private.campus_role(); $$;
create function public.act_on_incident(p_id uuid,p_action text,p_details jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.act_on_incident(p_id,p_action,p_details); $$;
create function public.mark_notifications_read(p_ids uuid[] default null) returns integer language sql security invoker set search_path='' as $$ select private.mark_notifications_read(p_ids); $$;
create function public.list_employees() returns setof jsonb language sql stable security invoker set search_path='' as $$ select private.list_employees(); $$;
create function public.add_employee(p_email text) returns jsonb language sql security invoker set search_path='' as $$ select private.add_employee(p_email); $$;
create function public.remove_employee(p_email text) returns void language sql security invoker set search_path='' as $$ select private.remove_employee(p_email); $$;
revoke all on function public.campus_role(),public.act_on_incident(uuid,text,jsonb),public.mark_notifications_read(uuid[]),public.list_employees(),public.add_employee(text),public.remove_employee(text) from public,anon;
grant execute on function public.campus_role(),public.act_on_incident(uuid,text,jsonb),public.mark_notifications_read(uuid[]),public.list_employees(),public.add_employee(text),public.remove_employee(text) to authenticated;
