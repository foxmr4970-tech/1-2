// ======== Новые вкладки: добавляем в шапку и на страницу ========
const NEW_TABS = [
  ["motor", "Двигатель"],
  ["protect", "Защита"],
  ["more", "Ещё"],
  ["ref", "Справочник"],
];

NEW_TABS.forEach(([id, name]) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "tab";
  b.dataset.tab = id;
  b.textContent = name;
  b.addEventListener("click", () => openTab(id));
  document.querySelector(".tabs").appendChild(b);

  const s = document.createElement("section");
  s.id = "tab-" + id;
  s.className = "panel";
  document.querySelector("main").appendChild(s);
});

// ======== Вспомогательное ========
function field(label, id, value, hint) {
  return `<div class="block"><div class="label">${label}</div>
    <input id="${id}" type="text" inputmode="decimal" value="${value}" placeholder="${hint || ""}" /></div>`;
}

function segVal(id) {
  return document.querySelector("#" + id + " .active").dataset.value;
}

function showErr(out, text) {
  out.innerHTML = `<div class="msg error">${text}</div>`;
}

// Переключатели в новых вкладках
document.addEventListener("click", (e) => {
  const b = e.target.closest(".newseg button");
  if (!b) return;
  b.parentElement.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
  recalcAll();
});

// ======== Вкладка «Двигатель» ========
$("tab-motor").innerHTML = `
  <div class="block"><div class="label">Сеть</div>
    <div class="seg newseg" id="m-net">
      <button type="button" data-value="3" class="active">3 фазы · 380 В</button>
      <button type="button" data-value="1">1 фаза · 220 В</button>
    </div></div>
  ${field("Мощность двигателя на валу (по шильдику), кВт", "m-p", "", "например 5.5")}
  ${field("cos φ (на шильдике)", "m-cos", "0.85")}
  ${field("КПД, % (на шильдике)", "m-eff", "90")}
  ${field("Кратность пускового тока Iп/Iн (обычно 5–8)", "m-k", "7")}
  <div id="m-out" class="result"></div>
  <p class="note">Автомат берётся с запасом 1.25 от рабочего тока. Для насосов, компрессоров и станков с тяжёлым пуском
  ставят кривую D, для остального обычно C. Сечение дано для меди.</p>`;

function motor() {
  const out = $("m-out");
  if ($("m-p").value.trim() === "") {
    out.innerHTML = "";
    return;
  }
  const P = num($("m-p").value);
  const cos = num($("m-cos").value);
  const eff = num($("m-eff").value) / 100;
  const kp = num($("m-k").value);
  if (!(P > 0)) return showErr(out, "Введи мощность двигателя числом больше нуля.");
  if (!(cos >= 0.1 && cos <= 1)) return showErr(out, "cos φ должен быть от 0.1 до 1.");
  if (!(eff >= 0.1 && eff <= 1)) return showErr(out, "КПД введи в процентах, например 90.");
  if (!(kp >= 1 && kp <= 12)) return showErr(out, "Кратность пуска обычно от 5 до 8.");

  const net = segVal("m-net");
  const U = net === "3" ? 380 : 220;
  const k = net === "3" ? SQRT3 : 1;
  const P1 = P / eff;
  const I = (P1 * 1000) / (k * U * cos);
  const Is = I * kp;
  const breaker = BREAKERS.find((b) => b >= I * 1.25);
  if (!breaker) return showErr(out, "Ток слишком большой для калькулятора, нужен индивидуальный расчёт.");
  const idx = CAP.cu[net].findIndex((c) => c !== null && c >= breaker);
  const curve = kp > 7 ? "D" : "C";

  out.innerHTML = `<div class="res-grid">
    ${box("Рабочий ток", fmt(I, 1) + " А", "Потребляет из сети " + fmt(P1) + " кВт", true)}
    ${box("Пусковой ток", fmt(Is, 0) + " А", "кратковременно")}
    ${box("Автомат", breaker + " А", "кривая " + curve + " (при тяжёлом пуске D)")}
    ${box("Сечение (медь)", idx === -1 ? "—" : SECTIONS[idx] + " мм²", net === "3" ? "кабель 4×" + (idx === -1 ? "?" : SECTIONS[idx]) + " или 5× с землёй" : "кабель 3×" + (idx === -1 ? "?" : SECTIONS[idx]))}
    ${box("Тепловое реле", fmt(I, 1) + " А", "уставка по рабочему току")}
  </div>`;
}

// ======== Вкладка «Защита» (ток КЗ) ========
$("tab-protect").innerHTML = `
  <div class="block"><div class="label">Материал жил</div>
    <div class="seg newseg" id="p-mat">
      <button type="button" data-value="cu" class="active">Медь</button>
      <button type="button" data-value="al">Алюминий</button>
    </div></div>
  <div class="block"><div class="label">Сечение кабеля, мм²</div>
    <select id="p-s">${SECTIONS.map((s) => `<option value="${s}"${s === 2.5 ? " selected" : ""}>${s}</option>`).join("")}</select></div>
  <div class="block"><div class="label">Автомат, А</div>
    <select id="p-in">${BREAKERS.map((b) => `<option value="${b}"${b === 16 ? " selected" : ""}>${b}</option>`).join("")}</select>
    <div class="label" style="margin-top:12px">Кривая</div>
    <div class="seg newseg" id="p-curve">
      <button type="button" data-value="B">B</button>
      <button type="button" data-value="C" class="active">C</button>
      <button type="button" data-value="D">D</button>
    </div></div>
  ${field("Длина линии от щита, м", "p-len", "20")}
  ${field("Сопротивление сети до щита, Ом (если не знаешь, 0.15)", "p-rs", "0.15")}
  <div id="p-out" class="result"></div>
  <p class="note">Расчёт приблизительный, фазный и нулевой проводники одного сечения. Точнее всего это показывает
  замер петли «фаза-ноль» специальным прибором на объекте.</p>`;

function protect() {
  const out = $("p-out");
  const S = num($("p-s").value);
  const In = num($("p-in").value);
  const L = num($("p-len").value);
  const Rs = num($("p-rs").value);
  if (!(L >= 0) || !(Rs >= 0)) return showErr(out, "Введи длину и сопротивление сети числами.");

  const rho = RHO[segVal("p-mat")];
  const thr = { B: 5, C: 10, D: 20 }[segVal("p-curve")];
  const need = thr * In;
  const Rloop = (rho * 2 * L) / S + Rs;
  const Ikz = 220 / Rloop;
  const Lmax = ((220 / need - Rs) * S) / (rho * 2);
  const ok = Ikz >= need;

  out.innerHTML = `<div class="res-grid">
    ${box("Ток КЗ в конце линии", fmt(Ikz, 0) + " А", "петля фаза-ноль", true)}
    ${box("Нужно не меньше", fmt(need, 0) + " А", thr + " × " + In + " А")}
    ${box("Макс. длина линии", Lmax > 0 ? fmt(Lmax, 0) + " м" : "—", "для этого автомата и сечения")}
  </div>
  <div class="msg ${ok ? "ok" : "error"}">${
    ok
      ? "Автомат отключится при коротком замыкании в конце линии."
      : "Автомат может не отключиться при КЗ. Уменьши длину, увеличь сечение или поставь автомат меньшего номинала или с кривой B."
  }</div>`;
}

// ======== Вкладка «Ещё» ========
$("tab-more").innerHTML = `
  <h3 class="sect">Сечение по диаметру жилы</h3>
  ${field("Диаметр одной жилы, мм (штангенциркулем, без изоляции)", "d-d", "", "например 1.78")}
  <div id="d-out" class="result"></div>

  <h3 class="sect">Компенсация реактивной мощности</h3>
  ${field("Активная мощность, кВт", "c-p", "", "например 30")}
  ${field("cos φ сейчас", "c-1", "0.7")}
  ${field("cos φ нужно получить", "c-2", "0.95")}
  <div id="c-out" class="result"></div>

  <h3 class="sect">Стоимость электроэнергии</h3>
  ${field("Мощность прибора, кВт", "e-p", "", "например 2")}
  ${field("Часов работы в день", "e-h", "", "например 3")}
  ${field("Тариф, цена за 1 кВт·ч", "e-t", "", "смотри в квитанции")}
  <div id="e-out" class="result"></div>`;

function more() {
  // Сечение по диаметру
  let out = $("d-out");
  if ($("d-d").value.trim() === "") out.innerHTML = "";
  else {
    const d = num($("d-d").value);
    if (!(d > 0 && d < 20)) showErr(out, "Введи диаметр в мм, например 1.78.");
    else {
      const s = (Math.PI * d * d) / 4;
      const near = SECTIONS.reduce((a, b) => (Math.abs(b - s) < Math.abs(a - s) ? b : a));
      out.innerHTML = `<div class="res-grid">${box("Сечение жилы", fmt(s) + " мм²", "ближайшее стандартное: " + near + " мм²", true)}</div>
        <p class="note">Только для одножильного провода. Реальные жилы часто тоньше заявленного, это нормально для проверки на брак.</p>`;
    }
  }

  // Конденсаторы
  out = $("c-out");
  if ($("c-p").value.trim() === "") out.innerHTML = "";
  else {
    const P = num($("c-p").value);
    const c1 = num($("c-1").value);
    const c2 = num($("c-2").value);
    if (!(P > 0) || !(c1 > 0 && c1 <= 1) || !(c2 > 0 && c2 <= 1)) showErr(out, "Проверь числа: cos φ от 0.1 до 1.");
    else if (c1 >= c2) showErr(out, "Текущий cos φ уже не меньше нужного, компенсация не требуется.");
    else {
      const Q = P * (Math.tan(Math.acos(c1)) - Math.tan(Math.acos(c2)));
      out.innerHTML = `<div class="res-grid">${box("Мощность конденсаторов", fmt(Q, 1) + " кВАр", "подбери ближайшую батарею в большую сторону", true)}</div>`;
    }
  }

  // Стоимость
  out = $("e-out");
  if ($("e-p").value.trim() === "" || $("e-h").value.trim() === "" || $("e-t").value.trim() === "") out.innerHTML = "";
  else {
    const P = num($("e-p").value);
    const h = num($("e-h").value);
    const t = num($("e-t").value);
    if (!(P > 0) || !(h > 0 && h <= 24) || !(t > 0)) showErr(out, "Введи мощность, часы (до 24) и тариф числами.");
    else {
      const day = P * h;
      out.innerHTML = `<div class="res-grid">
        ${box("В месяц", fmt(day * 30) + " кВт·ч", fmt(day * 30 * t) + " по тарифу", true)}
        ${box("В день", fmt(day) + " кВт·ч", fmt(day * t))}
        ${box("В год", fmt(day * 365) + " кВт·ч", fmt(day * 365 * t))}
      </div>`;
    }
  }
}

// ======== Вкладка «Справочник» ========
const capRows = SECTIONS.map(
  (s, i) =>
    `<tr><td>${s}</td><td>${CAP.cu[1][i]}</td><td>${CAP.cu[3][i]}</td><td>${CAP.al[1][i] ?? "—"}</td><td>${CAP.al[3][i] ?? "—"}</td></tr>`
).join("");

$("tab-ref").innerHTML = `
  <div class="block"><h3 class="sect">Правило на глаз</h3>
    <p>220 В: <b>1 кВт ≈ 4.5 А</b><br>380 В: <b>1 кВт ≈ 1.5 А</b><br>(для нагрузки с cos φ = 1)</p></div>

  <div class="block"><h3 class="sect">Цвета проводов</h3>
    <table class="tbl">
      <tr><td>Фаза L1</td><td>жёлтый</td></tr>
      <tr><td>Фаза L2</td><td>зелёный</td></tr>
      <tr><td>Фаза L3</td><td>красный</td></tr>
      <tr><td>Ноль N</td><td>голубой</td></tr>
      <tr><td>Земля PE</td><td>жёлто-зелёный</td></tr>
    </table></div>

  <div class="block"><h3 class="sect">Кривые автоматов</h3>
    <table class="tbl">
      <tr><td><b>B</b></td><td>срабатывает при 3–5 × In</td><td>освещение, длинные линии</td></tr>
      <tr><td><b>C</b></td><td>5–10 × In</td><td>розетки, быт</td></tr>
      <tr><td><b>D</b></td><td>10–20 × In</td><td>двигатели, трансформаторы</td></tr>
    </table></div>

  <div class="block"><h3 class="sect">УЗО и дифавтомат</h3>
    <table class="tbl">
      <tr><td><b>10–30 мА</b></td><td>защита людей: розетки, ванная, улица</td></tr>
      <tr><td><b>100–300 мА</b></td><td>противопожарная защита, на вводе</td></tr>
      <tr><td><b>Тип A</b></td><td>для техники с электроникой, лучше чем AC</td></tr>
    </table></div>

  <div class="block"><h3 class="sect">Степень защиты IP</h3>
    <p>Первая цифра: пыль и предметы (2 — пальцы, 5 — пылезащита, 6 — пыленепроницаемо).<br>
    Вторая цифра: вода (4 — брызги, 5 — струи, 7 — кратковременное погружение).</p>
    <table class="tbl">
      <tr><td>IP20</td><td>щиток в сухом помещении</td></tr>
      <tr><td>IP44</td><td>ванная, кухня, навес</td></tr>
      <tr><td>IP54–IP65</td><td>улица, пыльные цеха</td></tr>
    </table></div>

  <div class="block"><h3 class="sect">Допустимый ток кабеля, А</h3>
    <p class="note">Кабель в стене или трубе. 1ф = две нагруженные жилы, 3ф = три.</p>
    <table class="tbl">
      <tr><th>мм²</th><th>Cu 1ф</th><th>Cu 3ф</th><th>Al 1ф</th><th>Al 3ф</th></tr>
      ${capRows}
    </table></div>`;

// ======== Пересчёт всего ========
function recalcAll() {
  motor();
  protect();
  more();
}

$("tab-motor").addEventListener("input", recalcAll);
$("tab-protect").addEventListener("input", recalcAll);
$("tab-protect").addEventListener("change", recalcAll);
$("tab-more").addEventListener("input", recalcAll);

recalcAll();// ======== Вкладка «Нагрузка»: какой кабель подходит ========
const cableBlock = document.createElement("div");
cableBlock.innerHTML = `
  <div class="block"><div class="label">Какой кабель нужен на эту нагрузку</div>
    <div class="seg newseg" id="l-net">
      <button type="button" data-value="1" class="active">1 фаза · 220 В</button>
      <button type="button" data-value="3">3 фазы · 380 В</button>
    </div>
    <div class="label">Длина линии, м</div>
    <input id="l-len" type="text" inputmode="decimal" value="20" />
  </div>
  <div id="l-cable" class="result"></div>`;
$("load-result").after(cableBlock);

function loadCable() {
  const out = $("l-cable");
  const sum = loadTotal();
  const kc = num($("kc").value);
  const len = num($("l-len").value);

  if (sum === 0 || !(kc > 0 && kc <= 1)) {
    out.innerHTML = "";
    return;
  }
  if (!(len >= 0)) return showErr(out, "Длина линии: введи число в метрах.");

  const P = sum * kc;
  const net = segVal("l-net");
  const U = net === "1" ? 220 : 380;
  const k = net === "1" ? 1 : SQRT3;
  const I = (P * 1000) / (k * U * 0.95); // cos φ = 0.95 для бытовой нагрузки

  const breaker = BREAKERS.find((b) => b >= I);
  if (!breaker) return showErr(out, "Ток больше 125 А. Нужен индивидуальный расчёт.");

  let idx = CAP.cu[net].findIndex((c) => c !== null && c >= breaker);
  if (idx === -1) return showErr(out, "Нет подходящего сечения в таблице. Нужен индивидуальный расчёт.");

  const mult = net === "1" ? 2 : SQRT3;
  const dropPct = (i) => ((mult * I * RHO.cu * len) / SECTIONS[i] / U) * 100;
  while (dropPct(idx) > 5 && idx < SECTIONS.length - 1) idx++;

  const S = SECTIONS[idx];
  const cable = net === "1" ? `3×${S}` : `5×${S}`;

  out.innerHTML = `<div class="res-grid">
    ${box("Кабель (медь)", cable + " мм²", net === "1" ? "фаза, ноль, земля" : "3 фазы, ноль, земля", true)}
    ${box("Автомат", breaker + " А", "ток нагрузки " + fmt(I, 1) + " А")}
    ${box("Падение напряжения", fmt(dropPct(idx), 1) + " %", "на " + fmt(len, 0) + " м")}
  </div>
  <p class="note">Расчёт для меди, cos φ = 0.95. Для алюминия и точных вариантов используй вкладку «Линия».</p>`;
}

// Пересчитываем при любом изменении во вкладке «Нагрузка»
const tabLoad = $("tab-load");
tabLoad.addEventListener("input", () => setTimeout(loadCable, 0));
tabLoad.addEventListener("click", () => setTimeout(loadCable, 0));