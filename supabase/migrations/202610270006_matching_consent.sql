alter table public.profiles add column matching_enabled boolean not null default true;
create or replace function public.pair_eligible(a uuid,b uuid) returns boolean language sql stable security definer set search_path=public as $$
 select coalesce((select
 a<>b and p.matching_enabled and q.matching_enabled and p.status='eligible' and q.status='eligible' and p.country='LK' and q.country='LK' and p.resident and q.resident and p.is_demo=q.is_demo
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
create or replace function public.pause_matching() returns void language plpgsql security definer set search_path=public as $$
begin perform throttle('pause',3);
 if (select status from profiles where id=auth.uid())='suspended' then raise exception 'Account already restricted.';end if;
 update profiles set status='pending',matching_enabled=false where id=auth.uid();update verification_status set residency_reviewed_at=null where user_id=auth.uid();
 update match_invitations set status='closed' where recommendation_id in(select id from matching_recommendations where auth.uid() in(user_a,user_b));
 update date_bookings set status='cancelled' where invitation_id in(select i.id from match_invitations i join matching_recommendations r on r.id=i.recommendation_id where auth.uid() in(r.user_a,r.user_b)) and status in('requested','confirmed');
 update payments set status='refund_requested' where status='paid' and booking_id in(select b.id from date_bookings b join match_invitations i on i.id=b.invitation_id join matching_recommendations r on r.id=i.recommendation_id where auth.uid() in(r.user_a,r.user_b) and b.status='cancelled');
 insert into consent_records(user_id,kind,granted) values(auth.uid(),'active_matching',false);perform notify(auth.uid(),'matching_paused','Matching is paused. Contact our team for a fresh eligibility review before resuming.');end; $$;
create function public.resume_matching(declaration boolean) returns void language plpgsql security definer set search_path=public as $$
begin perform throttle('resume',3);if not coalesce(declaration,false) then raise exception 'Current Sri Lankan residence declaration required.';end if;
if (select status from profiles where id=auth.uid())='suspended' then raise exception 'Suspended accounts require support review.';end if;
update profiles set matching_enabled=true,status=case when (select active from districts where name=profiles.district) then 'pending' else 'waitlist' end where id=auth.uid();update verification_status set residency_reviewed_at=null where user_id=auth.uid();insert into consent_records(user_id,kind,granted) values(auth.uid(),'active_matching',true),(auth.uid(),'sri_lanka_residence',true);end; $$;
revoke execute on function public.resume_matching(boolean) from public,anon,authenticated;
grant execute on function public.resume_matching(boolean) to authenticated;
