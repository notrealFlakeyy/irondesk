import { addRegisterNote, toApiError } from '@/lib/app-data-server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import type { CreateRegisterNoteParams } from '@/types';

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAuthenticatedUser();
    const body = (await request.json()) as CreateRegisterNoteParams;
    const result = await addRegisterNote(supabase, body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to save the register note.'), {
      status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
    });
  }
}
