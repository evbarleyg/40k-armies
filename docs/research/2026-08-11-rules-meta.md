# Shadow Legion (Chaos Daemons) - meta / rules / points re-check, 2026-07-27 -> 2026-08-11

Prepared 2026-08-11. Read-only web research.

## 0. Method and hard limits on this run (read this first)

- The session-wide WebSearch budget ran out part-way through this task (200/200 calls, shared with the other agents in the session), and WebFetch is egress-blocked for essentially every hobby domain (warhammer-community.com incl. the `mfm.` and `assets.` subdomains, wahapedia.ru, tabletopbattles.com, spikeybits.com, belloflostsouls.net, frontlinegaming.org, listhammer.info, stat-check.com, 40kstats.goonhammer.com, hutber.com, mfmdiff.com, 1d6chan, youtube.com, reddit, wikipedia, archive.org). Only github.com / `git clone` worked.
- What this report is built from: (a) ~30 WebSearch results (search-engine summaries of the cited pages, not full-page reads) captured before the cap; (b) a local clone of the community BattleScribe/NewRecruit data repo `BSData/wh40k-11e` (HEAD `c714a01a5c7a7275495c4d3c32688a4292d4efd8`, 2026-08-10), which transcribes the Munitorum Field Manual (MFM) and faction packs and has full git history across the window; (c) one search-engine read of the official online MFM page for Chaos Daemons.
- Consequence: sections 1-3 are reasonably solid; section 4 is partial; sections 5-6 are NOT researched (stated plainly below). Every claim carries the URL it came from; where a claim is an inference it is labelled as such.

---

## 1. GW updates after MFM v1.1 (2026-07-22): dataslate / FAQ / MFM

**Bottom line: no new balance dataslate or FAQ/errata document was found dated after 2026-07-22. One points-file revision ("MFM v1.2", 2026-08-05) is reported by a third-party tracker, but no Chaos Daemons / CSM / Chaos Knights points moved in it as far as can be verified. The next rules update is due "around a month" after 22 July, i.e. roughly the week of 2026-08-19 to 08-26, and had not appeared as of 2026-08-11.**

Evidence:

- GW's own framing of the 22 July update: the Studio "across the first three months of the edition will be looking to step in monthly", and "another rules update will come in around a month's time before the first regular quarterly balance dataslate will drop in the autumn." Source: Warhammer Community, "Warhammer 40,000 July Update - what you need to know!" https://www.warhammer-community.com/en-gb/articles/rgqanids/warhammer-40000-july-update-what-you-need-to-know/ (as summarised by search; page itself not fetchable from this session). Same cadence restated by Spikey Bits' dataslate tracker: "the next balance dataslate will land monthly in August and September, and then resume quarterly updates for the rest of 11th Edition ... quarterly updates are expected to resume in December 2026 after the Warhammer World Championships." https://spikeybits.com/10th-edition-balance-dataslate-warhammer-40k-rules-updates-changes-guide/
- Spikey Bits' MFM tracker (indexed early August) still lists the 22 July 2026 document as the latest MFM: https://spikeybits.com/munitorum-field-manual-points-update-10th-edition-40k-changes-guide/
- Tabletop Battles' first August "Competitive Innovations in 11th" column ("Rolling Need pt.1", published ~2026-08-05) describes the 1-2 August weekend as "the first weekend of games following the July 2026 balance update" - i.e. no newer update was in force. https://www.tabletopbattles.com/40k-competitive-innovations-in-11th-rolling-need-pt-1
- No Tabletop Battles, Spikey Bits, BoLS or Frontline Gaming article about an "August 2026" 40k balance/FAQ update surfaced in any search (searched: "August 2026 balance update 40k", "Munitorum Field Manual v1.2", "40k FAQ errata August 2026", TTB tag pages for balance-dataslate / FAQ / munitorum-field-manual: https://www.tabletopbattles.com/tag/balance-dataslate/ , https://www.tabletopbattles.com/tag/faq/ , https://www.tabletopbattles.com/tag/munitorum-field-manual/).

**Possible CHANGE since Jul 27 - "MFM v1.2" (2026-08-05), low impact for you:**

- The third-party diff site mfmdiff lists 11th-ed MFM versions as v1.0 (2026-06-17), v1.1 (2026-07-22) and **v1.2 (2026-08-05)**, with Chaos Daemons at "53 units and 9 detachments". https://mfmdiff.com/ (Chaos Daemons compare page: https://mfmdiff.com/compare/chaos-daemons/ - not readable from this session, so the v1.2 change list could not be pulled.)
- Cross-check against BSData/wh40k-11e git history: the only commits touching `Chaos - Chaos Daemons Library.json` after 22 July are `a1dbd5f` (2026-07-27, Blood Legion rules-text refresh) and `59f4512` (2026-08-05, typo fix "Slaugterthirst" -> "Slaughterthirst"); `Chaos - Chaos Space Marines.json` only has `b6d1795` (2026-08-06, an invulnerable-save data bug fix); `Chaos - Chaos Knights Library.json` is untouched since `bec2746` "MFM Changes" (2026-07-22). No points values changed in any of the three files after the v1.1 transcription (verified by diffing every `pts` cost/modifier between `bec2746^` and HEAD - the only deltas are the known v1.1 ones: Beasts of Nurgle 70->75, Bloodcrushers 6-model 180->190 and 3rd+-unit surcharge 10->20, Lord of Change 300->320, Kairos 295->305, Fluxmaster 80->70, Shalaxi 340->315, plus CSM/CK v1.1 changes). Repo: https://github.com/BSData/wh40k-11e
- The official online MFM page for Chaos Daemons (as read by the search engine, date of crawl unknown but consistent with the above) shows Be'lakor 390; Bloodthirster 320 (1st-2nd unit) / 335 (3rd+); Bloodcrushers 95/190 (1st-2nd) and 115/210 (3rd+). https://mfm.warhammer-community.com/en/chaos-daemons
- Inference (not confirmed): v1.2 most likely added points for newly released kits rather than rebalancing - GW's Exodites rules article said Exodite points "will be added to the Warhammer 40,000 App and the Warhammer Community downloads page in the coming weeks" (https://www.warhammer-community.com/en-gb/articles/bauwdcyl/exodites-in-warhammer-40000-see-the-full-rules/), and BSData added "Exodites datasheets" on 2026-08-10 (commit `1dccb73`). Action: open the app / https://mfm.warhammer-community.com/en/chaos-daemons once and confirm the version banner; if it says 1.2, your Daemons/CSM/CK numbers should still match the table in section 3.

Earlier in-window context you already have (for completeness): the 22 July package = core-rules clarifications, points for every faction, Force Disposition changes (several Purge the Foe detachments got higher DP or moved disposition; all Purge the Foe maps now have six objectives), mission tweaks, and "characters that revive come back as a unit of one". Sources: WarCom July update article above; TTB overview https://www.tabletopbattles.com/the-july-2026-balance-update-overview-rules-and-missions ; BoLS https://www.belloflostsouls.net/2026/07/warhammer-40k-july-rules-update-purge-the-foe-gets-an-update.html ; FLG https://frontlinegaming.org/2026/07/22/40k-july-update-exodite-rules-and-new-heresy-cover/ . The pre-window Tacoma Open event FAQ (CP-gain cap of 1/round outside core CP; revived characters return as their own unit) was folded into that July update: https://spikeybits.com/warhammer-40k-11th-edition-rules-faq/ , https://frontlinegaming.org/2026/07/10/warhammer-open-tacoma-faq-clarifies-new-40k-rules/ , GW PDF https://assets.warhammer-community.com/articles/0-2026/july/wc06-07/faq-warhammer-open-tacoma-dtb3ingprd-cvcl2agtfd.pdf

---

## 2. "Denizens of the Warp" (3" deep strike) errata status; Shadow Legion wording

**No change found since Jul 27 - still un-errata'd as far as any indexed source shows; still flagged by the community as a likely target for the late-August update.**

- Tabletop Battles' faction pack review remains the reference statement: "Unlike every other faction, the Denizens of the Warp Stratagem hasn't been errata'd, so it's still a 3" set-up and you can charge when using it ... assumed to be errata'd soon." https://www.tabletopbattles.com/40k-11th-edition-faction-pack-review-chaos-daemons
- Tabletop Battles' write-up of the July update's Daemons section lists: Lords of the Warp disposition Purge the Foe -> Take and Hold; all 1 DP Daemons detachments lost Purge the Foe; Beasts of Nurgle +5 (1 model); Bloodcrushers +10 (6 models, first two units); Shadow of Chaos / Daemonic Manifestation clarified (returned Battleline models can't be Characters); Realm of Chaos (Daemonic Incursion) reworded to the ingress template. Denizens of the Warp is not among the listed changes. https://www.tabletopbattles.com/40k-the-july-2026-balance-updates-chaos
- Wahapedia 11e Chaos Daemons page is indexed with Denizens of the Warp as a 1CP, "more than 3" horizontally" deep-strike stratagem (search-summary read only; could not open the page to quote it). https://wahapedia.ru/wh40k11ed/factions/chaos-daemons/
- Searched for and did not find: any GW FAQ/errata PDF for Chaos Daemons dated after 22 July; any TTB/Spikey Bits/BoLS note of a Denizens change.
- Shadow Legion wording: BSData's Daemons files show no Shadow Legion text or structure changes in the window (only the Blood Legion text refresh and a typo fix, commits above). Detachment still encoded as 2 DP / Purge the Foe; enhancements Leaping Shadows 25 (Scouts 9"), Mantle of Gloom 20 (-1 OC aura in engagement), Fade to Darkness 30 (end of Fight phase, if it killed a unit and is not in engagement, back into Strategic Reserves), Malice Made Manifest 25 (start of Fight phase D3/3 MW). Thralls list in the Daemons catalogue still imports only the infantry/character CSM sheets (Chaos Lord x3 variants, Sorcerer x2, Master of Possession, Dark Apostle, Dark Commune, Legionaries, Chosen, Possessed, Chaos Terminator Squad, Havocs, Raptors, Warp Talons, Cultist Mob, Accursed Cultists, Cultist Firebrand, Fellgor, Traitor Guard/Enforcer + Legends) - no Daemon Prince, no vehicles. File: `Chaos - Chaos Daemons.json` / `Chaos - Chaos Daemons Library.json` in https://github.com/BSData/wh40k-11e (HEAD c714a01). Wahapedia's Shadow Legion page could not be re-read this run.

**Relevant CHANGE in how the disposition plays (already in force from 22 July, but the on-table effect only became visible in this window):** TTB's first post-update results column reports that "the Purge the Foe disposition essentially disappeared as a viable option after the balance update ... zero winning lists running either Purge the Foe or Disruption that weekend", i.e. the field went "from four viable Dispositions to three" (Aug 1-2 events). Shadow Legion is a Purge the Foe detachment, so this is the single most important meta signal for you this fortnight. https://www.tabletopbattles.com/40k-competitive-innovations-in-11th-rolling-need-pt-1

---

## 3. Points re-verification (Shadow Legion shopping list)

Source for every row unless noted: BSData/wh40k-11e, HEAD `c714a01a5c7a7275495c4d3c32688a4292d4efd8` (2026-08-10); files `Chaos - Chaos Daemons Library.json` (last changed `59f4512`, 2026-08-05, typo only), `Chaos - Chaos Space Marines.json` (last changed `b6d1795`, 2026-08-06, non-points), `Chaos - Chaos Knights Library.json` (last changed `bec2746`, 2026-07-22 "MFM Changes"). Repo URL: https://github.com/BSData/wh40k-11e . This is a community transcription of MFM v1.1; rows marked "MFM-confirmed" were also read off the official online MFM page https://mfm.warhammer-community.com/en/chaos-daemons via search. 11th-ed MFM charges a surcharge for the 3rd+ copy of many datasheets; that column is included because it matters for triple-Crusher builds.

| Unit | Size(s) | Points now | 3rd+ copy | Jul 27 value | Status |
|---|---|---|---|---|---|
| Be'lakor | 1 | 390 | - | 390 | no change (MFM-confirmed) |
| Bloodthirster | 1 | 320 | 335 | 320 | no change (MFM-confirmed) |
| Lord of Change | 1 | 320 | 340 | 320 | no change |
| Skullmaster | 1 | **85** | - | ~75 | **DIFFERS from your note** - BSData has 85 both before and after the 22 Jul commit, so this is not an August change; most likely the "~75" note was off. Re-check in the app. |
| Rendmaster on Blood Throne | 1 | 150 | 170 | ~150 | no change |
| Bloodmaster | 1 | 65 | - | n/a | - |
| Bloodcrushers | 3 / 6 | 95 / 190 | 115 / 210 | 95 / 190 | no change (MFM-confirmed incl. 3rd+ tier) |
| Bloodletters | 10 | 110 | - | 110 | no change |
| Flesh Hounds | 5 / 10 | 75 / 150 | - | n/a | - |
| Pink Horrors | 10 | 150 | - | 150 | no change |
| Blue Horrors | 10 | 125 | - | n/a | - |
| Nurglings | 3 / 6 | 45 / 90 | - | n/a | - |
| Beasts of Nurgle | 1 / 2+ | 75 / 140 | - | n/a | 1-model went 70->75 in v1.1 (22 Jul). BSData encodes only two price bands (1, and 2-or-more); confirm the 3-model price in the app. |
| Plague Drones | 3 / 6 | 110 / 220 | - | n/a | - |
| Flamers | 3 / 6 | 65 / 130 | - | n/a | (MFM search read also showed 65/130) |
| Screamers | 3 / 6 | 80 / 160 | - | n/a | - |
| Exalted Flamer | 1 | 65 | - | n/a | - |
| Fateskimmer | 1 | 95 | - | n/a | - |
| Chaos Lord | 1 | 90 | - | n/a | (Jump Pack Lord 80, Terminator Lord 85) |
| Master of Possession | 1 | 60 | - | n/a | - |
| Dark Apostle | 1 | 65 | - | n/a | - |
| Legionaries | 5 / 10 | 90 / 170 | - | n/a | - |
| Havocs | 5 | 125 | 135 | n/a | - |
| Possessed | 5 / 10 | 120 / 250 | +10 | n/a | - |
| Chaos Terminator Squad | 5 / 10 | 175 / 350 | - | n/a | went 180/360 -> 175/350 in v1.1 |
| Chosen | 5 / 10 | 135 / 270 | +10 | n/a | went 125/250 -> 135/270 in v1.1 |
| Cultist Mob | 10 / 20 | 50 / 90 | - | n/a | - |
| Warp Talons | 5 / 10 | 125 / 280 | +10 | n/a | 10-model figure looks odd (possible transcription error); verify before relying on it |
| War Dog Karnivore | 1 | 155 | - | n/a | (Brigand 140, Stalker 135, Huntsman 135, Executioner 130) |
| Enh: Fade to Darkness | - | 30 | - | 30 | no change |
| Enh: Leaping Shadows | - | 25 | - | 25 | no change |
| Enh: Malice Made Manifest | - | 25 | - | 25 | no change |
| Enh: Mantle of Gloom | - | 20 | - | 20 | no change |

Other Daemons values in the same file, for reference: Skarbrand 315, Skulltaker 85, Karanak 70, Skull Cannon 90, Kairos 305, Changeling 105, Fluxmaster 70, Blue Scribes 75, Changecaster 60, Burning Chariot 115, GUO 265 (+15), Rotigus 280, Poxbringer 55, Plaguebearers 115, KoS 255 (+15), Shalaxi 315, Daemonettes 90, Fiends 90/180, Seekers 80/155, Soul Grinder 180 (+15), Daemon Prince 165 / winged 190. Detachments: Daemonic Incursion 3 DP (Disruption); Legion of Excess 2 DP (Priority Assets); Scintillating Legion 2 DP (Priority Assets); Blood Legion 2 DP (Purge the Foe); Plague Legion 2 DP (Take and Hold); Shadow Legion 2 DP (Purge the Foe); Cavalcade of Chaos 1 DP (Disruption); Lords of the Warp 1 DP (Take and Hold); Warptide 1 DP (Reconnaissance).

**CHANGED since Jul 27: nothing in this table.** The only discrepancy (Skullmaster 85 vs "~75") pre-dates the window.

---

## 4. Tournament evidence, Jul 27 - Aug 11 (partial - see section 0)

What was captured before the search cap:

- **Faction level.** Spikey Bits' rolling tier list, citing Meta Monday data "from August 6th, 2026" (~6,000 games / 29 events of 11th so far): Chaos Daemons **54% win rate, S-tier, "leading the charge"** ahead of Dark Angels, Adeptus Custodes and Emperor's Children. https://spikeybits.com/best-worst-meta-armies/ (Underlying weekly Meta Monday posts and Stat Check / 40kstats dashboards could not be opened: https://www.stat-check.com/the-meta , https://40kstats.goonhammer.com/ .)
- **Detachment level (TTB, July update review, still the latest TTB statement found):** "Legion of Excess lists have been the most successful so far"; "Legion of Excess and Shadow Legion still look pretty good, despite the increase to Bloodcrushers"; Daemons as a whole took "a downward adjustment"; every 1 DP Daemons detachment lost Purge the Foe. https://www.tabletopbattles.com/40k-the-july-2026-balance-updates-chaos
- **Aug 1-2 weekend - TTB "Competitive Innovations in 11th: Rolling Need" pts 1-3** (pt.1 published ~Aug 5): events covered include the Lone Star Open, Allen TX (327 players, 6 rounds, five undefeated) plus GTs at Krefeld DE (132), Bad Liebenzell DE (50) and an English GT (78). Headline findings: zero event-winning lists on Purge the Foe or Disruption; "Darkflight Speeders" (Recon-scoring speeder spam) called "the current meta bogeyman". The Chaos Daemons list showcased is **not Shadow Legion** but a Khorne cavalry build: **Blood Legion + Cavalcade of Chaos, Be'lakor as Warlord, 18 Bloodcrushers (3x6) each led by a Skullmaster (one with the Blood Legion enhancement Brazenmaw), a Rendmaster on Blood Throne with Slaughterthirst, plus Flesh Hounds and Bloodletters** (player name / placing / exact counts of the small stuff not recoverable from the search summary). https://www.tabletopbattles.com/40k-competitive-innovations-in-11th-rolling-need-pt-1 , https://www.tabletopbattles.com/40k-competitive-innovations-in-11th-rolling-need-pt-2 , https://www.tabletopbattles.com/40k-competitive-innovations-in-11th-rolling-need-pt-3
- **Jul 25-26 weekend** is TTB's "Lean, Green and Mean" pts 1-3 (https://www.tabletopbattles.com/40k-competitive-innovations-in-11th-lean-green-and-mean-pt-2 , -pt-3); Daemons content in it was not extracted before the cap.
- **Aug 8-9 weekend:** TTB's column for it had not been indexed as of this run (normally lands Tue-Thu).
- **Listhammer** (https://listhammer.info/factions/chaos-daemons , https://listhammer.info/?faction=Chaos+Daemons) is client-rendered; nothing is in the search index and the site is egress-blocked, so no 4-1+/5-0 Daemons lists could be pulled. NOT researched.

Read-across for your build (my synthesis of the above, not a sourced claim): the Be'lakor + massed Bloodcrushers + Skullmaster/Rendmaster core is what is showing up at the top for Daemons right now, but wrapped in Blood Legion/Cavalcade rather than Shadow Legion, and the community's first post-update data point says Purge the Foe detachments stopped winning events. No Fadethirster / Shadow Legion result was captured either way in this window.

---

## 5. New Shadow Legion strategy content since late July

**NOT researched - search budget exhausted before this section; YouTube, Art of War and Vanguard Tactics domains are also egress-blocked.** The only relevant items that surfaced incidentally: TTB's evergreen "Detachment Focus: Shadow Legion" page https://www.tabletopbattles.com/detachment-focus-shadow-legion/ and TheChirurgeon's older "Testing the Shadow Legion" diary https://www.tabletopbattles.com/thechirurgeons-road-through-2025-part-12-testing-the-shadow-legion (both pre-window; no evidence either was updated after Jul 27). No new statement moving the Bloodthirster-vs-scouting-Bloodcrushers consensus was found; treat the Jul 27 view (TheChirurgeon prefers Leaping Shadows on Crushers over the Fadethirster) as still current but unrefreshed.

## 6. Product news and US prices

**NOT researched - search budget exhausted; warhammer.com and US retailer sites are egress-blocked from this session, so no prices could be verified.** Incidental, non-Daemons items seen in passing within the window: GW's Exodites (Aeldari) rules reveal with points "in the coming weeks" https://www.warhammer-community.com/en-gb/articles/bauwdcyl/exodites-in-warhammer-40000-see-the-full-rules/ ; FLG's 23 July news roundup (AoS dragons, Combat Patrol support in the 40k app, Everchosen) https://frontlinegaming.org/2026/07/23/dragons-combat-patrol-app-and-the-everchosen-warhammers-wildest-hobby-week/ ; Spikey Bits Q&A piece mentioning codex prices dropping in 11th https://spikeybits.com/11th-edition-40k-qa-reveals-big-changes-for-2026/ . No Chaos Daemons / Be'lakor / Word Bearers / Chaos Knights kit, Combat Patrol or battleforce announcement appeared in any result I saw, but that is absence-in-a-partial-sample, not a finding.

---

## 7. What to re-run when search/egress is available

1. Open https://mfm.warhammer-community.com/en/chaos-daemons (version banner) and https://mfmdiff.com/compare/chaos-daemons/ to pin down what v1.2 (2026-08-05) touched.
2. https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/ around 19-26 Aug for the promised second monthly update (Denizens of the Warp is the obvious Daemons errata candidate; Purge the Foe map/DP treatment is the thing to watch for Shadow Legion).
3. Listhammer Chaos Daemons filtered to Shadow Legion / Cavalcade, and TTB's Aug 8-9 and Aug 15-16 columns, for any Be'lakor + Fadethirster placings.
4. Sections 5 and 6 in full (Art of War / Vanguard Tactics / YouTube titles; warhammer.com US prices for Bloodthirster, Bloodcrushers, Flesh Hounds, Chaos Lord, Cultists, Skull Cannon/Blood Throne, Bloodmaster, Nurglings, War Dogs).
