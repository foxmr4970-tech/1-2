// Типовая мощность приборов, кВт. Реальная мощность написана на шильдике.
const DEVICES = [
  // Кухня
  ["Чайник электрический", 2],
  ["Микроволновка", 1.2],
  ["Духовой шкаф", 3],
  ["Варочная панель электрическая", 7],
  ["Электроплита", 8],
  ["Холодильник", 0.15],
  ["Морозильная камера", 0.2],
  ["Посудомоечная машина", 2],
  ["Вытяжка", 0.2],
  ["Тостер", 0.8],
  ["Кофемашина", 1.5],
  ["Кофеварка", 1],
  ["Блендер", 0.5],
  ["Мультиварка", 0.9],
  ["Мясорубка", 1],
  ["Миксер", 0.4],
  ["Аэрогриль", 1.5],
  ["Хлебопечка", 0.7],
  ["Проточный водонагреватель", 5],
  // Стирка и уборка
  ["Стиральная машина", 2.2],
  ["Сушильная машина", 2.5],
  ["Утюг", 2],
  ["Парогенератор", 2.2],
  ["Пылесос", 1.8],
  ["Робот-пылесос", 0.05],
  // Вода и отопление
  ["Бойлер 50 л", 1.5],
  ["Бойлер 80 л", 2],
  ["Бойлер 100 л", 2],
  ["Электрокотёл 6 кВт", 6],
  ["Электрокотёл 9 кВт", 9],
  ["Масляный радиатор", 2],
  ["Конвектор", 1.5],
  ["Тепловентилятор", 2],
  ["Тепловая пушка 3 кВт", 3],
  ["Тепловая пушка 5 кВт", 5],
  ["Инфракрасный обогреватель", 1],
  ["Тёплый пол электрический", 1.2],
  ["Полотенцесушитель электрический", 0.1],
  ["Циркуляционный насос", 0.1],
  ["Насос повышения давления", 0.75],
  ["Скважинный насос", 0.75],
  ["Дренажный насос", 0.5],
  ["Насосная станция", 1],
  // Климат
  ["Кондиционер 7 (2 кВт)", 2],
  ["Кондиционер 9 (2.5 кВт)", 2.5],
  ["Кондиционер 12 (3.5 кВт)", 3.5],
  ["Кондиционер 18 (5 кВт)", 5],
  ["Вентилятор", 0.06],
  ["Вентилятор вытяжной", 0.03],
  ["Увлажнитель воздуха", 0.03],
  ["Осушитель воздуха", 0.3],
  ["Рекуператор", 0.2],
  // Электроника
  ["Телевизор", 0.15],
  ["Компьютер", 0.4],
  ["Ноутбук", 0.09],
  ["Монитор", 0.05],
  ["Игровая приставка", 0.2],
  ["Роутер", 0.015],
  ["Принтер", 0.4],
  ["Зарядка телефона", 0.02],
  ["Музыкальный центр", 0.1],
  // Освещение
  ["Освещение", 0.5],
  ["Лампа светодиодная", 0.01],
  ["Прожектор светодиодный 50 Вт", 0.05],
  ["Прожектор светодиодный 100 Вт", 0.1],
  ["Прожектор галогенный 500 Вт", 0.5],
  // Личный уход
  ["Фен", 1.8],
  ["Электробритва", 0.02],
  ["Плойка", 0.05],
  // Инструмент
  ["Перфоратор", 1],
  ["Дрель", 0.8],
  ["Болгарка (УШМ)", 1.2],
  ["Болгарка большая", 2.2],
  ["Циркулярная пила", 1.8],
  ["Электропила цепная", 2],
  ["Рубанок электрический", 0.9],
  ["Лобзик электрический", 0.6],
  ["Шуруповёрт сетевой", 0.5],
  ["Штроборез", 2],
  ["Строительный фен", 2],
  ["Сварочный инвертор 160 А", 4.5],
  ["Сварочный инвертор 200 А", 6],
  ["Компрессор", 2.2],
  ["Мойка высокого давления", 1.8],
  ["Газонокосилка электрическая", 1.5],
  ["Бетономешалка", 0.8],
  // Двигатели и станки
  ["Двигатель 0.75 кВт", 0.75],
  ["Двигатель 1.5 кВт", 1.5],
  ["Двигатель 2.2 кВт", 2.2],
  ["Двигатель 3 кВт", 3],
  ["Двигатель 5.5 кВт", 5.5],
  ["Двигатель 7.5 кВт", 7.5],
  ["Станок токарный", 3],
  ["Станок сверлильный", 0.8],
  ["Станок заточной", 0.4],
  ["Ворота откатные (привод)", 0.5],
  ["Шлагбаум", 0.2],
  ["Лифт", 7.5],
  ["Электроинструмент (общий)", 1.5],
  // Дом и двор
  ["Зарядка электромобиля 3.7 кВт", 3.7],
  ["Зарядка электромобиля 7 кВт", 7],
  ["Зарядка электромобиля 11 кВт", 11],
  ["Сауна электрическая", 9],
  ["Джакузи", 3],
  ["Бассейн (насос и нагрев)", 3],
  ["Видеонаблюдение", 0.1],
  ["Сигнализация", 0.02],
  ["Электрозабор", 0.01],
];

// ======== Свой список подсказок ========
const sugg = document.createElement("div");
sugg.id = "sugg";
document.body.appendChild(sugg);

let lastName = "";
let activeInput = null;

function findDevice(text) {
  const t = text.trim().toLowerCase();
  return DEVICES.find(([name]) => name.toLowerCase() === t);
}

function hideSugg() {
  sugg.style.display = "none";
}

function showSugg(input) {
  const t = input.value.trim().toLowerCase();
  lastName = input.value.trim();
  updateSearchBtn();

  if (t.length < 1) return hideSugg();

  const found = DEVICES.filter(([name]) => name.toLowerCase().includes(t)).slice(0, 6);
  if (found.length === 0) return hideSugg();

  activeInput = input;
  sugg.innerHTML = found
    .map(([name, kw]) => `<button type="button" data-name="${name}" data-kw="${kw}">${name}<span>${kw} кВт</span></button>`)
    .join("");

  // Ставим список под полем ввода, шириной во весь список приборов
  const rows = input.closest("#rows").getBoundingClientRect();
  const inp = input.getBoundingClientRect();
  sugg.style.left = rows.left + window.scrollX + "px";
  sugg.style.width = rows.width + "px";
  sugg.style.top = inp.bottom + window.scrollY + 4 + "px";
  sugg.style.display = "block";
}

function pick(name, kw) {
  if (!activeInput) return;
  activeInput.value = name;
  lastName = name;
  const kwInput = activeInput.closest(".row").querySelector(".r-kw");
  kwInput.value = kw;
  // Сообщаем calc.js, что число изменилось, чтобы пересчиталась сумма
  kwInput.dispatchEvent(new Event("input", { bubbles: true }));
  hideSugg();
  updateSearchBtn();
}

// Печатаем в поле «Прибор»
document.addEventListener("input", (e) => {
  if (!e.target.classList.contains("r-name")) return;
  showSugg(e.target);
});

document.addEventListener("focusin", (e) => {
  if (e.target.classList.contains("r-name") && e.target.value.trim() !== "") showSugg(e.target);
});

// Не даём полю потерять фокус при нажатии на подсказку
sugg.addEventListener("mousedown", (e) => e.preventDefault());
sugg.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) pick(b.dataset.name, b.dataset.kw);
});

// Нажали в другом месте, подсказки пропадают
document.addEventListener("click", (e) => {
  if (!e.target.closest("#sugg") && !e.target.classList.contains("r-name")) hideSugg();
});

// ======== Кнопка поиска в интернете ========
const searchBtn = document.createElement("button");
searchBtn.type = "button";
searchBtn.className = "btn-second full";
searchBtn.style.display = "none";
$("add-row").after(searchBtn);

function updateSearchBtn() {
  if (lastName.length < 2 || findDevice(lastName)) {
    searchBtn.style.display = "none";
    return;
  }
  searchBtn.style.display = "block";
  searchBtn.textContent = `🔍 Найти мощность «${lastName}» в интернете`;
}

searchBtn.addEventListener("click", () => {
  const q = encodeURIComponent(lastName + " потребляемая мощность Вт");
  window.open("https://www.google.com/search?q=" + q, "_blank");
});