# Trilhas do Reels diário

Usadas pelo `scripts/reels/gerar.mjs` (GitHub Actions) quando `SOCIAL_TRILHAS`
está vazia: uma por dia, em rodízio pelo dia do ano (`itemDoDia` em
`lib/reelsVideo.js`). A lista oficial é `TRILHAS_DO_REPOSITORIO` no mesmo
arquivo: trilha nova = arquivo aqui + nome na lista (o teste confere).

Todas do Pixabay Music (Licença de Conteúdo do Pixabay: uso comercial, inclusive
em rede social, sem precisar de crédito). Cortadas em 20s e com volume
normalizado (ffmpeg `loudnorm` -16 LUFS), pra todas soarem parecidas.

| Arquivo | Faixa no Pixabay | Trecho |
|---|---|---|
| `1-ambient-piano-leberch.mp3` | "Ambient Piano", Leberch (id 595681) | 0–20s |
| `2-corporate-ambient-atlasaudio.mp3` | "Corporate Ambient", AtlasAudio (id 625699) | 10–30s |
| `3-soft-ambient-sub_clair.mp3` | "Soft Ambient", Sub_Clair (id 634887) | 15–35s |
| `4-ambient-nastelbom.mp3` | "Ambient", Nastelbom (id 495893) | 0–20s |

Se o Instagram silenciar algum Reels por direito autoral, tire a faixa daqui e
da lista.
