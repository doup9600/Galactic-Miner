// ======================
// Game State & Variables
// ======================

let currentOre = "rock"; // Current active ore type
let ores = {
    rock: 0,
    verdanite: 0,
    ferrustone: 0,
    stormcrystal: 0,
    sulcarite: 0,
    cryonox: 0,
    noxium: 0
};

let totalMined = 0;
let totalClicks = 0;
let ops = 0; // Ore per second

// Planets data
const planets = {
    "zephyros-9": { unlocked: true, ore: "rock" },
    "earth": { unlocked: false, ore: "verdanite", cost: 1000, costType: "rock" },
    "mars": { unlocked: false, ore: "ferrustone", cost: 5000, costType: "rock" },
    "jupiter": { unlocked: false, ore: "stormcrystal", cost: 25000, costType: "rock" },
    "venus": { unlocked: false, ore: "sulcarite", cost: 100000, costType: "rock" },
    "uranus": { unlocked: false, ore: "cryonox", cost: 500000, costType: "rock" },
    "pluto": { unlocked: false, ore: "noxium", cost: 2000000, costType: "rock" }
};

// Upgrades data
const upgrades = {
    // Basic upgrades (available from start)
    "hand_pick": {
        name: "Hand Pick",
        description: "Mine 2x faster manually",
        owned: 0,
        max: 5,
        cost: 50,
        costType: "rock",
        effect: () => { manualMiningPower = 2 * (1 + upgrades.hand_pick.owned); },
        unlocked: true
    },
    "wooden_crate": {
        name: "Wooden Crate",
        description: "Store 10% more ore",
        owned: 0,
        max: 3,
        cost: 100,
        costType: "rock",
        effect: () => { storageMultiplier = 1 + (0.1 * upgrades.wooden_crate.owned); },
        unlocked: true
    },
    
    // Earth unlocks
    "iron_pick": {
        name: "Iron Pickaxe",
        description: "Mine 5x faster manually (Requires Earth)",
        owned: 0,
        max: 3,
        cost: 500,
        costType: "verdanite",
        effect: () => { manualMiningPower = 5 * (1 + upgrades.iron_pick.owned); },
        unlocked: false
    },
    
    // Mars unlocks
    "auto_drill": {
        name: "Auto Drill",
        description: "Automatically mine 1 Rock/sec (Requires Mars)",
        owned: 0,
        max: 1,
        cost: 2000,
        costType: "ferrustone",
        effect: () => { autoMiners.rock = 1 * (1 + upgrades.auto_drill.owned); },
        unlocked: false
    },
    
    // ... (Additional upgrades up to 20)
};

// Mining variables
let manualMiningPower = 1;
let storageMultiplier = 1;
let autoMiners = {
    rock: 0,
    verdanite: 0,
    ferrustone: 0,
    stormcrystal: 0,
    sulcarite: 0,
    cryonox: 0,
    noxium: 0
};

// ======================
// DOM Elements
// ======================

// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Mining
const mineBtn = document.getElementById('mine-btn');
const currentOreDisplay = document.getElementById('current-ore');

// Stats
const totalMinedDisplay = document.getElementById('total-mined');
const opsDisplay = document.getElementById('ops');
const totalClicksDisplay = document.getElementById('total-clicks');
const planetsUnlockedDisplay = document.getElementById('planets-unlocked');
const upgradesOwnedDisplay = document.getElementById('upgrades-owned');

// ======================
// Game Initialization
// ======================

function init() {
    loadGame();
    setupEventListeners();
    updateAllDisplays();
    startGameLoop();
    
    // Initialize upgrades
    applyAllUpgradeEffects();
}

// ======================
// Core Game Functions
// ======================

function mine() {
    ores[currentOre] += manualMiningPower;
    totalMined += manualMiningPower;
    totalClicks++;
    updateAllDisplays();
    saveGame();
    
    // Button animation
    mineBtn.style.transform = 'scale(0.95)';
    setTimeout(() => mineBtn.style.transform = 'scale(1)', 100);
}

function unlockPlanet(planetId) {
    const planet = planets[planetId];
    if (!planet.unlocked && ores[planet.costType] >= planet.cost) {
        ores[planet.costType] -= planet.cost;
        planet.unlocked = true;
        
        // Unlock new ore
        ores[planet.ore] = 0;
        
        // Unlock associated upgrades
        unlockPlanetUpgrades(planetId);
        
        updateAllDisplays();
        saveGame();
    }
}

function unlockPlanetUpgrades(planetId) {
    // Earth unlocks iron pick
    if (planetId === "earth") {
        upgrades.iron_pick.unlocked = true;
    }
    // Mars unlocks auto drill
    else if (planetId === "mars") {
        upgrades.auto_drill.unlocked = true;
    }
    // ... other planet upgrade unlocks
}

function buyUpgrade(upgradeId) {
    const upgrade = upgrades[upgradeId];
    if (upgrade.owned < upgrade.max && ores[upgrade.costType] >= upgrade.cost) {
        ores[upgrade.costType] -= upgrade.cost;
        upgrade.owned++;
        upgrade.cost = Math.floor(upgrade.cost * 1.5); // Increase cost
        
        // Apply upgrade effect
        upgrade.effect();
        
        updateAllDisplays();
        saveGame();
    }
}

function calculateOPS() {
    let total = 0;
    
    // Add auto-miners
    for (const oreType in autoMiners) {
        total += autoMiners[oreType];
    }
    
    ops = total;
    return total;
}

// ======================
// Display Functions
// ======================

function updateAllDisplays() {
    updateOreDisplay();
    updateUpgradesDisplay();
    updatePlanetsDisplay();
    updateStatsDisplay();
}

function updateOreDisplay() {
    // Current ore
    const oreNames = {
        rock: "🪨 Rock",
        verdanite: "🌿 Verdanite",
        ferrustone: "🪨 Ferrustone",
        stormcrystal: "⚡ Stormcrystal",
        sulcarite: "🔥 Sulcarite",
        cryonox: "❄️ Cryonox",
        noxium: "☢️ Noxium"
    };
    
    currentOreDisplay.innerHTML = `${Math.floor(ores[currentOre])} ${oreNames[currentOre]}`;
    
    // Ore list
    document.querySelectorAll('.ore').forEach(oreElement => {
        const oreId = oreElement.id;
        if (ores[oreId] !== undefined) {
            if (oreElement.classList.contains('locked') && planets[getPlanetByOre(oreId)].unlocked) {
                oreElement.classList.remove('locked');
            }
            
            if (!oreElement.classList.contains('locked')) {
                oreElement.querySelector('.amount').textContent = Math.floor(ores[oreId]);
            }
        }
    });
}

function updateUpgradesDisplay() {
    const availableUpgradesContainer = document.getElementById('available-upgrades');
    const lockedUpgradesContainer = document.getElementById('locked-upgrades');
    
    availableUpgradesContainer.innerHTML = '';
    lockedUpgradesContainer.innerHTML = '';
    
    let ownedUpgrades = 0;
    
    for (const [id, upgrade] of Object.entries(upgrades)) {
        ownedUpgrades += upgrade.owned;
        
        const upgradeElement = document.createElement('div');
        upgradeElement.className = 'upgrade';
        upgradeElement.innerHTML = `
            <p><strong>${upgrade.name}</strong> (${upgrade.owned}/${upgrade.max})</p>
            <p>${upgrade.description}</p>
            <p>Cost: ${upgrade.cost} ${upgrade.costType}</p>
            <button class="buy-btn" data-upgrade="${id}">Buy</button>
        `;
        
        if (upgrade.unlocked) {
            availableUpgradesContainer.appendChild(upgradeElement);
        } else {
            upgradeElement.classList.add('locked');
            lockedUpgradesContainer.appendChild(upgradeElement);
        }
    }
    
    upgradesOwnedDisplay.textContent = ownedUpgrades;
}

function updatePlanetsDisplay() {
    let unlockedCount = 0;
    
    document.querySelectorAll('.planet').forEach(planetElement => {
        const planetId = planetElement.id;
        const planet = planets[planetId];
        
        if (planet.unlocked) {
            unlockedCount++;
            planetElement.classList.remove('locked');
            
            // Remove unlock button if exists
            const unlockBtn = planetElement.querySelector('.unlock-btn');
            if (unlockBtn) unlockBtn.remove();
        } else {
            // Update unlock button state
            const unlockBtn = planetElement.querySelector('.unlock-btn');
            if (unlockBtn) {
                unlockBtn.disabled = ores[planet.costType] < planet.cost;
            }
        }
    });
    
    planetsUnlockedDisplay.textContent = unlockedCount;
}

function updateStatsDisplay() {
    totalMinedDisplay.textContent = Math.floor(totalMined);
    opsDisplay.textContent = calculateOPS();
    totalClicksDisplay.textContent = totalClicks;
}

// ======================
// Utility Functions
// ======================

function getPlanetByOre(oreType) {
    for (const [planetId, planet] of Object.entries(planets)) {
        if (planet.ore === oreType) return planetId;
    }
    return null;
}

// ======================
// Game Loop & Save/Load
// ======================

function startGameLoop() {
    setInterval(() => {
        // Auto-mining
        for (const oreType in autoMiners) {
            if (autoMiners[oreType] > 0) {
                const amount = autoMiners[oreType] / 10; // Smooth updates
                ores[oreType] += amount;
                totalMined += amount;
            }
        }
        
        updateAllDisplays();
    }, 100);
    
    // Autosave every 30 seconds
    setInterval(saveGame, 30000);
}

function saveGame() {
    const gameState = {
        ores,
        totalMined,
        totalClicks,
        currentOre,
        planets,
        upgrades,
        autoMiners,
        manualMiningPower,
        storageMultiplier
    };
    
    localStorage.setItem('galacticMinerSave', JSON.stringify(gameState));
}

function loadGame() {
    const savedGame = localStorage.getItem('galacticMinerSave');
    if (savedGame) {
        const gameState = JSON.parse(savedGame);
        
        // Load basic stats
        ores = gameState.ores || ores;
        totalMined = gameState.totalMined || 0;
        totalClicks = gameState.totalClicks || 0;
        currentOre = gameState.currentOre || "rock";
        
        // Load planets
        for (const planetId in planets) {
            if (gameState.planets && gameState.planets[planetId]) {
                planets[planetId].unlocked = gameState.planets[planetId].unlocked;
            }
        }
        
        // Load upgrades
        for (const upgradeId in upgrades) {
            if (gameState.upgrades && gameState.upgrades[upgradeId]) {
                upgrades[upgradeId].owned = gameState.upgrades[upgradeId].owned;
                upgrades[upgradeId].cost = gameState.upgrades[upgradeId].cost;
                upgrades[upgradeId].unlocked = gameState.upgrades[upgradeId].unlocked;
            }
        }
        
        // Load auto-miners
        autoMiners = gameState.autoMiners || autoMiners;
        
        // Apply upgrades
        applyAllUpgradeEffects();
    }
}

function applyAllUpgradeEffects() {
    for (const upgrade of Object.values(upgrades)) {
        if (upgrade.owned > 0) {
            upgrade.effect();
        }
    }
}

// ======================
// Event Listeners
// ======================

function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Mining button
    mineBtn.addEventListener('click', mine);
    
    // Planet unlocking
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('unlock-btn')) {
            const planetId = e.target.closest('.planet').id;
            unlockPlanet(planetId);
        }
    });
    
    // Upgrade purchasing
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('buy-btn')) {
            const upgradeId = e.target.getAttribute('data-upgrade');
            if (upgradeId) buyUpgrade(upgradeId);
        }
    });
    
    // Ore switching (if you want clicking an ore to make it active)
    document.addEventListener('click', (e) => {
        if (e.target.closest('.ore') && !e.target.closest('.ore').classList.contains('locked')) {
            const oreId = e.target.closest('.ore').id;
            currentOre = oreId;
            updateOreDisplay();
            saveGame();
        }
    });
}

// Start the game
init();
