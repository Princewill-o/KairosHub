// Kharis Church in Kairos World: branches, departments, serving scenarios and sermon
// study games. Names and department descriptions come from kharis.org (Locations,
// Get Involved and Messages pages); scenarios and game rounds are original practice
// situations written for the game. Scripture quotations are KJV (public domain).
// Shared by the browser and the family backend, which validates ids against it.

export const KHARIS_SOURCE = "https://kharis.org";

export const BRANCHES = [
  { id: "london", name: "London", region: "UK" },
  { id: "kp2", name: "KP2 London", region: "UK" },
  { id: "birmingham", name: "Birmingham", region: "UK" },
  { id: "brighton", name: "Brighton", region: "UK" },
  { id: "bristol", name: "Bristol", region: "UK" },
  { id: "chatham", name: "Chatham", region: "UK" },
  { id: "chelmsford", name: "Chelmsford", region: "UK" },
  { id: "coventry", name: "Coventry", region: "UK" },
  { id: "croydon", name: "Croydon", region: "UK" },
  { id: "luton", name: "Luton", region: "UK" },
  { id: "manchester", name: "Manchester", region: "UK" },
  { id: "northampton", name: "Northampton", region: "UK" },
  { id: "nottingham", name: "Nottingham", region: "UK" },
  { id: "orpington", name: "Orpington", region: "UK" },
  { id: "reading", name: "Reading", region: "UK" },
  { id: "accra", name: "Accra", region: "Kharis International" },
  { id: "freetown", name: "Freetown", region: "Kharis International" },
];

/** The 19 departments listed on kharis.org/get-involved, with a colour for name tags. */
export const DEPARTMENTS = [
  { id: "administration", name: "Administration", color: "#5a6b8c", about: "Runs church operations: office work, records, registration, and events such as baptisms, baby namings, dedications and leaders' meetings." },
  { id: "children", name: "Children's Department", color: "#f2a33a", about: "Teaches children aged 3 to 16 about God through Bible lessons, activities, worship and prayer, and helps them build friendships." },
  { id: "design", name: "Design", color: "#d0569a", about: "Creates posters, logos, t-shirt designs and social media filters." },
  { id: "drama", name: "Drama", color: "#9b59d0", about: "Shares the Gospel through skits and plays drawn from Pastor David's teaching, with real-life illustrations." },
  { id: "evangelism", name: "Evangelism", color: "#e0483e", about: "Shares the Gospel on the streets, follows people up and encourages them to come to church and New Believers classes." },
  { id: "first-aid", name: "First Aid", color: "#d63b3b", about: "Gives immediate care to anyone taken ill or injured on church premises or at church activities." },
  { id: "follow-up", name: "Follow Up", color: "#2fa48a", about: "Contacts new visitors and keeps in touch so they settle into the church family." },
  { id: "hospitality", name: "Hospitality", color: "#c9853a", about: "Serves visitors, pastors and members with excellent customer service." },
  { id: "host", name: "Host Team", color: "#3d8a5b", about: "Welcomes guests as they arrive and staffs the visitor reception after the service." },
  { id: "music", name: "Music", color: "#6b3fa0", about: "Serves through instruments, song selection, administration, sound liaison, wedding liaison and uniforms." },
  { id: "new-believers", name: "New Believers", color: "#f2c84b", about: "Helps new Christians grow through organised Bible study classes." },
  { id: "production", name: "Production", color: "#2b5fd9", about: "Records and produces video of church messages; operates cameras and projects scriptures during services." },
  { id: "sanctuary", name: "Sanctuary Keepers", color: "#8a929c", about: "Keeps the church clean and orderly at all times." },
  { id: "setup", name: "Set-Up", color: "#7a4f32", about: "Sets up and packs away the equipment needed for services." },
  { id: "social-media", name: "Social Media", color: "#1da1f2", about: "Runs the church's social media: strategy, daily posting and content for each platform." },
  { id: "sound", name: "Sound", color: "#34474c", about: "Provides quality audio for services, meetings, choir rehearsals, weddings and Jesus campaign outreach." },
  { id: "uniform", name: "Uniform", color: "#b23a6b", about: "Designs, sews and styles uniforms for departments: head stylist, assistant, accessories stylist and seamstress." },
  { id: "ushers", name: "Ushers", color: "#13203a", about: "Welcome guests, help them find seats and assist throughout the service." },
  { id: "welfare", name: "Welfare", color: "#4a8fb8", about: "Supports members in need through home visits, encouragement, counselling and mentoring." },
];

const o = (label, score, result, ref) => ({ label, score, result, ref });
/** Serving scenarios: what you do on duty in your department. Best answers score 3. */
export const SERVING = [
  { id: "admin-baptism", dept: "administration", title: "Baptism Sunday", text: "Twelve people are being baptised and two names are missing from the register. The service starts in ten minutes.", options: [o("Quietly check with each candidate and complete the register before it starts", 3, "Every name is recorded and the pastor reads them with confidence.", "1 Corinthians 14:40"), o("Leave it; nobody will notice", 0, "Two people go home without a record of their baptism."), o("Ask the pastor to fix it during the service", 1, "It works, but it pulls the pastor away at a busy moment.")] },
  { id: "admin-records", dept: "administration", title: "A member asks for their details", text: "A member wants to know what personal details the church holds about them.", options: [o("Follow the church's data procedure and arrange it properly", 3, "They feel respected and the records stay safe.", "Luke 16:10"), o("Show them the whole members' spreadsheet", 0, "Other people's details are exposed."), o("Tell them it's not possible", 1, "They leave frustrated and unsure.")] },
  { id: "children-tears", dept: "children", title: "A child won't settle", text: "A five-year-old is crying for their mum during the Bible lesson.", options: [o("Sit with them, comfort them, and ask a team member to fetch the parent if it continues", 3, "They calm down and later join in the song.", "Mark 10:14"), o("Carry on teaching and ignore it", 0, "The child gets more upset and the whole class is distracted."), o("Take them out alone to the car park to find mum", 0, "Never take a child somewhere alone: safeguarding comes first.")] },
  { id: "children-lesson", dept: "children", title: "Making the lesson stick", text: "Today's lesson is David and Goliath. The class is restless.", options: [o("Act it out: one child is David, five soft balls are stones", 3, "They remember every detail and the verse.", "1 Samuel 17:45"), o("Read the whole chapter aloud without stopping", 1, "They hear it but most of it doesn't land."), o("Put on a cartoon and check your phone", 0, "The class learns nothing about God's faithfulness.")] },
  { id: "design-poster", dept: "design", title: "Poster for the youth night", text: "The poster is due tonight and you have a busy layout with five fonts.", options: [o("Simplify: one headline, date, place and a clear call to action", 3, "Everyone can read it from across the hall.", "Habakkuk 2:2"), o("Add more effects so it stands out", 1, "It's loud, but nobody can find the date."), o("Copy another church's poster", 0, "Using someone else's work without permission isn't honest.")] },
  { id: "drama-lines", dept: "drama", title: "Forgotten lines", text: "Mid-skit, your partner forgets their lines in front of the whole church.", options: [o("Stay in character and give them a cue to get back on track", 3, "The audience never notices, and the message lands.", "Galatians 6:2"), o("Stop and tell everyone they forgot", 0, "They're embarrassed and the moment is lost."), o("Walk off the stage", 0, "The skit falls apart.")] },
  { id: "evangelism-street", dept: "evangelism", title: "On the high street", text: "A young man says, 'Church is just rules. Why would I come?'", options: [o("Listen first, then share what Jesus has done for you and invite him to Sunday", 3, "He takes your number and says he'll think about it.", "1 Peter 3:15"), o("Argue until he admits he's wrong", 0, "He walks off annoyed."), o("Just hand him a leaflet and move on", 1, "He takes it, but there's no conversation.")] },
  { id: "evangelism-follow", dept: "evangelism", title: "The number you took", text: "Last week someone gave you their number after you prayed with them.", options: [o("Message them this week and offer to meet them at church", 3, "They come, and you sit with them.", "Luke 15:4"), o("Wait for them to message you", 0, "You never hear from them again."), o("Add them to a group chat without asking", 1, "They feel overwhelmed.")] },
  { id: "firstaid-faint", dept: "first-aid", title: "Someone faints in worship", text: "A woman collapses during worship in a packed row.", options: [o("Get to her calmly, check she's breathing, lay her on her side and call for help if needed", 3, "She comes round and is looked after properly.", "Luke 10:34"), o("Pour water on her face", 0, "That isn't first aid and could cause harm."), o("Wait until the song ends", 0, "Every minute counts.")] },
  { id: "followup-visitor", dept: "follow-up", title: "A first-time visitor", text: "A visitor filled in a card on Sunday but ticked 'not sure about coming back'.", options: [o("Call warmly, thank them for coming, ask how they found it and invite them to KGroup", 3, "They come back and find a group of friends.", "Romans 15:7"), o("Don't call; they said they weren't sure", 1, "They never hear from anyone."), o("Call five times in one day", 0, "They feel pressured.")] },
  { id: "hospitality-pastor", dept: "hospitality", title: "A guest minister arrives early", text: "The guest speaker arrives an hour early and the green room isn't ready.", options: [o("Welcome them, offer a drink, and get the room ready quickly", 3, "They feel honoured and settled before preaching.", "Hebrews 13:2"), o("Ask them to wait in the car", 0, "Not the welcome they deserved."), o("Apologise and leave them alone", 1, "Polite, but they're left waiting.")] },
  { id: "host-welcome", dept: "host", title: "At the door", text: "A family arrives late, looking unsure where to go.", options: [o("Smile, welcome them by name if you can, and walk them to seats with an usher", 3, "They relax and settle in.", "Romans 12:13"), o("Point vaguely at the hall", 1, "They wander in and feel awkward."), o("Tell them the service has started", 0, "They almost leave.")] },
  { id: "music-mistake", dept: "music", title: "Wrong key", text: "The worship leader starts the song in a different key from rehearsal.", options: [o("Listen, adjust quietly and follow the leader", 3, "The worship flows and the congregation never notices.", "Psalm 33:3"), o("Keep playing your rehearsed key", 0, "It clashes and distracts everyone."), o("Stop playing and look annoyed", 0, "It pulls attention from worship.")] },
  { id: "music-heart", dept: "music", title: "Your solo is cut", text: "The music director cuts your solo for Sunday.", options: [o("Accept it humbly and serve the song", 3, "Your attitude blesses the whole team.", "Philippians 2:3"), o("Complain in the group chat", 0, "It spreads division."), o("Skip rehearsal this week", 0, "The team is a person short.")] },
  { id: "nb-question", dept: "new-believers", title: "A hard question", text: "In class, a new believer asks, 'If God forgives everything, does it matter how I live?'", options: [o("Open Romans 6 together and talk about grace that changes us", 3, "They see that grace is the power to live differently.", "Romans 6:1-2"), o("Tell them that's a silly question", 0, "They stop asking questions."), o("Give your own opinion without the Bible", 1, "They get an answer, but not a foundation.")] },
  { id: "production-slide", dept: "production", title: "Scripture on screen", text: "The pastor calls out a scripture you haven't prepared.", options: [o("Type the reference fast, check the version, and put it up cleanly", 3, "The church reads along without a pause.", "Ecclesiastes 9:10"), o("Leave the lyrics slide up", 1, "People scramble for their Bibles."), o("Put up a random verse", 0, "The wrong verse confuses everyone.")] },
  { id: "sanctuary-spill", dept: "sanctuary", title: "A spill before service", text: "Juice has spilled across the aisle twenty minutes before service.", options: [o("Clean it now and put a wet-floor sign out", 3, "No one slips and the sanctuary looks ready.", "Colossians 3:23"), o("Cover it with a mat", 1, "It's hidden, but sticky all day."), o("Leave it for someone else", 0, "Someone slips during worship.")] },
  { id: "setup-late", dept: "setup", title: "The van is late", text: "The equipment van arrives 40 minutes late on a hall Sunday.", options: [o("Rally the team, split the jobs and set up in priority order", 3, "Sound and seats are ready just in time.", "Nehemiah 4:6"), o("Start the service without equipment", 1, "It works, but nobody can hear."), o("Blame the driver loudly", 0, "Morale drops.")] },
  { id: "social-comment", dept: "social-media", title: "A harsh comment", text: "Someone posts an angry comment under the church's livestream.", options: [o("Reply graciously once, offer to talk privately, and follow the moderation policy", 3, "The tone calms and others see grace in action.", "Proverbs 15:1"), o("Reply sarcastically", 0, "It turns into a public argument."), o("Delete every comment", 1, "The page looks quiet, but real questions go unanswered.")] },
  { id: "sound-feedback", dept: "sound", title: "Feedback squeal", text: "A loud squeal of feedback rings out as the pastor walks forward.", options: [o("Pull down the right channel fast and ring out the monitor after", 3, "It's gone in a second and the message continues.", "Proverbs 22:29"), o("Turn everything off", 0, "Silence, and nobody can hear the sermon."), o("Ignore it and hope it stops", 0, "It gets worse.")] },
  { id: "uniform-rush", dept: "uniform", title: "A uniform rush", text: "Six ushers need fitted uniforms for a conference on Saturday.", options: [o("Plan fittings, share tasks with the seamstress and stylists, and finish by Friday", 3, "The team looks sharp and united.", "Proverbs 31:13"), o("Do it all yourself overnight", 1, "You finish, exhausted, with mistakes."), o("Tell them to wear anything", 0, "The team looks disorganised.")] },
  { id: "ushers-seat", dept: "ushers", title: "A full sanctuary", text: "The hall is full and an elderly visitor is standing at the back.", options: [o("Find them a seat, ask a member to make room if needed, and check on them after", 3, "They feel seen and welcome.", "James 2:2-4"), o("Tell them to stand", 0, "They leave early."), o("Seat them on the front row without asking", 1, "Kind, but they felt put on show.")] },
  { id: "ushers-offering", dept: "ushers", title: "Offering time", text: "During the offering, a basket is left unattended near the door.", options: [o("Keep it with you and follow the counting procedure with another usher", 3, "Every gift is handled with integrity.", "2 Corinthians 8:21"), o("Leave it for later", 0, "That's a risk to people's giving."), o("Count it yourself, alone", 1, "Always count with another person.")] },
  { id: "welfare-visit", dept: "welfare", title: "A member is unwell at home", text: "A member hasn't been to church for a month after an operation.", options: [o("Arrange a visit with another team member, bring a meal and pray with them", 3, "They feel loved and come back when they're well.", "James 1:27"), o("Post 'get well soon' in the group chat", 1, "Kind, but they still feel alone."), o("Wait for them to ask for help", 0, "They never ask.")] },
];

const r = (prompt, actions, why) => ({ prompt, actions, why });
const a = (label, anim, ok = false) => ({ label, anim, ok });
/**
 * Sermon study games: built on Kharis messages. Each round your character has to do
 * the right thing (pray, kneel, read, lift hands, walk on…) for the message's point.
 */
export const SERMON_GAMES = [
  { id: "spirit-truth", title: "In Spirit and Truth", speaker: "David Antwi", series: "Messages", ref: "John 4:21-24", verse: "God is a Spirit: and they that worship him must worship him in spirit and in truth.", summary: "Worship isn't about a place. It's a heart that's real with God and lives by His word.", rounds: [
    r("The woman at the well asks where people should worship. What does true worship start with?", [a("Lift your hands from the heart", "worship", true), a("Walk to a famous mountain", "walk"), a("Wave at the crowd", "wave")], "Jesus says the hour comes when worship isn't tied to a mountain but to spirit and truth."),
    r("Truth means God's word shapes your worship. Do it.", [a("Open the Bible and read", "read", true), a("Make up your own words", "talk"), a("Jump to the music", "jump")], "Truth comes from the word of God (John 17:17)."),
    r("Worship continues after the song ends. Show it.", [a("Kneel and pray on your own", "pray", true), a("Cheer for yourself", "cheer"), a("Sit and scroll", "sit")], "Real worship is a life of prayer, not only a Sunday moment.")] },
  { id: "portraits-christ", title: "The Portraits of Christ", speaker: "David Antwi", series: "Portraits of Christ", ref: "John 14:9", verse: "He that hath seen me hath seen the Father.", summary: "Each portrait of Jesus in Scripture shows us the Father. Look closely and you'll know Him.", rounds: [
    r("Portrait one: the Good Shepherd. Go after the lost.", [a("Walk out and search", "walk", true), a("Stay seated", "sit"), a("Argue about it", "talk")], "The shepherd leaves the ninety-nine to find the one (Luke 15:4)."),
    r("Portrait two: the Servant. Jesus washed feet.", [a("Kneel to serve", "pray", true), a("Wait to be served", "idle"), a("Wave from a distance", "wave")], "He came not to be ministered unto, but to minister (Mark 10:45)."),
    r("Portrait three: the King. How do you respond?", [a("Lift your hands in worship", "worship", true), a("Shrug and walk off", "walk"), a("Celebrate yourself", "cheer")], "Every knee shall bow (Philippians 2:10)."),
    r("To know the portraits, you study them.", [a("Read the Gospels", "read", true), a("Guess", "think"), a("Jump ahead", "jump")], "Search the scriptures; they testify of Him (John 5:39).")] },
  { id: "christian-fast", title: "The Christian Fast", speaker: "David Antwi", series: "Messages", ref: "Matthew 6:17-18", verse: "But thou, when thou fastest, anoint thine head, and wash thy face; that thou appear not unto men to fast.", summary: "Fasting is between you and God: humble, hidden and hungry for Him, not for show.", rounds: [
    r("You're fasting today. A friend asks why you're not eating lunch.", [a("Answer simply and keep it humble", "talk", true), a("Announce it to the whole office", "cheer"), a("Pretend to faint for sympathy", "sit")], "Fast to your Father in secret, not to be seen."),
    r("Hunger hits at 3pm. Turn it into…", [a("Prayer", "pray", true), a("A snack run", "walk"), a("A complaint", "talk")], "Let the hunger remind you to seek God."),
    r("Feed your spirit while your body fasts.", [a("Read Isaiah 58", "read", true), a("Watch videos all evening", "sit"), a("Sleep it off", "idle")], "The fast God chooses looses bands and feeds the hungry (Isaiah 58:6-7).")] },
  { id: "obedience", title: "Obedience: The Fuel of Sanctification", speaker: "Awo Antwi", series: "Messages", ref: "1 Samuel 15:22", verse: "Behold, to obey is better than sacrifice, and to hearken than the fat of rams.", summary: "We grow in holiness as we obey: small, daily yeses to God fuel real change.", rounds: [
    r("God's word says forgive. Your friend hurt you yesterday.", [a("Go and make peace", "walk", true), a("Wait for them to apologise", "sit"), a("Tell everyone what they did", "talk")], "Obedience doesn't wait for feelings (Matthew 5:24)."),
    r("You hear a prompt to pray for a colleague.", [a("Pray now", "pray", true), a("Think about it later", "think"), a("Ignore it", "idle")], "Obey quickly; delayed obedience is disobedience."),
    r("Saul offered sacrifice instead of obeying. You choose:", [a("Do exactly what God said", "read", true), a("Do something bigger instead", "cheer"), a("Do half of it", "walk")], "To obey is better than sacrifice.")] },
  { id: "restrictions", title: "Issues of Life: Restrictions", speaker: "David Antwi", series: "Issues of Life · Episode 30", ref: "Proverbs 25:28", verse: "He that hath no rule over his own spirit is like a city that is broken down, and without walls.", summary: "A life without restrictions leads to destruction. Godly boundaries protect you.", rounds: [
    r("A night out is heading somewhere you know is wrong.", [a("Walk away and go home", "walk", true), a("Stay and see what happens", "idle"), a("Dance on", "jump")], "Flee youthful lusts (2 Timothy 2:22)."),
    r("Build a wall: set a boundary for your phone at night.", [a("Put it down and pray", "pray", true), a("Scroll until 3am", "sit"), a("Cheer that you're free", "cheer")], "Walls are not prisons; they're protection."),
    r("Who keeps you accountable?", [a("Talk to a mature believer", "talk", true), a("No one, I'm fine", "idle"), a("Only myself", "think")], "Two are better than one (Ecclesiastes 4:9-10).")] },
  { id: "fellowship", title: "Issues of Life: Christian Fellowship", speaker: "David Antwi", series: "Issues of Life · Episode 29", ref: "Hebrews 10:25", verse: "Not forsaking the assembling of ourselves together, as the manner of some is.", summary: "The Christian life is about fellowship. You weren't made to walk alone.", rounds: [
    r("Sunday morning. You feel tired.", [a("Get up and go to church", "walk", true), a("Stay in bed", "sit"), a("Watch later, maybe", "idle")], "Don't forsake the assembling together."),
    r("Someone new is sitting alone after service.", [a("Go over and greet them", "wave", true), a("Stay with your usual friends", "talk"), a("Leave quickly", "walk")], "Receive one another, as Christ received us (Romans 15:7)."),
    r("Your KGroup meets midweek.", [a("Join and pray together", "pray", true), a("Skip it again", "idle"), a("Join just to chat", "talk")], "They continued in fellowship and prayers (Acts 2:42).")] },
  { id: "trust-god", title: "Issues of Life: Trust in God", speaker: "David Antwi", series: "Issues of Life · Episode 26", ref: "Proverbs 3:5", verse: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", summary: "Trust God rather than looking around for help.", rounds: [
    r("Rent is due and money is short.", [a("Pray first, then plan wisely", "pray", true), a("Panic", "think"), a("Borrow from a loan shark", "walk")], "Cast thy burden upon the LORD (Psalm 55:22)."),
    r("A door closes on a job you wanted.", [a("Thank God and keep going", "worship", true), a("Give up", "sit"), a("Blame everyone", "talk")], "All things work together for good (Romans 8:28)."),
    r("Remind yourself what God has done.", [a("Read your testimonies", "read", true), a("Scroll other people's lives", "sit"), a("Worry", "think")], "Remember the works of the LORD (Psalm 77:11).")] },
  { id: "thirst-no-more", title: "Issues of Life: Thirst No More", speaker: "David Antwi", series: "Issues of Life · Episode 22", ref: "John 4:14", verse: "But whosoever drinketh of the water that I shall give him shall never thirst.", summary: "Jesus promises to quench your thirst, but it starts with humility.", rounds: [
    r("The woman came to the well thirsty. Come to Jesus:", [a("Humble yourself and pray", "pray", true), a("Pretend you're fine", "idle"), a("Look for another well", "walk")], "God giveth grace unto the humble (James 4:6)."),
    r("What fills you up for real?", [a("Time in the word", "read", true), a("More likes", "cheer"), a("More stuff", "walk")], "Man shall not live by bread alone (Matthew 4:4)."),
    r("She ran back to tell the town. Your turn:", [a("Go and tell someone", "walk", true), a("Keep it to yourself", "sit"), a("Wave and stay", "wave")], "Come, see a man (John 4:29).")] },
  { id: "fear-not", title: "Issues of Life: Fear Not", speaker: "David Antwi", series: "Issues of Life · Episode 21", ref: "Isaiah 41:10", verse: "Fear thou not; for I am with thee: be not dismayed; for I am thy God.", summary: "The Bible is full of 'fear nots'. God is with you.", rounds: [
    r("Exam day. Your heart is racing.", [a("Breathe and pray", "pray", true), a("Run out of the room", "walk"), a("Freeze", "idle")], "God hath not given us the spirit of fear (2 Timothy 1:7)."),
    r("Peter walked on water while he looked at Jesus. Step out:", [a("Step forward in faith", "walk", true), a("Look at the waves", "think"), a("Sit in the boat", "sit")], "Be of good cheer; it is I; be not afraid (Matthew 14:27)."),
    r("Night-time worries come back.", [a("Lift your hands and thank God", "worship", true), a("Scroll the news", "sit"), a("Talk yourself into worse", "talk")], "I will both lay me down in peace, and sleep (Psalm 4:8).")] },
];

export const branchById = (id) => BRANCHES.find((b) => b.id === id) || null;
export const departmentById = (id) => DEPARTMENTS.find((d) => d.id === id) || null;
export const scenarioById = (id) => SERVING.find((s) => s.id === id) || null;
export const sermonById = (id) => SERMON_GAMES.find((s) => s.id === id) || null;
/** Name tag text, e.g. "Kharis Croydon · Ushers". */
export const nameTagLabel = (branch, dept) => `Kharis ${branchById(branch)?.name ?? "Church"}${departmentById(dept) ? " · " + departmentById(dept).name : ""}`;
