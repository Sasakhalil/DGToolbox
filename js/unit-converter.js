// DOM Elements
const inputValue = document.getElementById('inputValue');
const outputValue = document.getElementById('outputValue');
const fromUnit = document.getElementById('fromUnit');
const toUnit = document.getElementById('toUnit');
const formulaDisplay = document.getElementById('formulaDisplay');

// State
let currentCategory = 'length';

// --- Helpers ---
function t(key) {
    const lang = document.documentElement.lang || 'en';
    if (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][key]) {
        return window.TRANSLATIONS[lang][key];
    }
    return key;
}

// Unit Definitions
const UNITS = {
    length: {
        base: 'm',
        units: {
            m: { name: 'Meters', rate: 1 },
            km: { name: 'Kilometers', rate: 0.001 },
            cm: { name: 'Centimeters', rate: 100 },
            mm: { name: 'Millimeters', rate: 1000 },
            in: { name: 'Inches', rate: 39.3701 },
            ft: { name: 'Feet', rate: 3.28084 },
            yd: { name: 'Yards', rate: 1.09361 },
            mi: { name: 'Miles', rate: 0.000621371 }
        }
    },
    weight: {
        base: 'g',
        units: {
            g: { name: 'Grams', rate: 1 },
            kg: { name: 'Kilograms', rate: 0.001 },
            mg: { name: 'Milligrams', rate: 1000 },
            oz: { name: 'Ounces', rate: 0.035274 },
            lb: { name: 'Pounds', rate: 0.00220462 }
        }
    },
    temperature: {
        type: 'special',
        units: {
            C: { name: 'Celsius' },
            F: { name: 'Fahrenheit' },
            K: { name: 'Kelvin' }
        }
    },
    data: {
        base: 'B',
        units: {
            B: { name: 'Bytes', rate: 1 },
            KB: { name: 'Kilobytes', rate: 1 / 1024 },
            MB: { name: 'Megabytes', rate: 1 / (1024 * 1024) },
            GB: { name: 'Gigabytes', rate: 1 / (1024 * 1024 * 1024) },
            TB: { name: 'Terabytes', rate: 1 / (1024 * 1024 * 1024 * 1024) }
        }
    },
    time: {
        base: 's',
        units: {
            s: { name: 'Seconds', rate: 1 },
            min: { name: 'Minutes', rate: 1 / 60 },
            h: { name: 'Hours', rate: 1 / 3600 },
            d: { name: 'Days', rate: 1 / 86400 },
            wk: { name: 'Weeks', rate: 1 / 604800 },
            mo: { name: 'Months (Avg)', rate: 1 / 2.628e+6 },
            y: { name: 'Years (Avg)', rate: 1 / 3.154e+7 }
        }
    },
    speed: {
        base: 'm_s',
        units: {
            m_s: { name: 'Meters/Second', rate: 1 },
            km_h: { name: 'Kilometers/Hour', rate: 3.6 },
            mph: { name: 'Miles/Hour', rate: 2.23694 },
            kn: { name: 'Knots', rate: 1.94384 }
        }
    }
};

// --- Initialization ---
function init() {
    // Load saved category
    const savedCat = localStorage.getItem('dg_unit_cat');
    if (savedCat && UNITS[savedCat]) {
        currentCategory = savedCat;
    }

    setCategory(currentCategory);

    // Listeners
    inputValue.addEventListener('input', convert);
    fromUnit.addEventListener('change', convert);
    toUnit.addEventListener('change', convert);
}

// --- Core Logic ---
function setCategory(cat) {
    currentCategory = cat;
    localStorage.setItem('dg_unit_cat', cat);

    // Update Tabs
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.remove('active');
        // Simple text check might fail with translation changes, but 
        // relying on onclick="setCategory('...')" is safer logic.
        // We use the button's click handler logic match essentially.
        // But for visual active state:
        if (btn.getAttribute('onclick').includes(`'${cat}'`)) {
            btn.classList.add('active');
        }
    });

    // Populate Selects
    const data = UNITS[cat];
    const keys = Object.keys(data.units);

    fromUnit.innerHTML = '';
    toUnit.innerHTML = '';

    keys.forEach(key => {
        const unit = data.units[key];
        fromUnit.add(new Option(unit.name, key));
        toUnit.add(new Option(unit.name, key));
    });

    // Set Defaults (Smart Selection)
    if (cat === 'length') { fromUnit.value = 'm'; toUnit.value = 'ft'; }
    else if (cat === 'weight') { fromUnit.value = 'kg'; toUnit.value = 'lb'; }
    else if (cat === 'temperature') { fromUnit.value = 'C'; toUnit.value = 'F'; }
    else if (cat === 'data') { fromUnit.value = 'MB'; toUnit.value = 'GB'; }
    else if (cat === 'time') { fromUnit.value = 'min'; toUnit.value = 's'; }
    else if (cat === 'speed') { fromUnit.value = 'km_h'; toUnit.value = 'mph'; }
    else { toUnit.value = keys[1] || keys[0]; }

    convert();
    playSound('switch');
}

function convert() {
    const val = parseFloat(inputValue.value);
    const from = fromUnit.value;
    const to = toUnit.value;
    const data = UNITS[currentCategory];

    if (isNaN(val)) {
        outputValue.value = '';
        formulaDisplay.innerText = t('unit_err_invalid');
        return;
    }

    let result;
    let formula = '';

    if (currentCategory === 'temperature') {
        result = convertTemp(val, from, to);
        formula = getTempFormula(val, from, to);
    } else {
        // Standard conversion via base unit
        const fromRate = data.units[from].rate;
        const toRate = data.units[to].rate;

        const baseVal = val / fromRate;
        result = baseVal * toRate;

        // Formula display using unit names (English for now)
        formula = `1 ${data.units[from].name} = ${(toRate / fromRate).toPrecision(4)} ${data.units[to].name}`;
    }

    // Format output
    if (Math.abs(result) < 0.000001 || Math.abs(result) > 1e9) {
        outputValue.value = result.toExponential(4);
    } else {
        outputValue.value = parseFloat(result.toPrecision(6));
    }

    formulaDisplay.innerText = formula;
    trackToolUsage('Unit Studio');
}

function convertTemp(val, from, to) {
    if (from === to) return val;

    let celsius;
    // To Celsius
    if (from === 'C') celsius = val;
    else if (from === 'F') celsius = (val - 32) * 5 / 9;
    else if (from === 'K') celsius = val - 273.15;

    // From Celsius
    if (to === 'C') return celsius;
    else if (to === 'F') return (celsius * 9 / 5) + 32;
    else if (to === 'K') return celsius + 273.15;
}

function getTempFormula(val, from, to) {
    if (from === to) return 'Same unit';
    if (from === 'C' && to === 'F') return `(${val}°C × 9/5) + 32 = ${((val * 9 / 5) + 32).toFixed(2)}°F`;
    if (from === 'F' && to === 'C') return `(${val}°F − 32) × 5/9 = ${((val - 32) * 5 / 9).toFixed(2)}°C`;
    return 'Complex conversion';
}

function swapUnits() {
    const temp = fromUnit.value;
    fromUnit.value = toUnit.value;
    toUnit.value = temp;
    convert();
    playSound('click');

    // Animate icon
    const icon = document.querySelector('.swap-btn i');
    if (icon) {
        icon.style.transform = 'rotate(180deg)';
        setTimeout(() => icon.style.transform = 'rotate(0deg)', 300);
    }
}

// Start
init();
