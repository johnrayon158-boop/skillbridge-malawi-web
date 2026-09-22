import { supabase } from './supabaseClient';

export function readableSupabaseError(error, fallback = 'Unable to complete the request.') {
  if (import.meta.env.DEV && error) console.error(error);
  if (error?.code === '42501') return 'You do not have permission to perform that action.';
  if (error?.code === '23505') return 'This record already exists.';
  if (error?.code === 'PGRST116') return 'The requested record was not found.';
  return fallback;
}

export async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function fetchCareers(search = '') {
  let query = supabase
    .from('careers')
    .select('id,title,description,industry,demand_level,required_education,career_categories(name),career_skills(skill_id,required_level,importance,skills(id,name))')
    .eq('active', true)
    .order('title');
  if (search.trim()) query = query.ilike('title', `%${search.trim()}%`);
  return query;
}

export async function fetchSkills(search = '') {
  let query = supabase
    .from('skills')
    .select('id,name,description,skill_type,difficulty_level,skill_categories(name)')
    .eq('active', true)
    .order('name');
  if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);
  return query;
}

export async function fetchPublishedJobs({ search = '', industry = '', employmentType = '' } = {}) {
  let query = supabase
    .from('jobs')
    .select('id,title,description,employment_type,industry,location_text,salary_min,salary_max,application_deadline,status,experience_level,education_level,employer_profiles(id,company_name,industry,website),job_skills(skill_id,required_level,importance,skills(id,name))')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (search.trim()) query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,industry.ilike.%${search.trim()}%`);
  if (industry) query = query.eq('industry', industry);
  if (employmentType) query = query.eq('employment_type', employmentType);
  return query;
}

export async function fetchJob(id) {
  return supabase
    .from('jobs')
    .select('*,employer_profiles(id,company_name,description,industry,website,location_text),job_skills(skill_id,required_level,importance,skills(id,name)),job_qualifications(id,description,required,qualifications(name))')
    .eq('id', id)
    .maybeSingle();
}

export async function fetchOwnApplications(userId) {
  return supabase
    .from('applications')
    .select('id,job_id,status,cover_letter,applied_at,updated_at,jobs(id,title,industry,location_text,employer_profiles(company_name)),application_events(id,status,note,created_at)')
    .eq('applicant_id', userId)
    .order('applied_at', { ascending: false });
}

export async function fetchOwnNotifications(userId) {
  return supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
}
