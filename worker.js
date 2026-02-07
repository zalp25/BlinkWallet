export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/rates") {
      const currentRaw = await env.RATES_KV.get("rates:current");
      const dailyRaw = await env.RATES_KV.get("rates:daily");

      if (!currentRaw || !dailyRaw) {
        return new Response(JSON.stringify({ error: "No rates yet" }), {
          status: 503,
          headers: { "content-type": "application/json" }
        });
      }

      const current = JSON.parse(currentRaw);
      const daily = JSON.parse(dailyRaw);

      const roi = {};
      for (const k in current) {
        const base = daily[k];
        if (base) {
          roi[k] = ((current[k] - base) / base) * 100;
        }
      }

      return new Response(JSON.stringify({ current, daily, roi }), {
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*"
        }
      });
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(updateRates(env));
  }
};

async function updateRates(env) {
  const url =
    "https://api.coingecko.com/api/v3/simple/price" +
    "?ids=bitcoin,ethereum,solana,tron,the-open-network,tether" +
    "&vs_currencies=usd";

  const res = await fetch(url);
  const data = await res.json();

  const rates = {
    BTC: data.bitcoin.usd,
    ETH: data.ethereum.usd,
    SOL: data.solana.usd,
    TRX: data.tron.usd,
    TON: data["the-open-network"].usd,
    USDT: 1
  };

  await env.RATES_KV.put("rates:current", JSON.stringify(rates));

  const todayKey = "rates:daily:date";
  const today = new Date().toISOString().slice(0, 10);
  const savedDate = await env.RATES_KV.get(todayKey);

  if (savedDate !== today) {
    await env.RATES_KV.put("rates:daily", JSON.stringify(rates));
    await env.RATES_KV.put(todayKey, today);
  }
}
