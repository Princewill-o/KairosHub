// Original questions and summaries. Scripture quotations below are labelled KJV.
export const bibleGames=[
 ['trivia','Bible Trivia','Say the answer','Type your answer. How much do you remember?','Knowledge','Books','#dacbf5'],
 ['quiz','Bible Quiz','Climb three levels','From familiar stories to a deeper challenge.','Knowledge','Star','#ffe4a6'],
 ['word-search','Bible Word Search','Find the hidden words','Trace a word, or tap its first and last letters.','Puzzles','Books','#c2e7d5'],
 ['crossword','Bible Crossword','Follow the clues','Six intersecting answers, one connected puzzle.','Puzzles','Books','#cbdcf8'],
 ['charades','Bible Charades','Act it out','Pass the phone. Act silently. Let your team guess.','Together','Star','#f7c9c0'],
 ['memory','Bible Memory Game','Find the pairs','Turn over the cards and train your memory.','Puzzles','Star','#dacbf5'],
 ['verse','Bible Verse Guessing','Name that verse','Recognise a passage from a short Scripture excerpt.','Knowledge','Books','#cbdcf8'],
 ['jeopardy','Bible Jeopardy','Choose your challenge','Three categories. Nine clues. Build your score.','Knowledge','Star','#ffe4a6'],
 ['pictionary','Bible Pictionary','Draw the story','A sketch pad, a secret prompt and your imagination.','Together','Books','#c2e7d5'],
 ['hangman','Bible Hangman','Reveal the word','Guess letters before your six chances run out.','Puzzles','Books','#f7c9c0'],
 ['bingo','Bible Bingo','Make a line','Read a clue and mark its answer on your board.','Puzzles','Star','#cbdcf8'],
 ['scavenger','Bible Scavenger Hunt','Open your Bible','Follow five Scripture references to find the answers.','Explore','Books','#ffe4a6'],
 ['character','Bible Character Guessing','Who am I?','Reveal clues one at a time. Fewer clues, more points.','Knowledge','Star','#dacbf5'],
 ['ordering','Bible Story Ordering','Put the story together','Arrange the events, from beginning to end.','Explore','Books','#c2e7d5'],
 ['map','Bible Map Games','Explore the Bible world','Find places on a simplified eastern Mediterranean map.','Explore','Globe','#cbdcf8'],
 ['escape','Bible Escape Room','Unlock the next room','Solve four Scripture puzzles in an imaginative archive.','Explore','Books','#f7c9c0'],
].map(([id,title,tag,description,category,icon,color])=>({id,title,tag,description,category,icon,color}));
export const questions=[
 ['Who built an ark before the flood?','Noah','Moses|David|Jonah','Genesis 6:13–22',1,'People'],
 ['Who led Israel out of Egypt?','Moses','Noah|Solomon|Paul','Exodus 3:10',1,'People'],
 ['Who defeated Goliath?','David','Saul|Samuel|Elijah','1 Samuel 17:49–50',1,'People'],
 ['Who was swallowed by a great fish?','Jonah','Peter|Isaiah|Daniel','Jonah 1:17',1,'People'],
 ['Who was the mother of Jesus?','Mary','Martha|Ruth|Esther','Luke 1:30–31',1,'People'],
 ['Who was thrown into a den of lions?','Daniel','Joseph|Joshua|Aaron','Daniel 6:16',1,'People'],
 ['In which town was Jesus born?','Bethlehem','Nazareth|Jericho|Rome','Matthew 2:1',1,'Places'],
 ['Which city had walls that fell after Israel marched around it?','Jericho','Nineveh|Athens|Babylon','Joshua 6:20',1,'Places'],
 ['On which river was Jesus baptized?','Jordan','Nile|Euphrates|Tigris','Mark 1:9',1,'Places'],
 ['Which is the first book of the Bible?','Genesis','Exodus|Psalms|Matthew','Genesis 1:1',1,'Books'],
 ['Which book contains the line “The LORD is my shepherd”?','Psalms','Proverbs|Acts|Ruth','Psalm 23:1 (KJV)',1,'Books'],
 ['Which Gospel begins with “In the beginning was the Word”?','John','Matthew|Mark|Luke','John 1:1 (KJV)',1,'Books'],
 ['Who interpreted Pharaoh’s dreams in Egypt?','Joseph','Daniel|Isaac|Gideon','Genesis 41:14–32',2,'People'],
 ['Who said that Ruth’s people would be her people?','Ruth','Naomi|Esther|Deborah','Ruth 1:16',2,'People'],
 ['Who climbed a sycamore tree to see Jesus?','Zacchaeus','Nicodemus|Bartimaeus|Thomas','Luke 19:2–4',2,'People'],
 ['Who asked God for wisdom to govern?','Solomon','Saul|Ahab|Herod','1 Kings 3:7–12',2,'People'],
 ['Where did Jesus turn water into wine?','Cana','Bethany|Capernaum|Jericho','John 2:1–11',2,'Places'],
 ['To which city was Jonah sent?','Nineveh','Babylon|Rome|Tyre','Jonah 1:2',2,'Places'],
 ['In which city were the disciples first called Christians?','Antioch','Jerusalem|Corinth|Ephesus','Acts 11:26',2,'Places'],
 ['Which book tells of Pentecost and the early church?','Acts','Hebrews|Romans|Revelation','Acts 2:1–4',2,'Books'],
 ['Which book includes the fruit of the Spirit?','Galatians','Philippians|Colossians|James','Galatians 5:22–23',2,'Books'],
 ['Which book contains “faith without works is dead”?','James','Romans|Jude|Titus','James 2:26 (KJV)',2,'Books'],
 ['Who was the seller of purple cloth who welcomed Paul?','Lydia','Priscilla|Phoebe|Dorcas','Acts 16:14–15',3,'People'],
 ['Who explained Scripture to the Ethiopian official?','Philip','Peter|Paul|Barnabas','Acts 8:30–35',3,'People'],
 ['Who was chosen to replace Judas among the twelve?','Matthias','Stephen|Timothy|Silas','Acts 1:26',3,'People'],
 ['On which island was Paul shipwrecked?','Malta','Crete|Cyprus|Patmos','Acts 28:1',3,'Places'],
 ['Where did Paul address the Areopagus?','Athens','Rome|Ephesus|Philippi','Acts 17:16–22',3,'Places'],
 ['On which island was John when he received the vision recorded in Revelation?','Patmos','Malta|Cyprus|Crete','Revelation 1:9',3,'Places'],
 ['Which letter asks Philemon to welcome Onesimus?','Philemon','Titus|Jude|Hebrews','Philemon 1:10–17',3,'Books'],
 ['Which book speaks of faith as the substance of things hoped for?','Hebrews','James|Acts|Ephesians','Hebrews 11:1',3,'Books'],
 ['Which book describes the valley of dry bones?','Ezekiel','Daniel|Isaiah|Amos','Ezekiel 37:1–10',3,'Books'],
].map(([prompt,answer,distractors,ref,level,category],i)=>({id:'q'+i,prompt,answer,options:[answer,...distractors.split('|')],ref,level,category}));
export const verses=[
 ['The LORD is my shepherd; I shall not want.','Psalm 23:1'],
 ['In the beginning God created the heaven and the earth.','Genesis 1:1'],
 ['Jesus wept.','John 11:35'],
 ['Thy word is a lamp unto my feet, and a light unto my path.','Psalm 119:105'],
 ['I can do all things through Christ which strengtheneth me.','Philippians 4:13'],
 ['Blessed are the peacemakers: for they shall be called the children of God.','Matthew 5:9'],
 ['The LORD bless thee, and keep thee:','Numbers 6:24'],
 ['For where your treasure is, there will your heart be also.','Matthew 6:21'],
].map(([excerpt,ref])=>({excerpt,ref}));
export const wordSets=[['NOAH','MOSES','RUTH','DAVID','JONAH','MARY'],['FAITH','HOPE','LOVE','PEACE','JOY','GRACE'],['GENESIS','EXODUS','PSALMS','ACTS','JOHN','LUKE']];
export const crossword=[
 {word:'JERUSALEM',row:0,col:0,dir:'across',number:1,clue:'City where Solomon built the temple.',ref:'1 Kings 6; 2 Chronicles 3:1'},
 {word:'JONAH',row:0,col:0,dir:'down',number:1,clue:'Prophet sent to Nineveh.',ref:'Jonah 1:1–2'},
 {word:'RUTH',row:0,col:2,dir:'down',number:2,clue:'Naomi’s daughter-in-law who stayed with her.',ref:'Ruth 1:16'},
 {word:'SARAH',row:0,col:4,dir:'down',number:3,clue:'Abraham’s wife and Isaac’s mother.',ref:'Genesis 21:1–3'},
 {word:'LEAH',row:0,col:6,dir:'down',number:4,clue:'Rachel’s sister.',ref:'Genesis 29:16'},
 {word:'MOSES',row:0,col:8,dir:'down',number:5,clue:'Leader called at a burning bush.',ref:'Exodus 3:1–10'},
];
export const prompts=[
 ['Noah building the ark','Genesis 6:14–22'],['David facing Goliath','1 Samuel 17'],['Jonah and the great fish','Jonah 1:17'],['The lost sheep','Luke 15:3–7'],['Moses and the burning bush','Exodus 3:1–6'],['The good Samaritan','Luke 10:30–37'],['Jesus calming the storm','Mark 4:35–41'],['Daniel in the lions’ den','Daniel 6'],['The walls of Jericho','Joshua 6'],['The sower planting seeds','Mark 4:3–9'],['The star over Bethlehem','Matthew 2:1–10'],['Peter fishing','Luke 5:1–11'],
].map(([answer,ref])=>({answer,ref}));
export const characters=[
 {answer:'Noah',clues:['I lived before the flood.','I cared for animals during a great journey.','God told me to build an ark.'],ref:'Genesis 6–9'},
 {answer:'Esther',clues:['I lived in the Persian empire.','Mordecai was my cousin and guardian.','As queen, I spoke up for my people.'],ref:'Esther 2:7; 4–7'},
 {answer:'Peter',aliases:['Simon Peter','Simon'],clues:['I worked as a fisherman.','My brother was Andrew.','I denied Jesus three times, then was restored.'],ref:'Matthew 4:18; John 18; 21'},
 {answer:'Joseph',clues:['My family gave me a special coat.','I was sold and taken to Egypt.','I interpreted Pharaoh’s dreams.'],ref:'Genesis 37; 41'},
 {answer:'Martha',clues:['I welcomed Jesus into my home.','My sister sat listening at his feet.','My sister was Mary and my brother was Lazarus.'],ref:'Luke 10:38–42; John 11:1'},
 {answer:'Paul',aliases:['Saul'],clues:['I once persecuted followers of Jesus.','My life changed on the road to Damascus.','I wrote letters to several churches.'],ref:'Acts 9:1–22; Romans 1:1'},
];
export const stories=[
 {title:'Jonah’s journey',ref:'Jonah 1–3',events:['God calls Jonah to Nineveh.','Jonah boards a ship going toward Tarshish.','A storm threatens the ship.','Jonah is thrown into the sea and swallowed by a great fish.','Jonah prays, and the fish releases him.','Jonah goes to Nineveh and proclaims God’s message.']},
 {title:'David and Goliath',ref:'1 Samuel 17',events:['David brings food to his brothers at the camp.','David hears Goliath’s challenge.','David offers to face Goliath.','David chooses five smooth stones.','David strikes Goliath with a stone from his sling.']},
 {title:'The first Christmas',ref:'Luke 1:26–38; 2:1–20',events:['Gabriel tells Mary that she will have a son.','Joseph and Mary travel to Bethlehem.','Jesus is born and laid in a manger.','An angel tells shepherds the good news.','The shepherds visit and find Mary, Joseph and the baby.']},
];
export const hunts=[
 {prompt:'Find Genesis 8:11. Which tree supplied the leaf brought back by the dove?',answer:'Olive',aliases:['Olive tree'],ref:'Genesis 8:11',excerpt:'and, lo, in her mouth was an olive leaf pluckt off'},
 {prompt:'Find 1 Samuel 17:40. How many smooth stones did David choose?',answer:'Five',aliases:['5'],ref:'1 Samuel 17:40',excerpt:'and chose him five smooth stones out of the brook'},
 {prompt:'Find Luke 19:4. What kind of tree did Zacchaeus climb?',answer:'Sycamore',aliases:['Sycamore tree'],ref:'Luke 19:4',excerpt:'and climbed up into a sycomore tree to see him',extra:['Sycomore']},
 {prompt:'Find John 2:1. In which town was the wedding?',answer:'Cana',ref:'John 2:1',excerpt:'there was a marriage in Cana of Galilee'},
 {prompt:'Find Acts 16:14. What was the name of the seller of purple?',answer:'Lydia',ref:'Acts 16:14',excerpt:'And a certain woman named Lydia, a seller of purple'},
];
export const locations=[
 {name:'Rome',lon:12.5,lat:41.9,prompt:'Paul lived here under guard while welcoming visitors.',ref:'Acts 28:16,30–31'},
 {name:'Athens',lon:23.7,lat:38,prompt:'Paul spoke at the Areopagus in this Greek city.',ref:'Acts 17:16–22'},
 {name:'Jerusalem',lon:35.2,lat:31.8,prompt:'Pentecost took place in this city.',ref:'Acts 2:1–5'},
 {name:'Nineveh',lon:43.2,lat:36.4,prompt:'Jonah was sent to preach to this Assyrian city.',ref:'Jonah 1:2'},
 {name:'Babylon',lon:44.4,lat:32.5,prompt:'Daniel was taken to this city as an exile.',ref:'Daniel 1:1–6'},
 {name:'Alexandria',lon:29.9,lat:31.2,prompt:'Apollos was born in this Egyptian city.',ref:'Acts 18:24'},
];
export const escapeRooms=[
 {title:'The reading desk',prompt:'A note says: “Find the book that opens with creation.” Which book unlocks the drawer?',answer:'Genesis',options:['Genesis','Acts','Ruth','Jude'],ref:'Genesis 1:1'},
 {title:'The stone cabinet',prompt:'The lock asks for the number of smooth stones David chose. Enter the number.',answer:'5',aliases:['five'],ref:'1 Samuel 17:40'},
 {title:'The letter shelf',prompt:'Unscramble the name on the letter: L U A P',answer:'Paul',ref:'Romans 1:1'},
 {title:'The final doorway',prompt:'The inscription says: “The LORD is my ____.” Complete the line to open the door.',answer:'shepherd',ref:'Psalm 23:1 (KJV)'},
];
