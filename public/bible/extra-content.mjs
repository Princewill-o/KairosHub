// Original questions, clues and story summaries. References invite players to
// read the biblical account. Quoted verse excerpts are public-domain KJV.
const rows = (text) =>
  text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("|"));
export const extraQuestions = rows(`
1|People|Who was the first man in Genesis?|Adam|Noah;Abraham;Jacob|Genesis 2:7
1|People|Who was the first woman in Genesis?|Eve|Sarah;Ruth;Mary|Genesis 3:20
1|People|Who was Abraham’s wife and Isaac’s mother?|Sarah|Hagar;Rachel;Leah|Genesis 21:1–3
1|People|Which son was born to Abraham and Sarah in their old age?|Isaac|Ishmael;Esau;Joseph|Genesis 21:1–5
1|People|Who was Jacob’s twin brother?|Esau|Isaac;Joseph;Benjamin|Genesis 25:24–26
1|People|Who gave Joseph a special coat?|Jacob|Pharaoh;Moses;Samuel|Genesis 37:3
1|People|Who was Moses’ brother and spoke alongside him?|Aaron|Joshua;Caleb;Gideon|Exodus 4:14–16
1|People|Who led Israel after Moses died?|Joshua|Samuel;Saul;Ezra|Joshua 1:1–2
1|People|Who was Ruth’s mother-in-law?|Naomi|Esther;Hannah;Deborah|Ruth 1:3–5
1|People|Which boy heard God calling in the night?|Samuel|David;Solomon;Joseph|1 Samuel 3:1–10
1|People|Who was the first king of Israel?|Saul|David;Solomon;Ahab|1 Samuel 10:1,24
1|People|Which king was known for his wisdom?|Solomon|Saul;Ahab;Herod|1 Kings 4:29–34
1|People|Who baptized Jesus in the Jordan?|John the Baptist|Peter;Paul;Philip|Matthew 3:13–16
1|People|Who was Jesus’ earthly mother’s husband?|Joseph|Zacharias;Simeon;Andrew|Matthew 1:18–24
1|People|Which disciple doubted until he saw the risen Jesus?|Thomas|Andrew;Philip;James|John 20:24–29
1|People|Who was Mary and Martha’s brother?|Lazarus|Zacchaeus;Nicodemus;Bartimaeus|John 11:1–3
1|People|Which tax collector left his booth to follow Jesus in Matthew 9?|Matthew|Zacchaeus;Peter;John|Matthew 9:9
1|People|Which disciple brought his brother Simon to Jesus?|Andrew|Thomas;Philip;Judas|John 1:40–42
2|People|Who hid the Israelite spies in Jericho?|Rahab|Ruth;Deborah;Miriam|Joshua 2:1–6
2|People|Which judge was also a prophetess?|Deborah|Esther;Hannah;Abigail|Judges 4:4–5
2|People|Who led three hundred men against Midian?|Gideon|Samson;Jephthah;Joshua|Judges 7:7
2|People|Who was the strong judge whose hair was cut while he slept?|Samson|Gideon;Saul;David|Judges 16:17–19
2|People|Who prayed for a child and became Samuel’s mother?|Hannah|Sarah;Rebekah;Rachel|1 Samuel 1:20,27
2|People|Which prophet challenged the prophets of Baal on Mount Carmel?|Elijah|Elisha;Isaiah;Jonah|1 Kings 18:20–39
2|People|Who received Elijah’s mantle when Elijah was taken up?|Elisha|Samuel;Jeremiah;Nathan|2 Kings 2:13–15
2|People|Who rebuilt Jerusalem’s walls with the people?|Nehemiah|Ezra;Daniel;Mordecai|Nehemiah 2:17–18; 6:15
2|People|Which queen risked approaching the king without being summoned?|Esther|Vashti;Jezebel;Athaliah|Esther 4:16; 5:1–2
2|People|Who was John the Baptist’s mother?|Elizabeth|Anna;Mary;Martha|Luke 1:13,57–60
2|People|Which elderly man held the infant Jesus in the temple?|Simeon|Zacharias;Nicodemus;Gamaliel|Luke 2:25–32
2|People|Which blind man called to Jesus near Jericho in Mark’s Gospel?|Bartimaeus|Zacchaeus;Lazarus;Nicodemus|Mark 10:46–52
2|People|Which Pharisee came to speak with Jesus at night?|Nicodemus|Gamaliel;Caiaphas;Annas|John 3:1–2
2|People|Who carried Jesus’ cross on the way to the crucifixion?|Simon of Cyrene|Simon Peter;Andrew;Philip|Mark 15:21
2|People|Who offered a tomb for Jesus’ burial?|Joseph of Arimathea|Joseph of Egypt;Nicodemus;Zacchaeus|Matthew 27:57–60
2|People|Who met the risen Jesus near the empty tomb in John 20?|Mary Magdalene|Martha;Elizabeth;Dorcas|John 20:11–18
2|People|Who travelled with Paul on the first missionary journey?|Barnabas|Silas;Timothy;Titus|Acts 13:2–4
2|People|Who was praying with Paul in the Philippian prison?|Silas|Barnabas;Stephen;Philip|Acts 16:25
3|People|Which priest brought bread and wine to Abram?|Melchizedek|Aaron;Eli;Zadok|Genesis 14:18–20
3|People|Who was sent to find a wife for Isaac in Genesis 24?|Abraham’s servant|Joseph;Esau;Lot|Genesis 24:2–4
3|People|Which woman watered the servant’s camels?|Rebekah|Rachel;Leah;Dinah|Genesis 24:18–20
3|People|Who was Moses’ sister and led the women with a timbrel?|Miriam|Deborah;Huldah;Hannah|Exodus 15:20–21
3|People|Which craftsman was filled with skill for the tabernacle work?|Bezalel|Aholiab;Hur;Caleb|Exodus 31:1–5
3|People|Who joined Joshua in encouraging Israel to trust God about the land?|Caleb|Korah;Balaam;Balak|Numbers 14:6–9
3|People|Who was Ruth’s kinsman who married her?|Boaz|Obed;Jesse;Elimelech|Ruth 4:9–13
3|People|Which prophet confronted David using a story about a little lamb?|Nathan|Gad;Samuel;Elijah|2 Samuel 12:1–7
3|People|Who was the Syrian commander told to wash in the Jordan?|Naaman|Nebuchadnezzar;Sennacherib;Darius|2 Kings 5:1,10–14
3|People|Which scribe read the law to the gathered people in Nehemiah 8?|Ezra|Nehemiah;Mordecai;Daniel|Nehemiah 8:1–3
3|People|Which prophetess spoke about Jesus to people awaiting redemption?|Anna|Elizabeth;Deborah;Huldah|Luke 2:36–38
3|People|Which couple explained God’s way more fully to Apollos?|Priscilla and Aquila|Ananias and Sapphira;Mary and Martha;Ruth and Naomi|Acts 18:24–26
3|People|Which woman was also known as Tabitha?|Dorcas|Lydia;Phoebe;Priscilla|Acts 9:36
3|People|Who welcomed Peter at Caesarea after receiving a vision?|Cornelius|Felix;Festus;Agrippa|Acts 10:1–5,24–25
3|People|Who was Timothy’s grandmother?|Lois|Eunice;Lydia;Phoebe|2 Timothy 1:5
3|People|Who was Timothy’s mother?|Eunice|Lois;Dorcas;Priscilla|2 Timothy 1:5
3|People|Who is described as a servant of the church at Cenchrea?|Phoebe|Lydia;Mary;Sapphira|Romans 16:1
3|People|Who fell from a window while Paul was speaking?|Eutychus|Tychicus;Trophimus;Onesimus|Acts 20:9
1|Places|In which garden did Adam and Eve live?|Eden|Gethsemane;Carmel;Moab|Genesis 2:8
1|Places|To which country was Joseph taken after his brothers sold him?|Egypt|Assyria;Greece;Persia|Genesis 37:28
1|Places|Which sea did Israel cross when leaving Egypt?|Red Sea|Dead Sea;Sea of Galilee;Mediterranean Sea|Exodus 14:21–22
1|Places|Where did Moses receive the stone tablets?|Mount Sinai|Mount Carmel;Mount Zion;Mount Ararat|Exodus 31:18
1|Places|Which city did David make his capital?|Jerusalem|Bethlehem;Nazareth;Jericho|2 Samuel 5:6–9
1|Places|Which town was Jesus’ childhood home?|Nazareth|Bethlehem;Bethany;Cana|Luke 2:39–40
1|Places|Which lake did Jesus calm during a storm?|Sea of Galilee|Dead Sea;Red Sea;Black Sea|Mark 4:35–41; Matthew 4:18
1|Places|Which garden was a place of Jesus’ prayer before his arrest?|Gethsemane|Eden;Gilead;Carmel|Matthew 26:36–39
1|Places|Which city was the destination of Jesus’ final entry on a donkey?|Jerusalem|Rome;Antioch;Corinth|Matthew 21:1–10
1|Places|Near which town did shepherds find the newborn Jesus?|Bethlehem|Nazareth;Samaria;Tyre|Luke 2:4–16
1|Places|To which city was young Daniel taken after leaving Judah?|Babylon|Egypt;Athens;Rome|Daniel 1:1–6
1|Places|Which river did Israel cross before reaching Jericho?|Jordan|Nile;Tigris;Euphrates|Joshua 3:14–17
2|Places|Which town was the home of Mary, Martha and Lazarus?|Bethany|Cana;Emmaus;Bethlehem|John 11:1
2|Places|Where did Jesus speak with a Samaritan woman at a well?|Sychar|Jericho;Bethsaida;Joppa|John 4:5–7
2|Places|Toward which village were two disciples walking when Jesus joined them?|Emmaus|Bethany;Cana;Nazareth|Luke 24:13–15
2|Places|On the road toward which city did Saul encounter Jesus?|Damascus|Rome;Athens;Ephesus|Acts 9:1–6
2|Places|From which town did Jonah set sail?|Joppa|Tyre;Sidon;Caesarea|Jonah 1:3
2|Places|Which city did Paul leave in a basket through the wall?|Damascus|Corinth;Philippi;Antioch|Acts 9:23–25
2|Places|Which city had a congregation that searched the Scriptures daily?|Berea|Athens;Rome;Lystra|Acts 17:10–11
2|Places|At which port did Peter stay with Simon the tanner?|Joppa|Ephesus;Troas;Sidon|Acts 9:43
2|Places|Where did Peter meet Cornelius?|Caesarea|Jerusalem;Nazareth;Cana|Acts 10:24–25
2|Places|Which city was a centre of Paul’s tentmaking work with Aquila and Priscilla?|Corinth|Athens;Tarsus;Jericho|Acts 18:1–3
2|Places|Where did Paul receive the vision of a man asking him to come to Macedonia?|Troas|Tyre;Rome;Cyrene|Acts 16:8–10
2|Places|From which region did Ruth travel with Naomi?|Moab|Galilee;Samaria;Judea|Ruth 1:1–6,22
2|Places|In which town was David born and anointed by Samuel?|Bethlehem|Hebron;Jericho;Shechem|1 Samuel 16:1–13
3|Places|Which city was Paul’s birthplace?|Tarsus|Antioch;Athens;Ephesus|Acts 22:3
3|Places|Which island was the home of Barnabas?|Cyprus|Crete;Malta;Patmos|Acts 4:36
3|Places|On which island was Titus left to appoint elders?|Crete|Cyprus;Rhodes;Malta|Titus 1:5
3|Places|From which city did Philip come, according to John 1?|Bethsaida|Bethany;Bethlehem;Berea|John 1:44
3|Places|In which city did Paul meet Lydia before her baptism?|Philippi|Thessalonica;Berea;Corinth|Acts 16:12–15
3|Places|Which town is linked with Jesus’ first sign in John’s Gospel?|Cana of Galilee|Nain;Bethsaida;Emmaus|John 2:11
3|Places|Near which city did Jesus raise a widow’s son?|Nain|Bethany;Nazareth;Sychar|Luke 7:11–15
3|Places|At which pool did Jesus heal a man who had been ill for thirty-eight years?|Bethesda|Siloam;Jordan;Kishon|John 5:2–9
3|Places|At which pool did the man born blind wash after Jesus sent him?|Siloam|Bethesda;Jordan;Cherith|John 9:7
3|Places|Which mountain was the setting of Elijah’s challenge to Baal’s prophets?|Carmel|Sinai;Ararat;Nebo|1 Kings 18:19–20
3|Places|From which mountain did Moses see the promised land before his death?|Nebo|Sinai;Carmel;Zion|Deuteronomy 34:1–4
3|Places|At which brook was Elijah fed by ravens?|Cherith|Kidron;Jabbok;Kishon|1 Kings 17:2–6
3|Places|Where was Abraham called from, according to Genesis 11?|Ur of the Chaldees|Nineveh;Babylon;Susa|Genesis 11:31
1|Books|Which book follows Genesis?|Exodus|Leviticus;Numbers;Deuteronomy|Exodus 1:1–5
1|Books|Which book records Israel’s march around Jericho?|Joshua|Judges;Ruth;Ezra|Joshua 6:1–20
1|Books|Which short book tells the story of Naomi and her daughter-in-law?|Ruth|Esther;Job;Ezra|Ruth 1:1–5
1|Books|Which book includes Daniel’s night in the lions’ den?|Daniel|Ezekiel;Isaiah;Job|Daniel 6:16–23
1|Books|Which book tells of a prophet fleeing from a call to Nineveh?|Jonah|Joel;Amos;Obadiah|Jonah 1:1–3
1|Books|Which book contains many wise sayings traditionally linked to Solomon?|Proverbs|Psalms;Job;Ruth|Proverbs 1:1
1|Books|Which Gospel places Jesus’ birth in the days of a census?|Luke|Mark;John;Matthew|Luke 2:1–7
1|Books|Which Gospel opens with Jesus’ genealogy through Abraham and David?|Matthew|Mark;Luke;John|Matthew 1:1–17
1|Books|Which Gospel begins with John the Baptist in the wilderness?|Mark|Luke;John;Matthew|Mark 1:1–4
1|Books|Which book ends the Christian Bible?|Revelation|Jude;Hebrews;Acts|Revelation 22:20–21
1|Books|Which book tells how God created light?|Genesis|Exodus;Numbers;Job|Genesis 1:3
1|Books|Which book tells of Esther approaching a Persian king?|Esther|Ruth;Ezra;Nehemiah|Esther 5:1–2
1|Books|Which Gospel records Jesus washing the disciples’ feet?|John|Mark;Matthew;Luke|John 13:1–17
1|Books|Which book includes the Good Samaritan?|Luke|Mark;Acts;John|Luke 10:25–37
2|Books|Which book is a letter to Christians in Rome?|Romans|Hebrews;Ephesians;Galatians|Romans 1:7
2|Books|Which letter contains the well-known chapter about love?|1 Corinthians|2 Corinthians;Galatians;Ephesians|1 Corinthians 13
2|Books|Which letter describes the armour of God?|Ephesians|Philippians;Colossians;Titus|Ephesians 6:10–18
2|Books|Which letter encourages believers to rejoice in the Lord?|Philippians|Philemon;Titus;Jude|Philippians 4:4
2|Books|Which letter speaks of setting your affection on things above?|Colossians|Galatians;Romans;James|Colossians 3:2
2|Books|Which letter includes instructions to pray without ceasing?|1 Thessalonians|2 Thessalonians;1 Timothy;2 Timothy|1 Thessalonians 5:17
2|Books|Which letter warns against becoming weary in doing good?|Galatians|Ephesians;Titus;Philemon|Galatians 6:9
2|Books|Which book recounts Samson and Gideon?|Judges|Joshua;Ruth;1 Samuel|Judges 6–7; 13–16
2|Books|Which book describes Nehemiah rebuilding Jerusalem’s wall?|Nehemiah|Ezra;Esther;Daniel|Nehemiah 6:15
2|Books|Which book includes Job’s conversations with his friends?|Job|Proverbs;Psalms;Ecclesiastes|Job 2:11–13
2|Books|Which book describes a time for planting and a time for harvesting?|Ecclesiastes|Proverbs;Song of Solomon;Job|Ecclesiastes 3:2
2|Books|Which book tells how the law was read after the return from exile?|Nehemiah|Esther;Daniel;Jonah|Nehemiah 8:1–8
2|Books|Which book begins by recalling Moses’ speeches before Israel entered the land?|Deuteronomy|Leviticus;Joshua;Judges|Deuteronomy 1:1–5
2|Books|Which book includes instructions about the Day of Atonement?|Leviticus|Numbers;Joshua;Ruth|Leviticus 16
3|Books|Which prophet’s book contains a vision of a throne and a call to serve?|Isaiah|Hosea;Amos;Malachi|Isaiah 6:1–8
3|Books|Which book describes a new covenant written on people’s hearts?|Jeremiah|Jonah;Nahum;Obadiah|Jeremiah 31:31–34
3|Books|Which book speaks of God’s mercies being new every morning?|Lamentations|Ecclesiastes;Job;Zephaniah|Lamentations 3:22–23
3|Books|Which book tells of a prophet marrying Gomer?|Hosea|Joel;Micah;Haggai|Hosea 1:2–3
3|Books|Which prophet speaks of God pouring out his Spirit on all flesh?|Joel|Amos;Obadiah;Nahum|Joel 2:28
3|Books|Which book calls for justice to flow like waters?|Amos|Hosea;Haggai;Malachi|Amos 5:24
3|Books|Which short prophetic book addresses Edom’s pride?|Obadiah|Jonah;Joel;Haggai|Obadiah 1:1–4
3|Books|Which prophet speaks of acting justly, loving mercy and walking humbly?|Micah|Nahum;Zephaniah;Haggai|Micah 6:8
3|Books|Which prophetic book announces judgment on Nineveh?|Nahum|Habakkuk;Haggai;Zechariah|Nahum 1:1; 3:7
3|Books|Which prophet resolves to rejoice even when the fig tree does not blossom?|Habakkuk|Zephaniah;Haggai;Malachi|Habakkuk 3:17–18
3|Books|Which prophet urged the returned exiles to rebuild God’s house?|Haggai|Obadiah;Nahum;Jonah|Haggai 1:7–8
3|Books|Which book describes a king coming humbly on a donkey?|Zechariah|Zephaniah;Haggai;Malachi|Zechariah 9:9
3|Books|Which book speaks of a messenger preparing the way before the Lord?|Malachi|Obadiah;Amos;Nahum|Malachi 3:1
3|Books|Which New Testament letter says Scripture is given by inspiration of God?|2 Timothy|1 Timothy;Titus;Philemon|2 Timothy 3:16
3|Books|Which letter describes hope as an anchor for the soul?|Hebrews|James;1 Peter;Jude|Hebrews 6:19
3|Books|Which letter encourages believers to be doers of the word?|James|Hebrews;Jude;Philemon|James 1:22
3|Books|Which letter calls believers living stones being built into a spiritual house?|1 Peter|2 Peter;1 John;Jude|1 Peter 2:5
3|Books|Which letter says God is light and in him is no darkness?|1 John|2 John;3 John;Jude|1 John 1:5
3|Books|Which short letter commends Gaius for welcoming fellow believers?|3 John|2 John;Jude;Philemon|3 John 1:1,5–8
3|Books|Which letter urges believers to contend for the faith entrusted to the saints?|Jude|James;Titus;Philemon|Jude 1:3

1|People|Who was the shepherd king’s father?|Jesse|Saul;Obed;Eli|1 Samuel 16:1,11–13
1|People|Which baby was placed in a basket among the reeds?|Moses|Samuel;Isaac;John|Exodus 2:1–10
1|People|Who was the friend of David and son of Saul?|Jonathan|Absalom;Solomon;Nathan|1 Samuel 18:1–4
1|People|Who was the mother of Jacob and Esau?|Rebekah|Sarah;Rachel;Hannah|Genesis 25:21–26
2|People|Who was the king that asked Daniel about the writing on the wall?|Belshazzar|Darius;Cyrus;Saul|Daniel 5:1,13–16
2|People|Which ruler allowed the Jewish exiles to return and rebuild the temple?|Cyrus|Pharaoh;Herod;Ahab|Ezra 1:1–4
2|People|Who told the news of the empty tomb to the apostles in Luke 24?|The women|The temple guards;The Roman governor;The fishermen from Tyre|Luke 24:9–10
2|People|Who asked Jesus how often he should forgive a brother?|Peter|Thomas;Philip;Andrew|Matthew 18:21
2|People|Who asked Jesus to teach the disciples to pray?|One of his disciples|Pontius Pilate;King Herod;The high priest|Luke 11:1
3|People|Who was the woman who wisely brought food to David and his men?|Abigail|Michal;Bathsheba;Tamar|1 Samuel 25:18–35
3|People|Which prophetess was consulted after the book of the law was found?|Huldah|Deborah;Miriam;Anna|2 Kings 22:14–20
3|People|Which king discovered the book of the law during temple repairs?|Josiah|Hezekiah;Solomon;Rehoboam|2 Kings 22:1–13
3|People|Who was the person Paul sent back to Philemon?|Onesimus|Eutychus;Tychicus;Epaphroditus|Philemon 1:10–12
3|People|Which apostles were sent to the believers in Samaria after Philip preached there?|Peter and John|Paul and Silas;Barnabas and Mark;Timothy and Titus|Acts 8:14–17
1|Places|Where did the first Christians gather when the Spirit came at Pentecost?|Jerusalem|Athens;Corinth;Alexandria|Acts 1:12–14; 2:1–5
1|Places|Which land is closely associated with Pharaoh in Exodus?|Egypt|Moab;Persia;Greece|Exodus 1:8–11
1|Places|Which town did Jonah try to reach instead of obeying God’s call?|Tarshish|Nineveh;Jericho;Bethany|Jonah 1:3
1|Places|Where did Jesus say the wise builder placed his house?|On rock|On sand;In a tree;On a boat|Matthew 7:24–25
2|Places|Which town was the home of the widow who helped Elijah?|Zarephath|Bethlehem;Jericho;Shiloh|1 Kings 17:9
2|Places|At which place did Jacob dream of a ladder reaching heaven?|Bethel|Hebron;Shechem;Beersheba|Genesis 28:12,19
2|Places|Where did Hannah bring Samuel to serve with Eli?|Shiloh|Jerusalem;Bethlehem;Nazareth|1 Samuel 1:24–28
2|Places|In which region did the Good Samaritan’s story begin, on a road toward Jericho?|Jerusalem|Galilee;Moab;Egypt|Luke 10:30
2|Places|To which country did Joseph take Mary and the infant Jesus to escape Herod?|Egypt|Syria;Persia;Greece|Matthew 2:13–14
3|Places|Where did Philip preach and see many people receive the message in Acts 8?|A city of Samaria|Cana;Nazareth;Emmaus|Acts 8:5–8
3|Places|In which city were Paul and Barnabas mistaken for gods after a healing?|Lystra|Derbe;Antioch;Tarsus|Acts 14:8–12
3|Places|Which city did Paul and Barnabas visit after leaving Lystra in Acts 14:20?|Derbe|Rome;Athens;Tyre|Acts 14:20–21
3|Places|Where was Paul held when he spoke before Felix and Festus?|Caesarea|Philippi;Ephesus;Corinth|Acts 23:33; 24:27
3|Places|Which city did Nehemiah leave to go and rebuild Jerusalem’s walls?|Shushan|Nineveh;Babylon;Ur|Nehemiah 1:1; 2:1–8
1|Books|Which book includes the story of Noah’s ark?|Genesis|Exodus;Joshua;Ruth|Genesis 6–9
1|Books|Which book tells of Moses and the burning bush?|Exodus|Genesis;Leviticus;Numbers|Exodus 3:1–6
1|Books|Which Gospel records the story of the lost son?|Luke|Mark;John;Matthew|Luke 15:11–32
1|Books|Which book recounts Paul’s missionary journeys?|Acts|Romans;Hebrews;Revelation|Acts 13–28
2|Books|Which book tells of Israel’s years in the wilderness and a census?|Numbers|Deuteronomy;Joshua;Judges|Numbers 1:1–3
2|Books|Which book records David facing Goliath?|1 Samuel|2 Samuel;1 Kings;2 Kings|1 Samuel 17
2|Books|Which book records David becoming king over all Israel?|2 Samuel|1 Samuel;1 Kings;2 Kings|2 Samuel 5:1–5
2|Books|Which book tells of Solomon building the temple?|1 Kings|2 Kings;Ezra;Nehemiah|1 Kings 6:1
2|Books|Which book tells of Naaman’s healing in the Jordan?|2 Kings|1 Kings;1 Samuel;2 Samuel|2 Kings 5:1–14
3|Books|Which letter includes instructions to appoint elders in every city on Crete?|Titus|Philemon;Jude;James|Titus 1:5
3|Books|Which letter encourages adding virtue and knowledge to faith?|2 Peter|1 Peter;1 John;Jude|2 Peter 1:5–7
3|Books|Which letter is addressed to the elect lady and her children?|2 John|3 John;Jude;Philemon|2 John 1:1
3|Books|Which letter speaks of God giving the spirit of power, love and a sound mind?|2 Timothy|1 Timothy;Titus;Philippians|2 Timothy 1:7
3|Books|Which letter urges prayer for kings and all in authority?|1 Timothy|2 Timothy;Titus;Philemon|1 Timothy 2:1–2
`).map(([level, category, prompt, answer, decoys, ref], i) => ({
  id: "expanded-q" + i,
  level: Number(level),
  category,
  prompt,
  answer,
  options: [answer, ...decoys.split(";")],
  ref,
}));

export const extraVerses = rows(`
What time I am afraid, I will trust in thee.|Psalm 56:3
Let every thing that hath breath praise the LORD. Praise ye the LORD.|Psalm 150:6
Pray without ceasing.|1 Thessalonians 5:17
Rejoice evermore.|1 Thessalonians 5:16
In every thing give thanks: for this is the will of God in Christ Jesus concerning you.|1 Thessalonians 5:18
Rejoice in the Lord alway: and again I say, Rejoice.|Philippians 4:4
Let all your things be done with charity.|1 Corinthians 16:14
Be not overcome of evil, but overcome evil with good.|Romans 12:21
We love him, because he first loved us.|1 John 4:19
He that loveth not knoweth not God; for God is love.|1 John 4:8
A soft answer turneth away wrath: but grievous words stir up anger.|Proverbs 15:1
The name of the LORD is a strong tower: the righteous runneth into it, and is safe.|Proverbs 18:10
The fear of the LORD is the beginning of knowledge: but fools despise wisdom and instruction.|Proverbs 1:7
Commit thy works unto the LORD, and thy thoughts shall be established.|Proverbs 16:3
A friend loveth at all times, and a brother is born for adversity.|Proverbs 17:17
Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.|Proverbs 27:17
This is the day which the LORD hath made; we will rejoice and be glad in it.|Psalm 118:24
The LORD is good to all: and his tender mercies are over all his works.|Psalm 145:9
O give thanks unto the LORD; for he is good: for his mercy endureth for ever.|Psalm 136:1
The LORD is nigh unto all them that call upon him, to all that call upon him in truth.|Psalm 145:18
Create in me a clean heart, O God; and renew a right spirit within me.|Psalm 51:10
The LORD is my light and my salvation; whom shall I fear?|Psalm 27:1
The heavens declare the glory of God; and the firmament sheweth his handywork.|Psalm 19:1
Blessed are the pure in heart: for they shall see God.|Matthew 5:8
Blessed are the merciful: for they shall obtain mercy.|Matthew 5:7
Ye are the light of the world. A city that is set on an hill cannot be hid.|Matthew 5:14
For with God nothing shall be impossible.|Luke 1:37
For the Son of man is come to seek and to save that which was lost.|Luke 19:10
Sanctify them through thy truth: thy word is truth.|John 17:17
And ye shall know the truth, and the truth shall make you free.|John 8:32
Let not your heart be troubled: ye believe in God, believe also in me.|John 14:1
I am the good shepherd: the good shepherd giveth his life for the sheep.|John 10:11
Jesus Christ the same yesterday, and to day, and for ever.|Hebrews 13:8
Now faith is the substance of things hoped for, the evidence of things not seen.|Hebrews 11:1
Casting all your care upon him; for he careth for you.|1 Peter 5:7
Be ye therefore followers of God, as dear children;|Ephesians 5:1
Children, obey your parents in the Lord: for this is right.|Ephesians 6:1
But be ye doers of the word, and not hearers only, deceiving your own selves.|James 1:22
For where envying and strife is, there is confusion and every evil work.|James 3:16
Every good gift and every perfect gift is from above,|James 1:17
`).map(([excerpt, ref]) => ({ excerpt, ref }));

export const extraWordSets = rows(`
ABRAHAM SARAH ISAAC JACOB ESAU JOSEPH
AARON MIRIAM MOSES JOSHUA CALEB RAHAB
SAMUEL HANNAH ELI SAUL DAVID JONATHAN
ESTHER RUTH NAOMI BOAZ OBED JESSE
ELIJAH ELISHA ISAIAH JEREMIAH EZEKIEL DANIEL
MATTHEW MARK LUKE JOHN ACTS ROMANS
HOSEA JOEL AMOS OBADIAH MICAH NAHUM
HABAKKUK ZEPHANIAH HAGGAI ZECHARIAH MALACHI JONAH
PETER ANDREW JAMES JOHN PHILIP THOMAS
PAUL SILAS LYDIA TIMOTHY TITUS BARNABAS
MARTHA MARY LAZARUS ANNA ELIZABETH SIMEON
BETHLEHEM NAZARETH JERICHO JERUSALEM CANA BETHANY
EGYPT MOAB GALILEE JUDEA SAMARIA CYPRUS
ROME ATHENS CORINTH EPHESUS PHILIPPI TARSUS
ARK DOVE OLIVE RAINBOW PROMISE COVENANT
SHEPHERD SHEEP STAFF PASTURE WATER REST
SOWER SEED SOIL ROOT HARVEST FRUIT
BREAD FISH BASKET CROWD THANKS SHARE
SCROLL LAMP LIGHT PATH WORD TRUTH
PRAYER PRAISE THANKS WORSHIP MERCY TRUST
KINDNESS GOODNESS PATIENCE GENTLE LOVE PEACE
SANDALS SHIELD HELMET BELT SWORD ARMOUR
MANGER STAR ANGEL GLORY SHEPHERDS BETHLEHEM
RESCUE FREEDOM EXODUS MANNA CLOUD PILLAR
WISDOM COUNSEL LISTEN LEARN CHOOSE HONOUR
BUILD ROCK HOUSE STORM RAIN FAITH
`).map(([line]) => line.split(" "));

export const extraPrompts = rows(`
Abraham looking up at the stars|Genesis 15:5
Rebekah watering the camels|Genesis 24:18–20
Jacob dreaming of a ladder|Genesis 28:10–15
Joseph describing Pharaoh’s dreams|Genesis 41:25–32
Joseph forgiving his brothers|Genesis 45:1–15
Baby Moses floating in a basket|Exodus 2:1–10
Miriam celebrating with a timbrel|Exodus 15:20–21
Israel gathering manna|Exodus 16:14–18
Moses holding up his hands|Exodus 17:11–12
Joshua’s spies hiding in Rahab’s house|Joshua 2:1–6
Israel crossing the Jordan|Joshua 3:14–17
Gideon’s men blowing trumpets|Judges 7:19–22
Ruth gathering grain in a field|Ruth 2:2–7
Hannah praying quietly|1 Samuel 1:10–13
Samuel hearing a voice at night|1 Samuel 3:1–10
David playing the harp|1 Samuel 16:23
David choosing smooth stones|1 Samuel 17:40
David sparing Saul in a cave|1 Samuel 24:1–7
Solomon asking for wisdom|1 Kings 3:5–12
Ravens bringing Elijah food|1 Kings 17:4–6
A widow pouring her little oil|2 Kings 4:1–7
Naaman washing in the Jordan|2 Kings 5:10–14
Nehemiah building a wall|Nehemiah 4:6
Esther approaching the king|Esther 5:1–2
Daniel praying by his window|Daniel 6:10
Three friends standing in the furnace|Daniel 3:19–27
Jonah resting under a plant|Jonah 4:6
Gabriel visiting Mary|Luke 1:26–38
Mary and Joseph looking for a place to stay|Luke 2:4–7
Shepherds hurrying to the manger|Luke 2:15–16
Simeon holding the infant Jesus|Luke 2:25–32
Jesus as a boy listening in the temple|Luke 2:46–47
John baptizing Jesus|Matthew 3:13–16
Friends lowering a man through a roof|Mark 2:1–12
Jesus turning water into wine|John 2:1–11
A woman drawing water at a well|John 4:7–15
A boy sharing loaves and fish|John 6:8–13
Peter stepping out of the boat|Matthew 14:28–31
Zacchaeus climbing a tree|Luke 19:1–6
Mary listening while Martha prepares|Luke 10:38–42
A father welcoming his returning son|Luke 15:20–24
A woman looking for a lost coin|Luke 15:8–10
A builder setting a house on rock|Matthew 7:24–25
The good shepherd carrying a sheep|Luke 15:5
Jesus welcoming little children|Mark 10:13–16
A thankful man returning after being healed|Luke 17:15–16
Jesus washing the disciples’ feet|John 13:3–5
People waving branches as Jesus arrives|John 12:12–13
The women discovering the empty tomb|Luke 24:1–9
Two friends walking to Emmaus|Luke 24:13–32
Peter and John visiting the temple|Acts 3:1–8
Philip reading Scripture with a traveller|Acts 8:30–38
Peter knocking at a door while Rhoda runs away|Acts 12:13–16
Lydia welcoming Paul and his friends|Acts 16:14–15
Paul and Silas singing in prison|Acts 16:25–26
Paul gathering sticks after a shipwreck|Acts 28:1–3
Priscilla and Aquila explaining Scripture|Acts 18:24–26
Dorcas making clothes for her neighbours|Acts 9:36–39
`).map(([answer, ref]) => ({ answer, ref }));

// Each clue set moves from broad context to a distinctive detail.
export const extraCharacters = rows(`
Adam|Genesis 2:7,15,19|My story begins in a garden.|I was given work to tend and keep it.|God formed me from the dust of the ground.
Eve|Genesis 2:21–23; 3:20|My story is in the opening chapters of Genesis.|I lived with Adam in Eden.|Adam called me the mother of all living.
Abraham|Genesis 12:1–4; 15:5|I was called to leave my home.|God told me to look at the stars.|Sarah was my wife and Isaac was our son.
Sarah|Genesis 18:9–15; 21:1–3|I travelled with Abraham.|I laughed when I heard a surprising promise.|I became Isaac’s mother in old age.
Isaac|Genesis 21:3; 24:67|My parents had waited a long time for me.|Rebekah became my wife.|My parents were Abraham and Sarah.
Rebekah|Genesis 24:15–20,67|A traveller met me beside a well.|I offered water to his camels.|I later became Isaac’s wife.
Jacob|Genesis 25:26; 28:12; 32:28|I had a twin brother.|I dreamed of a ladder reaching heaven.|My name was changed to Israel.
Esau|Genesis 25:25–34|I was a skilled hunter.|My brother was Jacob.|I sold my birthright for a meal.
Miriam|Exodus 2:4–8; 15:20–21|I watched a baby’s basket from a distance.|I later led women in celebration.|Moses and Aaron were my brothers.
Aaron|Exodus 4:14–16; 28:1|I helped my brother speak before Pharaoh.|I served as a priest.|My brother was Moses.
Joshua|Numbers 14:6–9; Joshua 1:1–2; 6|I explored the land with Caleb.|I led Israel after Moses.|Jericho’s walls fell during my leadership.
Caleb|Numbers 14:6–9; Joshua 14:6–14|I was one of twelve sent to explore the land.|Joshua and I urged the people to trust God.|In later life I asked for the hill country promised to me.
Rahab|Joshua 2:1–21; 6:22–25|My home was in Jericho.|I protected two visitors.|A scarlet cord marked my window.
Deborah|Judges 4:4–9|People came to me for judgment.|I was a prophetess.|I encouraged Barak to lead Israel.
Gideon|Judges 6:11; 7:7,20|I was threshing wheat when a messenger came.|My army became much smaller before battle.|Three hundred men carried trumpets and jars with me.
Samson|Judges 13–16|I was known for great strength.|I once carried away a city’s gates.|My hair was cut while I slept.
Hannah|1 Samuel 1:10–28|I brought a deep concern to God in prayer.|Eli watched as I prayed without speaking aloud.|I became Samuel’s mother.
Samuel|1 Samuel 3; 16:1–13|I served beside Eli as a child.|I heard God call me in the night.|I later anointed David as king.
Saul|1 Samuel 9:2; 10:1,24|I was taller than many of my people.|Samuel anointed me.|I was Israel’s first king.
Jonathan|1 Samuel 18:1–4; 20|I was a king’s son.|I formed a covenant of friendship.|My father was Saul and my friend was David.
David|1 Samuel 16:11–13; 17:40–50|I cared for sheep before I became king.|I played a stringed instrument.|I faced Goliath with a sling and stones.
Solomon|1 Kings 3:5–12; 6:1|My father was David.|I asked for an understanding heart.|I built the temple in Jerusalem.
Elijah|1 Kings 17:4–6; 18:20–39|Ravens brought me food.|I challenged Baal’s prophets on Mount Carmel.|Elisha later took up my mantle.
Elisha|2 Kings 2:13–15; 5:10–14|I followed a prophet before taking up his work.|A widow received help through a little oil.|I told Naaman to wash in the Jordan.
Nehemiah|Nehemiah 1:11; 2:17–18; 6:15|I served as a king’s cupbearer.|News of Jerusalem’s broken defences troubled me.|I helped the people rebuild its wall.
Ezra|Ezra 7:6; Nehemiah 8:1–8|I was a scribe skilled in the law.|I helped the people understand what was read.|I read the law to the gathered people in Jerusalem.
John the Baptist|Luke 1:13; Matthew 3:1–6|My parents were Elizabeth and Zacharias.|I called people to prepare the way.|I baptized Jesus in the Jordan.
Elizabeth|Luke 1:5–7,39–45,57–60|Mary visited me while we were both expecting children.|My husband was Zacharias.|My son was John the Baptist.
Simeon|Luke 2:25–32|I lived in Jerusalem and awaited God’s consolation.|The Spirit led me into the temple.|I held the infant Jesus and praised God.
Anna|Luke 2:36–38|I was a prophetess who spent much time in the temple.|I worshipped with fasting and prayer.|I spoke about the infant Jesus to people awaiting redemption.
Andrew|John 1:40–42; 6:8–9|I was a fisherman.|I pointed out a boy with loaves and fish.|I brought my brother Simon Peter to Jesus.
Thomas|John 20:24–29|I was one of the twelve disciples.|I was absent when Jesus first appeared to the others.|I said I needed to see the risen Jesus before believing.
Matthew|Matthew 9:9–13|I sat at a tax collector’s booth.|Jesus called me to follow.|I share my name with the first Gospel in the New Testament.
Mary Magdalene|Luke 8:2; John 20:1–18|I followed Jesus during his ministry.|I went to the tomb early.|The risen Jesus called me by name near the tomb.
Barnabas|Acts 4:36–37; 13:2–4|My name is connected with encouragement.|I sold land to help others.|I travelled with Paul on his first missionary journey.
Silas|Acts 15:40; 16:25–26|Paul chose me as a travelling companion.|We were put in prison in Philippi.|We prayed and sang before an earthquake opened the doors.
Lydia|Acts 16:14–15|I came from Thyatira.|I listened to Paul beside a river.|I sold purple cloth and welcomed the believers into my home.
Dorcas|Acts 9:36–41|I lived in Joppa.|I cared for neighbours and made clothes.|My other name was Tabitha.
Cornelius|Acts 10:1–5,24–25|I was a Roman centurion in Caesarea.|A vision directed me to send for Peter.|My household gathered to hear Peter’s message.
Timothy|Acts 16:1–3; 2 Timothy 1:5|I joined Paul on his journeys.|Faith had been part of my family life.|My mother was Eunice and my grandmother was Lois.
Phoebe|Romans 16:1–2|Paul commended me to the Roman believers.|I had helped many people.|I served the church at Cenchrea.
Philip|Acts 8:26–38|I met a traveller on a desert road.|He was reading from Isaiah.|I explained the good news and baptized the Ethiopian official.
`).map(([answer, ref, ...clues]) => ({ answer, ref, clues }));

export const extraStories = rows(`
Noah and the flood|Genesis 6–9|God tells Noah to build an ark.;Noah and his family enter with the animals.;Floodwaters cover the earth.;The ark comes to rest on the mountains of Ararat.;A dove returns with an olive leaf.;God gives a rainbow as a covenant sign.
Abraham’s call|Genesis 12:1–9|God calls Abram to leave his homeland.;Abram sets out with Sarai and Lot.;They arrive in Canaan.;God promises the land to Abram’s descendants.;Abram builds an altar to the Lord.
A well and a welcome|Genesis 24|Abraham sends his servant to find a wife for Isaac.;The servant prays beside a well.;Rebekah offers water for him and his camels.;The servant meets Rebekah’s family.;Rebekah agrees to travel.;Isaac receives Rebekah as his wife.
Joseph’s journey|Genesis 37; 39–41|Joseph’s brothers sell him.;Joseph is taken to Egypt.;Joseph is imprisoned.;Pharaoh has troubling dreams.;Joseph explains the dreams.;Pharaoh appoints Joseph to oversee preparations.
Joseph’s reunion|Genesis 42–45|A famine brings Joseph’s brothers to Egypt.;They bow before Joseph without recognising him.;The brothers return with Benjamin.;Judah offers to stay in Benjamin’s place.;Joseph reveals who he is.;Joseph invites his family to come to Egypt.
Moses is rescued|Exodus 2:1–10|Moses’ mother hides her baby.;She places him in a basket among the reeds.;His sister watches from a distance.;Pharaoh’s daughter finds the basket.;Moses’ mother is asked to nurse him.;The child is brought to Pharaoh’s daughter.
The burning bush|Exodus 3–4|Moses tends the flock near Horeb.;He sees a bush burning without being consumed.;God calls Moses by name.;Moses removes his sandals.;God sends Moses to bring Israel out of Egypt.;Aaron is appointed to help Moses speak.
Crossing the sea|Exodus 14|Israel sees the approaching Egyptian army.;Moses tells the people not to fear.;Moses stretches out his hand over the sea.;A path opens through the water.;Israel crosses on dry ground.;The people see that they have been delivered.
Crossing the Jordan|Joshua 3–4|Joshua prepares the people to cross.;Priests carrying the ark step into the river.;The water stops flowing at a distance.;The people cross on dry ground.;Twelve stones are taken as a memorial.;The priests come up and the water returns.
Ruth finds a home|Ruth 1–4|Ruth chooses to stay with Naomi.;They arrive in Bethlehem at harvest time.;Ruth gleans in Boaz’s field.;Boaz offers protection and provision.;Boaz resolves the family’s matter at the town gate.;Ruth and Boaz have a son named Obed.
Samuel listens|1 Samuel 3:1–10|Samuel lies down near the temple of the Lord.;He hears his name and runs to Eli.;Eli tells him that he did not call.;After repeated calls, Eli recognises what is happening.;Eli tells Samuel how to respond.;Samuel answers the Lord and listens.
Solomon asks for wisdom|1 Kings 3:5–15|Solomon goes to Gibeon.;God appears to him in a dream.;God invites Solomon to ask for something.;Solomon asks for an understanding heart.;God grants him wisdom.;Solomon wakes and returns to Jerusalem.
Elijah and the widow|1 Kings 17:8–16|God sends Elijah to Zarephath.;Elijah meets a widow gathering sticks.;She explains that only a little flour and oil remain.;Elijah asks her to make a small cake first.;The widow follows the instruction.;Flour and oil continue to supply the household.
Naaman seeks healing|2 Kings 5:1–14|A servant girl speaks of a prophet in Samaria.;Naaman travels to seek help.;Elisha sends instructions to wash in the Jordan.;Naaman is angry and turns away.;His servants encourage him to follow the simple instruction.;He washes seven times and is healed.
Esther speaks up|Esther 4–7|Mordecai tells Esther about the threat to their people.;Esther asks her people to fast.;Esther approaches the king.;She invites the king and Haman to a banquet.;At another banquet, Esther reveals her people’s danger.;Haman’s plot is exposed.
Daniel’s faithful prayer|Daniel 6|Officials persuade the king to restrict prayer.;Daniel continues praying to God.;His enemies report him.;Daniel is put in the lions’ den.;The king returns early in the morning.;Daniel answers that God sent an angel to protect him.
The wedding at Cana|John 2:1–11|Jesus and his disciples attend a wedding.;The wine runs out.;Mary tells the servants to do what Jesus says.;Jesus tells them to fill the jars with water.;Some is drawn and taken to the ruler of the feast.;The ruler tastes the wine and speaks to the bridegroom.
A man comes through the roof|Mark 2:1–12|A crowd gathers around Jesus in a house.;Four people bring a man who cannot walk.;They open the roof because they cannot get through.;They lower the man to Jesus.;Jesus tells the man to get up.;He takes his bed and walks out.
A storm is calmed|Mark 4:35–41|Jesus and the disciples set out in a boat.;A great storm rises.;The disciples wake Jesus.;Jesus speaks to the wind and sea.;The storm becomes calm.;The disciples wonder at his authority.
Bread for the crowd|John 6:1–13|A large crowd follows Jesus.;Jesus asks Philip about food.;Andrew points out a boy’s five loaves and two fish.;Jesus gives thanks and the food is distributed.;Everyone eats as much as they want.;Twelve baskets of fragments are gathered.
A welcome for Zacchaeus|Luke 19:1–10|Zacchaeus cannot see over the crowd.;He climbs a sycamore tree.;Jesus looks up and calls him.;Zacchaeus comes down and welcomes Jesus.;He promises generosity and repayment.;Jesus speaks of salvation coming to the house.
The lost son returns|Luke 15:11–24|The younger son receives his share of the property.;He leaves home and spends it.;A famine leaves him in need.;He decides to return and confess.;His father runs to welcome him.;The household celebrates his return.
The road to Emmaus|Luke 24:13–35|Two disciples walk toward Emmaus.;Jesus joins them without being recognised.;They explain what has troubled them.;Jesus explains the Scriptures.;They recognise him as he breaks bread.;They return to Jerusalem with the news.
Philip and the traveller|Acts 8:26–40|Philip is sent toward the desert road.;He sees an Ethiopian official reading Isaiah.;Philip asks if he understands what he reads.;The official invites Philip to sit with him.;Philip explains the good news of Jesus.;The traveller is baptized when they reach water.
Paul and Silas in prison|Acts 16:22–34|Paul and Silas are beaten and put in prison.;They pray and sing at midnight.;An earthquake opens the doors.;Paul stops the jailer from harming himself.;The jailer asks how to be saved.;His household hears the message and is baptized.
`).map(([title, ref, text]) => ({ title, ref, events: text.split(";") }));

export const extraHunts = rows(`
Exodus 2:3|What waterproof container held the baby Moses?|Ark of bulrushes|basket;reed basket|she took for him an ark of bulrushes
Genesis 9:13|What sign did God set in the cloud?|Bow|rainbow|I do set my bow in the cloud
Genesis 28:12|What did Jacob see reaching to heaven in his dream?|Ladder||a ladder set up on the earth, and the top of it reached to heaven
Exodus 3:5|What did Moses need to take off his feet?|Shoes|sandals|put off thy shoes from off thy feet
Exodus 16:31|What name did Israel give to the bread they gathered?|Manna||And the house of Israel called the name thereof Manna
Joshua 2:18|What colour was the cord in Rahab’s window?|Scarlet|red|this line of scarlet thread in the window
Judges 7:20|What instruments did Gideon’s companies blow?|Trumpets|trumpet|And the three companies blew the trumpets
Ruth 2:23|Which grain harvest did Ruth glean through before the wheat harvest?|Barley||unto the end of barley harvest and of wheat harvest
1 Samuel 16:23|Which instrument did David play for Saul?|Harp||David took an harp, and played with his hand
1 Kings 17:6|Which birds brought Elijah food?|Ravens|raven|And the ravens brought him bread and flesh
2 Kings 5:14|How many times did Naaman dip in the Jordan?|Seven|7|dipped himself seven times in Jordan
Nehemiah 1:11|What position did Nehemiah hold for the king?|Cupbearer|cup bearer|For I was the king’s cupbearer
Psalm 23:2|What kind of pastures are mentioned?|Green||He maketh me to lie down in green pastures
Psalm 119:105|What gives light to the psalmist’s feet?|Thy word|word;God’s word;the word|Thy word is a lamp unto my feet
Proverbs 15:1|What kind of answer turns away wrath?|Soft|soft answer|A soft answer turneth away wrath
Matthew 5:14|Jesus calls his followers the light of what?|World|the world|Ye are the light of the world
Matthew 7:24|On what does the wise man build his house?|Rock|a rock|a wise man, which built his house upon a rock
Mark 1:6|What sweet food did John eat with locusts?|Wild honey|honey|and he did eat locusts and wild honey
Mark 4:39|What did Jesus tell the sea to do?|Be still|peace be still|Peace, be still
Luke 2:7|Where was the baby Jesus laid?|Manger|a manger|and laid him in a manger
Luke 5:4|What did Jesus tell Simon to let down for a catch?|Nets|net|let down your nets for a draught
Luke 15:4|How many sheep did the man have before one was lost?|Hundred|100;one hundred|having an hundred sheep, if he lose one of them
Luke 15:8|What did the woman light while looking for her coin?|Candle|a candle;lamp|doth not light a candle, and sweep the house
John 6:9|What kind of loaves did the boy have?|Barley|barley loaves|five barley loaves, and two small fishes
John 13:5|What did Jesus begin to wash?|Feet|the disciples’ feet;disciples feet|and began to wash the disciples’ feet
John 20:15|Who did Mary initially think was speaking to her?|Gardener|the gardener|She, supposing him to be the gardener
Acts 9:36|What was Tabitha’s other name?|Dorcas||which by interpretation is called Dorcas
Acts 16:25|At what time were Paul and Silas praying and singing?|Midnight||And at midnight Paul and Silas prayed
Acts 28:3|What had Paul gathered for the fire?|Sticks|a bundle of sticks|Paul had gathered a bundle of sticks
Ephesians 6:17|What is the sword of the Spirit?|Word of God|the word of God;God’s word|the sword of the Spirit, which is the word of God
1 Thessalonians 5:17|How are believers told to pray?|Without ceasing|continually|Pray without ceasing
`).map(([ref, prompt, answer, aliases, excerpt]) => ({
  ref,
  prompt: `Find ${ref}. ${prompt}`,
  answer,
  aliases: aliases ? aliases.split(";") : [],
  excerpt,
}));

export const extraLocations = rows(`
Bethlehem|35.2|31.7|The shepherds came to this town to find the infant Jesus.|Luke 2:4–16
Nazareth|35.3|32.7|Jesus grew up here after returning with Mary and Joseph.|Luke 2:39–40
Bethany|35.26|31.77|Mary, Martha and Lazarus lived in this village near Jerusalem.|John 11:1,18
Jericho|35.45|31.87|Zacchaeus climbed a tree as Jesus passed through this city.|Luke 19:1–6
Cana|35.34|32.75|Jesus turned water into wine at a wedding in this Galilean town.|John 2:1–11
Capernaum|35.57|32.88|Jesus taught in the synagogue of this town beside the Sea of Galilee.|Mark 1:21–22
Damascus|36.3|33.5|Saul was travelling toward this city when he encountered Jesus.|Acts 9:1–6
Tarsus|34.9|36.9|Paul told a crowd he was born in this city of Cilicia.|Acts 22:3
Joppa|34.75|32.05|Peter stayed here with Simon the tanner before visiting Cornelius.|Acts 9:43; 10:5–6
Caesarea|34.9|32.5|Cornelius invited Peter to meet his household in this coastal city.|Acts 10:1,24
Antioch|36.2|36.2|Paul and Barnabas were sent out from this Syrian city.|Acts 13:1–4
Berea|22.2|40.5|People in this Macedonian city examined the Scriptures daily.|Acts 17:10–11
Corinth|22.9|37.9|Paul worked here with Aquila and Priscilla, who were also tentmakers.|Acts 18:1–3
Thessalonica|22.94|40.64|Paul taught in the synagogue of this Macedonian city for three sabbaths.|Acts 17:1–2
Troas|26.2|39.8|Paul saw a vision of a Macedonian man while staying in this port.|Acts 16:8–10
Patmos|26.56|37.3|John says he was on this island when he received his vision.|Revelation 1:9
Malta|14.4|35.9|The people of this island helped Paul and other shipwreck survivors.|Acts 28:1–2
Crete|25.1|35.2|Paul left Titus on this island to appoint elders.|Titus 1:5
Cyprus|33.4|35.1|Barnabas was from this Mediterranean island.|Acts 4:36
Smyrna|27.14|38.42|This coastal church received a message encouraging faithfulness in suffering.|Revelation 2:8–11
Pergamum|27.18|39.12|This city, called Pergamos in the KJV, was one of the seven churches.|Revelation 2:12
Sardis|28.04|38.49|The church in this city was told to wake up and strengthen what remained.|Revelation 3:1–3
Laodicea|29.1|37.83|The church in this city was described as lukewarm.|Revelation 3:14–16
`).map(([name, lon, lat, prompt, ref]) => ({
  name,
  lon: Number(lon),
  lat: Number(lat),
  prompt,
  ref,
}));

const crosswordWords = Object.fromEntries(
  rows(`
JERUSALEM|City where Solomon built the temple.|2 Chronicles 3:1
BETHLEHEM|Town where Jesus was born.|Matthew 2:1
CAPERNAUM|Town beside the lake where Jesus taught in a synagogue.|Mark 1:21
NICODEMUS|Pharisee who visited Jesus at night.|John 3:1–2
ZACCHAEUS|Tax collector who climbed a tree.|Luke 19:2–4
GALATIANS|Letter that lists the fruit of the Spirit.|Galatians 5:22–23
COLOSSIANS|Letter that urges believers to set affection on things above.|Colossians 3:2
REVELATION|Book with messages to seven churches.|Revelation 1:11
JONAH|Prophet sent to Nineveh.|Jonah 1:1–2
RUTH|Naomi’s daughter-in-law who stayed with her.|Ruth 1:16
SARAH|Abraham’s wife and Isaac’s mother.|Genesis 21:1–3
LEAH|Rachel’s sister.|Genesis 29:16
MOSES|Leader called at the burning bush.|Exodus 3:1–10
BOAZ|Man who married Ruth.|Ruth 4:13
THOMAS|Disciple who wanted to see the risen Jesus.|John 20:24–29
LYDIA|Seller of purple cloth who welcomed Paul.|Acts 16:14–15
HANNAH|Samuel’s mother.|1 Samuel 1:20
CORNELIUS|Centurion who invited Peter to Caesarea.|Acts 10:1–5
PETER|Fisherman whose brother was Andrew.|Matthew 4:18
AMOS|Prophet who calls for justice to flow like waters.|Amos 5:24
NOAH|Man instructed to build an ark.|Genesis 6:13–14
CALEB|Faithful spy who stood beside Joshua.|Numbers 14:6–9
DANIEL|Man who continued praying despite the royal ban.|Daniel 6:10
MARY|Sister of Martha and Lazarus.|John 11:1
SAMUEL|Boy who heard God calling at night.|1 Samuel 3:1–10
ZEPHANIAH|Prophet whose book speaks of God rejoicing over his people.|Zephaniah 3:17
ESTHER|Queen who spoke up for her people.|Esther 4:16
GIDEON|Judge who led three hundred men.|Judges 7:7
TIMOTHY|Paul’s companion whose mother was Eunice.|2 Timothy 1:5
AARON|Moses’ brother.|Exodus 4:14
SILAS|Paul’s companion in the Philippian prison.|Acts 16:25
LUKE|Beloved physician named in Colossians.|Colossians 4:14
ISAAC|Son of Abraham and Sarah.|Genesis 21:3
VASHTI|Queen who refused the king’s summons in Esther 1.|Esther 1:10–12
OBADIAH|Prophetic book addressing Edom.|Obadiah 1:1
JOSHUA|Leader who followed Moses.|Joshua 1:1–2
REBEKAH|Woman who watered a traveller’s camels.|Genesis 24:18–20
SAUL|Israel’s first king.|1 Samuel 10:24
LAZARUS|Brother of Mary and Martha.|John 11:1
MATTHEW|Tax collector called to follow Jesus.|Matthew 9:9
BARNABAS|Paul’s companion on his first missionary journey.|Acts 13:2–4
TITUS|Paul’s coworker left on Crete.|Titus 1:5
`).map(([word, clue, ref]) => [word, { word, clue, ref }]),
);
export const extraCrosswords = [
  ["BETHLEHEM", "BOAZ", "THOMAS", "LYDIA", "HANNAH", "MOSES"],
  ["CAPERNAUM", "CORNELIUS", "PETER", "RUTH", "AMOS", "MOSES"],
  ["NICODEMUS", "NOAH", "CALEB", "DANIEL", "MARY", "SAMUEL"],
  ["ZACCHAEUS", "ZEPHANIAH", "CALEB", "HANNAH", "ESTHER", "SARAH"],
  ["GALATIANS", "GIDEON", "LYDIA", "TIMOTHY", "AARON", "SILAS"],
  ["COLOSSIANS", "CALEB", "LUKE", "SAMUEL", "ISAAC", "NOAH"],
  ["REVELATION", "RUTH", "VASHTI", "LEAH", "TIMOTHY", "OBADIAH"],
  ["JERUSALEM", "JOSHUA", "REBEKAH", "SAUL", "LAZARUS", "MATTHEW"],
  ["BETHLEHEM", "BARNABAS", "TITUS", "LEAH", "HANNAH", "MATTHEW"],
  ["NICODEMUS", "NOAH", "CORNELIUS", "DANIEL", "MOSES", "SARAH"],
  ["GALATIANS", "GIDEON", "LEAH", "THOMAS", "AMOS", "SAMUEL"],
].map(([spine, ...down]) => [
  {
    ...crosswordWords[spine],
    row: 0,
    col: 0,
    dir: "across",
    number: 1,
  },
  ...down.map((word, i) => ({
    ...crosswordWords[word],
    row: 0,
    col: i * 2,
    dir: "down",
    number: i === 0 ? 1 : i + 1,
  })),
]);

export const extraEscapeRooms = [
  ...extraQuestions
    .filter((q) => q.level === 1)
    .slice(0, 24)
    .map((q, i) => ({
      title: [
        "The atlas cabinet",
        "The scroll chest",
        "The story shelf",
        "The lantern room",
        "The hidden drawer",
        "The keeper’s desk",
      ][i % 6],
      prompt: `A clue is tucked beside the lock: ${q.prompt}`,
      answer: q.answer,
      options: q.options,
      ref: q.ref,
    })),
  ...extraCharacters.slice(0, 12).map((c, i) => ({
    title: "The scrambled name tile " + (i + 1),
    prompt: `Unscramble this Bible name: ${c.answer
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .split("")
      .reverse()
      .join(" ")}`,
    answer: c.answer,
    ref: c.ref,
  })),
];
export const extraNames = [
  ...new Set(
    extraCharacters
      .map((c) => c.answer)
      .concat([
        "Abigail",
        "Jesse",
        "Obed",
        "Rachel",
        "Leah",
        "Naaman",
        "Naomi",
        "Boaz",
        "Rebekah",
        "Isaac",
        "Esau",
        "Aquila",
        "Priscilla",
        "Zacchaeus",
        "Nicodemus",
        "Lazarus",
        "Eunice",
        "Lois",
        "Titus",
      ]),
  ),
];
