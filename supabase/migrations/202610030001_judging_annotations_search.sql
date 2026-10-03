begin;
-- Temporary and transaction-scoped, same as 202609290001: lets non-superuser roles hand function
-- ownership to fgc_command. Revoked before commit, so final ACLs are unchanged.
grant create on schema api to fgc_command;
-- Cross-panel read of Judging annotations, searched by country (code or name), team name or panel name.
-- Any judge or judge advisor of the active cycle may read every panel's annotations for a team;
-- nothing is returned without a search term, so the dashboard starts empty. Security definer
-- because judging.observations RLS only exposes a judge's own panel. Writes are unchanged
-- (observation_put/observation_delete stay restricted to the author's own panel).
create function api.annotations_search(p_query text default '') returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c uuid; q text:=lower(trim(coalesce(p_query,'')));
begin
 perform private.require_judging();
 if q='' or length(q)>100 then return '[]'::jsonb; end if;
 select id into c from judging.cycles where event_id=private.event_id() and state='active';
 if c is null then return '[]'::jsonb; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('teamId',t.id,'officialId',t.official_id,'teamName',t.name,'country',t.country,'countryCode',t.country,'panelId',p.id,'panelName',p.name,'observations',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'authorId',o.author_id,'authorName',coalesce(u.name,u.email),'panelId',o.panel_id,'panelName',op.name,'teamId',o.team_id,'text',o.notes,'version',o.version,'updatedAt',o.updated_at) order by o.updated_at desc,o.id) from judging.observations o join core.users u on u.id=o.author_id join judging.panels op on op.id=o.panel_id where o.cycle_id=c and o.team_id=t.id),'[]'::jsonb)) order by p.name,t.country,t.id)
  from (select pa.team_id,pa.panel_id from judging.participations pa where pa.cycle_id=c and pa.panel_id is not null) x
  join core.teams t on t.id=x.team_id join judging.panels p on p.id=x.panel_id
  where (case when length(q)<=3 then lower(trim(t.country))=q else position(q in lower(t.country))>0 or position(q in lower(t.name))>0 end) or position(q in lower(p.name))>0),'[]'::jsonb);
end $$;
alter function api.annotations_search(text) owner to fgc_command;
revoke all on function api.annotations_search(text) from public,anon;
grant execute on function api.annotations_search(text) to authenticated;
notify pgrst,'reload schema';
revoke create on schema api from fgc_command;
commit;
