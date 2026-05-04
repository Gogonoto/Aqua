var AppState = {
    _data: {},
    _serverSyncTimer: null,

    load: function() {
        return fetch('/api/state')
        .then(response => response.json())
        .then(data => {
            this._data = data || {};
            this.saveLocal();
            applyLoadedState();
        })
        .catch(() => {
            try {
                var stored = localStorage.getItem('aquacalc_state');
                if (stored) this._data = JSON.parse(stored);
            } catch(e) { this._data = {}; }
            applyLoadedState();
        });
    },

    saveLocal: function() {
        localStorage.setItem('aquacalc_state', JSON.stringify(this._data));
    },

    scheduleSync: function() {
        clearTimeout(this._serverSyncTimer);
        this._serverSyncTimer = setTimeout(() => {
            fetch('/api/state', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(this._data)
            }).catch(() => {});
        }, 3000);
    },

    get: function(key, defaultValue) {
        return this._data.hasOwnProperty(key) ? this._data[key] : defaultValue;
    },
    set: function(key, value) {
        this._data[key] = value;
        this.saveLocal();
    }
};

var fishSpecies, compatibility, stock, equipment, maintenanceLog, currentMode;

function applyLoadedState() {
    fishSpecies = AppState.get('fishSpecies') || [
        { id: 1, name: "Неон голубой", minVolume: 10, size: 3, tempMin: 22, tempMax: 26, aggressive: false, layer: "середина", requirements: "" },
        { id: 2, name: "Гуппи", minVolume: 5, size: 3, tempMin: 22, tempMax: 26, aggressive: false, layer: "середина", requirements: "Живородящие, быстро размножаются" },
        { id: 3, name: "Анциструс", minVolume: 50, size: 12, tempMin: 22, tempMax: 28, aggressive: false, layer: "дно", requirements: "Нужна коряга для пищеварения" },
        { id: 4, name: "Скалярия", minVolume: 80, size: 15, tempMin: 24, tempMax: 28, aggressive: true, layer: "середина", requirements: "Высокий аквариум, нужны укрытия" },
        { id: 5, name: "Золотая рыбка", minVolume: 80, size: 20, tempMin: 18, tempMax: 23, aggressive: false, layer: "середина", requirements: "Холодноводная, мощный фильтр" }
    ];
    compatibility = AppState.get('compatibility') || {
        "1-2": '1', "1-3": '1', "1-4": '0', "1-5": '1',
        "2-3": '1', "2-4": '0', "2-5": '1',
        "3-4": '~', "3-5": '0',
        "4-5": '0'
    };
    stock = AppState.get('stock') || [];
    equipment = AppState.get('equipment') || [
        { id: 1, name: "Фильтр AquaEl 300", type: "filter", minVolume: 30, maxVolume: 100, char: "300 л/ч" },
        { id: 2, name: "Нагреватель 50Вт", type: "heater", minVolume: 20, maxVolume: 50, char: "50 Вт" },
        { id: 3, name: "Нагреватель 100Вт", type: "heater", minVolume: 60, maxVolume: 120, char: "100 Вт" }
    ];
    maintenanceLog = AppState.get('maintenanceLog') || [];
    currentMode = AppState.get('currentMode') || 'dimensions';
}

function markDirty() {
    AppState.set('fishSpecies', fishSpecies);
    AppState.set('compatibility', compatibility);
    AppState.set('stock', stock);
    AppState.set('equipment', equipment);
    AppState.set('maintenanceLog', maintenanceLog);
    AppState.set('currentMode', currentMode);
    AppState.scheduleSync();
}

function getCompatKey(a,b) { return a < b ? `${a}-${b}` : `${b}-${a}`; }
function areCompatible(a,b) {
    if (a===b) return '-';
    return compatibility[getCompatKey(a,b)] || '1';
}

// Глобальные ссылки
window.AppState = AppState;
window.markDirty = markDirty;
window.getCompatKey = getCompatKey;
window.areCompatible = areCompatible;

// Рыбка-советчик
function createAdviceFish() {
    if (document.querySelector('.fish-advice')) return;
    var fish = document.createElement('div');
    fish.className = 'fish-advice';
    fish.innerHTML = '🐠';
    fish.onclick = showRandomAdvice;
    document.body.appendChild(fish);
    var bubble = document.createElement('div');
    bubble.className = 'advice-bubble';
    bubble.id = 'adviceBubble';
    document.body.appendChild(bubble);
}
var adviceTimer;
function showRandomAdvice() {
    var bubble = document.getElementById('adviceBubble');
    if (!bubble) return;
    var advices = [
        "Регулярные подмены воды – залог здоровья рыб.",
        "Не перекармливайте: корм должен съедаться за 2-3 минуты.",
        "Анциструсы обожают коряги – они помогают пищеварению.",
        "Скалярии вырастают до 15 см, им нужен высокий аквариум.",
        "Золотые рыбки – холодноводные, не сажайте их с тропическими видами.",
        "Тесты на аммиак и нитриты обязательны при запуске.",
        "Растения не только украшают, но и потребляют нитраты.",
        "Грунт лучше брать фракцией 2-4 мм для большинства растений.",
        "Фильтр должен работать круглосуточно, не выключайте его на ночь.",
        "Запуская аквариум, запаситесь терпением – цикл может идти до месяца."
    ];
    var advice = advices[Math.floor(Math.random() * advices.length)];
    bubble.textContent = advice;
    bubble.style.display = 'block';
    clearTimeout(adviceTimer);
    adviceTimer = setTimeout(function() { bubble.style.display = 'none'; }, 10000);
}

window.addEventListener('load', function() {
    createAdviceFish();
});