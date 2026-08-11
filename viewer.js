/* Scorecard viewer logic — expects window.SCORECARD_DATA from listings.js / chaos.js. */
const D = (window.SCORECARD_DATA||{meta:{},listings:[]});
const L = D.listings, M = D.meta;
// listing fields come from scraped eBay pages — escape everything interpolated into HTML,
// and only ever link to https://www.ebay.com/
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = u => /^https:\/\/www\.ebay\.com\//.test(String(u)) ? esc(u) : '#';
// edition title comes from the data: "40K Painted Army Value Scorecard — All Factions"
const [mainTitle, edition] = (M.title||'Scorecard').split(' — ');
document.title = M.title||'Scorecard';
document.getElementById('title').innerHTML = `${esc(mainTitle)} <span style="color:var(--mut);font-weight:400">· ${esc(edition||'')}</span>`;
const money = v => v==null?'—':'$'+Number(v).toLocaleString(undefined,{maximumFractionDigits:0});
const ratioColor = r => r>=1.5?'var(--green)':r>=0.8?'var(--amber)':'var(--red)';

document.getElementById('sub').textContent =
  `Feed scanned ${M.scanned} (${M.count} listings live that day) · photo sweep ${M.photoSweep} · rebuilt ${M.generated} · ${M.factions?M.factions.length:''} factions · source: eBay category feeds. ${M.scoredCount} have points/contents known and are scored; the rest are price-listed (UNSCORED). Paint tiers marked (assumed) were not photo-checked.`;

const kpis=[['Listings',M.count],['Factions',M.factions?M.factions.length:''],['Scored',M.scoredCount],['BUY-grade',M.buyCount]];
document.getElementById('kpis').innerHTML = kpis.map(k=>`<div class="kpi"><b>${esc(k[1])}</b><span>${k[0]}</span></div>`).join('');

// top picks: BUY-grade, verified first, then ratio
const picks=[...L].filter(x=>x.verdict==='BUY').sort((a,b)=>(b.verifiedLive-a.verifiedLive)||(b.valueRatio-a.valueRatio)).slice(0,6);
document.getElementById('picks').innerHTML = picks.map(x=>`
  <div class="pick">
    <div class="f">${esc(x.faction)}${x.verifiedLive?'<span class="live">LIVE ✓</span>':''}</div>
    <div class="n">${esc(x.name)}</div>
    <div class="r">${esc(x.valueRatio)}×</div>
    <div class="meta">${esc(x.priceDisplay)} · ${x.points?esc(x.points)+'pt · ':''}${money(x.landedUSD)} landed${x.location?' · '+esc(x.location):''}</div>
    ${x.notes?`<div class="meta flag">⚠ ${esc(x.notes)}</div>`:''}
    <a href="${link(x.url)}" target="_blank" rel="noopener">View listing →</a>
  </div>`).join('');

// faction dropdown
[...new Set(L.map(x=>x.faction))].sort().forEach(f=>{
  const o=document.createElement('option');o.value=f;o.textContent=f;document.getElementById('fFaction').appendChild(o);
});

let sortMode='ratio';
function render(){
  const ff=document.getElementById('fFaction').value, fv=document.getElementById('fVerdict').value;
  let rows=L.filter(x=>{
    if(ff&&x.faction!==ff)return false;
    if(fv==='BUY'&&x.verdict!=='BUY')return false;
    if(fv==='scored'&&x.valueRatio==null)return false;
    if(fv==='ready-to-ship'&&x.type!=='ready-to-ship')return false;
    if(fv==='verified'&&!x.verifiedLive)return false;
    return true;
  });
  const rk=x=>x.valueRatio==null?-1:x.valueRatio;
  const pr=x=>x.priceUSD==null?1e9:x.priceUSD;
  rows.sort((a,b)=>{
    if(sortMode==='ratio')return rk(b)-rk(a)||pr(a)-pr(b);
    if(sortMode==='priceAsc')return pr(a)-pr(b);
    if(sortMode==='priceDesc')return pr(b)-pr(a);
    if(sortMode==='points')return (b.points||0)-(a.points||0);
    if(sortMode==='name')return a.name.localeCompare(b.name);
  });
  document.getElementById('count').textContent=`${rows.length} of ${L.length} shown`;
  document.getElementById('rows').innerHTML=rows.map(x=>{
    const rpct=x.valueRatio!=null?Math.min(100,x.valueRatio/2*100):0;
    const bar=x.valueRatio!=null?`<div class="bar"><i style="width:${rpct}%;background:${ratioColor(x.valueRatio)}"></i><span class="tick"></span></div>`:'';
    return `<tr>
      <td class="name"><a href="${link(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>${x.verifiedLive?'<span class="live">LIVE ✓</span>':''}
        <div class="fac">${esc(x.faction)}${x.location?' · '+esc(x.location):''}${x.notes?' · <span class="flag">'+esc(x.notes)+'</span>':''}</div></td>
      <td class="num">${esc(x.priceDisplay)}</td>
      <td class="num">${x.points?esc(x.points)+'pt':'—'}</td>
      <td class="num">${money(x.landedUSD)}</td>
      <td class="num">${money(x.kitMsrpUSD)}</td>
      <td>${esc(x.paintTier)}${x.paintTierAssumed?'<span class="fac"> (assumed)</span>':''}</td>
      <td class="ratio" style="color:${x.valueRatio!=null?ratioColor(x.valueRatio):'var(--mut)'}">${x.valueRatio!=null?esc(x.valueRatio)+'×':'—'}${bar}</td>
      <td><span class="chip ${esc(x.verdict)}">${esc(x.verdict)}</span></td>
    </tr>`;
  }).join('');
}
document.getElementById('fFaction').onchange=render;
document.getElementById('fVerdict').onchange=render;
document.getElementById('sort').onchange=e=>{sortMode=e.target.value;render();};
document.querySelectorAll('th[data-s]').forEach(th=>th.onclick=()=>{sortMode=th.dataset.s;render();});

document.getElementById('foot').innerHTML =
  `<b>Methodology.</b> ${esc(M.model)}<br><br><b>Disclaimer.</b> ${esc(M.disclaimer)}<br><br>`+
  `Source: ${esc(M.source)} Refresh with <code>python3 build.py</code> after re-running <code>scrape.js</code> in the browser console. `+
  `Not affiliated with Games Workshop. This tool only organizes public listings — it does not buy or bid on anyone's behalf.`;

render();
