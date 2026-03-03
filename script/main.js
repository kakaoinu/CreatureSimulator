/**
 * Main App Controller (v18.6 - Fixed Modal Bridge & Protected Tabs)
 */
window.onload = loadData;

const getGradeClass = (grade) => `grade-${(grade || 'n').toLowerCase()}`;
const getBgGradeClass = (grade) => `bg-grade-${(grade || 'n').toLowerCase()}`;

// タブ切り替え（DATABASE/EFFECTSは絶対に変更しない）
window.switchTab = (target) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${target}`).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-btn-${target}`).classList.add('active');
    
    if (target === 'db') window.renderDatabaseTable();
    if (target === 'eff') {
        window.renderEffectsTable();
        window.setupTableHighlighting();
    }
};

window.initApp = () => {
    const container = document.getElementById("slots-container");
    if (!container) return;

    if (typeof selections === 'undefined' || !selections) {
        window.selections = [
            { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } },
            { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } },
            { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } },
            { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } }
        ];
    }
    
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; width: 100%; gap: 32px; align-items: flex-start; padding-right: 400px;">
            ${[0, 1, 2, 3].map(i => `
                <div id="slot-ui-${i}" style="width: fit-content; min-width: 440px;" class="rounded-2xl border-2 border-[#8a6e54] bg-[#1a120c] p-8 shadow-[0_40px_80px_rgba(0,0,0,1)] border-t-[#b38b6d]">
                    <div id="slot-content-${i}" style="display: flex; flex-direction: row; align-items: stretch; gap: 64px;"></div>
                </div>
            `).join('')}
        </div>
        
        <div id="summary-container" style="position: fixed; top: 160px; right: 40px; width: 340px; z-index: 1000;" class="rounded-2xl border-2 border-yellow-600 bg-[#1a120c] shadow-[0_50px_150px_rgba(0,0,0,1)] border-t-yellow-400">
            <div id="summary-header" style="cursor: move; padding: 16px 20px; background: rgba(0,0,0,0.5); border-bottom: 2px solid rgba(255,215,0,0.2);" class="rounded-t-2xl flex justify-between items-center">
                <span class="text-[11px] font-black text-yellow-400 tracking-[0.3em] uppercase drop-shadow-[0_0_12px_rgba(255,215,0,0.6)]">✦ Passive Summary</span>
                <div class="flex gap-1.5">
                    <div class="w-2.5 h-2.5 rounded-full bg-red-700 shadow-[0_0_8px_rgba(255,0,0,1)]"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-yellow-600 shadow-[0_0_8px_rgba(255,215,0,1)]"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-cyan-600 shadow-[0_0_8px_rgba(0,255,255,1)]"></div>
                </div>
            </div>
            <div id="summary-area" style="padding: 24px; max-height: 70vh; overflow-y: auto;" class="custom-scroll"></div>
        </div>
    `;

    for (let i = 0; i < 4; i++) window.renderSlot(i);
    
    window.autoLoad(); 
    window.initDraggable();
};

// ドラッグ範囲の制限ロジック
window.initDraggable = () => {
    const el = document.getElementById("summary-container");
    const header = document.getElementById("summary-header");
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    header.onmousedown = (e) => {
        e.preventDefault();
        pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
        document.onmousemove = (e) => {
            e.preventDefault();
            pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
            pos3 = e.clientX; pos4 = e.clientY;

            let newTop = el.offsetTop - pos2;
            let newLeft = el.offsetLeft - pos1;

            // 境界制限
            const maxTop = window.innerHeight - el.offsetHeight;
            const maxLeft = window.innerWidth - el.offsetWidth;
            newTop = Math.max(0, Math.min(newTop, maxTop));
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));

            el.style.top = newTop + "px";
            el.style.left = newLeft + "px";
            el.style.right = "auto";
        };
    };
};

window.renderSlot = (idx) => {
    const ui = document.getElementById(`slot-content-${idx}`); if (!ui) return;
    const sel = selections[idx];
    const isMain = (idx === 0);
    const placeholderImg = isMain ? 'creature_main.png' : 'creature_sub.png';

    const infoHTML = `
        <div style="flex: 0 0 320px; display: flex; flex-direction: column; justify-content: space-between;" class="h-full">
            <div class="flex flex-col gap-4">
                <div class="flex justify-between items-center">
                    <div class="bg-black/70 px-3 py-1.5 rounded border border-[#8a6e54] shadow-inner">
                        <span class="text-[10px] font-black tracking-widest ${isMain ? 'text-red-400' : 'text-amber-200/60'} drop-shadow-sm">${isMain ? '✦ MAIN SLOT' : '✦ SUB SLOT ' + idx}</span>
                    </div>
                    <span class="text-[10px] font-black px-2.5 py-1 rounded border-2 shadow-lg ${getBgGradeClass(sel.grade)} ${sel.grade === 'LR' ? 'text-black' : 'text-white'}" style="border-color: rgba(255,255,255,0.2);">${sel.grade || '--'}</span>
                </div>
                <div class="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-[#8a6e54] shadow-inner">
                    <div class="relative flex-shrink-0">
                        <div class="relative w-20 h-20 bg-[#05040a] rounded-lg border-2 border-amber-900 flex items-center justify-center overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                            <img src="icon/${placeholderImg}" class="absolute inset-0 w-full h-full object-cover opacity-50 z-0">
                            ${sel.name ? `<img src="icon/${creatureData.find(x=>x.name===sel.name).image}" class="relative z-10 w-full h-full object-contain p-1 drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)]">` : ''}
                        </div>
                        <div class="absolute -top-3 -left-3 bg-gradient-to-br from-yellow-400 to-yellow-700 text-[11px] text-black px-2.5 py-1 font-black z-20 rounded-full shadow-[0_0_15px_rgba(255,215,0,0.6)] border border-white/20 leading-none">+${sel.trans}</div>
                    </div>
                    <div class="flex-grow space-y-2.5 overflow-hidden">
                        <select class="w-full bg-[#05040a] border border-[#8a6e54] p-1.5 rounded-md font-bold text-[11px] outline-none shadow-inner focus:border-yellow-400 ${getGradeClass(sel.grade)}" onchange="handleCreatureSelect(${idx}, this.value)">
                            <option value="" class="text-amber-400">-- 召喚 --</option>
                            ${[...creatureData].reverse().map(x => `<option value="${x.name}" ${sel.name === x.name ? 'selected' : ''} class="bg-[#1a120c] ${getGradeClass(x.grade)}">${x.name}</option>`).join('')}
                        </select>
                        <div class="flex items-center justify-between bg-black/60 px-3 py-1.5 rounded-md border border-[#8a6e54]/40">
                            <span class="text-[14px] font-black text-amber-100 uppercase tracking-tighter">超越</span>
                            <input type="number" class="w-12 bg-transparent text-yellow-400 font-black text-center outline-none rs-font-lcd text-2xl drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" value="${sel.trans}" min="0" max="5" onchange="handleTransChange(${idx}, this.value)">
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    ui.innerHTML = `${infoHTML}<div style="display: flex; flex-direction: row; flex-wrap: nowrap; gap: 20px; align-items: flex-start; padding-top: 8px;" class="h-full">${window.renderPassiveRowsHTML(idx)}</div>`;
    window.calculateAll();
};

window.renderPassiveRowsHTML = (idx) => {
    const sel = selections[idx]; if (!sel.name) return '<div class="text-amber-200/20 italic text-[11px] py-14 pl-8">召喚待機中</div>';
    let html = "";
    if (idx === 0 && sel.mainP) html += window.renderPassivePanel(idx, "MAIN", sel.mainP, sel.awakeLvs["MAIN"], true);
    sel.subs.forEach((p, sIdx) => { html += window.renderPassivePanel(idx, "SUB" + (sIdx + 1), p, sel.awakeLvs["SUB" + (sIdx + 1)], false); });
    return html;
};

window.handleCreatureSelect = (idx, name) => {
    const c = creatureData.find(x => x.name === name);
    if (c) {
        selections[idx] = {...selections[idx], name: c.name, grade: c.grade, mainP: (idx === 0 ? c.main || "" : ""), subs: [c.subs[0] || "", c.subs[1] || "", c.subs[2] || ""]};
        const sel = selections[idx];
        if (idx === 0 && sel.mainP) sel.awakeLvs["MAIN"] = window.getMaxAwake(sel.mainP, sel.grade, true);
        sel.subs.forEach((p, sIdx) => { sel.awakeLvs["SUB"+(sIdx+1)] = p ? window.getMaxAwake(p, sel.grade, false) : 0; });
    } else { selections[idx].name = ""; }
    window.renderSlot(idx); window.autoSave();
};
window.handleTransChange = (idx, val) => { selections[idx].trans = parseInt(val) || 0; window.renderSlot(idx); window.autoSave(); };
window.handleSubSelect = (idx, sIdx, pName) => { 
    const label = "SUB" + (sIdx + 1);
    selections[idx].subs[sIdx] = pName; 
    selections[idx].awakeLvs[label] = pName ? window.getMaxAwake(pName, selections[idx].grade, false) : 0; 
    window.renderSlot(idx); window.autoSave();
};
window.handleAwakeChange = (idx, label, val) => { selections[idx].awakeLvs[label] = parseInt(val) || 0; window.calculateAll(); window.autoSave(); };

window.calculateAll = () => {
    const totals = {};
    selections.forEach((sel, idx) => {
        if (!sel.name) return;
        const processRow = (pName, label, isMainPassive) => {
            if (!pName) return;
            const res = window.calcRowWithAwake(pName, sel.grade, sel.trans, isMainPassive, sel.awakeLvs[label]);
            const b = document.getElementById(`v-${idx}-${label}-b`); 
            const t = document.getElementById(`v-${idx}-${label}-t`);
            const tot = document.getElementById(`v-${idx}-${label}-tot`); 
            const awkInput = document.getElementById(`v-${idx}-${label}-a`);
            if (b) b.innerText = res.base; if (t) t.innerText = res.trans; if (tot) tot.innerText = res.total;
            if (awkInput) {
                const max = window.getMaxAwake(pName, sel.grade, isMainPassive);
                awkInput.max = max; if (parseInt(awkInput.value) > max) { awkInput.value = max; sel.awakeLvs[label] = max; }
            }
            if (!(idx === 0 && label.includes("SUB") && pName === sel.mainP)) { totals[pName] = (totals[pName] || 0) + res.total; }
        };
        processRow(sel.mainP, "MAIN", true);
        sel.subs.forEach((p, sIdx) => processRow(p, "SUB" + (sIdx + 1), false));
    });
    window.renderSummary(totals);
};