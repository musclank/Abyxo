(() => {
  const config = window.ABYXO_SUPABASE_CONFIG;
  const supabaseReady = !!(window.supabase && config?.url && config?.anonKey);
  const supabaseClient = supabaseReady
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;
  const rows = document.querySelector("#clanker-rows");
  const mobile = document.querySelector("#clanker-mobile-list");
  const status = document.querySelector("#clanker-status");
  const dot = document.querySelector("#clanker-live-dot");
  const updated = document.querySelector("#clanker-updated");
  const refreshButton = document.querySelector("#clanker-refresh");
  const sortButtons = [...document.querySelectorAll("[data-sort]")];
  let tokens = [];
  let sortBy = "volume24h";
  let busy = false;

  const aliases = {
    volume24h: ["volume24h","volume24hUsd","volume24hUSD","volume_24h","volume24Hours","volume24hUsdValue","volume24"],
    marketCap: ["marketCap","marketCapUsd","marketcap","market_cap","fdv","fdvUsd"],
    liquidity: ["liquidity","liquidityUsd","liquidityUSD","totalLiquidity","liquidity_usd"],
    change24h: ["change24h","priceChange24h","priceChange24H","price_change_24h","change24","priceChange"],
    name: ["name","tokenName","displayName"],
    symbol: ["symbol","ticker"],
    address: ["tokenAddress","address","contractAddress","token_address"],
    image: ["imageUrl","image_url","image","logoUrl","logoURI","logo"],
    chain: ["chainName","chain","network"]
  };

  function pick(obj, keys) {
    for (const key of keys) if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
    return undefined;
  }
  function numeric(value) {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const clean = value.trim().replace(/[$,%\s,]/g, "").toUpperCase();
      const match = clean.match(/^(-?\d+(?:\.\d+)?)([KMB])?$/);
      if (!match) return Number(clean);
      return Number(match[1]) * ({K:1e3,M:1e6,B:1e9}[match[2]] || 1);
    }
    if (value && typeof value === "object") return numeric(value.usd ?? value.value ?? value.amount);
    return NaN;
  }
  function nestedObjects(root, maxDepth = 5) {
    const found = [];
    const queue = [{ value: root, depth: 0 }];
    const seen = new Set();
    while (queue.length) {
      const { value, depth } = queue.shift();
      if (!value || typeof value !== "object" || seen.has(value) || depth > maxDepth) continue;
      seen.add(value);
      if (!Array.isArray(value)) found.push(value);
      if (depth < maxDepth) {
        for (const child of Object.values(value)) {
          if (child && typeof child === "object") queue.push({ value: child, depth: depth + 1 });
        }
      }
    }
    return found;
  }
  function deepPick(objects, keys) {
    for (const obj of objects) {
      const value = pick(obj, keys);
      if (value !== undefined) return value;
    }
    return undefined;
  }
  function tokenObject(item) {
    const objects = nestedObjects(item);
    const token = objects.find(obj =>
      pick(obj, aliases.name) !== undefined ||
      pick(obj, aliases.symbol) !== undefined ||
      pick(obj, aliases.address) !== undefined
    ) || item;
    const market = objects.find(obj =>
      pick(obj, aliases.volume24h) !== undefined ||
      pick(obj, aliases.marketCap) !== undefined ||
      pick(obj, aliases.liquidity) !== undefined
    ) || {};
    return {
      raw: item,
      name: deepPick([token, ...objects], aliases.name) || "Unknown token",
      symbol: deepPick([token, ...objects], aliases.symbol) || "—",
      address: deepPick([token, ...objects], aliases.address) || "",
      image: deepPick([token, ...objects], aliases.image) || "",
      chain: deepPick([token, ...objects], aliases.chain) || "",
      volume24h: numeric(deepPick([market, ...objects], aliases.volume24h)),
      marketCap: numeric(deepPick([market, ...objects], aliases.marketCap)),
      liquidity: numeric(deepPick([market, ...objects], aliases.liquidity)),
      change24h: numeric(deepPick([market, ...objects], aliases.change24h))
    };
  }
  function extractList(payload) {
    if (Array.isArray(payload)) return payload;
    const preferred = ["tokens","data","results","items","pools","trending","trendingTokens"];
    for (const key of preferred) {
      const value = payload?.[key];
      if (Array.isArray(value)) return value;
      if (value && typeof value === "object") {
        const nested = extractList(value);
        if (nested.length) return nested;
      }
    }
    // Clanker describes this endpoint as a list of trending pools; tolerate
    // wrapper objects that add another level such as { result: { pools: [] } }.
    for (const value of Object.values(payload || {})) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const nested = extractList(value);
        if (nested.length) return nested;
      }
    }
    return [];
  }
  function money(value) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",notation:"compact",maximumFractionDigits:2}).format(value);
  }
  function change(value) {
    if (!Number.isFinite(value)) return '<span class="clanker-change">—</span>';
    const cls = value > 0 ? "positive" : value < 0 ? "negative" : "";
    return '<span class="clanker-change '+cls+'">'+(value > 0 ? "+" : "")+value.toFixed(2)+'%</span>';
  }
  function tokenLink(token) {
    return token.address ? "https://www.clanker.world/clanker/"+encodeURIComponent(token.address) : "https://www.clanker.world/clankers";
  }
  function tokenVisual(token) {
    const initials = escapeHtml((token.symbol || token.name || "?").slice(0,2).toUpperCase());
    if (token.image) return '<img src="'+escapeHtml(token.image)+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="clanker-token-fallback" hidden>'+initials+'</span>';
    return '<span class="clanker-token-fallback">'+initials+'</span>';
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }
  function sortedTokens() {
    return [...tokens].sort((a,b) => (Number.isFinite(b[sortBy]) ? b[sortBy] : -Infinity) - (Number.isFinite(a[sortBy]) ? a[sortBy] : -Infinity)).slice(0,10);
  }
  function render() {
    const top = sortedTokens();
    if (!top.length) {
      rows.innerHTML = '<tr><td colspan="7" class="clanker-message">No token data is available from Clanker right now.</td></tr>';
      mobile.innerHTML = '<div class="clanker-message">No token data is available from Clanker right now.</div>';
      return;
    }
    rows.innerHTML = top.map((t,i) => '<tr><td><span class="clanker-rank rank-'+(i+1)+'">'+String(i+1).padStart(2,"0")+'</span></td><td><div class="clanker-token">'+tokenVisual(t)+'<span class="clanker-token-name"><b>'+escapeHtml(t.name)+'</b><small>$'+escapeHtml(t.symbol)+(t.chain ? " · "+escapeHtml(String(t.chain)) : "")+'</small></span></div></td><td>'+change(t.change24h)+'</td><td>'+money(t.volume24h)+'</td><td>'+money(t.liquidity)+'</td><td>'+money(t.marketCap)+'</td><td><a class="clanker-token-link" href="'+tokenLink(t)+'" target="_blank" rel="noopener noreferrer" aria-label="Open '+escapeHtml(t.name)+' on Clanker">↗</a></td></tr>').join("");
    mobile.innerHTML = top.map((t,i) => '<article class="clanker-mobile-card"><span class="clanker-rank rank-'+(i+1)+'">'+String(i+1).padStart(2,"0")+'</span><div class="clanker-token">'+tokenVisual(t)+'<span class="clanker-token-name"><b>'+escapeHtml(t.name)+'</b><small>$'+escapeHtml(t.symbol)+'</small></span></div><div class="clanker-mobile-metrics"><span>'+money(t[sortBy])+'</span><small>'+({volume24h:"24H VOLUME",marketCap:"MARKET CAP",liquidity:"LIQUIDITY"}[sortBy])+'</small><a href="'+tokenLink(t)+'" target="_blank" rel="noopener noreferrer">VIEW ↗</a></div></article>').join("");
  }
  async function load() {
    if (busy) return;
    busy = true;
    refreshButton.disabled = true;
    status.textContent = "FETCHING LIVE DATA";
    dot.className = "";
    try {
      if (!supabaseClient) throw new Error("Supabase client/config is unavailable.");
      const { data: payload, error } = await supabaseClient.functions.invoke("clanker-trending", {
        method: "GET"
      });
      if (error) throw new Error(error.message || "Supabase proxy request failed.");
      if (payload?.error) throw new Error(payload.error);
      const list = extractList(payload);
      if (!list.length) throw new Error("The Clanker API returned an empty or unexpected response.");
      tokens = list.map(tokenObject);
      render();
      status.textContent = "LIVE DATA CONNECTED";
      dot.className = "is-live";
      updated.textContent = "Updated "+new Date().toLocaleTimeString();
    } catch (error) {
      status.textContent = "API ERROR: " + (error.message || "unknown error").slice(0,72);
      dot.className = "is-error";
      if (!tokens.length) {
        rows.innerHTML = '<tr><td colspan="7" class="clanker-message">'+escapeHtml(error.message)+' Please try again shortly.</td></tr>';
        mobile.innerHTML = '<div class="clanker-message">'+escapeHtml(error.message)+' Please try again shortly.</div>';
      }
      console.error("[ABYXO Clanker Top]",error);
    } finally {
      busy = false;
      refreshButton.disabled = false;
    }
  }
  sortButtons.forEach(button => button.addEventListener("click",() => {
    sortBy = button.dataset.sort;
    sortButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle("active",active);
      item.setAttribute("aria-pressed",String(active));
    });
    render();
  }));
  refreshButton.addEventListener("click",load);
  load();
  window.setInterval(load,60000);
})();
