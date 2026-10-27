-- All writes go through narrow, authorized RPCs. Never grant clients broad table writes.
create extension if not exists pgcrypto;
create table public.provinces(name text primary key);
create table public.districts(name text primary key, province text not null references public.provinces, active boolean not null default false);
create table public.cities(district text references public.districts, name text, latitude double precision not null, longitude double precision not null, primary key(district,name));
create table public.profiles(
 id uuid primary key references auth.users on delete cascade,
 first_name text not null check(length(first_name) between 2 and 60), display_name text not null check(length(display_name) between 2 and 40),
 phone text not null check(phone ~ '^\+947[0-9]{8}$'), dob date not null check(dob <= (current_timestamp at time zone 'Asia/Colombo')::date - interval '18 years' and dob > '1900-01-01'),
 gender text not null check(gender in ('Woman','Man','Non-binary','Self-described')),
 country text not null default 'LK' check(country='LK'), resident boolean not null check(resident),
 district text not null, city text not null, foreign key(district,city) references public.cities(district,name),
 occupation text not null default '' check(length(occupation)<=80), introduction text not null default '' check(length(introduction)<=400),
 status text not null default 'pending' check(status in ('pending','eligible','suspended','waitlist')),
 share_age boolean not null default false, share_district boolean not null default false, share_interests boolean not null default false, share_score boolean not null default false,
 is_demo boolean not null default false, created_at timestamptz not null default now()
);
create table public.user_roles(user_id uuid primary key references public.profiles on delete cascade, role text not null check(role='admin'));
create table public.verification_status(user_id uuid primary key references public.profiles on delete cascade, residency_reviewed_at timestamptz, reviewer uuid references auth.users on delete set null, review_note text check(length(review_note)<=500));
create table public.dating_preferences(user_id uuid primary key references public.profiles on delete cascade, genders text[] not null check(cardinality(genders)>0 and genders <@ array['Woman','Man','Non-binary','Self-described']), age_min int not null check(age_min>=18), age_max int not null check(age_max>=age_min and age_max<=100), goal text not null check(goal in ('Long-term relationship','Exploring a connection','Marriage-minded')), districts text[] not null check(cardinality(districts)>0), travel boolean not null default false, nearby boolean not null default false, max_km int not null default 30 check(max_km between 0 and 500), smoking text not null check(smoking in ('Never','Occasionally','Regularly')), drinking text not null check(drinking in ('Never','Occasionally','Regularly')), no_smoking boolean not null, no_drinking boolean not null, experience text not null check(experience in ('Coffee','Dinner','Mystery','Premium')));
create table public.interests(user_id uuid references public.profiles on delete cascade, name text check(length(name)<=40), primary key(user_id,name));
create table public.questionnaire_questions(id int primary key check(id between 1 and 24), category text not null check(category in ('values','interests','lifestyle','personality')), prompt text not null);
create table public.questionnaire_answers(user_id uuid references public.profiles on delete cascade, question_id int references public.questionnaire_questions, answer int not null check(answer between 1 and 5), primary key(user_id,question_id));
create table public.matching_recommendations(id uuid primary key default gen_random_uuid(), user_a uuid not null references public.profiles on delete cascade, user_b uuid not null references public.profiles on delete cascade, score int not null check(score between 0 and 100), breakdown jsonb not null, status text not null default 'suggested' check(status in ('suggested','approved','rejected')), created_at timestamptz not null default now(), check(user_a<user_b), unique(user_a,user_b));
create table public.match_invitations(id uuid primary key default gen_random_uuid(), recommendation_id uuid unique not null references public.matching_recommendations on delete cascade, expires_at timestamptz not null default now()+interval '72 hours', status text not null default 'invited' check(status in ('invited','accepted','closed')), created_at timestamptz not null default now());
create table public.match_decisions(invitation_id uuid references public.match_invitations on delete cascade, user_id uuid references public.profiles on delete cascade, accepted boolean not null, created_at timestamptz not null default now(), primary key(invitation_id,user_id));
create table public.approved_matches(invitation_id uuid primary key references public.match_invitations on delete cascade, created_at timestamptz not null default now());
create table public.partner_venues(id uuid primary key default gen_random_uuid(), name text not null, country text not null default 'LK' check(country='LK'), district text not null, city text not null, foreign key(district,city) references public.cities(district,name), address text not null, contact text not null, vetted boolean not null default false, active boolean not null default false, is_demo boolean not null default false);
create table public.date_packages(id text primary key, name text not null, price_lkr numeric(10,2) not null check(price_lkr>0), description text not null, active boolean not null default true);
create table public.date_bookings(id uuid primary key default gen_random_uuid(), invitation_id uuid not null references public.approved_matches on delete cascade, user_id uuid not null references public.profiles on delete cascade, venue_id uuid not null references public.partner_venues, package_id text not null references public.date_packages, date_at timestamptz not null, status text not null default 'requested' check(status in ('requested','confirmed','cancelled','completed')), note text not null default '' check(length(note)<=500), created_at timestamptz not null default now());
create unique index one_active_booking on public.date_bookings(invitation_id,user_id) where status <> 'cancelled';
create table public.payments(id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.date_bookings on delete cascade, user_id uuid references public.profiles on delete set null, amount_lkr numeric(10,2) not null check(amount_lkr>0), currency text not null default 'LKR' check(currency='LKR'), mode text not null check(mode in ('sandbox','live')), status text not null default 'pending' check(status in ('pending','paid','failed','refund_requested','refunded')), provider_id text unique, created_at timestamptz not null default now());
create table public.notifications(id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade, kind text not null, message text not null, read_at timestamptz, created_at timestamptz not null default now());
create table public.notification_outbox(id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade, kind text not null, subject text not null, body text not null, delivered_at timestamptz, attempts int not null default 0, claim_until timestamptz, created_at timestamptz not null default now());
create table public.date_feedback(booking_id uuid primary key references public.date_bookings on delete cascade, user_id uuid not null references public.profiles on delete cascade, enjoyed boolean not null, comfortable boolean not null, safe boolean not null, another boolean not null, recommend boolean not null, exchange_consent boolean not null default false, note text not null default '' check(length(note)<=1000), created_at timestamptz not null default now());
create table public.user_blocks(user_id uuid references public.profiles on delete cascade, blocked_id uuid references public.profiles on delete cascade, created_at timestamptz not null default now(), primary key(user_id,blocked_id), check(user_id<>blocked_id));
create table public.safety_reports(id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles on delete set null, reported_id uuid references public.profiles on delete set null, invitation_id uuid references public.match_invitations on delete set null, reason text not null check(length(reason) between 5 and 2000), status text not null default 'open' check(status in ('open','reviewed','resolved')), created_at timestamptz not null default now());
create table public.consent_records(id bigint generated always as identity primary key, user_id uuid not null references public.profiles on delete cascade, kind text not null, version text not null default '2026-10-27', granted boolean not null, created_at timestamptz not null default now());
create table public.admin_activity_logs(id bigint generated always as identity primary key, admin_id uuid references auth.users on delete set null, action text not null, target_id text, detail text, created_at timestamptz not null default now());
create table public.waitlist(user_id uuid primary key references public.profiles on delete cascade, district text not null references public.districts, created_at timestamptz not null default now());
create table public.rate_limits(key text primary key, window_start timestamptz not null, hits int not null);
create index on public.profiles(status,district);
create index on public.date_bookings(user_id,date_at);
create index on public.notifications(user_id,created_at desc);
create index on public.safety_reports(status);
create index on public.notification_outbox(delivered_at,claim_until);
create index on public.matching_recommendations(status);

create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from user_roles where user_id=auth.uid()); $$;
create function public.require_admin() returns void language plpgsql security definer set search_path=public as $$ begin if not is_admin() then raise exception 'Administrator access required.'; end if; end; $$;
create function public.throttle(bucket text, max_hits int default 30) returns void language plpgsql security definer set search_path=public as $$
declare n int; begin
 if auth.uid() is null then raise exception 'Sign in first.'; end if;
 insert into rate_limits values(auth.uid()::text||':'||bucket,now(),1) on conflict(key) do update set hits=case when rate_limits.window_start<now()-interval '1 minute' then 1 else rate_limits.hits+1 end,window_start=case when rate_limits.window_start<now()-interval '1 minute' then now() else rate_limits.window_start end returning hits into n;
 if n>max_hits then raise exception 'Too many requests. Please try again in a minute.'; end if;
end; $$;
create function public.notify(who uuid, event text, body text) returns void language plpgsql security definer set search_path=public as $$ begin
 insert into notifications(user_id,kind,message) values(who,event,body);
 insert into notification_outbox(user_id,kind,subject,body) values(who,event,'Blind Date Club · '||replace(event,'_',' '),body);
end; $$;
create function public.on_signup() returns trigger language plpgsql security definer set search_path=public as $$
declare m jsonb:=new.raw_user_meta_data; begin
 if m->>'country'<>'LK' or coalesce((m->>'resident')::boolean,false)=false or coalesce((m->>'consent')::boolean,false)=false then raise exception 'Our service is exclusively for adults currently residing in Sri Lanka. Residence and terms consent are required.'; end if;
 insert into profiles(id,first_name,display_name,phone,dob,gender,country,resident,district,city,status,is_demo) values(new.id,m->>'first_name',left(m->>'first_name',40),m->>'phone',(m->>'dob')::date,m->>'gender',m->>'country',(m->>'resident')::boolean,m->>'district',m->>'city',case when (select active from districts where name=m->>'district') then 'pending' else 'waitlist' end,false);
 insert into verification_status(user_id) values(new.id);
 insert into consent_records(user_id,kind,granted) values(new.id,'terms_privacy',true),(new.id,'sri_lanka_residence',true);
 if not (select active from districts where name=m->>'district') then insert into waitlist(user_id,district) values(new.id,m->>'district'); end if;
 perform notify(new.id,'welcome','Welcome. Complete your questionnaire and verify your email. Our team will review your Sri Lankan residency before matching.');
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.on_signup();

create function public.save_questionnaire(payload jsonb) returns void language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); vals jsonb:=payload->'answers'; d text; begin
 perform throttle('questionnaire',10);
 if (select status from profiles where id=u)='suspended' then raise exception 'Account suspended.'; end if;
 if jsonb_array_length(vals)<>24 or exists(select 1 from jsonb_array_elements_text(vals) v where v::int not between 1 and 5) then raise exception 'Complete all 24 questions.'; end if;
 for d in select jsonb_array_elements_text(payload->'districts') loop if not exists(select 1 from districts where name=d) then raise exception 'Only Sri Lankan districts are supported.'; end if; end loop;
 update profiles set display_name=payload->>'display_name',occupation=coalesce(payload->>'occupation',''),introduction=coalesce(payload->>'introduction',''),share_age=(payload->>'share_age')::boolean,share_district=(payload->>'share_district')::boolean,share_interests=(payload->>'share_interests')::boolean,share_score=(payload->>'share_score')::boolean where id=u;
 insert into dating_preferences values(u,array(select jsonb_array_elements_text(payload->'genders')),(payload->>'age_min')::int,(payload->>'age_max')::int,payload->>'goal',array(select jsonb_array_elements_text(payload->'districts')),(payload->>'travel')::boolean,(payload->>'nearby')::boolean,(payload->>'max_km')::int,payload->>'smoking',payload->>'drinking',(payload->>'no_smoking')::boolean,(payload->>'no_drinking')::boolean,payload->>'experience') on conflict(user_id) do update set genders=excluded.genders,age_min=excluded.age_min,age_max=excluded.age_max,goal=excluded.goal,districts=excluded.districts,travel=excluded.travel,nearby=excluded.nearby,max_km=excluded.max_km,smoking=excluded.smoking,drinking=excluded.drinking,no_smoking=excluded.no_smoking,no_drinking=excluded.no_drinking,experience=excluded.experience;
 delete from questionnaire_answers where user_id=u;
 insert into questionnaire_answers select u,ordinality::int,value::int from jsonb_array_elements_text(vals) with ordinality;
 delete from interests where user_id=u;
 insert into interests select distinct u,value from jsonb_array_elements_text(payload->'interests') limit 10;
 insert into consent_records(user_id,kind,granted) values(u,'anonymous_age',(payload->>'share_age')::boolean),(u,'anonymous_district',(payload->>'share_district')::boolean),(u,'anonymous_interests',(payload->>'share_interests')::boolean),(u,'anonymous_score',(payload->>'share_score')::boolean);
 -- Existing invitation eligibility is re-evaluated at every decision and booking.
end; $$;
create function public.pair_eligible(a uuid,b uuid) returns boolean language sql stable security definer set search_path=public as $$
 select coalesce((select
 a<>b and p.status='eligible' and q.status='eligible' and p.country='LK' and q.country='LK' and p.resident and q.resident and p.is_demo=q.is_demo
 and p.dob<=(current_timestamp at time zone 'Asia/Colombo')::date-interval '18 years' and q.dob<=(current_timestamp at time zone 'Asia/Colombo')::date-interval '18 years'
 and exists(select 1 from auth.users where id=a and email_confirmed_at is not null) and exists(select 1 from auth.users where id=b and email_confirmed_at is not null)
 and exists(select 1 from verification_status where user_id=a and residency_reviewed_at is not null) and exists(select 1 from verification_status where user_id=b and residency_reviewed_at is not null)
 and p.gender=any(y.genders) and q.gender=any(x.genders)
 and extract(year from age((current_timestamp at time zone 'Asia/Colombo')::date,p.dob)) between y.age_min and y.age_max and extract(year from age((current_timestamp at time zone 'Asia/Colombo')::date,q.dob)) between x.age_min and x.age_max
 and x.goal=y.goal and q.district=any(x.districts) and p.district=any(y.districts)
 and (p.city=q.city or (x.travel and y.travel))
 and (select 6371*2*asin(least(1.0,sqrt(power(sin(radians(c2.latitude-c1.latitude)/2),2)+cos(radians(c1.latitude))*cos(radians(c2.latitude))*power(sin(radians(c2.longitude-c1.longitude)/2),2)))) from cities c1 cross join cities c2 where c1.district=p.district and c1.name=p.city and c2.district=q.district and c2.name=q.city)<=least(x.max_km,y.max_km)
 and (not x.no_smoking or y.smoking='Never') and (not y.no_smoking or x.smoking='Never') and (not x.no_drinking or y.drinking='Never') and (not y.no_drinking or x.drinking='Never')
 and (select count(*) from questionnaire_answers where user_id=a)=24 and (select count(*) from questionnaire_answers where user_id=b)=24
 and not exists(select 1 from user_blocks where (user_id=a and blocked_id=b) or (user_id=b and blocked_id=a))
 and not exists(select 1 from matching_recommendations r where r.user_a=least(a,b) and r.user_b=greatest(a,b) and r.status='rejected')
 from profiles p join dating_preferences x on x.user_id=p.id cross join profiles q join dating_preferences y on y.user_id=q.id where p.id=a and q.id=b),false);
$$;
create function public.score_pair(a uuid,b uuid) returns jsonb language sql stable security definer set search_path=public as $$
 with categories as(select q.category, avg(1-abs(x.answer-y.answer)/4.0) * case q.category when 'values' then 35 when 'interests' then 25 else 20 end points from questionnaire_answers x join questionnaire_answers y on y.question_id=x.question_id and y.user_id=b join questionnaire_questions q on q.id=x.question_id where x.user_id=a group by q.category)
 select jsonb_build_object('score',round(sum(points)),'breakdown',jsonb_object_agg(category,round(points,2))) from categories;
$$;
create function public.generate_recommendations() returns int language plpgsql security definer set search_path=public as $$
declare n int; begin perform require_admin();perform throttle('recommendations',5);
 insert into matching_recommendations(user_a,user_b,score,breakdown) select a.id,b.id,(s->>'score')::int,s->'breakdown' from profiles a join profiles b on a.id<b.id cross join lateral score_pair(a.id,b.id) s where pair_eligible(a.id,b.id) on conflict(user_a,user_b) do update set score=excluded.score,breakdown=excluded.breakdown where matching_recommendations.status='suggested';
 get diagnostics n=row_count; insert into admin_activity_logs(admin_id,action,detail) values(auth.uid(),'generate_recommendations',n::text);return n;end; $$;
create function public.review_recommendation(recommendation uuid, approve boolean, hours int default 72) returns void language plpgsql security definer set search_path=public as $$
declare r matching_recommendations; begin perform require_admin();perform throttle('review'); select * into r from matching_recommendations where id=recommendation for update;
 if not found or r.status<>'suggested' then raise exception 'Recommendation is no longer pending.';end if;
 if approve and not pair_eligible(r.user_a,r.user_b) then raise exception 'This pair no longer meets eligibility rules.';end if;
 if hours not between 1 and 168 then raise exception 'Invitation duration must be 1–168 hours.';end if;
 update matching_recommendations set status=case when approve then 'approved' else 'rejected' end where id=recommendation;
 if approve then insert into match_invitations(recommendation_id,expires_at) values(recommendation,now()+make_interval(hours=>hours));perform notify(r.user_a,'match_invitation','A mystery invitation is waiting in your dashboard.');perform notify(r.user_b,'match_invitation','A mystery invitation is waiting in your dashboard.');end if;
 insert into admin_activity_logs(admin_id,action,target_id) values(auth.uid(),case when approve then 'approve_match' else 'reject_match' end,recommendation::text);end; $$;
create function public.manual_pair(a uuid,b uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare s jsonb; rid uuid;begin perform require_admin();if not pair_eligible(a,b) then raise exception 'Manual pairs must meet all mutual eligibility rules.';end if;s:=score_pair(a,b);
 insert into matching_recommendations(user_a,user_b,score,breakdown) values(least(a,b),greatest(a,b),(s->>'score')::int,s->'breakdown') returning id into rid;
 insert into admin_activity_logs(admin_id,action,target_id) values(auth.uid(),'manual_pair',rid::text);return rid;end; $$;
create function public.decide_invitation(invitation uuid, accept boolean) returns void language plpgsql security definer set search_path=public as $$
declare i match_invitations;r matching_recommendations;begin perform throttle('decision',15);
 select * into i from match_invitations where id=invitation for update;select * into r from matching_recommendations where id=i.recommendation_id;
 if auth.uid() not in (r.user_a,r.user_b) or r.id is null then raise exception 'Invitation not found.';end if;
 if i.status<>'invited' or i.expires_at<=now() or not pair_eligible(r.user_a,r.user_b) then raise exception 'This invitation is no longer available.';end if;
 insert into match_decisions(invitation_id,user_id,accepted) values(invitation,auth.uid(),accept);
 if not accept then update match_invitations set status='closed' where id=invitation;update matching_recommendations set status='rejected' where id=r.id;
 elsif (select count(*) from match_decisions where invitation_id=invitation and accepted)=2 then
 update match_invitations set status='accepted' where id=invitation;insert into approved_matches(invitation_id) values(invitation);perform notify(r.user_a,'match_accepted','You both accepted. You can now request a date.');perform notify(r.user_b,'match_accepted','You both accepted. You can now request a date.');end if;end; $$;
create function public.my_invitations() returns jsonb language sql stable security definer set search_path=public as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'status',case when i.status='invited' and i.expires_at<=now() then 'expired' else i.status end,'expires_at',i.expires_at,'my_decision',(select accepted from match_decisions where invitation_id=i.id and user_id=auth.uid()),'score',case when p.share_score then r.score end,'age_range',case when p.share_age then (floor(extract(year from age(p.dob))/5)*5)::int::text||'–'||(floor(extract(year from age(p.dob))/5)*5+4)::int::text end,'district',case when p.share_district then p.district end,'interests',case when p.share_interests then (select coalesce(jsonb_agg(name),'[]') from interests where user_id=p.id and name in(select name from interests where user_id=auth.uid())) else '[]'::jsonb end) order by i.created_at desc),'[]'::jsonb)
 from match_invitations i join matching_recommendations r on r.id=i.recommendation_id join profiles p on p.id=case when r.user_a=auth.uid() then r.user_b else r.user_a end where auth.uid() in (r.user_a,r.user_b) and not exists(select 1 from user_blocks b where (b.user_id=r.user_a and b.blocked_id=r.user_b) or (b.user_id=r.user_b and b.blocked_id=r.user_a));
$$;
create function public.request_booking(invitation uuid, venue uuid, package text, date_time timestamptz) returns uuid language plpgsql security definer set search_path=public as $$
declare r matching_recommendations;v partner_venues;bid uuid;begin perform throttle('booking',10);
 select r0.* into r from matching_recommendations r0 join match_invitations i on i.recommendation_id=r0.id join approved_matches m on m.invitation_id=i.id where i.id=invitation and i.status='accepted' for update of i;
 if r.id is null or auth.uid() not in (r.user_a,r.user_b) or not pair_eligible(r.user_a,r.user_b) then raise exception 'A currently eligible, mutually accepted match is required.';end if;
 select * into v from partner_venues where id=venue;
 if v.id is null or not v.active or not v.vetted or v.country<>'LK' or not (select active from districts where name=v.district) or v.is_demo<>(select is_demo from profiles where id=auth.uid()) then raise exception 'Choose an active, vetted Sri Lankan venue.';end if;
 if not exists(select 1 from dating_preferences where user_id=r.user_a and v.district=any(districts)) or not exists(select 1 from dating_preferences where user_id=r.user_b and v.district=any(districts)) then raise exception 'Venue must be in both members’ preferred districts.';end if;
 if date_time<now()+interval '24 hours' or date_time>now()+interval '90 days' then raise exception 'Choose a date between 24 hours and 90 days from now.';end if;
 if extract(hour from date_time at time zone 'Asia/Colombo') not between 8 and 21 then raise exception 'Please choose a time between 08:00 and 21:59 Sri Lanka time.';end if;
 if not exists(select 1 from date_packages where id=package and active) then raise exception 'Package unavailable.';end if;
 insert into date_bookings(invitation_id,user_id,venue_id,package_id,date_at) values(invitation,auth.uid(),venue,package,date_time) returning id into bid;
 perform notify(auth.uid(),'booking_requested','Your booking request is awaiting venue coordination. It is not a confirmed reservation.');return bid;end; $$;
create function public.change_booking(booking uuid, operation text, new_time timestamptz default null) returns void language plpgsql security definer set search_path=public as $$
declare b date_bookings;begin perform throttle('booking_change');select * into b from date_bookings where id=booking and user_id=auth.uid() for update;
 if b.id is null or b.status not in ('requested','confirmed') then raise exception 'Active booking not found.';end if;
 if operation='cancel' then update date_bookings set status='cancelled' where id=booking;update payments set status='refund_requested' where booking_id=booking and status='paid';perform notify(auth.uid(),'booking_cancelled','Your booking was cancelled. Eligible paid transactions have been marked for refund review.');
 elsif operation='reschedule' and new_time>now()+interval '24 hours' and new_time<now()+interval '90 days' and extract(hour from new_time at time zone 'Asia/Colombo') between 8 and 21 then update date_bookings set date_at=new_time,status='requested' where id=booking;perform notify(auth.uid(),'booking_rescheduled','Your new preferred time is awaiting venue confirmation.');
 else raise exception 'Invalid change or date.';end if;end; $$;
create function public.submit_feedback(booking uuid,payload jsonb) returns void language plpgsql security definer set search_path=public as $$
begin perform throttle('feedback',10);
 if not exists(select 1 from date_bookings where id=booking and user_id=auth.uid() and status='completed' and date_at<now()) then raise exception 'Feedback is available after your completed date.';end if;
 insert into date_feedback values(booking,auth.uid(),(payload->>'enjoyed')::boolean,(payload->>'comfortable')::boolean,(payload->>'safe')::boolean,(payload->>'another')::boolean,(payload->>'recommend')::boolean,(payload->>'exchange_consent')::boolean,coalesce(payload->>'note',''),now());
 insert into consent_records(user_id,kind,granted) values(auth.uid(),'contact_exchange:'||booking::text,(payload->>'exchange_consent')::boolean);
 if not (payload->>'safe')::boolean then insert into safety_reports(user_id,invitation_id,reason) select auth.uid(),invitation_id,'Private after-date feedback: member reported feeling unsafe.' from date_bookings where id=booking;end if;end; $$;
create function public.my_connections() returns jsonb language sql stable security definer set search_path=public as $$
 select coalesce(jsonb_agg(distinct jsonb_build_object('invitation',b.invitation_id,'first_name',p.first_name,'email',u.email)),'[]') from date_bookings b join date_feedback f on f.booking_id=b.id join date_bookings other on other.invitation_id=b.invitation_id and other.user_id<>b.user_id join date_feedback g on g.booking_id=other.id join profiles p on p.id=other.user_id join auth.users u on u.id=p.id where b.user_id=auth.uid() and f.another and g.another and f.exchange_consent and g.exchange_consent and f.safe and g.safe and pair_eligible(b.user_id,other.user_id);
$$;
create function public.report_match(invitation uuid,reason text,block boolean default true) returns void language plpgsql security definer set search_path=public as $$
declare r matching_recommendations;other uuid;begin perform throttle('report',10);select r0.* into r from matching_recommendations r0 join match_invitations i on i.recommendation_id=r0.id where i.id=invitation;
 if r.id is null or auth.uid() not in(r.user_a,r.user_b) then raise exception 'Invitation not found.';end if;other:=case when r.user_a=auth.uid() then r.user_b else r.user_a end;
 insert into safety_reports(user_id,reported_id,invitation_id,reason) values(auth.uid(),other,invitation,reason);
 if block then insert into user_blocks(user_id,blocked_id) values(auth.uid(),other) on conflict do nothing;update match_invitations set status='closed' where id=invitation;
 update date_bookings set status='cancelled' where invitation_id=invitation and status in ('requested','confirmed');update payments set status='refund_requested' where booking_id in(select id from date_bookings where invitation_id=invitation) and status='paid';end if;end; $$;
create function public.admin_action(operation text,target uuid,note text default '') returns void language plpgsql security definer set search_path=public as $$
declare b date_bookings;r matching_recommendations;begin perform require_admin();perform throttle('admin');
 if operation='verify' then
 if length(note)<10 then raise exception 'Record the residency verification method without sensitive identity documents.';end if;
 if not exists(select 1 from auth.users where id=target and email_confirmed_at is not null) then raise exception 'The applicant must verify their email first.';end if;
 update verification_status set residency_reviewed_at=now(),reviewer=auth.uid(),review_note=note where user_id=target;
 update profiles set status=case when (select active from districts where name=profiles.district) then 'eligible' else 'waitlist' end where id=target and status<>'suspended';
 elsif operation='suspend' then update profiles set status='suspended' where id=target;update match_invitations set status='closed' where recommendation_id in(select id from matching_recommendations where target in(user_a,user_b));update date_bookings set status='cancelled' where invitation_id in(select i.id from match_invitations i join matching_recommendations r on r.id=i.recommendation_id where target in(r.user_a,r.user_b)) and status in ('requested','confirmed');update payments set status='refund_requested' where status='paid' and booking_id in(select id from date_bookings where status='cancelled');
 elsif operation in ('confirm_booking','complete_booking') then
 select * into b from date_bookings where id=target for update;select r0.* into r from matching_recommendations r0 join match_invitations i on i.recommendation_id=r0.id where i.id=b.invitation_id;
 if b.id is null or not pair_eligible(r.user_a,r.user_b) then raise exception 'Booking is unavailable or a member is ineligible.';end if;
 if operation='confirm_booking' and b.status='requested' and length(note)>=5 then update date_bookings set status='confirmed',note=admin_action.note where id=target;perform notify(b.user_id,'date_confirmed','Your venue reservation has been confirmed. Check your dashboard for the details.');
 elsif operation='complete_booking' and b.status='confirmed' and b.date_at<now() then update date_bookings set status='completed' where id=target;perform notify(b.user_id,'feedback_reminder','How did your date feel? Your private feedback is ready in your dashboard.');else raise exception 'Invalid booking transition or missing venue confirmation reference.';end if;
 elsif operation='resolve_report' then update safety_reports set status='resolved' where id=target;
 elsif operation='refund' then
 if length(note)<5 then raise exception 'Enter the actual gateway refund reference.';end if;update payments set status='refunded' where id=target and status='refund_requested';
 else raise exception 'Unsupported admin operation.';end if;
 insert into admin_activity_logs(admin_id,action,target_id,detail) values(auth.uid(),operation,target::text,left(note,500));end; $$;
create function public.create_checkout(booking uuid,payment_mode text) returns jsonb language plpgsql security definer set search_path=public as $$
declare b date_bookings; amount numeric;pid uuid;r matching_recommendations;begin perform throttle('checkout',10);
 if payment_mode not in('sandbox','live') then raise exception 'Invalid payment mode.';end if;
 select * into b from date_bookings where id=booking and user_id=auth.uid() for update;
 select r0.* into r from matching_recommendations r0 join match_invitations i on i.recommendation_id=r0.id where i.id=b.invitation_id;
 if b.id is null or b.status not in('requested','confirmed') or not pair_eligible(r.user_a,r.user_b) then raise exception 'An active eligible booking is required.';end if;
 if exists(select 1 from payments where booking_id=booking and status in('paid','refund_requested')) then raise exception 'This booking has already been paid.';end if;
 select price_lkr into amount from date_packages where id=b.package_id;
 select id into pid from payments where booking_id=booking and status='pending' and mode=payment_mode limit 1;
 if pid is null then insert into payments(booking_id,user_id,amount_lkr,mode) values(booking,auth.uid(),amount,payment_mode) returning id into pid;end if;
 return jsonb_build_object('order_id',pid,'amount',amount,'currency','LKR');end; $$;
create function public.record_payment(order_id uuid,provider text,amount numeric,currency_code text,successful boolean) returns void language plpgsql security definer set search_path=public as $$
declare p payments;begin
 if auth.role()<>'service_role' then raise exception 'Verified payment callback required.';end if;
 select * into p from payments where id=order_id for update;
 if p.id is null or p.amount_lkr<>amount or currency_code<>'LKR' then raise exception 'Payment amount or currency mismatch.';end if;
 if p.status='paid' and p.provider_id=provider then return;end if;
 if p.status<>'pending' then raise exception 'Payment is not pending.';end if;
 update payments set status=case when successful then case when exists(select 1 from date_bookings where id=p.booking_id and status='cancelled') then 'refund_requested' else 'paid' end else 'failed' end,provider_id=provider where id=order_id;
 if successful then perform notify(p.user_id,'payment_confirmed','A verified LKR payment was received. Your receipt is available in your dashboard.');end if;end; $$;

-- RLS: users can read only their own sensitive records; no member directory exists.
do $$ declare t text; begin
 for t in select tablename from pg_tables where schemaname='public' loop execute format('alter table public.%I enable row level security',t);end loop;
 for t in select unnest(array['provinces','districts','cities','date_packages','questionnaire_questions']) loop execute format('create policy public_read on public.%I for select using(true)',t);end loop;

end; $$;
create policy own_read on public.profiles for select to authenticated using(id=auth.uid());
-- user_roles has user_id rather than id.
create policy own_role_read on public.user_roles for select to authenticated using(user_id=auth.uid());
do $$ declare t text; begin
 for t in select unnest(array['verification_status','dating_preferences','interests','questionnaire_answers','date_bookings','payments','notifications','date_feedback','user_blocks','safety_reports','consent_records','waitlist']) loop execute format('create policy own_read on public.%I for select to authenticated using(user_id=auth.uid())',t);end loop;
 for t in select tablename from pg_tables where schemaname='public' and tablename not in ('rate_limits','notification_outbox') loop execute format('create policy admin_read on public.%I for select to authenticated using(public.is_admin())',t);end loop;
end; $$;
create policy venue_member_read on public.partner_venues for select to authenticated using(active and vetted and is_demo=(select is_demo from public.profiles where id=auth.uid()));
revoke all on all tables in schema public from anon,authenticated;
grant select on public.provinces,public.districts,public.cities,public.date_packages,public.questionnaire_questions to anon,authenticated;
grant select on all tables in schema public to authenticated;
revoke select on public.rate_limits,public.notification_outbox from authenticated;
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.is_admin(),public.save_questionnaire(jsonb),public.generate_recommendations(),public.review_recommendation(uuid,boolean,int),public.manual_pair(uuid,uuid),public.decide_invitation(uuid,boolean),public.my_invitations(),public.request_booking(uuid,uuid,text,timestamptz),public.change_booking(uuid,text,timestamptz),public.submit_feedback(uuid,jsonb),public.my_connections(),public.report_match(uuid,text,boolean),public.admin_action(text,uuid,text),public.create_checkout(uuid,text) to authenticated;
grant execute on function public.record_payment(uuid,text,numeric,text,boolean) to service_role;
-- A private bucket; no public object URLs or cross-member access.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('private-media','private-media',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict do nothing;
create policy own_private_media_read on storage.objects for select to authenticated using(bucket_id='private-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy own_private_media_insert on storage.objects for insert to authenticated with check(bucket_id='private-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy own_private_media_delete on storage.objects for delete to authenticated using(bucket_id='private-media' and (storage.foldername(name))[1]=auth.uid()::text);
