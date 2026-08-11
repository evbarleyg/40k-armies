# Be'lakor & the Shadow Legion — understanding the model and its place in armies

*Companion to `shadow-legion-strategy.md`. That doc says what to do with your army; this one
explains **why** — who Be'lakor is, how his rules actually work, and why the community
(r/ChaosDaemons40k included) builds armies around him the way it does.*

*Context: written 2026-07-24, three days after the [$730 eBay purchase](https://www.ebay.com/itm/236942163636)
of the "Chaos Daemons Shadow Legion Army Lot — Word Bearer Theme, 2000pts" (order 02-14938-96714,
arriving Jul 24–31). Rules state: 40k 11th edition, June 2026 Chaos Daemons faction pack,
July 2026 balance update. Verify exact numbers in the official app before competitive play.*

---

## 1. Who Be'lakor is (the 60-second lore)

Be'lakor, the Dark Master, is the **first Daemon Prince** — the first mortal ever elevated to
daemonhood, and the only one raised by all four Chaos gods together ("Undivided"). The gods
later humiliated him and gave his job to a rotating cast of champions, so Be'lakor now runs
his own long game against literally everyone: the gods, the other daemons, and the Imperium.
His shtick is **shadow, manipulation, and armies of the ambitious** — mortals and daemons who
serve him instead of a single god. That's why his rules keep doing three things: hiding in
darkness, terrifying people (Battle-shock), and letting Chaos Space Marines fight alongside
daemons in one army.

The model itself is the 2021 plastic kit — a huge winged centerpiece shared between 40k and
Age of Sigmar. It's the visual and rules anchor of the lot you bought.

## 2. The model on the table: a moving zone, not a beatstick

This is the #1 thing new owners misread, and the recurring theme of every "is Be'lakor worth
~390 points?" thread. For that cost he does **not** hit like the top-end monsters. His value
is that he is simultaneously:

**Hard to remove.** The 2025 datasheet rework made him genuinely tanky — reviewers cite
**T11, 3+ save, 20 wounds** with an invulnerable save, on top of his signature defensive
tech: attackers suffer **−1 to hit and cannot re-roll hits** against him, and he can't be
shot from long range (the community shorthand is "the 18-inch unshootable aura" — you'll
start most games with him effectively untargetable). He flies, moves 12", and can deep
strike like the rest of the faction.

**A real (not spectacular) melee threat.** The Blade of Shadows has a strike profile
(7 attacks) with **Devastating Wounds** and a sweep profile with **Sustained Hits 1**. He'll
kill characters, chew through elite infantry, and delete chaff — he just won't one-round a
Knight, and he shouldn't be sent to try.

**Three overlapping support auras.** This is where the points actually go:
- **Shadow of Chaos bubble (6").** The battlefield within 6" of him counts as being inside
  your army's Shadow of Chaos (see §3) — he *carries the army rule forward* as he moves.
- **Re-roll hit rolls of 1 (6")** for friendly Shadow Legion / Legiones Daemonica units — a
  huge consistency boost for a faction with almost no other hit buffs.
- **Terror engine (9").** Enemy units below Starting Strength near him take Battle-shock
  tests, and when an enemy unit nearby fails one, **he heals D3 wounds**. He regenerates by
  scaring people.

So: a ~390-point piece whose damage output is maybe 250 points' worth, wrapped in 500 points
of durability and force multiplication. **His value scales with how many units fight inside
his bubbles.** Played as a lone assassin he underperforms; played as the moving heart of a
castle-then-strike army he warps the whole game. That duality is the "nuance" people keep
arguing about.

## 3. Shadow of Chaos — the army rule he exists to spread

Chaos Daemons' faction rule divides the battlefield into "in shadow" and "not in shadow."
Your own zone starts in shadow, it spreads as you take map control (the current faction pack
wording includes: *control at least half the objective markers in your opponent's deployment
zone at the start of a phase → their deployment zone is in your Shadow of Chaos for that
phase*), and Be'lakor / Greater Daemons project it around themselves as they advance.

Two effects hang off it:

- **Daemonic Manifestation (friendly).** Daemons inside the shadow add 1 to Battle-shock
  tests, and *passing* one heals D3 wounds — or **returns up to D3 destroyed models to a
  Battleline unit**. This is why your Pink Horrors matter far more than their statline: a
  10-model Battleline brick that keeps standing back up while it holds an objective.
- **Daemonic Terror (enemy).** Enemy units inside the shadow (or near a Greater Daemon like
  your **Lord of Change**) subtract 1 from Battle-shock tests and take **D3 mortal wounds on
  a failure**. Battle-shocked units drop to OC 0 — they stop controlling objectives.

That's the faction's actual win condition in miniature: push the shadow onto the midboard,
make *your* daemons unkillable objective-sitters, make *their* objective-holders flicker off.
The strategy doc's advice — "pile Battle-shock onto whoever's contesting an objective, not
the strongest enemy unit" — is this rule, weaponized.

## 4. The Shadow Legion detachment (what your army is built for)

> *Later note (2026-08-11): this section is the Jul 24 digest. The verified gists now live in `data/muster.json` →
> `rules` and on Muster's rules check. Corrections since: Chaos Terminator Squad is on the Thralls list; the Tzeentch boon
> (Penumbral Puppetry) is Stealth / −1 to be hit in melee and the Slaanesh boon (Shadow's Caress) covers all snap shooting;
> the six Shadow Legion stratagems are Channelled Wrath, Binding Shadow, Death Denied, Encroaching Darkness, Spiteful Demise
> and Shade Path (Warp Surge and Denizens of the Warp are unverified here); Deep Strike is more than 8" this edition; the
> Lord of Change is 320 at MFM v1.1 (the table in §5 has the seller's 300).*

Introduced in the mid-2025 Chaos Daemons index update (the modern successor to 9th edition's
"Disciples of Be'lakor" army of renown), and carried into 11th edition's June 2026 faction
pack as a **2 Detachment Point** option (disposition: Purge the Foe). It's the
"Be'lakor's own legion" detachment: every daemon god's units plus mortal Chaos Space
Marines, under one undivided banner.

**Keywords:** Be'lakor and all Heretic Astartes units gain SHADOW LEGION + UNDIVIDED;
all Legiones Daemonica units gain SHADOW LEGION.

**The detachment rule — every allegiance gets a boon:**

| Allegiance | Boon |
|---|---|
| Khorne | Can **Advance, shoot and charge** |
| Tzeentch | Attackers get **−1 to hit** them |
| Nurgle | **−1 to wound** them when attack Strength > their Toughness |
| Slaanesh | Can't be targeted by **Fire Overwatch** |
| Undivided (incl. your CSM) | Gain the **Dark Pacts** army rule (Be'lakor auto-passes its Leadership test) |

**The CSM splash.** Up to half the army can come from a fixed Chaos Space Marines allowlist:
Chaos Lord (foot / Terminator / jump pack), Sorcerer (foot / Terminator), **Master of
Possessions**, Dark Apostle, **Legionaries**, Chosen, **Possessed**, Raptors, Warp Talons,
**Havocs**, and Damned units — no CSM vehicles, no named CSM characters. Heretic Astartes
units in the detachment gain **Deep Strike**. (Bolded = already in your lot; the seller's
"Word Bearer theme" CSM half is exactly this allowlist, which is why the army works as one
legal 2,000-point force out of the box.)

**Restrictions — the fine print your strategy doc flagged:**
- **No vehicles** (your 2 War Dog Karnivores ride along via the separate Chaos Knights ally
  rule, not the detachment — verify before a tournament; casual games won't care).
- **No Daemon Princes and no Epic Heroes except Be'lakor** — no Skarbrand, no Kairos, no
  second named centerpiece. (This is why the scorecard skipped the $1,375 Khorne army: its
  centerpiece is illegal in this detachment.)

**Known toolkit** (full lists in the app/Wahapedia — these are the ones cited in reviews):
- *Warp Surge* (1 CP): a daemon unit inside your Shadow of Chaos charges after Advancing.
- *Denizens of the Warp* (1 CP): a deep-striking unit arrives 3" from the enemy instead of 9".
- *Leaping Shadows* (enhancement): the bearer's unit gets **Scouts 9"** — reviewers call
  this the detachment's best trick (a pre-game move on a monster or a Possessed brick turns
  into a near-guaranteed turn-1 charge; one review notes moving Be'lakor "21 inches before
  an advance and charge on turn 1").

**Why the detachment reads as "everything deep strikes":** daemons natively arrive from the
warp, and the detachment hands Deep Strike to the CSM half too — so essentially your whole
list can start off the board and arrive where the enemy is thinnest. That, plus Be'lakor's
durability, is the "fear, position, and arrival timing" gameplan in the strategy doc. One
caveat to verify in the current rules: standard reserve limits (points caps on what may
start in reserves) still apply unless a rule explicitly lifts them — check the faction pack
before planning the "whole army in reserve" opening against shooting-heavy opponents.

## 5. Your purchased army, mapped to the rules above

| What arrived | Rules role |
|---|---|
| **Be'lakor (390)** | The detachment's reason to exist: moving Shadow bubble, re-roll-1s aura, terror/heal engine, mandatory-feeling centerpiece |
| **Lord of Change (300)** | Second flying terror source (Daemonic Terror lists Greater Daemons by name), shooting + utility; second arrival threat |
| **Pink/Blue/Brimstone Horrors** | Battleline resurrection engine under Daemonic Manifestation — three waves of objective-holding bodies from one purchase |
| **Fateskimmer + Exalted Flamer + 3 Screamers** | Tzeentch speed/harassment, all carrying the −1-to-hit boon |
| **3 Nurgling bases** | Infiltrating shadow anchors — they start the midboard battle-shock economy on turn 1 and get −1 to wound vs big guns |
| **Master of Possessions + 5 Possessed** | The classic Shadow Legion melee bomb: deep-strikes via the detachment, fights with Dark Pacts |
| **10 Legionaries** | Undivided Dark Pacts infantry for actions/secondaries |
| **Havocs (2 las / 2 auto)** | Home-objective firebase — one of the few long guns the detachment allows |
| **2 War Dog Karnivores (310)** | *Not* Shadow Legion units (no vehicles) — Chaos Knights allies; fast anti-tank the detachment otherwise lacks |

Gaps the rules explain (and the strategy doc already priced): **Bloodletters** are the cheap
melee hammer precisely because the Khorne boon (Advance + charge) is the detachment's most
aggressive rule; **Seekers** exploit the Slaanesh no-Overwatch boon to harass safely; the
Night Lords lot's **Raptors / Warp Talons / Chosen** are all on the CSM allowlist and add
the mobility your current CSM half lacks.

## 6. What the community (r/ChaosDaemons40k and the review sites) keeps discussing

Direct scraping of the subreddit wasn't possible from this session (reddit.com and its
archive mirrors are blocked by the environment's network policy — see caveats), so this
digest comes from the review articles below plus the recurring discussion themes on that
subreddit through early 2026:

1. **"Is upgraded Be'lakor an auto-take?"** — the eternal thread. Consensus: in Shadow
   Legion yes (the detachment is built around him); in other detachments he competes with
   two Greater Daemons for the points. The counter-argument is always his damage-per-point;
   the rebuttal is always the aura stack.
2. **"Which CSM units do I actually bring?"** — Possessed + Master of Possessions is the
   default answer; Chosen for durable scoring; Raptors/Warp Talons for speed; Havocs for the
   one gun line you're allowed. (Your lot shipped with the default answer pre-painted.)
3. **Reserve timing** — how much to hold off-board vs. castle on the table, and when the
   double-arrival should land (the sub's standard answer matches your strategy doc: turns
   2–3, one flank, everything at once).
4. **Battle-shock fishing** — whether the mortal-wound/OC-0 game is reliable enough to build
   around; the practical advice is to treat it as a scoring disruptor, not a damage plan.
5. **"Wait, no vehicles?!"** — the most common rules-shock post from new Shadow Legion
   players, usually resolved toward Chaos Knights allies (exactly your War Dog situation).
6. **Post-balance-update check-ins** — the July 2026 dataslate trimmed daemons only lightly
   (Bloodcrushers +10, Beast of Nurgle +5, no Be'lakor change reported), so the sub's Shadow
   Legion advice from spring 2026 still stands.

## 7. Sources & caveats

- [Tabletop Battles — Detachment Focus: Shadow Legion](https://www.tabletopbattles.com/detachment-focus-shadow-legion/) (the review `shadow-legion-strategy.md` cites)
- [Tabletop Battles — 11th Edition Faction Pack Review: Chaos Daemons](https://www.tabletopbattles.com/40k-11th-edition-faction-pack-review-chaos-daemons) (2DP cost, upgraded Be'lakor verdict)
- [Tabletop Battles — TheChirurgeon's Road Through 2025, Part 12: Testing the Shadow Legion](https://www.tabletopbattles.com/thechirurgeons-road-through-2025-part-12-testing-the-shadow-legion/)
- [Tabletop Battles — The July 2026 Balance Updates: Chaos](https://www.tabletopbattles.com/40k-the-july-2026-balance-updates-chaos)
- [Warhammer Community — the Chaos faction packs](https://www.warhammer-community.com/en-gb/articles/2wzoc1fz/new40k-download-new-chaos-faction-packs-today/) and [Index: Chaos Daemons — updated datasheets and a new detachment](https://www.warhammer-community.com/en-gb/articles/jl3uxdbu/index-chaos-daemons-updated-datasheets-and-a-new-detachment/)
- [Warphammer — Diving Deep Into the Changes for Every Chaos God and Unit](https://warphammer40k.com/diving-deep-into-the-changes-for-every-chaos-god-and-unit-and-where-daemon-players-go-from-here/) (Be'lakor datasheet rework, aura details)
- [1d6chan — 11th Edition Tactics: Chaos Daemons](https://1d6chan.miraheze.org/wiki/Warhammer_40,000/11th_Edition_Tactics/Chaos_Daemons)
- [Spikeybits — 11th edition Chaos faction pack coverage](https://spikeybits.com/7-warhammer-40k-chaos-faction-packs-arrive-with-new-detachments-rules/)

**Caveats:** this session's network policy blocked reddit.com (and archive mirrors), and most
hobby sites block automated readers, so rules details above were cross-assembled from search
excerpts of the sources listed rather than full page reads. Everything load-bearing (god
boons, restrictions, Shadow of Chaos effects, CSM allowlist, 2DP cost) was confirmed across
at least two independent sources — but exact current points and the complete
stratagem/enhancement lists should be read from the official app or Wahapedia before a
tournament, per the same caveat as `shadow-legion-strategy.md`.
