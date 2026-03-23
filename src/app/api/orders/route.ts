import { createSpecialOrder, toApiError } from '@/lib/app-data-server';
import type { CreateSpecialOrderParams } from '@/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateSpecialOrderParams;
    const result = await createSpecialOrder(body);
    return Response.json(result);
  } catch (error) {
    return Response.json(toApiError(error, 'Failed to create the special order.'), { status: 500 });
  }
}
