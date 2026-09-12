/* gallery3d.js — <gallery-room variant="enfilade|atrium|cabinet">
   A navigable exhibition space in three.js.
   Drag to look · WASD/arrows to walk · click a photograph to approach · click a doorway to travel. */
(function () {
  'use strict';
  const THREE_URL = 'https://unpkg.com/three@0.184.0/build/three.module.js';
  const EYE = 1.62, T = 0.26;

  /* ------------------------------------------------------------- artworks */
  const C = {
    p1: { src: 'assets/p1.jpg', title: 'Crossing, 23:40', meta: 'Oshiage, Tokyo · 2025', ar: 1.5,
          note: 'A woman, two dogs and the tower. The only frame where all three held still.' },
    p2: { src: 'assets/p2.jpg', title: 'Senbon Torii', meta: 'Fushimi Inari, Kyoto · 2025', ar: 1.5,
          note: 'Eight thousand gates, and one person walking away from every one of them.' },
    p3: { src: 'assets/p3.jpg', title: 'Hōzenji Yokochō, Rain', meta: 'Namba, Osaka · 2025', ar: 1.5,
          note: 'Wet stone holds light better than anything else in the city.' },
    x1: { ph: 'PHOTO 04 · 3:2', title: 'Untitled', meta: 'awaiting print', ar: 1.5, note: 'An empty hang. Drop a photograph in to fill it.' },
    x2: { ph: 'PHOTO 05 · 4:5', title: 'Untitled', meta: 'awaiting print', ar: 0.8, note: 'An empty hang. Drop a photograph in to fill it.' },
    x3: { ph: 'PHOTO 06 · 3:2', title: 'Untitled', meta: 'awaiting print', ar: 1.5, note: 'An empty hang. Drop a photograph in to fill it.' },
    x4: { ph: 'PHOTO 07 · 1:1', title: 'Untitled', meta: 'awaiting print', ar: 1.0, note: 'An empty hang. Drop a photograph in to fill it.' },
    x5: { ph: 'PHOTO 08 · 4:5', title: 'Untitled', meta: 'awaiting print', ar: 0.8, note: 'An empty hang. Drop a photograph in to fill it.' },
    x6: { ph: 'PHOTO 09 · 3:2', title: 'Untitled', meta: 'awaiting print', ar: 1.5, note: 'An empty hang. Drop a photograph in to fill it.' }
  };

  /* ------------------------------------------------------------- variants */
  const VARIANTS = {};

  VARIANTS.enfilade = {
    label: 'Enfilade',
    blurb: 'Three white rooms threaded on a single axis — from anywhere, you can see the next doorway.',
    bg: '#0a0908', exposure: 1.1, fog: [16, 82], darkPlaceholder: false,
    wall: '#f4f1eb', wallRough: 0.97, ceil: '#fcfbf8',
    floor: '#c2b096', floorRough: 0.44, floorMetal: 0.06,
    base: '#eae5dc', baseH: 0.11,
    roomH: 3.8, doorW: 2.5, doorH: 2.95, arch: false,
    frame: '#17150f', frameW: 0.032, frameD: 0.04, mat: '#fdfcfa', matW: 0.08,
    hemi: { sky: '#ffffff', ground: '#cabda6', i: 1.02 }, amb: 0.24,
    spot: { color: '#fff1dc', i: 22, angle: 0.48, pen: 0.85, dist: 10, standoff: 1.62 },
    track: true, trackColor: '#2a2724', railColor: '#6f6a63', fill: 5,
    ui: { ink: '#16140f', paper: 'rgba(253,251,247,0.93)', edge: 'rgba(20,18,14,0.13)', dark: false },
    plaque: { bg: '#f7f4ee', ink: '#1a1712' },
    rooms: [
      { id: 'r1', name: 'I · Arrival', sub: 'Tokyo after midnight', c: [0, 0], s: [10, 10],
        art: [ { k: 'p1', wall: 'N', u: 0, w: 2.45 }, { k: 'x1', wall: 'N', u: -3.2, w: 1.0 }, { k: 'x2', wall: 'N', u: 3.0, w: 0.82 },
               { k: 'x3', wall: 'W', u: -1.9, w: 1.35 }, { k: 'x4', wall: 'W', u: 1.7, w: 1.0 } ] },
      { id: 'r2', name: 'II · Vermilion', sub: 'Kyoto, the long gate', c: [14.5, 0], s: [10, 10],
        art: [ { k: 'p2', wall: 'N', u: 0, w: 2.65 }, { k: 'x5', wall: 'N', u: -3.3, w: 0.92 }, { k: 'x6', wall: 'N', u: 3.1, w: 1.15 },
               { k: 'x3', wall: 'S', u: -2.1, w: 1.4 }, { k: 'x4', wall: 'S', u: 1.8, w: 1.05 } ] },
      { id: 'r3', name: 'III · After Rain', sub: 'Osaka, low season', c: [29, 0], s: [10, 10],
        art: [ { k: 'p3', wall: 'E', u: 0, w: 2.5 }, { k: 'x1', wall: 'E', u: -3.1, w: 0.95 }, { k: 'x2', wall: 'E', u: 2.9, w: 0.85 },
               { k: 'x5', wall: 'N', u: -2.3, w: 0.95 }, { k: 'x6', wall: 'S', u: 2.0, w: 1.3 } ] }
    ],
    links: [ { a: 'r1', b: 'r2', axis: 'x', at: 0 }, { a: 'r2', b: 'r3', axis: 'x', at: 0 } ],
    start: { room: 'r1', pos: [0, 4.0], yaw: 0 }
  };

  VARIANTS.atrium = {
    label: 'Atrium',
    blurb: 'One tall daylit hall with a floating partition, and two quiet side rooms off it.',
    bg: '#0f1011', exposure: 1.07, fog: [24, 105], darkPlaceholder: false,
    wall: '#f7f7f6', wallRough: 0.98, ceil: '#ffffff',
    floor: '#b3b1ac', floorRough: 0.34, floorMetal: 0.14,
    base: '#ececeb', baseH: 0.09,
    roomH: 6.6, doorW: 2.0, doorH: 3.7, arch: false,
    frame: '#fbfbfa', frameW: 0.028, frameD: 0.05, mat: '#ffffff', matW: 0.12,
    hemi: { sky: '#f2f7fc', ground: '#c3c3c0', i: 1.15 }, amb: 0.32,
    spot: { color: '#ffffff', i: 13, angle: 0.52, pen: 0.95, dist: 13, standoff: 2.3 },
    track: false, trackColor: '#c9c9c7', fill: 4,
    ui: { ink: '#14171a', paper: 'rgba(255,255,255,0.93)', edge: 'rgba(20,24,26,0.12)', dark: false },
    plaque: { bg: '#ffffff', ink: '#14171a' },
    rooms: [
      { id: 'h', name: 'The Hall', sub: 'Under the skylight', c: [0, 0], s: [16, 16], h: 6.6, skylight: true, home: [0, 7.4],
        partition: { c: [0, 0.8], s: [8.0, 0.42], h: 3.5 },
        art: [ { k: 'p2', wall: 'P+', u: -1.4, w: 2.9 }, { k: 'x1', wall: 'P+', u: 2.6, w: 1.2 },
               { k: 'x2', wall: 'P-', u: 0, w: 1.35 },
               { k: 'p1', wall: 'W', u: -2.8, w: 2.5 }, { k: 'x3', wall: 'W', u: 3.4, w: 1.5 },
               { k: 'x4', wall: 'S', u: 4.6, w: 1.1 } ] },
      { id: 'n', name: 'North Room', sub: 'Small works', c: [0, -17], s: [9, 9], h: 4.1, home: [0, -13.4],
        art: [ { k: 'p3', wall: 'N', u: 0, w: 2.35 }, { k: 'x5', wall: 'N', u: -2.9, w: 0.9 },
               { k: 'x3', wall: 'W', u: 0, w: 1.4 }, { k: 'x4', wall: 'E', u: 0, w: 1.1 } ] },
      { id: 'e', name: 'East Room', sub: 'Work on paper', c: [17, 0], s: [9, 9], h: 4.1, home: [13.4, 0],
        art: [ { k: 'x6', wall: 'E', u: -1.7, w: 1.6 }, { k: 'x5', wall: 'E', u: 1.7, w: 1.15 },
               { k: 'x1', wall: 'S', u: 0, w: 1.5 }, { k: 'x2', wall: 'N', u: 0, w: 1.2 } ] }
    ],
    links: [ { a: 'h', b: 'n', axis: 'z', at: 0, rev: true }, { a: 'h', b: 'e', axis: 'x', at: 0 } ],
    start: { room: 'h', pos: [1.6, 7.0], yaw: -0.18 }
  };

  VARIANTS.cabinet = {
    label: 'Cabinet',
    blurb: 'Small dark chambers and arched thresholds — one pool of light per picture.',
    bg: '#060605', exposure: 1.3, fog: [9, 46], darkPlaceholder: true,
    wall: '#3a3530', wallRough: 0.99, ceil: '#252119',
    floor: '#221e1a', floorRough: 0.38, floorMetal: 0.14,
    base: '#232019', baseH: 0.14,
    roomH: 3.2, doorW: 1.8, doorH: 2.55, arch: true,
    frame: '#0c0b0a', frameW: 0.06, frameD: 0.05, mat: '#f1ece2', matW: 0.09,
    hemi: { sky: '#7d8894', ground: '#221e1a', i: 0.82 }, amb: 0.2,
    spot: { color: '#ffe4b8', i: 25, angle: 0.37, pen: 0.68, dist: 8.5, standoff: 1.35 },
    track: true, trackColor: '#141211', railColor: '#2a2623', fill: 6, corridor: 11,
    ui: { ink: '#f1ede5', paper: 'rgba(23,20,18,0.9)', edge: 'rgba(241,237,229,0.18)', dark: true },
    plaque: { bg: '#1b1816', ink: '#e8e2d6' },
    rooms: [
      { id: 'a', name: 'Antechamber', sub: 'Night pictures', c: [0, 0], s: [7, 7],
        art: [ { k: 'p1', wall: 'N', u: 0, w: 1.95 }, { k: 'x1', wall: 'W', u: -1.5, w: 1.0 }, { k: 'x2', wall: 'W', u: 1.4, w: 0.85 } ] },
      { id: 'b', name: 'Red Chamber', sub: 'Kyoto', c: [11.5, 0], s: [7, 7],
        art: [ { k: 'p2', wall: 'E', u: 0, w: 2.0 }, { k: 'x3', wall: 'S', u: -1.5, w: 1.05 }, { k: 'x4', wall: 'N', u: 1.6, w: 0.85 } ] },
      { id: 'c', name: 'Rain Room', sub: 'Osaka', c: [11.5, -11.5], s: [7, 7],
        art: [ { k: 'p3', wall: 'N', u: 0, w: 1.95 }, { k: 'x5', wall: 'W', u: 0, w: 0.9 }, { k: 'x6', wall: 'E', u: 0, w: 1.15 } ] }
    ],
    links: [ { a: 'a', b: 'b', axis: 'x', at: 0 }, { a: 'b', b: 'c', axis: 'z', at: 11.5, rev: true } ],
    start: { room: 'a', pos: [0, 2.6], yaw: 0 }
  };

  VARIANTS.nocturne = {
    label: 'Nocturne',
    blurb: 'The tall hall after hours — a cold skylight overhead, warm pools below, arches into the dark.',
    bg: '#060607', exposure: 1.26, fog: [15, 64], darkPlaceholder: true,
    wall: '#3d372f', wallRough: 0.99, ceil: '#241f1b',
    floor: '#2c261e', floorRough: 0.33, floorMetal: 0.1,
    base: '#2a2621', baseH: 0.1,
    roomH: 6.8, doorW: 2.05, doorH: 3.3, arch: true,
    frame: '#0b0a09', frameW: 0.075, frameD: 0.05, mat: '#e9e2d5', matW: 0.085,
    hemi: { sky: '#7f8d9d', ground: '#2a251f', i: 1.15 }, amb: 0.4,
    spot: { color: '#ffe2b4', i: 30, angle: 0.36, pen: 0.66, dist: 11, standoff: 1.5 },
    track: true, trackColor: '#131110', railColor: '#2b2724', fill: 6, corridor: 10,
    sky: { pane: '#8ba2bd', pane2: '#2c3849', color: '#a8bdd6', i: 62, dist: 44 },
    ui: { ink: '#f1ede5', paper: 'rgba(20,18,17,0.9)', edge: 'rgba(241,237,229,0.17)', dark: true },
    plaque: { bg: '#1a1715', ink: '#e8e2d6' },
    rooms: [
      { id: 'h', name: 'The Hall', sub: 'Under the skylight, after hours', c: [0, 0], s: [16, 16], h: 6.8,
        skylight: true, home: [0, 7.2],
        partition: { c: [0, 0.8], s: [8.0, 0.46], h: 3.6 },
        art: [ { k: 'p2', wall: 'P+', u: -1.4, w: 2.95 }, { k: 'x1', wall: 'P+', u: 2.7, w: 1.2 },
               { k: 'x2', wall: 'P-', u: 0, w: 1.4 },
               { k: 'p1', wall: 'W', u: -2.8, w: 2.55 }, { k: 'x3', wall: 'W', u: 3.4, w: 1.5 },
               { k: 'x4', wall: 'S', u: 4.8, w: 1.1 } ] },
      { id: 'n', name: 'North Room', sub: 'Small works', c: [0, -17.5], s: [9, 9], h: 4.2, home: [0, -14.0],
        art: [ { k: 'p3', wall: 'N', u: 0, w: 2.35 }, { k: 'x5', wall: 'N', u: -2.9, w: 0.9 },
               { k: 'x3', wall: 'W', u: 0, w: 1.4 }, { k: 'x4', wall: 'E', u: 0, w: 1.1 } ] },
      { id: 'e', name: 'East Room', sub: 'Work on paper', c: [17.5, 0], s: [9, 9], h: 4.2, home: [14.0, 0],
        art: [ { k: 'x6', wall: 'E', u: -1.7, w: 1.6 }, { k: 'x5', wall: 'E', u: 1.7, w: 1.15 },
               { k: 'x1', wall: 'S', u: 0, w: 1.5 }, { k: 'x2', wall: 'N', u: 0, w: 1.2 } ] }
    ],
    links: [ { a: 'h', b: 'n', axis: 'z', at: 0, rev: true }, { a: 'h', b: 'e', axis: 'x', at: 0 } ],
    start: { room: 'h', pos: [1.4, 8.6], yaw: -0.14 }
  };

  /* ---------------------------------------------------------------- utils */
  const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const wrapPi = a => Math.atan2(Math.sin(a), Math.cos(a));
  const yawToward = (dx, dz) => Math.atan2(dx, dz) + Math.PI;
  function el(tag, css, text) {
    const n = document.createElement(tag);
    if (css) n.setAttribute('style', css);
    if (text != null) n.textContent = text;
    return n;
  }

  function placeholderTexture(THREE, label, ar, dark) {
    const w = 900, h = Math.round(w / ar);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    const bg = dark ? '#24211d' : '#d5cfc2';
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = dark ? 'rgba(255,248,236,0.11)' : 'rgba(24,21,16,0.17)';
    g.lineWidth = 9;
    for (let i = -h; i < w + h; i += 30) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i - h, h); g.stroke(); }
    const bw = Math.min(w * 0.82, 560), bh = 86;
    g.fillStyle = bg; g.fillRect((w - bw) / 2, (h - bh) / 2, bw, bh);
    g.fillStyle = dark ? 'rgba(240,233,221,0.82)' : 'rgba(26,23,18,0.72)';
    g.font = '500 34px ui-monospace, SFMono-Regular, Menlo, monospace';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(label, w / 2, h / 2 + 1);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }

  function plaqueTexture(THREE, title, meta, pal) {
    const w = 512, h = 216;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    g.fillStyle = pal.bg; g.fillRect(0, 0, w, h);
    g.fillStyle = pal.ink;
    g.font = '500 38px Georgia, "Times New Roman", serif';
    g.textBaseline = 'top';
    g.fillText(title, 22, 46);
    g.globalAlpha = 0.62;
    g.font = '400 24px ui-monospace, SFMono-Regular, Menlo, monospace';
    g.fillText(meta, 22, 112);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }

  function skyPaneTexture(THREE, a, b) {
    const n = 256, cv = document.createElement('canvas'); cv.width = cv.height = n;
    const g = cv.getContext('2d');
    const rg = g.createRadialGradient(n / 2, n / 2, n * 0.05, n / 2, n / 2, n * 0.62);
    rg.addColorStop(0, a); rg.addColorStop(1, b);
    g.fillStyle = rg; g.fillRect(0, 0, n, n);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function wallGeom(THREE, len, h, t, holes, arch) {
    const s = new THREE.Shape();
    s.moveTo(-len / 2, 0); s.lineTo(len / 2, 0); s.lineTo(len / 2, h); s.lineTo(-len / 2, h); s.closePath();
    (holes || []).forEach(d => {
      const p = new THREE.Path(), x0 = d.u - d.w / 2, x1 = d.u + d.w / 2;
      if (arch) {
        const r = d.w / 2, sy = Math.max(0.4, d.h - r);
        p.moveTo(x0, 0); p.lineTo(x0, sy);
        p.absarc(d.u, sy, r, Math.PI, 0, true);
        p.lineTo(x1, 0); p.closePath();
      } else {
        p.moveTo(x0, 0); p.lineTo(x0, d.h); p.lineTo(x1, d.h); p.lineTo(x1, 0); p.closePath();
      }
      s.holes.push(p);
    });
    return new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 28 });
  }

  const WALL = {
    N: { rot: 0,            dir: [1, 0, 0], inN: [0, 0, 1],  face: 0 },
    S: { rot: 0,            dir: [1, 0, 0], inN: [0, 0, -1], face: Math.PI },
    W: { rot: -Math.PI / 2, dir: [0, 0, 1], inN: [1, 0, 0],  face: Math.PI / 2 },
    E: { rot: Math.PI / 2,  dir: [0, 0, 1], inN: [-1, 0, 0], face: -Math.PI / 2 }
  };
  function wallOrigin(r, side) {
    const [cx, cz] = r.c, [w, d] = r.s;
    if (side === 'N') return [cx, cz - d / 2 - T];
    if (side === 'S') return [cx, cz + d / 2];
    if (side === 'W') return [cx - w / 2, cz];
    return [cx + w / 2, cz];
  }
  function innerPlane(r, side) {
    const [cx, cz] = r.c, [w, d] = r.s;
    if (side === 'N') return [cx, cz - d / 2];
    if (side === 'S') return [cx, cz + d / 2];
    if (side === 'W') return [cx - w / 2, cz];
    return [cx + w / 2, cz];
  }

  /* =================================================================== app */
  function buildApp(host, THREE, key) {
    const V = VARIANTS[key] || VARIANTS.enfilade;
    const U = V.ui;

    host.style.cssText = 'position:relative;display:block;width:100%;height:100%;min-height:520px;overflow:hidden;background:' + V.bg + ';';
    const stage = el('div', 'position:absolute;inset:0;cursor:grab;');
    host.appendChild(stage);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = V.exposure;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(V.bg);
    scene.fog = new THREE.Fog(V.bg, V.fog[0], V.fog[1]);
    const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 300);
    camera.rotation.order = 'YXZ';

    const M = {
      wall: new THREE.MeshStandardMaterial({ color: V.wall, roughness: V.wallRough, metalness: 0 }),
      ceil: new THREE.MeshStandardMaterial({ color: V.ceil, roughness: 1, metalness: 0 }),
      floor: new THREE.MeshStandardMaterial({ color: V.floor, roughness: V.floorRough, metalness: V.floorMetal }),
      base: new THREE.MeshStandardMaterial({ color: V.base, roughness: 0.7, metalness: 0 }),
      frame: new THREE.MeshStandardMaterial({ color: V.frame, roughness: 0.5, metalness: 0.06 }),
      mat: new THREE.MeshStandardMaterial({ color: V.mat, roughness: 0.96, metalness: 0 }),
      track: new THREE.MeshStandardMaterial({ color: V.trackColor, roughness: 0.42, metalness: 0.55 }),
      rail: new THREE.MeshStandardMaterial({ color: V.railColor || V.trackColor, roughness: 0.5, metalness: 0.4 })
    };

    scene.add(new THREE.HemisphereLight(V.hemi.sky, V.hemi.ground, V.hemi.i));
    scene.add(new THREE.AmbientLight(0xffffff, V.amb));

    const roomById = {}; V.rooms.forEach(r => { roomById[r.id] = r; r.h = r.h || V.roomH; });
    const holesFor = {};
    V.links.forEach(L => {
      const a = roomById[L.a], b = roomById[L.b];
      const sideA = L.axis === 'x' ? 'E' : (L.rev ? 'N' : 'S');
      const sideB = L.axis === 'x' ? 'W' : (L.rev ? 'S' : 'N');
      const uA = L.axis === 'x' ? L.at - a.c[1] : L.at - a.c[0];
      const uB = L.axis === 'x' ? L.at - b.c[1] : L.at - b.c[0];
      L._sA = sideA; L._sB = sideB; L._uA = uA; L._uB = uB;
      (holesFor[a.id] = holesFor[a.id] || {})[sideA] = [{ u: sideA === 'E' ? -uA : uA, w: V.doorW, h: V.doorH }];
      (holesFor[b.id] = holesFor[b.id] || {})[sideB] = [{ u: sideB === 'E' ? -uB : uB, w: V.doorW, h: V.doorH }];
    });

    const bounds = [], clickable = [], artRecords = [], doors = [];
    const hotspotMat = () => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });

    function addWall(r, side) {
      const [w, d] = r.s;
      const len = (side === 'N' || side === 'S') ? w : d;
      const hs = (holesFor[r.id] || {})[side] || [];
      const m = new THREE.Mesh(wallGeom(THREE, len, r.h, T, hs, V.arch), M.wall);
      const [ox, oz] = wallOrigin(r, side);
      m.position.set(ox, 0, oz); m.rotation.y = WALL[side].rot;
      scene.add(m);
      if (V.baseH > 0) {
        const [ix, iz] = innerPlane(r, side), n = WALL[side].inN;
        const segs = hs.length ? [[-len / 2, hs[0].u - hs[0].w / 2], [hs[0].u + hs[0].w / 2, len / 2]] : [[-len / 2, len / 2]];
        segs.forEach(([s0, s1]) => {
          const sl = s1 - s0; if (sl < 0.05) return;
          const bb = new THREE.Mesh(new THREE.BoxGeometry(sl, V.baseH, 0.035), M.base);
          const mid = (s0 + s1) / 2;
          const dir = WALL[side].dir;
          const off = (side === 'E') ? -mid : mid;
          bb.position.set(ix + dir[0] * off + n[0] * 0.018, V.baseH / 2, iz + dir[2] * off + n[2] * 0.018);
          bb.rotation.y = WALL[side].rot;
          scene.add(bb);
        });
      }
    }

    function addRoom(r) {
      const [cx, cz] = r.c, [w, d] = r.s;
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.floor);
      fl.rotation.x = -Math.PI / 2; fl.position.set(cx, 0, cz); scene.add(fl);
      const ce = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.ceil);
      ce.rotation.x = Math.PI / 2; ce.position.set(cx, r.h, cz); scene.add(ce);
      ['N', 'S', 'W', 'E'].forEach(s => addWall(r, s));
      bounds.push({ x0: cx - w / 2 + 0.6, x1: cx + w / 2 - 0.6, z0: cz - d / 2 + 0.6, z1: cz + d / 2 - 0.6 });

      if (r.skylight) {
        const sky = V.sky || { pane: '#fcfdff', color: '#f0f5ff', i: 95, dist: 52 };
        const sk = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.44, d * 0.44),
          new THREE.MeshBasicMaterial(sky.pane2
            ? { map: skyPaneTexture(THREE, sky.pane, sky.pane2) }
            : { color: sky.pane }));
        sk.rotation.x = Math.PI / 2; sk.position.set(cx, r.h - 0.03, cz); scene.add(sk);
        const sl = new THREE.PointLight(sky.color, sky.i, sky.dist, 2);
        sl.position.set(cx, r.h - 1.2, cz); scene.add(sl);
      } else if (V.fill > 0) {
        const fill = new THREE.PointLight(0xfff6ea, V.fill, Math.max(w, d) * 1.6, 2);
        fill.position.set(cx, r.h - 0.6, cz); scene.add(fill);
      }
      if (r.partition) {
        const p = r.partition;
        const pm = new THREE.Mesh(new THREE.BoxGeometry(p.s[0], p.h, p.s[1]), M.wall);
        pm.position.set(p.c[0], p.h / 2, p.c[1]); scene.add(pm);
      }
      if (V.track) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(w - 1.6, 0.028, 0.028), M.rail);
        rail.position.set(cx, r.h - 0.022, cz); scene.add(rail);
      }
    }

    function addCorridor(L) {
      const a = roomById[L.a], b = roomById[L.b];
      const cw = V.doorW, ch = V.doorH + 0.15;
      if (L.axis === 'x') {
        const x0 = a.c[0] + a.s[0] / 2 + T, x1 = b.c[0] - b.s[0] / 2 - T, z = L.at;
        const len = x1 - x0; if (len <= 0.05) return;
        const mx = (x0 + x1) / 2;
        const fl = new THREE.Mesh(new THREE.PlaneGeometry(len, cw), M.floor);
        fl.rotation.x = -Math.PI / 2; fl.position.set(mx, 0, z); scene.add(fl);
        const ce = new THREE.Mesh(new THREE.PlaneGeometry(len, cw), M.ceil);
        ce.rotation.x = Math.PI / 2; ce.position.set(mx, ch, z); scene.add(ce);
        [-1, 1].forEach(s => {
          const wl = new THREE.Mesh(new THREE.BoxGeometry(len, ch, 0.1), M.wall);
          wl.position.set(mx, ch / 2, z + s * cw / 2); scene.add(wl);
        });
        const pl = new THREE.PointLight(0xfff2e0, V.corridor || 3.6, 9, 2); pl.position.set(mx, ch - 0.3, z); scene.add(pl);
        bounds.push({ x0: x0 - 0.5, x1: x1 + 0.5, z0: z - cw / 2 + 0.32, z1: z + cw / 2 - 0.32 });
      } else {
        const lo = L.rev ? b : a, hi = L.rev ? a : b;
        const z0 = lo.c[1] + lo.s[1] / 2 + T, z1 = hi.c[1] - hi.s[1] / 2 - T, x = L.at;
        const len = z1 - z0; if (len <= 0.05) return;
        const mz = (z0 + z1) / 2;
        const fl = new THREE.Mesh(new THREE.PlaneGeometry(cw, len), M.floor);
        fl.rotation.x = -Math.PI / 2; fl.position.set(x, 0, mz); scene.add(fl);
        const ce = new THREE.Mesh(new THREE.PlaneGeometry(cw, len), M.ceil);
        ce.rotation.x = Math.PI / 2; ce.position.set(x, ch, mz); scene.add(ce);
        [-1, 1].forEach(s => {
          const wl = new THREE.Mesh(new THREE.BoxGeometry(0.1, ch, len), M.wall);
          wl.position.set(x + s * cw / 2, ch / 2, mz); scene.add(wl);
        });
        const pl = new THREE.PointLight(0xfff2e0, V.corridor || 3.6, 9, 2); pl.position.set(x, ch - 0.3, mz); scene.add(pl);
        bounds.push({ x0: x - cw / 2 + 0.32, x1: x + cw / 2 - 0.32, z0: z0 - 0.5, z1: z1 + 0.5 });
      }
    }

    function addDoor(from, side, u, to) {
      const [ix, iz] = innerPlane(from, side), dir = WALL[side].dir, n = WALL[side].inN;
      const px = ix + dir[0] * u, pz = iz + dir[2] * u;
      const hit = new THREE.Mesh(new THREE.PlaneGeometry(V.doorW * 0.96, V.doorH * 0.96), hotspotMat());
      hit.position.set(px + n[0] * 0.06, V.doorH / 2, pz + n[2] * 0.06);
      hit.rotation.y = WALL[side].face;
      hit.userData = {
        type: 'door', from: from.id, to: to.id, label: to.name,
        entry: [px + n[0] * 2.7, pz + n[2] * 2.7],
        mid:   [px - n[0] * 0.5, pz - n[2] * 0.5],
        thru:  [px - n[0] * 2.6, pz - n[2] * 2.6]
      };
      scene.add(hit); clickable.push(hit); doors.push(hit.userData);
    }

    const loader = new THREE.TextureLoader();
    function addArt(r, a, lit) {
      const src = C[a.k], h = a.w / src.ar;
      let px, pz, ry, n;
      if (a.wall === 'P+' || a.wall === 'P-') {
        const p = r.partition, s = a.wall === 'P+' ? 1 : -1;
        px = p.c[0] + a.u; pz = p.c[1] + s * (p.s[1] / 2 + 0.02);
        ry = s > 0 ? 0 : Math.PI; n = [0, 0, s];
      } else {
        const [ix, iz] = innerPlane(r, a.wall), dir = WALL[a.wall].dir;
        n = WALL[a.wall].inN;
        px = ix + dir[0] * a.u + n[0] * 0.02;
        pz = iz + dir[2] * a.u + n[2] * 0.02;
        ry = WALL[a.wall].face;
      }
      const cy = 1.53;
      const grp = new THREE.Group();
      grp.position.set(px, cy, pz); grp.rotation.y = ry; scene.add(grp);

      const fw = a.w + (V.matW + V.frameW) * 2, fh = h + (V.matW + V.frameW) * 2;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, V.frameD), M.frame);
      frame.position.z = V.frameD / 2 - 0.004; grp.add(frame);
      const matte = new THREE.Mesh(new THREE.PlaneGeometry(a.w + V.matW * 2, h + V.matW * 2), M.mat);
      matte.position.z = V.frameD + 0.001; grp.add(matte);

      let tex;
      if (src.src) {
        tex = loader.load(src.src, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });
      } else {
        tex = placeholderTexture(THREE, src.ph, src.ar, V.darkPlaceholder);
      }
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(a.w, h),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.84, metalness: 0 }));
      pic.position.z = V.frameD + 0.003; grp.add(pic);

      const plq = new THREE.Mesh(new THREE.PlaneGeometry(0.33, 0.139),
        new THREE.MeshStandardMaterial({ map: plaqueTexture(THREE, src.title, src.meta, V.plaque), roughness: 0.95 }));
      plq.position.set(fw / 2 + 0.26, -fh / 2 + 0.06, 0.004); grp.add(plq);

      const hit = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), hotspotMat());
      hit.position.z = V.frameD + 0.02; grp.add(hit);

      const back = Math.max(2.05, a.w * 1.42);
      const rec = { room: r.id, title: src.title, meta: src.meta, note: src.note,
                    view: [px + n[0] * back, pz + n[2] * back], cy,
                    yaw: yawToward(-n[0], -n[2]) };
      hit.userData = { type: 'art', rec };
      clickable.push(hit); artRecords.push(rec);

      if (!lit) return;
      const sp = new THREE.SpotLight(V.spot.color, V.spot.i, V.spot.dist, V.spot.angle, V.spot.pen, 1.7);
      sp.position.set(px + n[0] * V.spot.standoff, r.h - 0.24, pz + n[2] * V.spot.standoff);
      sp.target.position.set(px, cy + 0.1, pz);
      scene.add(sp); scene.add(sp.target);

      if (V.track) {
        const head = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.046, 0.115, 12), M.track);
        head.position.set(sp.position.x, r.h - 0.135, sp.position.z);
        head.lookAt(px, cy, pz); head.rotateX(Math.PI / 2); scene.add(head);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.1, 8), M.track);
        stem.position.set(sp.position.x, r.h - 0.055, sp.position.z); scene.add(stem);
      }
    }

    V.rooms.forEach(addRoom);
    V.links.forEach(L => {
      addCorridor(L);
      addDoor(roomById[L.a], L._sA, L._uA, roomById[L.b]);
      addDoor(roomById[L.b], L._sB, L._uB, roomById[L.a]);
    });
    V.rooms.forEach(r => {
      const list = r.art || [];
      const lit = new Set([...list.keys()].sort((i, j) => list[j].w - list[i].w).slice(0, 3));
      list.forEach((a, i) => addArt(r, a, lit.has(i)));
    });

    /* ---------------------------------------------------------------- state */
    const startRoom = roomById[V.start.room];
    const state = {
      pos: new THREE.Vector3(V.start.pos[0], EYE, V.start.pos[1]),
      yaw: V.start.yaw, pitch: -0.02, room: startRoom.id,
      mode: 'free', focus: null, tween: null, yawTween: null, entered: false, queue: []
    };
    const keys = {};
    const home = r => r.home || [r.c[0], r.c[1] + Math.min(3.4, r.s[1] * 0.32)];
    const inBounds = (x, z) => bounds.some(b => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1);
    function roomAt(x, z) {
      for (const r of V.rooms) if (Math.abs(x - r.c[0]) < r.s[0] / 2 && Math.abs(z - r.c[1]) < r.s[1] / 2) return r.id;
      return state.room;
    }

    /* ------------------------------------------------------------------- UI */
    const serif = "'Spectral', Georgia, 'Times New Roman', serif";
    const sans = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";
    const shade = U.dark ? 'rgba(0,0,0,.65)' : 'rgba(255,255,255,.75)';

    const ui = el('div', 'position:absolute;inset:0;pointer-events:none;font-family:' + sans + ';color:' + U.ink + ';');
    host.appendChild(ui);

    const roomTag = el('div', 'position:absolute;top:26px;left:28px;');
    const roomName = el('div', 'font-family:' + serif + ';font-size:27px;font-weight:500;letter-spacing:-.01em;line-height:1.08;text-shadow:0 1px 16px ' + shade + ';');
    const roomSub = el('div', 'font-family:' + mono + ';font-size:10px;letter-spacing:.18em;text-transform:uppercase;opacity:.62;margin-top:8px;text-shadow:0 1px 10px ' + shade + ';');
    roomTag.append(roomName, roomSub); ui.appendChild(roomTag);

    const hint = el('div', 'position:absolute;bottom:26px;left:50%;transform:translateX(-50%);font-family:' + mono + ';font-size:10px;letter-spacing:.16em;text-transform:uppercase;opacity:0;transition:opacity .6s;white-space:nowrap;text-shadow:0 1px 10px ' + shade + ';',
      'drag to look · w a s d to walk · click a photograph or a doorway');
    ui.appendChild(hint);

    const tip = el('div', 'position:absolute;left:0;top:0;font-family:' + mono + ';font-size:10px;letter-spacing:.14em;text-transform:uppercase;padding:7px 11px;border:1px solid ' + U.edge + ';background:' + U.paper + ';opacity:0;transition:opacity .18s;transform:translate(-50%,-190%);white-space:nowrap;backdrop-filter:blur(8px);');
    ui.appendChild(tip);

    const caption = el('div', 'position:absolute;left:28px;bottom:28px;width:340px;max-width:calc(100% - 56px);background:' + U.paper + ';border:1px solid ' + U.edge + ';padding:22px 24px 20px;opacity:0;transform:translateY(12px);transition:opacity .5s,transform .5s;backdrop-filter:blur(10px);');
    const capTitle = el('div', 'font-family:' + serif + ';font-size:22px;font-weight:500;line-height:1.22;');
    const capMeta = el('div', 'font-family:' + mono + ';font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;opacity:.6;margin-top:10px;');
    const capNote = el('div', 'font-size:13.5px;line-height:1.62;opacity:.8;margin-top:15px;text-wrap:pretty;');
    const capBack = el('div', 'font-family:' + mono + ';font-size:9px;letter-spacing:.16em;text-transform:uppercase;opacity:.42;margin-top:18px;', 'esc, or click the room, to step back');
    caption.append(capTitle, capMeta, capNote, capBack); ui.appendChild(caption);

    const index = el('div', 'position:absolute;top:26px;right:28px;display:flex;flex-direction:column;gap:1px;align-items:flex-end;pointer-events:auto;');
    const idxBtn = {};
    V.rooms.forEach(r => {
      const b = el('button', 'appearance:none;background:none;border:0;cursor:pointer;font-family:' + mono + ';font-size:9.5px;letter-spacing:.17em;text-transform:uppercase;color:' + U.ink + ';opacity:.38;padding:6px 0 6px 16px;transition:opacity .3s;text-shadow:0 1px 10px ' + shade + ';', r.name);
      b.onmouseenter = () => { if (state.room !== r.id) b.style.opacity = '.8'; };
      b.onmouseleave = () => { b.style.opacity = state.room === r.id ? '1' : '.38'; };
      b.onclick = () => gotoRoom(r.id);
      index.appendChild(b); idxBtn[r.id] = b;
    });
    ui.appendChild(index);

    const cover = el('div', 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;background:' + V.bg + ';color:#f2efe9;pointer-events:auto;transition:opacity 1s;z-index:3;');
    const cvK = el('div', 'font-family:' + mono + ';font-size:9.5px;letter-spacing:.34em;text-transform:uppercase;opacity:.45;', V.label + ' · ' + V.rooms.length + ' rooms');
    const cvT = el('div', 'font-family:' + serif + ';font-size:clamp(38px,6.4vw,76px);font-weight:400;letter-spacing:-.022em;margin-top:22px;text-align:center;line-height:1.02;', 'Tokyo · Kyoto · Osaka');
    const cvS = el('div', 'font-size:14px;opacity:.55;margin-top:18px;max-width:430px;text-align:center;line-height:1.65;text-wrap:pretty;', V.blurb);
    const cvB = el('button', 'margin-top:40px;appearance:none;cursor:pointer;background:none;color:#f2efe9;border:1px solid rgba(242,239,233,.32);padding:14px 32px;font-family:' + mono + ';font-size:10px;letter-spacing:.28em;text-transform:uppercase;transition:background .35s,border-color .35s;', 'Enter the room');
    cvB.onmouseenter = () => { cvB.style.background = 'rgba(242,239,233,.1)'; cvB.style.borderColor = 'rgba(242,239,233,.66)'; };
    cvB.onmouseleave = () => { cvB.style.background = 'none'; cvB.style.borderColor = 'rgba(242,239,233,.32)'; };
    cover.append(cvK, cvT, cvS, cvB); host.appendChild(cover);

    const veil = el('div', 'position:absolute;inset:0;background:' + V.bg + ';opacity:0;pointer-events:none;transition:opacity .5s;z-index:2;');
    host.appendChild(veil);

    function setRoom(id) {
      if (state.room === id) return;
      state.room = id;
      const r = roomById[id];
      roomName.textContent = r.name; roomSub.textContent = r.sub;
      roomTag.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
        { duration: 560, easing: 'cubic-bezier(.2,.7,.2,1)' });
      Object.keys(idxBtn).forEach(k => idxBtn[k].style.opacity = k === id ? '1' : '.38');
    }
    roomName.textContent = startRoom.name; roomSub.textContent = startRoom.sub;
    idxBtn[startRoom.id].style.opacity = '1';

    /* --------------------------------------------------------------- motion */
    function path(points, endYaw, endPitch, dur, onDone, lookAlong) {
      const pts = points.map(p => new THREE.Vector3(p[0], EYE, p[1]));
      state.tween = { curve: new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35), t0: performance.now(), dur,
                      yaw0: state.yaw, dYaw: wrapPi(endYaw - state.yaw),
                      pitch0: state.pitch, dPitch: endPitch - state.pitch, onDone, lookAlong };
      state.yawTween = null;
    }
    function turnTo(y, dur) { state.yawTween = { y0: state.yaw, dy: wrapPi(y - state.yaw), t0: performance.now(), dur }; }

    function hideCaption() { caption.style.opacity = '0'; caption.style.transform = 'translateY(12px)'; }

    function approach(rec) {
      state.mode = 'art'; state.focus = rec; hint.style.opacity = '0';
      const mid = [(state.pos.x + rec.view[0]) / 2, (state.pos.z + rec.view[1]) / 2];
      path([[state.pos.x, state.pos.z], mid, rec.view], rec.yaw, 0.075, 1200, () => {
        capTitle.textContent = rec.title; capMeta.textContent = rec.meta; capNote.textContent = rec.note || '';
        caption.style.opacity = '1'; caption.style.transform = 'none';
      });
    }
    function stepBack() {
      if (state.mode !== 'art' || !state.focus) return;
      const r = roomById[state.focus.room];
      state.mode = 'free'; state.focus = null; hideCaption();
      const bx = Math.sin(state.yaw), bz = Math.cos(state.yaw);
      let d = 2.4;
      while (d > 0.3 && !inBounds(state.pos.x + bx * d, state.pos.z + bz * d)) d -= 0.3;
      const mid = [state.pos.x + bx * d * 0.5, state.pos.z + bz * d * 0.5];
      const away = [state.pos.x + bx * d, state.pos.z + bz * d];
      path([[state.pos.x, state.pos.z], mid, away], state.yaw, -0.02, 900, () => { hint.style.opacity = '.5'; });
      void r;
    }
    function heroYaw(roomId) {
      const rec = artRecords.find(a => a.room === roomId);
      return rec ? rec.yaw : state.yaw;
    }
    function travel(d, after) {
      state.mode = 'travel'; state.focus = null; hideCaption(); hint.style.opacity = '0';
      const t = roomById[d.to];
      const hp = home(t);
      const stand = [hp[0] * 0.72 + d.thru[0] * 0.28, hp[1] * 0.72 + d.thru[1] * 0.28];
      const endYaw = yawToward(t.c[0] - stand[0] || 0.001, t.c[1] - stand[1] || 0.001);
      path([[state.pos.x, state.pos.z], d.entry, d.mid, d.thru, stand], endYaw, -0.02, 2700, () => {
        state.mode = 'free'; hint.style.opacity = '.5';
        turnTo(heroYaw(d.to), 1100);
        if (after) after();
      }, true);
      setTimeout(() => setRoom(d.to), 1600);
    }
    function findPath(from, to) {
      const adj = {}; V.links.forEach(L => { (adj[L.a] = adj[L.a] || []).push(L.b); (adj[L.b] = adj[L.b] || []).push(L.a); });
      const prev = { [from]: null }, q = [from];
      while (q.length) {
        const n = q.shift(); if (n === to) break;
        (adj[n] || []).forEach(m => { if (!(m in prev)) { prev[m] = n; q.push(m); } });
      }
      if (!(to in prev)) return null;
      const out = []; let c = to; while (c !== from) { out.unshift(c); c = prev[c]; }
      return out;
    }
    function gotoRoom(id) {
      if (id === state.room || state.mode === 'travel') return;
      const hops = findPath(state.room, id);
      if (!hops || !hops.length) {
        veil.style.opacity = '1';
        setTimeout(() => {
          const r = roomById[id];
          const hp = home(r); state.pos.set(hp[0], EYE, hp[1]);
          state.yaw = heroYaw(id); state.pitch = -0.02; state.mode = 'free';
          setRoom(id); veil.style.opacity = '0';
        }, 500);
        return;
      }
      let i = 0;
      const step = () => {
        if (i >= hops.length) return;
        const nextId = hops[i++];
        const d = doors.find(x => x.from === state.room && x.to === nextId);
        if (!d) return;
        travel(d, step);
      };
      step();
    }

    /* ---------------------------------------------------------- interaction */
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
    function pick() {
      ray.setFromCamera(ptr, camera);
      const hits = ray.intersectObjects(scene.children, true);
      for (const h of hits) {
        if (h.object.userData && h.object.userData.type) return h.object;
        if (h.object.isMesh) return null;   // a wall, a floor, a frame — the target is occluded
      }
      return null;
    }
    let dragging = false, moved = 0, lx = 0, ly = 0, hovered = null, ptrIn = false;
    const dom = renderer.domElement;

    dom.addEventListener('pointerdown', e => {
      dragging = true; moved = 0; lx = e.clientX; ly = e.clientY;
      stage.style.cursor = 'grabbing'; dom.setPointerCapture(e.pointerId);
    });
    dom.addEventListener('pointermove', e => {
      const r = dom.getBoundingClientRect();
      ptrIn = true;
      ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      tip.style.left = (e.clientX - r.left) + 'px';
      tip.style.top = (e.clientY - r.top) + 'px';
      if (dragging) {
        const dx = e.clientX - lx, dy = e.clientY - ly;
        moved += Math.abs(dx) + Math.abs(dy);
        if (moved > 5) { state.tween = null; state.yawTween = null; if (state.mode === 'travel') state.mode = 'free'; }
        state.yaw -= dx * 0.0033;
        state.pitch = Math.max(-0.55, Math.min(0.5, state.pitch - dy * 0.0027));
        lx = e.clientX; ly = e.clientY;
      }
    });
    dom.addEventListener('pointerleave', () => { ptrIn = false; tip.style.opacity = '0'; });
    window.addEventListener('pointerup', () => { if (dragging) { dragging = false; stage.style.cursor = 'grab'; } });
    dom.addEventListener('click', () => {
      if (moved > 6) return;
      const o = pick();
      if (o) {
        const u = o.userData;
        if (u.type === 'art') { approach(u.rec); return; }
        if (u.type === 'door') { travel(u); return; }
      }
      if (state.mode === 'art') stepBack();
    });
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      if (e.key === 'Escape') stepBack();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k) && state.entered) e.preventDefault();
    });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

    cvB.onclick = () => {
      cover.style.opacity = '0';
      setTimeout(() => cover.style.display = 'none', 1000);
      state.entered = true;
      const r = startRoom, hp = home(r);
      path([[state.pos.x, state.pos.z], [(state.pos.x + hp[0]) / 2, (state.pos.z + hp[1]) / 2], hp],
        heroYaw(r.id), -0.02, 2600);
      setTimeout(() => { hint.style.opacity = '.5'; }, 2000);
      setTimeout(() => { hint.style.opacity = '0'; }, 13000);
    };

    /* ------------------------------------------------------------------ loop */
    function resize() {
      const w = host.clientWidth || 960, h = host.clientHeight || 600;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    resize();
    host._ro = new ResizeObserver(resize); host._ro.observe(host);

    let last = performance.now();
    const fwd = new THREE.Vector3(), sid = new THREE.Vector3();
    function frame(now) {
      if (host._dead) return;
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;

      if (state.tween) {
        const tw = state.tween;
        const raw = Math.min(1, (now - tw.t0) / tw.dur), t = easeIO(raw);
        const p = tw.curve.getPoint(t);
        state.pos.set(p.x, EYE, p.z);
        if (tw.lookAlong && raw < 0.8) {
          const tan = tw.curve.getTangent(Math.min(0.999, Math.max(0.001, t)));
          const want = yawToward(tan.x, tan.z);
          state.yaw += wrapPi(want - state.yaw) * Math.min(1, dt * 3.2);
          state.pitch += (0 - state.pitch) * Math.min(1, dt * 2.2);
        } else {
          state.yaw = tw.yaw0 + tw.dYaw * t;
          state.pitch = tw.pitch0 + tw.dPitch * t;
        }
        if (raw >= 1) { state.tween = null; if (tw.onDone) tw.onDone(); }
      } else if (state.yawTween) {
        const y = state.yawTween;
        const raw = Math.min(1, (now - y.t0) / y.dur);
        state.yaw = y.y0 + y.dy * easeIO(raw);
        if (raw >= 1) state.yawTween = null;
      } else if (state.entered) {
        let f = 0, s = 0;
        if (keys['w'] || keys['arrowup']) f += 1;
        if (keys['s'] || keys['arrowdown']) f -= 1;
        if (keys['a'] || keys['arrowleft']) s -= 1;
        if (keys['d'] || keys['arrowright']) s += 1;
        if (f || s) {
          if (state.mode === 'art') { hideCaption(); state.mode = 'free'; state.focus = null; }
          const sp = (keys['shift'] ? 3.2 : 1.8) * dt;
          fwd.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
          sid.set(Math.cos(state.yaw), 0, -Math.sin(state.yaw));
          const nx = state.pos.x + (fwd.x * f + sid.x * s) * sp;
          const nz = state.pos.z + (fwd.z * f + sid.z * s) * sp;
          if (inBounds(nx, state.pos.z)) state.pos.x = nx;
          if (inBounds(state.pos.x, nz)) state.pos.z = nz;
        }
      }

      if (state.mode !== 'travel') {
        const rid = roomAt(state.pos.x, state.pos.z);
        if (rid !== state.room) setRoom(rid);
      }

      camera.position.copy(state.pos);
      camera.rotation.set(state.pitch, state.yaw, 0);

      if (!dragging && state.entered && ptrIn) {
        const o = pick();
        if (o !== hovered) {
          hovered = o;
          if (o) {
            const u = o.userData;
            tip.textContent = u.type === 'door' ? '→ ' + u.label : u.rec.title;
            tip.style.opacity = '1'; stage.style.cursor = 'pointer';
          } else { tip.style.opacity = '0'; stage.style.cursor = 'grab'; }
        }
      }

      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }

  class GalleryRoom extends HTMLElement {
    connectedCallback() { if (this._up) return; this._up = true; this.start(); }
    disconnectedCallback() { this._dead = true; if (this._ro) this._ro.disconnect(); }
    async start() {
      try {
        const THREE = await import(THREE_URL);
        if (this._dead) return;
        buildApp(this, THREE, this.getAttribute('variant') || 'enfilade');
      } catch (err) {
        console.error('[gallery-room]', err);
        this.textContent = 'Could not load the room.';
      }
    }
  }
  if (!customElements.get('gallery-room')) customElements.define('gallery-room', GalleryRoom);
})();
