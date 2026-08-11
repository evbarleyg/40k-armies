# The Shadow Legion Quartermaster — audited inventory & list book

*Distilled from the "Shadow Legion Quartermaster" and "Shadow Legion — Battle
Doctrine" artifacts (built 2026-07-27 in a separate session; the
`daemon-quartermaster` repo they cite was never pushed, so this file is the
durable copy). Points are MFM v1.1 (22 Jul 2026), cross-checked against
Wahapedia 11e / Tabletop Battles / Listhammer on 07-27. Status column updated
2026-08-11 with the August deliveries. Since 2026-08-11 the tables below are generated from
`data/muster.json`.*

- Ledger artifact: <https://claude.ai/code/artifact/a56e6f5e-47b9-4b00-8ac0-791d4815ee44>
- Battle Doctrine deck: <https://claude.ai/code/artifact/995360ab-ea16-4662-b89c-194c7a70a3c7>

## Audited collection (the July 27 photo re-audit, plus August arrivals)

The re-audit corrected the seller's list in both directions: no Beasts of
Nurgle, Plague Drones, Chaos Terminators, or Bloodletters in the lot (misreads
of Nurgling bases, Screamers, power armor, and Pink Horrors respectively) — but
it found **3 Flamers** and a genuine unlisted **Cultist Mob (~10, Dark Vengeance)**.

<!--gen:inventory-->
| Unit | Count | Pts (MFM v1.1) | Paint | From | Notes |
|---|---|---|---|---|---|
| Be'lakor | 1 | 390 | painted | Jul 21 · Shadow Legion Army Lot |  |
| Lord of Change | 1 | 320 | painted | Jul 21 · Shadow Legion Army Lot |  |
| Fateskimmer | 1 | 95 | painted | Jul 21 · Shadow Legion Army Lot |  |
| Exalted Flamer | 1 | 65 | painted | Jul 21 · Shadow Legion Army Lot |  |
| Flamers | 3 | 65 | painted | Jul 21 · Shadow Legion Army Lot | Found in the Jul 27 photo audit; unlisted by the seller. |
| Pink Horrors | 10 | 150 | painted | Jul 21 · Shadow Legion Army Lot |  |
| Blue Horrors | 10 | 125 | painted | Jul 21 · Shadow Legion Army Lot | Alternate unit or split tokens. |
| Brimstone Horrors | 9 | — *verify* | painted | Jul 21 · Shadow Legion Army Lot | Split tokens only (9). |
| Screamers | 3 | 80 | painted | Jul 21 · Shadow Legion Army Lot |  |
| Nurglings | 3 | 45 | painted | Jul 21 · Shadow Legion Army Lot | Three bases. |
| Cultist Mob | ≈10 | 50 | painted | Jul 21 · Shadow Legion Army Lot | ≈10 Dark Vengeance cultists found in the Jul 27 photo audit; count them when convenient. |
| Master of Possession | 1 | 60 | painted | Jul 21 · Shadow Legion Army Lot |  |
| Possessed | 5 | 120 | painted | Jul 21 · Shadow Legion Army Lot |  |
| Legionaries | 10 | 180 (best split — one unit of 10 is 170) | painted | Jul 21 · Shadow Legion Army Lot | Run as two fives. |
| Havocs | 5 | 125 | painted | Jul 21 · Shadow Legion Army Lot | 2 lascannon / 2 autocannon. |
| War Dog Karnivore | 2 | 310 | painted | Jul 21 · Shadow Legion Army Lot |  |
| Bloodthirster | 1 | 320 | unassembled | Jul 27 · Exalted Bloodthirster | Exalted Bloodthirster kit, on sprue. The whole hobby queue today. |
| Chaos Lord | 1 | 90 | painted | Jul 27 · Obsidius Mallex | Obsidius Mallex (Blackstone Fortress) run as a generic Chaos Lord. |
| Flesh Hounds | 5 | 75 | well painted | Jul 27 · Flesh Hounds ×5 |  |
| Bloodmaster | 1 | 65 | painted | Jul 28 · Bloodmaster + Bloodletters ×10 |  |
| Bloodletters | 9 | — (110 per 10) | painted | Jul 28 · Bloodmaster + Bloodletters ×10 | Nine counted at the audit against ten on the listing — one short of a legal ten until the Khorne lot lands. |
| **Khorne Daemons Army Lot** | ? | — | well painted | Aug 5 | Shipped Aug 6 (USPS), ETA Aug 10–17 — Bloodletters expected; a Herald (a Khorne character such as a Bloodmaster) suspected. Catalogue on arrival. |
| **Bloodcrushers lot** | ? | — | some damage, repairs due | Aug 5 | ETA Aug 18–Sep 1 (reconfirmed Aug 11) — Bloodcrushers — count unconfirmed, some damaged. Catalogue on arrival. |

Owned at MFM v1.1: **2,730 pts** — 2,410 table-ready (Bloodthirster unassembled) — across 21 records (≈92 models); spent ≈ $1,391, of which ≈$326 is still in transit.
<!--/gen:inventory-->

*(Generated from `data/muster.json` — the canonical store the Muster app reads; edit the store, then `python3 muster.py build`.)*

## Rules verified on 07-27 (citations in the ledger artifact)

- **Be'lakor must be Warlord** when present — Supreme Commander is mandatory.
- The Shadow Legion allowed-units list is named **Thralls of the First Prince**;
  Chaos Lord and Master of Possessions are explicitly on it.
- **Skulltaker and Karanak are illegal** in the detachment (Epic Heroes; only
  Be'lakor is exempt).
- **Bloodthirster is 320 pts**, one unified datasheet, and **may take Fade to
  Darkness** (he is a Character, not an Epic Hero).
- **War Dogs ride via the Chaos Knights "Dreadblades" rule: max 3** in an
  all-Chaos army, no Warlord, no enhancements.
- Detachment tricks beyond the boon table: **Fade to Darkness** (enhancement —
  the bearer's unit kills, leaves the board, returns next turn; the "yo-yo")
  and **Binding Shadow** (pull an endangered unit into reserves), alongside
  Leaping Shadows (Scouts 9"). *(Warp Surge and Denizens of the Warp, listed here in July, are not among the six
  Shadow Legion stratagems the Primer verified — the store files them as unverified.)*
- One stratagem per unit per phase this edition — spend the command point on
  the moment, not out of habit.

## The six lists (all 2,000 pts, Shadow Legion 2 DP)

Status recomputed after the August deliveries:

<!--gen:lists-->
| List | Idea | Total | Legal | Status | Gap |
|---|---|---|---|---|---|
| **A · The Yo-Yo Court** | Teleport control: Mallex and five Legionaries kill, Fade, and Rapid-Ingress back while the Tzeentch castle holds under the boons. | 1,940 | yes (2 to verify in the app: Fateskimmer → Screamers; Exalted Flamer → Flamers) | **Playable today** | — |
| **B · The Festering Court** | Nurgle attrition plus War Dogs: durable objective play, the −1-to-wound boon on the big targets, Karnivores for anti-tank. | 1,960 | yes (2 to verify in the app: War Dogs join under the Chaos Knights Dreadblades ally rule; Beasts of Nurgle) | Needs purchases | Beasts of Nurgle ×2 (1+1), Plague Drones ×3 |
| **C · Word Bearers Ascendant** | An all-marine deep-strike wave under Be'lakor: two Lords, Terminators, Chosen and Warp Talons arriving where the line is thinnest. | 1,950 | yes (2 to verify in the app: Warp Talons; Exalted Flamer → Flamers) | Needs purchases | Chaos Lord in Terminator Armour ×1, Chaos Terminator Squad ×5, Chosen ×5, Warp Talons ×5 (from ≈$115 for the priced part, Jul 27 BIN prices, auctions and part-kits excluded) |
| **D · Crimson Cavalry** | Khorne turn-one alpha: a scouting Skullmaster and Bloodcrusher brick, letters and hounds Advancing and still charging under the boon. | 1,995 | yes (4 to verify in the app: Cavalcade of Chaos; Skullmaster; Rendmaster on Blood Throne; Warp Talons) | Needs purchases | Skullmaster ×1, Bloodcrushers ×9 (6+3), Rendmaster on Blood Throne ×1, Bloodletters ×11 (1+10), Flesh Hounds ×5, Warp Talons ×5, Nurglings ×3 (from ≈$435, Jul 27 BIN prices, auctions and part-kits excluded) |
| **E · The Fadethirster** | The tournament silhouette: a Fading Bloodthirster plus the Skullmaster/Bloodcrusher brick and a Rendmaster, cheap daemons scoring underneath. | 1,980 | yes (3 to verify in the app: Cavalcade of Chaos; Skullmaster; Rendmaster on Blood Throne) | Needs purchases | Skullmaster ×1, Bloodcrushers ×6, Rendmaster on Blood Throne ×1, Bloodletters ×1 (from ≈$245, Jul 27 BIN prices, auctions and part-kits excluded) |
| **F · Triple Monster** | Be'lakor, a Fading Bloodthirster and the Lord of Change: three T10–11 monsters each dragging a 6" shadow bubble own the board by turn two. Beginner-forgiving. | 2,000 | yes (1 to verify in the app: Fateskimmer → Screamers) | Owned — hobby work first | Bloodthirster: unassembled |
<!--/gen:lists-->

*(Generated: totals and legality from the shared linter, status from the audited inventory, gap prices from the Jul 27 read-only scout snapshot.)*

**The road (from the Battle Doctrine deck):** learn on A (all painted, all
owned) → assemble the Bloodthirster to unlock F → let the inbound Bloodcrushers
lot decide whether E/D open up. Both 4-1 tournament lists it studies (Marney's
Edinburgh build; Kersley's Be'lakor-less "Red Bull Gives You Skulls") lean
Khorne cavalry + a Fading Bloodthirster and pair the detachment with
**Cavalcade of Chaos** (source of Soul-shattering Charge) — its rules are the
standing research item.

**Do-not-buy list (still in force):** Skulltaker/Karanak (illegal), the 4-model
"Cultists ×10" listing, the two fake Bloodthirster listings (a Cygor and a
Deathbringer blister).
