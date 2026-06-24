const yahooFinance = require('yahoo-finance2').default;

async function test() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  const period1 = date.toISOString().split('T')[0];
  console.log("period1:", period1);
  try {
    const historical = await yahooFinance.historical('AAPL', { period1 });
    console.log("Length:", historical.length);
    if(historical.length > 0) {
      console.log("First item:", historical[0]);
    }
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
