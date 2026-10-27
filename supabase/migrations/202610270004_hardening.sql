-- Retain unlinked financial references after an account is removed; no member contact data is retained here.
alter table public.payments alter column booking_id drop not null;
alter table public.payments drop constraint payments_booking_id_fkey;
alter table public.payments add constraint payments_booking_id_fkey foreign key(booking_id) references public.date_bookings(id) on delete set null;
-- Private objects may not introduce recursive folder structures.
alter policy own_private_media_insert on storage.objects with check(bucket_id='private-media' and (storage.foldername(name))[1]=auth.uid()::text and cardinality(storage.foldername(name))=1);
create or replace function public.admin_action(operation text,target uuid,note text default '') returns void language plpgsql security definer set search_path=public as $$
declare b date_bookings;r matching_recommendations;begin perform require_admin();perform throttle('admin');
 if operation='verify' then
 if length(note)<10 then raise exception 'Record the residency verification method without sensitive identity documents.';end if;
 if not exists(select 1 from auth.users where id=target and email_confirmed_at is not null) then raise exception 'The applicant must verify their email first.';end if;
 update verification_status set residency_reviewed_at=now(),reviewer=auth.uid(),review_note=note where user_id=target;
 update profiles set status=case when (select active from districts where name=profiles.district) then 'eligible' else 'waitlist' end where id=target and status<>'suspended';
 elsif operation='suspend' then update profiles set status='suspended' where id=target;update match_invitations set status='closed' where recommendation_id in(select id from matching_recommendations where target in(user_a,user_b));update date_bookings set status='cancelled' where invitation_id in(select i.id from match_invitations i join matching_recommendations mr on mr.id=i.recommendation_id where target in(mr.user_a,mr.user_b)) and status in ('requested','confirmed');update payments set status='refund_requested' where status='paid' and booking_id in(select id from date_bookings where status='cancelled');
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
