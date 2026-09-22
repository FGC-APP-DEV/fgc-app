begin;
-- Synthetic identities and a live-session stand-in are installed by the harness.
insert into auth.users(id) select ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,5)n;
insert into auth.sessions(id,user_id) select ('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,5)n;
insert into core.users(id,email,name) select id,id::text||'@example.invalid','Synthetic' from auth.users;
insert into core.events(id,name,active) values('20000000-0000-4000-8000-000000000001','Synthetic test',true);
insert into core.user_event_roles(event_id,user_id,role) values
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','admin'),
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','judgeAdvisor'),
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','judgeAdvisor'),
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','judge'),
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000004','judge'),
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000005','judge');
insert into core.teams(id,official_id,name,country) values('30000000-0000-4000-8000-000000000001','001','Synthetic team','BR');
insert into judging.cycles(id,event_id) values('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001');
create function pg_temp.assert_true(ok boolean,label text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'ASSERT: %',label;end if;end$$;
create function pg_temp.expect_error(q text,expected text) returns void language plpgsql as $$begin execute q;raise exception 'EXPECTED_ERROR_NOT_THROWN';exception when others then if sqlerrm<>expected then raise exception 'Expected %, got %',expected,sqlerrm;end if;end$$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","session_id":"10000000-0000-4000-8000-000000000001"}',true);
select pg_temp.expect_error('select api.panels_list()','FORBIDDEN');
select pg_temp.expect_error('select api.judging_audit()','FORBIDDEN');
select pg_temp.expect_error('select api.panel_create(''{}'',gen_random_uuid())','FORBIDDEN');
select pg_temp.assert_true((select count(*)=0 from judging.cycles),'admin direct SQL denies all cycles');
select pg_temp.expect_error('insert into core.teams(official_id,name,country) values(''bad'',''bad'',''BR'')','permission denied for table teams');
select api.page_create('{"teamId":"30000000-0000-4000-8000-000000000001","sourceArea":"filming","message":"Independent filming"}',gen_random_uuid());
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","session_id":"10000000-0000-4000-8000-000000000002"}',true);
select api.panel_create('{"name":"A","leaderId":"00000000-0000-4000-8000-000000000003","judgeIds":["00000000-0000-4000-8000-000000000003","00000000-0000-4000-8000-000000000005"]}','50000000-0000-4000-8000-000000000001');
select api.panel_create('{"name":"B","leaderId":"00000000-0000-4000-8000-000000000004","judgeIds":["00000000-0000-4000-8000-000000000004"]}','50000000-0000-4000-8000-000000000002');
select set_config('test.panel_a',(select id::text from judging.panels where name='A'),true);
select set_config('test.panel_b',(select id::text from judging.panels where name='B'),true);
select api.participation_add('{"teamId":"30000000-0000-4000-8000-000000000001"}',gen_random_uuid());
select api.panel_team(jsonb_build_object('teamId','30000000-0000-4000-8000-000000000001','panelId',current_setting('test.panel_a'),'expectedVersion',1),gen_random_uuid());
select api.page_create('{"teamId":"30000000-0000-4000-8000-000000000001","sourceArea":"judges","message":"Judging pager"}',gen_random_uuid());
select pg_temp.expect_error($q$select api.flag_put('{"teamId":"30000000-0000-4000-8000-000000000001","type":"other","expectedVersion":0,"reason":""}',gen_random_uuid())$q$,'new row for relation "flags" violates check constraint "flags_check"');
select api.flag_put('{"teamId":"30000000-0000-4000-8000-000000000001","type":"absent","expectedVersion":0}',gen_random_uuid());
select api.flag_put('{"teamId":"30000000-0000-4000-8000-000000000001","type":"online","expectedVersion":0}',gen_random_uuid());
select pg_temp.assert_true((select count(*)=2 from judging.flags),'simultaneous flags retained');
select pg_temp.assert_true(jsonb_array_length(api.judges_list())=3,'JA eligible judge projection');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000005","session_id":"10000000-0000-4000-8000-000000000005"}',true);
select api.observation_put(jsonb_build_object('teamId','30000000-0000-4000-8000-000000000001','panelId',current_setting('test.panel_a'),'expectedVersion',0,'text','Synthetic confidential note'),'60000000-0000-4000-8000-000000000001');
select api.observation_put(jsonb_build_object('teamId','30000000-0000-4000-8000-000000000001','panelId',current_setting('test.panel_a'),'expectedVersion',0,'text','Synthetic confidential note'),'60000000-0000-4000-8000-000000000001');
select pg_temp.assert_true(jsonb_array_length(api.observations_list('30000000-0000-4000-8000-000000000001'))=1,'exact replay does not duplicate');
select pg_temp.expect_error($q$select api.observation_put(jsonb_build_object('teamId','30000000-0000-4000-8000-000000000001','panelId',current_setting('test.panel_a'),'expectedVersion',0,'text','changed'),'60000000-0000-4000-8000-000000000001')$q$,'DUPLICATE');
select pg_temp.expect_error($q$select api.observation_put(jsonb_build_object('teamId','30000000-0000-4000-8000-000000000001','panelId',current_setting('test.panel_a'),'expectedVersion',0,'text','changed'),gen_random_uuid())$q$,'VERSION_CONFLICT');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","session_id":"10000000-0000-4000-8000-000000000002"}',true);
select api.judge_transfer(jsonb_build_object('judgeId','00000000-0000-4000-8000-000000000005','sourcePanelId',current_setting('test.panel_a'),'targetPanelId',current_setting('test.panel_b'),'expectedVersion',1,'sourceVersion',2,'targetVersion',1),gen_random_uuid());
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000005","session_id":"10000000-0000-4000-8000-000000000005"}',true);
select pg_temp.expect_error($q$select api.observations_list('30000000-0000-4000-8000-000000000001')$q$,'NOT_FOUND');
select pg_temp.expect_error($q$select api.observation_put(jsonb_build_object('teamId','30000000-0000-4000-8000-000000000001','panelId',current_setting('test.panel_a'),'expectedVersion',0,'text','Synthetic confidential note'),'60000000-0000-4000-8000-000000000001')$q$,'NOT_FOUND');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","session_id":"10000000-0000-4000-8000-000000000003"}',true);
select pg_temp.assert_true(jsonb_array_length(api.observations_list('30000000-0000-4000-8000-000000000001'))=1,'old panel retains transferred author note');
select api.evaluation_complete('{"teamId":"30000000-0000-4000-8000-000000000001","expectedVersion":2,"confirmed":true}',gen_random_uuid());
select pg_temp.expect_error($q$select api.observation_put(jsonb_build_object('teamId','30000000-0000-4000-8000-000000000001','panelId',current_setting('test.panel_a'),'expectedVersion',0,'text','blocked'),gen_random_uuid())$q$,'STATE_CONFLICT');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","session_id":"10000000-0000-4000-8000-000000000002"}',true);
select api.evaluation_reopen('{"teamId":"30000000-0000-4000-8000-000000000001","expectedVersion":3}',gen_random_uuid());
select pg_temp.expect_error($q$select api.participation_remove('{"teamId":"30000000-0000-4000-8000-000000000001","expectedVersion":4}',gen_random_uuid())$q$,'STATE_CONFLICT');
select set_config('test.intent',(api.closure_intent('{"expectedVersion":1,"confirmed":true}',gen_random_uuid())->>'entityId'),true);
select api.judging_close(jsonb_build_object('token',current_setting('test.intent'),'expectedVersion',1),'80000000-0000-4000-8000-000000000001');
select api.judging_close(jsonb_build_object('token',current_setting('test.intent'),'expectedVersion',1),'80000000-0000-4000-8000-000000000001');
select pg_temp.assert_true(api.panels_list()='[]'::jsonb,'closed dashboard empty');
select pg_temp.assert_true(jsonb_array_length(api.judging_audit()->'observations')=1,'JA audit retained within deadline');
select pg_temp.expect_error('select api.participation_add(''{}'',gen_random_uuid())','STATE_CONFLICT');
reset role;
delete from auth.sessions where user_id='00000000-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.expect_error('select api.me()','UNAUTHENTICATED');
reset role;
update judging.cycles set closed_at=now()-interval '25 hours',purge_due_at=now()-interval '1 hour';
set local role service_role;
select api.purge_due();
reset role;
select pg_temp.assert_true((select count(*)=0 from judging.cycles),'purge removes cycle');
select pg_temp.assert_true((select count(*)=0 from judging.observations),'purge removes notes');
select pg_temp.assert_true((select count(*)=1 from core.teams),'purge retains global team');
select pg_temp.assert_true((select count(*)=1 from messaging.pages where source_area='filming'),'purge retains filming messages');
select pg_temp.assert_true((select count(*)=0 from messaging.pages where source_area='judges'),'purge deletes judging messages');
select pg_temp.assert_true((select count(*)=0 from private.receipts where cycle_id is not null),'purge deletes judging receipts');
select pg_temp.assert_true((select count(*)=1 from audit.purge_receipts),'content-free purge evidence');
rollback;
