// Game state
let cosmicOre = 0;
let totalMined = 0;
let totalClicks = 0;
let ops = 0; // Ore per second

// Upgrades
const upgrades = {
    drone: {
        owned: 0,
        cost: 25,
        value: 1
    },
    harvester: {
        owned: 0,
        cost: 100,
        value: 5
    },
    freighter: {
        owned: 0,
        cost: 500,
        value: 20
    }
};

// Planets
const planets = {
    earth: { unlocked: true, incomeMultiplier: 1 },
    mars: { unlocked: false, cost: 1000, incomeMultiplier: 2 },
    jupiter: { unlocked: false, cost: 5000, incomeMultiplier: 5 }
};

// DOM elements
const resourcesDisplay = document.getElementById('resources');
const mineBtn = document.getElementById('mine-btn');
const opsDisplay = document.getElementById('ops');
const totalMinedDisplay = document.getElementById('total-mined');
const totalClicksDisplay = document.getElementById('total-clicks');
const upgradeElements = document.querySelectorAll('.upgrade');
const planetElements = document.querySelectorAll('.planet');

// Initialize the game
function init() {
    loadGame();
    updateDisplay();
    setupEventListeners();
    startGameLoop();
}

// Load saved game
function loadGame() {
    const savedGame = localStorage.getItem('galacticMinerSave');
    if (savedGame) {
        const gameState = JSON.parse(savedGame);
        cosmicOre = gameState.cosmicOre || 0;
        totalMined = gameState.totalMined || 0;
        totalClicks = gameState.totalClicks || 0;
        
        for (const key in upgrades) {
            if (gameState.upgrades && gameState.upgrades[key]) {
                upgrades[key].owned = gameState.upgrades[key].owned || 0;
                upgrades[key].cost = gameState.upgrades[key].cost || upgrades[key].cost;
            }
        }
        
        for (const key in planets) {
            if (gameState.planets && gameState.planets[key]) {
                planets[key].unlocked = gameState.planets[key].unlocked || false;
            }
        }
    }
}

// Save game
function saveGame() {
    const gameState = {
        cosmicOre,
        totalMined,
        totalClicks,
        upgrades: {},
        planets: {}
    };
    
    for (const key in upgrades) {
        gameState.upgrades[key] = {
            owned: upgrades[key].owned,
            cost: upgrades[key].cost
        };
    }
    
    for (const key in planets) {
        gameState.planets[key] = {
            unlocked: planets[key].unlocked
        };
    }
    
    localStorage.setItem('galacticMinerSave', JSON.stringify(gameState));
}

// Update all displays
function updateDisplay() {
    resourcesDisplay.innerHTML = `${Math.floor(cosmicOre)} <span class="resource-icon">⛏️</span> Cosmic Ore`;
    opsDisplay.textContent = ops;
    totalMinedDisplay.textContent = Math.floor(totalMined);
    totalClicksDisplay.textContent = totalClicks;
    
    // Update upgrade displays
    upgradeElements.forEach(element => {
        const upgradeId = element.id;
        const upgrade = upgrades[upgradeId];
        
        if (upgrade) {
            element.querySelector('p').innerHTML = 
                `${element.id.charAt(0).toUpperCase() + element.id.slice(1).replace(/([A-Z])/g, ' $1')}s (${upgrade.owned}) - ${upgrade.value} ore every 1 second`;
            element.querySelector('.cost').textContent = Math.floor(upgrade.cost);
            element.querySelector('.buy-btn').disabled = cosmicOre < upgrade.cost;
        }
    });
    
    // Update planet displays
    planetElements.forEach(element => {
        const planetId = element.id;
        const planet = planets[planetId];
        
        if (planet) {
            if (planet.unlocked) {
                element.classList.remove('locked');
                element.querySelector('p').innerHTML = `🌍 ${planetId.charAt(0).toUpperCase() + planetId.slice(1)} (Income: ${planet.incomeMultiplier}x)`;
                if (element.querySelector('.unlock-btn')) {
                    element.querySelector('.unlock-btn').remove();
                }
            } else {
                element.classList.add('locked');
                element.querySelector('p').innerHTML = `🔒 ${planetId.charAt(0).toUpperCase() + planetId.slice(1)} (Requires ${planet.cost} Ore)`;
                element.querySelector('.unlock-btn').disabled = cosmicOre < planet.cost;
            }
        }
    });
}

// Calculate OPS (Ore Per Second)
function calculateOPS() {
    let newOps = 0;
    for (const key in upgrades) {
        newOps += upgrades[key].owned * upgrades[key].value;
    }
    
    // Apply planet multipliers
    for (const key in planets) {
        if (planets[key].unlocked) {
            newOps *= planets[key].incomeMultiplier;
        }
    }
    
    ops = newOps;
    return newOps;
}

// Game loop
function startGameLoop() {
    setInterval(() => {
        const oreToAdd = calculateOPS() / 10; // Smooth updates
        if (oreToAdd > 0) {
            cosmicOre += oreToAdd;
            totalMined += oreToAdd;
            updateDisplay();
        }
    }, 100);
    
    setInterval(saveGame, 10000); // Autosave every 10 seconds
}

// Event listeners
function setupEventListeners() {
    // Mine button
    mineBtn.addEventListener('click', () => {
        cosmicOre += 1;
        totalMined += 1;
        totalClicks += 1;
        updateDisplay();
        
        // Animation
        mineBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            mineBtn.style.transform = 'scale(1)';
        }, 100);
    });
    
    // Upgrade buttons
    upgradeElements.forEach(element => {
        const upgradeId = element.id;
        const buyBtn = element.querySelector('.buy-btn');
        
        buyBtn.addEventListener('click', () => {
            const upgrade = upgrades[upgradeId];
            
            if (cosmicOre >= upgrade.cost) {
                cosmicOre -= upgrade.cost;
                upgrade.owned += 1;
                upgrade.cost = Math.floor(upgrade.cost * 1.2); // 20% cost increase
                calculateOPS();
                updateDisplay();
                saveGame();
                
                // Animation
                buyBtn.textContent = 'Purchased!';
                setTimeout(() => {
                    buyBtn.textContent = 'Buy';
                }, 500);
            }
        });
    });
    
    // Planet unlock buttons
    planetElements.forEach(element => {
        const unlockBtn = element.querySelector('.unlock-btn');
        if (unlockBtn) {
            unlockBtn.addEventListener('click', () => {
                const planetId = element.id;
                const planet = planets[planetId];
                
                if (cosmicOre >= planet.cost) {
                    cosmicOre -= planet.cost;
                    planet.unlocked = true;
                    calculateOPS();
                    updateDisplay();
                    saveGame();
                    
                    // Animation
                    unlockBtn.textContent = 'Unlocked!';
                    setTimeout(() => {
                        unlockBtn.remove();
                    }, 1000);
                }
            });
        }
    });
}

// Start the game
init();
