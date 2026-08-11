# Shadow Legion — A Beginner's Strategy Primer

*For Evan's Chaos Daemons "Shadow Legion" army. Warhammer 40,000 11th edition, MFM v1.1. Verified 2026-07-27 against Wahapedia, Tabletop Battles, and Listhammer tournament results. Every rules claim below is cited; every points value is marked `[verified]` (read directly off the datasheet) or `~` (derived/uncertain).*

You've never played 40k before, so this primer assumes nothing. Part 1 teaches you how the army works and how a game is won. Part 2 gives you six concrete 2,000-point lists built around what you already own, each with a play guide. Part 3 covers how to practise online. Appendices at the end are your quick-reference cheat sheets.

---

## Part 1 — How This Army Works

### What you're playing

Your army is **Legiones Daemonica** — the Chaos Daemons faction — running the **Shadow Legion** detachment. In plain English: you field the literal daemons of the four Chaos gods (Khorne, Tzeentch, Nurgle, Slaanesh), led by Be'lakor the Dark Master, and you're allowed to sprinkle in a limited number of Chaos Space Marines and up to three Chaos Knight War Dogs. Almost everything in the army can teleport onto the board mid-game, almost everything has a magic force-field save, and the whole game plan is "appear where the enemy is weak, kill something, vanish before they hit back."

### The rules that make Daemons Daemons

#### The Shadow of Chaos (your army rule)

Every faction has one **army rule** that applies to the whole force. Yours is **The Shadow of Chaos** ([Wahapedia](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/#The-Shadow-of-Chaos)). Think of it as a spreading fog of daemonic corruption:

- Your own **deployment zone** (your starting third of the board) is always inside the Shadow.
- **No Man's Land** (the middle strip) is inside the Shadow at the start of any phase where you control at least half the objective markers there.
- Your **opponent's deployment zone** joins the Shadow once you control at least half the objectives inside *their* zone.

While a friendly daemon unit is inside your Shadow, it gets **+1 to Battle-shock rolls** (a morale test — see glossary), and if it passes, it heals D3 wounds (or, if it's a Battleline unit like Bloodletters or Horrors, it brings back up to D3 dead models). While an *enemy* unit is inside your Shadow (or within 6" of one of your Greater Daemons — Be'lakor, the Bloodthirster, the Lord of Change), it gets **−1 to Battle-shock rolls** and takes **D3 mortal wounds** if it fails. So the Shadow both keeps your stuff alive and chips theirs down.

The strategic lesson: **fight for the mid-board objectives early**. Holding two out of three (or two out of four) mid objectives switches on the Shadow across the whole centre of the table, and the game snowballs from there.

#### Deep Strike everywhere

**Deep Strike** is a datasheet ability meaning "instead of deploying this unit on the board, keep it in Reserves and set it up mid-game anywhere more than 8" from every enemy model." Nearly every daemon in the codex has it printed on its card, and Shadow Legion also *gives* it to every Chaos Space Marine you bring ([Disciples of Be'lakor](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/#Shadow-Legion)). The core rules cap Reserves at 50% of your army's points, so at 2,000 pts you can start up to 1,000 pts off the board and rain it down from turn 2 onwards.

#### Invulnerable saves and why they matter

Most armies rely on their **armour save** (e.g. a Space Marine's 3+). High-AP (armour-piercing) weapons make that save worse — a lascannon at AP-3 turns a 3+ into a 6+. Daemons instead have **invulnerable saves** (written as "4++" or "5++") which *cannot be modified by AP*. Your Bloodthirster's 4++ is a coin-flip against everything from a bolter to a volcano cannon. This means you don't fear anti-tank weapons the way a normal army does.

#### The 11th-edition changes that quietly buffed you

Three core-rules changes in 11th edition disproportionately help Daemons ([Core Rules §13](https://wahapedia.ru/wh40k11ed/the-rules/core-rules/)):

- **Cover is now −1 to hit**, not +1 to save. In 10th edition, cover improved your armour save — useless if you were relying on an invuln. Now it makes the enemy *miss more often*, which stacks perfectly with your invulns. Tabletop Battles calls this "one of the biggest army-wide buffs of any faction" ([TTB Points Review](https://www.tabletopbattles.com/40k-11th-edition-points-review-chaos-factions)).
- **Hidden (rule 13.09)**: Infantry, Beasts, and Swarms sitting inside dense terrain that didn't shoot last turn can only be seen from within 15". Your Bloodletters, Nurglings, and Flesh Hounds are all melee-only, so they're Hidden by default whenever they park in a ruin. **Gone to Ground** drops that to 12".
- **FLY got better**. Monsters with FLY (Be'lakor, Bloodthirster, Lord of Change) now interact with terrain and cover far more favourably than in 10th — GW pre-emptively raised all your big monsters +15 pts because of it.

### The Shadow Legion detachment

#### What a "detachment" is

A **detachment** is a rules package you pick at list-building time. It gives you: a **detachment rule** (a passive buff for the whole army), a set of **enhancements** (paid upgrades you bolt onto characters), a set of **stratagems** (in-game abilities you spend Command Points to trigger), and — new in 11th — a **Force Disposition** (which primary-mission style you play). Shadow Legion costs **2 Detachment Points** (you get 3 at 2,000 pts) and its Force Disposition is **Purge the Foe** — the kill-focused primary. ([TTB Faction Pack Review](https://www.tabletopbattles.com/40k-11th-edition-faction-pack-review-chaos-daemons))

#### Thralls of the First Prince — who you can and can't bring

The detachment's list-building rule, verbatim from [Wahapedia](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/#Shadow-Legion):

> "When mustering your army, you cannot include any DAEMON PRINCE, DAEMON PRINCE WITH WINGS or **EPIC HERO** units (excluding BE'LAKOR), but you can include the following HERETIC ASTARTES units: Chaos Lord, Chaos Lord in Terminator Armour, Chaos Lord with Jump Pack, Chaos Terminator Squad, Chosen, DAMNED units, Dark Apostle, Havocs, Legionaries, Master of Possession, Possessed, Raptors, Sorcerer, Sorcerer in Terminator Armour, Warp Talons. The combined points value of such units depends on your battle size: Incursion 500 / Strike Force 1000 / Onslaught 1500."

Two big consequences of that Epic Hero ban:

- **Be'lakor is the only named character you can take.** Skarbrand, Kairos Fateweaver, Rotigus, Shalaxi, **Skulltaker**, and **Karanak** are all Epic Heroes → all illegal in Shadow Legion. (This is why the old List 2 in `lists.md` had to be fixed — see List D below.) The generic Bloodthirster, Lord of Change, Great Unclean One, and Keeper of Secrets are *not* Epic Heroes and are all fine.
- Your Chaos Space Marine allies are capped at **1,000 pts** in a 2,000-pt game and must come from the list above. Cultists count (they have the DAMNED keyword). Your Master of Possession and Chaos Lord are both explicitly on the list.

Be'lakor himself is optional — the rule *permits* him, it doesn't require him. But if he *is* in your list, his **Supreme Commander** ability means he **must** be your Warlord ([Wahapedia](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Be-lakor)).

#### First Prince of Chaos — the five god buffs

This is the passive detachment rule. Every unit in your army gets one of these depending on which god's keyword it has ([Wahapedia](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/#Shadow-Legion)):

| God | Rule name | What it does in plain English |
|---|---|---|
| **Khorne** | Murderer's Cowl | Can shoot AND declare a charge in a turn it Advanced. (Advance = move + D6" but normally can't shoot or charge.) Turns your Bloodthirster and Bloodcrushers into guided missiles. |
| **Tzeentch** | Penumbral Puppetry | Gets **Stealth** (−1 to be hit at range) *or* −1 to be hit in melee. Makes your Horrors and Lord of Change annoyingly hard to shift. |
| **Nurgle** | Gloam Rot | Attacks with Strength higher than the unit's Toughness get **−1 to wound**. Makes Nurglings (T3) shrug off S4+ small-arms and Beasts of Nurgle (T9) laugh at anti-tank. |
| **Slaanesh** | Shadow's Caress | Immune to all **Snap Shooting** (11th-ed's out-of-turn reaction fire, including Overwatch). Your Slaanesh units walk into charge range unmolested. |
| **Undivided** (Be'lakor + all your marines) | Disciples of Be'lakor | Gains **Dark Pacts** (before shooting or fighting, take a Leadership test; pass or fail, weapons gain Lethal Hits or Sustained Hits 1; on a fail take D3 mortal wounds). Be'lakor auto-passes his test. Marines also gain **Deep Strike**. |

#### The four enhancements

An **enhancement** is a paid upgrade you attach to a non-Epic-Hero **Character**. All four Shadow Legion enhancements say "SHADOW LEGION model only" — and since your marines and daemon characters all gain that keyword, any of them (Chaos Lord, Bloodthirster, Skullmaster, Fateskimmer…) can take one. ([Wahapedia](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/#Shadow-Legion))

| Enhancement | Pts | Effect | Who wants it |
|---|---|---|---|
| **Fade to Darkness** | 30 | End of the Fight phase, if the bearer's unit destroyed an enemy unit and isn't in Engagement Range, remove it into Strategic Reserves. | The auto-include. Put it on a **Bloodthirster** ("the Fadethirster") or a **Chaos Lord** leading Legionaries. Kill → vanish → Rapid Ingress back next turn. |
| **Leaping Shadows** | 25 | Bearer's unit gains **Scouts 9"** (a free 9" move before turn 1). | The other auto-include. Put it on a **Skullmaster** leading 6 Bloodcrushers — 9" scout + 10" move + Advance + charge = turn-1 threat range of ~25–30". |
| **Malice Made Manifest** | 25 | Start of Fight, pick an enemy in Engagement Range; roll D6: 2–5 = D3 mortal wounds, 6 = 3 MW. | Situational. Decent on a Great Unclean One or a Bloodmaster who'll be stuck in every turn. |
| **Mantle of Gloom** | 20 | Aura: enemy units in Engagement Range of the bearer's unit are −1 OC (Objective Control). | Helps a mid-board anchor flip contested objectives. |

#### The six stratagems

A **stratagem** is an ability you pay **CP** (Command Points) to trigger during the game. You get 1 CP in every Command phase — yours *and* your opponent's — so ~2 per battle round. ([Wahapedia](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/#Shadow-Legion))

| Stratagem | CP | When | Effect | Why you care |
|---|---|---|---|---|
| **Channelled Wrath** | 1 | Fight phase | One unit's melee weapons gain [LANCE] (+1 to wound if the unit charged); if the unit is KHORNE, also +1 AP. | Your bread-and-butter. Use it on Bloodcrushers or the Bloodthirster almost every turn. |
| **Binding Shadow** | 1 | End of opponent's Fight phase | Pick up to one Heretic Astartes unit *and* one daemon unit not in Engagement Range → put both into Strategic Reserves. | The army-wide "yo-yo." Rescue two stranded units at once, redeploy them next turn. |
| **Death Denied** | 1 | Your Command phase | One unit regains 3 wounds; if it's TZEENTCH, also return one destroyed non-character model. | Keeps a bracketed Greater Daemon healthy or tops up a Horrors brick. |
| **Encroaching Darkness** | 1 | Your Shooting phase | Up to one HA + one daemon unit that arrived from Reserves this turn get [IGNORES COVER]. | Pairs with Havocs deep-striking in. |
| **Spiteful Demise** | 1 | Any phase, when your unit is destroyed | Roll D6 per enemy unit in Engagement Range (+2 if you were SLAANESH); 4–5 = D3 MW, 6+ = 3 MW. | A nasty parting gift. |
| **Shade Path** | 2 | Opponent's Charge phase | When a visible enemy within 12" declares a charge, −1" to that charge; if your unit is NURGLE, the enemy also Battle-shock tests. | Nerfed in 11th (was −2"). Still occasionally saves a screen. |

#### Pairing with Cavalcade of Chaos

11th edition lets you spend leftover Detachment Points on a **secondary detachment**. Shadow Legion is 2 DP; you have 3. Every single 4-1 Shadow Legion list on Listhammer spends the third point on **Cavalcade of Chaos** (1 DP, Disruption disposition) — a Mounted-unit mini-package that gives your Bloodcrushers the *Soul-shattering Charge* upgrade (fight at 3" Engagement Range, so the whole brick swings) plus a couple of cavalry stratagems. If you're running Bloodcrushers at all, take Cavalcade. ([Listhammer](https://listhammer.info/?faction=Chaos+Daemons), [TTB Faction Pack Review](https://www.tabletopbattles.com/40k-11th-edition-faction-pack-review-chaos-daemons))

### How you actually win a game

#### Scoring in 11th edition

A game is **five battle rounds**. You score **Victory Points (VP)** two ways ([Core Rules §07–§14](https://wahapedia.ru/wh40k11ed/the-rules/core-rules/), [BoLS mission overview](https://www.belloflostsouls.net/2026/05/warhammer-40k-chapter-approved-missions-deck-for-11th-edition-revealed.html)):

- **Primary mission** — determined by matching your **Force Disposition** against your opponent's (there are 15 pairings). Shadow Legion's disposition is **Purge the Foe**, which rewards you for destroying enemy units *and* holding objective markers. You score primary VP in the Command phase.
- **Secondary missions** — you draw two cards per Command phase from an 18-card Attacker or Defender deck (which one you are depends on the disposition matchup). Each card is worth 3–5 VP for doing a specific task ("hold the centre," "have a unit in every table quarter," "kill a character"). Cap of 15 secondary VP per turn.

You **control an objective marker** if the total **OC** (Objective Control — a stat printed on every datasheet) of your models within 3" of it beats your opponent's total. Battle-shocked units have OC 0 — this is why the Shadow of Chaos forcing failed Battle-shock tests directly wins you objectives.

#### Your three jobs each turn

1. **Kill for primary.** Purge the Foe pays you for destroying units. Your Bloodthirster, Bloodcrushers, and Be'lakor are the killers.
2. **Hold with cheap stuff.** Nurglings, Cultists, Pink Horrors, and Beasts of Nurgle sit on objectives you've already taken. Cultists are "sticky" (the objective stays yours even after they leave); Nurglings Infiltrate onto mid-board turn 0.
3. **Do secondaries with fast stuff.** Flesh Hounds (native pick-up-and-redeploy at end of enemy turn), Screamers (14" FLY), and Plague Drones are your action monkeys — they run into corners, do the card, and get out.

### Phase-by-phase: what to think about

- **Command phase.** Gain 1 CP. Score primary. Draw secondaries. Pick Be'lakor's *Shadow Form* for the round (usually *Wreathed in Shadows* — friendlies within 6" can only be shot from ≤18"). Use *Death Denied* if a big monster is hurt.
- **Movement phase.** Bring in Reserves (from turn 2). Advance Khorne units freely — they still charge. Position screens 8.1" in front of things you don't want charged.
- **Shooting phase.** You barely have one. Havocs, Lord of Change, and Flamers do their thing; everything else runs.
- **Charge phase.** Declare Bloodthirster/Bloodcrushers first; remember 8" is the magic number out of Deep Strike (needs an 8 on 2D6 to reach base contact).
- **Fight phase.** *Channelled Wrath* on your best charger. Resolve Be'lakor's Dark Pact (auto-pass). At end of phase, *Fade to Darkness* the Bloodthirster if it killed and is free.
- **Opponent's turn.** *Rapid Ingress* (core stratagem, 1 CP) at end of their Movement to bring the Fadethirster back down. *Binding Shadow* at end of their Fight phase to lift two exposed units. *Shade Path* if a scary charge is 8–9" out.

### A typical game, turn by turn

**Deployment.** Infiltrate Nurglings onto a No Man's Land objective (or 9" up to zone-block a scary enemy scout unit). Pink Horrors and Cultists on your home objectives. Skullmaster + 6 Bloodcrushers on the line, then Scout them 9" forward. Be'lakor central, hugging a ruin. Bloodthirster, Legionaries, and any second wave in Reserves (up to 1,000 pts).

**Turn 1.** The Bloodcrusher brick Advances (Murderer's Cowl) and charges something mid-board — with Scouts 9" + M10" + D6" + 2D6" charge, you'll usually make it. *Channelled Wrath* on them. Nurglings tag the mid objective, switching on the Shadow across No Man's Land. Be'lakor walks up under *Wreathed in Shadows*.

**Turn 2.** Bloodthirster arrives from Deep Strike 8.1" from a flank target (or 3" if you use *Denizens of the Warp* — check errata status). It charges, deletes a vehicle, and *Fades to Darkness* at end of Fight. Legionaries and Havocs drop on a backfield objective. During opponent's turn, *Rapid Ingress* the Bloodthirster onto the far side of the board.

**Turns 3–4.** Grind. The Fadethirster loops (drop → kill → vanish → Ingress). Flesh Hounds bounce between table quarters doing secondaries. *Binding Shadow* rescues whatever the enemy is about to trap. Shadow of Chaos should be covering most of the board by now — enemy Battle-shock failures start flipping objectives to you for free.

**Turn 5.** Score-out. Throw everything remaining onto objectives; OC is all that matters now.

### Common beginner mistakes

- **Over-committing greater daemons.** Be'lakor and the Bloodthirster are 390 and 320 pts. If one of them charges into the open turn 1 and dies to a whole army's shooting, you're down 15–20% of your list. Use terrain, *Wreathed in Shadows*, and Fade to Darkness to keep them alive.
- **Forgetting the 8" Deep Strike bubble.** You must set up more than 8" from every enemy model. Opponents will "screen" — spread cheap models in a 8.1" ring around what they want to protect. You need to kill the screen first.
- **Not screening yourself.** The reverse: string Nurglings or Cultists 8.1" in front of your monsters so *their* deep-strikers can't land on you.
- **Wasting CP.** You get ~10 CP a game. *Channelled Wrath* every Fight phase and *Binding Shadow* / *Rapid Ingress* as needed will eat most of it. Don't blow 2 CP on *Shade Path* unless it genuinely saves a unit.
- **Forgetting Shadow of Chaos triggers.** It checks at the *start of every phase*. If you take a second mid-board objective in your Movement phase, No Man's Land is in your Shadow *for the Shooting phase onwards*. Announce it.
- **Leaving reserves too late.** Anything still in Reserves at end of round 3 is destroyed.

### Matchup notes

- **vs shooting castles / gunlines** (Tau, Guard, Votann): your best matchup. Hidden, cover-as-−1-to-hit, and *Wreathed in Shadows* mean they can't project damage past 15–18". Deep Strike behind their line turn 2 and the castle folds.
- **vs melee rush** (World Eaters, Orks, Tyranids): trickier. They'll try to trade into your monsters. Screen hard with Nurglings, use *Shade Path* and *Binding Shadow* to deny charges, and pick off their hammer units with the Fadethirster before they connect.
- **vs elite/vehicle skew** (Imperial/Chaos Knights, Custodes): the Bloodthirster's Great Axe (S16 AP-4 D6+2) and the Bloodcrushers' Lance horns eat armour. *Channelled Wrath* is huge here. Your invulns mean their big guns aren't as scary as they look.
- **vs horde** (Guard infantry, Termagant spam): sweep-profile weapons (Bloodthirster sweep = 14 attacks, Be'lakor sweep = 14 attacks) and Flamers clear chaff. Your risk is running out of bodies to hold objectives — keep Cultists and Horrors safe.

---

## Part 2 — Your List Options

> **Read the rosters below with the store, not instead of it (note added 2026-08-11).** The "own / buy / verify" tags and a
> few compositions in this part are the Jul 27 pre-audit state: the photo re-audit found no Beasts, Plague Drones,
> Terminators or Bloodletters in the original box (and unlisted Flamers and Cultists), the August purchases added a
> Bloodthirster, a Chaos Lord, Flesh Hounds and a Bloodmaster with nine Bloodletters, Skullmaster went to 85, and lists C
> and E were re-stored at 1,950 and 1,980. Muster (Lists → each list) has the current rosters, ownership and prices;
> the play guides here — how each list wins, deploys and spends CP — still hold.

Six complete 2,000-pt lists. **A–D** are the four `lists.md` archetypes rebuilt with corrected points and legality fixes; **E–F** are new. Each roster table marks whether you already own the unit or need to buy it (prices from `listings.json`, eBay 2026-07-26). All Heretic Astartes (HA) subtotals are checked against the 1,000-pt cap.

---

### List A — The Yo-Yo Court

*Teleport control. Closest to what you own. ~$70–110 to complete.*

| Unit | Pts | Own/Buy |
|---|---:|---|
| Be'lakor (Warlord) | 390 [verified] | own |
| Lord of Change | 320 [verified] | own |
| Chaos Lord + **Fade to Darkness** → leads Legionaries A | 90+30 [verified] | **buy** ~$25 |
| Legionaries ×5 (A) | 90 [verified] | own |
| Legionaries ×5 (B) | 90 [verified] | own |
| Master of Possession → leads Possessed | 60 [verified] | own |
| Possessed ×5 | 120 [verified] | own |
| Havocs ×5 (2 las / 2 auto) | 125 [verified] | own |
| Fateskimmer → leads Screamers | 95 [verified] | own |
| Screamers ×3 | 80 [verified] | own |
| Exalted Flamer → leads Flamers | 65 [verified] | own |
| Flamers ×3 | 65 [verified] | own |
| Pink Horrors ×10 | 150 [verified] | own |
| Nurglings ×3 | 45 [verified] | own |
| Flesh Hounds ×5 | 75 [verified] | **buy** ~$20–50 |
| Cultist Mob ×10 | 50 [verified] | **buy** ~$28 |
| **Total** | **1,940 / 2,000** | HA: 625 / 1,000 |

*60 pts spare — add a second Nurglings ×3 (45, ~$20) for 1,985, or leave it as buffer.*

**What it's trying to do.** Positional attrition. The Tzeentch package (Horrors, LoC, Fateskimmer, Flamers) all get Stealth from *Penumbral Puppetry* and hold ground while Be'lakor anchors centre. The Chaos Lord + Legionaries brick is the yo-yo: Deep Strike, kill an objective-holder, *Fade to Darkness* into Reserves, *Rapid Ingress* back next turn (the Lord's *Lord of Chaos* ability makes one strat per round 1 CP cheaper — spend it on the Ingress). *Binding Shadow* lifts a second daemon unit alongside them.

**Deployment.** Nurglings Infiltrate mid. Cultists and Pink Horrors on your two home objectives. LoC and Be'lakor central behind a ruin. Havocs on a backfield firing lane. Chaos Lord + Legionaries A, Possessed + MoP, and Flesh Hounds in Reserves (~540 pts).

**Turn 1–2 plan.** T1: hold, shoot with LoC/Havocs, push Screamers up a flank for a *Slashing Dive*. T2: drop the Lord+Legionaries onto an exposed objective, drop Possessed on the other flank, Flesh Hounds into the enemy backfield. Start the Fade loop.

**Each unit's job.** Be'lakor — mid-board bully + *Wreathed in Shadows* bubble. LoC — shooting + Tzeentch aura. Lord+Legionaries — the yo-yo. MoP+Possessed — secondary hammer (MoP gives +1" Adv/Charge). Havocs — anti-tank from safety. Fateskimmer+Screamers — fast actions + once-per-game self-uppy-downy. Pink Horrors — split into Blues/Brimstones and never quite die. Nurglings — mid-board tarpit (−1 to hit enemies in melee). Flesh Hounds — free redeploy every enemy turn = perfect secondary scorers. Cultists — sticky home objective.

**Key stratagems & tricks.** *Binding Shadow* pulls both the Lord's brick *and* one daemon unit at once — that's your reset button. *Death Denied* on the LoC or Be'lakor keeps them above their Damaged bracket. *Encroaching Darkness* on Havocs the turn they arrive.

**What beats it & how to adapt.** Fast melee pressure that trades into Be'lakor before your reserves land. Answer: keep Be'lakor >18" from their guns via *Wreathed in Shadows* and don't push him past your Nurgling screen until T2.

---

### List B — Festering Court

*Nurgle attrition + War Dogs. Cheapest to field: ~$0–20.*

| Unit | Pts | Own/Buy |
|---|---:|---|
| Be'lakor (Warlord) | 390 [verified] | own |
| Lord of Change | 320 [verified] | own |
| Beast of Nurgle ×1 | 75 [verified] | own (photo) |
| Beast of Nurgle ×1 | 75 [verified] | own (photo) |
| Plague Drones ×3 | 110 [verified] | own (photo) |
| Nurglings ×3 | 45 [verified] | own |
| Pink Horrors ×10 | 150 [verified] | own |
| Havocs ×5 | 125 [verified] | own |
| Legionaries ×5 | 90 [verified] | own |
| Legionaries ×5 | 90 [verified] | own |
| Master of Possession → Possessed | 60 [verified] | own |
| Possessed ×5 | 120 [verified] | own |
| War Dog Karnivore | 155 [verified] | own |
| War Dog Karnivore | 155 [verified] | own |
| **Total** | **1,960 / 2,000** | HA: 485 / 1,000 · War Dogs: 2/3 |

*If you have a third Beast of Nurgle in the box, add it (75) and drop one Legionaries ×5 (90) → 1,945.*

**What it's trying to do.** Score by refusing to die. *Gloam Rot* (−1 to wound vs high-S) on Beasts of Nurgle (T9, regenerate ALL lost wounds at end of every phase) makes them functionally immortal on an objective. Nurglings and Plague Drones round out the Nurgle brick. War Dogs (via **Dreadblades** — max 3 in any all-CHAOS army, no Warlord/enhancements; [Wahapedia CK](https://wahapedia.ru/wh40k11ed/factions/chaos-knights/)) and Havocs bring the shooting daemons lack.

**Deployment.** Beasts Scout 6" onto mid objectives T0. Nurglings Infiltrate. War Dogs on a flank ready to Advance (they reroll Advance & Charge). Everything marine in Reserves.

**Turn 1–2 plan.** Beasts squat. War Dogs Advance-and-charge a flank (14"+D6"+2D6"). Be'lakor walks into whatever's contesting mid. From T2, drop marines onto objectives the enemy has thinned out.

**Each unit's job.** Beasts — unkillable objective plugs. Plague Drones — fast Nurgle actions + *Death's Heads* wound-reroll debuff. War Dogs — your only real damage into vehicles (Slaughterclaw S12 D6+2). LoC — shooting. Possessed — counter-punch.

**Key stratagems & tricks.** *Shade Path* is best here (Nurgle bonus = enemy Battle-shocks on the failed charge). *Death Denied* on a Beast is overkill but funny.

**What beats it & how to adapt.** Volume-of-attacks melee (Orks, Tyranid gaunts) chews through Beasts eventually because Gloam Rot doesn't help vs S≤T. Feed them Nurglings first and counter-charge with War Dogs.

---

### List C — Word Bearers Ascendant

*The mortal half rises. Marine-heavy Deep Strike shell game. ~$170–290 to complete.*

| Unit | Pts | Own/Buy |
|---|---:|---|
| Be'lakor (Warlord) | 390 [verified] | own |
| Chaos Lord + **Fade to Darkness** → Legionaries | 90+30 [verified] | **buy** ~$25 |
| Legionaries ×5 | 90 [verified] | own |
| Chaos Lord in Terminator Armour → Terminators | 85 [verified] | **buy** ~$20 |
| Chaos Terminator Squad ×5 | 175 [verified] | own? (verify box) |
| Chosen ×5 | 135 [verified] | **buy** ~$40 |
| Warp Talons ×5 | 125 [verified] | **buy** $44–107 |
| Master of Possession → Possessed | 60 [verified] | own |
| Possessed ×5 | 120 [verified] | own |
| Cultist Mob ×10 | 50 [verified] | **buy** ~$28 |
| Cultist Mob ×10 | 50 [verified] | **buy** ~$45 |
| Nurglings ×3 | 45 [verified] | own |
| Pink Horrors ×10 | 150 [verified] | own |
| Exalted Flamer → Flamers ×3 | 65+65 [verified] | own |
| Screamers ×3 | 80 [verified] | own |
| Fateskimmer + **Leaping Shadows** | 95+25 [verified] | own |
| Flesh Hounds ×5 | 75 [verified] | **buy** ~$20–50 |
| **Total** | **2,000 / 2,000** | HA: 980 / 1,000 |

**What it's trying to do.** Every marine unit in this list gains **Deep Strike** from *Disciples of Be'lakor*. Half the army starts off-board; from T2 you drop 3–4 units simultaneously and threaten the whole table. Every marine also has **Dark Pacts** (Lethal or Sustained Hits on demand), so even 5 Legionaries punch above their weight.

**Deployment.** Cultists on both home objectives (sticky). Nurglings Infiltrate mid. Fateskimmer Scouts 9" up a flank. Pink Horrors + Be'lakor central. In Reserves: Terminators+Termi Lord, Chosen, Warp Talons, Lord+Legionaries, Possessed+MoP, Flesh Hounds (~945 pts — under the 1,000 cap).

**Turn 1–2 plan.** T1: survive, shoot Flamers, tag mid with Nurglings. T2: drop everything. Terminators onto their firebase, Warp Talons onto a flank objective (they have their own kill-and-vanish rule), Lord+Legionaries into the backfield with Fade.

**Each unit's job.** Terminators (2+/4++, Deep Strike native, *Despoilers* = reroll hits on Dark Pact) — your anvil. Chosen (*Chosen Marauders* = shoot & charge after Advance/Fall Back) — flexible bullies. Warp Talons — self-recycling assassins. Possessed — Devastating Wounds bomb once per game. Fateskimmer — Scouts 9" T0, then once-per-game self-uppy-downy for a late secondary.

**Key stratagems & tricks.** *Encroaching Darkness* on Terminators + one daemon unit the turn they land. Warp Talons don't need *Binding Shadow* (they have their own version built in).

**What beats it & how to adapt.** Gunline castles that screen 8" perfectly. Answer: use Flesh Hounds and Screamers to strip the screen T1–2 so the T2 drop lands where it hurts.

---

### List D — Crimson Cavalry (fixed)

*Khorne pressure. This is the corrected version of the old "Crimson Spearhead" — Skulltaker and Karanak have been removed because both are Epic Heroes and therefore illegal in Shadow Legion ([Wahapedia Skulltaker](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Skulltaker), [Karanak](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Karanak)). Skullmaster and Bloodmaster take their place. ~$250–350 to complete.*

| Unit | Pts | Own/Buy |
|---|---:|---|
| Be'lakor (Warlord) | 390 [verified] | own |
| Skullmaster + **Leaping Shadows** → Bloodcrushers ×6 | ~75+25 | **buy** ~$30 |
| Bloodcrushers ×6 | 190 [verified] | **buy** ~$100 |
| Bloodcrushers ×3 | 95 [verified] | **buy** ~$48 |
| Rendmaster on Blood Throne | ~150 | **buy** ~$50 |
| Bloodmaster → Bloodletters ×10 | 65 [verified] | **buy** ~$25 |
| Bloodletters ×10 | 110 [verified] | own (photo) |
| Bloodletters ×10 | 110 [verified] | **buy** ~$25 (lot) |
| Flesh Hounds ×5 | 75 [verified] | **buy** ~$20–50 |
| Flesh Hounds ×5 | 75 [verified] | **buy** (9-pack $87 covers both) |
| Chaos Lord + **Fade to Darkness** → Legionaries ×5 | 90+30 [verified] | **buy** ~$25 |
| Legionaries ×5 | 90 [verified] | own |
| Warp Talons ×5 | 125 [verified] | **buy** $44–107 |
| Nurglings ×3 | 45 [verified] | own |
| Nurglings ×3 | 45 [verified] | **buy** ~$20 |
| Cultist Mob ×10 | 50 [verified] | **buy** ~$28 |
| Pink Horrors ×10 | 150 [verified] | own |
| **Total** | **1,985 / 2,000** | HA: 355 / 1,000 |

*Secondary detachment: **Cavalcade of Chaos** (1 DP) — put Soul-shattering Charge on the big Bloodcrusher unit.*

**What it's trying to do.** Turn-1 alpha strike. Everything Khorne gets Advance-and-charge from *Murderer's Cowl*. The Skullmaster + 6 Bloodcrushers brick Scouts 9", moves 10", Advances D6", charges 2D6" — it *will* hit something T1. *Channelled Wrath* gives it Lance (+1 to wound) and +1 AP; the Rendmaster's aura adds +1 to wound for all nearby Khorne. It hits like a freight train and the rest of the army follows behind.

**Deployment.** Skullmaster brick and Rendmaster on the line. Bloodmaster + Bloodletters and second Crushers just behind. Nurglings Infiltrate. Cultists + Horrors home. Lord+Legionaries, Warp Talons, Flesh Hounds in Reserves.

**Turn 1–2 plan.** T1: Scout → Advance → charge with the big brick. *Brass Stampede* (D3 MW per model on 4+) plus *Channelled Wrath* deletes most 200-pt units outright. Bloodletters follow into the gap. T2: Lord+Legionaries and Warp Talons drop behind, Flesh Hounds into their backfield.

**Each unit's job.** Skullmaster+Crushers — the hammer. Rendmaster — +1 to wound aura, stays 6" behind the hammer. Bloodmaster+Bloodletters — second wave (Bloodmaster gives +1 to wound and 6" Consolidate). Flesh Hounds — free redeploy every enemy turn. Lord+Legionaries — the yo-yo backfield threat.

**Key stratagems & tricks.** *Channelled Wrath* every Fight phase on whichever Khorne unit charged the hardest target. Cavalcade's *Soul-shattering Charge* means all 6 Crushers + Skullmaster fight even if only two make base contact.

**What beats it & how to adapt.** This is the highest-variance list. If the T1 charge fails or the brick gets screened into a 50-pt chaff unit, you've spent your best punch on nothing. TheChirurgeon at Tabletop Battles specifically warns about this trade-down risk ([Detachment Focus](https://www.tabletopbattles.com/detachment-focus-shadow-legion/)). Mitigation: charge the Crushers into something *they can wipe and consolidate off of*, not into a tarpit.

---

### List E — The Fadethirster

*NEW. This is the tournament-shape list — the pattern every 4-1 Shadow Legion result on Listhammer follows (Marney at Edinburgh Super Major, Kersley at Burn & Learn, Wood at Checkmate GT). ~$250–350 to complete.*

| Unit | Pts | Own/Buy |
|---|---:|---|
| Be'lakor (Warlord) | 390 [verified] | own |
| **Bloodthirster** (Great Axe) + **Fade to Darkness** | 320+30 [verified] | **buy** ~$110–170 |
| Skullmaster + **Leaping Shadows** → Bloodcrushers ×6 | ~75+25 | **buy** ~$30 |
| Bloodcrushers ×6 | 190 [verified] | **buy** ~$100 |
| Rendmaster on Blood Throne | ~150 | **buy** ~$50 |
| Bloodmaster → Bloodletters ×10 | 65+110 [verified] | **buy** $25 / own (photo) |
| Nurglings ×3 | 45 [verified] | own |
| Flesh Hounds ×5 | 75 [verified] | **buy** ~$20–50 |
| Plague Drones ×3 | 110 [verified] | own (photo) |
| Pink Horrors ×10 | 150 [verified] | own |
| Havocs ×5 | 125 [verified] | own |
| Legionaries ×5 | 90 [verified] | own |
| Cultist Mob ×10 | 50 [verified] | **buy** ~$28 |
| **Total** | **2,000 / 2,000** | HA: 265 / 1,000 |

*Secondary detachment: **Cavalcade of Chaos** (1 DP). Reference lists: [Marney, Edinburgh 4-1](https://listhammer.info/list/6c5bcb0f5b3c1ad3dc); [Kersley, 4-1 2nd](https://listhammer.info/list/2c3a937a2bfdd7cff2).*

**What it's trying to do.** Two independent kill-loops running at once. Loop 1: Skullmaster + Bloodcrushers Scout-Advance-charge T1 and never stop. Loop 2: the **Fadethirster** — Bloodthirster with Fade to Darkness — drops T2, one-shots a tank (Great Axe: 7A S16 AP-4 D6+2, ~30 damage into T12 3+), vanishes at end of Fight, *Rapid Ingress* during their Movement, repeat. Between swings it's literally not on the board to be shot at. Rendmaster's +1-to-wound aura and *Channelled Wrath* make both loops hit harder. Everything else scores.

**Deployment.** Crusher brick + Rendmaster on the line, Scout 9". Nurglings Infiltrate. Cultists + Horrors home. Be'lakor central. Bloodthirster, Bloodmaster+Bloodletters, Havocs, Legionaries in Reserves.

**Turn 1–2 plan.** T1: Crushers charge. Be'lakor pushes to 6" of mid so his Greater Daemon aura + Shadow of Chaos start battle-shocking things. T2: Fadethirster drops on their scariest vehicle; Havocs drop on a lascannon lane; Bloodletters drop mid.

**Each unit's job.** Bloodthirster — repeatable anti-tank missile + Khorne aura (+1 to hit for nearby Khorne). Skullmaster+Crushers — primary hammer. Rendmaster — buff piece, keep it 6" behind the action. Plague Drones — Nurgle-keyword fast actions with Gloam Rot durability. Flesh Hounds — free uppy-downy secondaries. Havocs — Deep Strike lascannons with *Stabilisation Talons* (ignore hit modifiers).

**Key stratagems & tricks.** The whole list runs on three: *Channelled Wrath* (Fight), *Rapid Ingress* (opponent's Movement, on the Fadethirster), *Binding Shadow* (end of opponent's Fight, rescue Crushers + Legionaries if stranded). That's ~3 CP/round, which is roughly what you generate.

**What beats it & how to adapt.** The community split on Bloodthirsters is real: rules-analysis rates the Fadethirster top-tier, but TheChirurgeon's playtesting found a *scouting* Bloodthirster often trades down and dies ([TTB Detachment Focus](https://www.tabletopbattles.com/detachment-focus-shadow-legion/)). The Fade-to-Darkness build sidesteps that — it doesn't scout into danger, it drops surgically and leaves. If your local meta is heavy on Overwatch/Snap Shooting, consider swapping the Bloodthirster for a second Bloodcrusher brick (Kersley's approach).

---

### List F — Triple Monster

*NEW. Be'lakor + Bloodthirster + Lord of Change. The big-three approach. ~$140–200 to complete.*

| Unit | Pts | Own/Buy |
|---|---:|---|
| Be'lakor (Warlord) | 390 [verified] | own |
| Bloodthirster (Great Axe) + **Fade to Darkness** | 320+30 [verified] | **buy** ~$110–170 |
| Lord of Change | 320 [verified] | own |
| Pink Horrors ×10 | 150 [verified] | own |
| Blue Horrors ×10 | 125 [verified] | own |
| Nurglings ×3 | 45 [verified] | own |
| Fateskimmer → Screamers ×3 | 95+80 [verified] | own |
| Havocs ×5 | 125 [verified] | own |
| Legionaries ×5 | 90 [verified] | own |
| Master of Possession → Possessed ×5 | 60+120 [verified] | own |
| Cultist Mob ×10 | 50 [verified] | **buy** ~$28 |
| **Total** | **2,000 / 2,000** | HA: 445 / 1,000 |

**What it's trying to do.** Three T10–11, 4++ monsters that each project a 6" Shadow-of-Chaos aura. Between *Wreathed in Shadows* (only shootable within 18"), Stealth on the LoC, and cover-as-−1-to-hit, all three are surprisingly hard to remove. The Bloodthirster runs the Fade loop; the LoC shoots and buffs Tzeentch; Be'lakor bullies mid. The rest of the list is what you already own filling out scoring.

**Deployment.** All three monsters behind ruins in your DZ (Be'lakor centre, LoC on the shooty flank, Bloodthirster in Reserves). Nurglings Infiltrate. Horrors + Cultists home.

**Turn 1–2 plan.** T1: LoC shoots (Bolt of Change with Sustained Hits D3), Be'lakor moves to the mid ruin. T2: Fadethirster drops and starts looping; Possessed and Legionaries drop on flanks.

**Each unit's job.** The three monsters do the killing and each carry their own Greater Daemon 6" Shadow bubble — spread them out and most of the board is in your Shadow by T2. Blue Horrors Infiltrate onto a forward objective (they have Infiltrators natively). Fateskimmer+Screamers — fast actions.

**Key stratagems & tricks.** *Death Denied* keeps whichever monster took the most fire above its Damaged bracket. Remember the LoC's *Master of Magicks* — pick Sustained Hits D3 into hordes, Lethal Hits into vehicles.

**What beats it & how to adapt.** This is the most beginner-forgiving list (three durable centrepieces, minimal reserves juggling) but the least competitive — 1,060 pts in three models means you're thin on scoring bodies. If you find you're losing on secondaries, cut the LoC for a Skullmaster + Bloodcrushers package and you're basically playing List E.

---

## Part 3 — Practicing & Playing Online

### Building lists

- **[Warhammer 40,000: The App](https://apps.apple.com/us/app/warhammer-40-000-the-app/id6443503982)** ([Android](https://play.google.com/store/apps/details?id=com.gamesworkshop.w40k)) — official. The **Battle Forge** builder is fully updated for 11th-ed detachments, Force Dispositions, and MFM v1.1. Codex codes unlock full rules text; a Warhammer+ sub unlocks multiple saved lists. This is what you'll use to double-check everything above.
- **[New Recruit](https://www.newrecruit.eu/)** — free community builder, updated within hours of every points change. The de-facto Battlescribe replacement.
- Also worth bookmarking: [40k.app](https://www.40k.app/), [ListForge](https://listforge.club/).

### Playing on Tabletop Simulator

The maintained community pack is **Battleforged**: [github.com/TTSWarhammer40k/Battleforged-Workshop-Mod-Compilation](https://github.com/TTSWarhammer40k/Battleforged-Workshop-Mod-Compilation). Download the ZIP, drop it into `Documents/My Games/Tabletop Simulator/Saves`, load in-game. Pair it with **Yellowscribe V2** (imports your New Recruit list as spawnable models with datasheets attached) and an **FTC map base** from Steam Workshop. Beginner path:

1. Build the list in New Recruit → export to Yellowscribe.
2. Open TTS, load an FTC map, spawn your army from the Yellowscribe bag.
3. Find an opponent in the **[TTS Warhammer 40k Discord](https://discord.com/invite/ttswarhammer40k)** (~22k members, active LFG channels, very new-player-friendly).

### Where to find opponents & advice

- **[TTS Warhammer 40k Discord](https://discord.com/invite/ttswarhammer40k)** — LFG, mod support, rules questions.
- **r/WarhammerCompetitive**, **r/Chaos40k**, **r/ChaosDaemons40k** — list feedback and meta discussion.
- **[Tabletop Battles / Goonhammer](https://www.tabletopbattles.com/)** — the best written 40k content. Their *Competitive Innovations* column every week breaks down winning tournament lists.
- **[Art of War 40k](https://www.youtube.com/@ArtofWar40k/videos)** — high-level coaching and battle reports on YouTube; deeper content behind [The War Room](https://thewarroom.vhx.tv/) paywall.
- **[Stat Check](https://www.stat-check.com/the-meta)** and **[Listhammer](https://listhammer.info/?faction=Chaos+Daemons)** — live win-rate dashboards and top-placing lists.

---

## Appendix A — Rules Digest (cited)

| Rule | Summary | Source |
|---|---|---|
| **The Shadow of Chaos** (army rule) | Your DZ always in Shadow; NML/enemy DZ join when you hold ≥half their objectives. Friendlies inside: +1 Battle-shock, heal D3 (Battleline: return D3 models). Enemies inside or within 6" of Greater Daemon: −1 Battle-shock, D3 MW on fail. | [Wahapedia](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/#The-Shadow-of-Chaos) |
| **Thralls of the First Prince** | No Daemon Princes or Epic Heroes except Be'lakor. May include listed HA units up to 500/1000/1500 pts. | [Wahapedia](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/#Shadow-Legion) |
| **First Prince of Chaos** | Khorne adv+charge · Tzeentch Stealth/−1 melee · Nurgle −1 wound vs S>T · Slaanesh no Snap Shooting · Undivided Dark Pacts + HA Deep Strike. | [Wahapedia](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/#Shadow-Legion) |
| **Disciples of Be'lakor** | Be'lakor + HA units gain SHADOW LEGION + UNDIVIDED keywords; Be'lakor auto-passes Dark Pacts. | [Wahapedia](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/#Shadow-Legion) |
| **Dreadblades** | Any all-CHAOS army may include 1 Titanic CK **or** ≤3 War Dogs. Can't be Warlord, no enhancements. | [Wahapedia CK](https://wahapedia.ru/wh40k11ed/factions/chaos-knights/) |
| **Supreme Commander** (Be'lakor) | If in the army, must be Warlord. | [Wahapedia](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Be-lakor) |
| **Cover** (core 13.08) | −1 to attacker's BS (not +1 to save). | [Core Rules](https://wahapedia.ru/wh40k11ed/the-rules/core-rules/) |
| **Hidden** (core 13.09) | Inf/Beast/Swarm in dense terrain that didn't shoot: only visible within 15". Gone to Ground: 12". | [Core Rules](https://wahapedia.ru/wh40k11ed/the-rules/core-rules/#Hidden) |
| **Strategic Reserves** (core §20) | ≤50% pts in reserve; Ingress from R2, board edge within 6", >8" from enemies; not into enemy DZ before R3; destroyed if still in reserve end of R3. | [Core Rules](https://wahapedia.ru/wh40k11ed/the-rules/core-rules/) |
| **Deep Strike** | Ingress anywhere on the board (not just an edge), still >8" from enemies. | [Core Rules](https://wahapedia.ru/wh40k11ed/the-rules/core-rules/) |
| **CP generation** | Both players gain 1 CP in every Command phase (yours and theirs). | [Core Rules §08](https://wahapedia.ru/wh40k11ed/the-rules/core-rules/) |
| **Force Dispositions / primaries** | Detachment fixes your disposition; the two players' dispositions pair to one of 15 primary matchups. Shadow Legion = Purge the Foe (2 DP). | [Spikey Bits](https://spikeybits.com/chapter-approved-deck-2026-force-dispositions-decide-what-the-game-is-about/) |
| **Enhancements** (core 25.04) | CHARACTER only; Epic Heroes never; no Monster exclusion. | [Core Rules](https://wahapedia.ru/wh40k11ed/the-rules/core-rules/) |

## Appendix B — Verified Points Table (MFM v1.1, 2026-07-22)

All values read directly off Wahapedia 11e datasheets on 2026-07-27. `(3rd+)` = 11th-ed spam-tax price for the third and subsequent copies.

| Unit | Pts | Source |
|---|---:|---|
| Be'lakor | 390 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Be-lakor) |
| Lord of Change | 320 / 340 (3rd+) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Lord-of-Change) |
| Bloodthirster | 320 / 335 (3rd+) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Bloodthirster) |
| Soul Grinder | 180 / 195 (3rd+) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Soul-Grinder) |
| Fateskimmer | 95 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Fateskimmer) |
| Exalted Flamer | 65 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Exalted-Flamer) |
| Nurglings | 45 (3) / 90 (6) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Nurglings) |
| Pink Horrors ×10 | 150 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Pink-Horrors) |
| Blue Horrors ×10 | 125 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Blue-Horrors) |
| Flamers | 65 (3) / 130 (6) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Flamers) |
| Screamers | 80 (3) / 160 (6) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Screamers) |
| Bloodletters ×10 | 110 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Bloodletters) |
| Bloodmaster | 65 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Bloodmaster) |
| Skullmaster | ~75 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Skullmaster) |
| Rendmaster on Blood Throne | ~150 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Rendmaster-On-Blood-Throne) |
| Bloodcrushers | 95 (3) / 190 (6) · 115/210 (3rd+) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Bloodcrushers) |
| Flesh Hounds | 75 (5) / 150 (10) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Flesh-Hounds) |
| Beasts of Nurgle | 75 (1) / 140 (2) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Beasts-Of-Nurgle) |
| Plague Drones | 110 (3) / 220 (6) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Plague-Drones) |
| Skulltaker (illegal in SL) | 85 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Skulltaker) |
| Karanak (illegal in SL) | 70 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Karanak) |
| Chaos Lord | 90 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-space-marines/Chaos-Lord) |
| Chaos Lord in Terminator Armour | 85 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-space-marines/Chaos-Lord-In-Terminator-Armour) |
| Master of Possession | 60 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-space-marines/Master-Of-Possession) |
| Sorcerer | 60 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-space-marines/Sorcerer) |
| Legionaries | 90 (5) / 170 (10) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-space-marines/Legionaries) |
| Havocs ×5 | 125 / 135 (3rd+) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-space-marines/Havocs) |
| Possessed | 120 (5) / 250 (10) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-space-marines/Possessed) |
| Chaos Terminator Squad | 175 (5) / 350 (10) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-space-marines/Chaos-Terminator-Squad) |
| Chosen | 135 (5) / 270 (10) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-space-marines/Chosen) |
| Warp Talons | 125 (5) / 280 (10) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-space-marines/Warp-Talons) |
| Raptors | 110 (5) / 210 (10) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-space-marines/Raptors) |
| Cultist Mob | 50 (10) / 90 (20) | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-space-marines/Cultist-Mob) |
| War Dog Karnivore | 155 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-knights/War-Dog-Karnivore) |
| Fade to Darkness (enh.) | 30 | [link](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/#Shadow-Legion) |
| Leaping Shadows (enh.) | 25 | " |
| Malice Made Manifest (enh.) | 25 | " |
| Mantle of Gloom (enh.) | 20 | " |

## Appendix C — Glossary

| Term | Meaning |
|---|---|
| **Advance** | Instead of a Normal move, move + D6". Normally can't shoot or charge that turn. |
| **AP** | Armour Penetration. Subtracts from the target's armour save. Doesn't affect invulns. |
| **Battle-shock** | A morale test (2D6 vs unit's Leadership). Fail = OC becomes 0 and can't use stratagems. |
| **Battleline** | A keyword marking basic infantry. Matters for Shadow of Chaos (returns models instead of healing wounds). |
| **Character** | A hero model. Can be given enhancements (unless Epic Hero) and can be Warlord. |
| **CP (Command Point)** | Currency for stratagems. Gain 1 in every Command phase (yours and opponent's). |
| **Dark Pacts** | CSM army rule (granted to your marines + Be'lakor via Disciples). Take a Ld test before shooting/fighting; weapons gain Lethal Hits or Sustained Hits 1; on fail also take D3 MW. |
| **Deep Strike** | May start in Reserves and set up anywhere >8" from enemies from R2. |
| **Devastating Wounds** | Weapon rule: a Critical Wound (unmodified 6) bypasses all saves entirely. |
| **DP (Detachment Points)** | Budget for detachments (3 at 2,000 pts). Shadow Legion costs 2. |
| **Engagement Range (ER)** | Within 1" of an enemy. Units in ER can't shoot (mostly) and are locked in melee. |
| **Epic Hero** | Named character. Max one of each; can never take enhancements. Shadow Legion bans all except Be'lakor. |
| **FNP (Feel No Pain)** | Roll after a wound is allocated; on X+ ignore it. |
| **Force Disposition** | 11th-ed: each detachment has one (Take and Hold / Purge the Foe / Recon / Priority Assets / Disruption). Determines primary mission and Attacker/Defender. |
| **Hidden** | Inf/Beast/Swarm in dense terrain that didn't shoot: only visible within 15". |
| **Infiltrators** | May set up anywhere >9" from the enemy DZ during deployment. |
| **Invulnerable save (X++)** | A save that AP can never modify. |
| **Lance** | Weapon rule: +1 to wound if the bearer charged this turn. |
| **Leader** | A Character ability that lets it join a Bodyguard unit. They move and fight as one. |
| **Lethal Hits** | Weapon rule: a Critical Hit (unmodified 6) automatically wounds. |
| **MW (mortal wound)** | Damage that skips the hit/wound/save sequence entirely. |
| **OC (Objective Control)** | A stat on every datasheet. Add up within 3" of an objective; higher total controls it. |
| **Rapid Ingress** | Core stratagem (1 CP): at end of opponent's Movement phase, set up one Reserves unit as if it were your Reinforcements step. |
| **Scouts X"** | Before turn 1, this unit makes a free X" move. |
| **Snap Shooting** | 11th-ed umbrella for out-of-turn reactive shooting (includes Overwatch). |
| **Stealth** | −1 to be hit by ranged attacks. |
| **Sticky objective** | Once you control it, it stays yours even after you leave, until the enemy controls it. |
| **Strategic Reserves** | Units held off-board. Arrive via Ingress from R2 within 6" of a board edge, >8" from enemies. |
| **Sustained Hits X** | Weapon rule: a Critical Hit scores X extra hits. |
| **Warlord** | Your army's designated leader. Some rules key off it. Be'lakor's Supreme Commander forces him to be it if present. |

## Appendix D — What Changed vs the Repo's Prior Notes

- **Skulltaker and Karanak are ILLEGAL in Shadow Legion.** Both have the EPIC HERO keyword; *Thralls of the First Prince* bans all Epic Heroes except Be'lakor. `lists.md` List 2 was illegal and has been rebuilt as List D above. ([Verified](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Skulltaker))
- **Bloodthirster is 320 pts** (335 for 3rd+), not "~165" as `research.md` had it. Single unified datasheet in 11th; Great Axe is the consensus loadout. It *can* take Fade to Darkness (SHADOW LEGION character, not Epic Hero, no Monster exclusion in core enhancement rules). ([Verified](https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/Bloodthirster))
- **Dark Apostle** is on the Thralls allowed-units list (research.md missed it).
- **Be'lakor's Supreme Commander** means he *must* be Warlord if present — a Chaos Lord can only be Warlord in a no-Be'lakor list.
- **Multiple points corrections** vs the 2026-07-26 scrape: Pink Horrors 150 (not 85), Bloodletters 110 (not 105), Flesh Hounds 75 (not 80), Cultists 50 (not 65), Havocs 125 (not 165), Bloodcrushers 95/190 (not 135), Flamers 65 (not 60), Screamers 80 (not 70), Terminators 175 (not 145), Chosen 135 (not 90), Warp Talons ×5 125 (not 130 for 6), Legionaries 90/170 (not 90/180). See Appendix B for the full verified table.
- **Competitive shape has shifted**: 11th-ed tournament lists universally pair Shadow Legion with **Cavalcade of Chaos** (1 DP) and lean on Skullmaster + Bloodcrushers + Fadethirster rather than the Chaos-Lord-yo-yo of 10th-ed theorycraft. Be'lakor appears in ~half of top lists, not all.
