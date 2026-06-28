import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, message: 'Invalid secret' }, { status: 401 });
  }

  revalidatePath('/');
  revalidatePath('/posts');
  revalidatePath('/posts/[slug]', 'page');

  return NextResponse.json({ ok: true, revalidated: true, at: new Date().toISOString() });
}
