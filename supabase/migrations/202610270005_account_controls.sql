create function public.admin_applicants() returns jsonb language plpgsql stable security definer set search_path=public as $$
begin perform require_admin();return (select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('email',u.email,'email_verified',u.email_confirmed_at is not null,'phone_verified',u.phone_confirmed_at is not null,'residency_reviewed_at',v.residency_reviewed_at,'review_note',v.review_note,'answer_count',(select count(*) from questionnaire_answers where user_id=p.id)) order by p.created_at desc),'[]') from profiles p join auth.users u on u.id=p.id join verification_status v on v.user_id=p.id);end; $$;
create function public.update_residence(district_name text,city_name text) returns void language plpgsql security definer set search_path=public as $$
begin perform throttle('residence',3);
 if not exists(select 1 from cities where district=district_name and name=city_name) then raise exception 'Select a validated town in Sri Lanka.';end if;
 if (select status from profiles where id=auth.uid())='suspended' then raise exception 'Contact support before changing a suspended account.';end if;
 update profiles set district=district_name,city=city_name,status=case when (select active from districts where name=district_name) then 'pending' else 'waitlist' end where id=auth.uid();
 update verification_status set residency_reviewed_at=null,reviewer=null,review_note=null where user_id=auth.uid();
 if (select active from districts where name=district_name) then delete from waitlist where user_id=auth.uid();else insert into waitlist(user_id,district) values(auth.uid(),district_name) on conflict(user_id) do update set district=excluded.district;end if;
 update match_invitations set status='closed' where recommendation_id in(select id from matching_recommendations where auth.uid() in(user_a,user_b));
 update date_bookings set status='cancelled' where invitation_id in(select i.id from match_invitations i join matching_recommendations r on r.id=i.recommendation_id where auth.uid() in(r.user_a,r.user_b)) and status in('requested','confirmed');
 update payments set status='refund_requested' where status='paid' and booking_id in(select b.id from date_bookings b join match_invitations i on i.id=b.invitation_id join matching_recommendations r on r.id=i.recommendation_id where auth.uid() in(r.user_a,r.user_b) and b.status='cancelled');
 insert into consent_records(user_id,kind,granted) values(auth.uid(),'updated_sri_lanka_residence',true);perform notify(auth.uid(),'residency_review','Your location changed. Eligibility will be reviewed again and active date requests have been closed.');end; $$;
create function public.pause_matching() returns void language plpgsql security definer set search_path=public as $$
begin perform throttle('pause',3);
 if (select status from profiles where id=auth.uid())='suspended' then raise exception 'Account already restricted.';end if;
 update profiles set status='pending' where id=auth.uid();update verification_status set residency_reviewed_at=null where user_id=auth.uid();
 update match_invitations set status='closed' where recommendation_id in(select id from matching_recommendations where auth.uid() in(user_a,user_b));
 update date_bookings set status='cancelled' where invitation_id in(select i.id from match_invitations i join matching_recommendations r on r.id=i.recommendation_id where auth.uid() in(r.user_a,r.user_b)) and status in('requested','confirmed');
 update payments set status='refund_requested' where status='paid' and booking_id in(select b.id from date_bookings b join match_invitations i on i.id=b.invitation_id join matching_recommendations r on r.id=i.recommendation_id where auth.uid() in(r.user_a,r.user_b) and b.status='cancelled');
 insert into consent_records(user_id,kind,granted) values(auth.uid(),'active_matching',false);perform notify(auth.uid(),'matching_paused','Matching is paused. Contact our team for a fresh eligibility review before resuming.');end; $$;
create or replace function public.claim_emails() returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;begin if auth.role()<>'service_role' then raise exception 'Server-only operation.';end if;
 with picked as(select o.id from notification_outbox o join auth.users u on u.id=o.user_id join profiles p on p.id=o.user_id where o.delivered_at is null and o.attempts<5 and (o.claim_until is null or o.claim_until<now()) and u.email_confirmed_at is not null and not p.is_demo order by o.created_at for update of o skip locked limit 25),claimed as(update notification_outbox set claim_until=now()+interval '5 minutes',attempts=attempts+1 where id in(select id from picked) returning *) select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'email',u.email,'subject',c.subject,'body',c.body)),'[]') into result from claimed c join auth.users u on u.id=c.user_id;
 return result;end; $$;
revoke execute on function public.admin_applicants(),public.update_residence(text,text),public.pause_matching() from public,anon,authenticated;
grant execute on function public.admin_applicants(),public.update_residence(text,text),public.pause_matching() to authenticated;
