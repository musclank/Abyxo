/* ABYXO temporary Clanker market-data test.
   This panel is explicitly a test and never represents ABYXO token data. */
(() => {
  const panel = document.getElementById("live-statistics");
  if (!panel) return;

  const address = "0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb";
  const marketUrl = "https://www.clanker.world/api/tokens/" + address + "/market";
  const tokenUrl = "https://www.clanker.world/clanker/" + address;
  const badge = panel.querySelector(".token-live-badge");
  const title = panel.querySelector("#token-live-title");
  const intro = panel.querySelector(".token-live-heading p");
  const statusTitle = panel.querySelector(".token-live-status strong");
  const statusText = panel.querySelector(".token-live-status small");
  const cards = [...panel.querySelectorAll(".token-live-grid article")];
  const footnote = panel.querySelector(".token-live-footnote");
  const chart = panel.querySelector(".token-live-chart-empty");

  if (badge) badge.innerHTML = '<i aria-hidden="true"></i> TEST MODE';
  if (title) title.innerHTML = 'CLANKER <span>LIVE TEST DATA</span>';
  if (intro) intro.textContent = 'Temporary live-data test using tokenbot ($CLANKER). These figures belong to CLANKER, not ABYXO.';
  if (statusTitle) statusTitle.textContent = 'EXTERNAL TOKEN / BASE';
  if (statusText) statusText.textContent = 'Loading verified market data from the public Clanker endpoint…';
  if (footnote) footnote.textContent = 'TEST MODE ONLY · Source: Clanker public market API. Data refreshes every 60 seconds. ABYXO remains pre-launch.';
  if (chart) chart.innerHTML = 'Chart preview is not connected in this test<span>OPEN CLANKER FOR THE LIVE CHART</span>';

  const aliases = {
    price: ["priceusd","price_usd","tokenpriceusd","token_price_usd","price"],
    mcap: ["marketcapusd","market_cap_usd","marketcap","market_cap","fdv","fdvusd"],
    liquidity: ["liquidityusd","liquidity_usd","liquidity"],
    volume: ["volume24husd","volume_24h_usd","volume24h","volume_24h","h24volume","volumeusd24h"],
    holders: ["holdercount","holder_count","holders","holderscount","holders_count"],
    txns: ["transactions24h","transactions_24h","txns24h","txns_24h","trades24h","trades_24h"]
  };

  function findValue(obj, names, depth=0) {
    if (!obj || typeof obj !== "object" || depth > 5) return undefined;
    const entries = Array.isArray(obj) ? obj.map((v,i)=>[String(i),v]) : Object.entries(obj);
    for (const [key,value] of entries) {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g,"");
      if (names.some(n=>n.replace(/[^a-z0-9]/g,"")===normalized) && value !== null && value !== undefined && typeof value !== "object") return value;
    }
    for (const [,value] of entries) {
      const found = findValue(value,names,depth+1);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  function numeric(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
    if (typeof value !== "string") return undefined;
    const cleaned=value.replace(/[$,%\s,]/g,"");
    const parsed=Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  function money(value) {
    const n=numeric(value);
    if (n===undefined) return "Not reported";
    return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:n<1?6:2}).format(n);
  }
  function count(value) {
    const n=numeric(value);
    return n===undefined ? "Not reported" : new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(n);
  }
  function setCard(index,value,note) {
    if (!cards[index]) return;
    const strong=cards[index].querySelector("strong");
    const small=cards[index].querySelector("small");
    if (strong) strong.textContent=value;
    if (small && note) small.textContent=note;
  }

  async function refresh() {
    try {
      const response=await fetch(marketUrl,{headers:{accept:"application/json"},cache:"no-store"});
      if (!response.ok) throw new Error("Clanker API returned HTTP "+response.status);
      const data=await response.json();
      const values=[
        findValue(data,aliases.price),
        findValue(data,aliases.mcap),
        findValue(data,aliases.liquidity),
        findValue(data,aliases.volume),
        findValue(data,aliases.holders),
        findValue(data,aliases.txns)
      ];
      setCard(0,money(values[0]),"CLANKER token price");
      setCard(1,money(values[1]),"CLANKER market cap");
      setCard(2,money(values[2]),"CLANKER pool liquidity");
      setCard(3,money(values[3]),"CLANKER 24-hour volume");
      setCard(4,count(values[4]),"CLANKER holders");
      setCard(5,count(values[5]),"CLANKER 24-hour trades");
      if (statusTitle) statusTitle.textContent="CLANKER DATA CONNECTED";
      if (statusText) statusText.textContent="Market endpoint responded successfully. Values not supplied by the API remain marked “Not reported”.";
      if (chart) chart.innerHTML='Live chart is available on Clanker<span>OPEN CLANKER FOR THE LIVE CHART</span>';
      if (chart) {
        chart.style.cursor="pointer";
        chart.setAttribute("role","link");
        chart.setAttribute("tabindex","0");
        chart.onclick=()=>window.open(tokenUrl,"_blank","noopener");
        chart.onkeydown=(event)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();window.open(tokenUrl,"_blank","noopener");}};
      }
    } catch(error) {
      if (statusTitle) statusTitle.textContent="LIVE DATA UNAVAILABLE";
      if (statusText) statusText.textContent="Could not load the public Clanker market endpoint from this browser. No sample values are shown.";
      cards.forEach((card)=>{const strong=card.querySelector("strong");if(strong)strong.textContent="—";});
      if (chart) chart.innerHTML='Open the official Clanker token page to view its live chart<span>CLANKER · BASE</span>';
    }
  }

  refresh();
  window.setInterval(refresh,60000);
})();