// =========================================================================
// ZCode — Strategic Positioning Document
// "What makes ZCode different from Cursor, Aider, Continue, Cody, Devin"
// =========================================================================
/* eslint-disable @typescript-eslint/no-require-imports */

const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, PageBreak,
  Table, TableRow, TableCell, TableLayoutType, WidthType,
  BorderStyle, ShadingType, TabStopType, TabStopPosition,
} = require("docx");
const fs = require("fs");

// --- Palette: Cool + Heavy + Active (Lapis Tech / AI innovation) ---
const P = {
  primary: "#1A1F36",
  body: "#000000",
  secondary: "#5A6080",
  accent: "#D97706",       // saffron amber (ZCode brand)
  emerald: "#059669",      // semantic success
  rose: "#DC2626",         // semantic error
  surface: "#F8F9FF",
  coverBg: "#0F172A",
  coverTitle: "#FFFFFF",
  coverSub: "#94A3B8",
  coverAccent: "#F5A524",
};

const c = (hex) => hex.replace("#", "");
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

// --- Helpers ---
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    children: [new TextRun({
      text, bold: true, size: 36, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({
      text, bold: true, size: 28, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({
      text, bold: true, size: 24, color: c(P.accent),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  });
}

function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 120 },
    children: [new TextRun({
      text, size: 22, color: c(P.body),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  });
}

function bodyRich(runs) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 120 },
    children: runs,
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    spacing: { line: 312, after: 80 },
    indent: { left: 360 + level * 360 },
    children: [
      new TextRun({ text: "•  ", size: 22, color: c(P.accent), bold: true }),
      new TextRun({
        text, size: 22, color: c(P.body),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      }),
    ],
  });
}

function bulletRich(runs, level = 0) {
  return new Paragraph({
    spacing: { line: 312, after: 80 },
    indent: { left: 360 + level * 360 },
    children: [
      new TextRun({ text: "•  ", size: 22, color: c(P.accent), bold: true }),
      ...runs,
    ],
  });
}

function callout(label, text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: noBorders,
    rows: [new TableRow({
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: c(P.surface) },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          left: { style: BorderStyle.SINGLE, size: 24, color: c(P.accent) },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
        margins: { top: 160, bottom: 160, left: 240, right: 200 },
        children: [
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({
              text: label, bold: true, size: 20, color: c(P.accent),
              font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
            })],
          }),
          new Paragraph({
            spacing: { line: 300 },
            children: [new TextRun({
              text, size: 22, color: c(P.body),
              font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
            })],
          }),
        ],
      })],
    })],
  });
}

// Comparison table
function comparisonTable(headers, rows) {
  const headerCells = headers.map(h => new TableCell({
    shading: { type: ShadingType.CLEAR, fill: c(P.primary) },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({
        text: h, bold: true, size: 20, color: "FFFFFF",
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    })],
  }));

  const dataRows = rows.map((row, i) => new TableRow({
    cantSplit: true,
    children: row.map((cell, j) => new TableCell({
      shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? "FFFFFF" : c(P.surface) },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [new Paragraph({
        spacing: { line: 280 },
        children: [new TextRun({
          text: cell, size: 20, color: c(P.body),
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
        })],
      })],
    })),
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headerCells }),
      ...dataRows,
    ],
  });
}

// --- Cover ---
function buildCover() {
  const padL = 1200, padR = 800;
  const children = [
    new Paragraph({ spacing: { before: 2400 } }),
    new Paragraph({
      indent: { left: padL, right: padR },
      spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: c(P.coverAccent), space: 8 } },
      children: [new TextRun({
        text: "Z C O D E   ·   S T R A T E G I C   P O S I T I O N I N G",
        size: 18, color: c(P.coverAccent), characterSpacing: 40,
        font: { ascii: "Calibri" },
      })],
    }),
    new Paragraph({
      indent: { left: padL },
      spacing: { after: 200, line: 600, lineRule: "atLeast" },
      children: [new TextRun({
        text: "ZCode", size: 96, bold: true, color: c(P.coverTitle),
        font: { ascii: "Arial" },
      })],
    }),
    new Paragraph({
      indent: { left: padL },
      spacing: { after: 600, line: 460, lineRule: "atLeast" },
      children: [new TextRun({
        text: "Ce que cette plateforme a que les autres n'ont pas",
        size: 32, color: c(P.coverTitle),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    }),
    new Paragraph({
      indent: { left: padL },
      spacing: { after: 800 },
      children: [new TextRun({
        text: "Analyse comparative, différentiateurs uniques et architecture cible",
        size: 24, color: c(P.coverSub),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    }),
    new Paragraph({
      indent: { left: padL + 200 },
      spacing: { after: 80 },
      border: { left: { style: BorderStyle.SINGLE, size: 8, color: c(P.coverAccent), space: 12 } },
      children: [new TextRun({
        text: "Document stratégique V1",
        size: 24, color: c(P.coverSub),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    }),
    new Paragraph({
      indent: { left: padL + 200 },
      spacing: { after: 80 },
      border: { left: { style: BorderStyle.SINGLE, size: 8, color: c(P.coverAccent), space: 12 } },
      children: [new TextRun({
        text: "Comparator : Cursor, Aider, Continue, Cody, Devin, GitHub Copilot Workspace",
        size: 22, color: c(P.coverSub),
        font: { ascii: "Calibri" },
      })],
    }),
    new Paragraph({ spacing: { before: 3200 } }),
    new Paragraph({
      indent: { left: padL, right: padR },
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: c(P.coverAccent), space: 8 } },
      spacing: { before: 200 },
      children: [
        new TextRun({ text: "ZCode — Comprendre & transformer les dépôts open source", size: 16, color: c(P.coverSub), font: { ascii: "Calibri" } }),
        new TextRun({ text: "                              " }),
        new TextRun({ text: "Confidentiel", size: 16, color: c(P.coverSub), font: { ascii: "Calibri" } }),
      ],
    }),
  ];

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: noBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: c(P.coverBg) },
        borders: noBorders,
        children,
      })],
    })],
  })];
}

// --- Body content ---
const bodyChildren = [
  // ===== Section 1: Executive Summary =====
  h1("1. Résumé exécutif"),

  body("Le marché des assistants IA pour développeurs est saturé : Cursor, GitHub Copilot, Continue.dev, Aider, Sourcegraph Cody, Devin, et d'autres proposent tous d'écrire du code plus vite. Mais ils partagent tous la même limite fondamentale : ils sont conçus pour des développeurs qui savent déjà ce qu'ils veulent faire. ZCode se positionne sur un terrain différent — la compréhension et la transformation de dépôts open source, avec un accent explicite sur les utilisateurs non-développeurs ou les développeurs découvrant un langage qu'ils ne maîtrisent pas."),

  body("Ce document analyse le paysage concurrentiel, identifie les 5 différentiateurs uniques de ZCode, et propose une architecture cible qui structure les 21 intégrations open source (tree-sitter, ast-grep, Repomix, Browser Use, Firecrawl, Headroom, SkillSpector, etc.) en un produit cohérent. L'objectif est de répondre à une question simple : pourquoi un utilisateur choisirait ZCode plutôt que Cursor ou Devin ?"),

  callout(
    "Thèse centrale",
    "ZCode n'est pas un IDE IA ni un agent autonome. C'est une plateforme de compréhension et de transformation de dépôts qui comble le fossé entre « je ne comprends pas ce code » et « je veux le transformer ». Les concurrents écrivent du code ; ZCode explique, séquence, maquette, puis génère — dans cet ordre, et seulement dans cet ordre."
  ),

  new Paragraph({ spacing: { after: 200 } }),

  // ===== Section 2: Landscape =====
  h1("2. Le paysage concurrentiel"),

  body("Avant d'identifier ce qui différencie ZCode, il faut comprendre ce que font les concurrents — et surtout, ce qu'ils ne font pas. Le marché se divise en 4 catégories distinctes, chacune avec ses forces et ses angles morts."),

  h2("2.1 Les IDE IA (Cursor, Windsurf, Continue.dev)"),
  body("Cursor est l'IDE IA dominant en 2025. Il propose un chat contextuel, des edits multi-fichiers, et un agent capable d'exécuter des commandes terminal. Continue.dev et Aider jouent sur le même terrain, en open source. Leur force : ils sont intégrés à l'expérience de développement, ils connaissent le contexte du fichier ouvert, ils écrivent du code rapidement. Leur limite : ils supposent que l'utilisateur sait déjà ce qu'il veut faire. On ouvre Cursor pour « ajouter une fonction de validation », pas pour « comprendre ce que fait ce dépôt Python que je viens de cloner »."),

  body("Cas d'usage typique : un développeur expérimenté veut aller plus vite sur un projet qu'il connaît déjà. Il n'a pas besoin qu'on lui explique l'architecture — il veut juste que l'IA génère le boilerplate et corrige ses typos. C'est un marché énorme, mais ce n'est pas celui de ZCode."),

  h2("2.2 Les moteurs de recherche de code (Sourcegraph Cody, GitHub Copilot)"),
  body("Sourcegraph Cody excelle sur les très grandes codebases : il indexe, il cherche, il répond à des questions précises. GitHub Copilot fait du complétion inline. Leur force : la profondeur technique et la vitesse. Leur limite : ils restent des outils de consultation. On leur demande « où est définie cette fonction ? » ou « qui appelle cette API ? », mais ils ne proposent pas de parcours structuré pour transformer le dépôt."),

  body("Cas d'usage typique : un ingénieur senior qui travaille sur une monorepo de 500k lignes a besoin de naviguer. Il ne veut pas transformer le projet, il veut juste trouver le bon fichier. ZCode adresse un besoin différent : pas seulement trouver, mais comprendre en profondeur pour pouvoir agir."),

  h2("2.3 Les agents autonomes (Devin, OpenHands)"),
  body("Devin a été présenté comme « le premier ingénieur logiciel IA ». La réalité est plus nuancée : les retours d'utilisation en production montrent des coûts élevés (500$/mois), des échecs fréquents sur des tâches complexes, et un manque de transparence. Leur force : l'autonomie totale, on donne un objectif et l'agent travaille. Leur limite : l'autonomie sans compréhension préalable est dangereuse. Devin peut casser un dépôt qu'il n'a pas vraiment compris, et l'utilisateur n'a pas de moyen simple de valider la trajectoire avant l'exécution."),

  body("Cas d'usage typique : un manager qui veut déléguer une tâche bien spécifiée (« ajoute des tests à ce module »). Mais dès que la tâche demande de comprendre le contexte global, l'approche autonome montre ses limites. C'est exactement le vide que ZCode remplit."),

  h2("2.4 Les outils de compréhension (DeepWiki, GitDiagram)"),
  body("Une catégorie émergente : des outils qui génèrent de la documentation automatique à partir d'un dépôt. DeepWiki (de Cognition Labs) crée un wiki, GitDiagram génère des diagrammes d'architecture. Leur force : ils rendent le code lisible. Leur limite : ils s'arrêtent à la description. On comprend le projet, mais on ne peut pas agir dessus depuis la même interface."),

  body("Cas d'usage typique : un nouvel arrivant dans une équipe qui veut se familiariser avec le projet avant de toucher au code. ZCode part de ce cas d'usage et l'étend : comprendre, oui, mais aussi expérimenter, maquetter, puis générer — tout dans la même plateforme."),

  new Paragraph({ spacing: { after: 200 } }),

  // ===== Section 3: The Gap =====
  h1("3. Le vide que ZCode remplit"),

  body("En croisant les 4 catégories, un motif clair émerge : aucun concurrent ne couvre le parcours complet « je ne comprends pas ce code → je veux le transformer ». Soit ils écrivent du code sans expliquer (IDE IA, agents), soit ils expliquent sans permettre d'agir (outils de compréhension). ZCode est le seul à structurer ce parcours en 5 phases explicites, où chaque phase débloque la suivante."),

  callout(
    "Le diagramme du vide",
    "IDE IA → écrivent, n'expliquent pas. Outils de compréhension → expliquent, n'écrivent pas. Agents autonomes → écrivent sans expliquer, dangereux. ZCode → explique d'abord, maquette ensuite, génère en dernier. Le parcours est la valeur, pas la vitesse d'écriture."
  ),

  new Paragraph({ spacing: { after: 200 } }),

  // ===== Section 4: Differentiators =====
  h1("4. Les 5 différentiateurs uniques de ZCode"),

  body("À partir de l'analyse du paysage, voici les 5 apports qui distinguent ZCode et qu'aucun concurrent ne réplique aujourd'hui. Chaque différentiateur est ancré dans un choix architectural précis, pas dans un slogan marketing."),

  h2("4.1 Le parcours en 5 phases — la compréhension avant l'action"),

  body("Cursor, Devin et Copilot proposent tous un chat libre : l'utilisateur pose une question, l'IA répond. ZCode force un parcours structuré : Comprendre → Déclarer l'intention → Expérimenter → Maquetter → Générer. Chaque phase produit un artefact (résumé architectural, intention déclarée, pistes chiffrées, maquette HTML, fichier MD + diff) qui alimente la suivante."),

  body("Pourquoi c'est un différentiateur : un chat libre est excellent pour un développeur qui sait ce qu'il veut. Mais pour un non-développeur ou un développeur découvrant le projet, le chat libre est écrasant — on ne sait pas quoi demander. Le parcours structuré de ZCode guide l'utilisateur pas à pas, et chaque phase a un livrable concret qui peut être validé avant de passer à la suivante."),

  bulletRich([
    new TextRun({ text: "Phase 1 — Compréhension : ", bold: true, size: 22, color: c(P.accent) }),
    new TextRun({ text: "orchestration multi-agents (OpenAI Agents SDK), un agent par partie séquencée (frontend, backend, API, config). Livrable : résumé architectural.", size: 22 }),
  ]),
  bulletRich([
    new TextRun({ text: "Phase 2 — Intention : ", bold: true, size: 22, color: c(P.accent) }),
    new TextRun({ text: "l'utilisateur déclare améliorer / dériver / adapter. Ce choix oriente toutes les phases suivantes.", size: 22 }),
  ]),
  bulletRich([
    new TextRun({ text: "Phase 3 — Expérimentation : ", bold: true, size: 22, color: c(P.accent) }),
    new TextRun({ text: "3 pistes concrètes avec badges effort/impact, estimations de blast radius (Aider dry-run).", size: 22 }),
  ]),
  bulletRich([
    new TextRun({ text: "Phase 4 — Maquette : ", bold: true, size: 22, color: c(P.accent) }),
    new TextRun({ text: "prototype à blanc HTML/CSS avant tout code fonctionnel. Validation visuelle, pas technique.", size: 22 }),
  ]),
  bulletRich([
    new TextRun({ text: "Phase 5 — Génération : ", bold: true, size: 22, color: c(P.accent) }),
    new TextRun({ text: "PROJECT_STRUCTURE.md réutilisable par n'importe quel agent + diff vert/rouge façon GitHub PR.", size: 22 }),
  ]),

  h2("4.2 L'accessibilité non-développeur — le pont vers le métier"),

  body("Tous les concurrents supposent que l'utilisateur sait lire du code. ZCode non. Le system prompt de l'orchestrateur inclut un skill « Explain Like I'm » qui adapte le niveau d'explication (débutant, dev d'un autre langage, dev confirmé). La Phase 4 (maquette) est explicitement conçue pour qu'un product manager ou un designer puisse valider une direction visuelle sans jamais ouvrir un éditeur."),

  body("Pourquoi c'est un différentiateur : le marché des non-développeurs qui veulent comprendre et transformer des dépôts est largement inexploité. Un founder non-technique qui clone un template SaaS open source veut savoir « est-ce que je peux adapter ça pour mon usage ? » — ni Cursor ni Devin ne répondent bien à cette question. ZCode oui, parce que la Phase 1 (compréhension) produit un résumé en langage naturel, et la Phase 4 (maquette) permet de valider visuellement avant tout engagement technique."),

  callout(
    "Persona cible",
    "Le founder non-technique, le PM qui évalue un template, le dev junior qui découvre un langage, le chercheur qui veut adapter un outil académique. Aucun de ces personas n'est bien servi par un IDE IA. Tous le sont par un parcours structuré qui part de la compréhension."
  ),

  h2("4.3 La séquence en parties — l'analyse multi-agents par couche"),

  body("Quand ZCode analyse un dépôt, il ne le traite pas comme un blob de fichiers. Il le découpe en couches : frontend, backend, API, config, dépendances, tests. Chaque couche est confiée à un agent dédié (via OpenAI Agents SDK), qui lit sa zone, extrait les responsabilités, et produit un résumé. Un agent coordinateur fusionne ensuite les résumés en une synthèse architecturale."),

  body("Pourquoi c'est un différentiateur : les concurrents envoient tout le dépôt en un seul prompt (avec Repomix ou similaire) et espèrent que le modèle s'y retrouve. Ça marche sur les petits dépôts, ça s'effondre sur les moyens et gros. L'approche multi-agents de ZCode, combinée à la compression de contexte de Headroom, permet d'analyser des dépôts qui dépasseraient le token budget d'une approche monolithique. Et surtout, chaque partie séquencée est traçable — l'utilisateur peut cliquer sur « backend » et voir exactement ce que l'agent a trouvé, pas un résumé global opaque."),

  h2("4.4 La maquette à blanc — valider avant de coder"),

  body("Aucun concurrent ne propose une étape de prototype visuel avant la génération de code. Cursor génère directement du code, Devin exécute directement, Continue édite directement. ZCode insère une Phase 4 explicite : génération d'une coquille HTML/CSS/Tailwind sans backend réel, avec 3 variants visuels (bois classique, néon moderne, mono minimal), preview live, et possibilité d'itérer avant tout engagement."),

  body("Pourquoi c'est un différentiateur : c'est la différence entre « l'IA a généré 42 fichiers, j'espère que c'est ce que je voulais » et « j'ai validé la direction visuelle sur une maquette, maintenant génère le code ». La maquette est un artefact de validation低成本. Elle coûte quelques secondes à générer, mais elle évite des heures de génération de code dans la mauvaise direction. C'est particulièrement précieux pour les non-développeurs, qui ne peuvent pas « lire » du code pour anticiper le résultat, mais qui peuvent lire une maquette."),

  callout(
    "Intégration Browser Use",
    "La skill « Web Preview » (powered by Browser Use) ouvre la maquette HTML dans un navigateur headless et prend des screenshots. L'utilisateur peut comparer les 3 variants côte à côte, capturer le rendu, et valider visuellement — sans jamais ouvrir un éditeur."
  ),

  h2("4.5 L'écosystème de skills scannées — sécurité et composabilité"),

  body("ZCode introduit un concept qu'aucun concurrent n'a : les skills IA sont des modules séparés, scannés avant activation par SkillSpector (NVIDIA), et chaque skill déclare quel outil open source la propulse (tree-sitter, ast-grep, Repomix, Firecrawl, etc.). L'utilisateur peut activer/désactiver des skills, en importer de nouvelles, et chaque skill est auditée pour la sécurité (prompt injection, exfiltration de données)."),

  body("Pourquoi c'est un différentiateur : les concurrents sont des boîtes noires. On ne sait pas quel prompt est envoyé, quels outils sont appelés, quels contextes sont inclus. ZCode rend ça explicite : le panneau progression montre les 19 skills disponibles, lesquelles sont actives, et quel outil les propulse. C'est à la fois une garantie de sécurité (SkillSpector bloque les skills malveillantes) et de transparence (l'utilisateur comprend ce que l'IA fait réellement)."),

  new Paragraph({ spacing: { after: 200 } }),

  // ===== Section 5: Comparison Table =====
  h1("5. Tableau comparatif synthétique"),

  body("Le tableau ci-dessous résume les différences clés entre ZCode et les 4 catégories de concurrents, sur les 5 axes qui définissent la valeur de ZCode."),

  comparisonTable(
    ["Critère", "IDE IA (Cursor)", "Agent autonome (Devin)", "Compréhension (DeepWiki)", "ZCode"],
    [
      ["Public cible", "Devs expérimentés", "Managers déléguant", "Nouveaux arrivants", "Non-devs + devs + nouveaux"],
      ["Parcours structuré", "Non (chat libre)", "Non (objectif seul)", "Partiel (wiki)", "Oui, 5 phases explicites"],
      ["Explication non-tech", "Non", "Non", "Partielle", "Oui (skill Explain Like I'm)"],
      ["Analyse multi-agents", "Non (1 prompt)", "Non (1 agent)", "Non (1 wiki)", "Oui (1 agent par couche)"],
      ["Maquette avant code", "Non", "Non", "Non", "Oui (Phase 4)"],
      ["Skills scannées", "Non (boîte noire)", "Non (boîte noire)", "Non (boîte noire)", "Oui (SkillSpector)"],
      ["Diff vert/rouge", "Partiel", "Partiel", "Non", "Oui (Phase 5)"],
      ["Coût d'entrée", "20$/mois", "500$/mois", "Gratuit", "Self-hosted ou freemium"],
    ]
  ),

  new Paragraph({ spacing: { after: 240 } }),

  // ===== Section 6: OSS Ecosystem Structuring =====
  h1("6. Structurer l'écosystème open source"),

  body("ZCode intègre 21 projets open source. Sans structure, c'est un catalogue ; avec une structure, c'est un produit. Voici comment organiser ces intégrations autour des 5 phases, pour que chaque outil ait un rôle clair et que l'ensemble soit plus que la somme des parties."),

  h2("6.1 Phase 1 — Compréhension (le socle technique)"),

  body("La Phase 1 est la plus dense en intégrations, parce que c'est là que la valeur technique se construit. L'objectif est de produire un résumé architectural qui soit à la fois précis (basé sur l'AST, pas sur le texte) et accessible (en langage naturel, adapté au niveau de l'utilisateur)."),

  comparisonTable(
    ["Outil", "Rôle", "Pourquoi critique"],
    [
      ["tree-sitter", "Parsing AST 40+ langages", "Comprendre la structure, pas juste le texte"],
      ["ast-grep", "Recherche structurelle", "Trouver des patterns sans faux positifs"],
      ["Repomix", "Packager le dépôt pour l'IA", "Pont filesystem → contexte LLM"],
      ["Headroom", "Compression de contexte", "Analyser de gros dépôts sans exploser le budget"],
      ["Firecrawl", "Doc des dépendances en Markdown", "Répondre « à quoi sert cette lib ? »"],
      ["ripgrep", "Recherche rapide", "Localiser les fichiers pertinents en première passe"],
      ["gitleaks", "Détection de secrets", "Sécurité avant tout envoi au LLM"],
      ["repowise", "Bus factor & couplage", "Identifier les zones sensibles du dépôt"],
      ["OpenAI Agents SDK", "Orchestration multi-agents", "1 agent par couche, fusion coordonnée"],
    ]
  ),

  h2("6.2 Phase 2-3 — Intention & expérimentation"),

  body("Les phases 2 et 3 sont plus légères en intégrations, parce qu'elles reposent surtout sur le LLM. Mais deux outils apportent une valeur critique : SkillSpector pour sécuriser les skills activées, et Aider pour estimer le blast radius d'une piste avant engagement."),

  comparisonTable(
    ["Outil", "Rôle", "Pourquoi critique"],
    [
      ["SkillSpector", "Scan sécurité des skills", "Bloquer prompt injection & exfiltration"],
      ["Superpowers", "Skills composable avec TDD", "Skills testables, pas juste du markdown"],
      ["Aider", "Blast radius estimation", "Chiffrer l'impact d'une piste avant de s'engager"],
    ]
  ),

  h2("6.3 Phase 4 — Maquette (validation visuelle)"),

  body("La Phase 4 est courte mais stratégique. C'est là que Browser Use et Ladle apportent une valeur unique : permettre de valider visuellement avant tout code. Aucun concurrent ne fait ça."),

  comparisonTable(
    ["Outil", "Rôle", "Pourquoi critique"],
    [
      ["Browser Use", "Screenshot de la maquette en headless", "Valider le rendu réel, pas juste le code HTML"],
      ["Ladle", "Stories de composants", "Comparer les variants côte à côte"],
      ["style-dictionary", "Export design tokens", "Tokens réutilisables dans le vrai code généré"],
    ]
  ),

  h2("6.4 Phase 5 — Génération (action contrôlée)"),

  body("La Phase 5 transforme la maquette validée en code réel. L'enjeu est la traçabilité : l'utilisateur doit pouvoir voir exactement ce qui va changer avant que ça change, et valider ou refuser chaque fichier."),

  comparisonTable(
    ["Outil", "Rôle", "Pourquoi critique"],
    [
      ["Continue.dev", "Agent de code (VS Code / JetBrains)", "Génère depuis le PROJECT_STRUCTURE.md"],
      ["gstack", "Workflow plan → test → implémente → review", "Cadrer l'agent, éviter la génération chaotique"],
      ["Vue diff native", "Vert/rouge façon GitHub PR", "Valider chaque fichier avant apply"],
    ]
  ),

  h2("6.5 Transverse — Qualité & sécurité (toutes phases)"),

  body("Certains outils ne se rattachent pas à une phase spécifique, mais sont transverses. Ils garantissent la qualité et la sécurité de l'ensemble du parcours."),

  comparisonTable(
    ["Outil", "Rôle", "Pourquoi transverse"],
    [
      ["Promptfoo", "Red teaming du system prompt", "Tester la robustesse face aux attaques"],
      ["Agent Skills format", "Standard de packaging des skills", "Interopérabilité & import de skills externes"],
    ]
  ),

  new Paragraph({ spacing: { after: 200 } }),

  // ===== Section 7: Architecture Target =====
  h1("7. Architecture cible"),

  body("Pour que l'écosystème open source fonctionne comme un produit cohérent, l'architecture doit suivre 3 principes directeurs. Ces principes ne sont pas des choix techniques anodins — ce sont les fondations qui rendent les 5 différentiateurs possibles."),

  h2("7.1 Principe 1 — L'orchestrateur est le gardien du parcours"),

  body("L'orchestrateur (le system prompt + la machine à états des phases) est le seul point d'entrée vers le LLM. Aucune intégration open source n'appelle le LLM directement. Tree-sitter parse, Repomix pack, Headroom compresse, mais c'est toujours l'orchestrateur qui assemble le contexte et décide quand appeler le modèle. Ça garantit la cohérence du parcours et la traçabilité."),

  body("Conséquence architecturale : chaque skill open source est un tool que l'orchestrateur peut appeler, pas une boîte noire qui parle au LLM en parallèle. C'est ce qui permet à SkillSpector de scanner les skills — elles sont toutes déclarées dans un format commun, inspectables."),

  h2("7.2 Principe 2 — Chaque phase produit un artefact persisté"),

  body("Chaque phase doit produire un artefact concret qui est persisté en base (Prisma) et peut être revisité. Pas juste un message dans le chat — un vrai artefact : le résumé architectural (Phase 1), l'intention déclarée (Phase 2), les pistes chiffrées (Phase 3), la maquette HTML (Phase 4), le PROJECT_STRUCTURE.md + diff (Phase 5)."),

  body("Conséquence architecturale : on peut fork une conversation à n'importe quelle phase (déjà implémenté via les checkpoints), revenir en arrière, comparer deux pistes. C'est ce qui manque à tous les concurrents : chez eux, l'historique est une longue liste de messages. Chez ZCode, c'est un graphe d'artefacts navigable."),

  h2("7.3 Principe 3 — La transparence est un feature, pas un détail"),

  body("Le panneau progression montre en temps réel quel skill est active, quel outil la propulse, quelle étape de compréhension est en cours. L'utilisateur ne subit pas l'IA, il la voit travailler. C'est l'inverse de Devin (boîte noire) ou Cursor (chat opaque)."),

  body("Conséquence architecturale : chaque appel d'outil doit émettre un événement qui met à jour le panneau progression. C'est un overhead, mais c'est ce qui rend ZCode crédible pour les non-développeurs — ils ont besoin de voir ce qui se passe pour faire confiance."),

  new Paragraph({ spacing: { after: 200 } }),

  // ===== Section 8: Roadmap =====
  h1("8. Feuille de route"),

  body("Pour transformer cette vision en produit, voici les 3 jalons à franchir, dans l'ordre. Chaque jalon débloque le suivant et apporte une valeur autonome."),

  h2("Jalon 1 — MVP crédible (déjà atteint)"),
  bullet("Interface 3-panneaux (sidebar / chat / progression)"),
  bullet("5 phases du parcours, toutes interactives"),
  bullet("Chat IA streaming avec Aion-3.0 (ou OpenAI-compatible / Ollama local)"),
  bullet("Clone GitHub depuis URL + lecture filesystem local"),
  bullet("Persistance Prisma (conversations, messages, checkpoints)"),
  bullet("Vue diff vert/rouge en Phase 5"),
  bullet("Catalogue de 19 skills + 21 intégrations OSS"),
  bullet("Command palette (⌘K) + onboarding tour"),
  bullet("Multi-provider (Aion Labs, OpenAI-compatible, Ollama)"),

  h2("Jalon 2 — Le socle multi-agents réel (prochain)"),
  bullet("Brancher réellement OpenAI Agents SDK : 1 agent par partie séquencée"),
  bullet("Intégrer Headroom pour la compression de contexte sur gros dépôts"),
  bullet("Intégrer Firecrawl pour la doc des dépendances en live"),
  bullet("Brancher Browser Use pour les screenshots de maquette en Phase 4"),
  bullet("Scanner les skills avec SkillSpector avant activation"),
  bullet("Vue arborescente du dépôt (Phase 1) avec highlight des parties séquencées"),

  h2("Jalon 3 — La différenciation produit (medium term)"),
  bullet("Skills importables (format Agent Skills) avec store communautaire"),
  bullet("Partage de conversations (lien read-only)"),
  bullet("Mode collaboratif (plusieurs utilisateurs sur une même conversation)"),
  bullet("Marketplace de maquettes (Phase 4) réutilisables"),
  bullet("Intégration Git auth (OAuth) pour push des transformations en V2"),
  bullet("Évaluation continue du system prompt avec Promptfoo"),

  new Paragraph({ spacing: { after: 200 } }),

  // ===== Section 9: Conclusion =====
  h1("9. Conclusion"),

  body("ZCode n'est pas un IDE IA de plus. C'est une plateforme de compréhension et de transformation qui s'adresse à un marché inexploité : les utilisateurs qui ne savent pas ce qu'ils veulent faire, mais qui veulent comprendre pour pouvoir décider. Les 5 différentiateurs — parcours structuré, accessibilité non-développeur, analyse multi-agents par couche, maquette à blanc, skills scannées — ne sont pas des features, ce sont des choix architecturaux qui découlent d'une thèse simple : la compréhension doit précéder l'action."),

  body("Les 21 intégrations open source ne sont pas un catalogue, c'est un écosystème structuré. Chaque outil a un rôle précis dans une phase précise, et l'orchestrateur garantit que l'ensemble reste cohérent. C'est ce qui rend ZCode défendable face aux concurrents : on ne peut pas répliquer ce parcours en juxtaposant Cursor + DeepWiki + Devin, parce que la valeur est dans l'intégration, pas dans les composants."),

  callout(
    "Le test de la question simple",
    "Si un utilisateur demande à Cursor « explique-moi ce dépôt comme si j'étais débutant, puis propose-moi 3 pistes d'amélioration avec estimation d'effort, puis maquette la piste 2 en HTML, puis génère le code avec un diff que je peux valider fichier par fichier » — Cursor ne sait pas faire. Devin essaiera mais de façon opaque et coûteuse. DeepWiki s'arrêtera à l'explication. ZCode fait exactement ça, par construction. C'est sa raison d'être."
  ),

  new Paragraph({ spacing: { after: 400 } }),

  body("La prochaine étape n'est pas d'ajouter plus de features, mais de brancher réellement les intégrations open source qui font vivre les différentiateurs : OpenAI Agents SDK pour le multi-agents, Headroom pour la compression, Browser Use pour les screenshots de maquette, SkillSpector pour la sécurité des skills. C'est le Jalon 2 — transformer un MVP crédible en un produit techniquement différenciant."),
];

// --- Document assembly ---
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          size: 22,
          color: c(P.body),
        },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [
    // Cover
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: buildCover(),
    },
    // Body
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({
              text: "ZCode — Strategic Positioning",
              size: 18, color: c(P.secondary), italics: true,
              font: { ascii: "Calibri" },
            })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "— ", size: 18, color: c(P.secondary) }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) }),
              new TextRun({ text: " —", size: 18, color: c(P.secondary) }),
            ],
          })],
        }),
      },
      children: bodyChildren,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/ZCode-Strategic-Positioning.docx", buf);
  console.log("✅ Generated /home/z/my-project/download/ZCode-Strategic-Positioning.docx");
});
