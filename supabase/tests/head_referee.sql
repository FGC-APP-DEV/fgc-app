begin;
-- Head referee: cross-panel annotations read, own refs notes, judge read of those notes.
insert into auth.users(id) select ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,5)n;
insert into auth.sessions(id,user_id) select ('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,5)n;
insert into core.users(id,email,name) select id,id::text||'@example.invalid','Synthetic' from auth.users;
insert into core.events(id,name,active) values('20000000-0000-4000-8000-000000000001','Synthetic test',true);
insert into core.user_event_roles(event_id,user_id,role) values
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','admin'),
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','judgeAdvisor'),
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','judge'),
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000004','judge'),
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000005','headReferee');
insert into core.teams(id,official_id,name,country) values('30000000-0000-4000-8000-000000000001','001','Synthetic team','BR');
insert into judging.cycles(id,event_id) values('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001');
create function pg_temp.assert_true(ok boolean,label text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'ASSERT: %',label;end if;end$$;
create function pg_temp.expect_error(q text,expected text) returns void language plpgsql as $$begin execute q;raise exception 'EXPECTED_ERROR_NOT_THROWN';exception when others then if sqlerrm<>expected then raise exception 'Expected %, got %',expected,sqlerrm;end if;end$$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","session_id":"10000000-0000-4000-8000-000000000002"}',true);
select api.panel_create('{"name":"A","leaderId":"00000000-0000-4000-8000-000000000003","judgeIds":["00000000-0000-4000-8000-000000000003"]}','50000000-0000-4000-8000-000000000001');
select api.panel_create('{"name":"B","leaderId":"00000000-0000-4000-8000-000000000004","judgeIds":["00000000-0000-4000-8000-000000000004"]}','50000000-0000-4000-8000-000000000002');
select set_config('test.panel_a',(select id::text from judging.panels where name='A'),true);
select set_config('test.panel_b',(select id::text from judging.panels where name='B'),true);
select api.participation_add('{"teamId":"30000000-0000-4000-8000-000000000001"}',gen_random_uuid());
select api.panel_team(jsonb_build_object('teamId','30000000-0000-4000-8000-000000000001','panelId',current_setting('test.panel_a'),'expectedVersion',1),gen_random_uuid());
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","session_id":"10000000-0000-4000-8000-000000000003"}',true);
select api.observation_put(jsonb_build_object('teamId','30000000-0000-4000-8000-000000000001','panelId',current_setting('test.panel_a'),'expectedVersion',0,'text','Judge note'),gen_random_uuid());
-- Judges and the other panel's judge cannot use the referee functions.
select pg_temp.expect_error('select api.referee_annotations()','FORBIDDEN');
select pg_temp.expect_error($q$select api.referee_note_put('{"teamId":"30000000-0000-4000-8000-000000000001","text":"x","expectedVersion":0}',gen_random_uuid())$q$,'FORBIDDEN');
select pg_temp.assert_true(api.referee_notes_list('30000000-0000-4000-8000-000000000001')='[]'::jsonb,'own-panel judge reads empty refs notes');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000004","session_id":"10000000-0000-4000-8000-000000000004"}',true);
select pg_temp.expect_error($q$select api.referee_notes_list('30000000-0000-4000-8000-000000000001')$q$,'NOT_FOUND');
-- Head referee.
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000005","session_id":"10000000-0000-4000-8000-000000000005"}',true);
select pg_temp.assert_true((select jsonb_array_length(a->0->'observations')=1 and a->0->'observations'->0->>'text'='Judge note' and a->0->>'panelName'='A' from (select api.referee_annotations() a)x),'head referee reads annotations of every panel');
select pg_temp.expect_error('select api.panels_list()','FORBIDDEN');
select api.referee_note_put('{"teamId":"30000000-0000-4000-8000-000000000001","text":"Refs note","expectedVersion":0}','60000000-0000-4000-8000-000000000001');
select api.referee_note_put('{"teamId":"30000000-0000-4000-8000-000000000001","text":"Refs note","expectedVersion":0}','60000000-0000-4000-8000-000000000001');
select pg_temp.expect_error($q$select api.referee_note_put('{"teamId":"30000000-0000-4000-8000-000000000001","text":"changed","expectedVersion":0}',gen_random_uuid())$q$,'VERSION_CONFLICT');
select pg_temp.expect_error($q$select api.referee_note_put('{"teamId":"30000000-0000-4000-8000-000000000001","text":"   ","expectedVersion":1}',gen_random_uuid())$q$,'VALIDATION_ERROR');
select pg_temp.expect_error($q$select api.referee_note_put('{"teamId":"30000000-0000-4000-8000-0000000000ff","text":"x","expectedVersion":0}',gen_random_uuid())$q$,'NOT_FOUND');
select api.referee_note_put('{"teamId":"30000000-0000-4000-8000-000000000001","text":"Refs note v2","expectedVersion":1}',gen_random_uuid());
select pg_temp.assert_true(jsonb_array_length(api.referee_notes_list('30000000-0000-4000-8000-000000000001'))=1 and api.referee_notes_list('30000000-0000-4000-8000-000000000001')->0->>'version'='2','one note per head referee and team, versioned');
select pg_temp.assert_true(api.referee_notes_list('30000000-0000-4000-8000-000000000001')->0->>'text'='Refs note v2','head referee reads own note');
select pg_temp.expect_error('select count(*) from judging.referee_notes','permission denied for table referee_notes');
-- The judge of the team's panel reads it; the other panel's judge still cannot.
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","session_id":"10000000-0000-4000-8000-000000000003"}',true);
select pg_temp.assert_true(api.referee_notes_list('30000000-0000-4000-8000-000000000001')->0->>'text'='Refs note v2','panel judge reads refs notes');
select pg_temp.expect_error($q$select api.referee_note_delete('{"teamId":"30000000-0000-4000-8000-000000000001","expectedVersion":2}',gen_random_uuid())$q$,'FORBIDDEN');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000005","session_id":"10000000-0000-4000-8000-000000000005"}',true);
select api.referee_note_delete('{"teamId":"30000000-0000-4000-8000-000000000001","expectedVersion":2}',gen_random_uuid());
select pg_temp.assert_true(api.referee_notes_list('30000000-0000-4000-8000-000000000001')='[]'::jsonb,'note deleted');
-- Admin cannot combine admin and headReferee.
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","session_id":"10000000-0000-4000-8000-000000000001"}',true);
select pg_temp.expect_error($q$select api.access_grant('{"email":"x@example.invalid","roles":["admin","headReferee"],"mode":"add","expectedVersion":0}',gen_random_uuid())$q$,'FORBIDDEN');
select api.access_grant('{"email":"ref@example.invalid","roles":["headReferee"],"mode":"add","expectedVersion":0}',gen_random_uuid());
select pg_temp.expect_error('select api.referee_annotations()','FORBIDDEN');
rollback;
