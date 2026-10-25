export const extraVerses=[
['psalm46','Psalm 46:1','God is our refuge and strength, a very present help in trouble.',['refuge','strength','help']],
['psalm56','Psalm 56:3','What time I am afraid, I will trust in thee.',['afraid','trust']],
['psalm100_5','Psalm 100:5','For the LORD is good; his mercy is everlasting; and his truth endureth to all generations.',['good','mercy','truth']],
['psalm150','Psalm 150:6','Let every thing that hath breath praise the LORD. Praise ye the LORD.',['breath','praise']],
['proverbs3','Proverbs 3:5','Trust in the LORD with all thine heart; and lean not unto thine own understanding.',['trust','heart','understanding']],
['john11','John 11:35','Jesus wept.',['wept']],
['phil4','Philippians 4:4','Rejoice in the Lord alway: and again I say, Rejoice.',['rejoice','lord']],
['thess5','1 Thessalonians 5:17','Pray without ceasing.',['pray','ceasing']],
['micah6','Micah 6:8','He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?',['justly','mercy','humbly']],
['psalm34','Psalm 34:8','O taste and see that the LORD is good: blessed is the man that trusteth in him.',['taste','good','trusteth']]
].map(([id,reference,text,keywords])=>({id,reference,text,keywords,translation:'KJV',themes:['faith'],difficulty:1}));
export const extraWisdom=[
['Pride goeth before destruction.',true,'Proverbs 16:18 (KJV)','Pride can blind us to the danger of our choices.'],
['You should get even whenever someone wrongs you.',false,'Romans 12:17–21','Paul calls believers away from revenge and toward overcoming evil with good.'],
['A good name is rather to be chosen than great riches.',true,'Proverbs 22:1 (KJV)','Character and a trustworthy reputation are worth more than wealth.'],
['The ends always justify the means.',false,'Romans 3:8','A hoped-for result does not give us permission to do evil.'],
['Be swift to hear, slow to speak, slow to wrath.',true,'James 1:19 (KJV)','Listening and restraint belong together in this practical instruction.'],
['If life is difficult, God must have abandoned you.',false,'Psalm 23:4','The psalm pictures God’s presence even in a dark valley.'],
['Blessed are the peacemakers.',true,'Matthew 5:9 (KJV)','Jesus blesses those who make peace.'],
['Winning an argument matters more than loving a person.',false,'1 Corinthians 13:1–3','Without love, even impressive speech is empty.'],
['Let all your things be done with charity.',true,'1 Corinthians 16:14 (KJV)','Here charity means love: it should shape everything we do.'],
['People who have less money matter less.',false,'James 2:1–9','James warns against favouring the wealthy over the poor.'],
['Iron sharpeneth iron.',true,'Proverbs 27:17 (KJV)','The proverb pictures how people can help one another grow.'],
['Forgiveness means pretending harm never happened.',false,'Luke 17:3–4','Jesus speaks of confronting wrongdoing as well as forgiving.'],
['Let us not be weary in well doing.',true,'Galatians 6:9 (KJV)','Paul encourages perseverance in doing good.'],
['You have to be perfect before you can pray.',false,'Luke 18:9–14','Jesus describes a humble sinner whose honest prayer is received.'],
['The truth shall make you free.',true,'John 8:32 (KJV)','Jesus connects freedom with continuing in his word and knowing the truth.'],
['Having more possessions will finally make you secure.',false,'Luke 12:16–21','The rich fool’s story questions security built only on stored wealth.'],
['Love your enemies.',true,'Matthew 5:44 (KJV)','Jesus extends love beyond the people who already love us.'],
['Real strength is never admitting you need help.',false,'2 Corinthians 12:9','Paul describes finding strength in acknowledged weakness.']
].map(([text,biblical,reference,explanation])=>({text,biblical,reference,explanation}));
export const extraPrayers=[
['You have an important decision to make.', ['God, you are wise and see what I cannot.','Forgive me for acting as though I know everything.','Thank you for people who offer wise counsel.','Please guide my next step and help me listen.']],
['Someone in your family is recovering from illness.',['God, you are compassionate and near to those who hurt.','Forgive me for being impatient with others’ needs.','Thank you for the care and support our family has received.','Please give strength, comfort, and wise help to my family.']],
['You have achieved something you worked hard for.',['God, you are the giver of every good gift.','Forgive me for taking all the credit and forgetting others.','Thank you for the help and opportunities that made this possible.','Help me use this opportunity to serve others.']],
['You are finding it hard to forgive a friend.',['God, your mercy is greater than I can measure.','Forgive me for the bitterness I have held onto.','Thank you for the mercy you have shown me.','Help me seek a wise and honest path toward forgiveness.']],
['Your community is preparing to welcome a new family.',['God, you welcome people with generous love.','Forgive me for keeping my circle closed to strangers.','Thank you for the different gifts people bring.','Help us offer practical care and a warm welcome.']],
['A difficult day has left you feeling discouraged.',['God, you are steady when my feelings change.','Forgive me for the unkind ways I have expressed my frustration.','Thank you for the small good things in this day.','Please give me rest and courage for tomorrow.']]
].map(([scenario,lines])=>({scenario,lines:lines.map((text,i)=>[['Adoration','Confession','Thanksgiving','Supplication'][i],text])}));
export const armorAlternates={
truth:['An online post makes a dramatic claim. You want to check the facts before passing it on.','You broke something and could blame another person. You need the courage to be honest.'],
righteousness:['A teammate suggests bending the rules to win. You want to act with integrity.','You could keep money accidentally given to you. You choose to return it.'],
peace:['You are visiting a new group and want to approach people with the good news of peace.','A disagreement is growing. You prepare to listen and help people seek reconciliation.'],
faith:['A setback makes trusting God difficult. You want to hold onto his faithfulness.','Fearful thoughts crowd your mind. You remember that God can be trusted.'],
salvation:['Shame tells you there is no hope for you. You need to remember the salvation God offers.','You are anxious about your standing with God and need hope grounded in his saving work.'],
spirit:['You hear a misleading teaching and turn to Scripture for a faithful response.','You are tempted to justify an unkind action and recall a passage that guides you differently.']};
export const fruitAlternates={
love:['A new person is being excluded from the group. You make space for them and seek their good.','You choose to care for someone who cannot offer anything in return.'],
joy:['You remember God’s goodness and find a reason to celebrate amid an ordinary week.','You share in a friend’s good news with a glad heart rather than envy.'],
peace:['You help two people speak calmly after a misunderstanding.','You choose words that help restore a strained friendship.'],
patience:['A queue moves slowly, and you choose to wait without snapping at anyone.','A friend tells the same story again, and you listen without rushing them.'],
kindness:['You notice someone carrying heavy bags and offer practical help.','You send a caring message to a friend who has had a hard day.'],
goodness:['You refuse to cover up a mistake even though honesty may cost you.','You choose the fair option when no one is checking your work.'],
faithfulness:['You continue helping with a weekly task long after the excitement has faded.','You keep a promise even when a more exciting invitation appears.'],
gentleness:['You give difficult feedback in a way that respects the other person’s dignity.','You handle a frightened animal carefully rather than forcing it.'],
self_control:['You put down your phone when you know it is time to rest.','You stop yourself from posting an angry reply and think before responding.']};
export const extraParables=[
{title:'The Lost Sheep',reference:'Luke 15:3–7',panels:[{title:'One is missing',text:'A shepherd has a hundred sheep, but one is lost.',clue:'One matters',meaning:'The missing sheep is worth seeking.',icon:'Players'},{title:'A determined search',text:'The shepherd goes after the lost sheep until he finds it.',clue:'Seeking the lost',meaning:'The search reveals care for the one who is lost.',icon:'boots'},{title:'Joyful return',text:'He carries it home and calls friends to rejoice.',clue:'Shared joy',meaning:'Jesus connects the celebration to joy over a sinner who repents.',icon:'Heart'}],options:['God rejoices when a lost person turns back to him.','Only the largest group matters.','Animals should never leave a field.'],correct:0},
{title:'The Wise and Foolish Builders',reference:'Matthew 7:24–27',panels:[{title:'A firm foundation',text:'One person builds a house on rock.',clue:'Rock beneath the house',meaning:'The wise builder hears Jesus’ words and does them.',icon:'house'},{title:'A fragile foundation',text:'Another person builds a house on sand.',clue:'Sand beneath the house',meaning:'Hearing without doing leaves life without a firm foundation.',icon:'house'},{title:'The storm arrives',text:'Rain, floods, and wind test both houses. Only one stands.',clue:'A tested foundation',meaning:'Putting Jesus’ teaching into practice matters when life is tested.',icon:'Flag'}],options:['A story only about choosing building materials.','Hear Jesus’ words and put them into practice.','Wise people never experience storms.'],correct:1},
{title:'The Pharisee and the Tax Collector',reference:'Luke 18:9–14',panels:[{title:'A proud comparison',text:'One man thanks God that he is unlike other people and lists his achievements.',clue:'Looking down on others',meaning:'The parable challenges confidence built on superiority.',icon:'Crown'},{title:'An honest plea',text:'The other stands at a distance and asks God for mercy.',clue:'Asking for mercy',meaning:'He approaches God with humility about his need.',icon:'Heart'},{title:'A surprising verdict',text:'Jesus says the humble man goes home justified.',clue:'Humility is received',meaning:'Jesus teaches that those who humble themselves will be exalted.',icon:'house'}],options:['Impress God by comparing yourself with others.','Approach God with humility rather than self-righteousness.','Never pray in a public place.'],correct:1}];
export const trivia=[
['Who built the ark?','Noah',['Moses','David'],'Genesis 6:13–22'],
['Who led Israel out of Egypt?','Moses',['Solomon','Jonah'],'Exodus 3:10'],
['Who faced Goliath with a sling?','David',['Saul','Samuel'],'1 Samuel 17'],
['Who stayed with Naomi?','Ruth',['Esther','Martha'],'Ruth 1:16–17'],
['Who prayed in a lions’ den?','Daniel',['Elijah','Peter'],'Daniel 6'],
['Who was swallowed by a great fish?','Jonah',['Joshua','Philip'],'Jonah 1:17'],
['Where was Jesus born?','Bethlehem',['Nazareth','Rome'],'Luke 2:4–7'],
['Who baptised Jesus?','John the Baptist',['Paul','James'],'Matthew 3:13–17'],
['What did Jesus turn water into at Cana?','Wine',['Oil','Honey'],'John 2:1–11'],
['What did the Good Samaritan show?','Mercy',['Indifference','Pride'],'Luke 10:25–37'],
['In Jesus’ story, what did the wise builder build on?','Rock',['Sand','Grass'],'Matthew 7:24–27'],
['What did the father do when his younger son returned?','Welcomed him',['Locked the gate','Sent him away'],'Luke 15:20–24'],
['What is the first fruit listed in Galatians 5:22?','Love',['Strength','Wealth'],'Galatians 5:22–23'],
['In Ephesians 6, what is the sword of the Spirit?','The word of God',['Personal fame','A loud voice'],'Ephesians 6:17'],
['Which disciple denied knowing Jesus three times?','Peter',['Andrew','Thomas'],'Luke 22:54–62'],
['Who climbed a sycamore tree to see Jesus?','Zacchaeus',['Nicodemus','Lazarus'],'Luke 19:1–10'],
['Who visited Jesus at night?','Nicodemus',['Pilate','Herod'],'John 3:1–2'],
['What image does Jesus use for himself in John 15?','A vine',['A mountain','A city'],'John 15:1–5'],
['What did Jesus feed a crowd with, starting from a boy’s lunch?','Loaves and fish',['Grapes and cheese','Rice and beans'],'John 6:1–13'],
['Who first heard the angels’ announcement in the fields?','Shepherds',['Roman soldiers','Temple merchants'],'Luke 2:8–14'],
['Which city’s walls fell after Israel marched around it?','Jericho',['Athens','Damascus'],'Joshua 6'],
['Who interpreted Pharaoh’s dreams?','Joseph',['Isaac','Esau'],'Genesis 41'],
['What did God place in the clouds as a covenant sign after the flood?','A rainbow',['A crown','A ladder'],'Genesis 9:12–17'],
['Who was called to leave his homeland with a promise of blessing?','Abraham',['Goliath','Pharaoh'],'Genesis 12:1–3'],
['What did Moses see burning without being consumed?','A bush',['A boat','A stone'],'Exodus 3:1–6'],
['What did Solomon ask God for?','An understanding heart',['More horses','A longer reign'],'1 Kings 3:5–12'],
['Who approached the king to help save her people?','Esther',['Delilah','Jezebel'],'Esther 4–5'],
['Which man was raised after four days in the tomb?','Lazarus',['Stephen','Barnabas'],'John 11:17–44'],
['Which apostle is associated with journeys alongside Barnabas?','Paul',['Thomas','Judas'],'Acts 13–14'],
['What does Psalm 119:105 compare God’s word to?','A lamp',['A sword of iron','A hidden coin'],'Psalm 119:105'],
['What does Proverbs 15:1 say turns away wrath?','A soft answer',['A clever insult','A louder argument'],'Proverbs 15:1'],
['How does 1 Corinthians 13 describe love?','Patient and kind',['Boastful and proud','Jealous and harsh'],'1 Corinthians 13:4'],
['What did the shepherd do for the lost sheep?','Searched until he found it',['Forgot it','Replaced it immediately'],'Luke 15:3–7'],
['What happened to the seed in good soil?','It bore fruit',['It stayed hidden forever','Birds took all of it'],'Matthew 13:23'],
['Who said, “Speak; for thy servant heareth”?','Samuel',['Saul','Solomon'],'1 Samuel 3:10'],
['What did Jesus say to do for enemies?','Love them',['Humiliate them','Ignore every need'],'Matthew 5:44']
].map(([question,answer,decoys,reference],id)=>({id:'trail-'+id,question,answer,decoys,reference}));

// Share the enlarged Scripture bank with Scroll Quest and the older verse games.
import {questions as libraryQuestions,verses as libraryVerses} from './bible/content.mjs';
const knownTrivia=new Set(trivia.map(q=>q.question.toLowerCase()));
trivia.push(...libraryQuestions.filter(q=>!knownTrivia.has(q.prompt.toLowerCase())).map(q=>({id:'library-'+q.id,question:q.prompt,answer:q.answer,decoys:q.options.filter(a=>a!==q.answer),reference:q.ref})));
const knownVerses=new Set(extraVerses.map(v=>v.reference));
extraVerses.push(...libraryVerses.filter(v=>!knownVerses.has(v.ref)).map((v,i)=>({id:'library-verse-'+i,reference:v.ref,text:v.excerpt,keywords:v.excerpt.toLowerCase().replace(/[^a-z ]/g,'').split(/\s+/).filter(w=>w.length>4).slice(0,3),translation:'KJV',themes:['faith'],difficulty:1})));

const newArmorScenarios={
 truth:['You hear a rumour about a classmate. You check what is true before repeating it.','A report makes your team look better than it really did. You choose an accurate account.','You are asked to copy an answer and pretend it is your own. You choose honesty.','A friend shares a misleading quotation. You look up what the passage actually says.'],
 righteousness:['Someone offers you an unfair advantage in a competition. You choose to follow the rules.','You notice a younger child is being treated unfairly. You stand up for what is right.','You could hide a mistake that cost the group time. You take responsibility and help put it right.','A shop gives you too much change. You return what is not yours.'],
 peace:['A new neighbour is anxious about joining a church gathering. You offer a gentle welcome.','Two friends are speaking past one another. You help them listen without taking sides.','Your group disagrees about a plan. You make room for a calm conversation.','You prepare to share the good news with someone respectfully rather than picking an argument.'],
 faith:['A plan has changed and you feel unsettled. You remember God’s faithfulness while taking the next wise step.','You are trying something worthwhile but fear failure. You trust God rather than demanding certainty.','A difficult week tempts you to give up hope. You remember that God can be trusted.','You face a hard choice without every answer. You pray and keep trusting God.'],
 salvation:['A past failure makes you feel beyond help. You remember the hope of God’s saving work.','You worry that you are only as valuable as your achievements. You remember the salvation God offers.','You feel crushed by shame and turn toward God’s promise of rescue.','You need hope that rests in God’s saving work rather than your own impressive record.'],
 spirit:['An unkind joke seems acceptable until you remember a passage about loving your neighbour.','You need guidance and open Scripture rather than following a convenient slogan.','A tempting shortcut conflicts with a passage you have been learning. You let that word shape your response.','You compare a dramatic claim about God with what the Bible actually teaches.'],
};
for(const [key,items]of Object.entries(newArmorScenarios))armorAlternates[key].push(...items);
const newFruitScenarios={
 love:['You include someone whose interests are different from yours.','You make time for a lonely neighbour without expecting anything back.','You share your best supplies rather than only your leftovers.','You celebrate a friend even when you hoped to receive the same award.'],
 joy:['You take delight in a small sign of God’s goodness during a difficult week.','You join a friend’s celebration with a glad and generous heart.','You remember an answered prayer and give thanks with delight.','You notice something good in an ordinary day and share your gladness.'],
 peace:['You speak calmly when a group chat becomes heated.','You help friends clear up a misunderstanding without spreading it.','You apologise and seek to restore a strained friendship.','You listen carefully before responding to a sharp remark.'],
 patience:['A younger child needs the instructions repeated. You explain them again without irritation.','You wait for a slow reader to finish rather than rushing them.','A plan takes longer than expected. You keep helping without grumbling.','You allow someone time to learn a skill instead of demanding instant success.'],
 kindness:['You offer a seat to someone who is tired.','You help a classmate gather the books they dropped.','You notice a newcomer has nobody to sit with and invite them over.','You leave an encouraging note for someone facing a hard day.'],
 goodness:['You report an error even though hiding it would benefit you.','You choose a fair way to divide the shared supplies.','You return a lost item without taking anything from it.','You refuse to join in a dishonest plan even when friends approve.'],
 faithfulness:['You keep turning up to help with a quiet weekly task.','You complete the responsibility you promised to do.','You care for a shared garden even after the excitement has worn off.','You remember a commitment when a more tempting invitation arrives.'],
 gentleness:['You explain a mistake without embarrassing the person who made it.','You lower your voice when someone is frightened.','You respond to a younger child’s question with care.','You give honest feedback in a way that respects the other person.'],
 self_control:['You pause before sending a message written in anger.','You stop playing when your agreed break time arrives.','You resist taking more than your fair share.','You take a breath before reacting to a frustrating mistake.'],
};
for(const [key,items]of Object.entries(newFruitScenarios))fruitAlternates[key].push(...items);
