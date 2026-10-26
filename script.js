// 1. Dati Mazzo Predefinito
let deckList = [
  {
    name: 'Froakie',
    count: 4,
    type: 'basic',
    isBasic: true,
    stage: 'Basic',
    category: 'Pokemon',
    setCode: 'OBF',
    cardNum: '56',
    checkPrizes: false,
    userOverridden: false,
  },
  {
    name: 'Frogadier',
    count: 4,
    type: 'brick',
    isBasic: false,
    stage: 'Stage1',
    category: 'Pokemon',
    setCode: 'TWM',
    cardNum: '57',
    checkPrizes: false,
    userOverridden: false,
  },
  {
    name: 'Greninja ex',
    count: 3,
    type: 'brick',
    isBasic: false,
    stage: 'Stage2',
    category: 'Pokemon',
    setCode: 'TWM',
    cardNum: '106',
    checkPrizes: true,
    userOverridden: false,
  },
  {
    name: 'Fezandipiti ex',
    count: 1,
    type: 'neutral',
    isBasic: true,
    stage: 'Basic',
    category: 'Pokemon',
    setCode: 'SFA',
    cardNum: '38',
    checkPrizes: true,
    userOverridden: true,
  },
  {
    name: 'Buddy-Buddy Poffin',
    count: 4,
    type: 'supporter',
    isBasic: false,
    stage: null,
    category: 'Trainer',
    setCode: 'TEF',
    cardNum: '144',
    checkPrizes: false,
    userOverridden: false,
  },
  {
    name: 'Ultra Ball',
    count: 4,
    type: 'supporter',
    isBasic: false,
    stage: null,
    category: 'Trainer',
    setCode: 'SVI',
    cardNum: '196',
    checkPrizes: false,
    userOverridden: false,
  },
  {
    name: 'Iono',
    count: 4,
    type: 'supporter',
    isBasic: false,
    stage: null,
    category: 'Trainer',
    setCode: 'PAL',
    cardNum: '185',
    checkPrizes: false,
    userOverridden: false,
  },
  {
    name: 'Rare Candy',
    count: 4,
    type: 'brick',
    isBasic: false,
    stage: null,
    category: 'Trainer',
    setCode: 'SVI',
    cardNum: '191',
    checkPrizes: false,
    userOverridden: false,
  },
  {
    name: 'Super Rod',
    count: 2,
    type: 'brick',
    isBasic: false,
    stage: null,
    category: 'Trainer',
    setCode: 'PAL',
    cardNum: '188',
    checkPrizes: true,
    userOverridden: false,
  },
  {
    name: 'Water Energy',
    count: 8,
    type: 'neutral',
    isBasic: false,
    stage: null,
    category: 'Energy',
    setCode: 'SVE',
    cardNum: '3',
    checkPrizes: false,
    userOverridden: false,
  },
  {
    name: 'Altre carte',
    count: 22,
    type: 'neutral',
    isBasic: false,
    stage: null,
    category: 'Other',
    setCode: null,
    cardNum: null,
    checkPrizes: false,
    userOverridden: false,
  },
];

const STORAGE_KEY = 'ptcg_deck_grid_v8';

const deckGrid = document.getElementById('deckGrid');
const cardCountEl = document.getElementById('cardCount');
const outputEl = document.getElementById('output');
const handContainer = document.getElementById('handContainer');
const prizesContainer = document.getElementById('prizesContainer');
const handStatusBadge = document.getElementById('handStatusBadge');
const apiStatusIndicator = document.getElementById('apiStatusIndicator');

const cardApiCache = new Map();
let currentDeckInstance = [];

// 2. Mappatura Set PTCGL -> TCGdex
const PTCGL_TO_TCGDEX_SET = {
  // Scarlet & Violet
  SVI: 'sv01',
  PAL: 'sv02',
  OBF: 'sv03',
  MEW: 'sv03.5',
  151: 'sv03.5',
  PAR: 'sv04',
  PAF: 'sv04.5',
  TEF: 'sv05',
  TWM: 'sv06',
  SFA: 'sv06.5',
  SCR: 'sv07',
  SSP: 'sv08',
  PRE: 'sv08.5',
  ASC: 'sv09', // Ascesa Eroica
  MEG: 'me01',
  POR: 'me02',
  MEE: 'sve',
  SVE: 'sve',
  // Sword & Shield
  SSH: 'swsh1',
  RCL: 'swsh2',
  DAA: 'swsh3',
  CPA: 'swsh3.5',
  VIV: 'swsh4',
  SHF: 'swsh4.5',
  BST: 'swsh5',
  CRE: 'swsh6',
  EVS: 'swsh7',
  FST: 'swsh8',
  BRS: 'swsh9',
  ASR: 'swsh10',
  PGO: 'pgo',
  LOR: 'swsh11',
  SIT: 'swsh12',
  CRZ: 'swsh12.5',
};

// 3. Asset Verificati e Fallback per le 8 Energie Base
// URL CDN stabili e universali per le 8 Energie Base (Artwork ufficiale Pokémon)
const BASE_ENERGY_FALLBACK = {
  'grass energy': 'https://images.pokemontcg.io/sve/1_hires.png',
  'fire energy': 'https://images.pokemontcg.io/sve/2_hires.png',
  'water energy': 'https://images.pokemontcg.io/sve/3_hires.png',
  'lightning energy': 'https://images.pokemontcg.io/sve/4_hires.png',
  'psychic energy': 'https://images.pokemontcg.io/sve/5_hires.png',
  'fighting energy': 'https://images.pokemontcg.io/sve/6_hires.png',
  'darkness energy': 'https://images.pokemontcg.io/sve/7_hires.png',
  'metal energy': 'https://images.pokemontcg.io/sve/8_hires.png',
};

function getEnergyFallback(name) {
  const clean = name.trim().toLowerCase();
  for (const [key, url] of Object.entries(BASE_ENERGY_FALLBACK)) {
    if (clean.includes(key.replace(' energy', ''))) {
      return url;
    }
  }
  return 'https://images.pokemontcg.io/sve/2_hires.png';
}

function isBasicEnergy(cardName) {
  const n = cardName.trim().toLowerCase();
  return Object.keys(BASE_ENERGY_FALLBACK).some(
    (k) => n.includes(k.replace(' energy', '')) && n.includes('energy'),
  );
}

function isBasicEnergy(cardName) {
  const n = cardName.trim().toLowerCase();
  return Object.keys(BASE_ENERGY_FALLBACK).some(
    (k) => n.includes(k.replace(' energy', '')) && n.includes('energy'),
  );
}

// 4. Persistenza Locale (LocalStorage)
function saveDeckToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deckList));
  } catch (err) {
    console.error('Errore salvataggio storage:', err);
  }
}

function loadDeckFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        deckList = parsed;
        return true;
      }
    }
  } catch (err) {
    console.error('Errore ripristino storage:', err);
  }
  return false;
}

// 5. Mapping Ruoli Iniziali
function mapApiToDefaultRole(category, stage, name) {
  const cat = (category || '').toLowerCase();
  const st = (stage || '').toLowerCase();
  const n = name.toLowerCase();

  if (cat === 'pokemon' || st) {
    if (st === 'basic') return 'basic';
    if (
      n.includes('drakloak') ||
      n.includes('bibarel') ||
      n.includes('kirlia') ||
      n.includes('dudunsparce')
    ) {
      return 'mid_engine';
    }
    return 'brick';
  }

  if (cat === 'trainer') {
    if (
      n.includes('research') ||
      n.includes('iono') ||
      n.includes('poffin') ||
      n.includes('ultra ball') ||
      n.includes('nest ball') ||
      n.includes('pad') ||
      n.includes('arven') ||
      n.includes('lillie') ||
      n.includes('crispin')
    ) {
      return 'supporter';
    }
    if (
      n.includes('rod') ||
      n.includes('stretcher') ||
      n.includes('boss') ||
      n.includes('candy')
    ) {
      return 'brick';
    }
  }

  return 'neutral';
}

// 6. Fetch dei Dati tramite TCGdex con fallback protetto per Energie Base
async function fetchCardData(cardName, setCode, cardNum) {
  if (cardName === 'Altre carte') {
    return null;
  }

  // Risoluzione rapida se è un'energia base con codici non standard (MEE, SVE)
  if (
    isBasicEnergy(cardName) &&
    (!setCode || setCode === 'MEE' || setCode === 'SVE')
  ) {
    const fallbackImg = getEnergyFallback(cardName);
    return {
      imgUrl: fallbackImg,
      category: 'Energy',
      stage: null,
      isBasic: false,
      inferredRole: 'neutral',
    };
  }

  const cacheKey = `${cardName}_${setCode || ''}_${cardNum || ''}`;
  if (cardApiCache.has(cacheKey)) {
    return cardApiCache.get(cacheKey);
  }

  try {
    const targetSetId = setCode
      ? PTCGL_TO_TCGDEX_SET[setCode.toUpperCase()]
      : null;
    let card = null;

    // 1. Chiamata diretta per Set + LocalId
    if (targetSetId && cardNum) {
      try {
        const directUrl = `https://api.tcgdex.net/v2/en/cards/${targetSetId}/${cardNum}`;
        const directRes = await fetch(directUrl);
        if (directRes.ok) {
          card = await directRes.json();
        }
      } catch (err) {
        // Procedi al fallback
      }
    }

    // 2. Fallback con ricerca per nome
    if (!card) {
      const searchUrl = `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(cardName)}`;
      const res = await fetch(searchUrl);
      const list = await res.json();

      if (Array.isArray(list) && list.length > 0) {
        const exactNameMatches = list.filter(
          (c) =>
            c.name &&
            c.name.trim().toLowerCase() === cardName.trim().toLowerCase(),
        );
        const candidates =
          exactNameMatches.length > 0 ? exactNameMatches : list;

        let match = null;

        if (targetSetId) {
          match = candidates.find(
            (c) =>
              c.id && c.id.toLowerCase().startsWith(targetSetId.toLowerCase()),
          );
        }

        if (!match && cardNum) {
          const normNum = String(parseInt(cardNum, 10));
          match = candidates.find((c) => {
            const cNum = String(parseInt(c.localId, 10));
            return cNum === normNum;
          });
        }

        if (!match) {
          match =
            candidates.find((c) => c.id && c.id.startsWith('sv') && c.image) ||
            [...candidates].reverse().find((c) => c.image) ||
            candidates[0];
        }

        if (match) {
          const detailUrl = `https://api.tcgdex.net/v2/en/cards/${match.id}`;
          const detailRes = await fetch(detailUrl);
          card = await detailRes.json();
        }
      }
    }

    if (card && card.image) {
      const stageStr = card.stage ? String(card.stage) : null;
      const categoryStr = card.category ? String(card.category) : null;
      const isBasic = stageStr ? stageStr.toLowerCase() === 'basic' : false;

      const result = {
        imgUrl: `${card.image}/low.webp`,
        category: categoryStr,
        stage: stageStr,
        isBasic: isBasic,
        inferredRole: mapApiToDefaultRole(categoryStr, stageStr, cardName),
      };

      cardApiCache.set(cacheKey, result);
      return result;
    }

    // Se l'API non ha trovato l'immagine ed è un'energia base, applica il fallback
    if (isBasicEnergy(cardName)) {
      const fallbackImg = getEnergyFallback(cardName);
      const result = {
        imgUrl: fallbackImg,
        category: 'Energy',
        stage: null,
        isBasic: false,
        inferredRole: 'neutral',
      };
      cardApiCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.error(`Errore caricamento per ${cardName}:`, err);
    if (isBasicEnergy(cardName)) {
      return {
        imgUrl: getEnergyFallback(cardName),
        category: 'Energy',
        stage: null,
        isBasic: false,
        inferredRole: 'neutral',
      };
    }
  }

  cardApiCache.set(cacheKey, null);
  return null;
}

// 7. Render Mazzo a Griglia
function renderDeck() {
  deckGrid.innerHTML = '';
  let total = 0;

  deckList.forEach((card, index) => {
    total += card.count;

    let apiBadgeHtml = '';
    if (card.category === 'Pokemon') {
      if (card.isBasic) {
        apiBadgeHtml = `<span class="badge-pill badge-base">Base</span>`;
      } else if (card.stage) {
        apiBadgeHtml = `<span class="badge-pill badge-stage">${card.stage}</span>`;
      } else {
        apiBadgeHtml = `<span class="badge-pill" style="background:#334155;color:#94a3b8;">Verifica...</span>`;
      }
    } else if (card.category === 'Trainer') {
      apiBadgeHtml = `<span class="badge-pill badge-trainer">Trainer</span>`;
    } else if (
      card.category === 'Energy' ||
      card.name.toLowerCase().includes('energy')
    ) {
      apiBadgeHtml = `<span class="badge-pill badge-energy">Energy</span>`;
    } else {
      apiBadgeHtml = `<span class="badge-pill" style="background:#334155;color:#94a3b8;">Verifica...</span>`;
    }

    const cardDiv = document.createElement('div');
    cardDiv.className = 'deck-card';
    cardDiv.id = `card-node-${index}`;

    cardDiv.innerHTML = `
      <div class="deck-card-image-wrap">
        <img id="img-${index}" src="" alt="${card.name}" style="display: none;">
        <span id="img-loader-${index}" style="font-size: 0.75rem; color: #64748b;">Caricamento...</span>
      </div>

      <div class="deck-card-header">
        <span class="deck-card-title" title="${card.name}">${card.name}</span>
        <div class="deck-card-badge-row" id="api-badge-${index}">
          ${apiBadgeHtml}
          ${card.setCode ? `<span style="font-size: 0.65rem; color: #64748b; margin-left: auto;">${card.setCode}</span>` : ''}
        </div>
      </div>

      <div class="deck-card-controls">
        <select data-idx="${index}" class="type-select-card" id="select-${index}">
          <option value="basic" ${card.type === 'basic' ? 'selected' : ''}>🟢 Starter T1</option>
          <option value="supporter" ${card.type === 'supporter' ? 'selected' : ''}>⚡ Motore T1</option>
          <option value="mid_engine" ${card.type === 'mid_engine' ? 'selected' : ''}>🔄 Motore Mid</option>
          <option value="neutral" ${card.type === 'neutral' ? 'selected' : ''}>⚪ Neutra / Tech</option>
          <option value="brick" ${card.type === 'brick' ? 'selected' : ''}>🔴 Brick T1</option>
        </select>

        <div class="deck-card-row-meta">
          <div class="deck-card-count">
            <span>Copie:</span>
            <input type="number" min="0" max="60" value="${card.count}" data-idx="${index}" class="count-input">
          </div>
          <label class="deck-card-prize-toggle" title="Avvisa se finisce tra i premi">
            <input type="checkbox" data-idx="${index}" class="prize-check" ${card.checkPrizes ? 'checked' : ''}>
            <span>Premi?</span>
          </label>
        </div>
      </div>
    `;

    deckGrid.appendChild(cardDiv);

    fetchCardData(card.name, card.setCode, card.cardNum).then((apiData) => {
      if (!apiData) {
        const loader = document.getElementById(`img-loader-${index}`);
        if (loader) loader.textContent = 'Nessuna img';
        return;
      }

      const imgEl = document.getElementById(`img-${index}`);
      const loaderEl = document.getElementById(`img-loader-${index}`);
      if (imgEl && apiData.imgUrl) {
        // Fallback onerror permanente: se l'immagine fallisce il download, subentra l'artwork base
        if (isBasicEnergy(card.name)) {
          imgEl.onerror = () => {
            imgEl.onerror = null;
            imgEl.src = getEnergyFallback(card.name);
          };
        }

        imgEl.src = apiData.imgUrl;
        imgEl.style.display = 'block';
        if (loaderEl) loaderEl.style.display = 'none';
      }

      let needsSave = false;
      if (
        card.stage !== apiData.stage ||
        card.category !== apiData.category ||
        card.isBasic !== apiData.isBasic
      ) {
        card.stage = apiData.stage;
        card.category = apiData.category;
        card.isBasic = apiData.isBasic;
        needsSave = true;

        const badgeEl = document.getElementById(`api-badge-${index}`);
        if (badgeEl) {
          if (card.category === 'Pokemon') {
            badgeEl.innerHTML = `
              ${card.isBasic ? '<span class="badge-pill badge-base">Base</span>' : `<span class="badge-pill badge-stage">${card.stage || 'Fase 1/2'}</span>`}
              ${card.setCode ? `<span style="font-size: 0.65rem; color: #64748b; margin-left: auto;">${card.setCode}</span>` : ''}
            `;
          } else if (card.category === 'Trainer') {
            badgeEl.innerHTML = `
              <span class="badge-pill badge-trainer">Trainer</span>
              ${card.setCode ? `<span style="font-size: 0.65rem; color: #64748b; margin-left: auto;">${card.setCode}</span>` : ''}
            `;
          }
        }

        if (!card.userOverridden && apiData.inferredRole) {
          card.type = apiData.inferredRole;
          const selectEl = document.getElementById(`select-${index}`);
          if (selectEl) selectEl.value = card.type;
        }

        if (!card.isBasic && card.type === 'basic') {
          card.type = 'brick';
          const selectEl = document.getElementById(`select-${index}`);
          if (selectEl) selectEl.value = 'brick';
        }
      }

      if (needsSave) {
        saveDeckToStorage();
      }
    });
  });

  cardCountEl.textContent = total;
}

// 8. Mescolamento Fisher-Yates
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function expandDeck() {
  const deck = [];
  deckList.forEach((card, id) => {
    for (let i = 0; i < card.count; i++) {
      deck.push({
        id,
        name: card.name,
        type: card.type,
        setCode: card.setCode,
        cardNum: card.cardNum,
        isBasic: Boolean(card.isBasic),
        checkPrizes: card.checkPrizes,
      });
    }
  });
  return deck;
}

// 9. Visual Playtester Turno 1
function createCardElement(card, isFacedown = false) {
  const el = document.createElement('div');
  el.className = `card-item ${isFacedown ? 'card-back' : ''}`;

  if (isFacedown) {
    el.title = 'Clicca per svelare';
    el.onclick = () => {
      el.classList.remove('card-back');
      el.title = '';
      el.onclick = null;
      renderCardFront(el, card);
    };
  } else {
    renderCardFront(el, card);
  }
  return el;
}

function renderCardFront(container, card) {
  container.innerHTML = `<span style="font-size: 0.65rem; color: #94a3b8;">...</span>`;
  fetchCardData(card.name, card.setCode, card.cardNum).then((data) => {
    if (data && data.imgUrl) {
      const img = document.createElement('img');
      img.src = data.imgUrl;
      img.alt = card.name;
      img.title = card.name;

      if (isBasicEnergy(card.name)) {
        img.onerror = () => {
          img.onerror = null;
          img.src = getEnergyFallback(card.name);
        };
      }

      container.innerHTML = '';
      container.appendChild(img);
    } else {
      container.innerHTML = `<div style="padding: 4px; text-align: center; font-size: 0.72rem;"><strong>${card.name}</strong></div>`;
    }
  });
}

function testTurn1Hand() {
  const deck = expandDeck();
  if (deck.length < 13) {
    alert(
      'Il mazzo ha meno di 13 carte: impossibile simulare apertura e premi.',
    );
    return;
  }
  currentDeckInstance = shuffle(deck);

  const hand = currentDeckInstance.splice(0, 7);
  const prizes = currentDeckInstance.splice(0, 6);

  handContainer.innerHTML = '';
  prizesContainer.innerHTML = '';
  handStatusBadge.style.display = 'inline-block';

  const officialBasics = hand.filter((c) => c.isBasic).length;
  const desiredStarters = hand.filter((c) => c.type === 'basic').length;
  const supporterCount = hand.filter((c) => c.type === 'supporter').length;

  if (officialBasics === 0) {
    handStatusBadge.textContent = '⚠️ Mulligan Ufficiale (Zero Base)';
    handStatusBadge.style.background = '#dc2626';
  } else if (desiredStarters >= 1 && supporterCount >= 1) {
    handStatusBadge.textContent = '🟢 Partenza Perfetta (Starter + Motore)';
    handStatusBadge.style.background = '#059669';
  } else if (supporterCount >= 1) {
    handStatusBadge.textContent = '🟡 Partenza Buona (Base + Ricerca T1)';
    handStatusBadge.style.background = '#2563eb';
  } else {
    handStatusBadge.textContent = '🟠 Partenza Lenta (Ha Base, no motore)';
    handStatusBadge.style.background = '#d97706';
  }

  hand.forEach((card) =>
    handContainer.appendChild(createCardElement(card, false)),
  );
  prizes.forEach((card) =>
    prizesContainer.appendChild(createCardElement(card, true)),
  );
}

function drawTurn1Card() {
  if (currentDeckInstance.length === 0) {
    alert('Genera prima una mano iniziale (7 carte).');
    return;
  }
  const topDeck = currentDeckInstance.shift();
  const cardEl = createCardElement(topDeck, false);
  cardEl.style.outline = '2px solid var(--accent-green)';
  handContainer.appendChild(cardEl);
}

// 10. Monte Carlo & Deck Doctor
function runSimulation() {
  const deck = expandDeck();
  if (deck.length === 0) {
    alert('Il mazzo è vuoto!');
    return;
  }

  const ITERATIONS = 10000;
  let noBasicCount = 0;
  let noIdealStarterCount = 0;
  let brickCount = 0;
  let optimalCount = 0;

  const prizeCounts = {};
  deckList.forEach((card, id) => {
    if (card.checkPrizes && card.count > 0) {
      prizeCounts[id] = Array(card.count + 1).fill(0);
    }
  });

  for (let s = 0; s < ITERATIONS; s++) {
    const shuffled = shuffle([...deck]);
    const hand = shuffled.slice(0, 7);
    const prizes = shuffled.slice(7, 13);

    const officialBasics = hand.filter((c) => c.isBasic).length;
    const idealStarters = hand.filter((c) => c.type === 'basic').length;
    const t1Engines = hand.filter((c) => c.type === 'supporter').length;
    const bricks = hand.filter(
      (c) => c.type === 'brick' || c.type === 'mid_engine',
    ).length;

    if (officialBasics === 0) {
      noBasicCount++;
    } else {
      if (idealStarters === 0) noIdealStarterCount++;
      if (t1Engines === 0 && bricks >= 3) brickCount++;
      if (idealStarters >= 1 && t1Engines >= 1) optimalCount++;
    }

    for (const id in prizeCounts) {
      const cardId = parseInt(id, 10);
      const inPrizes = prizes.filter((c) => c.id === cardId).length;
      prizeCounts[id][inPrizes]++;
    }
  }

  const pNoBasic = ((noBasicCount / ITERATIONS) * 100).toFixed(1);
  const pNoIdeal = ((noIdealStarterCount / ITERATIONS) * 100).toFixed(1);
  const pBrick = ((brickCount / ITERATIONS) * 100).toFixed(1);
  const pOptimal = ((optimalCount / ITERATIONS) * 100).toFixed(1);

  const totalOfficialBasics = deckList
    .filter((c) => c.isBasic)
    .reduce((a, b) => a + b.count, 0);
  const totalIdealStarters = deckList
    .filter((c) => c.type === 'basic')
    .reduce((a, b) => a + b.count, 0);
  const totalT1Engines = deckList
    .filter((c) => c.type === 'supporter')
    .reduce((a, b) => a + b.count, 0);
  const totalMidEngines = deckList
    .filter((c) => c.type === 'mid_engine')
    .reduce((a, b) => a + b.count, 0);

  const tips = [];
  if (parseFloat(pNoBasic) > 15) {
    tips.push(
      `⚠️ <strong>Rischio Mulligan (${pNoBasic}%):</strong> Ci sono ${totalOfficialBasics} Pokémon Base legali nel mazzo. Portali ad almeno 9-12 copie.`,
    );
  } else {
    tips.push(
      `✅ <strong>Mulligan regolare sotto controllo:</strong> ${totalOfficialBasics} Pokémon Base totali (solo ${pNoBasic}% di mulligan).`,
    );
  }

  if (totalIdealStarters > 0 && totalIdealStarters < 4) {
    tips.push(
      `⚠️ <strong>Apertura Secondaria Frequente (${pNoIdeal}%):</strong> Con soli ${totalIdealStarters} starter primari rischi di dover aprire la partita con un Pokémon di supporto.`,
    );
  }

  if (parseFloat(pOptimal) < 70) {
    tips.push(
      `⚠️ <strong>Pochi Motori T1 (${pOptimal}%):</strong> Hai ${totalT1Engines} acceleratori per aprire il gioco al T1. I motori non T1 (${totalMidEngines} copie) non sbloccano la mano al primo turno.`,
    );
  } else {
    tips.push(
      `✅ <strong>Apertura solida:</strong> ${pOptimal}% di mani con starter primario e motore T1.`,
    );
  }

  deckList.forEach((c) => {
    if (c.count === 1 && c.checkPrizes) {
      tips.push(
        `🔒 <strong>Prize Lock (${c.name}):</strong> In copia singola ha il 10% di probabilità secca di finire bloccata nei premi.`,
      );
    }
  });

  let prizeListItems = '';
  const prizeKeys = Object.keys(prizeCounts);
  if (prizeKeys.length === 0) {
    prizeListItems = '<li><em>Nessuna carta con "Premi?" spuntata.</em></li>';
  } else {
    for (const id of prizeKeys) {
      const card = deckList[id];
      const counts = prizeCounts[id];
      const details = [];
      for (let i = 1; i <= card.count; i++) {
        const pct = ((counts[i] / ITERATIONS) * 100).toFixed(1);
        details.push(`${i} a premio: <strong>${pct}%</strong>`);
      }
      const atLeastOne = (
        (counts.slice(1).reduce((a, b) => a + b, 0) / ITERATIONS) *
        100
      ).toFixed(1);
      prizeListItems += `
        <li style="margin-bottom: 6px;">
          <strong>${card.name}</strong> (${card.count}x): Almeno 1 a premio: <strong>${atLeastOne}%</strong> 
          <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 6px;">[ ${details.join(' | ')} ]</span>
        </li>
      `;
    }
  }

  outputEl.innerHTML = `
    <h2 class="panel-title">📊 Risultati Simulazione (10.000 Mani)</h2>
    
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">🟢 Partenza Perfetta</span>
        <span class="stat-value" style="color: var(--accent-green);">${pOptimal}%</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">⚠️ Mulligan Regolamentare</span>
        <span class="stat-value" style="color: var(--accent-yellow);">${pNoBasic}%</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">🟡 Base Secondario Attivo</span>
        <span class="stat-value" style="color: #60a5fa;">${pNoIdeal}%</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">🔴 Mano Morta / Brick T1</span>
        <span class="stat-value" style="color: var(--accent-red);">${pBrick}%</span>
      </div>
    </div>

    <div style="margin-top: 14px;">
      <h4 style="margin: 0 0 8px 0; font-size: 0.95rem;">Analisi Premi:</h4>
      <ul style="padding-left: 20px; margin: 0;">${prizeListItems}</ul>
    </div>

    <div class="doctor-box">
      <h4>📋 Deck Doctor - Diagnosi & Consigli:</h4>
      <ul>${tips.map((t) => `<li>${t}</li>`).join('')}</ul>
    </div>
  `;
}

// 11. Normalizzazione Energie e Deduplica per Nome
function cleanCardName(rawName) {
  const energyMap = {
    '{G}': 'Grass',
    '{R}': 'Fire',
    '{W}': 'Water',
    '{L}': 'Lightning',
    '{P}': 'Psychic',
    '{F}': 'Fighting',
    '{D}': 'Darkness',
    '{M}': 'Metal',
    '{Y}': 'Fairy',
    '{N}': 'Dragon',
    '{C}': 'Colorless',
  };

  let cleaned = rawName;
  for (const [sym, typeName] of Object.entries(energyMap)) {
    if (cleaned.includes(sym)) cleaned = cleaned.replace(sym, typeName);
  }

  return cleaned
    .replace(/\{[^}]+\}/g, '')
    .replace(/^Basic\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDeckList(text) {
  const lines = text.split('\n');
  const cardMap = new Map();
  let currentSection = 'unknown';
  const lineRegex = /^(\d+)\s+(.+?)\s+([A-Za-z0-9]{2,5})\s+([A-Za-z0-9]+)$/;

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    if (/^(pok[eé]mon)/i.test(line)) {
      currentSection = 'pokemon';
      return;
    }
    if (/^(carte allenatore|trainer)/i.test(line)) {
      currentSection = 'trainer';
      return;
    }
    if (/^(energia|energy)/i.test(line)) {
      currentSection = 'energy';
      return;
    }
    if (/^(totale|total)/i.test(line)) return;

    const match = line.match(lineRegex);
    if (match) {
      const count = parseInt(match[1], 10);
      const name = cleanCardName(match[2]);
      const setCode = match[3];
      const cardNum = match[4];

      let initialCategory =
        currentSection === 'pokemon'
          ? 'Pokemon'
          : currentSection === 'trainer'
            ? 'Trainer'
            : currentSection === 'energy'
              ? 'Energy'
              : null;

      if (cardMap.has(name)) {
        cardMap.get(name).count += count;
      } else {
        cardMap.set(name, {
          name,
          count,
          type: 'neutral',
          isBasic: false,
          stage: null,
          category: initialCategory,
          setCode: setCode,
          cardNum: cardNum,
          checkPrizes: count === 1 && currentSection !== 'energy',
          userOverridden: false,
        });
      }
    }
  });

  return Array.from(cardMap.values());
}

// 12. Event Listener Delegato
deckGrid.addEventListener('change', (e) => {
  const idx = e.target.dataset.idx;
  if (!idx) return;

  if (e.target.classList.contains('count-input')) {
    deckList[idx].count = parseInt(e.target.value, 10) || 0;
  } else if (e.target.classList.contains('type-select-card')) {
    deckList[idx].type = e.target.value;
    deckList[idx].userOverridden = true;
  } else if (e.target.classList.contains('prize-check')) {
    deckList[idx].checkPrizes = e.target.checked;
  }
  renderDeck();
  saveDeckToStorage();
});

document.getElementById('importBtn').addEventListener('click', async () => {
  const raw = document.getElementById('deckImportText').value;
  const parsed = parseDeckList(raw);
  if (parsed.length === 0) {
    alert('Nessuna riga carta valida trovata nel testo inserito.');
    return;
  }
  deckList = parsed;
  apiStatusIndicator.textContent = 'Sincronizzazione API in corso...';
  renderDeck();
  saveDeckToStorage();
  setTimeout(() => {
    apiStatusIndicator.textContent = 'Mazzo sincronizzato!';
  }, 1400);
});

document.getElementById('clearCacheBtn').addEventListener('click', () => {
  if (
    confirm('Vuoi davvero ripristinare il mazzo predefinito e pulire la cache?')
  ) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
});

document.getElementById('drawHandBtn').addEventListener('click', testTurn1Hand);
document.getElementById('drawT1Btn').addEventListener('click', drawTurn1Card);
document.getElementById('runBtn').addEventListener('click', runSimulation);

// Bootstrap Iniziale
loadDeckFromStorage();
renderDeck();
