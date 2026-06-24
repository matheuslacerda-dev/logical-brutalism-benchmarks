import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tickerStr = searchParams.get('tickers');
  const type = searchParams.get('type') || 'quote'; // 'quote' or 'historical'

  if (!tickerStr) {
    return NextResponse.json({ error: 'Missing tickers parameter' }, { status: 400 });
  }

  const tickers = tickerStr.split(',').map((t) => t.trim());

  try {
    if (type === 'historical') {
      // For historical, we expect a single ticker for now
      const ticker = tickers[0];
      const queryOptions = { period1: '2020-01-01' }; // You can make this dynamic
      // Fetch the last 30 days
      const date = new Date();
      date.setDate(date.getDate() - 30);
      const period1 = date.toISOString().split('T')[0];
      
      const chartResult = await yahooFinance.chart(ticker, { period1, interval: '1d' });
      return NextResponse.json({ historical: chartResult.quotes });
    }

    // Default to quote
    if (tickers.length === 1) {
      const quote = await yahooFinance.quote(tickers[0]);
      return NextResponse.json({ quotes: [quote] });
    } else {
      const quotes = await Promise.all(tickers.map((t) => yahooFinance.quote(t)));
      return NextResponse.json({ quotes });
    }
  } catch (error: any) {
    console.error('Yahoo Finance API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
