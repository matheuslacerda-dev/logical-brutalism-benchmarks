import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const result = await yahooFinance.search(q);
    return NextResponse.json((result as any).quotes || result);
  } catch (error) {
    console.error(`Error searching for ${q}:`, error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
