// Four sketch directions for the Intellign five-layer stack, drawn with the anatomy kit.
// node build.mjs [--dark]  ->  index.html next to this file.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/testys/.claude/skills/anatomy/kit/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--dark") ? "dark" : "light";
const W = 600;
const H = 440;

// ---------- helpers shared by every sketch ----------
function tools(P) {
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (points, style) => k.dotsSvg(points, style);
  const path = (pts, closed = false) =>
    pts.map((p, i) => `${i ? "L" : "M"}${at(p).map((v) => v.toFixed(1)).join(" ")}`).join("") + (closed ? "Z" : "");
  // circle on a vertical face whose normal is +y (front) at y = y0
  const faceCircle = (cx, z, r, y0, n = 28) =>
    path(Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), y0, z + r * Math.sin((i / n) * 2 * Math.PI)]), true);
  const faceLine = (x1, z1, x2, z2, y0) => path([[x1, y0, z1], [x2, y0, z2]]);
  const faceRect = (x, z, w, h, y0) => path([[x, y0, z], [x + w, y0, z], [x + w, y0, z + h], [x, y0, z + h]], true);
  const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  return { at, S, L, D, path, faceCircle, faceLine, faceRect, byDepth };
}

function card({ fig, title, hint, readout, keys, caption, svg }) {
  return k.plateHtml({
    fig, title, hint, readout, keys, caption,
    body: `<div class="iso-stage">${svg}</div>`,
  });
}

// ---------- A · rack of five modules ----------
function rack() {
  const RW = 210, RD = 80, MW = 186, MH = 30, PITCH = 36, N = 5, Z0 = 6;
  const FY = RD / 2;
  const TOP = Z0 + N * PITCH + 6;
  const P = k.fitProjection(
    [...k.boxCorners({ x: -RW / 2 - 8, y: -RD / 2 - 8, w: RW + 16, d: RD + 16, r: 4 }, -12, TOP + 8)],
    W, H, { pad: 26, azimuth: 40 },
  );
  const T = tools(P);
  const { at, S, L, D, faceCircle, faceLine, faceRect } = T;
  const out = [];
  const base = { x: -RW / 2 - 6, y: -RD / 2 - 6, w: RW + 12, d: RD + 12, r: 5 };
  out.push(`<path class="iso-halo" d="${k.haloOf(base, -12, 12, P)}"/>`);
  for (const [x, y] of T.byDepth(k.corners(base, 12))) out.push(S(k.cylinder(x, y, 6, -12, 3, P, 24), { tone: "lo" }));
  out.push(S(k.slabOf(base, -9, 9, P, 6, 1), { tone: "lo" }));
  const post = (x, y) => ({ x, y, w: 12, d: 12, r: 2 });
  const postsBack = [post(-RW / 2, -RD / 2), post(RW / 2 - 12, -RD / 2)];
  const postsFront = [post(-RW / 2, RD / 2 - 12), post(RW / 2 - 12, RD / 2 - 12)];
  for (const p of postsBack) out.push(S(k.slabOf(p, 0, TOP, P, 3, 0.6), { tone: "mid" }));

  const names = ["Connect", "Check", "Understand", "Solve", "Plan"];
  for (let i = 0; i < N; i++) {
    const z0 = Z0 + i * PITCH;
    const plan = { x: -MW / 2, y: -RD / 2, w: MW, d: RD, r: 2 };
    const last = i === N - 1;
    out.push(S(k.slabOf(plan, z0, MH, P, 3, 0.6), { tone: last ? "hi" : "mid", lit: last }));
    out.push(L(faceRect(-MW / 2 + 4, z0 + 4, MW - 8, MH - 8, FY), { tone: "faint" }));
    out.push(D([[-MW / 2 + 7, z0 + 7], [-MW / 2 + 7, z0 + MH - 7], [MW / 2 - 7, z0 + 7], [MW / 2 - 7, z0 + MH - 7]].map(([x, z]) => at([x, FY, z])), { size: 0.45 }));
    // handle
    out.push(S(k.slabOf({ x: -MW / 2 + 14, y: FY, w: 3, d: 6, r: 0.8 }, z0 + 8, 14, P, 2), { tone: "mid", crease: "none" }));
    out.push(S(k.slabOf({ x: -MW / 2 + 42, y: FY, w: 3, d: 6, r: 0.8 }, z0 + 8, 14, P, 2), { tone: "mid", crease: "none" }));
    out.push(S(k.slabOf({ x: -MW / 2 + 14, y: FY + 5, w: 31, d: 3, r: 1.2 }, z0 + 8, 14, P, 2), { tone: "hi", crease: "lo" }));
    const zc = z0 + MH / 2;
    const left = -MW / 2 + 54;
    if (i === 0) {
      for (let j = 0; j < 6; j++) {
        const x = left + 6 + j * 17;
        out.push(L(faceCircle(x, zc, 5.4, FY), { tone: "mid" }));
        out.push(L(faceCircle(x, zc, 2.6, FY), { tone: "lo" }));
        out.push(D([at([x, FY, zc])], { size: 0.8, tone: "hi" }));
      }
      out.push(S(k.slabOf({ x: left + 6 + 17 * 2 - 2.5, y: FY, w: 5, d: 8, r: 1.2 }, zc - 5, 10, P, 2), { tone: "hi" }));
    } else if (i === 1) {
      for (let j = 0; j < 8; j++) {
        const x = left + 4 + j * 10;
        out.push(L(faceCircle(x, zc + 4, 2.6, FY, 14), { tone: "lo" }));
        out.push(D([at([x, FY, zc + 4])], { size: j === 5 ? 1.2 : 0.8, tone: j === 5 ? "lit" : "mid" }));
      }
      out.push(L(faceLine(left, zc - 7, left + 80, zc - 7, FY), { tone: "faint", free: true }));
      out.push(L(faceCircle(MW / 2 - 26, zc, 10.5, FY), { tone: "mid" }));
      for (let t = 0; t < 7; t++) {
        const a = Math.PI * (1.15 - t * 0.215);
        out.push(L(faceLine(MW / 2 - 26 + 7.8 * Math.cos(a), zc + 7.8 * Math.sin(a), MW / 2 - 26 + 9.4 * Math.cos(a), zc + 9.4 * Math.sin(a), FY), { tone: "lo" }));
      }
      out.push(L(faceLine(MW / 2 - 26, zc - 1, MW / 2 - 26 + 6, zc + 6, FY), { tone: "lit" }));
      out.push(D([at([MW / 2 - 26, FY, zc - 1])], { size: 0.7, tone: "hi" }));
    } else if (i === 2) {
      const dx = left, dw = MW - 54 - 34 - 2;
      out.push(S(k.slabOf({ x: dx, y: FY - 0.8, w: dw, d: 1.6, r: 0.5 }, zc - 9, 18, P, 2), { tone: "lo", crease: "none" }));
      out.push(L(faceLine(dx + 6, zc + 4, dx + 6 + 52, zc + 4, FY + 0.8), { tone: "mid", free: true }));
      out.push(L(faceLine(dx + 6, zc, dx + 6 + 38, zc, FY + 0.8), { tone: "mid", free: true }));
      out.push(L(faceLine(dx + 6, zc - 4, dx + 6 + 24, zc - 4, FY + 0.8), { tone: "lit", free: true }));
      for (const x of [MW / 2 - 24, MW / 2 - 12]) {
        out.push(L(faceCircle(x, zc, 4, FY), { tone: "mid" }));
        out.push(D([at([x, FY, zc])], { size: 0.7 }));
      }
    } else if (i === 3) {
      for (let j = 0; j < 7; j++) {
        const x = left + j * 8;
        out.push(L(faceLine(x, zc - 8, x, zc + 8, FY), { tone: "lo" }));
      }
      const cx = MW / 2 - 28;
      out.push(L(faceCircle(cx, zc, 11.5, FY), { tone: "mid" }));
      out.push(L(faceCircle(cx, zc, 9, FY), { tone: "faint" }));
      for (let t = 0; t < 12; t++) {
        const a = (t / 12) * 2 * Math.PI;
        out.push(L(faceLine(cx + 7.2 * Math.cos(a), zc + 7.2 * Math.sin(a), cx + 9 * Math.cos(a), zc + 9 * Math.sin(a), FY), { tone: "lo" }));
      }
      out.push(L(faceLine(cx, zc, cx + 6.5, zc + 3, FY), { tone: "lit" }));
      out.push(D([at([cx, FY, zc])], { size: 0.8, tone: "hi" }));
    } else {
      const cols = 14, rows = 3, gx = 8.2, x0 = left - 8, z1 = zc - 8;
      const pattern = "10110100101101" + "01101001011010" + "11010010110101";
      const on = [], off = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const p = at([x0 + c * gx, FY, z1 + r * 8]);
          (pattern[r * cols + c] === "1" ? on : off).push(p);
        }
      out.push(D(off, { size: 0.55, tone: "lo" }));
      out.push(D(on, { size: 1.7, tone: "lit" }));
    }
    out.push(L(faceLine(-MW / 2 + 54, z0 + 5, -MW / 2 + 54 + names[i].length * 3.4, z0 + 5, FY), { tone: "faint", free: true }));
  }
  out.push(S(k.slabOf({ x: -RW / 2, y: -RD / 2, w: RW, d: RD, r: 4 }, Z0 + N * PITCH, 6, P, 5, 0.8), { tone: "lo" }));
  for (const p of postsFront) out.push(S(k.slabOf(p, 0, TOP, P, 3, 0.6), { tone: "mid" }));
  const holes = [];
  for (const p of postsFront) for (let i = 0; i < N; i++) for (const dz of [4, MH - 4]) holes.push(at([p.x + 6, FY, Z0 + i * PITCH + dz]));
  out.push(D(holes, { size: 0.5 }));
  return k.figureSvg({ width: W, height: H, label: "An equipment rack with five modules: connect, check, understand, solve and plan.", body: out.join("") });
}

// ---------- B · stack of five sieves ----------
function sieves() {
  const R = 56, SH = 15, PITCH = 19, N = 5, Z0 = 6;
  const TOP = Z0 + N * PITCH;
  const P = k.fitProjection(
    [...k.boxCorners({ x: -90, y: -90, w: 180, d: 180, r: 8 }, -14, TOP + 40)],
    W, H, { pad: 26, azimuth: 40 },
  );
  const T = tools(P);
  const { at, S, L, D } = T;
  const out = [];
  const base = { x: -88, y: -88, w: 176, d: 176, r: 16 };
  out.push(`<path class="iso-halo" d="${k.haloOf(base, -14, 14, P)}"/>`);
  for (const [x, y] of T.byDepth(k.corners(base, 16))) out.push(S(k.cylinder(x, y, 7, -14, 4, P, 24), { tone: "lo" }));
  out.push(S(k.slabOf(base, -10, 10, P, 8, 1.2), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(base, 6), 0, P, 8), { tone: "faint" }));
  out.push(S(k.cylinder(0, 0, 60, 0, 6, P, 72, 0.8), { tone: "mid" }));
  out.push(L(k.knurl(0, 0, 60, 0, 6, 60, P, 0.3), { tone: "lo" }));
  const rod = (x, y) => out.push(S(k.cylinder(x, y, 2.4, 0, TOP + 22, P, 16), { tone: "mid", crease: "none" }));
  rod(-70, -10);
  for (let i = 0; i < N; i++) {
    const z = Z0 + i * PITCH;
    const last = i === N - 1;
    out.push(S(k.cylinder(0, 0, R + 2.6, z, 3, P, 72, 0.6), { tone: "mid" }));
    out.push(S(k.cylinder(0, 0, R, z + 3, SH - 3, P, 72, 0.6), { tone: last ? "hi" : "mid", lit: last }));
    out.push(L(k.knurl(0, 0, R, z + 3, z + SH, 64, P, 0.5), { tone: "lo" }));
    out.push(L(k.sideArc(0, 0, R, z + SH - 3.5, P, 40), { tone: "faint" }));
  }
  out.push(S(k.cylinder(0, 0, R - 2, TOP, 6, P, 72, 0.8), { tone: "hi", lit: true }));
  out.push(L(k.ring(0, 0, R - 8, TOP + 6, P, 72), { tone: "lo" }));
  const rt = k.radialTicks(0, 0, R - 3, 60, 5, TOP + 6, [1.2, 2.8], P);
  out.push(L(rt.minor, { tone: "lo" }), L(rt.major, { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 9, TOP + 6, 10, P, 28, 0.5), { tone: "mid" }));
  out.push(L(k.knurl(0, 0, 9, TOP + 6, TOP + 16, 24, P), { tone: "lo" }));
  rod(70, 10);
  out.push(S(k.slabOf({ x: -78, y: -6, w: 156, d: 12, r: 3 }, TOP + 18, 6, P, 3, 0.6), { tone: "mid" }));
  out.push(D([at([-70, 0, TOP + 24]), at([70, 0, TOP + 24])], { size: 0.5 }));
  for (const x of [-70, 70]) out.push(S(k.cylinder(x, x < 0 ? -10 : 10, 5, TOP + 24, 5, P, 20), { tone: "mid" }));
  return k.figureSvg({ width: W, height: H, label: "A stack of five test sieves clamped between a base and a lid.", body: out.join("") });
}

// ---------- C · five-drawer cabinet ----------
function cabinet() {
  const CW = 200, CD = 90, DH = 33, PITCH = 37, N = 5, Z0 = 6;
  const FY = CD / 2;
  const TOP = Z0 + N * PITCH;
  const pulls = [0, 6, 14, 26, 0];
  const P = k.fitProjection(
    [...k.boxCorners({ x: -CW / 2 - 4, y: -CD / 2 - 4, w: CW + 8, d: CD + 40, r: 4 }, -10, TOP + 8)],
    W, H, { pad: 26, azimuth: 40 },
  );
  const T = tools(P);
  const { at, S, L, D, faceRect, faceLine } = T;
  const out = [];
  const body = { x: -CW / 2, y: -CD / 2, w: CW, d: CD, r: 3 };
  out.push(`<path class="iso-halo" d="${k.haloOf(body, -10, 10, P)}"/>`);
  out.push(S(k.slabOf(k.insetPlan(body, 4), -8, 8, P, 3, 0.5), { tone: "lo" }));
  out.push(S(k.slabOf(body, 0, TOP + 2, P, 4, 0.8), { tone: "lo" }));
  const names = ["Connect", "Check", "Understand", "Solve", "Plan"];
  for (let i = 0; i < N; i++) {
    const z = Z0 + i * PITCH;
    const p = pulls[i];
    const last = i === N - 1;
    const plan = { x: -CW / 2 + 5, y: -CD / 2 + 4 + p, w: CW - 10, d: CD - 4, r: 2 };
    out.push(S(k.slabOf(plan, z, DH, P, 3, 0.7), { tone: last ? "hi" : "mid", lit: last }));
    if (p > 0) out.push(L(k.planOutline(k.insetPlan(plan, 4), z + DH, P, 3), { tone: "faint" }));
    const fy = FY + p;
    out.push(L(faceRect(-CW / 2 + 9, z + 4, CW - 18, DH - 8, fy), { tone: "faint" }));
    out.push(S(k.slabOf({ x: -17, y: fy, w: 3, d: 6, r: 0.8 }, z + 9, 5, P, 2), { tone: "mid", crease: "none" }));
    out.push(S(k.slabOf({ x: 14, y: fy, w: 3, d: 6, r: 0.8 }, z + 9, 5, P, 2), { tone: "mid", crease: "none" }));
    out.push(S(k.slabOf({ x: -17, y: fy + 5, w: 34, d: 3, r: 1.2 }, z + 9, 5, P, 2), { tone: "hi", crease: "lo" }));
    out.push(S(k.slabOf({ x: -26, y: fy, w: 52, d: 1.2, r: 0.4 }, z + 19, 9, P, 2), { tone: "lo", crease: "none" }));
    out.push(L(faceLine(-20, z + 24, -20 + names[i].length * 3.2, z + 24, fy + 1.2), { tone: "mid", free: true }));
    out.push(L(faceLine(-20, z + 21, 6, z + 21, fy + 1.2), { tone: "faint", free: true }));
    out.push(D([at([-23, fy + 1.2, z + 23.5]), at([23, fy + 1.2, z + 23.5])], { size: 0.4 }));
    out.push(D([at([-CW / 2 + 12, fy, z + DH - 6]), at([CW / 2 - 12, fy, z + DH - 6])], { size: 0.45 }));
  }
  out.push(S(k.slabOf({ x: -CW / 2 - 2, y: -CD / 2 - 2, w: CW + 4, d: CD + 4, r: 4 }, TOP + 2, 6, P, 5, 1), { tone: "mid" }));
  return k.figureSvg({ width: W, height: H, label: "A five-drawer cabinet, each drawer pulled out a different amount.", body: out.join("") });
}

// ---------- D · five machined plates on tie rods ----------
function plates() {
  const PW = 150, PH_ = 10, PITCH = 36, N = 5, Z0 = 8;
  const TOP = Z0 + (N - 1) * PITCH + PH_;
  const P = k.fitProjection(
    [...k.boxCorners({ x: -PW / 2 - 6, y: -PW / 2 - 6, w: PW + 12, d: PW + 12, r: 6 }, -12, TOP + 34)],
    W, H, { pad: 26, azimuth: 40 },
  );
  const T = tools(P);
  const { at, S, L, D } = T;
  const out = [];
  const rods = [[-PW / 2 + 9, -PW / 2 + 9], [PW / 2 - 9, -PW / 2 + 9], [-PW / 2 + 9, PW / 2 - 9], [PW / 2 - 9, PW / 2 - 9]];
  const sorted = T.byDepth(rods);
  const base = { x: -PW / 2 - 6, y: -PW / 2 - 6, w: PW + 12, d: PW + 12, r: 10 };
  out.push(`<path class="iso-halo" d="${k.haloOf(base, -12, 12, P)}"/>`);
  for (const [x, y] of T.byDepth(k.corners(base, 12))) out.push(S(k.cylinder(x, y, 6, -12, 4, P, 24), { tone: "lo" }));
  out.push(S(k.slabOf(base, -8, 8, P, 6, 1), { tone: "lo" }));
  const spacer = (x, y, z, h) => {
    out.push(S(k.cylinder(x, y, 5.6, z, h, P, 24), { tone: "mid", crease: "none" }));
    out.push(L(k.sideArc(x, y, 5.6, z + h / 2, P, 16), { tone: "faint" }));
  };
  for (let i = 0; i < N; i++) {
    const z = Z0 + i * PITCH;
    const last = i === N - 1;
    const plan = { x: -PW / 2, y: -PW / 2, w: PW, d: PW, r: 8 };
    if (i > 0) for (const [x, y] of sorted) spacer(x, y, z - (PITCH - PH_), PITCH - PH_);
    out.push(S(k.slabOf(plan, z, PH_, P, 8, 1.2), { tone: last ? "hi" : "mid", lit: last }));
    out.push(L(k.planOutline(k.insetPlan(plan, 6), z + PH_, P, 6), { tone: "faint" }));
    out.push(L(sorted.map(([x, y]) => k.ring(x, y, 5.6, z + PH_, P, 20)).join(""), { tone: "lo" }));
    const strip = { x: -PW / 2 + 22, y: PW / 2 - 20, w: PW - 44, d: 6, r: 1 };
    out.push(S(k.slabOf(strip, z + PH_, 0.6, P, 3), { tone: "lo", crease: "none" }));
    const ticks = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 4, 5, strip.y + 0.8, z + PH_ + 0.6, [2, 3.4], P);
    out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
    if (last) {
      const pat = "1011010010110101101001011011";
      const on = [], off = [];
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 7; c++) (pat[r * 7 + c] === "1" ? on : off).push(at([-PW / 2 + 28 + c * 14, -PW / 2 + 26 + r * 14, z + PH_]));
      out.push(D(off, { size: 0.6, tone: "lo" }));
      out.push(D(on, { size: 1.8, tone: "lit" }));
    }
  }
  const topZ = Z0 + (N - 1) * PITCH + PH_;
  for (const [x, y] of sorted) {
    out.push(S(k.cylinder(x, y, 2.6, topZ, 14, P, 16), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(x, y, 5, topZ + 14, 5, P, 6), { tone: "hi" }));
  }
  return k.figureSvg({ width: W, height: H, label: "Five machined plates held apart on four tie rods.", body: out.join("") });
}

const figs = [
  card({
    fig: "A", title: "Equipment rack",
    hint: "Modules slide in as you scroll", readout: "05 · Plan module seated",
    keys: [{ mark: "lit", label: "Layer 05: the plan module and its roster" }, { mark: "raised", label: "Each module is a real front panel" }],
    caption: "Five 1U modules in a rack. Jacks, lamps and a gauge, a display, a dial and vents, and a roster grid: each panel looks like its step.",
    svg: rack(),
  }),
  card({
    fig: "B", title: "Sieve stack",
    hint: "Material falls through finer meshes", readout: "5 sieves · clamped",
    keys: [{ mark: "lit", label: "Top lid with the scale ring" }, { mark: "raised", label: "Test sieves with lips and knurled rims" }],
    caption: "Five test sieves clamped between a base and a lid. Strongest as a filtering metaphor; the layers read as the same part repeated.",
    svg: sieves(),
  }),
  card({
    fig: "C", title: "Drawer cabinet",
    hint: "Drawers open one by one", readout: "drawer 04 open",
    keys: [{ mark: "lit", label: "Top drawer: your plan" }, { mark: "raised", label: "Drawers pulled out in stages" }],
    caption: "Five drawers with label plates and handles. Very legible and easy to animate, but it reads more as storage than as a pipeline.",
    svg: cabinet(),
  }),
  card({
    fig: "D", title: "Machined plates",
    hint: "Layers separate on scroll", readout: "5 plates · 4 tie rods",
    keys: [{ mark: "lit", label: "Top plate with the roster grid" }, { mark: "raised", label: "Plates on spacers and tie rods" }],
    caption: "The current five-layer idea, built as real plates: bevels, grooves, spacers, tie rods, nuts and a ruler on each edge.",
    svg: plates(),
  }),
].join("\n");

const file = join(HERE, "index.html");
writeFileSync(file, k.pageHtml({ title: "Intellign stack: four directions", theme, body: figs, script: "" }));
console.log("wrote", file);
