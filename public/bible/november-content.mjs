// New original question and activity banks, November 2026. Public-domain KJV references.
const rows = (t) =>
  t
    .trim()
    .split("\n")
    .map((l) => l.split("|"));
export const novemberQuestions = rows(`
2|People|Who is called the chamberlain of the city in Romans 16?|Erastus|Tychicus;Silas;Titus|Romans 16:23
2|People|Which faithful minister is sent to explain Paul's affairs in Ephesians?|Tychicus|Apollos;Barnabas;Philip|Ephesians 6:21–22
2|People|Who is called Paul's son, begotten in his bonds, in Philemon?|Onesimus|Timothy;Mark;Luke|Philemon 1:10
3|People|Which sister is greeted by name in the opening of Philemon?|Apphia|Lydia;Priscilla;Damaris|Philemon 1:2
2|People|Who fell from a third-storey window while Paul was speaking?|Eutychus|Epaphras;Silas;Jason|Acts 20:9
3|People|Which centurion treated Paul courteously on the voyage to Rome?|Julius|Cornelius;Lysias;Festus|Acts 27:1–3
3|People|Which old disciple from Cyprus hosted Paul's travelling companions?|Mnason|Agabus;Nicanor;Sopater|Acts 21:16
2|People|Which Roman deputy in Cyprus desired to hear the word of God?|Sergius Paulus|Gallio;Felix;Agrippa|Acts 13:7
3|People|Which Areopagite believed after Paul's speech in Athens?|Dionysius|Demetrius;Diotrephes;Diotrophes|Acts 17:34
2|People|Which two Hebrew midwives refused Pharaoh's order?|Shiphrah and Puah|Miriam and Deborah;Ruth and Naomi;Leah and Rachel|Exodus 1:15–17
2|People|Which craftsman was filled with wisdom for work on the tabernacle?|Bezaleel|Balaam;Boaz;Baruch|Exodus 31:1–5
3|People|Which prophetess was consulted when the book of the law was found under Josiah?|Huldah|Deborah;Miriam;Noadiah|2 Kings 22:14
3|People|Who helped rescue Jeremiah from the dungeon using cords and old cloths?|Ebed-melech|Gedaliah;Zedekiah;Pashur|Jeremiah 38:7–13
2|Places|In which city did Paul leave a cloak with Carpus?|Troas|Corinth;Athens;Rome|2 Timothy 4:13
2|Places|Which church is described as neither cold nor hot in Revelation?|Laodicea|Smyrna;Ephesus;Philadelphia|Revelation 3:14–16
2|Places|Beside which river was Ezekiel among the captives when he saw visions?|Chebar|Jordan;Nile;Jabbok|Ezekiel 1:1
2|Places|At which place did Hannah pray before Samuel was born?|Shiloh|Bethel;Hebron;Gilgal|1 Samuel 1:3–11
2|Places|Where did Sergius Paulus meet Paul and Barnabas?|Paphos|Lystra;Derbe;Iconium|Acts 13:6–7
1|Places|Where did Jesus pray while his disciples slept before his arrest?|Gethsemane|Bethany;Nazareth;Capernaum|Matthew 26:36–40
1|Places|On which island was John when he received the Revelation?|Patmos|Malta;Crete;Cyprus|Revelation 1:9
2|Books|Which book says there is a season and a time to every purpose under heaven?|Ecclesiastes|Esther;Ezra;Exodus|Ecclesiastes 3:1
2|Books|Which letter urges believers to present their bodies a living sacrifice?|Romans|Galatians;Colossians;Titus|Romans 12:1
2|Books|Which letter says to let this mind be in you which was also in Christ Jesus?|Philippians|Philemon;Ephesians;Jude|Philippians 2:5
2|Books|Which book says there remains a rest to the people of God?|Hebrews|James;Mark;Amos|Hebrews 4:9
1|Books|Which book says to ask God if you lack wisdom?|James|Joel;Jonah;Joshua|James 1:5
2|Books|Which short letter calls readers to contend for the faith once delivered to the saints?|Jude|Philemon;3 John;Titus|Jude 1:3
2|Books|Which letter ends by urging readers to grow in grace and the knowledge of Christ?|2 Peter|1 Peter;2 John;1 Timothy|2 Peter 3:18
2|Books|Which letter contains Paul's appeal concerning Onesimus?|Philemon|Philippians;Titus;Colossians|Philemon 1:10–16
1|People|Who came by night to discuss being born again with Jesus?|Nicodemus|Zacchaeus;Bartimaeus;Jairus|John 3:1–3
1|People|Which woman met Jesus beside Jacob's well?|A woman of Samaria|The queen of Sheba;Mary Magdalene;Martha|John 4:6–9
1|People|Who sat at Jesus' feet while Martha was busy serving?|Mary|Lydia;Anna;Elizabeth|Luke 10:38–42
1|People|Who wrote to Philemon about Onesimus?|Paul|Peter;James;Jude|Philemon 1:1,10
`).map(([level, category, prompt, answer, decoys, ref], i) => ({
  id: `nov26-q${i}`,
  level: Number(level),
  category,
  prompt,
  answer,
  options: [answer, ...decoys.split(";")],
  ref,
}));
export const novemberPrompts = rows(`
Ebed-melech pulling Jeremiah out with cords|Jeremiah 38:7–13
Huldah explaining the message of the law|2 Kings 22:14–20
Bezaleel crafting the tabernacle furniture|Exodus 31:1–5
Friends lowering Paul in a basket at night|Acts 9:23–25
Agabus using Paul's belt to illustrate a warning|Acts 21:10–11
Mary sitting at Jesus' feet to listen|Luke 10:38–42
Nicodemus visiting Jesus at night|John 3:1–3
The Samaritan woman leaving her waterpot|John 4:28–29
Barnabas introducing Saul to the apostles|Acts 9:26–27
Tychicus carrying news of Paul to a church|Ephesians 6:21–22
`).map(([answer, ref]) => ({ answer, ref }));
export const novemberWordSets = [
  ["WISDOM", "PRAYER", "TRUTH", "MERCY", "REST", "GROWTH"],
  ["TYCHICUS", "ONESIMUS", "ERASTUS", "HULDAH", "JULIUS", "MNASON"],
  ["WORSHIP", "SPIRIT", "FATHER", "BELIEVE", "HEAR", "ABIDE"],
  ["SOW", "ROOT", "WATER", "SEED", "FRUIT", "VINE"],
];
export const novemberStories = [
  {
    title: "Nicodemus at night",
    ref: "John 3:1–21",
    steps: [
      "Nicodemus comes to Jesus at night",
      "Jesus speaks about being born again",
      "Nicodemus asks how this can happen",
      "Jesus speaks about the Spirit and believing",
    ],
  },
  {
    title: "A conversation at the well",
    ref: "John 4:6–30",
    steps: [
      "Jesus sits beside the well",
      "A Samaritan woman comes to draw water",
      "Jesus speaks with her about living water",
      "She leaves her waterpot and tells the city",
    ],
  },
  {
    title: "Jeremiah rescued",
    ref: "Jeremiah 38:6–13",
    steps: [
      "Jeremiah is lowered into a muddy dungeon",
      "Ebed-melech appeals to the king",
      "Cloths and ropes are lowered to Jeremiah",
      "Jeremiah is lifted out of the dungeon",
    ],
  },
  {
    title: "Paul escapes Damascus",
    ref: "Acts 9:23–28",
    steps: [
      "A plot is made against Saul",
      "Disciples lower Saul in a basket at night",
      "Saul tries to join the disciples in Jerusalem",
      "Barnabas explains how Saul has preached boldly",
    ],
  },
];
