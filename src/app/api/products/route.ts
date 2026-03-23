import { addProduct, toApiError } from '@/lib/app-data-server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import type { Product } from '@/types';

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAuthenticatedUser();
    const body = (await request.json()) as Product;
    const result = await addProduct(supabase, body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to add the product.'), { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 });
  }
}
