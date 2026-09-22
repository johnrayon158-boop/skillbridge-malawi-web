-- SkillBridge Malawi RLS updates for the Supabase-connected frontend.
-- Run after complete_schema.sql in the Supabase SQL Editor.

-- Assessment results are created by the authenticated owner after submitting an attempt.
drop policy if exists "own assessment results insert" on public.assessment_results;
create policy "own assessment results insert"
on public.assessment_results for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.assessment_attempts a
    where a.id = attempt_id and a.user_id = (select auth.uid())
  )
);

-- A user may persist the gap items belonging to their own analysis.
drop policy if exists "own gap items manage" on public.skills_gap_items;
create policy "own gap items manage"
on public.skills_gap_items for all to authenticated
using (
  exists (
    select 1 from public.skills_gap_analyses a
    where a.id = analysis_id and (a.user_id = (select auth.uid()) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.skills_gap_analyses a
    where a.id = analysis_id and (a.user_id = (select auth.uid()) or public.is_admin())
  )
);

-- Portfolio certificates belong to the portfolio owner.
drop policy if exists "own portfolio certificates" on public.portfolio_certificates;
create policy "own portfolio certificates"
on public.portfolio_certificates for all to authenticated
using (
  exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and (p.user_id = (select auth.uid()) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and (p.user_id = (select auth.uid()) or public.is_admin())
  )
);

-- Users may add and manage their own portfolio links.
drop policy if exists "own portfolio links" on public.portfolio_links;
create policy "own portfolio links"
on public.portfolio_links for all to authenticated
using (
  exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and (p.user_id = (select auth.uid()) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.portfolios p
    where p.id = portfolio_id and (p.user_id = (select auth.uid()) or public.is_admin())
  )
);
