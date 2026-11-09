# Ferramentas (não fazem parte do app)

- `video/` — gerador dos vídeos do treinamento (canvas 1080x1920 renderizado no Chrome + ffmpeg).
  - `video.html?m=<macro>&l=<pt|en|fr-CA>`: carrega `m/<macro>.<idioma>.js` (textos), `m/facts_<macro>.js` (números tirados da simulação real), `engine.js`, `m/<macro>.js` (cenas) e `engine_run.js`.
  - `node facts.js <id-do-programa> <índice-do-sub> > m/facts_<macro>.json` roda a macro no simulador do app e grava os valores.
  - `M=faceamento L=pt TIMING=../voz/timing.json python3 drive.py stills|render [cenas]`.
- `voz/` — alinhamento das legendas com a narração (`align.py`) e montagem da trilha (`mkaudio.py`).
- `build/` — geração de `programs.js`, `training.js` e da versão de teste em arquivo único.
