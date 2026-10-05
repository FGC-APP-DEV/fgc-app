begin;
-- Temporary and transaction-scoped, same as 202610040001: lets non-superuser roles replace
-- functions owned by fgc_command. Revoked before commit, so final ACLs are unchanged.
grant create on schema private, api to fgc_command;

-- The head referee no longer reads the judges' annotations: the list keeps the teams (with their
-- panel) and returns only the caller's own refs notes. Judges and advisors still read the refs
-- notes of the teams they can read.
create or replace function api.referee_annotations() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c uuid; a uuid;
begin
 perform private.require_head_referee();
 a:=private.actor();
 select id into c from judging.cycles where event_id=private.event_id() and state='active';
 if c is null then return '[]'::jsonb; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('teamId',t.id,'officialId',t.official_id,'teamName',t.name,'country',t.country,'panelId',p.id,'panelName',p.name,
   'notes',coalesce((select jsonb_agg(jsonb_build_object('id',n.id,'authorId',n.author_id,'authorName',coalesce(u.name,u.email),'teamId',n.team_id,'text',n.notes,'version',n.version,'updatedAt',n.updated_at) order by n.updated_at desc,n.id) from judging.referee_notes n join core.users u on u.id=n.author_id where n.cycle_id=c and n.team_id=t.id and n.author_id=a),'[]'::jsonb))
   order by t.country,t.name,t.id)
  from judging.participations pa join core.teams t on t.id=pa.team_id left join judging.panels p on p.id=pa.panel_id and p.cycle_id=pa.cycle_id where pa.cycle_id=c),'[]'::jsonb);
end $$;

create or replace function api.referee_notes_list(p_team uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c uuid; a uuid; own_only boolean:=private.has_role('headReferee') and not private.has_role('admin');
begin
 if own_only then null;
 else perform private.require_team_read(p_team); end if;
 a:=private.actor();
 select id into c from judging.cycles where event_id=private.event_id() and state='active';
 if c is null then return '[]'::jsonb; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',n.id,'authorId',n.author_id,'authorName',coalesce(u.name,u.email),'teamId',n.team_id,'text',n.notes,'version',n.version,'updatedAt',n.updated_at) order by n.updated_at desc,n.id) from judging.referee_notes n join core.users u on u.id=n.author_id where n.cycle_id=c and n.team_id=p_team and (not own_only or n.author_id=a)),'[]'::jsonb);
end $$;

notify pgrst,'reload schema';
revoke create on schema private, api from fgc_command;
commit;
