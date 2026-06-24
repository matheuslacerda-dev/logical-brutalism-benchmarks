import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

// Permite buscar cotações em tempo real e ignora cache
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({ error: 'Symbols parameter is required (e.g. ?symbols=AAPL,MSFT)' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());

  try {
    const quotes = await yahooFinance.quote(symbols);
    // yahooFinance.quote can return a single object or an array depending on the input.
    const result = Array.isArray(quotes) ? quotes : [quotes];
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching market data:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch market data' }, { status: 500 });
  }
}
