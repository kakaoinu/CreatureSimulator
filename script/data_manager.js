/**
 * Data Manager & Logic (v17.5 - Final Corrected Base Levels)
 */
let creatureData = [], passiveMaster = [], passiveDetails = [];

window.selections = [
    { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } },
    { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } },
    { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } },
    { name: "", grade: "", trans: 0, mainP: "", subs: ["", "", ""], awakeLvs: { MAIN: 0, SUB1: 0, SUB2: 0, SUB3: 0 } }
];

window.getMaxAwake = (pName, grade, isMain) => {
    const info = passiveMaster.find(m => m.name === pName);
    if (!info) return 0;
    // 覚醒レベル：LR/GRはメイン20/サブ10、それ以下はメイン10/サブ5
    if (isMain) return (grade === "LR" || grade === "GR") ? 20 : 10;
    return (grade === "LR" || grade === "GR") ? 10 : 5;
};

window.calcRowWithAwake = (pName, grade, trans, isMainPassive, awakeVal) => {
    const info = passiveMaster.find(m => m.name === pName);
    if (!info) return { base: 0, awake: 0, trans: 0, total: 0 };
    
    // 不適合グレードの除外
    if ((info.type === "上級" && ["N", "R"].includes(grade)) ||
        (info.type === "一般" && ["LR", "GR"].includes(grade))) {
        return { base: 0, awake: 0, trans: 0, total: 0 };
    }

    // --- 基本レベルの算出 ---
    let base = 0;
    if (info.type === "上級") {
        if (isMainPassive) {
            const advMainMap = { "HR": 5, "SR": 10, "LR": 20, "GR": 30 };
            base = advMainMap[grade] || 0;
        } else {
            base = (grade === "GR") ? 15 : 10;
        }
    } else {
        if (isMainPassive) {
            const genMainMap = { "N": 8, "R": 16, "HR": 24, "SR": 32 };
            base = genMainMap[grade] || 0;
        } else {
            base = 20;
        }
    }

    // --- 超越ボーナスの算出 (修正箇所) ---
    let transVal = 0;
    const tLv = parseInt(trans) || 0;

    if (grade === "SR") {
        // SR専用ロジック
        if (isMainPassive) {
            if (tLv === 4) transVal = 5;
            else if (tLv === 5) transVal = 6;
            else transVal = 0; // 0~3は0
        } else {
            if (tLv === 4 || tLv === 5) transVal = 4;
            else transVal = 0; // 0~3は0
        }
    } else if (grade === "LR" || grade === "GR") {
        // LR/GRロジック (従来通り)
        const tBonus = isMainPassive ? 10 : 5;
        transVal = tLv * tBonus;
    } else {
        // N, R, HR は超越なし
        transVal = 0;
    }

    const awake = parseInt(awakeVal) || 0;
    
    return { 
        base, 
        awake, 
        trans: transVal, 
        total: base + transVal + awake 
    };
};

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
    } catch (e) {
        console.error("Data Load Error", e);
    }
}