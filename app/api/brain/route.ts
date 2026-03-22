import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const file = path.join(process.cwd(), 'public', 'data', 'brain.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'brain.json not found' }, { status: 404 });
  }
}
