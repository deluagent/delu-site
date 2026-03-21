import { NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET() {
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/deluagent/delu-site/main/public/data/research.json',
      { cache: 'no-store' }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({});
  }
}
