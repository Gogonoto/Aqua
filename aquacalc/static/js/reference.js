function renderAllRef() {
    renderSpeciesTable();
    renderEquipTable();
}
function renderSpeciesTable() {
    var tbody = document.querySelector('#speciesTable tbody');
    if (!tbody) return;
    tbody.innerHTML = fishSpecies.map(s => `<tr>
        <td>${s.name}</td><td>${s.minVolume}</td><td>${s.size}</td><td>${s.tempMin}-${s.tempMax}</td>
        <td>${s.requirements||''}</td><td>${s.aggressive?'Да':'Нет'}</td>
        <td><button onclick="deleteSpecies(${s.id})">Удалить</button></td>
    </tr>`).join('');
}
function addSpecies() {
    var name = document.getElementById('spName').value.trim();
    if (!name) return;
    var newId = Math.max(...fishSpecies.map(s=>s.id),0)+1;
    var species = {
        id: newId, name,
        minVolume: parseInt(document.getElementById('spVolume').value)||10,
        size: parseInt(document.getElementById('spSize').value)||3,
        tempMin: parseInt(document.getElementById('spTmin').value)||22,
        tempMax: parseInt(document.getElementById('spTmax').value)||26,
        aggressive: document.getElementById('spAggr').checked,
        layer: document.getElementById('spLayer').value,
        requirements: document.getElementById('spRequirements').value.trim()
    };
    fishSpecies.push(species);
    fishSpecies.forEach(s=>{ if(s.id!==newId) compatibility[getCompatKey(newId,s.id)]='1'; });
    markDirty();
    renderAllRef();
    if (typeof populateFishSelect === 'function') populateFishSelect();
    document.getElementById('spName').value='';
    document.getElementById('spRequirements').value='';
}
function deleteSpecies(id) {
    if (!confirm('Удалить вид?')) return;
    for (var k in compatibility) if (k.startsWith(id+'-')||k.endsWith('-'+id)) delete compatibility[k];
    fishSpecies = fishSpecies.filter(s=>s.id!==id);
    stock = stock.filter(item=>item.speciesId!==id);
    markDirty();
    renderAllRef();
    if (typeof renderStockTable === 'function') renderStockTable();
    if (typeof populateFishSelect === 'function') populateFishSelect();
}
function renderEquipTable() {
    var tbody = document.querySelector('#equipTable tbody');
    if (!tbody) return;
    tbody.innerHTML = equipment.map(e => `<tr>
        <td>${e.name}</td><td>${e.type}</td><td>${e.minVolume}</td><td>${e.maxVolume}</td><td>${e.char}</td>
        <td><button onclick="deleteEquip(${e.id})">Удалить</button></td>
    </tr>`).join('');
}
function addEquipment() {
    var name = document.getElementById('eqName').value.trim();
    if (!name) return;
    equipment.push({
        id: Math.max(...equipment.map(e=>e.id),0)+1,
        name,
        type: document.getElementById('eqType').value,
        minVolume: parseInt(document.getElementById('eqMinVol').value)||10,
        maxVolume: parseInt(document.getElementById('eqMaxVol').value)||100,
        char: document.getElementById('eqChar').value
    });
    markDirty();
    renderEquipTable();
    document.getElementById('eqName').value='';
}
function deleteEquip(id) { equipment = equipment.filter(e=>e.id!==id); markDirty(); renderEquipTable(); }

function showCompatMatrix() {
    var container = document.getElementById('compatMatrixContainer');
    if (!container) return;
    var html = '<table class="compat-matrix"><tr><th></th>';
    fishSpecies.forEach(s => html += `<th class="compat-header" onclick="highlightSpecies(${s.id})">${s.name}</th>`);
    html += '</tr>';
    fishSpecies.forEach(s1 => {
        html += `<tr><td class="compat-rowname" onclick="highlightSpecies(${s1.id})" style="cursor:pointer; font-weight:bold;">${s1.name}</td>`;
        fishSpecies.forEach(s2 => {
            var comp = areCompatible(s1.id, s2.id);
            var cls = '', symbol = '';
            if (s1.id === s2.id) { symbol = '-'; }
            else if (comp === '1') { symbol = '✓'; cls = 'compat-yes'; }
            else if (comp === '0') { symbol = '✗'; cls = 'compat-no'; }
            else if (comp === '~') { symbol = '~'; cls = 'compat-maybe'; }
            html += `<td class="compat-cell ${cls}" data-id1="${s1.id}" data-id2="${s2.id}" onclick="cycleCompat(${s1.id},${s2.id})">${symbol}</td>`;
        });
        html += '</tr>';
    });
    html += '</table>';
    container.innerHTML = html;
}
function cycleCompat(id1, id2) {
    if (id1 === id2) return;
    var key = getCompatKey(id1, id2);
    var current = compatibility[key] || '1';
    var next = current === '1' ? '~' : current === '~' ? '0' : '1';
    compatibility[key] = next;
    markDirty();
    showCompatMatrix();
    if (typeof updateCompatibilityWarnings === 'function') updateCompatibilityWarnings();
}
function highlightSpecies(speciesId) {
    document.querySelectorAll('.compat-cell').forEach(cell => cell.classList.remove('highlight'));
    document.querySelectorAll('.compat-header, .compat-rowname').forEach(el => el.style.background = '');
    document.querySelectorAll(`.compat-cell[data-id1="${speciesId}"]`).forEach(cell => cell.classList.add('highlight'));
    document.querySelectorAll(`.compat-cell[data-id2="${speciesId}"]`).forEach(cell => cell.classList.add('highlight'));
    var headers = document.querySelectorAll('.compat-header');
    headers.forEach(th => { if (parseInt(th.getAttribute('onclick')?.match(/\d+/)?.[0]) === speciesId) th.style.background = '#cce5ff'; });
    var rowNames = document.querySelectorAll('.compat-rowname');
    rowNames.forEach(td => { if (parseInt(td.getAttribute('onclick')?.match(/\d+/)?.[0]) === speciesId) td.style.background = '#cce5ff'; });
}