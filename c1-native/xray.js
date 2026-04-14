/* ── X-Ray Glossary ──────────────────────────────────────────── */
/* Contextual glossary overlay — shows definitions for terms on  */
/* the current slide. Inspired by Prime Video X-Ray.             */
/* ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const deck = document.querySelector('.deck');
  if (!deck) return;

  // ── Glossary data ─────────────────────────────────────────
  // Each entry: { name, def, match[] }
  // match[] = case-insensitive strings to search for in slide text
  const GLOSSARY = [
    // — Structures —
    { name: 'dlPFC', cat: 'structure',
      def: 'Cortex préfrontal dorsolatéral. Contrôle cognitif, mémoire de travail, planification. Nœud central du CEN.',
      match: ['dlpfc', 'dorsolatéral', 'dorsolateral'] },
    { name: 'vlPFC', cat: 'structure',
      def: 'Cortex préfrontal ventrolatéral. Inhibition de réponse, freinage comportemental. Inclut l\'aire de Broca (langage).',
      match: ['vlpfc', 'ventrolatéral', 'ventrolateral'] },
    { name: 'dmPFC', cat: 'structure',
      def: 'Cortex préfrontal dorsomédian. Attention motivationnelle, évaluation de la valeur, mentalisation.',
      match: ['dmpfc', 'dorsomédian', 'dorsomedial', 'dorso-médian'] },
    { name: 'vmPFC', cat: 'structure',
      def: 'Cortex préfrontal ventromédian. Jugement de valeur, extinction de la peur, décision « gut feeling ». Lésion → impulsivité, déficit de jugement social.',
      match: ['vmpfc', 'ventromédian', 'ventromedial', 'ventro-médian'] },
    { name: 'OFC', cat: 'structure',
      def: 'Cortex orbitofrontal. Évalue la récompense/punition en temps réel. Boucle OFC → caudé → pallidum → thalamus : dysfonctionnelle dans le TOC.',
      match: ['ofc', 'orbitofrontal'] },
    { name: 'mPFC', cat: 'structure',
      def: 'Cortex préfrontal médian. Nœud central du DMN. Pensée autoréférentielle, projection de soi dans le temps.',
      match: ['mpfc', 'préfrontal médian', 'prefrontal medial'] },
    { name: 'dACC', cat: 'structure',
      def: 'Cortex cingulaire antérieur dorsal. Détection de saillance, monitorage de conflits. Nœud du SN avec l\'insula antérieure.',
      match: ['dacc', 'cingulaire antérieur dorsal'] },
    { name: 'pgACC / sgACC', cat: 'structure',
      def: 'Cingulaire prégénual / subgénual (aire 25). Régulation émotionnelle. sgACC hyperactive en dépression — cible de la DBS (Mayberg).',
      match: ['pgacc', 'sgacc', 'prégénual', 'subgénual', 'aire 25', 'area 25'] },
    { name: 'ACC', cat: 'structure',
      def: 'Cortex cingulaire antérieur. Divisé en dorsal (dACC — saillance/conflit) et ventral (pgACC/sgACC — émotion). Carrefour entre cognition et émotion.',
      match: ['cingulaire antérieur', 'anterior cingulate'] },
    { name: 'Amygdale', cat: 'structure',
      def: 'Noyau de détection de menace. BLA (input sensoriel) → CeA (output autonome) → PAG (réponse motrice). Menace aiguë, phasique.',
      match: ['amygdal', 'amygdala'] },
    { name: 'Hippocampe', cat: 'structure',
      def: 'Mémoire contextuelle et spatiale. Fournit le contexte aux circuits de peur (« est-ce sécuritaire ici ? »). Atrophié dans la dépression chronique et le TSPT.',
      match: ['hippocampe', 'hippocampus', 'hippocampal'] },
    { name: 'Insula', cat: 'structure',
      def: 'Cortex insulaire. Intéroception (« comment je me sens en ce moment »). L\'insula antérieure + dACC = Salience Network. L\'insula postérieure = douleur, température.',
      match: ['insula', 'insulaire'] },
    { name: 'Ganglions de la base', cat: 'structure',
      def: 'Striatum (caudé, putamen, accumbens) + pallidum. Trois boucles CSTC : cognitive (dlPFC → caudé), limbique (OFC → accumbens), motrice (SMA → putamen).',
      match: ['ganglions de la base', 'basal ganglia', 'noyaux gris', 'striatum'] },
    { name: 'NAcc', cat: 'structure',
      def: 'Noyau accumbens. Carrefour du circuit de récompense (VTA → NAcc). Wanting (motivation dopaminergique). Cible du bupropion et pramipexole.',
      match: ['nacc', 'noyau accumbens', 'nucleus accumbens', 'accumbens'] },
    { name: 'VTA', cat: 'structure',
      def: 'Aire tegmentale ventrale. Source dopaminergique → NAcc (voie mésolimbique). Circuit du wanting/motivation.',
      match: ['vta', 'aire tegmentale', 'tegmental'] },
    { name: 'BNST', cat: 'structure',
      def: 'Noyau du lit de la strie terminale. Menace soutenue (heures/jours), anxiété anticipatoire. Distinct de l\'amygdale (menace aiguë). GAD plutôt que phobie.',
      match: ['bnst', 'strie terminale', 'bed nucleus', 'stria terminalis'] },
    { name: 'PAG', cat: 'structure',
      def: 'Substance grise périaqueducale. Sortie motrice de la peur : fight/flight/freeze. Reçoit de l\'amygdale (CeA).',
      match: ['pag', 'périaqueducale', 'periaqueductal'] },
    { name: 'PCC', cat: 'structure',
      def: 'Cortex cingulaire postérieur. Nœud du DMN avec mPFC. Mémoire autobiographique, orientation spatiale de soi.',
      match: ['pcc', 'cingulaire postérieur', 'posterior cingulate'] },

    // — Réseaux —
    { name: 'Salience Network (SN)', cat: 'réseau',
      def: 'Insula antérieure + dACC. Détecte la saillance, bascule entre CEN et DMN (Menon 2011). Hyperactif dans les troubles internalisants.',
      match: ['salience network', 'réseau de saillance', ' sn '] },
    { name: 'Central Executive Network (CEN)', cat: 'réseau',
      def: 'dlPFC + cortex pariétal postérieur. Mémoire de travail, planification, contrôle cognitif. Hypoactif quand le SN est verrouillé ON.',
      match: ['central executive', 'réseau exécutif central', ' cen '] },
    { name: 'Default Mode Network (DMN)', cat: 'réseau',
      def: 'mPFC + PCC + hippocampe. Pensée autoréférentielle, projection temporelle. Hyperconnecté en dépression → rumination.',
      match: ['default mode', 'réseau du mode par défaut', ' dmn '] },
    { name: 'Boucle CSTC', cat: 'réseau',
      def: 'Cortico-striato-thalamo-corticale. Boucle récursive : cortex → striatum → pallidum → thalamus → cortex. Trois variantes : cognitive, limbique, motrice. Dysfonctionnelle dans le TOC.',
      match: ['cstc', 'cortico-striato', 'striato-thalamo'] },
    { name: 'Triple Network (Menon)', cat: 'réseau',
      def: 'Modèle de Menon (2011) : le SN bascule entre CEN (tâche) et DMN (repos). Déséquilibre = pathologie transdiagnostique.',
      match: ['triple network', 'menon 2011', 'menon'] },

    // — Construits dimensionnels —
    { name: 'Affect négatif (NA)', cat: 'construit',
      def: 'Tendance stable à ressentir anxiété, tristesse, colère, culpabilité. Noyau partagé du spectre internalisant (r ≈ 0.98).',
      match: ['affect négatif', 'negative affect', ' na '] },
    { name: 'Affect positif (PA)', cat: 'construit',
      def: 'Capacité à ressentir plaisir, intérêt, engagement. PA↓ = anhédonie. Facteur-pont entre Distress et Detachment.',
      match: ['affect positif', 'positive affect', ' pa '] },
    { name: 'Distress', cat: 'construit',
      def: 'Sous-facteur internalisant : NA↑ + PA↓. TDM et TAG partagent ce facteur. Circuits : DMN/sgACC (rumination), BNST (menace soutenue).',
      match: ['distress', 'détresse'] },
    { name: 'Fear', cat: 'construit',
      def: 'Sous-facteur internalisant lié à la menace phasique. Panique, phobies. Circuits : amygdale → PAG (aigu), BNST (soutenu).',
      match: [' fear ', 'peur'] },
    { name: 'Anhédonie', cat: 'construit',
      def: 'Capacité réduite de plaisir. Distinction clé : wanting (motivation) vs liking (plaisir consommatoire) vs learning (apprentissage de récompense). Berridge : anhédonie clinique ≈ wanting↓.',
      match: ['anhédonie', 'anhedoni'] },
    { name: 'Detachment', cat: 'construit',
      def: 'Spectre HiTOP : affect restreint, retrait social, anhédonie large. Chevauche les symptômes négatifs (avolition, alogie, asociabilité). PA↓ est le pont entre Distress et Detachment.',
      match: ['detachment', 'détachement'] },

    // — Modèles & cadres —
    { name: 'HiTOP', cat: 'modèle',
      def: 'Hierarchical Taxonomy of Psychopathology. Modèle dimensionnel : p-factor → supraspectre → spectre → sous-facteur → composante. Alternative au DSM catégoriel.',
      match: ['hitop', 'hi-top'] },
    { name: 'RDoC', cat: 'modèle',
      def: 'Research Domain Criteria (NIMH). Organise par mécanismes biologiques (circuits, gènes) plutôt que par catégories cliniques.',
      match: ['rdoc', 'research domain criteria'] },
    { name: 'Biotype', cat: 'modèle',
      def: 'Sous-type neurobiologique défini par marqueurs cérébraux (circuits, connectivité) plutôt que symptômes. Les biotypes traversent les frontières diagnostiques (Williams 2016).',
      match: ['biotype'] },
    { name: 'p-factor', cat: 'modèle',
      def: 'Facteur général de psychopathologie au sommet de HiTOP. Prédit la sévérité globale, comme le g-factor en intelligence.',
      match: ['p-factor', 'facteur p', 'facteur général'] },
    { name: 'Transdiagnostique', cat: 'modèle',
      def: 'Processus traversant les catégories diagnostiques. Ex : rumination, évitement, biais attentionnel. Implique des cibles thérapeutiques partagées.',
      match: ['transdiagnostique', 'transdiagnostic'] },
    { name: 'Nosologie', cat: 'modèle',
      def: 'Science de la classification des maladies. En psychiatrie : débat entre catégoriel (DSM, CIM) et dimensionnel (HiTOP, RDoC).',
      match: ['nosologi'] },
    { name: 'Dysfonction nuisible', cat: 'modèle',
      def: 'Concept de Wakefield (1992) : un trouble mental nécessite (a) dysfonction d\'un mécanisme biologique ET (b) préjudice jugé par normes sociales.',
      match: ['dysfonction nuisible', 'harmful dysfunction', 'wakefield'] },
    { name: 'Modèle CNP (Harmer)', cat: 'modèle',
      def: 'Les ISRS corrigent le biais de traitement émotionnel négatif dès J1-7. L\'amélioration clinique suit en 4-6 semaines via le réapprentissage social.',
      match: ['harmer', 'cnp', 'cognitive neuropsychological'] },
    { name: 'Violation d\'attente (Craske)', cat: 'modèle',
      def: 'Mécanisme d\'extinction : la non-occurrence de l\'issue redoutée est plus efficace que l\'habituation graduelle. Paradigme de Craske.',
      match: ['violation d\'attente', 'expectancy violation', 'craske'] },

    // — Mesures —
    { name: 'PID-5', cat: 'mesure',
      def: 'Personality Inventory for DSM-5. 25 items (BF), 5 domaines. Balayage large des traits de personnalité pathologiques.',
      match: ['pid-5', 'pid5'] },
    { name: 'PHQ-9', cat: 'mesure',
      def: 'Patient Health Questionnaire, 9 items. Dépistage de la dépression. Attention : items somatiques possiblement gonflés par conditions médicales.',
      match: ['phq-9', 'phq9'] },
    { name: 'GAD-7', cat: 'mesure',
      def: 'Generalized Anxiety Disorder, 7 items. Mesure l\'anxiété. Couvre surtout la composante inquiétude/anticipation.',
      match: ['gad-7', 'gad7'] },
    { name: 'Y-BOCS', cat: 'mesure',
      def: 'Yale-Brown Obsessive Compulsive Scale. Sévérité du TOC. 10 items, score 0-40.',
      match: ['y-bocs', 'ybocs', 'yale-brown'] },
    { name: 'Kappa (κ)', cat: 'mesure',
      def: 'Coefficient de fidélité interjuges. Regier 2013 : kappa moyen des dx DSM-5 = 0.20-0.76. Faible pour plusieurs troubles.',
      match: ['kappa'] },
  ];

  // ── Category colors ───────────────────────────────────────
  const CAT_COLORS = {
    'structure': '#418FDE',
    'réseau':    '#4A8C1C',
    'construit': '#B9975B',
    'modèle':    '#004071',
    'mesure':    '#7b5ea7',
  };

  // ── Inject styles ─────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .xray-btn {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 10001;
      background: rgba(0,64,113,0.85);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      font-family: 'DM Mono', 'Consolas', monospace;
      font-size: 13px;
      letter-spacing: 0.05em;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: background 0.2s, transform 0.15s;
      user-select: none;
    }
    .xray-btn:hover { background: rgba(65,143,222,0.9); transform: scale(1.05); }
    .xray-btn.active { background: rgba(65,143,222,0.95); box-shadow: 0 0 0 2px #418FDE; }

    .xray-panel {
      position: fixed;
      top: 0; right: 0;
      width: 380px;
      max-width: 90vw;
      height: 100vh;
      z-index: 10000;
      background: rgba(10,15,30,0.94);
      backdrop-filter: blur(16px);
      color: #e0e0e0;
      font-family: 'DM Sans', sans-serif;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
      overflow-y: auto;
      box-shadow: -4px 0 24px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
    }
    .xray-panel.open { transform: translateX(0); }

    .xray-panel__header {
      padding: 16px 20px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
    }
    .xray-panel__title {
      font-family: 'DM Mono', monospace;
      font-size: 13px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #418FDE;
      margin: 0;
    }
    .xray-panel__slide {
      font-size: 12px;
      color: #888;
      margin-top: 4px;
    }

    .xray-panel__body {
      padding: 12px 20px 24px;
      flex: 1;
      overflow-y: auto;
    }

    .xray-term {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .xray-term:last-child { border-bottom: none; }

    .xray-term__name {
      font-weight: 500;
      font-size: 15px;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .xray-term__cat {
      font-size: 10px;
      font-family: 'DM Mono', monospace;
      letter-spacing: 0.05em;
      padding: 1px 6px;
      border-radius: 3px;
      text-transform: uppercase;
      opacity: 0.9;
    }
    .xray-term__def {
      font-size: 13px;
      line-height: 1.6;
      color: #bbb;
    }

    .xray-empty {
      color: #666;
      font-size: 13px;
      font-style: italic;
      padding: 20px 0;
    }

    /* Highlight matching terms on the slide */
    .xray-highlight {
      background: rgba(65,143,222,0.15);
      border-bottom: 1px dashed rgba(65,143,222,0.5);
      border-radius: 2px;
      padding: 0 1px;
      cursor: help;
      transition: background 0.2s;
    }
    .xray-highlight:hover {
      background: rgba(65,143,222,0.3);
    }

    /* Hide panel elements in overview mode */
    .overview-mode .xray-panel,
    .overview-mode .xray-btn { display: none !important; }
  `;
  document.head.appendChild(style);

  // ── Build panel DOM ───────────────────────────────────────
  const panel = document.createElement('div');
  panel.className = 'xray-panel';
  panel.innerHTML = `
    <div class="xray-panel__header">
      <div class="xray-panel__title">X-Ray · Glossaire</div>
      <div class="xray-panel__slide" id="xray-slide-label"></div>
    </div>
    <div class="xray-panel__body" id="xray-body"></div>
  `;
  document.body.appendChild(panel);

  const btn = document.createElement('button');
  btn.className = 'xray-btn';
  btn.textContent = 'X-Ray';
  btn.title = 'Glossaire contextuel (G)';
  document.body.appendChild(btn);

  let isOpen = false;

  function toggle() {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    btn.classList.toggle('active', isOpen);
    if (isOpen) refresh();
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    toggle();
  });

  // Close on click outside
  document.addEventListener('click', function (e) {
    if (isOpen && !panel.contains(e.target) && e.target !== btn) {
      toggle();
    }
  });

  // G key to toggle (don't conflict with contenteditable)
  document.addEventListener('keydown', function (e) {
    if (e.target.isContentEditable) return;
    if (e.key === 'g' || e.key === 'G') {
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggle();
      }
    }
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      toggle();
    }
  });

  // ── Find matching terms for a slide ───────────────────────
  function findTerms(slide) {
    // Get visible text (exclude notes)
    const clone = slide.cloneNode(true);
    const notes = clone.querySelector('.notes');
    if (notes) notes.remove();
    const text = clone.textContent.toLowerCase();

    const found = [];
    GLOSSARY.forEach(function (entry) {
      for (let i = 0; i < entry.match.length; i++) {
        if (text.indexOf(entry.match[i].toLowerCase()) !== -1) {
          found.push(entry);
          break;
        }
      }
    });

    // Sort: structures first, then networks, then concepts
    const order = { 'structure': 0, 'réseau': 1, 'construit': 2, 'modèle': 3, 'mesure': 4 };
    found.sort(function (a, b) { return (order[a.cat] || 9) - (order[b.cat] || 9); });
    return found;
  }

  // ── Render panel for current slide ────────────────────────
  function refresh() {
    const slides = deck.querySelectorAll('.slide');
    const active = deck.querySelector('.slide.active');
    if (!active) return;

    const idx = Array.from(slides).indexOf(active);
    const label = document.getElementById('xray-slide-label');
    const body = document.getElementById('xray-body');

    const h1 = active.querySelector('h1');
    label.textContent = 'Diapo ' + (idx + 1) + (h1 ? ' — ' + h1.textContent.trim() : '');

    const terms = findTerms(active);

    if (terms.length === 0) {
      body.innerHTML = '<div class="xray-empty">Aucun terme du glossaire sur cette diapo.</div>';
      return;
    }

    let html = '';
    terms.forEach(function (t) {
      const col = CAT_COLORS[t.cat] || '#888';
      html += '<div class="xray-term">' +
        '<div class="xray-term__name">' +
          '<span style="color:' + col + '">' + t.name + '</span>' +
          '<span class="xray-term__cat" style="background:' + col + '22;color:' + col + '">' + t.cat + '</span>' +
        '</div>' +
        '<div class="xray-term__def">' + t.def + '</div>' +
      '</div>';
    });
    body.innerHTML = html;
  }

  // ── Auto-refresh on slide change ──────────────────────────
  // Watch for hash changes (deck.js uses hash navigation)
  window.addEventListener('hashchange', function () {
    if (isOpen) refresh();
  });

  // Also observe class changes on slides (active class toggle)
  const observer = new MutationObserver(function () {
    if (isOpen) refresh();
  });
  deck.querySelectorAll('.slide').forEach(function (s) {
    observer.observe(s, { attributes: true, attributeFilter: ['class'] });
  });

})();
