create table public.contact_messages(id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 2 and 80),email text not null check(length(email)<255),message text not null check(length(message) between 10 and 3000),created_at timestamptz not null default now());
alter table public.contact_messages enable row level security;
create policy admin_read on public.contact_messages for select to authenticated using(public.is_admin());
grant select on public.contact_messages to authenticated;
create function public.contact_request(sender text,email_address text,body text,rate_key text) returns void language plpgsql security definer set search_path=public as $$
declare n int;begin
 if auth.role()<>'service_role' then raise exception 'Server-only operation.';end if;
 insert into rate_limits values('contact:'||rate_key,now(),1) on conflict(key) do update set hits=case when rate_limits.window_start<now()-interval '1 hour' then 1 else rate_limits.hits+1 end,window_start=case when rate_limits.window_start<now()-interval '1 hour' then now() else rate_limits.window_start end returning hits into n;
 if n>5 then raise exception 'Too many messages. Please try again later.';end if;
 insert into contact_messages(name,email,message) values(sender,email_address,body);end; $$;
create function public.save_venue(payload jsonb) returns void language plpgsql security definer set search_path=public as $$
declare venue uuid;begin perform require_admin();perform throttle('venue',10);
 if payload->>'country'<>'LK' then raise exception 'Venues must be in Sri Lanka.';end if;
 if (payload->>'active')::boolean and not (payload->>'vetted')::boolean then raise exception 'Only vetted public venues can be activated.';end if;
 venue:=nullif(payload->>'id','')::uuid;
 if venue is null then insert into partner_venues(name,district,city,address,contact,vetted,active,is_demo) values(left(payload->>'name',150),payload->>'district',payload->>'city',left(payload->>'address',300),left(payload->>'contact',200),(payload->>'vetted')::boolean,(payload->>'active')::boolean,(payload->>'is_demo')::boolean) returning id into venue;
 else update partner_venues set name=left(payload->>'name',150),district=payload->>'district',city=payload->>'city',address=left(payload->>'address',300),contact=left(payload->>'contact',200),vetted=(payload->>'vetted')::boolean,active=(payload->>'active')::boolean where id=venue;end if;
 insert into admin_activity_logs(admin_id,action,target_id) values(auth.uid(),'save_venue',venue::text);end; $$;
create function public.update_package(package text,amount numeric,enabled boolean) returns void language plpgsql security definer set search_path=public as $$ begin perform require_admin();if amount<1 or amount>1000000 then raise exception 'Invalid LKR price.';end if;update date_packages set price_lkr=amount,active=enabled where id=package;insert into admin_activity_logs(admin_id,action,target_id,detail) values(auth.uid(),'update_package',package,amount::text||' LKR');end; $$;
alter table public.notification_outbox add column dedupe_key text unique;
create function public.queue_reminders() returns void language plpgsql security definer set search_path=public as $$
begin if auth.role()<>'service_role' then raise exception 'Server-only operation.';end if;
 insert into notification_outbox(user_id,kind,subject,body,dedupe_key) select user_id,'date_reminder','Your date is coming up','Your confirmed date is within 24 hours. Please check your dashboard for the venue, share your plans with a trusted person, and arrange your own transport.','reminder:'||id from date_bookings where status='confirmed' and date_at between now() and now()+interval '24 hours' on conflict(dedupe_key) do nothing;
end; $$;
create function public.claim_emails() returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;begin if auth.role()<>'service_role' then raise exception 'Server-only operation.';end if;
 with picked as(select id from notification_outbox where delivered_at is null and attempts<5 and (claim_until is null or claim_until<now()) order by created_at for update skip locked limit 25),claimed as(update notification_outbox set claim_until=now()+interval '5 minutes',attempts=attempts+1 where id in(select id from picked) returning *) select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'email',u.email,'subject',c.subject,'body',c.body)),'[]') into result from claimed c join auth.users u on u.id=c.user_id join profiles p on p.id=c.user_id where u.email_confirmed_at is not null and not p.is_demo;
 return result;end; $$;
revoke execute on function public.contact_request(text,text,text,text),public.save_venue(jsonb),public.update_package(text,numeric,boolean),public.queue_reminders(),public.claim_emails() from public,anon,authenticated;
grant execute on function public.save_venue(jsonb),public.update_package(text,numeric,boolean) to authenticated;
grant execute on function public.contact_request(text,text,text,text),public.queue_reminders(),public.claim_emails() to service_role;
