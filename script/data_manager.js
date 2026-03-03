/**
 * Data Manager & Logic (v16.1 - Base Level & Grade Restriction Fix)
 */
let creatureData = [], passiveMaster = [], passiveDetails = [];
window.selections = [
    { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } },
    { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } },
    { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } },
    { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } }
];

async function loadData() {
    try {
        const [resC, resP, resD] = await Promise.all([
            fetch('json/CREATURE_DATABASE.json'),
            fetch('json/PASSIVE_EFFECTS.json'),
            fetch('json/PASSIVE_DETAILS.json')
        ]);
        creatureData = await resC.json();
        passiveMaster = await resP.json();
        passiveDetails = await resD.json();
        window.initApp(); 
        window.renderDatabaseTable(); 
        window.renderEffectsTable();
        window.setupTableHighlighting();
    } catch (e) { console.error("データ読み込み失敗:", e); }
}

window.getMaxAwake = (pName, grade, isMainPassive) => {
    const info = passiveMaster.find(m => m.name === pName);
    if (!info || !grade) return 0;
    
    // 不適合グレードでの覚醒を遮断
    if ((info.type === "上級" && ["N", "R"].includes(grade)) ||
        (info.type === "一般" && ["LR", "GR"].includes(grade))) {
        return 0;
    }

    if (isMainPassive) {
        if (grade === "N") return 4; if (grade === "R") return 8; if (grade === "HR") return 12;
        return (info.type === "上級") ? ({SR:16, LR:20, GR:20}[grade] || 0) : (grade === "SR" ? 16 : 0);
    } else {
        if (grade === "N") return 2; if (grade === "R") return 4; if (grade === "HR") return 6;
        return (info.type === "上級") ? ({SR:8, LR:10, GR:10}[grade] || 0) : (grade === "SR" ? 8 : 0);
    }
};

window.calcRowWithAwake = (pName, grade, trans, isMainPassive, awakeVal) => {
    const info = passiveMaster.find(m => m.name === pName);
    if (!info) return { base: 0, awake: 0, trans: 0, total: 0 };
    
    // 【修正】不適合グレード（R以下の上級 / LR以上の一般）は一切計上しない
    if ((info.type === "上級" && ["N", "R"].includes(grade)) ||
        (info.type === "一般" && ["LR", "GR"].includes(grade))) {
        return { base: 0, awake: 0, trans: 0, total: 0 };
    }

    // 【修正】基本レベルの算出ルール
    // N～LRメイン：20 / サブ：10
    // GRメイン：30 / サブ：15
    let base = 0;
    if (grade === "GR") {
        base = isMainPassive ? 30 : 15;
    } else {
        // N, R, HR, SR, LR
        base = isMainPassive ? 20 : 10;
    }

    // 超越ボーナスの算出
    let tBonus = 0;
    if (isMainPassive) {
        // メインスロットのメインパッシブ用超越ボーナス
        if (grade === "SR") {
            tBonus = (trans === 4) ? 5 : (trans === 5) ? 6 : 0;
        } else if (grade === "LR") {
            tBonus = [0, 5, 6, 7, 9, 10][trans] || 0;
        }
    } else {
        // サブパッシブ（全スロット共通）用超越ボーナス
        if (grade === "SR") {
            tBonus = (trans >= 4) ? 4 : 0;
        } else if (grade === "LR") {
            tBonus = [0, 4, 4, 5, 6, 8][trans] || 0;
        } else if (grade === "GR") {
            tBonus = [0, 5, 6, 7, 8, 10][trans] || 0;
        }
    }

    const aVal = parseInt(awakeVal) || 0;
    return { base, awake: aVal, trans: tBonus, total: base + aVal + tBonus };
};