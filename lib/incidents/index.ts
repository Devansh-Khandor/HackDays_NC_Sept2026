import 'server-only';
import {SupabaseIncidentRepository} from './supabaseRepository';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {requireUser} from '@/lib/auth/server';
export async function getRepository(){await requireUser();return new SupabaseIncidentRepository(await createSupabaseServerClient());}
