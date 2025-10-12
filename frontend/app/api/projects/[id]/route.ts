import { NextResponse } from 'next/server';

export async function DELETE(_req: Request, context: any) {
  // Accept delete for UI flow; no-op as this is mock data
  const id = context?.params?.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}
