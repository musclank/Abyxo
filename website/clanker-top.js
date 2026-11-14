(() => {
  const API = "https://www.clanker.world/api/tokens/trending";
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
    if (typeof value === "string") return Number(value.replace(/[$,%\s,]/g, ""));
    if (value && typeof value === "object") return numeric(value.usd ?? value.value ?? value.amount);
    return NaN;
  }
  function tokenObject(item) {
    const token = item.token && typeof item.token === "object" ? item.token : item;
    const market = item.market && typeof item.market === "object" ? item.market : {};
    return {
      raw: item,
      name: pick(token, aliases.name) || pick(item, aliases.name) || "Unknown token",
      symbol: pick(token, aliases.symbol) || pick(item, aliases.symbol) || "—",
      address: pick(token, aliases.address) || pick(item, aliases.address) || "",
      image: pick(token, aliases.image) || pick(item, aliases.image) || "",
      chain: pick(token, aliases.chain) || pick(item, aliases.chain) || "",
      volume24h: numeric(pick(market, aliases.volume24h) ?? pick(token, aliases.volume24h) ?? pick(item, aliases.volume24h)),
      marketCap: numeric(pick(market, aliases.marketCap) ?? pick(token, aliases.marketCap) ?? pick(item, aliases.marketCap)),
      liquidity: numeric(pick(market, aliases.liquidity) ?? pick(token, aliases.liquidity) ?? pick(item, aliases.liquidity)),
      change24h: numeric(pick(market, aliases.change24h) ?? pick(token, aliases.change24h) ?? pick(item, aliases.change24h))
    };
  }
  function extractList(payload) {
    if (Array.isArray(payload)) return payload;
    for (const key of ["tokens","data","results","items","pools"]) {
      if (Array.isArray(payload?.[key])) return payload[key];
      if (payload?.[key] && typeof payload[key] === "object") {
        for (const nested of ["tokens","items","results"]) if (Array.isArray(payload[key][nested])) return payload[key][nested];
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
    if (token.image) return '<img src="'+String(token.image).replace(/"/g,"%22")+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'clanker-token-fallback\',textContent:'+JSON.stringify((token.symbol || token.name || "?").slice(0,2).toUpperCase())+'}))">';
    return '<span class="clanker-token-fallback">'+escapeHtml((token.symbol || token.name || "?").slice(0,2).toUpperCase())+'</span>';
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
      const response = await fetch(API,{headers:{Accept:"application/json"},cache:"no-store"});
      if (!response.ok) throw new Error("Clanker API returned HTTP "+response.status);
      const payload = await response.json();
      const list = extractList(payload);
      if (!list.length) throw new Error("The Clanker API returned an empty or unexpected response.");
      tokens = list.map(tokenObject);
      render();
      status.textContent = "LIVE DATA CONNECTED";
      dot.className = "is-live";
      updated.textContent = "Updated "+new Date().toLocaleTimeString();
    } catch (error) {
      status.textContent = "DATA CONNECTION ISSUE";
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
