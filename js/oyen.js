// Oyen — maskot kucing oranye (SVG inline + animasi CSS + suara Web Audio).
// Tanpa aset eksternal. Semua elemen dibuat lewat container.ownerDocument agar
// bisa dipindah ke jendela Document Picture-in-Picture.

export const MOODS = ['happy', 'neutral', 'slouch', 'alert', 'sleep', 'eat', 'stretch', 'drink', 'away', 'angry'];

const STYLE_ID = 'oyen-style';

// ---------------------------------------------------------------------------
// CSS (disuntikkan sekali per dokumen)
// ---------------------------------------------------------------------------
const CSS = `
.oyen-root{--droop:0;--oyen-scale:1;--ear-flat:0deg;--oyen-fur:#F7A24B;--oyen-fur-dark:#E07A24;--oyen-line:#A8521A;--oyen-cream:#FFEBCF;--oyen-pink:#FF9DB0;--oyen-eye:#2B1A10;position:relative;display:block;width:100%;container-type:inline-size;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
.oyen-svg{display:block;width:100%;height:auto;overflow:visible}
.oyen-fur{fill:var(--oyen-fur);stroke:var(--oyen-line);stroke-width:2.2;stroke-linejoin:round}
.oyen-fur-nl{fill:var(--oyen-fur)}
.oyen-cream{fill:var(--oyen-cream)}
.oyen-cream-l{fill:var(--oyen-cream);stroke:var(--oyen-line);stroke-width:2;stroke-linejoin:round}
.oyen-stripe{fill:none;stroke:var(--oyen-fur-dark);stroke-width:3.4;stroke-linecap:round}
.oyen-pinkf{fill:var(--oyen-pink)}
.oyen-eyef{fill:var(--oyen-eye)}
.oyen-ln{fill:none;stroke:var(--oyen-eye);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.oyen-toe{fill:none;stroke:var(--oyen-line);stroke-width:1.4;stroke-linecap:round}
.oyen-whisk{fill:none;stroke:var(--oyen-line);stroke-width:1.3;stroke-linecap:round;opacity:.55}
.oyen-blush{fill:#FF8FA3;opacity:.5}
.oyen-shadow{fill:#5a2d0c;opacity:.14}
.oyen-tail-o{fill:none;stroke:var(--oyen-line);stroke-width:18;stroke-linecap:round;transition:stroke-width .3s}
.oyen-tail-f{fill:none;stroke:var(--oyen-fur);stroke-width:13.6;stroke-linecap:round;transition:stroke-width .3s}
.oyen-tail-s{fill:none;stroke:var(--oyen-fur-dark);stroke-width:12.4;stroke-dasharray:4 10;stroke-dashoffset:-9;transition:stroke-width .3s}
.oyen-arm-o{fill:none;stroke:var(--oyen-line);stroke-width:19;stroke-linecap:round}
.oyen-arm-f{fill:none;stroke:var(--oyen-fur);stroke-width:14.6;stroke-linecap:round}
.oyen-mouth-in{fill:#7E2433;stroke:var(--oyen-eye);stroke-width:1.8;stroke-linejoin:round}
.oyen-sel{fill:#2F4F86;stroke:#1B2F55;stroke-width:1.6;stroke-linejoin:round}
.oyen-gold-ln{fill:none;stroke:#E9B949;stroke-width:1.4;stroke-linecap:round}
.oyen-kawung ellipse{fill:#FFE3C4}
.oyen-kawung circle{fill:#8E1426}
.oyen-z{fill:none;stroke:#6B7BE3;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.oyen-fb,.oyen-eye,.oyen-eye-wrap{transform-box:fill-box;transform-origin:center}

/* grup transform (koordinat viewBox) */
.oyen-lvl{transform-origin:100px 190px;transform:scale(var(--oyen-scale));transition:transform .6s cubic-bezier(.34,1.56,.64,1)}
.oyen-pose{transform-origin:100px 190px;transition:transform .45s ease}
.oyen-droop{transform-origin:100px 190px;transform:translateY(calc(var(--droop) * 4px)) scale(calc(1 + var(--droop) * .05),calc(1 - var(--droop) * .1));transition:transform .35s ease-out}
.oyen-headdroop{transform-origin:100px 124px;transform:translateY(calc(var(--droop) * 9px)) rotate(calc(var(--droop) * 6deg));transition:transform .35s ease-out}
.oyen-head-anim{transform-origin:100px 124px;transition:transform .4s ease}
.oyen-tail-g{transform-origin:134px 172px;transition:transform .5s ease}
.oyen-ear-l{transform-origin:72px 58px;transform:rotate(calc((var(--droop) * 22deg + var(--ear-flat)) * -1));transition:transform .35s ease}
.oyen-ear-r{transform-origin:128px 58px;transform:rotate(calc(var(--droop) * 22deg + var(--ear-flat)));transition:transform .35s ease}
.oyen-arm-l{transform-origin:70px 128px}
.oyen-arm-r{transform-origin:130px 128px}
.oyen-glow{transform-origin:100px 118px;animation:oyen-glow 3s ease-in-out infinite alternate}
.oyen-spark{fill:#FFD54A;animation:oyen-twinkle 2.2s ease-in-out infinite}
.oyen-eye{animation:oyen-blink 5.3s infinite}
.oyen-eye-wrap{transition:transform .3s ease}
.oyen-mouth-open,.oyen-tongue{transform-box:fill-box;transform-origin:50% 0}
.oyen-fish-in{transform-box:fill-box;transform-origin:0 50%}
.oyen-drip{animation:oyen-drip 1.8s ease-in infinite}
.oyen-pop{animation:oyen-pop .45s ease-in-out infinite alternate}
.oyen-qa{animation:oyen-q 2s ease-in-out infinite}
.oyen-z{animation:oyen-z 3s ease-in-out infinite}
.oyen-heart{animation:oyen-heart 2s ease-out infinite}
.oyen-steam{fill:#F4EFEB;stroke:#B3A8A0;stroke-width:1.1;stroke-linejoin:round;animation:oyen-steam 1.4s ease-out infinite}
.oyen-angmark{fill:none;stroke:#E63946;stroke-width:3.2;stroke-linecap:round}
.oyen-flush{fill:#FF2E2E;opacity:.12}
.oyen-tail-fz{fill:none;stroke:var(--oyen-line);stroke-width:35;stroke-dasharray:2 4.5}
.oyen-fang{fill:#fff;stroke:var(--oyen-eye);stroke-width:1;stroke-linejoin:round}
.oyen-stomp{transform-origin:132px 146px;transform:rotate(-6deg)}

/* tampil/sembunyi per mood & aksesori */
.oyen-eyes-sleep,.oyen-eyes-happy,.oyen-lids,.oyen-mouth-open,.oyen-mouth-sad,.oyen-tongue,.oyen-fish,.oyen-tail-curl,.oyen-arms,.oyen-bowl-food,.oyen-bowl-water,.oyen-fx-sweat,.oyen-fx-alert,.oyen-fx-zzz,.oyen-fx-q,.oyen-fx-hearts,.oyen-acc,.oyen-brows-angry,.oyen-lids-angry,.oyen-mouth-hiss,.oyen-fx-anger,.oyen-steam-1,.oyen-steam-2,.oyen-steam-3,.oyen-puff,.oyen-tail-fz,.oyen-stomp,.oyen-flush,.oyen-angry-aura{display:none}
.oyen-root[data-mood="sleep"] .oyen-eyes-sleep,
.oyen-root[data-mood="sleep"] .oyen-tail-curl,
.oyen-root[data-mood="sleep"] .oyen-fx-zzz,
.oyen-root[data-mood="eat"] .oyen-eyes-happy,
.oyen-root[data-mood="eat"] .oyen-mouth-open,
.oyen-root[data-mood="eat"] .oyen-fish,
.oyen-root[data-mood="eat"] .oyen-bowl-food,
.oyen-root[data-mood="eat"] .oyen-fx-hearts,
.oyen-root[data-mood="stretch"] .oyen-eyes-happy,
.oyen-root[data-mood="stretch"] .oyen-mouth-open,
.oyen-root[data-mood="stretch"] .oyen-arms,
.oyen-root[data-mood="drink"] .oyen-eyes-happy,
.oyen-root[data-mood="drink"] .oyen-tongue,
.oyen-root[data-mood="drink"] .oyen-bowl-water,
.oyen-root[data-mood="slouch"] .oyen-lids,
.oyen-root[data-mood="slouch"] .oyen-mouth-sad,
.oyen-root[data-mood="slouch"] .oyen-fx-sweat,
.oyen-root[data-mood="alert"] .oyen-mouth-open,
.oyen-root[data-mood="alert"] .oyen-fx-alert,
.oyen-root[data-mood="away"] .oyen-fx-q,
.oyen-root[data-mood="angry"] .oyen-brows-angry,
.oyen-root[data-mood="angry"] .oyen-lids-angry,
.oyen-root[data-mood="angry"] .oyen-mouth-hiss,
.oyen-root[data-mood="angry"] .oyen-fx-anger,
.oyen-root[data-mood="angry"] .oyen-steam-1,
.oyen-root[data-mood="angry"]:is([data-anger="2"],[data-anger="3"]) .oyen-steam-2,
.oyen-root[data-mood="angry"][data-anger="3"] .oyen-steam-3,
.oyen-root[data-mood="angry"][data-anger="3"] .oyen-angry-aura,
.oyen-root[data-mood="angry"] .oyen-puff,
.oyen-root[data-mood="angry"] .oyen-tail-fz,
.oyen-root[data-mood="angry"] .oyen-stomp,
.oyen-root[data-mood="angry"] .oyen-flush,
.oyen-root[data-acc~="bandana"] .oyen-acc-bandana,
.oyen-root[data-acc~="bell"] .oyen-acc-bell,
.oyen-root[data-acc~="blangkon"] .oyen-acc-blangkon,
.oyen-root[data-acc~="selendang"] .oyen-acc-selendang,
.oyen-root[data-acc~="glasses"] .oyen-acc-glasses,
.oyen-root[data-acc~="aura"] .oyen-acc-aura,
.oyen-root[data-acc~="crown"] .oyen-acc-crown{display:inline}
.oyen-root:is([data-mood="sleep"],[data-mood="eat"],[data-mood="stretch"],[data-mood="drink"]) .oyen-eyes-look{display:none}
.oyen-root:is([data-mood="eat"],[data-mood="stretch"],[data-mood="alert"],[data-mood="slouch"],[data-mood="angry"]) .oyen-mouth-w{display:none}
.oyen-root[data-mood="sleep"] .oyen-tail-g{display:none}

/* happy */
.oyen-root[data-mood="happy"] .oyen-bob{animation:oyen-bob 2.4s ease-in-out infinite}
.oyen-root[data-mood="happy"] .oyen-tail-g{animation:oyen-swish 1.6s ease-in-out infinite}
.oyen-root[data-mood="happy"] .oyen-head-anim{animation:oyen-tilt 4.8s ease-in-out infinite}
/* neutral */
.oyen-root[data-mood="neutral"] .oyen-bob{animation:oyen-bob-soft 4s ease-in-out infinite}
.oyen-root[data-mood="neutral"] .oyen-tail-g{animation:oyen-swish-soft 3.4s ease-in-out infinite}
/* slouch */
.oyen-root[data-mood="slouch"]{--ear-flat:34deg}
.oyen-root[data-mood="slouch"] .oyen-bob{animation:oyen-bob-soft 5s ease-in-out infinite}
.oyen-root[data-mood="slouch"] .oyen-pose{transform:translateY(2px) scale(1.05,.9)}
.oyen-root[data-mood="slouch"] .oyen-head-anim{transform:translateY(5px) rotate(5deg)}
.oyen-root[data-mood="slouch"] .oyen-tail-g{transform:rotate(26deg)}
.oyen-root[data-mood="slouch"] .oyen-eye-wrap{transform:translateY(1.5px) scale(.95)}
/* alert */
.oyen-root[data-mood="alert"]{--ear-flat:-8deg}
.oyen-root[data-mood="alert"] .oyen-pose{animation:oyen-shake 1.5s ease-in-out infinite}
.oyen-root[data-mood="alert"] .oyen-head-anim{transform:translateY(-3px)}
.oyen-root[data-mood="alert"] .oyen-tail-g{transform:rotate(-16deg)}
.oyen-root[data-mood="alert"] .oyen-tail-o{stroke-width:25}
.oyen-root[data-mood="alert"] .oyen-tail-f{stroke-width:20.6}
.oyen-root[data-mood="alert"] .oyen-tail-s{stroke-width:19.4}
.oyen-root[data-mood="alert"] .oyen-eye-wrap{transform:scale(1.22)}
/* sleep */
.oyen-root[data-mood="sleep"]{--ear-flat:16deg}
.oyen-root[data-mood="sleep"] .oyen-pose{animation:oyen-sleep 3.8s ease-in-out infinite}
.oyen-root[data-mood="sleep"] .oyen-head-anim{transform:translateY(10px) rotate(-9deg)}
/* eat */
.oyen-root[data-mood="eat"] .oyen-head-anim{animation:oyen-munch .4s ease-in-out infinite alternate}
.oyen-root[data-mood="eat"] .oyen-mouth-open{animation:oyen-chew .4s ease-in-out infinite alternate}
.oyen-root[data-mood="eat"] .oyen-fish-in{animation:oyen-wiggle .4s ease-in-out infinite alternate}
.oyen-root[data-mood="eat"] .oyen-tail-g{animation:oyen-swish 1.3s ease-in-out infinite}
/* stretch */
.oyen-root[data-mood="stretch"] .oyen-pose{animation:oyen-stretch 3.2s ease-in-out infinite}
.oyen-root[data-mood="stretch"] .oyen-head-anim{animation:oyen-yawn-head 3.2s ease-in-out infinite}
.oyen-root[data-mood="stretch"] .oyen-mouth-open{animation:oyen-yawn 3.2s ease-in-out infinite}
.oyen-root[data-mood="stretch"] .oyen-arm-l{animation:oyen-arm-l 3.2s ease-in-out infinite}
.oyen-root[data-mood="stretch"] .oyen-arm-r{animation:oyen-arm-r 3.2s ease-in-out infinite}
.oyen-root[data-mood="stretch"] .oyen-tail-g{transform:rotate(-12deg)}
/* drink */
.oyen-root[data-mood="drink"]{--ear-flat:6deg}
.oyen-root[data-mood="drink"] .oyen-pose{transform:translateX(-3px) rotate(-5deg)}
.oyen-root[data-mood="drink"] .oyen-head-anim{transform:translate(-6px,12px) rotate(-12deg)}
.oyen-root[data-mood="drink"] .oyen-tongue{animation:oyen-lap .45s ease-in-out infinite alternate}
.oyen-root[data-mood="drink"] .oyen-tail-g{animation:oyen-swish-soft 3s ease-in-out infinite}
.oyen-root[data-mood="drink"] .oyen-ripple{animation:oyen-ripple 1.2s ease-out infinite}
/* away */
.oyen-root[data-mood="away"] .oyen-head-anim{animation:oyen-look 4.4s ease-in-out infinite}
.oyen-root[data-mood="away"] .oyen-eyes-look{animation:oyen-look-eyes 4.4s ease-in-out infinite}
.oyen-root[data-mood="away"] .oyen-tail-g{animation:oyen-swish-soft 2.6s ease-in-out infinite}

/* angry (kelamaan bungkuk: Oyen ngambek) — --droop diabaikan agar pose tak penyok */
.oyen-root[data-mood="angry"]{--droop:0!important;--ear-flat:12deg;--oyen-fur:#F8873F;--oyen-fur-dark:#D4502A;--oyen-line:#9C3514;--oyen-pink:#FF6F86;--oyen-angry-s:1.06;--oyen-shk:1.2px}
.oyen-root[data-mood="angry"][data-anger="2"]{--oyen-shk:2.4px}
.oyen-root[data-mood="angry"][data-anger="3"]{--oyen-angry-s:1.12;--oyen-shk:3.4px;--oyen-fur:#F7783A}
.oyen-root[data-mood="angry"] .oyen-pose{transform:scale(var(--oyen-angry-s));animation:oyen-angry-shake 1s ease-in-out infinite}
.oyen-root[data-mood="angry"][data-anger="2"] .oyen-pose{animation-duration:.5s}
.oyen-root[data-mood="angry"][data-anger="3"] .oyen-pose{animation-duration:.26s}
.oyen-root[data-mood="angry"] .oyen-head-anim{transform:translateY(-2px)}
.oyen-root[data-mood="angry"] .oyen-eye-wrap{transform:translateY(1px) scale(.92,.8)}
.oyen-root[data-mood="angry"] .oyen-blush{fill:#FF4D5E;opacity:.65}
.oyen-root[data-mood="angry"][data-anger="3"] .oyen-flush{opacity:.22}
.oyen-root[data-mood="angry"] .oyen-tail-g{transform:rotate(-18deg)}
.oyen-root[data-mood="angry"] .oyen-tail-o{stroke-width:28}
.oyen-root[data-mood="angry"] .oyen-tail-f{stroke-width:23.6}
.oyen-root[data-mood="angry"] .oyen-tail-s{stroke-width:22.4}
.oyen-root[data-mood="angry"] .oyen-stomp{animation:oyen-stomp .5s ease-in-out infinite alternate}
.oyen-root[data-mood="angry"][data-anger="2"] .oyen-stomp{animation-duration:.32s}
.oyen-root[data-mood="angry"][data-anger="3"] .oyen-stomp{animation-duration:.2s}
.oyen-root[data-mood="angry"][data-anger="3"] .oyen-steam{animation-duration:.9s}
.oyen-root[data-mood="angry"][data-anger="2"] .oyen-angmark{animation:oyen-anger-pulse .45s ease-in-out infinite alternate}
.oyen-root[data-mood="angry"][data-anger="3"] .oyen-angmark{animation:oyen-anger-pulse .28s ease-in-out infinite alternate}

@keyframes oyen-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes oyen-bob-soft{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.4px)}}
@keyframes oyen-swish{0%,100%{transform:rotate(4deg)}50%{transform:rotate(-14deg)}}
@keyframes oyen-swish-soft{0%,100%{transform:rotate(2deg)}50%{transform:rotate(-6deg)}}
@keyframes oyen-blink{0%,93%,100%{transform:scaleY(1)}95.5%{transform:scaleY(.08)}}
@keyframes oyen-tilt{0%,100%{transform:rotate(0)}50%{transform:rotate(3.5deg)}}
@keyframes oyen-shake{0%,55%,100%{transform:scale(1.08)}8%{transform:translateX(-3px) scale(1.08)}16%{transform:translateX(3px) scale(1.08)}24%{transform:translateX(-2.5px) scale(1.08)}32%{transform:translateX(2.5px) scale(1.08)}40%{transform:translateX(-1px) scale(1.08)}}
@keyframes oyen-sleep{0%,100%{transform:scale(1.1,.86)}50%{transform:scale(1.12,.89)}}
@keyframes oyen-stretch{0%,100%{transform:scale(1,1)}35%,65%{transform:scale(1.14,.9)}}
@keyframes oyen-yawn-head{0%,100%{transform:translateY(0) rotate(0)}35%,65%{transform:translateY(-4px) rotate(-9deg)}}
@keyframes oyen-yawn{0%,100%{transform:scale(.7)}35%,65%{transform:scale(1.35)}}
@keyframes oyen-arm-l{0%,100%{transform:rotate(-38deg)}35%,65%{transform:rotate(0)}}
@keyframes oyen-arm-r{0%,100%{transform:rotate(38deg)}35%,65%{transform:rotate(0)}}
@keyframes oyen-munch{0%{transform:translateY(2px) rotate(-1deg)}100%{transform:translateY(5px) rotate(1.5deg)}}
@keyframes oyen-chew{0%{transform:scaleY(1)}100%{transform:scaleY(.45)}}
@keyframes oyen-wiggle{0%{transform:rotate(-7deg)}100%{transform:rotate(7deg)}}
@keyframes oyen-lap{0%{transform:scaleY(.35)}100%{transform:scaleY(1.15)}}
@keyframes oyen-ripple{0%{transform:scale(.3);opacity:.9}100%{transform:scale(1.25);opacity:0}}
@keyframes oyen-look{0%,100%{transform:translateX(0) rotate(0)}22%,38%{transform:translateX(-5px) rotate(-7deg)}62%,78%{transform:translateX(5px) rotate(7deg)}}
@keyframes oyen-look-eyes{0%,100%{transform:translateX(0)}22%,38%{transform:translateX(-4px)}62%,78%{transform:translateX(4px)}}
@keyframes oyen-drip{0%{transform:translateY(-3px);opacity:0}20%{opacity:1}75%{transform:translateY(6px);opacity:1}100%{transform:translateY(9px);opacity:0}}
@keyframes oyen-pop{0%{transform:scale(1) rotate(-4deg)}100%{transform:scale(1.18) rotate(6deg)}}
@keyframes oyen-q{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}
@keyframes oyen-z{0%{transform:translate(0,6px) scale(.6);opacity:0}25%{opacity:1}100%{transform:translate(9px,-14px) scale(1.1);opacity:0}}
@keyframes oyen-heart{0%{transform:translateY(6px) scale(.5);opacity:0}30%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-20px) scale(.9);opacity:0}}
@keyframes oyen-glow{0%{opacity:.6;transform:scale(.96)}100%{opacity:1;transform:scale(1.04)}}
@keyframes oyen-angry-shake{0%,100%{transform:translate(0,0) scale(var(--oyen-angry-s)) rotate(0)}15%{transform:translate(calc(var(--oyen-shk) * -1),-1.5px) scale(var(--oyen-angry-s)) rotate(-1.5deg)}35%{transform:translate(var(--oyen-shk),0) scale(var(--oyen-angry-s)) rotate(1.5deg)}55%{transform:translate(calc(var(--oyen-shk) * -.6),-1px) scale(var(--oyen-angry-s)) rotate(-.8deg)}75%{transform:translate(calc(var(--oyen-shk) * .6),0) scale(var(--oyen-angry-s)) rotate(.8deg)}}
@keyframes oyen-stomp{0%{transform:rotate(-16deg)}100%{transform:rotate(8deg)}}
@keyframes oyen-steam{0%{transform:translateY(3px) scale(.5);opacity:0}25%{opacity:.95}100%{transform:translateY(-12px) scale(1.25);opacity:0}}
@keyframes oyen-anger-pulse{0%{transform:scale(.85)}100%{transform:scale(1.2)}}
@keyframes oyen-twinkle{0%,100%{transform:scale(.35) rotate(0);opacity:.25}50%{transform:scale(1) rotate(45deg);opacity:1}}

/* balon ucapan */
.oyen-bubble{position:absolute;left:50%;top:2px;z-index:2;box-sizing:border-box;width:max-content;max-width:94%;padding:.35em .75em;background:#fff;color:#3a2a20;border:2px solid #3a2a20;border-radius:14px;box-shadow:0 3px 0 rgba(0,0,0,.12);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-weight:600;font-size:14px;font-size:clamp(11px,6.2cqw,16px);line-height:1.25;text-align:center;overflow-wrap:anywhere;opacity:0;pointer-events:none;transform:translate(-50%,4px) scale(.9);transform-origin:50% 100%;transition:opacity .2s ease,transform .2s ease}
.oyen-bubble::after{content:"";position:absolute;left:50%;bottom:-7px;width:10px;height:10px;background:#fff;border-right:2px solid #3a2a20;border-bottom:2px solid #3a2a20;transform:translateX(-50%) rotate(45deg)}
.oyen-bubble.oyen-show{opacity:1;transform:translate(-50%,0) scale(1)}

@media (prefers-reduced-motion: reduce){
.oyen-root,.oyen-root *{animation:none!important;transition-duration:.01ms!important}
.oyen-root[data-mood="alert"] .oyen-pose{transform:scale(1.08)}
.oyen-root[data-mood="sleep"] .oyen-pose{transform:scale(1.1,.88)}
.oyen-root[data-mood="stretch"] .oyen-pose{transform:scale(1.12,.9)}
.oyen-root[data-mood="stretch"] .oyen-head-anim{transform:rotate(-9deg)}
.oyen-root[data-mood="eat"] .oyen-head-anim{transform:translateY(3px)}
.oyen-root[data-mood="angry"] .oyen-pose{transform:scale(var(--oyen-angry-s))}
.oyen-root[data-mood="angry"] .oyen-stomp{transform:rotate(-10deg)}
}
`;

// ---------------------------------------------------------------------------
// SVG
// ---------------------------------------------------------------------------
const r2 = (v) => Math.round(v * 100) / 100;

// Garis bulu mengembang (jumbai) di sekeliling badan saat marah.
function furPuff(cx, cy, rx, ry, n) {
  const pt = (a, k) => `${r2(cx + Math.cos(a) * rx * k)} ${r2(cy + Math.sin(a) * ry * k)}`;
  const step = (Math.PI * 2) / n;
  let d = `M${pt(step / 2, 0.9)}`;
  for (let i = 1; i <= n; i++) d += ` Q${pt(i * step, 1.1)} ${pt(i * step + step / 2, 0.9)}`;
  return `<path class="oyen-fur oyen-puff" d="${d} Z"/>`;
}

// Kepulan uap kecil (dipasang di ujung telinga).
const STEAM = 'M-6 3 Q-9 -1 -5 -3 Q-4 -8 1 -7 Q6 -9 7 -3 Q10 0 6 3 Z';
function steam(cls, x, y, s, delay) {
  return `<g class="${cls}" transform="translate(${x} ${y}) scale(${s})"><path class="oyen-steam oyen-fb" style="animation-delay:${delay}s" d="${STEAM}"/></g>`;
}

// Motif kawung: empat kelopak oval mengelilingi titik pusat.
function kawung(cx, cy, s) {
  const a = s * 0.95, rl = s * 0.85, rs = s * 0.5;
  return `<g class="oyen-kawung">` +
    `<ellipse cx="${r2(cx)}" cy="${r2(cy - a)}" rx="${r2(rs)}" ry="${r2(rl)}"/>` +
    `<ellipse cx="${r2(cx)}" cy="${r2(cy + a)}" rx="${r2(rs)}" ry="${r2(rl)}"/>` +
    `<ellipse cx="${r2(cx - a)}" cy="${r2(cy)}" rx="${r2(rl)}" ry="${r2(rs)}"/>` +
    `<ellipse cx="${r2(cx + a)}" cy="${r2(cy)}" rx="${r2(rl)}" ry="${r2(rs)}"/>` +
    `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(s * 0.28)}"/></g>`;
}

// Goresan miring ala parang di sepanjang selendang.
function parangMarks() {
  let d = '';
  for (let i = 0; i < 7; i++) {
    const t = 0.1 + i * 0.13;
    const x = 63 + (139 - 63) * t;
    const y = 131 + (172 - 131) * t;
    d += `M${r2(x - 2)} ${r2(y + 4)} Q${r2(x + 2.5)} ${r2(y + 1)} ${r2(x + 1)} ${r2(y - 4)} `;
  }
  return `<path class="oyen-gold-ln" d="${d.trim()}"/>`;
}

function blangkonMarks() {
  const pts = [[80, 50], [90, 45], [100, 43], [110, 45], [120, 50], [86, 55], [96, 51], [106, 51], [114, 55]];
  const d = pts.map(([x, y]) => `M${x - 2.5} ${y + 2.5} L${x + 2.5} ${y - 2.5}`).join(' ');
  return `<path d="${d}" fill="none" stroke="#C99A3B" stroke-width="1.6" stroke-linecap="round"/>`;
}

function sparkles() {
  const pos = [[30, 82, 0], [170, 76, -0.7], [24, 150, -1.4], [174, 148, -0.4], [48, 30, -1.1], [154, 24, -1.8]];
  const star = 'M0 -7 Q1 -1 7 0 Q1 1 0 7 Q-1 1 -7 0 Q-1 -1 0 -7 Z';
  return pos.map(([x, y, dl]) =>
    `<g transform="translate(${x} ${y})"><path class="oyen-spark oyen-fb" style="animation-delay:${dl}s" d="${star}"/></g>`
  ).join('');
}

const TAIL = 'M134 172 C160 176 172 158 166 136 C164 128 158 124 154 127';
const CURL = 'M138 168 C154 182 132 194 100 192 C82 191 70 188 66 182';
const HEAD = 'M100 44 C132 44 152 62 152 88 L158 100 L149 102 L154 110 L144 110 C136 126 120 132 100 132 C80 132 64 126 56 110 L46 110 L51 102 L42 100 L48 88 C48 62 68 44 100 44 Z';
const HEART = 'M0 4 C-7 -3 -11 3 -6 7.5 L0 12 L6 7.5 C11 3 7 -3 0 4 Z';
const ZED = 'M0 0 H7 L0 8 H7';

function eye(cx) {
  return `<g class="oyen-eye-wrap"><g class="oyen-eye">` +
    `<ellipse class="oyen-eyef" cx="${cx}" cy="89" rx="9" ry="11"/>` +
    `<circle fill="#fff" cx="${cx + 3.6}" cy="84.2" r="3.4"/>` +
    `<circle fill="#fff" cx="${cx - 3.2}" cy="94" r="1.6"/>` +
    `</g></g>`;
}

function paw(x, y) {
  return `<circle class="oyen-cream-l" cx="${x}" cy="${y}" r="8.5"/>` +
    `<circle class="oyen-pinkf" cx="${x}" cy="${y + 2}" r="2.6"/>` +
    `<circle class="oyen-pinkf" cx="${x - 3}" cy="${y - 3}" r="1.5"/>` +
    `<circle class="oyen-pinkf" cx="${x}" cy="${y - 4.4}" r="1.5"/>` +
    `<circle class="oyen-pinkf" cx="${x + 3}" cy="${y - 3}" r="1.5"/>`;
}

const MARKUP = `
<div class="oyen-bubble" role="status" aria-live="polite"></div>
<svg class="oyen-svg" viewBox="0 -20 200 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<g class="oyen-lvl">
  <g class="oyen-acc oyen-acc-aura">
    <g class="oyen-glow"><circle cx="100" cy="118" r="82" fill="#FFE08A" opacity=".2"/><circle cx="100" cy="118" r="62" fill="#FFE08A" opacity=".25"/></g>
    ${sparkles()}
  </g>
  <g class="oyen-angry-aura"><g class="oyen-glow"><circle cx="100" cy="118" r="86" fill="#FF3B30" opacity=".14"/><circle cx="100" cy="118" r="64" fill="#FF3B30" opacity=".2"/></g></g>
  <ellipse class="oyen-shadow" cx="100" cy="189" rx="54" ry="7"/>
  <g class="oyen-pose"><g class="oyen-bob"><g class="oyen-droop">
    <g class="oyen-tail-g">
      <path class="oyen-tail-fz" d="${TAIL}"/>
      <path class="oyen-tail-o" d="${TAIL}"/><path class="oyen-tail-f" d="${TAIL}"/><path class="oyen-tail-s" d="${TAIL}"/>
    </g>
    ${furPuff(100, 148, 52, 44, 18)}
    <ellipse class="oyen-fur" cx="100" cy="148" rx="46" ry="38"/>
    <ellipse class="oyen-cream" cx="100" cy="157" rx="27" ry="25"/>
    <path class="oyen-stripe" d="M57 141 q9 -1 13 4 M56 153 q9 0 12 5 M143 141 q-9 -1 -13 4 M144 153 q-9 0 -12 5"/>
    <ellipse class="oyen-cream-l" cx="82" cy="182" rx="13" ry="8"/>
    <ellipse class="oyen-cream-l" cx="118" cy="182" rx="13" ry="8"/>
    <path class="oyen-toe" d="M78 179 v4 M86 179 v4 M114 179 v4 M122 179 v4"/>
    <g class="oyen-tail-curl">
      <path class="oyen-tail-o" d="${CURL}"/><path class="oyen-tail-f" d="${CURL}"/><path class="oyen-tail-s" d="${CURL}"/>
    </g>
    <g class="oyen-acc oyen-acc-selendang">
      <path class="oyen-sel" d="M136 168 Q147 171 149 187 L136 189 Q137 178 131 172 Z"/>
      <path class="oyen-sel" d="M58 126 Q63 119 72 122 Q108 143 143 165 Q144 176 135 180 Q98 158 62 140 Q53 134 58 126 Z"/>
      <path class="oyen-gold-ln" d="M66 125 Q106 147 141 168 M62 136 Q100 158 136 177"/>
      ${parangMarks()}
      <path class="oyen-gold-ln" d="M138 189 v3 M141 188.8 v3 M144 188.5 v3 M147 188.2 v3"/>
    </g>
    <g class="oyen-acc oyen-acc-bandana">
      <path d="M63 120 Q100 140 137 120 L129 133 Q112 148 100 166 Q88 148 71 133 Z" fill="#D7263D" stroke="#8E1426" stroke-width="1.6" stroke-linejoin="round"/>
      ${kawung(87, 137, 2.3)}${kawung(113, 137, 2.3)}${kawung(100, 156, 2.2)}
    </g>
    <g class="oyen-acc oyen-acc-bell">
      <path d="M60 124 Q100 152 140 124" fill="none" stroke="#C0392B" stroke-width="6" stroke-linecap="round"/>
      <circle cx="100" cy="143" r="7" fill="#F5C542" stroke="#A87A14" stroke-width="1.6"/>
      <path d="M93.5 143 H106.5" stroke="#A87A14" stroke-width="1.3"/>
      <circle cx="100" cy="146.5" r="1.6" fill="#7A5410"/>
      <circle cx="97.4" cy="140" r="1.8" fill="#fff" opacity=".7"/>
    </g>
    <g class="oyen-arms">
      <g class="oyen-arm-l"><path class="oyen-arm-o" d="M70 128 L42 66"/><path class="oyen-arm-f" d="M70 128 L42 66"/>${paw(42, 66)}</g>
      <g class="oyen-arm-r"><path class="oyen-arm-o" d="M130 128 L158 66"/><path class="oyen-arm-f" d="M130 128 L158 66"/>${paw(158, 66)}</g>
    </g>
    <g class="oyen-headdroop"><g class="oyen-head-anim">
      <g class="oyen-ear-l"><path class="oyen-fur" d="M57 70 L60 31 Q62 25 67 28 L93 50 Z"/><path class="oyen-pinkf" d="M64 60 L65 37 L84 51 Z"/>${steam('oyen-steam-1', 60, 20, 1, 0)}${steam('oyen-steam-3', 52, 6, 0.8, -0.5)}</g>
      <g class="oyen-ear-r"><path class="oyen-fur" d="M143 70 L140 31 Q138 25 133 28 L107 50 Z"/><path class="oyen-pinkf" d="M136 60 L135 37 L116 51 Z"/>${steam('oyen-steam-2', 140, 20, 1, -0.7)}</g>
      <path class="oyen-fur" d="${HEAD}"/>
      <ellipse class="oyen-flush" cx="100" cy="92" rx="46" ry="34"/>
      <ellipse cx="82" cy="58" rx="13" ry="5.5" fill="#fff" opacity=".28" transform="rotate(-18 82 58)"/>
      <path class="oyen-stripe" d="M91 48 Q93 54 91 60 M100 46 V58 M109 48 Q107 54 109 60 M50 84 h9 M49 93 h8 M150 84 h-9 M151 93 h-8"/>
      <ellipse class="oyen-cream" cx="91" cy="107" rx="11.5" ry="8.5"/>
      <ellipse class="oyen-cream" cx="109" cy="107" rx="11.5" ry="8.5"/>
      <ellipse class="oyen-cream" cx="100" cy="114" rx="6" ry="4"/>
      <ellipse class="oyen-blush" cx="66" cy="104" rx="8.5" ry="5"/>
      <ellipse class="oyen-blush" cx="134" cy="104" rx="8.5" ry="5"/>
      <g class="oyen-eyes-look"><g class="oyen-eyes-open">${eye(80)}${eye(120)}</g></g>
      <path class="oyen-ln oyen-eyes-sleep" stroke-width="2.6" d="M71 89 Q80 96 89 89 M111 89 Q120 96 129 89"/>
      <path class="oyen-ln oyen-eyes-happy" stroke-width="2.6" d="M71 92 Q80 83 89 92 M111 92 Q120 83 129 92"/>
      <g class="oyen-lids">
        <path class="oyen-fur-nl" d="M67 75 H93 V85 L67 92 Z"/><path class="oyen-fur-nl" d="M107 75 H133 V92 L107 85 Z"/>
        <path class="oyen-ln" d="M67.5 91.6 L92.5 85.2 M107.5 85.2 L132.5 91.6"/>
      </g>
      <g class="oyen-lids-angry">
        <path class="oyen-fur-nl" d="M67 74 H93 V88 L67 81 Z"/><path class="oyen-fur-nl" d="M107 74 H133 V81 L107 88 Z"/>
        <path class="oyen-ln" d="M67.5 81.2 L92.5 87.8 M107.5 87.8 L132.5 81.2"/>
      </g>
      <path class="oyen-ln oyen-brows-angry" stroke-width="3.4" d="M69 75.5 L90 81.5 M131 75.5 L110 81.5"/>
      <path class="oyen-pinkf" d="M94.5 98 Q100 95.5 105.5 98 Q103 103 100 104 Q97 103 94.5 98 Z"/>
      <ellipse cx="98.3" cy="98.2" rx="1.4" ry=".8" fill="#fff" opacity=".7"/>
      <path class="oyen-ln oyen-mouth-w" stroke-width="2" d="M100 104 Q100 109 95.5 110 Q92.5 110.5 91.5 108 M100 104 Q100 109 104.5 110 Q107.5 110.5 108.5 108"/>
      <path class="oyen-ln oyen-mouth-sad" stroke-width="2" d="M100 104 V107 M93.5 112 Q100 106.5 106.5 112"/>
      <g class="oyen-tongue"><path d="M96 108.5 Q95.5 117 100 117 Q104.5 117 104 108.5 Z" fill="#FF7F96" stroke="#A8521A" stroke-width="1.2"/><path d="M100 109.5 V114" stroke="#D9546F" stroke-width="1" stroke-linecap="round"/></g>
      <path class="oyen-whisk" d="M73 103 L49 98 M73 108 L50 110 M127 103 L151 98 M127 108 L150 110"/>
      <g class="oyen-fish"><g transform="translate(103 113) rotate(14)"><g class="oyen-fish-in">
        <path d="M25 0 L34 -7.5 Q31 0 34 7.5 Z" fill="#8EC5DE" stroke="#3F7790" stroke-width="1.5" stroke-linejoin="round"/>
        <ellipse cx="14" cy="0" rx="13" ry="6.5" fill="#8EC5DE" stroke="#3F7790" stroke-width="1.5"/>
        <path d="M11 -4.5 Q13.5 0 11 4.5 M17 -2 l2 2 l-2 2 M21 -2 l2 2 l-2 2" fill="none" stroke="#3F7790" stroke-width="1.1" stroke-linecap="round"/>
        <circle cx="7.5" cy="-1.5" r="1.5" fill="#1D3946"/>
      </g></g></g>
      <g class="oyen-mouth-open"><path class="oyen-mouth-in" d="M93 107.5 Q100 105 107 107.5 Q106.5 118 100 118 Q93.5 118 93 107.5 Z"/><ellipse cx="100" cy="115.2" rx="4.2" ry="2.4" fill="#FF7A93"/></g>
      <g class="oyen-mouth-hiss">
        <path class="oyen-mouth-in" d="M90 106 Q100 103 110 106 Q108.5 118 100 118 Q91.5 118 90 106 Z"/>
        <ellipse cx="100" cy="115.4" rx="4.6" ry="2.2" fill="#FF7A93"/>
        <path class="oyen-fang" d="M92.6 106 L94.6 111.2 L96.8 105.1 Z M103.2 105.1 L105.4 111.2 L107.4 106 Z"/>
      </g>
      <g class="oyen-fx-anger" transform="translate(157 42)"><path class="oyen-angmark oyen-fb" d="M-3 -9 Q-3 -3 -9 -3 M3 -9 Q3 -3 9 -3 M-3 9 Q-3 3 -9 3 M3 9 Q3 3 9 3"/></g>
      <g class="oyen-fx-sweat"><g class="oyen-drip">
        <path d="M147 56 Q153 65 147 69 Q141 65 147 56 Z" fill="#8FD3F4" stroke="#4BA3D0" stroke-width="1.2"/>
        <ellipse cx="145.6" cy="64.5" rx="1.1" ry="1.8" fill="#fff" opacity=".8"/>
      </g></g>
      <g class="oyen-acc oyen-acc-glasses">
        <circle cx="80" cy="89" r="13.5" fill="#fff" fill-opacity=".16" stroke="#3B2A1E" stroke-width="2.6"/>
        <circle cx="120" cy="89" r="13.5" fill="#fff" fill-opacity=".16" stroke="#3B2A1E" stroke-width="2.6"/>
        <path d="M93.5 87 Q100 83 106.5 87 M66.5 87 L52 83 M133.5 87 L148 83" fill="none" stroke="#3B2A1E" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M72 82 l4 -3 M112 82 l4 -3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>
      </g>
      <g class="oyen-acc oyen-acc-blangkon">
        <path d="M70 66 Q68 38 100 36 Q132 38 130 66 Q116 58 100 58 Q84 58 70 66 Z" fill="#5A3220" stroke="#2E1A10" stroke-width="2" stroke-linejoin="round"/>
        ${blangkonMarks()}
        <path d="M71.5 62.5 Q86 55 100 55 Q114 55 128.5 62.5" fill="none" stroke="#C99A3B" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M86 40 Q100 36 114 40" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".25"/>
      </g>
      <g class="oyen-acc oyen-acc-crown">
        <path d="M74 54 L72 30 L86 42 L100 24 L114 42 L128 30 L126 54 Q100 48 74 54 Z" fill="#F7C948" stroke="#B8862B" stroke-width="2" stroke-linejoin="round"/>
        <path d="M75 49.5 Q100 44 125 49.5" fill="none" stroke="#B8862B" stroke-width="1.4"/>
        <circle cx="72" cy="30" r="2.8" fill="#F7C948" stroke="#B8862B" stroke-width="1.2"/>
        <circle cx="100" cy="24" r="3" fill="#F7C948" stroke="#B8862B" stroke-width="1.2"/>
        <circle cx="128" cy="30" r="2.8" fill="#F7C948" stroke="#B8862B" stroke-width="1.2"/>
        <circle cx="100" cy="42" r="3.6" fill="#E63946" stroke="#9E1C28" stroke-width="1"/>
        <circle cx="85" cy="46" r="2.3" fill="#2A9D8F"/>
        <circle cx="115" cy="46" r="2.3" fill="#2A9D8F"/>
        <circle cx="98.8" cy="40.8" r="1" fill="#fff" opacity=".8"/>
      </g>
    </g></g>
    <g class="oyen-stomp"><path class="oyen-arm-o" d="M132 146 L161 113"/><path class="oyen-arm-f" d="M132 146 L161 113"/>${paw(161, 113)}</g>
  </g></g></g>
  <g class="oyen-fx-alert" transform="translate(160 30)"><g class="oyen-pop oyen-fb">
    <path d="M-9 -16 L-13 -21 M9 -16 L13 -21 M-12 -6 L-18 -7 M12 -6 L18 -7" stroke="#E63946" stroke-width="2.2" stroke-linecap="round"/>
    <rect x="-3.4" y="-17" width="6.8" height="15" rx="3.4" fill="#E63946"/>
    <circle cx="0" cy="4.5" r="3.6" fill="#E63946"/>
  </g></g>
  <g class="oyen-fx-q" transform="translate(160 32)"><g class="oyen-qa oyen-fb">
    <path d="M-6 -9 Q-6 -17 1 -17 Q8 -17 8 -10 Q8 -5 1 -2 L1 3" fill="none" stroke="#5468FF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="1" cy="10" r="2.7" fill="#5468FF"/>
  </g></g>
  <g class="oyen-fx-zzz">
    <g transform="translate(138 52)"><path class="oyen-z oyen-fb" d="${ZED}"/></g>
    <g transform="translate(150 34) scale(1.3)"><path class="oyen-z oyen-fb" style="animation-delay:-1s" d="${ZED}"/></g>
    <g transform="translate(164 14) scale(1.6)"><path class="oyen-z oyen-fb" style="animation-delay:-2s" d="${ZED}"/></g>
  </g>
  <g class="oyen-fx-hearts">
    <g transform="translate(158 70)"><path class="oyen-heart oyen-fb" fill="#FF6B8B" d="${HEART}"/></g>
    <g transform="translate(170 52) scale(.8)"><path class="oyen-heart oyen-fb" fill="#FF6B8B" style="animation-delay:-1s" d="${HEART}"/></g>
  </g>
</g>
<g class="oyen-bowl-food">
  <path d="M12 178 Q13 194 30 194 Q47 194 48 178 Z" fill="#D9483B" stroke="#8E2A20" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="30" cy="178" rx="18" ry="4.5" fill="#F06A55" stroke="#8E2A20" stroke-width="2"/>
  <path d="M16 178 Q30 168 44 178 Z" fill="#A0652E"/>
  <circle cx="24" cy="175" r="1.6" fill="#C78A4A"/><circle cx="31" cy="173" r="1.6" fill="#C78A4A"/><circle cx="37" cy="176" r="1.6" fill="#C78A4A"/>
  <circle cx="22" cy="186" r="1.4" fill="#fff" opacity=".8"/><circle cx="30" cy="188" r="1.4" fill="#fff" opacity=".8"/><circle cx="38" cy="186" r="1.4" fill="#fff" opacity=".8"/>
</g>
<g class="oyen-bowl-water">
  <path d="M12 178 Q13 194 30 194 Q47 194 48 178 Z" fill="#2F7FCF" stroke="#1C4F85" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="30" cy="178" rx="18" ry="4.5" fill="#5AA9F0" stroke="#1C4F85" stroke-width="2"/>
  <ellipse cx="30" cy="178" rx="15" ry="3.2" fill="#BDEBFF"/>
  <ellipse class="oyen-ripple oyen-fb" cx="30" cy="178" rx="9" ry="2" fill="none" stroke="#fff" stroke-width="1.2"/>
  <path d="M20 187 q3 -2 6 0 M34 187 q3 -2 6 0" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>
</g>
</svg>`;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function ensureStyle(doc) {
  if (!doc || doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  (doc.head || doc.documentElement).appendChild(style);
}

function scaleFor(level) {
  return 1 + (Math.min(level - 1, 7) / 7) * 0.25;
}

function clampAnger(n) {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) ? Math.min(3, Math.max(0, v)) : 0;
}

// Tambahan gaya khusus snapshot: animasi dibekukan agar pose statis.
const SNAP_CSS = '\n*{animation:none!important;transition:none!important}.oyen-root{container-type:normal!important}\n';
const SVG_NS = 'http://www.w3.org/2000/svg';

function accFor(level) {
  const a = [];
  if (level >= 2 && level < 5) a.push('bandana');
  if (level >= 5) a.push('selendang');
  if (level >= 3) a.push('bell');
  if (level >= 4 && level < 8) a.push('blangkon');
  if (level >= 8) a.push('crown');
  if (level >= 6) a.push('glasses');
  if (level >= 7) a.push('aura');
  return a.join(' ');
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
export function createOyen(container) {
  const doc = (container && container.ownerDocument) || document;
  ensureStyle(doc);

  const root = doc.createElement('div');
  root.className = 'oyen-root';
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', 'Oyen, kucing oranye penjaga postur');
  root.innerHTML = MARKUP;
  const bubble = root.querySelector('.oyen-bubble');

  let mood = 'neutral';
  let level = 1;
  let anger = 0;
  let noiseBuf = null;
  const snapCache = new Map();
  let lastDroop = '';
  let muted = false;
  let destroyed = false;
  let sayTimer = 0;
  let feeding = false;
  let restoreMood = 'neutral';
  let feedTimer = 0;
  let feedResolvers = [];
  let ctx = null;
  let master = null;

  root.setAttribute('data-mood', mood);
  root.setAttribute('data-anger', '0');

  function applyMood(m) {
    root.setAttribute('data-mood', m);
  }

  function setMood(m) {
    const next = MOODS.includes(m) ? m : 'neutral';
    if (feeding) { restoreMood = next; return; }
    if (next === mood) return;
    mood = next;
    applyMood(mood);
  }

  function getMood() {
    return feeding ? 'eat' : mood;
  }

  function setPostureScore(score) {
    let droop = 0;
    if (score !== null && score !== undefined) {
      const s = Number(score);
      if (Number.isFinite(s)) droop = 1 - Math.min(1, Math.max(0, s));
    }
    const v = droop.toFixed(3);
    if (v === lastDroop) return;
    lastDroop = v;
    root.style.setProperty('--droop', v);
  }

  function setLevel(n) {
    const lv = Math.max(1, Math.floor(Number(n)) || 1);
    level = lv;
    const scale = scaleFor(lv);
    root.style.setProperty('--oyen-scale', scale.toFixed(3));
    root.setAttribute('data-level', String(lv));
    root.setAttribute('data-acc', accFor(lv));
  }

  // Intensitas marah 0..3 (hanya tulis atribut; murah dipanggil tiap frame).
  function setAnger(n) {
    const a = clampAnger(n);
    if (a === anger) return;
    anger = a;
    root.setAttribute('data-anger', String(a));
  }

  // ---- suara (Web Audio, disintesis) ----
  function getCtx() {
    if (!ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    return ctx;
  }

  function tone(c, t0, dur, freqs, peak, opts = {}) {
    const osc = c.createOscillator();
    osc.type = opts.type || 'sawtooth';
    const n = freqs.length;
    osc.frequency.setValueAtTime(freqs[0], t0);
    for (let i = 1; i < n; i++) osc.frequency.exponentialRampToValueAtTime(freqs[i], t0 + (dur * i) / (n - 1));

    const filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.Q.value = opts.q != null ? opts.q : 4;
    const fc = opts.filter || [1000, 2400, 1200];
    filt.frequency.setValueAtTime(fc[0], t0);
    for (let i = 1; i < fc.length; i++) filt.frequency.linearRampToValueAtTime(fc[i], t0 + (dur * i) / (fc.length - 1));

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.05, dur * 0.25));
    g.gain.exponentialRampToValueAtTime(peak * 0.7, t0 + dur * 0.65);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(filt);
    filt.connect(g);
    g.connect(master);

    if (opts.vib) {
      const v = c.createOscillator();
      const vg = c.createGain();
      v.frequency.value = opts.vib[0];
      vg.gain.value = opts.vib[1];
      v.connect(vg);
      vg.connect(osc.frequency);
      v.start(t0);
      v.stop(t0 + dur + 0.05);
    }
    if (opts.trill) {
      const lfo = c.createOscillator();
      const lg = c.createGain();
      lfo.frequency.value = opts.trill;
      lg.gain.value = peak * 0.6;
      lfo.connect(lg);
      lg.connect(g.gain);
      lfo.start(t0);
      lfo.stop(t0 + dur * (opts.trillPortion || 1));
    }
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // Desis: derau putih lewat bandpass ~3–5 kHz.
  function hiss(c, t0, dur, peak) {
    if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
      const len = Math.floor(c.sampleRate * 0.6);
      noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(3200, t0);
    bp.frequency.linearRampToValueAtTime(4800, t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(peak * 0.6, t0 + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  function play(kind) {
    const c = ctx;
    if (!c || destroyed || muted) return;
    const t = c.currentTime + 0.02;
    if (kind === 'happy') {
      tone(c, t, 0.16, [700, 1050], 0.11, { filter: [1500, 2600] });
      tone(c, t + 0.19, 0.28, [820, 1250, 900], 0.12, { filter: [1500, 3000, 1400] });
      tone(c, t + 0.05, 0.6, [48, 46], 0.06, { filter: [380, 300], q: 1, trill: 24 });
    } else if (kind === 'alert') {
      tone(c, t, 0.75, [330, 360, 980, 720], 0.2, { filter: [700, 1000, 3200, 1500], q: 5, trill: 32, trillPortion: 0.35 });
    } else if (kind === 'angry') {
      // "Hhhh... mrr-RAAOW!": desis, geram rendah, lalu meong naik bervibrato
      hiss(c, t, 0.42, 0.24);
      tone(c, t + 0.36, 0.26, [95, 120], 0.12, { filter: [420, 600], q: 2, trill: 30 });
      tone(c, t + 0.52, 0.55, [300, 520, 820, 600], 0.2, { filter: [700, 2000, 3200, 1400], q: 5, vib: [9, 28] });
    } else {
      tone(c, t, 0.38, [620, 880, 560], 0.12, { filter: [900, 2200, 900], q: 3 });
    }
  }

  function meow(kind = 'soft') {
    if (muted || destroyed) return;
    try {
      const c = getCtx();
      if (!c) return;
      if (c.state === 'running') { play(kind); return; }
      // Konteks tertahan (autoplay policy): coba resume; mainkan hanya bila cepat berhasil
      const asked = Date.now();
      const p = c.resume && c.resume();
      if (p && typeof p.then === 'function') {
        p.then(() => { if (Date.now() - asked < 400) { try { play(kind); } catch { /* abaikan */ } } })
          .catch(() => { /* abaikan */ });
      }
    } catch { /* abaikan */ }
  }

  function setMuted(b) {
    muted = !!b;
  }

  // ---- makan ----
  function endFeed() {
    feedTimer = 0;
    feeding = false;
    mood = restoreMood;
    applyMood(mood);
    const rs = feedResolvers;
    feedResolvers = [];
    rs.forEach((r) => r());
  }

  function feed() {
    return new Promise((resolve) => {
      if (destroyed) { resolve(); return; }
      feedResolvers.push(resolve);
      if (!feeding) {
        feeding = true;
        restoreMood = mood;
        applyMood('eat');
      }
      meow('happy'); // dipanggil sinkron agar AudioContext dibuka dalam gesture pengguna
      clearTimeout(feedTimer);
      feedTimer = setTimeout(endFeed, 2500);
    });
  }

  // ---- balon ucapan ----
  function say(text, ms = 3000) {
    if (destroyed || !bubble) return;
    clearTimeout(sayTimer);
    sayTimer = 0;
    const str = text == null ? '' : String(text);
    if (!str) { bubble.classList.remove('oyen-show'); return; }
    bubble.textContent = str;
    bubble.classList.add('oyen-show');
    const dur = Number(ms);
    if (dur > 0) sayTimer = setTimeout(() => { bubble.classList.remove('oyen-show'); sayTimer = 0; }, dur);
  }

  // ---- snapshot PNG (untuk ikon Notification; tanpa animasi) ----
  async function renderSnapshot(m, a, lv, sz) {
    const win = doc.defaultView || globalThis;
    const XS = win.XMLSerializer || globalThis.XMLSerializer;
    const Img = win.Image || globalThis.Image;
    const src = root.querySelector('.oyen-svg');
    if (!src || !XS || !Img) return null;

    const svg = src.cloneNode(true);
    svg.removeAttribute('class');
    svg.removeAttribute('aria-hidden');
    svg.removeAttribute('focusable');
    svg.setAttribute('width', String(sz));
    svg.setAttribute('height', String(sz));
    svg.setAttribute('viewBox', '-10 -20 220 220');

    const g = doc.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'oyen-root');
    g.setAttribute('data-mood', m);
    g.setAttribute('data-anger', String(a));
    g.setAttribute('data-level', String(lv));
    g.setAttribute('data-acc', accFor(lv));
    g.setAttribute('style', `--oyen-scale:${scaleFor(lv).toFixed(3)};--droop:0`);
    while (svg.firstChild) g.appendChild(svg.firstChild);
    const style = doc.createElementNS(SVG_NS, 'style');
    style.textContent = CSS + SNAP_CSS;
    svg.appendChild(style);
    svg.appendChild(g);

    const xml = new XS().serializeToString(svg);
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    const img = new Img();
    await new Promise((resolve, reject) => {
      const to = setTimeout(() => reject(new Error('timeout')), 4000);
      img.onload = () => { clearTimeout(to); resolve(); };
      img.onerror = () => { clearTimeout(to); reject(new Error('load')); };
      img.src = url;
    });
    const canvas = doc.createElement('canvas');
    canvas.width = sz;
    canvas.height = sz;
    const c2 = canvas.getContext('2d');
    if (!c2) return null;
    c2.drawImage(img, 0, 0, sz, sz);
    return canvas.toDataURL('image/png');
  }

  function snapshot({ mood: sm = 'angry', anger: sa = 3, level: sl, size = 192 } = {}) {
    try {
      const m = MOODS.includes(sm) ? sm : 'neutral';
      const a = clampAnger(sa);
      const lv = Math.max(1, Math.floor(Number(sl == null ? level : sl)) || 1);
      const sz = Math.min(1024, Math.max(16, Math.round(Number(size)) || 192));
      const key = `${m}|${a}|${lv}|${sz}`;
      const hit = snapCache.get(key);
      if (hit) return hit;
      const p = renderSnapshot(m, a, lv, sz)
        .catch(() => null)
        .then((u) => { if (!u) snapCache.delete(key); return u || null; });
      snapCache.set(key, p);
      return p;
    } catch {
      return Promise.resolve(null);
    }
  }

  // ---- DOM ----
  function mount(newContainer) {
    if (destroyed || !newContainer) return;
    ensureStyle(newContainer.ownerDocument);
    newContainer.appendChild(root); // appendChild otomatis meng-adopt node ke dokumen baru
  }

  function destroy() {
    if (destroyed) return;
    clearTimeout(sayTimer);
    if (feedTimer) { clearTimeout(feedTimer); endFeed(); }
    destroyed = true;
    try { root.remove(); } catch { /* abaikan */ }
    if (ctx) { try { const p = ctx.close(); if (p && p.catch) p.catch(() => {}); } catch { /* abaikan */ } }
    ctx = null;
    master = null;
    noiseBuf = null;
  }

  setLevel(level);
  setPostureScore(null);
  if (container) container.appendChild(root);

  return {
    setMood,
    getMood,
    setPostureScore,
    setLevel,
    setAnger,
    feed,
    say,
    meow,
    setMuted,
    mount,
    destroy,
    snapshot,
    el: root,
  };
}
