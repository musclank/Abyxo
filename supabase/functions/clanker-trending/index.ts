const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function first(...values: any[]): any {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function imageUrl(value: any, depth = 0): string {
  if (!value || depth > 5) return "";
  if (typeof value === "object") {
    return imageUrl(first(value.url, value.uri, value.src, value.original, value.imageUrl, value.image_url, value.image, value.ipfs), depth + 1);
  }
  const raw = String(value).trim();
  if (raw.startsWith("ipfs://")) return "https://ipfs.io/ipfs/" + raw.slice(7).replace(/^ipfs\//, "");
  if (raw.startsWith("ipfs/")) return "https://ipfs.io/" + raw;
  if (raw.startsWith("//")) return "https:" + raw;
  return raw;
}

function normalizeTrending(payload: any) {
  const pools = Array.isArray(payload?.trending) ? payload.trending : [];
  const tokenMap = payload?.tokens && typeof payload.tokens === "object" ? payload.tokens : {};
  return pools.map((pool: any) => {
    const attrs = pool?.attributes || {};
    const idAddress = String(pool?.id || "").replace(/^[^_]+_/, "");
    const poolAddress = String(first(attrs.address, idAddress, "")).toLowerCase();
    const token = tokenMap[poolAddress] || tokenMap[String(attrs.address || "").toLowerCase()] || {};
    const volume = attrs.volume_usd || attrs.volumeUsd || {};
    const changes = attrs.price_change_percentage || attrs.priceChangePercentage || {};
    const tokenImage = imageUrl(first(
      token.image, token.image_url, token.imageUrl, token.img_url, token.imgUrl,
      token.logo, token.logo_url, token.logoUrl, token.metadata?.image,
      token.metadata?.image_url, token.metadata?.imageUrl,
      token.meta?.image, token.meta?.image_url
    ));
    return {
      name: first(token.name, token.token_name, attrs.name, "Unknown token"),
      symbol: first(token.symbol, token.ticker, "—"),
      address: first(token.contract_address, token.token_address, token.address, ""),
      imageUrl: tokenImage,
      chain: first(token.chain, token.chain_name, "Base"),
      volume24h: Number(first(volume.h24, attrs.volume24h, attrs.volume_24h, attrs.volume_24h_usd, token.volume24h, 0)),
      marketCap: Number(first(attrs.market_cap_usd, attrs.marketCapUsd, attrs.market_cap, token.marketCap, token.market_cap, 0)),
      liquidity: Number(first(attrs.reserve_in_usd, attrs.liquidity_usd, attrs.liquidity, token.liquidityUsd, token.liquidity, 0)),
      change24h: Number(first(changes.h24, attrs.price_change_24h, attrs.change24h, token.priceChangePercent24h, 0)),
      poolAddress,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = await fetch("https://www.clanker.world/api/tokens/trending", {
      headers: { Accept: "application/json" },
    });
    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: "Clanker API returned HTTP " + upstream.status }), {
        status: upstream.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const payload = await upstream.json();
    const tokens = normalizeTrending(payload);
    return new Response(JSON.stringify({ tokens }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=15" },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unable to reach Clanker API",
    }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
