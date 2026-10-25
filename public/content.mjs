export const games = [
  {
    id: "verse",
    title: "Verse Rebuild",
    tag: "REMEMBER",
    goal: "Piece together words that stay with you.",
    icon: "Books",
    color: "peach",
    ref: "Psalm 23:1",
    reflect: "Which words could you carry into a difficult moment today?",
  },
  {
    id: "prayer",
    title: "Prayer Compass",
    tag: "PRAY",
    goal: "Find your way into a thoughtful prayer.",
    icon: "Wheel",
    color: "lilac",
    ref: "Matthew 6:9–13",
    reflect:
      "Who could you pray for using adoration, confession, thanksgiving, and supplication?",
  },
  {
    id: "sandals",
    title: "Walk in Their Sandals",
    tag: "EXPLORE",
    goal: "Step into a story. Discover the choices.",
    icon: "boots",
    color: "sage",
    ref: "Luke 22:54–62",
    reflect: "Where do you feel the tension between fear and faith?",
  },
  {
    id: "parable",
    title: "Parable Detective",
    tag: "DISCOVER",
    goal: "Gather the clues. Find the deeper meaning.",
    icon: "Chest",
    color: "sand",
    ref: "Matthew 13:1–23",
    reflect: "What helps God’s word take root in your life?",
  },
  {
    id: "timeline",
    title: "Covenant Timeline",
    tag: "CONNECT",
    goal: "See how the little stories form one big story.",
    icon: "Flag",
    color: "blue",
    ref: "Genesis 1 – Acts 2",
    reflect:
      "What do these connected events teach you about God’s faithfulness?",
  },
  {
    id: "armor",
    title: "Armor Up",
    tag: "PRACTISE",
    goal: "Meet everyday struggles with spiritual strength.",
    icon: "strong",
    color: "rose",
    ref: "Ephesians 6:10–18",
    reflect: "Which part of the armor would help you face this week?",
  },
  {
    id: "wisdom",
    title: "Wisdom or World",
    tag: "DISCERN",
    goal: "Look beyond a saying that sounds good.",
    icon: "Crown",
    color: "sand",
    ref: "Proverbs 3:5–6",
    reflect: "How could you check a familiar saying against Scripture?",
  },
  {
    id: "journey",
    title: "Trace the Journey",
    tag: "TRAVEL",
    goal: "Follow the places where faith took root.",
    icon: "Globe",
    color: "blue",
    ref: "Acts 13–14",
    reflect: "Who welcomed the good news along this journey?",
  },
  {
    id: "garden",
    title: "Fruit Garden",
    tag: "GROW",
    goal: "Water small acts of goodness into bloom.",
    icon: "Plant",
    color: "sage",
    ref: "Galatians 5:22–23",
    reflect: "Which fruit could you practise in one small action today?",
  },
  {
    id: "psalms",
    title: "Psalms Fill-the-Blank",
    tag: "REMEMBER",
    goal: "Find the missing words. Keep the rhythm.",
    icon: "Papyrus",
    color: "lilac",
    ref: "Psalm 23:1",
    reflect: "What does this psalm invite you to trust God with?",
  },
];
export const verses = [
  {
    id: "psalm23",
    reference: "Psalm 23:1",
    translation: "KJV",
    text: "The LORD is my shepherd; I shall not want.",
    themes: ["trust", "care"],
    difficulty: 1,
    keywords: ["shepherd", "want"],
  },
  {
    id: "psalm119",
    reference: "Psalm 119:105",
    translation: "KJV",
    text: "Thy word is a lamp unto my feet, and a light unto my path.",
    themes: ["guidance"],
    difficulty: 2,
    keywords: ["word", "lamp", "light", "path"],
  },
  {
    id: "psalm100",
    reference: "Psalm 100:2",
    translation: "KJV",
    text: "Serve the LORD with gladness: come before his presence with singing.",
    themes: ["worship"],
    difficulty: 2,
    keywords: ["serve", "gladness", "singing"],
  },
];
export const prayers = [
  {
    scenario:
      "Your friend has lost their job and is worried about paying the bills.",
    lines: [
      ["Adoration", "God, you are faithful even when circumstances change."],
      [
        "Confession",
        "Forgive me for the times I have worried more than I have trusted you.",
      ],
      [
        "Thanksgiving",
        "Thank you for the ways you have provided for us before.",
      ],
      [
        "Supplication",
        "Please provide work for my friend and give them peace.",
      ],
    ],
  },
  {
    scenario: "You are about to start at a new school and feel nervous.",
    lines: [
      ["Adoration", "God, you are with us wherever we go."],
      [
        "Confession",
        "Forgive me for judging people before I get to know them.",
      ],
      [
        "Thanksgiving",
        "Thank you for this opportunity to learn and make friends.",
      ],
      [
        "Supplication",
        "Help me welcome others and be brave enough to ask for help.",
      ],
    ],
  },
  {
    scenario: "You argued with someone you love and want to make things right.",
    lines: [
      ["Adoration", "God, you are patient and full of mercy."],
      ["Confession", "I am sorry for the hurtful words I spoke."],
      ["Thanksgiving", "Thank you for giving us the chance to begin again."],
      ["Supplication", "Please help me listen, apologise, and seek peace."],
    ],
  },
];
export const arcs = [
  {
    id: "peter",
    name: "Peter",
    title: "Courage in the courtyard",
    ref: "Luke 22:54–62",
    scenes: [
      {
        setting: "A courtyard. A fire. A fearful night.",
        text: "Jesus has been arrested. Peter follows at a distance and sits by a fire. A servant girl looks at him: “This man was also with him.” What happens next?",
        choices: [
          "Peter denies knowing Jesus.",
          "Peter openly says he is a disciple.",
        ],
        canon: 0,
        reference: "Luke 22:57",
        outcome:
          "Peter denies knowing Jesus. The story shows how fear can overwhelm even a devoted disciple.",
        divergence: "Bold Confession Timeline",
        alternate:
          "Imagine Peter admitting his friendship with Jesus. The people around the fire might question him further. This is an imagined possibility, not the biblical account.",
      },
      {
        setting: "The rooster crows.",
        text: "Peter has denied Jesus three times. The Lord turns and looks at him. Peter remembers what Jesus had said. What does Peter do?",
        choices: [
          "He laughs and returns to the fire.",
          "He goes out and weeps bitterly.",
        ],
        canon: 1,
        reference: "Luke 22:60–62",
        outcome:
          "Peter goes outside and weeps bitterly. His failure is not the end of his story; John 21:15–19 later tells of his restoration.",
        divergence: "Unmoved Heart Timeline",
        alternate:
          "Imagine Peter ignoring the moment. He might avoid facing the hurt, but the story in Luke describes honest grief instead.",
      },
    ],
  },
  {
    id: "jonah",
    name: "Jonah",
    title: "The road away from Nineveh",
    ref: "Jonah 1–3",
    scenes: [
      {
        setting: "A call to go. A ship going the other way.",
        text: "God tells Jonah to go to Nineveh. Which direction does Jonah take at first?",
        choices: [
          "He sails toward Tarshish to flee.",
          "He heads straight to Nineveh.",
        ],
        canon: 0,
        reference: "Jonah 1:1–3",
        outcome:
          "Jonah boards a ship bound for Tarshish, fleeing from the task God gave him.",
        divergence: "Immediate Obedience Timeline",
        alternate:
          "Imagine Jonah going directly to Nineveh. The journey might begin very differently, but Scripture first tells of his flight and the storm.",
      },
      {
        setting: "A second beginning.",
        text: "After the great fish, God calls Jonah again. What does he do this time?",
        choices: [
          "He buys another ticket to Tarshish.",
          "He goes to Nineveh and proclaims God’s message.",
        ],
        canon: 1,
        reference: "Jonah 3:1–5",
        outcome:
          "Jonah goes to Nineveh. The people believe God and respond with fasting and repentance.",
        divergence: "Another Escape Timeline",
        alternate:
          "Imagine Jonah running again. This possibility highlights the significance of his actual decision to obey the second call.",
      },
    ],
  },
  {
    id: "prodigal",
    name: "The younger son",
    title: "The long way home",
    ref: "Luke 15:11–32",
    scenes: [
      {
        setting: "A home left behind.",
        text: "In Jesus’ parable, a younger son asks for his inheritance. What does he do with it?",
        choices: [
          "He stays home and saves it.",
          "He leaves for a distant country and wastes it.",
        ],
        canon: 1,
        reference: "Luke 15:11–16",
        outcome:
          "The son leaves and wastes his wealth. A famine comes, and he finds himself hungry and far from home.",
        divergence: "Staying Home Timeline",
        alternate:
          "Imagine the son staying home. That is a different story; Jesus uses his departure and need to reveal the father’s mercy.",
      },
      {
        setting: "A father watching the road.",
        text: "The son returns, ready to confess. How does his father respond?",
        choices: [
          "He runs to embrace and welcome him.",
          "He closes the door until the debt is paid.",
        ],
        canon: 0,
        reference: "Luke 15:20–24",
        outcome:
          "His father runs to him, embraces him, and celebrates his return. The parable pictures extraordinary mercy.",
        divergence: "A Closed Door Timeline",
        alternate:
          "Imagine the father refusing him. That imagined response helps us notice how surprising the welcome in Jesus’ actual parable is.",
      },
    ],
  },
  {
    id: "david",
    name: "David",
    title: "When a king is confronted",
    ref: "2 Samuel 11–12",
    scenes: [
      {
        setting: "The misuse of power.",
        text: "David takes Bathsheba, another man’s wife, and arranges for her husband Uriah to be killed. Nathan confronts him through a story. Does David recognise his wrong?",
        choices: [
          "He admits that he has sinned against the LORD.",
          "He insists that a king can do whatever he wants.",
        ],
        canon: 0,
        reference: "2 Samuel 12:1–13",
        outcome:
          "David admits his sin. Nathan speaks of forgiveness, yet the harm and consequences remain. The account does not excuse abuse of power.",
        divergence: "Refusing Accountability Timeline",
        alternate:
          "Imagine David refusing correction. This invented branch contrasts with the confession recorded in Scripture.",
      },
    ],
  },
  {
    id: "esther",
    name: "Esther",
    title: "For such a time as this",
    ref: "Esther 4–5",
    scenes: [
      {
        setting: "A dangerous invitation to courage.",
        text: "Esther hears that her people are in danger. Approaching the king uninvited carries a risk. What does she ask her community to do?",
        choices: [
          "Keep silent and forget the danger.",
          "Fast for three days as she prepares to approach the king.",
        ],
        canon: 1,
        reference: "Esther 4:15–17",
        outcome:
          "Esther asks the Jews in Susa to fast with her. She resolves to go to the king despite the risk.",
        divergence: "Choosing Silence Timeline",
        alternate:
          "Imagine Esther choosing silence. The imagined branch underlines the courage of the choice the text actually records.",
      },
      {
        setting: "In the royal court.",
        text: "Esther enters the inner court. What happens when the king sees her?",
        choices: [
          "He holds out his golden sceptre.",
          "He immediately orders her away.",
        ],
        canon: 0,
        reference: "Esther 5:1–3",
        outcome:
          "The king extends his golden sceptre and asks what she requests. Esther begins to act on behalf of her people.",
        divergence: "The Refused Audience Timeline",
        alternate:
          "Imagine the audience being refused. This is not what Esther 5 records; the actual welcome creates a path for her appeal.",
      },
    ],
  },
];
export const parables = [
  {
    title: "The Sower",
    reference: "Matthew 13:1–23",
    panels: [
      {
        title: "Beside the path",
        text: "A sower scatters seed. Birds eat the seed that falls on the path.",
        clue: "Seed taken away",
        meaning:
          "The word is heard without understanding and is snatched away.",
        icon: "Plant",
      },
      {
        title: "Shallow ground",
        text: "Seed springs up quickly, but without deep roots it withers in the sun.",
        clue: "Roots too shallow",
        meaning: "Joyful hearing without roots does not endure trouble.",
        icon: "Plant",
      },
      {
        title: "Among the thorns",
        text: "Thorns grow around the young plants and choke them.",
        clue: "Crowded by thorns",
        meaning: "The cares of life and lure of wealth choke the word.",
        icon: "Plant",
      },
      {
        title: "Good soil",
        text: "Seed in good soil grows and produces a harvest.",
        clue: "A lasting harvest",
        meaning: "Hearing and understanding the word bears fruit.",
        icon: "Plant",
      },
    ],
    options: [
      "The best methods for running a farm.",
      "Different responses to hearing God’s word.",
      "A rule against planting near a path.",
    ],
    correct: 1,
  },
  {
    title: "The Good Samaritan",
    reference: "Luke 10:25–37",
    panels: [
      {
        title: "A traveller in need",
        text: "A man is attacked and left wounded beside the road.",
        clue: "A neighbour in need",
        meaning: "The need in front of us calls for a response.",
        icon: "boots",
      },
      {
        title: "Passing by",
        text: "A priest and a Levite each see him and pass on the other side.",
        clue: "Seeing without helping",
        meaning: "A religious title alone is not the same as showing mercy.",
        icon: "Players",
      },
      {
        title: "Costly kindness",
        text: "A Samaritan cares for his wounds and pays for his lodging.",
        clue: "Mercy in action",
        meaning:
          "The unexpected helper becomes a neighbour through compassion.",
        icon: "Heart",
      },
    ],
    options: [
      "Show mercy and be a neighbour, even across social divisions.",
      "Help only people from your own community.",
      "Avoid every unfamiliar road.",
    ],
    correct: 0,
  },
];
export const timeline = [
  {
    title: "Creation",
    reference: "Genesis 1",
    icon: "Globe",
    bridge:
      "God creates a good world, and humanity is called to live in it with him.",
  },
  {
    title: "The Fall",
    reference: "Genesis 3",
    icon: "Plant",
    bridge:
      "Human disobedience brings brokenness, but God’s purposes continue.",
  },
  {
    title: "The Flood",
    reference: "Genesis 6–9",
    icon: "Globe",
    bridge:
      "After the flood, God establishes a covenant with Noah and all living creatures.",
  },
  {
    title: "Abraham’s Call",
    reference: "Genesis 12:1–3",
    icon: "boots",
    bridge: "God promises to bless the nations through Abraham’s family.",
  },
  {
    title: "The Exodus",
    reference: "Exodus 12–14",
    icon: "Flag",
    bridge: "God rescues Israel from Egypt and forms a covenant people.",
  },
  {
    title: "Exile",
    reference: "2 Kings 25",
    icon: "house",
    bridge:
      "Judah goes into exile; the prophets also speak of restoration and hope.",
  },
  {
    title: "Jesus Christ",
    reference: "Luke 24:1–8",
    icon: "Crown",
    bridge:
      "Jesus’ death and resurrection stand at the heart of the good news.",
  },
  {
    title: "The Church",
    reference: "Acts 2",
    icon: "Players",
    bridge:
      "The Spirit empowers Jesus’ followers to bear witness among the nations.",
  },
];
export const armor = [
  {
    id: "truth",
    name: "Belt of Truth",
    symbol: "◇",
    scenario:
      "You are tempted to repeat a rumour without checking whether it is true.",
    reference: "Ephesians 6:14",
    explanation: "Truth invites honesty and resistance to deception.",
  },
  {
    id: "righteousness",
    name: "Breastplate of Righteousness",
    symbol: "▣",
    scenario:
      "You could cheat on a test without getting caught. You want to choose what is right.",
    reference: "Ephesians 6:14",
    explanation:
      "Righteousness calls us to live rightly, including when no one is watching.",
  },
  {
    id: "peace",
    name: "Shoes of Peace",
    symbol: "/",
    scenario:
      "Two friends are arguing. You want to bring a peaceful word instead of adding fuel.",
    reference: "Ephesians 6:15",
    explanation:
      "Readiness from the gospel of peace shapes how we approach others.",
  },
  {
    id: "faith",
    name: "Shield of Faith",
    symbol: "⬡",
    scenario:
      "A difficult week makes you doubt God’s care. You need to trust his faithfulness.",
    reference: "Ephesians 6:16",
    explanation:
      "Faith is pictured as a shield that extinguishes flaming arrows.",
  },
  {
    id: "salvation",
    name: "Helmet of Salvation",
    symbol: "⌒",
    scenario:
      "You feel defined by your past failures and need to remember the hope of being saved.",
    reference: "Ephesians 6:17",
    explanation:
      "Salvation anchors hope in what God has done, rather than in our worst moment.",
  },
  {
    id: "spirit",
    name: "Sword of the Spirit",
    symbol: "†",
    scenario:
      "A tempting idea sounds convincing. You need God’s word to help you answer it.",
    reference: "Ephesians 6:17",
    explanation: "Paul identifies the sword of the Spirit as the word of God.",
  },
];
export const wisdom = [
  {
    text: "Trust in the LORD with all thine heart.",
    biblical: true,
    reference: "Proverbs 3:5 (KJV)",
    explanation:
      "This proverb calls us to trust God rather than rely only on our understanding.",
  },
  {
    text: "God helps those who help themselves.",
    biblical: false,
    reference: "Psalm 46:1",
    explanation:
      "This familiar saying is not a Bible verse. Scripture describes God as a refuge and help in trouble.",
  },
  {
    text: "A soft answer turneth away wrath.",
    biblical: true,
    reference: "Proverbs 15:1 (KJV)",
    explanation: "A gentle response can interrupt the escalation of anger.",
  },
  {
    text: "Follow your heart; it can never lead you wrong.",
    biblical: false,
    reference: "Proverbs 3:5–6",
    explanation:
      "Scripture asks us to seek God’s direction; our impulses are not always wise.",
  },
  {
    text: "It is more blessed to give than to receive.",
    biblical: true,
    reference: "Acts 20:35 (KJV)",
    explanation:
      "Paul recalls Jesus’ words while encouraging care for the weak.",
  },
  {
    text: "Your worth is measured by how much you own.",
    biblical: false,
    reference: "Luke 12:15",
    explanation:
      "Jesus warns that life does not consist in the abundance of possessions.",
  },
];
export const cities = {
  Antioch: [82, 24],
  Cyprus: [66, 53],
  Perga: [41, 30],
  "Pisidian Antioch": [39, 10],
  Lystra: [51, 22],
  Rome: [7, 9],
  Damascus: [88, 63],
  Jerusalem: [83, 87],
};
export const journey = [
  {
    from: "Antioch",
    to: "Cyprus",
    options: ["Cyprus", "Rome", "Damascus"],
    text: "Sent out from Antioch, Paul and Barnabas sail from Seleucia to an island. Where do they go?",
    reference: "Acts 13:1–5",
    scene:
      "They arrive at Salamis on Cyprus and proclaim the word of God in the synagogues.",
    hint: "Look for the island south of the coast of Asia Minor.",
  },
  {
    from: "Cyprus",
    to: "Perga",
    options: ["Jerusalem", "Perga", "Rome"],
    text: "They sail from Paphos to Pamphylia on the southern coast of Asia Minor. Which city do they reach?",
    reference: "Acts 13:13",
    scene:
      "The party reaches Perga. John leaves them there and returns to Jerusalem.",
    hint: "The next stop is northwest of Cyprus, on the mainland.",
  },
  {
    from: "Perga",
    to: "Pisidian Antioch",
    options: ["Damascus", "Pisidian Antioch", "Cyprus"],
    text: "From Perga, they travel inland and speak in a synagogue on the Sabbath. Which Antioch is this?",
    reference: "Acts 13:14–16",
    scene:
      "At Antioch in Pisidia, Paul is invited to speak and tells the story of God’s work through Israel and Jesus.",
    hint: "This Antioch is inland in Asia Minor, not their original sending city.",
  },
  {
    from: "Pisidian Antioch",
    to: "Lystra",
    options: ["Lystra", "Rome", "Jerusalem"],
    text: "After travelling through Iconium, they flee to the cities of Lycaonia. In which city does Paul heal a man unable to walk?",
    reference: "Acts 14:1–10",
    scene:
      "At Lystra, a man who has never walked hears Paul and is healed. The journey continues through both welcome and opposition.",
    hint: "Look just southeast of Pisidian Antioch.",
  },
];
export const fruits = [
  [
    "love",
    "Love",
    "A classmate feels unwanted. You choose to include them and care about their needs.",
    "Love seeks another person’s good.",
  ],
  [
    "joy",
    "Joy",
    "You notice reasons to be glad in God’s goodness, even during a disappointing day.",
    "Joy can be rooted in God even when circumstances are difficult.",
  ],
  [
    "peace",
    "Peace",
    "You bring a calm presence to a tense conversation instead of escalating it.",
    "Peace makes room for reconciliation and calm.",
  ],
  [
    "patience",
    "Patience",
    "Your younger sibling takes a long time to learn something. You keep helping without rushing them.",
    "Patience gives others time and bears with delay.",
  ],
  [
    "kindness",
    "Kindness",
    "A neighbour is unwell. You bring a meal and a caring note.",
    "Kindness expresses care through considerate actions.",
  ],
  [
    "goodness",
    "Goodness",
    "You find a lost wallet and return it with everything still inside.",
    "Goodness puts integrity into action.",
  ],
  [
    "faithfulness",
    "Faithfulness",
    "You promised to help every week, and you keep showing up when it is inconvenient.",
    "Faithfulness is dependable commitment.",
  ],
  [
    "gentleness",
    "Gentleness",
    "Someone makes a mistake. You correct them softly without humiliating them.",
    "Gentleness uses strength with care rather than harshness.",
  ],
  [
    "self_control",
    "Self-Control",
    "You feel a flash of anger and pause before saying something hurtful.",
    "Self-control governs an immediate impulse.",
  ],
];

import {extraVerses,extraPrayers,extraWisdom,extraParables} from './extra-content.mjs';
verses.push(...extraVerses.filter(v=>!verses.some(existing=>existing.reference===v.reference)));prayers.push(...extraPrayers);wisdom.push(...extraWisdom);parables.push(...extraParables);
games.push(
{id:'shepherd',title:'Shepherd’s Meadow',tag:'2D ADVENTURE',goal:'Explore the meadow. Bring every lost sheep home.',icon:'Players',color:'sage',ref:'Luke 15:3–7',reflect:'What does seeking one lost sheep tell you about care for each person?'},
{id:'scrolls',title:'Scroll Quest',tag:'2D ADVENTURE',goal:'Find hidden scrolls and solve fresh Bible questions.',icon:'Papyrus',color:'sand',ref:'Psalm 119:105',reflect:'Which discovery from your journey would you like to explore in Scripture?'}
);
