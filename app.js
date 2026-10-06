/* Cabine 2000: cabine de fotos online com clima anos 2000.
   Tudo roda no navegador. Nenhuma foto é enviada para servidor. */
"use strict";

const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------------ configurações */
const LAYOUTS = {
  tira4: { nome: "Tirinha 4", cols: 1, rows: 4, pw: 520, ph: 390 },
  tira3: { nome: "Tirinha 3", cols: 1, rows: 3, pw: 520, ph: 390 },
  dupla: { nome: "Dupla", cols: 1, rows: 2, pw: 600, ph: 450 },
  grade: { nome: "Grade 2×2", cols: 2, rows: 2, pw: 480, ph: 360 },
};
const MARGEM = 40, ESPACO = 20, RODAPE = 170;

const FILTROS = {
  normal: "Normal",
  digicam: "Digicam 2003",
  flash: "Flash estourado",
  pb: "P&B cabine",
  webcam: "Webcam MSN",
};
// aproximação do filtro na prévia ao vivo da câmera
const FILTRO_CSS = {
  normal: "none",
  digicam: "sepia(.25) saturate(1.35) contrast(1.08)",
  flash: "brightness(1.3) contrast(1.35) saturate(.85)",
  pb: "grayscale(1) contrast(1.25)",
  webcam: "saturate(.7) hue-rotate(-12deg) contrast(.95) blur(.6px)",
};

const MOLDURAS = {
  rosa: { nome: "Rosa Y2K", cor: "#ff4fc3" },
  cromado: { nome: "Cromado", cor: "#9fb4d6" },
  rede: { nome: "Rede social 2004", cor: "#6d9eeb" },
  digicam: { nome: "Câmera preta", cor: "#1a1a1a" },
  emo: { nome: "Xadrez emo", cor: "#111111" },
  glitter: { nome: "Glitter rosa", cor: "#ff3d9a" },
  oncinha: { nome: "Oncinha", cor: "#d9a066" },
  celular: { nome: "Celular flip", cor: "#ff8cc8" },
  camera: { nome: "Câmera digital", cor: "#c3c9d6" },
  festa: { nome: "Festa", cor: "#ffc2e0" },
  polaroid: { nome: "Polaroid", cor: "#fbf8f1" },
  story: { nome: "Pôr do sol", cor: "#ff5a7e" },
  coquette: { nome: "Coquette", cor: "#ffc2df" },
  holografico: { nome: "Holográfico", cor: "#c9f0ff" },
  galaxia: { nome: "Galáxia", cor: "#3a1c71" },
  filme: { nome: "Filme analógico", cor: "#4a2a12" },
};

/* Pacote de adesivos em imagem: arquivos na pasta adesivos/ */
const PACOTE = [
  "estrela-glitter-rosa", "estrela-glitter-prata", "estrela-glitter-dourada", "estrela-cromada", "estrela-bolha-cromada",
  "estrela-zebra", "estrela-neon", "coracao-glitter", "coracao-oncinha", "coracao-gema", "globo-de-luz", "globo-de-luz-rosa",
  "laco-brilhante", "laco-oncinha", "cereja-brilhante", "cereja-oncinha", "boca-glitter", "borboleta-glitter",
  "celular-flip", "camera-digital", "fita-cassete", "cd-holografico", "bola-8-rosa", "oculos-estrela", "oculos-pixel",
  "bigode-glitter", "chapeu-festa", "coquetel", "dado-felpudo", "cruz-strass", "clipe-coracao", "fita-xadrez", "bandeirinhas",
  "texto-2000s-baby", "texto-xoxo", "texto-diva", "placa-no-boys", "placa-selfie", "placa-amo-2000", "claquete",
];
const IMAGENS = {};
function imagem(nome) {
  if (!IMAGENS[nome]) {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => { if ($("tela-editor").classList.contains("ativa")) compor(); };
    im.src = `adesivos/${nome}.webp`;
    IMAGENS[nome] = im;
  }
  return IMAGENS[nome];
}
PACOTE.forEach(imagem);
const GRUPOS_ADESIVOS = [
  ["Glitter Y2K", PACOTE.map((n) => "arq:" + n)],
  ["Anos 2000", ["coracao", "estrela", "brilho", "flor", "borboleta", "celular", "cd", "xoxo", "bff", "lol", "bolha"]],
  ["Instagramáveis", ["lacinho", "fita", "cereja", "beijo", "coroa", "nuvem", "arcoiris", "oculos", "balao", "local", "curtidas", "musica", "slider", "tbt", "sextou", "mood", "ootd", "amovcs", "bestday"]],
];
const TAGS = {
  tbt: ["#tbt", "#ff4fc3", "#ffffff"],
  sextou: ["#sextou", "#ff8a00", "#ffffff"],
  mood: ["mood", "#ffffff", "#8a5cff"],
  ootd: ["OOTD", "#111111", "#ffffff"],
  amovcs: ["amo vcs ♥", "#ff2f6d", "#ffffff"],
  bestday: ["best day ever", "#ffffff", "#3fb6ff"],
};

/* ------------------------------------------------------------------ estado */
const estado = {
  modo: "camera",          // camera | upload
  layout: "tira4",
  filtro: "digicam",
  moldura: "rosa",
  fotos: [],               // canvases 4:3 já recortados
  adesivos: [],            // {tipo, x, y, tam, rot}
  selecionado: -1,
  legenda: "",
  mostrarData: true,
  espelhar: true,
  data: new Date(),
};
const cacheFiltro = new Map();

/* ------------------------------------------------------------------ navegação */
function mostrarTela(nome) {
  document.querySelectorAll(".tela").forEach((t) => t.classList.toggle("ativa", t.id === `tela-${nome}`));
  if (nome !== "camera") pararCamera();
  if (nome === "camera") iniciarCamera();
  if (nome === "upload") desenharSlots();
  if (nome === "editor") { cacheFiltro.clear(); compor(); }
  window.scrollTo({ top: 0 });
  const titulo = document.querySelector(`#tela-${nome} h1, #tela-${nome} h2`);
  if (titulo) { titulo.setAttribute("tabindex", "-1"); titulo.focus({ preventScroll: true }); }
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-ir]");
  if (!b) return;
  if (b.dataset.modo) estado.modo = b.dataset.modo;
  mostrarTela(b.dataset.ir);
});

/* contador de visitas: só deste aparelho */
try {
  const n = Number(localStorage.getItem("cabine2000-visitas") || 0) + 1;
  localStorage.setItem("cabine2000-visitas", String(n));
  $("contador").textContent = String(n).padStart(6, "0");
} catch { /* navegação privada: mantém o valor padrão */ }

/* ------------------------------------------------------------------ chips genéricos */
function montarChips(el, opcoes, atual, aoEscolher, amostra) {
  el.innerHTML = "";
  for (const [id, rot] of Object.entries(opcoes)) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(id === atual));
    b.innerHTML = (amostra ? `<span class="amostra" style="background:${amostra(id)}"></span>` : "") + (typeof rot === "string" ? rot : rot.nome);
    b.addEventListener("click", () => {
      el.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-checked", String(c === b)));
      aoEscolher(id);
    });
    el.appendChild(b);
  }
}

/* ------------------------------------------------------------------ layouts */
function montarLayouts() {
  const g = $("grade-layouts");
  g.innerHTML = "";
  for (const [id, l] of Object.entries(LAYOUTS)) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "card-layout"; b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(id === estado.layout));
    b.innerHTML = `<span class="mini-layout" style="grid-template-columns:repeat(${l.cols},auto)">${"<i></i>".repeat(l.cols * l.rows)}</span>${l.nome}`;
    b.addEventListener("click", () => {
      estado.layout = id;
      g.querySelectorAll(".card-layout").forEach((c) => c.setAttribute("aria-checked", String(c === b)));
    });
    g.appendChild(b);
  }
}
const totalFotos = () => LAYOUTS[estado.layout].cols * LAYOUTS[estado.layout].rows;
$("btn-continuar-layout").addEventListener("click", () => {
  estado.fotos = []; estado.adesivos = []; estado.selecionado = -1;
  mostrarTela(estado.modo === "camera" ? "camera" : "upload");
});

/* ------------------------------------------------------------------ recorte 4:3 */
function recortar43(fonte, largura, altura, espelhar = false) {
  const W = 960, H = 720;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const r = W / H;
  let sw = largura, sh = largura / r;
  if (sh > altura) { sh = altura; sw = altura * r; }
  const sx = (largura - sw) / 2, sy = (altura - sh) / 2;
  if (espelhar) { ctx.translate(W, 0); ctx.scale(-1, 1); }
  ctx.drawImage(fonte, sx, sy, sw, sh, 0, 0, W, H);
  return c;
}

/* ------------------------------------------------------------------ câmera */
let fluxo = null, disparando = false;
const video = $("video");

function dataDigicam(d = estado.data) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())} ${p(d.getMonth() + 1)} '${String(d.getFullYear()).slice(2)}`;
}

async function iniciarCamera() {
  estado.fotos = [];
  $("miniaturas-camera").innerHTML = "";
  $("hud-data").textContent = dataDigicam();
  atualizarHud();
  $("btn-disparar").disabled = false;
  $("btn-disparar").textContent = "● Começar";
  video.classList.toggle("espelhado", estado.espelhar);
  aplicarFiltroVideo();
  const aviso = $("aviso-camera");
  aviso.hidden = true;
  if (!navigator.mediaDevices?.getUserMedia) {
    aviso.innerHTML = "Este navegador não permite usar a câmera.<br>Use a opção <b>Carregar fotos</b> no menu.";
    aviso.hidden = false; $("btn-disparar").disabled = true; return;
  }
  try {
    fluxo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
    video.srcObject = fluxo;
    await video.play().catch(() => {});
  } catch (e) {
    aviso.innerHTML = "Não foi possível abrir a câmera.<br>Verifique se você permitiu o acesso à câmera no navegador, ou use <b>Carregar fotos</b>.";
    aviso.hidden = false; $("btn-disparar").disabled = true;
  }
}
function pararCamera() {
  if (fluxo) { fluxo.getTracks().forEach((t) => t.stop()); fluxo = null; }
  video.srcObject = null;
  disparando = false;
}
function aplicarFiltroVideo() { video.style.filter = FILTRO_CSS[estado.filtro] || "none"; }
function atualizarHud() { $("hud-contagem").textContent = `${Math.min(estado.fotos.length + 1, totalFotos())}/${totalFotos()}`; }

montarChips($("chips-filtro-camera"), FILTROS, estado.filtro, (id) => { estado.filtro = id; aplicarFiltroVideo(); });

$("btn-espelhar").addEventListener("click", (e) => {
  estado.espelhar = !estado.espelhar;
  e.currentTarget.setAttribute("aria-pressed", String(estado.espelhar));
  video.classList.toggle("espelhado", estado.espelhar);
});
$("btn-camera-voltar").addEventListener("click", () => mostrarTela("layout"));

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function contagem() {
  const el = $("contagem");
  for (const n of ["3", "2", "1"]) {
    if (!disparando) return false;
    el.textContent = n; await esperar(850);
  }
  el.textContent = "";
  return disparando;
}
$("btn-disparar").addEventListener("click", async () => {
  if (disparando || !fluxo) return;
  disparando = true;
  estado.fotos = []; $("miniaturas-camera").innerHTML = "";
  const btn = $("btn-disparar");
  btn.disabled = true; $("led").classList.add("gravando");
  for (let i = 0; i < totalFotos(); i++) {
    atualizarHud();
    btn.textContent = `Foto ${i + 1} de ${totalFotos()}`;
    if (!(await contagem())) break;
    const flash = $("flash"); flash.classList.remove("ativo"); void flash.offsetWidth; flash.classList.add("ativo");
    const foto = recortar43(video, video.videoWidth, video.videoHeight, estado.espelhar);
    estado.fotos.push(foto);
    const img = document.createElement("img"); img.alt = `Foto ${i + 1}`; img.src = foto.toDataURL("image/jpeg", .6);
    $("miniaturas-camera").appendChild(img);
    await esperar(700);
  }
  $("led").classList.remove("gravando");
  btn.disabled = false; btn.textContent = "● Começar";
  const completo = disparando && estado.fotos.length === totalFotos();
  disparando = false;
  if (completo) { estado.data = new Date(); mostrarTela("editor"); }
});

/* ------------------------------------------------------------------ upload */
let slotAlvo = 0;
function desenharSlots() {
  const s = $("slots");
  s.style.gridTemplateColumns = totalFotos() === 2 ? "repeat(2, minmax(0,1fr))" : "repeat(2, minmax(0,1fr))";
  s.innerHTML = "";
  for (let i = 0; i < totalFotos(); i++) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "slot" + (estado.fotos[i] ? " cheio" : "");
    b.setAttribute("aria-label", estado.fotos[i] ? `Trocar foto ${i + 1}` : `Escolher foto ${i + 1}`);
    b.innerHTML = estado.fotos[i] ? `<img alt="" src="${estado.fotos[i].toDataURL("image/jpeg", .6)}">` : `+ foto ${i + 1}`;
    b.addEventListener("click", () => { slotAlvo = i; $("input-uma").click(); });
    s.appendChild(b);
  }
  $("btn-pronto-upload").disabled = estado.fotos.filter(Boolean).length < totalFotos();
}
function carregarArquivo(arquivo) {
  return new Promise((ok, erro) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => { const c = recortar43(img, img.naturalWidth, img.naturalHeight); URL.revokeObjectURL(url); ok(c); };
    img.onerror = () => { URL.revokeObjectURL(url); erro(new Error("imagem inválida")); };
    img.src = url;
  });
}
$("btn-varias").addEventListener("click", () => $("input-varias").click());
$("input-varias").addEventListener("change", async (e) => {
  const arquivos = [...e.target.files].filter((f) => f.type.startsWith("image/"));
  let i = 0;
  for (const f of arquivos) {
    while (i < totalFotos() && estado.fotos[i]) i++;
    if (i >= totalFotos()) break;
    try { estado.fotos[i] = await carregarArquivo(f); } catch { /* ignora arquivo inválido */ }
  }
  e.target.value = "";
  desenharSlots();
});
$("input-uma").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (f) { try { estado.fotos[slotAlvo] = await carregarArquivo(f); } catch { alertaSuave("Não foi possível abrir essa imagem."); } }
  e.target.value = "";
  desenharSlots();
});
$("btn-pronto-upload").addEventListener("click", () => { estado.data = new Date(); mostrarTela("editor"); });
function alertaSuave(msg) {
  const p = document.createElement("p"); p.className = "dica"; p.textContent = msg; p.setAttribute("role", "status");
  $("slots").after(p); setTimeout(() => p.remove(), 3500);
}

/* ------------------------------------------------------------------ filtros (pixel a pixel) */
function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function fotoFiltrada(i, w, h) {
  const chave = `${i}|${estado.filtro}|${w}x${h}`;
  if (cacheFiltro.has(chave)) return cacheFiltro.get(chave);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const fonte = estado.fotos[i];
  const f = estado.filtro;
  if (f === "webcam") {
    // baixa resolução de webcam: reduz e amplia sem suavizar
    const p = document.createElement("canvas"); p.width = 176; p.height = 132;
    p.getContext("2d").drawImage(fonte, 0, 0, 176, 132);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(p, 0, 0, w, h);
  } else {
    ctx.drawImage(fonte, 0, 0, w, h);
  }
  if (f !== "normal") {
    const img = ctx.getImageData(0, 0, w, h); const d = img.data;
    const r = rand(i * 7919 + 17);
    for (let k = 0; k < d.length; k += 4) {
      let R = d[k], G = d[k + 1], B = d[k + 2];
      const lum = 0.299 * R + 0.587 * G + 0.114 * B;
      if (f === "digicam") {
        R = (R - 128) * 1.08 + 128 + 14; G = (G - 128) * 1.08 + 128 + 4; B = (B - 128) * 1.05 + 128 - 12;
        const s = 1.25; R = lum + (R - lum) * s; G = lum + (G - lum) * s; B = lum + (B - lum) * s;
        const n = (r() - 0.5) * 22; R += n; G += n; B += n;
      } else if (f === "flash") {
        R = (R - 110) * 1.4 + 150; G = (G - 110) * 1.4 + 148; B = (B - 110) * 1.35 + 150;
        const s = 0.85; R = lum + (R - lum) * s; G = lum + (G - lum) * s; B = lum + (B - lum) * s;
      } else if (f === "pb") {
        let v = (lum - 128) * 1.3 + 128 + (r() - 0.5) * 26;
        R = G = B = v;
      } else if (f === "webcam") {
        const s = 0.7; R = lum + (R - lum) * s - 6; G = lum + (G - lum) * s + 6; B = lum + (B - lum) * s + 10;
        const n = (r() - 0.5) * 14; R += n; G += n; B += n;
      }
      d[k] = R; d[k + 1] = G; d[k + 2] = B;
    }
    ctx.putImageData(img, 0, 0);
    // vinheta (digicam e P&B) e brilho central (flash)
    if (f === "digicam" || f === "pb") {
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .72);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, f === "pb" ? "rgba(0,0,0,.55)" : "rgba(40,10,0,.4)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    } else if (f === "flash") {
      const g = ctx.createRadialGradient(w / 2, h * .45, 0, w / 2, h * .45, Math.max(w, h) * .6);
      g.addColorStop(0, "rgba(255,255,255,.28)"); g.addColorStop(1, "rgba(0,0,0,.35)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
  }
  cacheFiltro.set(chave, c);
  return c;
}

/* ------------------------------------------------------------------ desenhos (molduras e adesivos) */
function caminhoCoracao(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * .3);
  ctx.bezierCurveTo(x, y, x - s * .5, y - s * .05, x - s * .5, y + s * .28);
  ctx.bezierCurveTo(x - s * .5, y + s * .55, x - s * .1, y + s * .7, x, y + s * .85);
  ctx.bezierCurveTo(x + s * .1, y + s * .7, x + s * .5, y + s * .55, x + s * .5, y + s * .28);
  ctx.bezierCurveTo(x + s * .5, y - s * .05, x, y, x, y + s * .3);
  ctx.closePath();
}
function caminhoEstrela(ctx, x, y, rExt, rInt, pontas = 5) {
  ctx.beginPath();
  for (let i = 0; i < pontas * 2; i++) {
    const r = i % 2 ? rInt : rExt;
    const a = -Math.PI / 2 + (i * Math.PI) / pontas;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}
function caixaArredondada(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function textoContorno(ctx, txt, x, y, preench, contorno, larg = 6) {
  ctx.lineJoin = "round"; ctx.lineWidth = larg; ctx.strokeStyle = contorno; ctx.strokeText(txt, x, y);
  ctx.fillStyle = preench; ctx.fillText(txt, x, y);
}

function nuvemEm(ctx, x, y, s) {
  const cs = [[-.22, .05, .2], [0, -.08, .26], [.24, .04, .2], [0, .12, .2]];
  ctx.save(); ctx.lineWidth = Math.max(3, s * .09); ctx.strokeStyle = "#2a1840";
  cs.forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(x + a * s, y + b * s, r * s, 0, Math.PI * 2); ctx.stroke(); });
  ctx.fillStyle = "#ffffff";
  cs.forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(x + a * s, y + b * s, r * s, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
}
/** Etiqueta no estilo stories: texto em pílula, largura ajustada ao texto. */
function etiqueta(ctx, s, txt, fundo, cor, icone) {
  let f = s * .3;
  const fonte = () => { ctx.font = `700 ${f}px Fredoka, sans-serif`; };
  fonte();
  let tw = ctx.measureText(txt).width;
  const max = s * 1.35 - f * .8 - (icone ? f * 1.1 : 0);
  if (tw > max) { f *= max / tw; fonte(); tw = ctx.measureText(txt).width; }
  const ic = icone ? f * 1.1 : 0;
  const w = tw + f * .8 + ic, h = f * 1.5;
  caixaArredondada(ctx, -w / 2, -h / 2, w, h, h * .35); ctx.fillStyle = fundo; ctx.fill(); ctx.stroke();
  if (icone) icone(-w / 2 + f * .4 + ic * .45, 0, f * 1.1);
  fonte(); ctx.fillStyle = cor; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(txt, -w / 2 + f * .4 + ic + tw / 2, f * .04);
}

/** Desenha um adesivo centrado em (0,0) com tamanho s. */
function desenharAdesivo(ctx, tipo, s) {
  if (tipo.startsWith("arq:")) {
    const im = imagem(tipo.slice(4));
    if (!im.complete || !im.naturalWidth) return;
    const k = s / Math.max(im.naturalWidth, im.naturalHeight);
    const w = im.naturalWidth * k, h = im.naturalHeight * k;
    ctx.drawImage(im, -w / 2, -h / 2, w, h);
    return;
  }
  const T = "#2a1840";
  ctx.lineWidth = Math.max(2, s * .05); ctx.strokeStyle = T; ctx.lineJoin = "round";
  switch (tipo) {
    case "coracao": {
      caminhoCoracao(ctx, 0, -s * .42, s);
      const g = ctx.createLinearGradient(0, -s * .4, 0, s * .45); g.addColorStop(0, "#ff9be0"); g.addColorStop(1, "#ff2fae");
      ctx.fillStyle = g; ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.ellipse(-s * .2, -s * .18, s * .09, s * .05, -0.6, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "estrela": {
      caminhoEstrela(ctx, 0, 0, s * .5, s * .22);
      const g = ctx.createLinearGradient(0, -s * .5, 0, s * .5); g.addColorStop(0, "#fff7a8"); g.addColorStop(1, "#ffc21a");
      ctx.fillStyle = g; ctx.fill(); ctx.stroke();
      break;
    }
    case "brilho": {
      caminhoEstrela(ctx, 0, 0, s * .5, s * .1, 4);
      ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.strokeStyle = "#7ad7ff"; ctx.stroke();
      caminhoEstrela(ctx, s * .32, -s * .3, s * .14, s * .03, 4); ctx.fillStyle = "#c7b3ff"; ctx.fill();
      break;
    }
    case "flor": {
      ctx.fillStyle = "#c7b3ff";
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath(); ctx.arc(Math.cos(a) * s * .25, Math.sin(a) * s * .25, s * .2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, s * .16, 0, Math.PI * 2); ctx.fillStyle = "#ffe14d"; ctx.fill(); ctx.stroke();
      break;
    }
    case "carinha": {
      ctx.beginPath(); ctx.arc(0, 0, s * .45, 0, Math.PI * 2); ctx.fillStyle = "#ffe14d"; ctx.fill(); ctx.stroke();
      ctx.fillStyle = T;
      ctx.beginPath(); ctx.ellipse(-s * .15, -s * .1, s * .05, s * .09, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(s * .15, -s * .1, s * .05, s * .09, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, s * .05, s * .24, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      ctx.fillStyle = "rgba(255,90,180,.55)";
      ctx.beginPath(); ctx.arc(-s * .28, s * .08, s * .07, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * .28, s * .08, s * .07, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "borboleta": {
      const asa = (sx, sy, rx, ry, cor) => { ctx.beginPath(); ctx.ellipse(sx, sy, rx, ry, sx < 0 ? -0.5 : 0.5, 0, Math.PI * 2); ctx.fillStyle = cor; ctx.fill(); ctx.stroke(); };
      asa(-s * .22, -s * .14, s * .22, s * .17, "#7ad7ff"); asa(s * .22, -s * .14, s * .22, s * .17, "#7ad7ff");
      asa(-s * .17, s * .17, s * .15, s * .12, "#ff9be0"); asa(s * .17, s * .17, s * .15, s * .12, "#ff9be0");
      ctx.beginPath(); ctx.ellipse(0, 0, s * .05, s * .3, 0, 0, Math.PI * 2); ctx.fillStyle = T; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -s * .28); ctx.quadraticCurveTo(-s * .1, -s * .45, -s * .16, -s * .44); ctx.moveTo(0, -s * .28); ctx.quadraticCurveTo(s * .1, -s * .45, s * .16, -s * .44); ctx.stroke();
      break;
    }
    case "celular": {
      // celular de flip genérico
      caixaArredondada(ctx, -s * .2, -s * .48, s * .4, s * .96, s * .08);
      const g = ctx.createLinearGradient(-s * .2, 0, s * .2, 0); g.addColorStop(0, "#ffd3f1"); g.addColorStop(.5, "#ffffff"); g.addColorStop(1, "#ff9be0");
      ctx.fillStyle = g; ctx.fill(); ctx.stroke();
      caixaArredondada(ctx, -s * .14, -s * .4, s * .28, s * .3, s * .03); ctx.fillStyle = "#9fe3ff"; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * .2, 0); ctx.lineTo(s * .2, 0); ctx.stroke();
      ctx.fillStyle = T;
      for (let l = 0; l < 3; l++) for (let c2 = 0; c2 < 3; c2++) { ctx.beginPath(); ctx.arc(-s * .1 + c2 * s * .1, s * .12 + l * s * .1, s * .025, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(s * .14, -s * .48); ctx.lineTo(s * .14, -s * .62); ctx.stroke();
      break;
    }
    case "cd": {
      const g = ctx.createConicGradient ? ctx.createConicGradient(0, 0, 0) : null;
      if (g) { ["#ff9be0", "#9fe3ff", "#fff7a8", "#c7b3ff", "#ff9be0"].forEach((c3, i) => g.addColorStop(i / 4, c3)); }
      ctx.beginPath(); ctx.arc(0, 0, s * .45, 0, Math.PI * 2); ctx.fillStyle = g || "#d9e2f2"; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, s * .12, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, s * .04, 0, Math.PI * 2); ctx.fillStyle = T; ctx.fill();
      break;
    }
    case "xoxo": case "bff": case "lol": {
      const txt = { xoxo: "XOXO", bff: "BFF", lol: "LOL" }[tipo];
      const cor = { xoxo: "#ff4fc3", bff: "#3fb6ff", lol: "#ffc21a" }[tipo];
      caixaArredondada(ctx, -s * .5, -s * .26, s, s * .52, s * .26);
      ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.stroke();
      ctx.font = `700 ${s * .3}px Fredoka, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      textoContorno(ctx, txt, 0, s * .02, cor, T, Math.max(2, s * .05));
      break;
    }
    case "bolha": {
      ctx.beginPath(); ctx.arc(0, 0, s * .45, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(-s * .15, -s * .15, s * .05, 0, 0, s * .45); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.6, "rgba(159,227,255,.45)"); g.addColorStop(1, "rgba(199,179,255,.75)");
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = "#7ad7ff"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-s * .16, -s * .2, s * .1, s * .05, -0.7, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
      break;
    }
    case "lacinho": {
      const cor = "#ff8fcf";
      const cauda = (d) => { ctx.beginPath(); ctx.moveTo(-d * s * .04, s * .02); ctx.lineTo(d * s * .24, s * .46); ctx.lineTo(d * s * .13, s * .42); ctx.lineTo(d * s * .06, s * .5); ctx.lineTo(d * s * -.03 + d * s * .05, s * .04); ctx.closePath(); ctx.fillStyle = "#ff6fbf"; ctx.fill(); ctx.stroke(); };
      cauda(-1); cauda(1);
      const laco = (d) => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(d * s * .22, -s * .4, d * s * .54, -s * .26, d * s * .47, -s * .02); ctx.bezierCurveTo(d * s * .52, s * .2, d * s * .24, s * .26, 0, 0); ctx.closePath(); ctx.fillStyle = cor; ctx.fill(); ctx.stroke(); };
      laco(-1); laco(1);
      caixaArredondada(ctx, -s * .08, -s * .1, s * .16, s * .19, s * .05); ctx.fillStyle = "#ff6fbf"; ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.ellipse(-s * .3, -s * .12, s * .07, s * .035, -0.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "fita": {
      ctx.save(); ctx.rotate(-0.25);
      const w = s, h = s * .3, z = s * .035;
      ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2);
      for (let i = 1; i <= 6; i++) ctx.lineTo(w / 2 + (i % 2 ? -z : 0), -h / 2 + (i * h) / 6);
      ctx.lineTo(-w / 2, h / 2);
      for (let i = 5; i >= 0; i--) ctx.lineTo(-w / 2 + (i % 2 ? z : 0), -h / 2 + (i * h) / 6);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,150,205,.9)"; ctx.fill(); ctx.lineWidth = Math.max(1, s * .02); ctx.strokeStyle = "rgba(200,60,140,.5)"; ctx.stroke();
      ctx.save(); ctx.clip(); ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = s * .04;
      for (let x = -w; x < w; x += s * .11) { ctx.beginPath(); ctx.moveTo(x, -h); ctx.lineTo(x + h * 1.5, h); ctx.stroke(); }
      ctx.restore(); ctx.restore();
      break;
    }
    case "cereja": {
      ctx.save(); ctx.strokeStyle = "#3a7d2c"; ctx.lineWidth = Math.max(2, s * .045);
      ctx.beginPath(); ctx.moveTo(-s * .2, s * .06); ctx.quadraticCurveTo(-s * .12, -s * .22, s * .04, -s * .4);
      ctx.moveTo(s * .22, s * .1); ctx.quadraticCurveTo(s * .16, -s * .2, s * .04, -s * .4); ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.ellipse(s * .17, -s * .38, s * .14, s * .06, -0.4, 0, Math.PI * 2); ctx.fillStyle = "#5cc04a"; ctx.fill(); ctx.stroke();
      [[-s * .2, s * .22], [s * .22, s * .26]].forEach(([x, y]) => {
        const g = ctx.createRadialGradient(x - s * .06, y - s * .06, s * .02, x, y, s * .21); g.addColorStop(0, "#ff7a95"); g.addColorStop(1, "#d0103a");
        ctx.beginPath(); ctx.arc(x, y, s * .2, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x - s * .07, y - s * .07, s * .05, s * .03, -0.6, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fill();
      });
      break;
    }
    case "beijo": {
      ctx.beginPath(); ctx.moveTo(-s * .45, 0);
      ctx.bezierCurveTo(-s * .3, -s * .24, -s * .12, -s * .28, 0, -s * .13);
      ctx.bezierCurveTo(s * .12, -s * .28, s * .3, -s * .24, s * .45, 0);
      ctx.bezierCurveTo(s * .3, s * .32, -s * .3, s * .32, -s * .45, 0); ctx.closePath();
      const g = ctx.createLinearGradient(0, -s * .25, 0, s * .25); g.addColorStop(0, "#ff5f97"); g.addColorStop(1, "#c8104f");
      ctx.fillStyle = g; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * .42, 0); ctx.quadraticCurveTo(0, s * .09, s * .42, 0); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-s * .1, s * .13, s * .09, s * .03, -0.2, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.fill();
      break;
    }
    case "coroa": {
      ctx.beginPath(); ctx.moveTo(-s * .42, s * .25); ctx.lineTo(-s * .46, -s * .2); ctx.lineTo(-s * .22, s * .02); ctx.lineTo(0, -s * .36);
      ctx.lineTo(s * .22, s * .02); ctx.lineTo(s * .46, -s * .2); ctx.lineTo(s * .42, s * .25); ctx.closePath();
      const g = ctx.createLinearGradient(0, -s * .36, 0, s * .25); g.addColorStop(0, "#fff3a0"); g.addColorStop(1, "#f0b400");
      ctx.fillStyle = g; ctx.fill(); ctx.stroke();
      [[-s * .46, -s * .2, "#ff4fc3"], [0, -s * .36, "#3fb6ff"], [s * .46, -s * .2, "#ff4fc3"], [-s * .2, s * .14, "#3fb6ff"], [0, s * .14, "#ff4fc3"], [s * .2, s * .14, "#3fb6ff"]].forEach(([x, y, c]) => {
        ctx.beginPath(); ctx.arc(x, y, s * .06, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
      });
      break;
    }
    case "nuvem": {
      nuvemEm(ctx, 0, 0, s);
      break;
    }
    case "arcoiris": {
      ctx.save(); ctx.lineCap = "butt";
      ["#ff8fb8", "#ffb36b", "#ffe680", "#8fd8ff"].forEach((c, i) => {
        ctx.beginPath(); ctx.arc(0, s * .2, s * (.42 - i * .085), Math.PI, 2 * Math.PI);
        ctx.lineWidth = s * .095; ctx.strokeStyle = c; ctx.stroke();
      });
      ctx.restore();
      nuvemEm(ctx, -s * .3, s * .22, s * .45); nuvemEm(ctx, s * .3, s * .22, s * .45);
      break;
    }
    case "oculos": {
      ctx.beginPath(); ctx.moveTo(-s * .03, -s * .06); ctx.quadraticCurveTo(0, -s * .14, s * .03, -s * .06); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * .44, -s * .12); ctx.lineTo(-s * .5, -s * .2); ctx.moveTo(s * .44, -s * .12); ctx.lineTo(s * .5, -s * .2); ctx.stroke();
      [-1, 1].forEach((d) => {
        const k = s * .44, cx = d * s * .24, cy = 0;
        caminhoCoracao(ctx, cx, cy - k * .42, k);
        const g = ctx.createLinearGradient(0, -k * .4, 0, k * .4); g.addColorStop(0, "#ff7ac8"); g.addColorStop(1, "#e0106e");
        ctx.fillStyle = g; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx - k * .18, cy - k * .16, k * .08, k * .045, -0.6, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fill();
      });
      break;
    }
    case "balao": {
      ctx.beginPath(); caixaArredondada(ctx, -s * .46, -s * .3, s * .92, s * .46, s * .2);
      ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * .16, s * .15); ctx.lineTo(-s * .26, s * .38); ctx.lineTo(s * .02, s * .15); ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.stroke();
      ctx.fillRect(-s * .15, s * .12, s * .16, s * .06);
      ctx.font = `700 ${s * .26}px Fredoka, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#ff4fc3"; ctx.fillText("oii!", 0, -s * .07);
      break;
    }
    case "local": {
      etiqueta(ctx, s, "aqui", "#ffffff", "#ff3d6e", (x, y, k) => {
        ctx.beginPath(); ctx.arc(x, y - k * .12, k * .3, Math.PI * .85, Math.PI * 2.15); ctx.lineTo(x, y + k * .42); ctx.closePath();
        ctx.fillStyle = "#ff3d6e"; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y - k * .12, k * .12, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.fill();
      });
      break;
    }
    case "curtidas": {
      caixaArredondada(ctx, -s * .42, -s * .26, s * .84, s * .4, s * .14);
      ctx.fillStyle = "#ff3d6e"; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * .07, s * .14); ctx.lineTo(0, s * .27); ctx.lineTo(s * .07, s * .14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillRect(-s * .06, s * .1, s * .12, s * .06);
      caminhoCoracao(ctx, -s * .2, -s * .15, s * .24); ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.font = `700 ${s * .22}px Fredoka, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff"; ctx.fillText("999", s * .12, -s * .05);
      break;
    }
    case "musica": {
      caixaArredondada(ctx, -s * .5, -s * .2, s, s * .4, s * .1); ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.stroke();
      caixaArredondada(ctx, -s * .44, -s * .14, s * .28, s * .28, s * .05);
      const g = ctx.createLinearGradient(-s * .44, -s * .14, -s * .16, s * .14); g.addColorStop(0, "#ff7ad9"); g.addColorStop(1, "#7a5cff");
      ctx.fillStyle = g; ctx.fill();
      ctx.font = `700 ${s * .17}px Fredoka, sans-serif`; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("♫", -s * .3, 0);
      ctx.textAlign = "left"; ctx.fillStyle = T; ctx.font = `700 ${s * .095}px Fredoka, sans-serif`; ctx.fillText("tocando agora", -s * .1, -s * .06);
      ctx.fillStyle = "#e3d9f5"; ctx.fillRect(-s * .1, s * .06, s * .52, s * .035);
      ctx.fillStyle = "#ff4fc3"; ctx.fillRect(-s * .1, s * .06, s * .3, s * .035);
      ctx.beginPath(); ctx.arc(s * .2, s * .077, s * .035, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "slider": {
      caixaArredondada(ctx, -s * .5, -s * .24, s, s * .48, s * .12); ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.stroke();
      ctx.font = `700 ${s * .1}px Fredoka, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = T;
      ctx.fillText("o quanto vc ama?", 0, -s * .1);
      caixaArredondada(ctx, -s * .38, s * .06, s * .76, s * .06, s * .03); ctx.fillStyle = "#eee6f7"; ctx.fill();
      const g = ctx.createLinearGradient(-s * .38, 0, s * .3, 0); g.addColorStop(0, "#ffb3e6"); g.addColorStop(1, "#ff2f6d");
      caixaArredondada(ctx, -s * .38, s * .06, s * .68, s * .06, s * .03); ctx.fillStyle = g; ctx.fill();
      caminhoCoracao(ctx, s * .3, s * .09 - s * .08, s * .19); ctx.fillStyle = "#ff2f6d"; ctx.fill(); ctx.stroke();
      break;
    }
    case "tbt": case "sextou": case "mood": case "ootd": case "amovcs": case "bestday": {
      const [txt, fundo, cor] = TAGS[tipo];
      etiqueta(ctx, s, txt, fundo, cor);
      break;
    }
  }
}

function desenharFundoMoldura(ctx, W, H) {
  const m = estado.moldura;
  if (m === "rosa") {
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#ffc4ec"); g.addColorStop(.5, "#ff7ad9"); g.addColorStop(1, "#ffb3e6");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = rand(42);
    for (let i = 0; i < Math.round(W * H / 9000); i++) {
      ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = "#ffffff";
      const x = r() * W, y = r() * H, s = 10 + r() * 16;
      if (i % 3) { caminhoCoracao(ctx, x, y, s); ctx.fill(); } else { caminhoEstrela(ctx, x, y, s * .6, s * .15, 4); ctx.fill(); }
      ctx.restore();
    }
  } else if (m === "cromado") {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    ["#eef2f9", "#b6c3dc", "#ffffff", "#8fa1c4", "#e7ecf6", "#b9a8e6", "#f4f6fb"].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = rand(7);
    for (let i = 0; i < Math.round(W * H / 14000); i++) { ctx.fillStyle = "rgba(255,255,255,.9)"; caminhoEstrela(ctx, r() * W, r() * H, 8 + r() * 10, 2, 4); ctx.fill(); }
  } else if (m === "rede") {
    ctx.fillStyle = "#e3edfb"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#6d9eeb"; ctx.fillRect(0, 0, W, 18);
    ctx.fillStyle = "#ff79c6"; ctx.fillRect(0, 18, W, 6);
    ctx.strokeStyle = "rgba(109,158,235,.25)"; ctx.lineWidth = 1;
    for (let y = 30; y < H; y += 14) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  } else if (m === "digicam") {
    ctx.fillStyle = "#151515"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#2a2a2a";
    for (let y = 8; y < H; y += 46) { ctx.fillRect(8, y, 14, 26); ctx.fillRect(W - 22, y, 14, 26); } // furinhos de filme
  } else if (m === "emo") {
    const q = 30;
    for (let y = 0; y < H; y += q) for (let x = 0; x < W; x += q) { ctx.fillStyle = ((x + y) / q) % 2 ? "#111" : "#ff4fc3"; ctx.fillRect(x, y, q, q); }
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 0, W, H);
  } else if (m === "polaroid") {
    ctx.fillStyle = "#fbf8f1"; ctx.fillRect(0, 0, W, H);
    const r = rand(11);
    for (let i = 0; i < Math.round(W * H / 600); i++) { ctx.fillStyle = `rgba(120,100,70,${.03 + r() * .04})`; ctx.fillRect(r() * W, r() * H, 2, 2); }
  } else if (m === "story") {
    const g = ctx.createLinearGradient(0, 0, W, H);
    ["#ffd36e", "#ff7a45", "#ff3d8b", "#a43fd1", "#5b5ff0"].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = rand(5);
    for (let i = 0; i < 14; i++) { ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.beginPath(); ctx.arc(r() * W, r() * H, 30 + r() * 90, 0, Math.PI * 2); ctx.fill(); }
  } else if (m === "coquette") {
    ctx.fillStyle = "#fff4f9"; ctx.fillRect(0, 0, W, H);
    const q = 26; ctx.fillStyle = "rgba(255,143,200,.32)";
    for (let x = 0; x < W; x += q * 2) ctx.fillRect(x, 0, q, H);
    for (let y = 0; y < H; y += q * 2) ctx.fillRect(0, y, W, q);
  } else if (m === "holografico") {
    const g = ctx.createLinearGradient(0, 0, W * .6, H);
    ["#ffd6f5", "#c9f0ff", "#e6d4ff", "#fff5c2", "#d4fff0", "#ffd6f5", "#c9f0ff"].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = rand(3);
    for (let i = 0; i < 8; i++) {
      const x = r() * W, y = r() * H, rr = 80 + r() * 160;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, rr); rg.addColorStop(0, "rgba(255,255,255,.55)"); rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rg; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    for (let i = 0; i < Math.round(W * H / 12000); i++) { ctx.fillStyle = "#ffffff"; caminhoEstrela(ctx, r() * W, r() * H, 6 + r() * 12, 1.5, 4); ctx.fill(); }
  } else if (m === "galaxia") {
    const g = ctx.createRadialGradient(W / 2, H / 3, 20, W / 2, H / 2, Math.max(W, H));
    g.addColorStop(0, "#4b2a8f"); g.addColorStop(.5, "#22104d"); g.addColorStop(1, "#0b0420");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = rand(23);
    for (let i = 0; i < 3; i++) {
      const x = r() * W, y = r() * H, rr = 150 + r() * 200;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, rr); rg.addColorStop(0, i % 2 ? "rgba(255,90,200,.28)" : "rgba(90,180,255,.25)"); rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    for (let i = 0; i < Math.round(W * H / 2500); i++) { ctx.fillStyle = `rgba(255,255,255,${.3 + r() * .7})`; ctx.beginPath(); ctx.arc(r() * W, r() * H, .6 + r() * 1.6, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 10; i++) { ctx.fillStyle = "#fff7c2"; caminhoEstrela(ctx, r() * W, r() * H, 8 + r() * 10, 1.5, 4); ctx.fill(); }
  } else if (m === "glitter") {
    ctx.fillStyle = padrao(ctx, "lantejoula"); ctx.fillRect(0, 0, W, H);
  } else if (m === "oncinha") {
    ctx.fillStyle = padrao(ctx, "oncinha"); ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#ff3d9a"; ctx.lineWidth = 12; ctx.strokeRect(6, 6, W - 12, H - 12);
  } else if (m === "celular" || m === "camera") {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    (m === "celular" ? ["#ff8cc8", "#ffd9ee", "#ff9fd2", "#e2559f", "#ff9fd2"] : ["#c9ced9", "#f5f7fa", "#aeb5c4", "#e8ebf1", "#9aa2b3"])
      .forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(0, 0, W, 10);
    const { l } = medidas();
    const yFim = MARGEM + l.rows * l.ph + (l.rows - 1) * ESPACO;
    caixaArredondada(ctx, MARGEM - 26, MARGEM - 26, W - 2 * MARGEM + 52, yFim - MARGEM + 52, 22);
    ctx.fillStyle = "#15151f"; ctx.fill();
    if (m === "celular") { caixaArredondada(ctx, W / 2 - 50, 4, 100, 9, 4); ctx.fillStyle = "#8a2459"; ctx.fill(); }
  } else if (m === "festa") {
    ctx.fillStyle = "#ffc2e0"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.25)"; for (let x = 0; x < W; x += 6) ctx.fillRect(x, 0, 2, H);
    ctx.fillStyle = "#1a1a24"; const passo = 34;
    for (let x = 14; x < W; x += passo) { ctx.beginPath(); ctx.arc(x, H - 12, 4, 0, Math.PI * 2); ctx.fill(); }
    for (let y = 14; y < H; y += passo) { ctx.beginPath(); ctx.arc(12, y, 4, 0, Math.PI * 2); ctx.arc(W - 12, y, 4, 0, Math.PI * 2); ctx.fill(); }
    const cores = ["#ff8fcf", "#ffe066", "#9fd8ff", "#c7b3ff", "#ff4fae", "#7ee0b5"];
    const n = Math.round(W / 60);
    for (let i = 0; i < n; i++) { const x = i * W / n; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + W / n, 0); ctx.lineTo(x + W / n / 2, 34); ctx.closePath(); ctx.fillStyle = cores[i % cores.length]; ctx.fill(); }
  } else if (m === "filme") {
    ctx.fillStyle = "#3b2210"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#e9d8b4";
    for (let y = 10; y < H - 20; y += 44) { caixaArredondada(ctx, 7, y, 16, 24, 4); ctx.fill(); caixaArredondada(ctx, W - 23, y, 16, 24, 4); ctx.fill(); }
  }
}
const PADROES = {};
function padrao(ctx, nome) {
  if (!PADROES[nome]) {
    const c = document.createElement("canvas"); c.width = c.height = 240;
    const x = c.getContext("2d"), r = rand(nome.length * 97);
    if (nome === "lantejoula") {
      x.fillStyle = "#a3005a"; x.fillRect(0, 0, 240, 240);
      const q = 12;
      for (let j = 0, y = 0; y < 240 + q; j++, y += q * .86) for (let i = 0, cx = (j % 2) * q / 2; cx < 240 + q; i++, cx += q) {
        const l = r(), g = x.createRadialGradient(cx - 2, y - 2, 1, cx, y, q * .55);
        g.addColorStop(0, l > .86 ? "#ffffff" : l > .5 ? "#ffb3dd" : "#ff7cc4"); g.addColorStop(.7, "#ff2f95"); g.addColorStop(1, "#b0005e");
        x.fillStyle = g; x.beginPath(); x.arc(cx % 240, y % 240, q * .5, 0, Math.PI * 2); x.fill();
      }
      for (let i = 0; i < 14; i++) { x.fillStyle = "#ffffff"; caminhoEstrela(x, r() * 240, r() * 240, 3 + r() * 6, 1, 4); x.fill(); }
    } else if (nome === "oncinha") {
      x.fillStyle = "#e3b07c"; x.fillRect(0, 0, 240, 240);
      for (let i = 0; i < 46; i++) {
        const cx = r() * 240, cy = r() * 240, s = 8 + r() * 8;
        for (const [dx, dy] of [[0, 0], [240, 0], [-240, 0], [0, 240], [0, -240]]) {
          x.fillStyle = "#b8743e"; x.beginPath(); x.ellipse(cx + dx, cy + dy, s * .8, s * .6, i, 0, Math.PI * 2); x.fill();
          x.strokeStyle = "#2b1608"; x.lineWidth = s * .42; x.lineCap = "round";
          const st = i * 1.7;
          for (let k = 0; k < 3; k++) { x.beginPath(); x.ellipse(cx + dx, cy + dy, s, s * .8, 0, st + k * 2.1, st + k * 2.1 + 1.3); x.stroke(); }
        }
      }
    }
    PADROES[nome] = c;
  }
  return ctx.createPattern(PADROES[nome], "repeat");
}
/** Enfeites desenhados por cima das fotos, nos cantos. */
function desenharEnfeitesMoldura(ctx, W, H) {
  const m = estado.moldura;
  const em = (tipo, x, y, tam, rot = 0) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); desenharAdesivo(ctx, tipo, tam); ctx.restore(); };
  const yFoto = H - RODAPE;
  if (m === "glitter") { em("arq:estrela-cromada", 70, yFoto - 40, 150, .2); em("arq:estrela-glitter-prata", W - 56, 56, 100, -.2); return; }
  if (m === "oncinha") { em("arq:laco-oncinha", W - 70, 62, 140, .15); em("arq:coracao-glitter", 60, yFoto - 30, 100, -.2); return; }
  if (m === "festa") { em("arq:globo-de-luz", 70, 80, 140); em("arq:estrela-glitter-dourada", 64, yFoto - 30, 110, -.2); em("arq:coquetel", W - 60, yFoto - 40, 110, .15); em("arq:coracao-gema", W - 50, H * .4, 70, .2); return; }
  if (m === "polaroid") { em("fita", 60, 34, 150, -0.35); em("fita", W - 60, 34, 150, 0.85); }
  else if (m === "coquette") { em("lacinho", 52, 46, 110, -0.2); em("lacinho", W - 52, 46, 110, 0.2); }
  else if (m === "galaxia" || m === "holografico") { em("brilho", W - 44, 44, 80); em("brilho", 40, H - RODAPE - 10, 60); }
  else if (m === "filme") {
    ctx.save(); ctx.font = "22px VT323, monospace"; ctx.fillStyle = "#ff9a3c"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let i = 0; i < totalFotos(); i++) { const p = posicaoFoto(i); ctx.fillText(`${i + 12}A`, MARGEM + 8 > p.x ? 15 : p.x - 25, p.y + p.h / 2); }
    ctx.restore();
  }
}
function corBordaFoto() {
  return { rosa: "#ffffff", cromado: "#ffffff", rede: "#ffffff", digicam: "#f2f2f2", emo: "#ff4fc3", polaroid: "#efe9dd", story: "#ffffff",
    coquette: "#ffffff", holografico: "#ffffff", galaxia: "#e6d4ff", filme: "#1a0d05",
    glitter: "#ffffff", oncinha: "#ff8fc4", celular: "#15151f", camera: "#15151f", festa: "#ffffff" }[estado.moldura];
}
const CORES_RODAPE = {
  rosa: ["#ffffff", "#2a1840", "#ffffff", "#2a1840"],
  cromado: ["#ff4fc3", "#2a1840", "#ffffff", "#2a1840"],
  rede: ["#3b5998", "#ffffff", "#ff79c6", "#ffffff"],
  emo: ["#ff4fc3", "#000000", "#ffffff", "#000000"],
  polaroid: ["#3a3a3a", "#fbf8f1", "#8a8178", "#fbf8f1"],
  story: ["#ffffff", "#7a1f5c", "#ffffff", "#7a1f5c"],
  coquette: ["#ff5fa8", "#ffffff", "#e0559a", "#ffffff"],
  holografico: ["#ffffff", "#6b4fd8", "#ffffff", "#6b4fd8"],
  galaxia: ["#ffe14d", "#1b0b3a", "#c7b3ff", "#1b0b3a"],
  filme: ["#ffb347", "#1a0d05", "#e9d8b4", "#1a0d05"],
  glitter: ["#ffffff", "#8a0045", "#ffffff", "#8a0045"],
  oncinha: ["#ff3d9a", "#ffffff", "#2b1608", "#ffffff"],
  festa: ["#ff2f8e", "#ffffff", "#2a1840", "#ffffff"],
};
function desenharRodape(ctx, W, H) {
  const m = estado.moldura;
  const cy = H - RODAPE / 2 - 8;
  const titulo = "cabine 2000";
  const dataTxt = estado.data.toLocaleDateString("pt-BR");
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (m === "digicam") {
    ctx.font = `48px VT323, monospace`; ctx.fillStyle = "#ff9a1f"; ctx.shadowColor = "rgba(255,140,0,.8)"; ctx.shadowBlur = 12;
    ctx.fillText((estado.legenda || "CABINE 2000").toUpperCase(), W / 2, cy - 22); ctx.shadowBlur = 0;
    ctx.font = `32px VT323, monospace`; ctx.fillStyle = "#cfcfcf"; ctx.fillText(`${dataDigicam()} · ${titulo}`, W / 2, cy + 26);
    return;
  }
  if (m === "celular") {
    ctx.font = `700 34px Fredoka, sans-serif`;
    textoContorno(ctx, estado.legenda || titulo, W / 2, cy - 14, "#ffffff", "#b0186a", 7);
    const dy = cy + 44;
    ctx.beginPath(); ctx.arc(W / 2, dy, 28, 0, Math.PI * 2);
    const g = ctx.createLinearGradient(W / 2 - 28, dy - 28, W / 2 + 28, dy + 28); g.addColorStop(0, "#ffffff"); g.addColorStop(.5, "#aeb5c4"); g.addColorStop(1, "#f2f4f8");
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = "#8a2459"; ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, dy, 11, 0, Math.PI * 2); ctx.fillStyle = "#ffe6f4"; ctx.fill(); ctx.stroke();
    [[-1, "#4cc76a"], [1, "#ff4d6d"]].forEach(([d, c]) => {
      caixaArredondada(ctx, W / 2 + d * 100 - 40, dy - 15, 80, 30, 15); ctx.fillStyle = "#ffe6f4"; ctx.fill(); ctx.stroke();
      ctx.fillStyle = c; caixaArredondada(ctx, W / 2 + d * 100 - 16, dy - 6, 32, 12, 6); ctx.fill();
    });
    return;
  }
  if (m === "camera") {
    ctx.font = `700 34px Fredoka, sans-serif`; ctx.textAlign = "left";
    textoContorno(ctx, estado.legenda || titulo, 46, cy, "#2a2f3c", "#f5f7fa", 6);
    ctx.font = `26px VT323, monospace`; ctx.fillStyle = "#4a5263"; ctx.fillText(`DIGITAL 8.0 MP · ${dataDigicam()}`, 46, cy + 44);
    const dx = W - 86, dy = cy + 18;
    ctx.beginPath(); ctx.arc(dx, dy, 48, 0, Math.PI * 2); ctx.fillStyle = "#e8ebf1"; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = "#6b7387"; ctx.stroke();
    ctx.beginPath(); ctx.arc(dx, dy, 18, 0, Math.PI * 2); ctx.fillStyle = "#ff5fb4"; ctx.fill(); ctx.stroke();
    ctx.font = `20px VT323, monospace`; ctx.fillStyle = "#4a5263"; ctx.textAlign = "center";
    [["MENU", 0, -32], ["DISP", 33, 0], ["▶", 0, 35], ["★", -33, 0]].forEach(([t, ox, oy]) => ctx.fillText(t, dx + ox, dy + oy));
    ctx.textAlign = "center";
    return;
  }
  const [preench, contorno, subPreench, subContorno] = CORES_RODAPE[m];
  const principal = estado.legenda || titulo;
  ctx.font = `700 ${principal.length > 18 ? 40 : 52}px Fredoka, sans-serif`;
  textoContorno(ctx, principal, W / 2, cy - 18, preench, contorno, 8);
  ctx.font = `30px "Pixelify Sans", VT323, monospace`;
  textoContorno(ctx, estado.legenda ? `${titulo} ♥ ${dataTxt}` : `♥ ${dataTxt} ♥`, W / 2, cy + 32, subPreench, subContorno, 5);
}

/* ------------------------------------------------------------------ composição da tirinha */
const tela = $("tira");
function medidas() {
  const l = LAYOUTS[estado.layout];
  const W = MARGEM * 2 + l.cols * l.pw + (l.cols - 1) * ESPACO;
  const H = MARGEM + l.rows * l.ph + (l.rows - 1) * ESPACO + RODAPE;
  return { l, W, H };
}
function posicaoFoto(i) {
  const { l } = medidas();
  const c = i % l.cols, r = Math.floor(i / l.cols);
  return { x: MARGEM + c * (l.pw + ESPACO), y: MARGEM + r * (l.ph + ESPACO), w: l.pw, h: l.ph };
}
function compor(paraExportar = false) {
  const { W, H } = medidas();
  if (tela.width !== W || tela.height !== H) { tela.width = W; tela.height = H; }
  const ctx = tela.getContext("2d");
  ctx.save(); ctx.clearRect(0, 0, W, H);
  desenharFundoMoldura(ctx, W, H);
  for (let i = 0; i < totalFotos(); i++) {
    const p = posicaoFoto(i);
    ctx.fillStyle = corBordaFoto(); ctx.fillRect(p.x - 8, p.y - 8, p.w + 16, p.h + 16);
    if (estado.fotos[i]) ctx.drawImage(fotoFiltrada(i, p.w, p.h), p.x, p.y);
    else { ctx.fillStyle = "#ddd"; ctx.fillRect(p.x, p.y, p.w, p.h); }
    if (estado.mostrarData) {
      ctx.font = `34px VT323, monospace`; ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#ff9a1f"; ctx.shadowColor = "rgba(255,120,0,.9)"; ctx.shadowBlur = 8;
      ctx.fillText(dataDigicam(), p.x + p.w - 14, p.y + p.h - 12); ctx.shadowBlur = 0;
    }
  }
  desenharEnfeitesMoldura(ctx, W, H);
  desenharRodape(ctx, W, H);
  estado.adesivos.forEach((a, idx) => {
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot); desenharAdesivo(ctx, a.tipo, a.tam); ctx.restore();
    if (!paraExportar && idx === estado.selecionado) {
      ctx.save(); ctx.setLineDash([10, 8]); ctx.lineWidth = 4; ctx.strokeStyle = "#3fb6ff";
      ctx.strokeRect(a.x - a.tam * .6, a.y - a.tam * .6, a.tam * 1.2, a.tam * 1.2); ctx.restore();
    }
  });
  ctx.restore();
  $("controles-adesivo").hidden = estado.selecionado < 0;
}

/* ------------------------------------------------------------------ editor: controles */
montarChips($("chips-filtro"), FILTROS, estado.filtro, (id) => { estado.filtro = id; compor(); });
montarChips($("chips-moldura"), MOLDURAS, estado.moldura, (id) => { estado.moldura = id; compor(); }, (id) => MOLDURAS[id].cor);
$("legenda").addEventListener("input", (e) => { estado.legenda = e.target.value.trim(); compor(); });
$("mostrar-data").addEventListener("change", (e) => { estado.mostrarData = e.target.checked; compor(); });

function montarPaleta() {
  const p = $("paleta-adesivos");
  for (const [grupo, lista] of GRUPOS_ADESIVOS) {
  const rot = document.createElement("p"); rot.className = "grupo-adesivos"; rot.textContent = grupo; p.appendChild(rot);
  for (const tipo of lista) {
    const b = document.createElement("button");
    b.type = "button";
    const nomeLegivel = (tipo.startsWith("arq:") ? tipo.slice(4) : tipo).replace(/-/g, " ");
    b.setAttribute("aria-label", `Adicionar adesivo ${nomeLegivel}`); b.title = nomeLegivel;
    if (tipo.startsWith("arq:")) {
      const im = document.createElement("img"); im.src = `adesivos/${tipo.slice(4)}.webp`; im.alt = ""; im.loading = "lazy";
      b.appendChild(im);
    } else {
      const c = document.createElement("canvas"); c.width = 96; c.height = 96;
      const ctx = c.getContext("2d"); ctx.translate(48, 48); desenharAdesivo(ctx, tipo, TAGS[tipo] || tipo === "local" ? 62 : 76);
      b.appendChild(c);
    }
    b.addEventListener("click", () => {
      const { W, H } = medidas();
      const n = estado.adesivos.length;
      estado.adesivos.push({ tipo, x: W / 2 + ((n % 5) - 2) * 40, y: H / 3 + (n % 4) * 60, tam: Math.round(W * .2), rot: 0 });
      estado.selecionado = estado.adesivos.length - 1;
      compor();
      // no celular a tirinha fica acima do painel: mostra onde o adesivo entrou
      if (matchMedia("(max-width: 820px)").matches) tela.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    p.appendChild(b);
  }
  }
}
$("controles-adesivo").addEventListener("click", (e) => {
  const b = e.target.closest("[data-acao]"); if (!b) return;
  const a = estado.adesivos[estado.selecionado]; if (!a) return;
  const acao = b.dataset.acao;
  if (acao === "maior") a.tam = Math.min(a.tam * 1.15, 700);
  if (acao === "menor") a.tam = Math.max(a.tam / 1.15, 30);
  if (acao === "girar") a.rot += Math.PI / 12;
  if (acao === "remover") { estado.adesivos.splice(estado.selecionado, 1); estado.selecionado = -1; }
  compor();
});

// arrastar adesivos sobre a tirinha
let arrasto = null;
function pontoNaTela(ev) {
  const r = tela.getBoundingClientRect();
  return { x: ((ev.clientX - r.left) / r.width) * tela.width, y: ((ev.clientY - r.top) / r.height) * tela.height };
}
tela.addEventListener("pointerdown", (ev) => {
  const p = pontoNaTela(ev);
  let achou = -1;
  for (let i = estado.adesivos.length - 1; i >= 0; i--) {
    const a = estado.adesivos[i];
    if (Math.abs(p.x - a.x) < a.tam * .6 && Math.abs(p.y - a.y) < a.tam * .6) { achou = i; break; }
  }
  estado.selecionado = achou;
  if (achou >= 0) {
    const a = estado.adesivos[achou];
    // traz para a frente
    estado.adesivos.splice(achou, 1); estado.adesivos.push(a); estado.selecionado = estado.adesivos.length - 1;
    arrasto = { dx: p.x - a.x, dy: p.y - a.y };
    tela.setPointerCapture(ev.pointerId); tela.classList.add("arrastando");
    ev.preventDefault();
  }
  compor();
});
tela.addEventListener("pointermove", (ev) => {
  if (!arrasto) return;
  const a = estado.adesivos[estado.selecionado]; if (!a) return;
  const p = pontoNaTela(ev);
  a.x = Math.max(0, Math.min(tela.width, p.x - arrasto.dx));
  a.y = Math.max(0, Math.min(tela.height, p.y - arrasto.dy));
  compor();
});
const soltar = () => { arrasto = null; tela.classList.remove("arrastando"); };
tela.addEventListener("pointerup", soltar);
tela.addEventListener("pointercancel", soltar);
document.addEventListener("keydown", (e) => {
  if (!$("tela-editor").classList.contains("ativa") || estado.selecionado < 0) return;
  if (e.target.matches("input")) return;
  if (e.key === "Delete" || e.key === "Backspace") { estado.adesivos.splice(estado.selecionado, 1); estado.selecionado = -1; compor(); }
});

/* ------------------------------------------------------------------ baixar e compartilhar */
function nomeArquivo() {
  const d = new Date(), p = (n) => String(n).padStart(2, "0");
  return `cabine2000-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.png`;
}
function gerarBlob() {
  compor(true);
  return new Promise((ok) => tela.toBlob((b) => { compor(false); ok(b); }, "image/png"));
}
$("btn-baixar").addEventListener("click", async () => {
  const blob = await gerarBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = nomeArquivo();
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
});
if (navigator.canShare && navigator.canShare({ files: [new File([""], "t.png", { type: "image/png" })] })) {
  $("btn-compartilhar").hidden = false;
  $("btn-compartilhar").addEventListener("click", async () => {
    const blob = await gerarBlob();
    try { await navigator.share({ files: [new File([blob], nomeArquivo(), { type: "image/png" })], title: "Cabine 2000" }); } catch { /* cancelado */ }
  });
}
$("btn-de-novo").addEventListener("click", () => {
  estado.fotos = []; estado.adesivos = []; estado.selecionado = -1;
  mostrarTela(estado.modo === "camera" ? "camera" : "upload");
});

/* ------------------------------------------------------------------ início */
montarLayouts();
montarPaleta();
// as fontes do Google podem chegar depois: redesenha a tirinha quando carregarem
if (document.fonts?.ready) document.fonts.ready.then(() => {
  $("paleta-adesivos").innerHTML = ""; montarPaleta();
  if ($("tela-editor").classList.contains("ativa")) compor();
});
