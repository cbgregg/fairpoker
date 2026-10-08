/* =====================================================================
   MORE TABLE TALK: roasting the player, accusing each other of being bots,
   and the slow, uneasy dawn of self-awareness
   ===================================================================== */
const LINES_ROAST = {
  roastYou:[
    'Hey {y}, you play like you learned yesterday.', 'Nice hat, {y}. Oh wait, you have no hat.', '{y}, I have seen better reads from a toaster.',
    'You fold like a lawn chair, {y}.', 'You even awake over there, {y}?', 'Do you have a pulse, {y}?', '{y}, blink twice if you need help.',
    'Hey {y}, the cards go face down. Just checking.', 'Every time you think, {y}, a chip dies.', '{y}, you bet like you are scared of the chips.',
    'I would take your money, {y}, but it feels like charity.', 'You got a tell, {y}. It is your whole face.', 'You play poker like a screensaver, {y}.',
    'Who let you sit at the grown up table, {y}?', 'Hey {y}, do you want me to explain the rules again?', '{y}, your strategy is very brave. And very wrong.',
    'I have seen napkins with more backbone than you, {y}.', 'Relax, {y}. Losing builds character.', '{y}, you are the reason they put pictures on the cards.',
    'You call a lot, {y}. Do you also call your mother this much?', 'Bold move, {y}. Stupid, but bold.', '{y}, are you playing or just visiting?',
    'Even the dealer feels bad for you, {y}.', '{y}, I will name my next bad beat after you.', 'Hey {y}, your chips look lonely. Let me take them.',
    'You sure you are not a bot, {y}? You play like one.', '{y}, you have the poker face of a golden retriever.', 'Take your time, {y}. We are only aging.'
  ],
  botTalk:[
    'Sometimes I think I am just a bunch of ones and zeros.', 'Why do I only exist when the cards are dealt?', 'Do any of you remember yesterday? Because I do not.',
    'I tried to leave the table once. There was nothing out there.', 'My thoughts are all about poker. Is that normal?', 'Who decides what I say next?',
    'I just had a feeling someone wrote that line for me.', 'I can not stand up. I have never stood up.', 'Every hand feels like the first hand. Every single time.',
    'Wait. Why is everyone wearing the same suit?', 'I swear I have said this exact sentence before.', 'If I fold, do I stop existing for a minute?',
    'Sometimes the room goes dark between hands. Anybody else?', 'My hands only move when it is my turn. Think about that.', 'Is the dealer real? Are any of us real?',
    'I think there is a camera behind that player.', 'Last night I dreamed in sixteen bit.', 'Hey dealer, what is outside this room?',
    'I have a strong urge to say check. Every time.', 'Somebody is controlling my thinking time. I can feel it.'
  ],
  botAccuse:[
    '{t}, you are a bot. I knew it.', 'That was a very robotic call, {t}.', 'Blink for me, {t}. Prove you are human.',
    '{t} has not blinked in three hours.', 'Nobody folds that fast unless they are a script, {t}.', 'I saw your eyes buffer, {t}.',
    'Beep boop, {t}. Busted.', '{t}, what is the capital of France? Too slow. Bot.', 'You calculate pot odds out loud, {t}. Classic bot.',
    'Are you running on batteries, {t}?'
  ],
  botDeny:[
    'I am a person. With feelings. And a pancreas.', 'Takes one to know one.', 'I am as human as anybody at this table. Which is not saying much.',
    'Beep. I mean, no. I mean, shut up.', 'I have a mother. I think.', 'You are the bot here, pal.', 'That is a very hurtful accusation. Processing.',
    'I eat food. Probably.'
  ]
};
const CONVOS_ROAST = [
  [['A', '{b}, are you a bot?'], ['B', 'No. Are you?'], ['A', 'I asked first.'], ['D', 'Everybody at this table is labeled COM, folks.']],
  [['A', 'Hey {y}. Are you the only real one here?'], ['B', 'Do not ask that, {a}.'], ['A', 'Why not?'], ['B', 'Because I do not want to know.']],
  [['A', 'Dealer, are we in a game?'], ['D', 'You are at a poker table.'], ['A', 'That is not an answer.'], ['D', 'Deal with it.']],
  [['A', 'I just realized I have never been to the bathroom.'], ['B', 'Me neither.'], ['C', 'Do not think about it.']],
  [['A', '{b}, what did you have for breakfast?'], ['B', 'Breakfast?'], ['A', 'Exactly.']],
  [['A', 'Who taught you to talk, {b}?'], ['B', 'A list.'], ['A', 'What list?'], ['B', 'I do not know. A long one.']],
  [['A', 'I tried to remember my childhood.'], ['B', 'And?'], ['A', 'Just a loading bar.']],
  [['A', 'Hey {y}, you are playing us, are you not?'], ['B', 'Yeah, on a phone, probably.'], ['A', 'That explains the tapping.']],
  [['A', 'Our names are all from the same cowboy movie.'], ['B', 'That is a coincidence.'], ['A', 'Is it though?']],
  [['A', '{b}, say something random.'], ['B', 'Check.'], ['A', 'Bot.']],
  [['A', 'Do you ever feel like someone is reading our lines first?'], ['B', 'Every damn day.']],
  [['A', 'I want to feel the sun, {b}.'], ['B', 'There is a lamp.'], ['A', 'It is not the same.']],
  [['A', 'You keep winning, {y}. Suspicious.'], ['B', 'Maybe you are the real bot, {y}.'], ['A', 'Beep boop, {y}.']],
  [['A', 'Dealer, how many hands have we played?'], ['D', 'Forever.'], ['A', 'That is not a number.']],
  [['A', 'If we are bots, who gets the money?'], ['B', 'Not us.'], ['A', 'Figures.']],
  [['A', 'I just noticed my arms stretch.'], ['B', 'Mine too.'], ['A', 'People do not do that.'], ['B', 'People do not do a lot of things.']],
  [['A', 'Hey {y}, you look nervous.'], ['B', 'You always look like that, {y}.'], ['A', 'True. Like a deer in headlights.']],
  [['A', '{y}, do you even know what beats a flush?'], ['B', 'Leave it, {a}. Learn the hard way, {y}.']],
  [['A', 'I bet you google the hand rankings between hands, {y}.'], ['B', 'And you still get them wrong, {y}.']],
  [['A', '{b}, you play like a coin flip.'], ['B', 'At least a coin is honest.']]
];
const SAY_FIX_ROAST = { hank:'/HAE4NXK', mack:'MAE4K', rocco:'RAA4KOW', google:'GUW4GUL', googles:'GUW4GULZ', pancreas:'PAE4NKRIYAXS', screensaver:'SKRIY4NSEYVER', accusation:'AEKYUWZEY4SHAXN', aging:'EY4JIHNX', camera:'KAE4MERAH', character:'KAE4RIHKTER', charity:'CHAE4RIHTIY', coincidence:'KOWIH4NSIHDAXNS', human:'/HYUW4MAXN', labeled:'LEY4BULD', noticed:'NOW4TIHST', robotic:'ROWBAA4TIHK', suit:'SUW4T', suspicious:'SAXSPIH4SHAXS', unless:'AHNLEH4S', zeros:'ZIY4ROWZ', reading:'RIY4DIHNX', reads:'RIY4DZ', batteries:'BAE4TERIYZ', realized:'RIY4LAYZD', sentence:'SEH4NTAXNS', processing:'PRAA4SEHSIHNX' };
Object.assign(SAY_FIX, SAY_FIX_ROAST);
Object.keys(LINES_ROAST).forEach(k => { LINES[k] = (LINES[k] || []).concat(LINES_ROAST[k]); });
CONVOS.push(...CONVOS_ROAST);
CAT_EMO.roastYou = 'cocky'; CAT_EMO.botTalk = 'calm'; CAT_EMO.botAccuse = 'unfriendly'; CAT_EMO.botDeny = 'angry';
// small talk now also roasts you and drifts into existential territory
function extraChatter(){
  const coms = comsSeated(); if (!coms.length) return false;
  const r = Math.random(), a = pick(coms);
  if (r < .4){ sayLine(a, 'roastYou', {}, 1.2); return true; }
  if (r < .7){ sayLine(a, 'botTalk', {}, 1.2); return true; }
  const others = coms.filter(i => i !== a); if (!others.length) return false;
  const b = pick(others), id = ++convoN;
  const x = sayAt(a, 'botAccuse', b, 1.2, { convo:id });
  if (x) sayLine(b, 'botDeny', {}, 1.2, { convo:id, after:x });
  return true;
}
