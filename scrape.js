/* ===========================================================================
 * 40K Painted Army scraper — paste into the browser console on an eBay
 * "Fully Assembled & Painted Complete Army" CATEGORY page, e.g.:
 *   https://www.ebay.com/b/Fully-Assembled-Painted-Complete-Army-Warhammer-40K-Miniature-Toys/183473/bn_96974265
 *   (append ?_pgn=2, ?_pgn=3 … to page through)
 *   Necrons-only feed: .../bn_119783045
 *
 * WHY category pages, not search? eBay's /sch/ search endpoint bot-challenges
 * automated hits ("Pardon Our Interruption"). The /b/ category feeds don't,
 * but they OBFUSCATE the visible <title> text with zero-width chars — so we
 * read the clean title from each card's <a aria-label> / <img alt> instead.
 *
 * Run SCAN() on each page (accumulates into localStorage across pagination),
 * then EXPORT() to print the pipe-delimited data for data/raw_listings.psv.
 * =========================================================================== */
(function (global) {
  const KEY = "__scan";

  function classify(t) {
    t = (t || "").toLowerCase();
    const M = [
      ["Grey Knights", /grey knight/], ["Necrons", /necron/],
      ["Tyranids", /tyranid|genestealer/], ["Orks", /\bork/],
      ["T'au", /t.?au|farsight/], ["Drukhari", /drukhari|dark eldar/],
      ["Aeldari", /aeldari|craftworld|\beldar|ynnari|harlequin/],
      ["Death Guard", /death guard|plague/], ["Thousand Sons", /thousand sons|rubric/],
      ["World Eaters", /world eaters|berzerk/], ["Emperor's Children", /emperor.?s children/],
      ["Chaos Daemons", /daemon|khorne|nurgle|tzeentch|slaanesh/],
      ["Chaos Knights", /chaos knight/],
      ["Chaos Space Marines", /chaos space marine|csm|heretic astartes|black legion|word bearer|night lord|iron warrior|alpha legion/],
      ["Imperial Knights", /imperial knight|knight household|\bknight/],
      ["Adeptus Custodes", /custodes/], ["Adeptus Mechanicus", /mechanicus|admech|skitarii/],
      ["Adepta Sororitas", /sororitas|sisters of battle/],
      ["Astra Militarum", /astra militarum|imperial guard|cadian|krieg|steel legion|catachan/],
      ["Leagues of Votann", /votann|hearthkyn/], ["Deathwatch", /deathwatch/],
      ["Space Wolves", /space wolves|space wolf/], ["Blood Angels", /blood angel/],
      ["Dark Angels", /dark angel|deathwing|ravenwing/], ["Black Templars", /black templar/],
      ["Space Marines", /space marine|ultramarine|imperial fist|iron hands|salamander|raven guard|primaris|astartes/],
    ];
    for (const [n, r] of M) if (r.test(t)) return n;
    return "Other/Mixed";
  }

  function SCAN() {
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) {}
    const known = new Set(arr.map(x => x.id));
    const seen = new Set();
    document.querySelectorAll('a[href*="/itm/"]').forEach(a => {
      const id = (a.href.split("/itm/")[1] || "").split("?")[0].split("/")[0];
      if (!id || seen.has(id)) return;
      const li = a.closest("li"); if (!li) return;
      let title = "";
      li.querySelectorAll('a[href*="/itm/"]').forEach(x => {
        const t = (x.getAttribute("aria-label") || "").replace(/\s*-\s*Image \d+ of \d+/i, "").trim();
        if (t.length > title.length) title = t;
      });
      if (!title) { const img = li.querySelector("img"); if (img) title = (img.alt || "").replace(/\s*-\s*Image \d+ of \d+/i, "").trim(); }
      if (!title || /^Shop on eBay/i.test(title)) return;
      const txt = li.innerText.replace(/\s+/g, " ");
      const pm = txt.match(/(?:US ?\$|\$|GBP ?|£|€)\s?[0-9][0-9.,]*(?:\s*to\s*(?:US ?\$|\$|GBP ?|£|€)?\s?[0-9][0-9.,]*)?/);
      if (!pm) return;
      seen.add(id);
      if (known.has(id)) return;
      known.add(id);
      arr.push({ id, t: title.slice(0, 90), price: pm[0].replace(/\s+/g, " ").trim() + (/best offer/i.test(txt) ? " OBO" : ""), faction: classify(title) });
    });
    localStorage.setItem(KEY, JSON.stringify(arr));
    console.log(`scanned. total unique so far: ${arr.length}`);
    return arr.length;
  }

  function EXPORT() {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    const psv = "faction|itemId|price|title\n" +
      arr.map(x => `${x.faction}|${x.id}|${x.price}|${x.t}`).join("\n");
    console.log(psv);           // copy this into data/raw_listings.psv
    return psv;
  }

  function RESET() { localStorage.removeItem(KEY); console.log("cleared."); }

  global.SCAN = SCAN; global.EXPORT = EXPORT; global.RESET = RESET;
  console.log("Loaded. Run SCAN() on each category page (paginate with ?_pgn=N), then EXPORT().");
})(window);
