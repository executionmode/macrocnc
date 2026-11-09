/* Arte do app (desenhos originais em SVG): cena da usinagem, logotipo e ícones */
(function (root) {
  'use strict';

  function hero(variant) {
    // variant: 'mill' (fresa cortando bloco), 'flange' (peça redonda com furos), 'pocket' (bolsão)
    variant = variant || 'mill';
    var id = 'h' + Math.random().toString(36).slice(2, 7);
    var part = '';
    if (variant === 'flange') {
      part =
        '<ellipse cx="200" cy="205" rx="150" ry="46" fill="url(#' + id + 'side)"/>' +
        '<rect x="50" y="175" width="300" height="30" fill="url(#' + id + 'side)"/>' +
        '<ellipse cx="200" cy="175" rx="150" ry="46" fill="url(#' + id + 'top)" stroke="#9fb3c8" stroke-opacity=".35"/>' +
        '<ellipse cx="200" cy="168" rx="70" ry="22" fill="#2a3645"/><ellipse cx="200" cy="163" rx="70" ry="22" fill="url(#' + id + 'top2)"/>' +
        '<ellipse cx="200" cy="163" rx="34" ry="11" fill="#070b12"/>' +
        [0, 60, 120, 180, 240, 300].map(function (a) {
          var r = a * Math.PI / 180, x = 200 + 110 * Math.cos(r), y = 175 + 34 * Math.sin(r);
          return '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="9" ry="3.6" fill="#05080e"/>';
        }).join('');
    } else if (variant === 'pocket') {
      part =
        '<path d="M40 190 L200 140 L360 190 L200 240 Z" fill="url(#' + id + 'top)"/>' +
        '<path d="M40 190 L200 240 L200 262 L40 212 Z" fill="#3a4655"/><path d="M200 240 L360 190 L360 212 L200 262 Z" fill="#253040"/>' +
        '<path d="M120 190 L200 165 L280 190 L200 215 Z" fill="#0b1119"/>' +
        '<path d="M120 190 L200 215 L280 190 L280 197 L200 222 L120 197 Z" fill="#1c2733"/>' +
        '<path d="M140 190 L200 172 L260 190 L200 208 Z" fill="url(#' + id + 'floor)"/>';
    } else {
      part =
        '<path d="M30 196 L210 140 L380 188 L200 246 Z" fill="url(#' + id + 'top)"/>' +
        '<path d="M30 196 L200 246 L200 270 L30 220 Z" fill="#3b4757"/><path d="M200 246 L380 188 L380 212 L200 270 Z" fill="#232d3b"/>' +
        '<path d="M150 182 L230 158 L300 178 L220 203 Z" fill="#0b1119"/><path d="M150 182 L220 203 L220 211 L150 190 Z" fill="#1d2835"/>' +
        '<path d="M80 205 L140 187" stroke="#c9d8e8" stroke-opacity=".25" stroke-width="2"/>';
    }
    var spX = variant === 'flange' ? 300 : 222, spBottom = variant === 'flange' ? 150 : 176;
    return '<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Fresa usinando uma peça">' +
      '<defs>' +
      '<radialGradient id="' + id + 'bg" cx="55%" cy="35%" r="80%"><stop offset="0" stop-color="#16345f"/><stop offset=".45" stop-color="#0a1830"/><stop offset="1" stop-color="#02050b"/></radialGradient>' +
      '<linearGradient id="' + id + 'top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfd9e4"/><stop offset=".5" stop-color="#8d9bab"/><stop offset="1" stop-color="#5b6878"/></linearGradient>' +
      '<linearGradient id="' + id + 'top2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3ebf3"/><stop offset="1" stop-color="#7d8b9b"/></linearGradient>' +
      '<linearGradient id="' + id + 'side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a5666"/><stop offset=".5" stop-color="#2b3644"/><stop offset="1" stop-color="#1a222d"/></linearGradient>' +
      '<linearGradient id="' + id + 'floor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6e8096"/><stop offset="1" stop-color="#3b4a5c"/></linearGradient>' +
      '<linearGradient id="' + id + 'spin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a222d"/><stop offset=".35" stop-color="#6c7a8a"/><stop offset=".55" stop-color="#a9b6c4"/><stop offset="1" stop-color="#1e2733"/></linearGradient>' +
      '<linearGradient id="' + id + 'tool" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a4552"/><stop offset=".45" stop-color="#d7e1ea"/><stop offset="1" stop-color="#3a4552"/></linearGradient>' +
      '<radialGradient id="' + id + 'glow"><stop offset="0" stop-color="#9fd0ff"/><stop offset=".35" stop-color="#2f86ff" stop-opacity=".7"/><stop offset="1" stop-color="#2f86ff" stop-opacity="0"/></radialGradient>' +
      '<filter id="' + id + 'blur"><feGaussianBlur stdDeviation="3"/></filter>' +
      '</defs>' +
      '<rect width="400" height="280" fill="url(#' + id + 'bg)"/>' +
      // linhas de luz
      '<g stroke="#2f86ff" stroke-opacity=".35" stroke-width="1.2" filter="url(#' + id + 'blur)">' +
      '<path d="M-20 250 L420 120"/><path d="M-20 268 L420 150"/><path d="M60 0 L140 280"/></g>' +
      '<g fill="#5aa8ff" fill-opacity=".5"><circle cx="40" cy="40" r="1.4"/><circle cx="350" cy="60" r="1.2"/><circle cx="300" cy="25" r="1"/><circle cx="90" cy="120" r="1"/><circle cx="380" cy="130" r="1.3"/></g>' +
      part +
      // eixo-árvore e fresa
      '<rect x="' + (spX - 34) + '" y="-10" width="68" height="70" rx="6" fill="url(#' + id + 'spin)"/>' +
      '<rect x="' + (spX - 40) + '" y="55" width="80" height="10" rx="3" fill="#0d1520"/>' +
      '<path d="M' + (spX - 26) + ' 65 L' + (spX + 26) + ' 65 L' + (spX + 14) + ' 96 L' + (spX - 14) + ' 96 Z" fill="url(#' + id + 'spin)"/>' +
      '<rect x="' + (spX - 9) + '" y="96" width="18" height="' + (spBottom - 96) + '" fill="url(#' + id + 'tool)"/>' +
      '<g stroke="#26313d" stroke-width="2">' +
      [0, 1, 2, 3, 4, 5].map(function (k) { var y = 104 + k * ((spBottom - 110) / 5); return '<path d="M' + (spX - 9) + ' ' + y.toFixed(1) + ' L' + (spX + 9) + ' ' + (y + 7).toFixed(1) + '"/>'; }).join('') + '</g>' +
      // brilho e faíscas no corte
      '<circle cx="' + spX + '" cy="' + spBottom + '" r="34" fill="url(#' + id + 'glow)"/>' +
      '<g stroke="#bfe0ff" stroke-width="1.6" stroke-linecap="round">' +
      [[-40, -14], [-30, -26], [36, -20], [44, -6], [-46, 2], [28, -32], [52, -16], [-20, -34]].map(function (d) {
        return '<path d="M' + spX + ' ' + spBottom + ' l' + d[0] + ' ' + d[1] + '" stroke-opacity=".8"/>';
      }).join('') + '</g>' +
      '<g fill="#ffd28a">' + [[-34, -18], [40, -12], [-22, -28], [30, -26], [48, -2]].map(function (d) { return '<circle cx="' + (spX + d[0]) + '" cy="' + (spBottom + d[1]) + '" r="1.6"/>'; }).join('') + '</g>' +
      '<rect width="400" height="280" fill="url(#' + id + 'bg)" opacity="0" />' +
      '</svg>';
  }

  function logo(size) {
    var id = 'lg' + Math.random().toString(36).slice(2, 7);
    return '<svg class="logo-svg" viewBox="0 0 260 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Macro CNC" style="width:' + (size || 220) + 'px">' +
      '<defs><linearGradient id="' + id + 'a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#c9d3de"/><stop offset="1" stop-color="#7f8b98"/></linearGradient>' +
      '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4ff"/><stop offset=".5" stop-color="#2f86ff"/><stop offset="1" stop-color="#0b4fd6"/></linearGradient>' +
      '<filter id="' + id + 'g"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<path d="M160 18 C 235 8, 262 40, 230 62" fill="none" stroke="#2f86ff" stroke-width="5" stroke-linecap="round" filter="url(#' + id + 'g)"/>' +
      '<text x="14" y="58" font-family="system-ui,Segoe UI,Roboto,Arial" font-size="56" font-weight="900" font-style="italic" fill="url(#' + id + 'a)" stroke="#0b1220" stroke-width="1.5" letter-spacing="-2">Macro</text>' +
      '<text x="52" y="118" font-family="system-ui,Segoe UI,Roboto,Arial" font-size="64" font-weight="900" font-style="italic" fill="url(#' + id + 'b)" filter="url(#' + id + 'g)" letter-spacing="-1">CNC</text>' +
      '</svg>';
  }

  var I = {
    back: '<path d="M15 5 8 12l7 7M8 12h13"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3"/>',
    chev: '<path d="m9 5 7 7-7 7"/>',
    list: '<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8.5h8M8 12h8M8 15.5h5"/>',
    cog: '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="m19.4 13.5 1.6 1.2-1.8 3.1-1.9-.6a7.5 7.5 0 0 1-1.6.9l-.4 2h-3.6l-.4-2a7.5 7.5 0 0 1-1.6-.9l-1.9.6-1.8-3.1 1.6-1.2a7 7 0 0 1 0-3L3 9.3l1.8-3.1 1.9.6c.5-.4 1-.7 1.6-.9l.4-2h3.6l.4 2c.6.2 1.1.5 1.6.9l1.9-.6L21 9.3l-1.6 1.2a7 7 0 0 1 0 3Z"/>',
    rules: '<circle cx="12" cy="12" r="2.4"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M6.6 7.3 10 10.3M17.4 7.3 14 10.3M6.6 16.7 10 13.7M17.4 16.7 14 13.7"/>',
    box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    cap: '<path d="M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9Z"/><path d="M6.5 11v4.5c1.5 1.6 3.4 2.4 5.5 2.4s4-.8 5.5-2.4V11M21.5 9v5.5"/>',
    play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor"/>',
    home: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z"/>',
    folder: '<path d="M3.5 7.5h17v12h-17zM3.5 7.5V5h6l2 2.5"/><path d="M9 12.5h6"/>',
    star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.8L12 3.5Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20.5c1.2-4 4.4-6 8-6s6.8 2 8 6"/>',
    save: '<path d="M5 4h11l3 3v13H5V4Z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M11 11h2M14 11h2M8 14h2M11 14h2M14 14h2M8 17h2M11 17h2M14 17h2"/>',
    sigma: '<path d="M17 5H7l6 7-6 7h10"/>',
    brackets: '<path d="M9 4H6v16h3M15 4h3v16h-3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.5"/>',
    share: '<path d="M14 5l6 6-6 6M20 11H9a5 5 0 0 0-5 5v3"/>',
    doc: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v4h4M9 12h6M9 15h6M9 18h4"/>',
    cloud: '<path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.6A3.3 3.3 0 0 0 7 18Z"/><path d="M12 15v-5M9.8 12.2 12 10l2.2 2.2"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.7 2.7L16.5 9"/>',
    dots: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.8.6 1.5 1.6 1.5 2.6V17h4v-.5c0-1 .7-2 1.5-2.6A6 6 0 0 0 12 3Z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9.5h8M8 12.5h5"/>',
    download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/>',
    trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/>',
    paste: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4.5h6v2.5H9z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    open: '<path d="M3.5 7.5h6l2 2.5h9v9.5h-17z"/>',
    sim: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M12 12 4 7.5M12 12l8-4.5M12 12v9"/>',
    install: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'
  };
  function icon(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[name] || '') + '</svg>';
  }

  root.Art = { hero: hero, logo: logo, icon: icon };
})(this);
