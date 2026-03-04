/**
 * UI Renderer (v18.9 - Main Passive Color Sync)
 */
/**
 * UI Renderer (v19.0 - Searchable Passive Slots)
 */
window.renderPassivePanel = (slotIdx, label, pName, currentAwake, isMainPassive) => {
    // ... (冒頭のロジックは変更なし)
    const info = passiveMaster.find(m => m.name === pName);
    const grade = selections[slotIdx].grade;
    const maxAwake = window.getMaxAwake(pName, grade, isMainPassive);
    const isAdv = info && info.type === "上級";
    const isInvalid = pName && ( (isAdv && ["N", "R"].includes(grade)) || (!isAdv && ["LR", "GR"].includes(grade)) );

    let borderClass = 'border-[#5d4534] opacity-80'; 
    let bgGrad = 'from-[#2a1b13] to-[#1e140c]';
    let accentText = 'text-amber-100/30';

    if (pName) {
        borderClass = isAdv ? 'border-red-900 shadow-[0_0_15px_rgba(255,0,0,0.2)]' : 'border-sky-900 shadow-[0_0_15px_rgba(0,150,255,0.2)]';
        bgGrad = isAdv ? 'from-[#4a1a1a]/50 via-[#1a120c]' : 'from-[#1a3a4a]/50 via-[#1a120c]';
        accentText = isAdv ? 'text-red-400' : 'text-sky-400';
    }

    if (isInvalid) { borderClass = 'border-red-600/50 animate-pulse'; bgGrad = 'from-[#660000]/30 to-[#1a120c]'; }

    // --- 【修正：サブパッシブのみをinput + datalistに変更】 ---
    const datalistId = `list-${slotIdx}-${label}`;
    const secondRow = label === "MAIN" ? `
        <div class="relative py-1">
            <div class="text-sm font-black ${pName ? accentText : 'text-white/20'} tracking-wider h-8 flex items-center border-b border-white/10 truncate drop-shadow-sm">
                ${pName || "未設定"}
            </div>
            ${isInvalid ? '<span class="absolute -top-4 right-0 text-red-400 text-[10px] font-black animate-bounce drop-shadow-md bg-black px-1">変換不可</span>' : ''}
        </div>
    ` : `
        <div class="relative py-1">
            <input list="${datalistId}" 
                class="w-full bg-[#05040a] border border-[#5d4534] ${pName ? accentText : 'text-amber-100/20'} p-1.5 rounded font-bold text-[10px] outline-none shadow-inner focus:border-yellow-700" 
                placeholder="検索または選択..."
                value="${pName || ''}"
                onchange="handleSubSelect(${slotIdx}, ${parseInt(label.replace('SUB',''))-1}, this.value)">
            
            <datalist id="${datalistId}">
                ${passiveMaster.map(m => `<option value="${m.name}">${m.type}：${m.name}</option>`).join('')}
            </datalist>
            ${isInvalid ? '<span class="absolute -top-4 right-0 text-red-500 text-[10px] font-black animate-bounce drop-shadow-md bg-black px-1">変換不可</span>' : ''}
        </div>
    `;

    const boxBase = "flex items-center justify-center font-black rs-font-lcd text-xl shadow-inner border border-white/5 rounded h-11 bg-black/40";

    return `
        <div style="flex: 0 0 250px;" class="relative p-4 rounded-lg border-l-4 ${borderClass} bg-gradient-to-r ${bgGrad} to-[#05040a] border-y border-r border-[#5d4534]/50 shadow-2xl transition-all">
            <div class="text-[9px] font-black tracking-[0.15em] ${pName ? (isAdv ? 'text-red-400' : 'text-sky-400') : 'text-amber-100/20'} mb-1 uppercase">✦ ${label}</div>
            <div class="mb-3">${secondRow}</div>
            <div class="grid grid-cols-4 gap-1 mb-1 px-1 text-[12px] font-black text-center">
                <span class="text-amber-100/60">基本</span><span class="text-amber-100/60">超越</span>
                <span class="text-red-600/90 tracking-tighter">覚醒(${maxAwake})</span><span class="text-yellow-600">合計</span>
            </div>
            <div class="grid grid-cols-4 gap-1">
                <div class="${boxBase} text-slate-300" id="v-${slotIdx}-${label}-b">0</div>
                <div class="${boxBase} text-slate-300" id="v-${slotIdx}-${label}-t">0</div>
                <div class="bg-red-950/30 border border-red-900/20 rounded h-11 flex items-center justify-center shadow-inner">
                    <input type="number" class="w-full bg-transparent text-center text-xl font-black text-red-700 outline-none rs-font-lcd" 
                        id="v-${slotIdx}-${label}-a" value="${currentAwake || 0}" min="0" max="${maxAwake}" 
                        onchange="handleAwakeChange(${slotIdx}, '${label}', this.value)"
                        ${maxAwake === 0 ? 'readonly disabled' : ''}>
                </div>
                <div class="${boxBase} text-yellow-500 border-yellow-900/20">
                    <div class="italic drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]" id="v-${slotIdx}-${label}-tot">0</div>
                </div>
            </div>
        </div>`;
};

window.renderSummary = (totals) => {
    const area = document.getElementById('summary-area'); if (!area) return;
    const activePassives = Object.keys(totals).filter(k => totals[k] > 0).sort((a,b) => totals[b] - totals[a]);
    area.innerHTML = activePassives.map(pName => {
        const totalLv = totals[pName];
        const masterInfo = passiveMaster.find(m => m.name === pName);
        const isAdv = masterInfo && masterInfo.type === '上級';
        const effects = passiveDetails.filter(d => d.name === pName);
        
        // 数値が0または該当なしを除外するロジック
        const effectsListHtml = effects.map(eff => {
            const targetLv = Math.min(totalLv, 50);
            const rawValue = eff.levels[`lv${targetLv}`] || '0';
            
            // 数値が "0" または "-" または空の場合は表示しない
            if (rawValue === '0' || rawValue === '-' || rawValue === '') return null;

            let vals = rawValue.includes('/') ? rawValue.split('/') : [rawValue];
            let formattedEffect = eff.effect;
            const matches = formattedEffect.match(/\[[+-]?\d\]/g);
            
            if (matches) { 
                matches.forEach(m => { 
                    const currentVal = vals.shift() || '0'; 
                    formattedEffect = formattedEffect.replace(m, ` [ <b class="text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.4)]">${currentVal}</b> ] `); 
                }); 
            }
            return `<div class="py-2 border-b border-amber-900/20 last:border-0 text-[10px] text-amber-50/90 leading-relaxed font-bold tracking-tight">${formattedEffect}</div>`;
        }).filter(html => html !== null).join(''); // nullを除外して結合

        // 有効な効果が一つもない場合はパッシブ自体をサマリに出さない
        if (effectsListHtml === '') return '';

        const borderClass = isAdv ? 'border-red-800 shadow-[0_5px_15px_rgba(0,0,0,0.8)]' : 'border-cyan-900 shadow-[0_5px_15px_rgba(0,0,0,0.8)]';
        const bgGrad = isAdv ? 'from-[#3a0a0a] via-[#1a0c08]' : 'from-[#0a1a2a] via-[#0a0c1a]';
        return `<div class="p-4 rounded-xl border border-amber-600/20 bg-gradient-to-br ${bgGrad} to-[#05040a] mb-5 border-l-4 ${borderClass} shadow-2xl relative overflow-hidden"><div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div><div class="relative z-10 flex justify-between items-end mb-2 pb-2 border-b border-amber-600/20"><div><span class="text-[9px] font-black uppercase ${isAdv ? 'text-red-500/80' : 'text-cyan-500/80'} tracking-widest drop-shadow-sm">${masterInfo ? masterInfo.type : ''}</span><div class="font-black text-yellow-50 text-base leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">${pName}</div></div><div class="text-2xl font-black text-yellow-500 rs-font-lcd italic drop-shadow-[0_0_12px_rgba(255,215,0,0.5)]">Lv.${totalLv}</div></div><div class="relative z-10 space-y-0">${effectsListHtml}</div></div>`;
    }).join('') || '<p class="text-amber-200/20 text-sm italic text-center py-10">有効なパッシブはありません</p>';
};

window.renderDatabaseTable = (filterText = "") => {
    const tbody = document.getElementById("db-table-body"); if (!tbody) return;
    if (!window.currentSort) {
        window.currentSort = { key: "grade", asc: false };
    }
    const term = filterText.toLowerCase();
    let sortedData = [...creatureData];
    const gradeWeight = { "GR": 5, "LR": 4, "SR": 3, "HR": 2, "R": 1, "N": 0 };
    sortedData.sort((a, b) => {
        const sortKey = window.currentSort?.key || "grade";
        const asc = window.currentSort?.asc ?? false;
    
        let valA = a?.[sortKey] ?? "";
        let valB = b?.[sortKey] ?? "";
    
        if (sortKey === 'grade') {
            valA = gradeWeight[valA] || 0;
            valB = gradeWeight[valB] || 0;
        }
    
        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
        return 0;
    });
    const filtered = sortedData.filter(c => (c.name||"").toLowerCase().includes(term) || (c.main||"").toLowerCase().includes(term) || (c.subs && c.subs.some(s => s.toLowerCase().includes(term))));
    tbody.innerHTML = filtered.map(c => `<tr class="hover:bg-white/5 border-b border-[#5d4534]/20"><td class="p-3 font-black grade-${(c.grade||'n').toLowerCase()}">${c.grade}</td><td class="p-3 font-bold text-yellow-50/80 text-sm">${c.name}</td><td class="p-3 text-yellow-600 font-black text-sm">${c.main || '-'}</td><td class="p-3 text-cyan-500/90 text-xs font-bold">${c.subs[0] || '-'}</td><td class="p-3 text-cyan-500/90 text-xs font-bold">${c.subs[1] || '-'}</td><td class="p-3 text-cyan-500/90 text-xs font-bold">${c.subs[2] || '-'}</td></tr>`).join('');
};

window.renderEffectsTable = (filterText = "") => {
    const header = document.getElementById("eff-table-header");
    const body = document.getElementById("eff-table-body");
    if (!header || !body) return;
    
    let headerHtml = `<th class="p-3 sticky-col col-name">パッシブ名</th><th class="p-3 sticky-col col-desc" style="left:160px">効果内容</th>`;
    for (let i = 1; i <= 50; i++) headerHtml += `<th class="p-3 text-center min-w-[65px] font-bold text-amber-100/40 border-l border-white/5">Lv${i}</th>`;
    header.innerHTML = headerHtml;

    const term = (filterText || "").toLowerCase();
    const displayData = term ? passiveDetails.filter(d => d.name.toLowerCase().includes(term)) : passiveDetails;
    let lastPName = "";
    
    body.innerHTML = displayData.map(d => {
        let lvCells = "";
        for (let i = 1; i <= 50; i++) {
            const val = d.levels[`lv${i}`] || '-';
            lvCells += `<td class="val-cell ${val !== '-' ? 'has-val' : ''} text-[10px] text-slate-400 font-bold">${val}</td>`;
        }
        const isNew = d.name !== lastPName; lastPName = d.name;
        return `<tr class="${isNew ? 'group-separator' : 'sub-row border-t border-[#5d4534]/20'}">
            <td class="p-3 sticky-col col-name bg-[#241c14] font-bold text-slate-200 text-xs shadow-[2px_0_5px_rgba(0,0,0,0.5)]">${isNew ? d.name : ""}</td>
            <td class="p-3 sticky-col col-desc bg-[#241c14] text-slate-400 font-bold text-[10px] shadow-[2px_0_5px_rgba(0,0,0,0.5)]" style="left:160px">${d.effect}</td>
            ${lvCells}</tr>`;
    }).join('');
};

window.setupTableHighlighting = () => {
    const table = document.querySelector('#tab-eff table');
    const tbody = document.getElementById('eff-table-body');
    if (!table || !tbody) return;

    tbody.addEventListener('mouseover', (e) => {
        const cell = e.target.closest('td.val-cell'); if (!cell) return;
        const row = cell.parentElement; const colIdx = cell.cellIndex;
        tbody.querySelectorAll('tr').forEach(tr => tr.classList.remove('row-highlight'));
        table.querySelectorAll('.col-highlight, .val-focus').forEach(el => el.classList.remove('col-highlight', 'val-focus'));
        row.classList.add('row-highlight');
        table.querySelectorAll('tr').forEach(tr => { if(tr.cells[colIdx]) tr.cells[colIdx].classList.add('col-highlight'); });
        cell.classList.add('val-focus');
    });

    tbody.addEventListener('mouseout', () => {
        tbody.querySelectorAll('tr').forEach(tr => tr.classList.remove('row-highlight'));
        table.querySelectorAll('.col-highlight, .val-focus').forEach(el => el.classList.remove('col-highlight', 'val-focus'));
    });
};

/**
 * DATABASE ソート実行関数
 */
window.handleSort = (key) => {
    // 1. ソート状態の更新
    if (!window.currentSort) {
        window.currentSort = { key: "grade", asc: false };
    }

    if (window.currentSort.key === key) {
        // 同じキーなら昇順/降順を反転
        window.currentSort.asc = !window.currentSort.asc;
    } else {
        // 新しいキーならそのキーで降順（または昇順）に設定
        window.currentSort.key = key;
        window.currentSort.asc = (key === 'name'); // 名前は昇順、それ以外は重い順（降順）
    }

    // 2. 現在の検索窓の値を保持して再描画
    const searchInput = document.getElementById('db-search');
    const term = searchInput ? searchInput.value : "";
    window.renderDatabaseTable(term);
};