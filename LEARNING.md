# Telegram Wrapped — learning checklist

Track what you understand as we build. Check items only when you can explain them in your own words.

## 1. The problem

- [ ] Why a “Wrapped” for Telegram is interesting (timing/rhythm metadata vs reading content)
- [ ] Why we stay **content-blind** (privacy + playful tone without judging meaning)
- [ ] What a Telegram Desktop JSON export actually contains (`messages`, `from_id`, `media_type`, `edited`, etc.)
- [ ] Why mobile vs Desktop export formats differ (we target Desktop JSON)

## 2. The solution — how it works

- [ ] **Client-only parsing**: file never leaves the browser — why that matters
- [ ] How we pick “you” vs “them” (participant picker + message counts)
- [ ] **Reply time**: measured from the *last* message in a streak to the first reply from the other person
- [ ] **Left on read** vs **the comeback**: reply-gap after a streak vs any silent gap in the timeline
- [ ] **Late-night %**: local hours 00:00–03:59
- [ ] **Daily streak**: consecutive calendar days with ≥1 message
- [ ] **Double-text streak**: consecutive messages from the same person with no intervening reply
- [ ] **One-sided day**: max `|your count − their count|` on a single date
- [ ] Story UI: auto-advance + Instagram-style progress dots + tap zones

## 3. Design decisions

- [ ] Why Spotify Wrapped *structure* (one big idea per card) without copying Spotify’s green
- [ ] Why flat bold per-card colors beat soft rainbow gradients for “real Wrapped” energy
- [ ] Why each slide gets its **own background pattern** (dots / stripes / rays / waves…) — variety without clutter
- [ ] Why some cards are **chart-forward** (donut, hour bars, gauge, waveform) instead of only a mega number
- [ ] Why a paper-plane mascot recurs on every card (brand motif / reaction)
- [ ] Why copy is cheeky but not judgmental
- [ ] Why **flavor copy** branches on thresholds (e.g. 3× message lead → “Wow, you had a lot to say”) instead of one fixed caption per card
- [ ] Why we say **“You”** after the participant picker instead of the Telegram display name
- [ ] Why top word/phrase is an intentional (client-only) exception to content-blindness
- [ ] Why `flipPerspective` exists — so you can download *their* summary card to send them
- [ ] Why Telegram JSON exports have **edit** times but **not read receipts** — so “polish vs reply” uses send→edit delay, not true read time

## 4. Broader impact

- [ ] What changes if we supported group chats (>2 people) more deeply
- [ ] What timezone assumptions we make (browser local time)
- [ ] What “edited” and voice duration depend on in the export
- [ ] How the shareable summary PNG is generated (`html-to-image`)
- [ ] How hour/dow histograms unlock chart cards without uploading more data

## Quiz bank (answer before peeking at code)

1. If you send 3 messages and they reply once, whose reply time gets a sample — yours or theirs?
2. Is the longest “left on read” the same number as “the comeback”? When would they differ?
3. Why might late-night % disagree with how “night owl” you *feel*?
4. What’s one reason we ask “who are you?” instead of guessing from the export filename?
5. Why does `hourHistogram` sum to `totalMessages`? What would break a chart if it didn’t?
6. Name two story background patterns and which card type they suit (e.g. waves → voice).
7. On the reply-speed card, why is a *shorter* average reply time drawn as a *longer* speed bar?
8. If you sent 900 messages and they sent 100, which volume caption should fire — and why not the “neck and neck” line?

---

**Session goal:** you can restate the problem, walk the reply-time algorithm, explain one design choice (charts vs mega-number), and say why varied patterns matter — without looking at the checklist labels.
