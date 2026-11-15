/* ABYXO temporary CLANKER market-data test.
   External token statistics are clearly separated from ABYXO's pre-launch status. */
(() => {
  const panel=document.getElementById("live-statistics");
  if(!panel)return;
  const address="0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb";
  const lowerAddress=address.toLowerCase();
  const tokenUrl="https://www.clanker.world/clanker/"+address;
  const dexUrl="https://api.dexscreener.com/latest/dex/tokens/"+address;
  const clankerUrl="https://www.clanker.world/api/tokens/"+lowerAddress+"/market";
  const badge=panel.querySelector(".token-live-badge");
  const title=panel.querySelector("#token-live-title");
  const intro=panel.querySelector(".token-live-heading p");
  const statusTitle=panel.querySelector(".token-live-status strong");
  const statusText=panel.querySelector(".token-live-status small");
  const cards=[...panel.querySelectorAll(".token-live-grid article")];
  const footnote=panel.querySelector(".token-live-footnote");
  const chart=panel.querySelector(".token-live-chart-empty");
  if(badge)badge.innerHTML='<i aria-hidden="true"></i> TEST MODE';
  if(title)title.innerHTML='CLANKER <span>LIVE TEST DATA</span>';
  if(intro)intro.textContent='Temporary live market-data test for tokenbot ($CLANKER). These figures are not ABYXO token statistics.';
  if(statusTitle)statusTitle.textContent='CONNECTING TO MARKET DATA';
  if(statusText)statusText.textContent='Requesting public Base market data…';
  if(footnote)footnote.textContent='TEST MODE ONLY · External market data · Auto-refresh every 60 seconds · ABYXO remains pre-launch.';
  if(chart)chart.innerHTML='Live price chart is hosted on DexScreener<span>OPEN CLANKER TOKEN PAGE</span>';
  const set=(i,value,note)=>{
    const card=cards[i];if(!card)return;
    const strong=card.querySelector("strong"),small=card.querySelector("small");
    if(strong)strong.textContent=value;
    if(small&&note)small.textContent=note;
  };
  const num=v=>{
    if(v===null||v===undefined||v==="")return null;
    const n=Number(v);return Number.isFinite(n)?n:null;
  };
  const usd=v=>{
    const n=num(v);if(n===null)return "Not provided";
    return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:n<0.01?8:n<1?6:2}).format(n);
  };
  const count=v=>{
    const n=num(v);return n===null?"Not provided":new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(n);
  };
  async function getJson(url){
    const response=await fetch(url,{headers:{accept:"application/json"},cache:"no-store"});
    if(!response.ok)throw new Error("HTTP "+response.status+" from "+new URL(url).hostname);
    return response.json();
  }
  function selectPair(pairs){
    const valid=(pairs||[]).filter(p=>p&&p.chainId==="base"&&p.baseToken&&p.baseToken.address.toLowerCase()===lowerAddress);
    valid.sort((a,b)=>(Number(b.liquidity?.usd)||0)-(Number(a.liquidity?.usd)||0));
    return valid[0]||null;
  }
  async function refresh(){
    try{
      const data=await getJson(dexUrl);
      const pair=selectPair(data.pairs);
      if(!pair)throw new Error("No Base trading pair was returned for this address.");
      const tx=pair.txns?.h24;
      const trades=tx?(Number(tx.buys)||0)+(Number(tx.sells)||0):null;
      set(0,usd(pair.priceUsd),"CLANKER spot price · USD");
      set(1,usd(pair.marketCap??pair.fdv),"CLANKER market cap / FDV");
      set(2,usd(pair.liquidity?.usd),"Pool liquidity · USD");
      set(3,usd(pair.volume?.h24),"Trading volume · last 24h");
      set(4,"Not provided","Holder count unavailable from this source");
      set(5,count(trades),"Buys + sells · last 24h");
      if(statusTitle)statusTitle.textContent="CLANKER DATA CONNECTED";
      if(statusText)statusText.textContent="Live Base pair found on "+(pair.dexId||"DEX")+". Some statistics may be unavailable from the public data source.";
      if(chart){
        chart.innerHTML='View the live CLANKER chart on DexScreener<span>OPEN LIVE MARKET CHART</span>';
        chart.style.cursor="pointer";chart.setAttribute("role","link");chart.setAttribute("tabindex","0");
        chart.onclick=()=>window.open(pair.url||tokenUrl,"_blank","noopener");
        chart.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();window.open(pair.url||tokenUrl,"_blank","noopener");}};
      }
      if(footnote)footnote.textContent="TEST MODE ONLY · Source: DexScreener public API · Pair: "+(pair.dexId||"Base DEX")+" · Auto-refresh every 60 seconds. Holder count is not supplied by this feed.";
    }catch(dexError){
      try{
        const data=await getJson(clankerUrl);
        const root=data.data||data.market||data;
        const pick=(...keys)=>{
          for(const k of keys){const v=root[k]??root.marketData?.[k]??root.poolMarketData?.[k];if(v!==undefined&&v!==null)return v;}
          return null;
        };
        set(0,usd(pick("priceUsd","price_usd","tokenPriceUsd","token_price_usd","price")),"CLANKER token price");
        set(1,usd(pick("marketCapUsd","market_cap_usd","marketCap","market_cap","fdv")),"CLANKER market cap");
        set(2,usd(pick("liquidityUsd","liquidity_usd","liquidity")),"CLANKER pool liquidity");
        set(3,usd(pick("volume24hUsd","volume_24h_usd","volume24h","volume_24h")),"CLANKER 24-hour volume");
        set(4,count(pick("holderCount","holder_count","holders")),"CLANKER holders");
        set(5,count(pick("transactions24h","transactions_24h","txns24h","trades24h")),"CLANKER 24-hour trades");
        if(statusTitle)statusTitle.textContent="CLANKER API RESPONDED";
        if(statusText)statusText.textContent="Fallback Clanker market endpoint responded. Fields not supplied are marked Not provided.";
      }catch(apiError){
        cards.forEach((_,i)=>set(i,"—",i===4?"Holder count may require another data source":"Waiting for market-data connection"));
        if(statusTitle)statusTitle.textContent="MARKET DATA CONNECTION FAILED";
        if(statusText)statusText.textContent="Browser could not reach the public data sources. DexScreener: "+dexError.message+" Clanker: "+apiError.message;
        if(chart){
          chart.innerHTML='Open CLANKER market page<span>VIEW ON CLANKER</span>';
          chart.style.cursor="pointer";chart.onclick=()=>window.open(tokenUrl,"_blank","noopener");
        }
      }
    }
  }
  refresh();
  window.setInterval(refresh,60000);
})();