create policy "server_only_placement_users" on public.placement_users for all to public using (false) with check (false);
create policy "server_only_candidate_profiles" on public.candidate_profiles for all to public using (false) with check (false);
create policy "server_only_placement_drives" on public.placement_drives for all to public using (false) with check (false);
create policy "server_only_applications" on public.applications for all to public using (false) with check (false);
create policy "server_only_interview_panels" on public.interview_panels for all to public using (false) with check (false);
create policy "server_only_interview_rooms" on public.interview_rooms for all to public using (false) with check (false);
create policy "server_only_interviews" on public.interviews for all to public using (false) with check (false);
create policy "server_only_notifications" on public.notifications for all to public using (false) with check (false);
