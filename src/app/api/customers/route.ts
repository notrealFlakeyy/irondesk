import { addCustomer, toApiError } from '@/lib/app-data-server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import type { Customer } from '@/types';

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAuthenticatedUser();
    const body = (await request.json()) as Customer;
    const result = await addCustomer(supabase, body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to add the customer.'), { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
