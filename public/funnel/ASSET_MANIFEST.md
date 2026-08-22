# Asset manifest — funis AstroTarot 2.0

Direção visual (todos): cinematic photograph, premium editorial, intimate,
low-key, deep indigo-violet shadows + warm amber-gold highlights, shallow
DoF, subtle 35mm grain, restrained symbolism. **Nunca**: texto, logos,
watermark, UI falsa, estética de banco de imagens, "witch" clichê, mãos
deformadas. Rostos em sombra ou de costas.

Base de prompt: `Cinematic photograph, [ratio], moody low-key lighting, deep indigo-violet shadows with warm amber-gold highlights, shallow depth of field, subtle 35mm film grain, premium editorial photography. Scene: [SCENE]. Emotion: [EMOTION]. Photorealistic, intimate and understated. No text, no letters, no watermark, no logos.`

Pipeline usado: ChatGPT (sessão do operador no Chrome) → fetch do PNG na
página → canvas 960×1280 → webp q0.85 → `public/funnel/<funil>/<nome>.webp`
(≈25–55 KB cada). Slots ligam por id de pergunta em `src/lib/funnels/registry.ts`.

| filename | funnel | section | ratio | scene (prompt core) | alt | status |
|---|---|---|---|---|---|---|
| ex/hook-phone-2am.webp | cord-cutting (hook) | Hook | 3:4 | smartphone face-up on a nightstand at 2 AM, its screen the only light | A phone glowing on a nightstand at 2 AM | ✅ integrado |
| ex/w-doorway.webp | cord-cutting w_ending | Pain | 3:4 | woman from behind in an apartment doorway at dusk, one suitcase, keys in hand | A woman in a doorway with a suitcase at dusk | ✅ integrado |
| ex/w-awake.webp | cord-cutting w_symptom | Pain | 3:4 | woman lying awake, phone light on the lower half of her face | A woman awake at night, phone light on her face | ✅ integrado |
| ex/w-mirror.webp | cord-cutting w_status | Reveal | 3:4 | woman alone in a dim bathroom, reflection softly out of focus, pale ring line | A woman alone in front of a mirror | ✅ integrado |
| ex/m-bedside.webp | cord-cutting m_time | Pain | 3:4 | man on the edge of an unmade bed at night, phone glow on his jaw | A man on the edge of a bed at night, phone in hand | ✅ integrado |
| ex/m-bar.webp | cord-cutting m_symptom | Mechanism | 3:4 | two men at a dim bar counter from behind, amber pendant light | Two men talking at a dim bar | ✅ integrado |
| ex/cards-velvet.webp | cord-cutting (transition) | Mechanism | 3:4 | four Egyptian cards face down on violet velvet, candle, gold dust, hand hovering | Four Egyptian tarot cards face down on velvet | ✅ integrado |
| cord/two-candles-thread.webp | cord-cutting ritual | Mechanism | 3:4 | two lit candles on violet velvet connected by a single fine gold thread, shallow DoF | Two candles joined by a thread | ⏳ slot (Chrome indisponível na sessão) |
| cord/thread-release.webp | cord-cutting ritual | Reveal | 3:4 | the gold thread between two candles loosening and falling, elegant, no fire on the thread | The thread released | ⏳ slot |
| luck/hook-half-open-door.webp | luck (hook) | Hook | 3:4 | woman's hand on a half-open door, golden light through the gap into a dim violet hallway | A hand on a half-open door | ⏳ slot |
| luck/candle-intention.webp | luck q timing | Mechanism | 3:4 | gold candle, folded handwritten intention paper, two coins half in shadow, violet cloth | A candle and a folded intention | ⏳ slot |
| luck/moonlight-window.webp | luck q tried | Pain | 3:4 | woman at a window under moonlight, city lights blurred, waiting | A woman at a window under the moon | ⏳ slot |
| luck/wheel-card.webp | luck (transition) | Reveal | 3:4 | ornate golden wheel motif embossed on a dark card on velvet, gold dust (Wheel-of-Fortune-inspired, original) | A golden wheel card on velvet | ⏳ slot |
| past-life/hook-familiar.webp | past-life (hook) | Hook | 3:4 | two silhouettes passing in an old lamplit corridor, one turning back | Two figures passing in a corridor | ⏳ slot |
| past-life/corridor.webp | past-life q first | Mechanism | 3:4 | unfamiliar stone corridor, oil lamps, warm desaturated, dreamlike but photoreal | A lamplit corridor | ⏳ slot |
| past-life/antique.webp | past-life q repeat | Pain | 3:4 | a hand touching an antique locket/letter on a wooden desk, lamplight, archival feel | A hand on an antique object | ⏳ slot |
| past-life/window-reflection.webp | past-life (transition) | Reveal | 3:4 | reflection in a dark window of a figure from another period, old-photograph feeling | A reflection from another time | ⏳ slot |
| dreams/hook-waking.webp | dreams (hook) | Hook | 3:4 | woman waking after a vivid dream, hand on forehead, blue nighttime bedroom | A woman waking from a dream | ⏳ slot |
| dreams/window-reflection.webp | dreams q feeling | Pain | 3:4 | reflection in a night window, blurred familiar person behind her | A blurred figure in a window reflection | ⏳ slot |
| dreams/doorway-corridor.webp | dreams q repeat | Mechanism | 3:4 | dreamlike indigo corridor with one lit doorway, surreal but photoreal | A doorway in a dream corridor | ⏳ slot |
| dreams/note-phone.webp | dreams (transition) | Reveal | 3:4 | phone and notebook on the bed, blue light, someone beginning to write the dream | Writing the dream down at night | ⏳ slot |

Slots marcados ⏳ têm o prompt final acima; ao gerar, salvar no caminho
indicado e ligar no `registry.ts` (bloco `withImages`). Até lá os funis
rodam sem foto nesses pontos (sem imagem quebrada).
