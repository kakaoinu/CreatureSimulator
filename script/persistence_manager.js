/**
 * Persistence Manager (v4.0 - Duplicate Check & Robust Save)
 */
const STORAGE_KEY_AUTO = "rs_creature_sim_auto";
const STORAGE_KEY_LIST = "rs_creature_sim_library";

window.openSaveModal = () => {
    const modal = document.getElementById('save-modal');
    if (modal) { modal.classList.remove('hidden'); window.renderSaveList(); }
};

window.closeSaveModal = () => {
    const modal = document.getElementById('save-modal');
    if (modal) modal.classList.add('hidden');
};

window.handleNewSave = () => {
    const input = document.getElementById('new-save-name');
    if (!input || !window.selections) return;
    
    const name = input.value.trim();
    if (!name) {
        alert("名前を入力してください");
        return;
    }

    let library = {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY_LIST);
        library = (raw && raw !== "undefined") ? JSON.parse(raw) : {};
    } catch (e) { library = {}; }

    // 【新規】同名チェックロジック
    if (library[name]) {
        if (!confirm(`「${name}」は既に存在します。上書きしますか？`)) {
            return;
        }
    }
    
    library[name] = JSON.parse(JSON.stringify(window.selections));
    localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(library));
    
    input.value = '';
    window.renderSaveList();
    console.log("Success: Build saved -> " + name);
};

window.autoSave = () => {
    if (window.selections) {
        localStorage.setItem(STORAGE_KEY_AUTO, JSON.stringify(window.selections));
    }
};

window.autoLoad = () => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTO);
    if (!saved || saved === "undefined" || saved === "null") return;
    try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed)) {
            parsed.forEach((item, i) => { if (window.selections[i]) window.selections[i] = item; });
            for (let i = 0; i < 4; i++) window.renderSlot(i);
        }
    } catch (e) { localStorage.removeItem(STORAGE_KEY_AUTO); }
};

window.loadFromLibrary = (title) => {
    const library = JSON.parse(localStorage.getItem(STORAGE_KEY_LIST) || "{}");
    if (!library[title]) return;
    library[title].forEach((item, i) => { if (window.selections[i]) window.selections[i] = item; });
    for (let i = 0; i < 4; i++) window.renderSlot(i);
    window.autoSave();
    window.closeSaveModal();
};

window.deleteSave = (title) => {
    if (!confirm(`「${title}」を削除しますか？`)) return;
    const library = JSON.parse(localStorage.getItem(STORAGE_KEY_LIST) || "{}");
    delete library[title];
    localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(library));
    window.renderSaveList();
};

window.clearCache = () => {
    if (confirm("全データを消去してリセットしますか？")) { localStorage.clear(); location.reload(); }
};

window.renderSaveList = () => {
    const listEl = document.getElementById('save-list');
    if (!listEl) return;
    const library = JSON.parse(localStorage.getItem(STORAGE_KEY_LIST) || "{}");
    const titles = Object.keys(library);
    if (titles.length === 0) {
        listEl.innerHTML = '<p class="text-amber-100/20 text-[10px] italic text-center py-4">保存データなし</p>';
        return;
    }
    listEl.innerHTML = titles.map(title => `
        <div class="flex items-center justify-between bg-black/40 p-2 rounded border border-[#8a6e54]/20 group hover:border-emerald-500/50 mb-2">
            <span class="text-xs font-bold text-yellow-100/80 group-hover:text-emerald-400 truncate pr-2">${title}</span>
            <div class="flex gap-1">
                <button onclick="window.loadFromLibrary('${title}')" class="text-[9px] font-black bg-emerald-900/40 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500 hover:text-white">LOAD</button>
                <button onclick="window.deleteSave('${title}')" class="text-[9px] font-black bg-red-900/40 text-red-400 px-2 py-1 rounded hover:bg-red-600 hover:text-white">DEL</button>
            </div>
        </div>
    `).join('');
};

window.allClear = () => {
    if (!confirm("現在の選択内容をすべてクリアしますか？\n（保存済みのライブラリは削除されません）")) return;

    // 初期データ構造で上書き
    window.selections = [
        { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } },
        { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } },
        { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } },
        { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } }
    ];

    // 全スロットのUIを更新
    for (let i = 0; i < 4; i++) {
        window.renderSlot(i);
    }
    
    // オートセーブに反映
    if (window.autoSave) window.autoSave();
    
    // サマリを即時更新するために計算を実行
    if (window.calculateAll) window.calculateAll();

    console.log("%c Slots Cleared ", "color: #60a5fa; font-weight: bold; border: 1px solid #60a5fa;");
};