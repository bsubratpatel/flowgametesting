# FLOW. — UI/UX & Branding Design Spec
> Final feature design document. After this — only levels and marketing.

---

## 1. Brand Identity

### Name
```
FLOW.
```
The dot is intentional. It's punctuation. It's the game. It's the brand.
Never write it as "Flow" or "flow" in UI. Always `FLOW.`

### Tagline
```
One grid. Clear mind.
```

### Brand Personality
- Calm but sharp
- Minimal but warm
- Confident — never hype, never exclamation marks
- Speaks like a person, not a product

### Voice Rules
| Do | Don't |
|---|---|
| "Level 17 cleared." | "AMAZING! You crushed it!! 🎉🎉" |
| "You barely made it." | "Better luck next time! 😊" |
| "Come back tomorrow." | "Your dots miss you!" |
| "7 days. Respect." | "7 Day Streak Unlocked!!!" |

---

## 2. Visual Identity

### Color Palette

#### Base (UI Shell)
```
Background       #0E0E0E   — near black, not pure black
Surface          #1A1A1A   — cards, panels
Border           #272727   — dividers, grid cells
Dim Text         #444444   — labels, inactive
Body Text        #CCCCCC   — secondary text
Primary Text     #FFFFFF   — headings, values
```

#### Dot Colors (Game)
```
Yellow           #F5C842
Blue             #4AB3F4
Green            #3EC97A
Red/Pink         #F0627A
Purple           #A76CF5
Cyan             #3ECFCF
Orange           #F5874A
White            #E8E8E8   — Level 20 boss color
```

#### Accent (UI Highlights)
```
Active / CTA     #F5C842   — yellow dot color pulled into UI
Streak Fire      #F5874A   — orange
Perfect          #3EC97A   — green
Danger (moves)   #F0627A   — red, used at ≤3 moves left
```

### Typography

#### Fonts (Google Fonts — free)
```
Display / Logo   Space Grotesk — Bold 700
UI Labels        Space Grotesk — Medium 500
Body / Captions  Inter — Regular 400
Monospace        JetBrains Mono — for scores, numbers, codes
```

#### Type Scale
```
Logo             32px  Space Grotesk Bold    Letter-spacing: 0.08em
Screen Title     20px  Space Grotesk Bold
Section Label    10px  Space Grotesk Medium  Letter-spacing: 0.18em  Uppercase
Stat Value       22px  JetBrains Mono
Body             14px  Inter Regular
Caption / Hint   11px  Inter Regular         Color: #444
```

### Logo Treatment
```
FLOW.
```
- Space Grotesk Bold
- All caps
- The `.` is same color as the current level's dot color — changes dynamically
- On share cards — white on black always

### Iconography
- No icon libraries
- Use Unicode where needed: ❤ ⚡ 🔥 ✓
- Keep icons minimal — prefer text labels over ambiguous icons

---

## 3. Layout & Navigation

### Screen Architecture
```
┌─────────────────────────────┐
│  Home Screen                │
│  ├── Play (resume level)    │
│  ├── Daily Challenge        │
│  ├── Stats & Heatmap        │
│  └── Support / Coffee       │
└─────────────────────────────┘
         ↓
┌─────────────────────────────┐
│  Game Screen                │
│  ├── Header (HUD)           │
│  ├── Grid                   │
│  └── Win / Lose Sheet       │
└─────────────────────────────┘
```

No tabs. No hamburger menu. Navigation lives in context — back arrow on game screen, tap logo to go home.

---

## 4. Screen-by-Screen Design

---

### 4.1 Home Screen

```
┌──────────────────────────────┐
│                              │
│  FLOW.           [☕]        │  ← Coffee button top right, subtle
│                              │
│  ░░░▓▓░▓▓▓▓░░▓▓▓▓▓           │  ← Heatmap preview (last 4 weeks)
│  ▓▓▓░░░▓▓▓░░░▓▓▓▓▓           │
│                              │
│  🔥 7 days                   │  ← Current streak below heatmap
│                              │
│  ─────────────────────────   │
│                              │
│  LEVEL 17                    │  ← Current level, large
│  Best: 4,250 pts             │  ← Personal best if replaying
│                              │
│  ┌──────────────────────┐    │
│  │       CONTINUE       │    │  ← Primary CTA, yellow fill
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │   DAILY CHALLENGE  ✦ │    │  ← Secondary CTA, border only
│  └──────────────────────┘    │
│                              │
│  YOUR STATS        →         │  ← Tertiary, text link
│                              │
└──────────────────────────────┘
```

**Notes:**
- Heatmap is the first thing player sees — reinforces streak identity
- No level select screen — linear progression, one CTA
- Coffee button is `☕` icon only, no text, top right corner — always visible, never intrusive

---

### 4.2 Game Screen (HUD)

```
┌──────────────────────────────┐
│  ←    FLOW.      LV 17/20    │
│                              │
│  ❤❤❤           MOVES  12     │  ← Lives left | Moves remaining
│                              │
│  CLEAR 50           0/50     │  ← Progress bar below
│  ───────────────────────     │
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │     7×7 or 8×8 GRID    │  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  DRAG TO CONNECT             │  ← Hint text, shown only first 3 levels
│  LOOP TO CLEAR ALL           │
└──────────────────────────────┘
```

**HUD Behavior:**
- Moves counter: white → red at ≤3 moves
- Lives: hearts grey out on loss, no animation — quiet, not punishing
- Progress bar: white fill, 1.5px height, clean
- Back arrow: goes to home with one tap, no confirmation popup

---

### 4.3 Win Screen (Bottom Sheet)

Slides up from bottom. Does not replace the grid — grid stays visible behind.

```
┌──────────────────────────────┐
│  ▔▔▔▔▔▔  ← drag handle      │
│                              │
│  LEVEL 17 CLEARED  ✓         │
│                              │
│  ⚡ PERFECT                  │  ← Efficiency rating, colored
│                              │
│  ─────────────────────────   │
│  Dots cleared    +1,050      │
│  Loop bonus      +200        │
│  Moves bonus     +150        │
│  First try       +500        │
│  ─────────────────────────   │
│  LEVEL SCORE     1,900       │
│  TOTAL           12,450      │
│  ─────────────────────────   │
│                              │
│  ┌──────────────────────┐    │
│  │      NEXT LEVEL      │    │  ← Primary
│  └──────────────────────┘    │
│                              │
│  [↑ SHARE SCORE]  [↻ RETRY]  │  ← Secondary row
│                              │
└──────────────────────────────┘
```

**Notes:**
- Score breakdown in monospace font — feels precise
- Efficiency rating colored: green = PERFECT, white = CLEAN, dim = SOLID
- Share opens native share sheet on mobile, copies to clipboard on desktop

---

### 4.4 Lose Screen (Bottom Sheet)

```
┌──────────────────────────────┐
│  ▔▔▔▔▔▔                     │
│                              │
│  OUT OF MOVES                │
│  😅 BARELY                   │  ← Or nothing if they didn't clear any
│                              │
│  ❤❤░               -1 life  │  ← Show life lost
│                              │
│  ┌──────────────────────┐    │
│  │        RETRY         │    │
│  └──────────────────────┘    │
│                              │
│  [↑ SHARE ANYWAY]            │  ← Underrated retention + viral hook
│                              │
└──────────────────────────────┘
```

**No popup. No "are you sure?" confirmation. No guilt.**

---

### 4.5 Stats Screen

```
┌──────────────────────────────┐
│  ←  YOUR FLOW                │
│                              │
│  YOUR YEAR                   │
│                              │
│  J F M A M J J A S O N D    │
│  ░░░▓▓░▓▓▓▓░░▓▓▓▓▓▓▓░▓▓▓▓   │
│  ░░▓▓▓░░░▓▓▓▓▓░░░▓▓░░▓▓▓▓   │
│  ▓▓▓░░░▓▓▓░░░▓▓▓▓░░▓▓▓▓░░   │
│  (12 rows × 53 columns)      │
│                              │
│  🔥 Current    7 days        │
│  📅 Longest   14 days        │
│  🎯 Days played  43          │
│                              │
│  ─────────────────────────   │
│                              │
│  LEVELS                      │
│  Reached         17/20       │
│  Completed       16/20       │
│  Perfect clears    4         │
│                              │
│  DOTS                        │
│  Total connected  4,821      │
│  Best efficiency   94%       │
│                              │
│  ─────────────────────────   │
│                              │
│  BADGES                      │
│  🎯 First Blood  ✓           │
│  ⚡ Perfect      ✓           │
│  🔥 7-Day Streak ✓           │
│  🧊 30-Day      ░            │  ← Locked badge shown dimmed
│  🧠 Level 20    ░            │
│  💎 Flawless    ░            │
│  👑 The One     ░            │
│                              │
│  ┌──────────────────────┐    │
│  │   SHARE MY FLOW YEAR │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

---

### 4.6 Daily Challenge Screen

```
┌──────────────────────────────┐
│  ←  DAILY CHALLENGE          │
│                              │
│  APRIL 25                    │
│  Friday                      │
│                              │
│  8×8  ·  7 colors  ·  12 moves│
│                              │
│  Resets in  06:42:18         │  ← Live countdown
│                              │
│  ┌──────────────────────┐    │
│  │         PLAY         │    │
│  └──────────────────────┘    │
│                              │
│  YESTERDAY'S BEST            │
│  Score: 3,800  ·  ⚡ PERFECT │  ← Your own best from yesterday
│                              │
└──────────────────────────────┘
```

After completing daily challenge — show share card immediately before going anywhere else.

---

### 4.7 Flow Card (Share Image)

Generated on `<canvas>`. Size: **1080×1080px** (Instagram square).

```
┌──────────────────────────────────┐
│                                  │
│  FLOW.                           │  ← Top left, white
│                                  │
│                                  │
│        Level 17 cleared  ✓       │  ← Center
│                                  │
│          ⚡  PERFECT              │  ← Efficiency, colored
│                                  │
│  ─────────────────────────────   │
│   Score         4,250            │
│   Moves left    3 / 12           │
│   Time          1m 42s           │
│  ─────────────────────────────   │
│                                  │
│  🔥 7-day streak                 │
│                                  │
│  [badge] [badge] [badge]         │  ← Earned badges shown
│                                  │
│                                  │
│        flowgametest.netlify.app  │  ← Bottom right, dim
│                                  │
└──────────────────────────────────┘
```

**Card Design Rules:**
- Black background always — even if player uses a future light theme
- Monospace for all numbers
- No screenshot watermarks, no gradients
- One colored accent element — the efficiency rating color

---

### 4.8 Challenge Screen (Incoming URL)

When a friend opens a challenge URL:

```
┌──────────────────────────────┐
│                              │
│  FLOW.                       │
│                              │
│  ⚡ CHALLENGE                 │
│                              │
│  Subrat cleared Level 17     │
│  Score: 4,250 · 3 moves left │
│                              │
│  Can you beat it?            │
│                              │
│  ┌──────────────────────┐    │
│  │   ACCEPT CHALLENGE   │    │
│  └──────────────────────┘    │
│                              │
│  or just browse from Level 1 │  ← Small text link, no pressure
│                              │
└──────────────────────────────┘
```

---

### 4.9 Support / Buy Me a Coffee

Accessed via `☕` icon on home screen.

```
┌──────────────────────────────┐
│  ←                           │
│                              │
│  FLOW. is free.              │
│  No ads. No subscriptions.   │
│  No tricks.                  │
│                              │
│  If it gave you a moment     │
│  of quiet, a coffee goes     │
│  a long way.                 │
│                              │
│  ┌──────────────────────┐    │
│  │  ☕  BUY ME A COFFEE │    │  ← Links to buymeacoffee.com
│  └──────────────────────┘    │
│                              │
│  Built solo. Thank you       │
│  for playing.                │
│                              │
└──────────────────────────────┘
```

**Notes:**
- No amounts listed. No guilt. No "every coffee helps us keep the lights on."
- One button. External link. Done.
- This page is the only place revenue is mentioned. Nowhere else in the game.

---

## 5. Motion & Interaction

### Grid
| Action | Animation |
|---|---|
| Level load | Grid slides up, 300ms ease-out |
| Dot connect | Scale 1.18, instant |
| Loop clear | Dots scale to 0 + fade, 200ms staggered |
| Level win | White flash 80ms → win sheet slides up |
| Moves ≤3 | Counter turns red, no bounce — quiet warning |

### Screens
| Transition | Animation |
|---|---|
| Home → Game | Fade, 200ms |
| Game → Win sheet | Slide up, 350ms spring |
| Game → Lose sheet | Slide up, 350ms spring |
| Game → Home (back) | Fade, 150ms |

### Rule
**No looping animations. No idle bouncing. Nothing moves unless the player causes it.**

---

## 6. Responsive Behavior

- **Mobile first** — designed for 375px width (iPhone SE)
- Grid scales to fill available space minus HUD
- On tablet/desktop — grid centered, max-width 480px, rest is black
- Touch targets minimum 44px

---

## 7. Revenue — Buy Me a Coffee

### Setup
1. Create account at `buymeacoffee.com/flowgame`
2. Set name: **FLOW.**
3. Bio: *"A quiet dot puzzle. No ads, no subscriptions. Just one grid."*
4. Profile image: single dot on black — keep brand consistent

### In-Game Placement
| Location | Treatment |
|---|---|
| Home screen | `☕` icon top right — always visible |
| Win screen (every 5 levels) | Small text below Next Level: *"Enjoying FLOW.? ☕"* |
| Stats screen | Below badges, quiet line |
| Coffee page | Dedicated screen via icon |

### What Not To Do
- No popup asking for donations
- No "if you enjoy this game please consider..."
- No blocking content behind donation
- No guilt. No pressure. Ever.

---

## 8. Build Checklist

### Phase 1 — Foundation
- [ ] localStorage save/load (level, score, lives, streakDays)
- [ ] Heart refill timer logic
- [ ] Daily challenge seed generator

### Phase 2 — Game Screens
- [ ] HUD with lives + moves + progress
- [ ] Moves counter turns red ≤3
- [ ] Win sheet with score breakdown
- [ ] Lose sheet with life indicator
- [ ] Efficiency rating calculation

### Phase 3 — Social Layer
- [ ] Flow Card canvas generator (1080×1080)
- [ ] Share via Web Share API (mobile) / clipboard (desktop)
- [ ] Challenge URL encoder + decoder
- [ ] Challenge incoming screen

### Phase 4 — Stats & Identity
- [ ] Streak day save on play
- [ ] Heatmap grid renderer (52 weeks)
- [ ] Stats screen (levels, dots, efficiency)
- [ ] Badge unlock logic
- [ ] Badge display on stats + share card

### Phase 5 — Polish
- [ ] Level transition animation
- [ ] Loop clear animation (stagger)
- [ ] White flash on win
- [ ] Grid slide-up on load
- [ ] Coffee page + buymeacoffee link

### Phase 6 — Levels
- [ ] Levels 11–20 grid data
- [ ] Test each level for correct difficulty curve
- [ ] Daily challenge generator verified for 365 days

---

## 9. Final Rule

> This is the complete feature set.
> From here — only new levels and marketing.
> Do not add features. Do not change the branding.
> Ship it. Then build levels. Then market it.
