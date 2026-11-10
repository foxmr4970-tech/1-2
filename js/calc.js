// ======== Константы ========
const SQRT3 = Math.sqrt(3);

// Стандартные сечения, мм²
const SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];

// Номиналы автоматов, А
const BREAKERS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];

// Допустимый длительный ток (А), кабель в стене/трубе, по таблицам ПУЭ.
// Ключ 1 = две нагруженные жилы (1 фаза), 3 = три нагруженные жилы (3 фазы).
// null = такое сечение для алюминия не используем.
const CAP = {
  cu: {
    1: [19, 27, 38, 46, 70, 85, 115, 135, 175, 215, 260, 300],
    3: [17, 25, 35, 42, 60, 80, 100, 125, 170, 210, 255, 295],
  },
  al: {
    1: [null, 21, 29, 38, 55, 70, 90, 105, 135, 165, 200, 230],
    3: [null, 19, 27, 32, 47, 60, 75, 95, 130, 150, 180, 220],
  },
};

// Удельное сопротивление, Ом·мм²/м (с запасом на нагрев жилы)
const RHO = { cu: 0.0185, al: 0.0295 };

// ======== Вспомогательное ========
const $ = (id) => document.getElementById(id);

function num(text) {
  const s = String(text).trim().replace(",", ".");
  return s === "" ? NaN : Number(s);
}

function fmt(n, digits = 2) {
  return Number(n.toFixed(digits)).toLocaleString("ru-RU");
}

const state = { net: "1", mode: "kw", mat: "cu" };

// ======== Вкладки ========
function openTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + name));
  window.scrollTo(0, 0);
}

document.querySelectorAll(".tab").forEach((t) => {
  t.addEventListener("click", () => openTab(t.dataset.tab));
});

// ======== Переключатели (сеть, режим, материал) ========
function setSeg(group, value) {
  state[group] = value;
  const seg = document.querySelector(`.seg[data-group="${group}"]`);
  seg.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.value === value));
}

document.querySelectorAll(".seg").forEach((seg) => {
  seg.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    setSeg(seg.dataset.group, b.dataset.value);
    if (seg.dataset.group === "mode") updatePlaceholder();
    calculate();
  });
});

function updatePlaceholder() {
  $("val").placeholder = state.mode === "kw" ? "например 3.5 (кВт)" : "например 16 (А)";
}

// Быстрый выбор cos φ
$("cos-chips").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  $("cos").value = b.dataset.cos;
  calculate();
});

// Пересчёт при вводе любых цифр
["val", "cos", "len", "drop"].forEach((id) => $(id).addEventListener("input", calculate));

// ======== Расчёт линии ========
function box(name, value, sub, big) {
  return `
    <div class="res-card${big ? " big" : ""}">
      <div class="name">${name}</div>
      <div class="value">${value}</div>
      <div class="sub">${sub || ""}</div>
    </div>`;
}

function calculate() {
  const out = $("result");
  const val = num($("val").value);
  const cos = num($("cos").value);
  const len = num($("len").value);
  const dropMax = num($("drop").value);

  if ($("val").value.trim() === "") {
    out.innerHTML = "";
    return;
  }
  if (!(val > 0)) {
    out.innerHTML = `<div class="msg error">Введи мощность или ток числом больше нуля.</div>`;
    return;
  }
  if (!(cos > 0 && cos <= 1)) {
    out.innerHTML = `<div class="msg error">cos φ должен быть от 0.1 до 1.</div>`;
    return;
  }
  if (!(len >= 0)) {
    out.innerHTML = `<div class="msg error">Длина линии: введи число (метры).</div>`;
    return;
  }
  if (!(dropMax > 0)) {
    out.innerHTML = `<div class="msg error">Допустимое падение: введи число, обычно 5.</div>`;
    return;
  }

  const phases = state.net; // "1" или "3"
  const U = phases === "1" ? 220 : 380;
  const k = phases === "1" ? 1 : SQRT3; // множитель для мощности

  // Ток и мощность
  let I, P;
  if (state.mode === "kw") {
    P = val;
    I = (P * 1000) / (k * U * cos);
  } else {
    I = val;
    P = (k * U * I * cos) / 1000;
  }
  const kVA = (k * U * I) / 1000;

  // Автомат: ближайший стандартный не меньше расчётного тока
  const breaker = BREAKERS.find((b) => b >= I);
  if (!breaker) {
    out.innerHTML =
      `<div class="res-grid">${box("Расчётный ток", fmt(I, 1) + " А", fmt(P) + " кВт")}</div>` +
      `<div class="msg error">Ток больше 125 А. Нужен индивидуальный расчёт, это уже не для калькулятора.</div>`;
    return;
  }

  // Сечение по нагреву: кабель должен выдерживать номинал автомата
  const caps = CAP[state.mat][phases];
  let idx = caps.findIndex((c) => c !== null && c >= breaker);
  if (idx === -1) {
    out.innerHTML = `<div class="msg error">Для такого тока нет подходящего сечения в таблице. Нужен индивидуальный расчёт.</div>`;
    return;
  }
  const heatIdx = idx;

  // Падение напряжения (в вольтах) для сечения с индексом i
  const dropV = (i) => {
    const mult = phases === "1" ? 2 : SQRT3;
    return (mult * I * RHO[state.mat] * len) / SECTIONS[i];
  };

  // Увеличиваем сечение, пока падение не станет допустимым
  while ((dropV(idx) / U) * 100 > dropMax && idx < SECTIONS.length - 1) {
    idx++;
  }
  const S = SECTIONS[idx];
  const dV = dropV(idx);
  const dP = (dV / U) * 100;
  const dropOk = dP <= dropMax;

  const cable =
    phases === "1" ? `3×${S} (фаза, ноль, земля)` : `5×${S} (3 фазы, ноль, земля)`;
  const matName = state.mat === "cu" ? "медь" : "алюминий";

  let html = `<div class="res-grid">`;
  html += box("Расчётный ток", fmt(I, 1) + " А", fmt(P) + " кВт · " + fmt(kVA) + " кВА", true);
  html += box("Автомат", breaker + " А", phases === "1" ? "1-полюсный или 2-полюсный" : "3-полюсный");
  html += box("Сечение", S + " мм²", "Кабель " + cable + ", " + matName);
  html += box("Падение напряжения", fmt(dP, 1) + " %", fmt(dV, 1) + " В на " + fmt(len, 0) + " м");
  html += `</div>`;

  if (idx > heatIdx) {
    html += `<div class="msg warn">По нагреву хватило бы ${SECTIONS[heatIdx]} мм², но на длине ${fmt(len, 0)} м падение напряжения было бы слишком большим. Сечение увеличено до ${S} мм².</div>`;
  }
  if (!dropOk) {
    html += `<div class="msg error">Даже при ${S} мм² падение больше ${dropMax}%. Линия слишком длинная для такой нагрузки, нужно другое решение.</div>`;
  }
  if (S < 2.5 && state.mat === "cu") {
    html += `<div class="msg ok">${S} мм² подходит для освещения. Для розеток обычно берут не меньше 2.5 мм².</div>`;
  }
  out.innerHTML = html;
}

// ======== Вкладка «Нагрузка» ========
function addRow(name = "", kw = "", qty = 1) {
  const row = document.createElement("div");
  row.className = "row";
  row.innerHTML = `
    <input class="r-name" type="text" placeholder="Прибор" value="${name}" />
    <input class="r-kw" type="text" inputmode="decimal" placeholder="кВт" value="${kw}" />
    <input class="r-qty" type="text" inputmode="numeric" value="${qty}" />
    <button type="button" class="del">✕</button>`;
  $("rows").appendChild(row);
}

function loadTotal() {
  let sum = 0;
  document.querySelectorAll("#rows .row").forEach((row) => {
    const kw = num(row.querySelector(".r-kw").value);
    const qty = num(row.querySelector(".r-qty").value);
    if (kw > 0 && qty > 0) sum += kw * qty;
  });
  return sum;
}

function updateLoad() {
  const sum = loadTotal();
  const kc = num($("kc").value);
  const out = $("load-result");

  if (sum === 0) {
    out.innerHTML = "";
    return;
  }
  if (!(kc > 0 && kc <= 1)) {
    out.innerHTML = `<div class="msg error">Коэффициент спроса должен быть от 0.1 до 1.</div>`;
    return;
  }
  out.innerHTML = `<div class="res-grid">
    ${box("Сумма установленной мощности", fmt(sum) + " кВт", "")}
    ${box("Расчётная с учётом спроса", fmt(sum * kc) + " кВт", "Kс = " + kc)}
  </div>`;
}

$("add-row").addEventListener("click", () => addRow());

$("quick").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  addRow(b.dataset.name, b.dataset.kw, 1);
  updateLoad();
});

$("rows").addEventListener("input", updateLoad);
$("rows").addEventListener("click", (e) => {
  if (e.target.classList.contains("del")) {
    e.target.closest(".row").remove();
    updateLoad();
  }
});

$("kc").addEventListener("input", updateLoad);
$("kc-chips").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  $("kc").value = b.dataset.kc;
  updateLoad();
});

// Передать нагрузку в расчёт линии
$("use-load").addEventListener("click", () => {
  const sum = loadTotal();
  const kc = num($("kc").value);
  if (sum === 0 || !(kc > 0 && kc <= 1)) {
    $("load-result").innerHTML = `<div class="msg error">Сначала добавь приборы и проверь коэффициент спроса.</div>`;
    return;
  }
  $("val").value = Number((sum * kc).toFixed(2));
  setSeg("mode", "kw");
  updatePlaceholder();
  openTab("line");
  calculate();
});

// ======== Старт ========
addRow();
updatePlaceholder();