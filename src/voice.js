/* =====================================================================
   VOICES — SAM (1982) speech for the dealer and COM players, with
   speech bubbles and moving mouths. Toggle: Settings → Voices and dialogue.
   ===================================================================== */
const VOICE_D = { speed:76, pitch:58, throat:132, mouth:128 };
const VOICE_P = [         // all men: SAM pitch numbers above 60 sit low
  { speed:72, pitch:68, throat:128, mouth:128 }, { speed:82, pitch:76, throat:110, mouth:105 },
  { speed:92, pitch:62, throat:190, mouth:190 }, { speed:84, pitch:84, throat:145, mouth:145 },
  { speed:76, pitch:70, throat:150, mouth:160 }, { speed:70, pitch:88, throat:120, mouth:135 },
  { speed:86, pitch:66, throat:170, mouth:150 }, { speed:78, pitch:80, throat:115, mouth:115 }
];
const LINES = {
  shuffle:['Shuffle up and deal.', 'Cards in the air.', 'Good luck everyone.', 'Here we go again.', 'New hand. Ante up.', 'Fresh deck, fresh start.',
    'Lets get this one going.', 'Alright folks, new hand.', 'Mix em up.', 'Riffle and deal.', 'May the cards be kind.', 'Place your bets, folks.', 'Here we go. Play nice.'],
  dealt:['Cards are out.', 'Everybody has two.', 'Action is open.', 'Look em over.', 'Good luck.'],
  flop:["Here's the flop.", 'The flop.', 'Three cards. The flop.', 'Flop coming down.', "Let's see a flop.", 'Three on the board.', 'And the flop is out.'],
  turn:["Here's the turn.", 'Turn card.', 'Fourth street.', 'And the turn.', 'One more for the turn.', 'Turn is out.'],
  river:['And the river.', 'River card.', 'Last card. The river.', 'Here comes the river.', 'The river. Final card.', 'Down the river.'],
  showdown:['Show them.', 'Turn them over.', 'Lets see what you got.', 'Cards up, folks.', 'Showdown.', 'Moment of truth.'],
  win:['{n} wins.', 'Pot goes to {n}.', '{n} takes it down.', 'Winner. {n}.', 'Ship it to {n}.', 'Nice pot, {n}.', 'Push it to {n}.'],
  winHand:['{n} wins with {h}.', '{h}. {n} takes the pot.', '{n} scoops it with {h}.', '{h} is good. {n} wins.', '{n} has {h}. Thats the winner.'],
  split:['Split pot.', 'We chop it up.', 'Even split, folks.', 'Chop chop.'],
  allinD:['We have an all in.', 'All in. Big one.', 'Somebody is feeling lucky.', 'All the chips are going in.', 'Oh boy. All in.', 'Thats a lot of money.', 'Hell of a bet.'],
  bigBet:['Big bet.', 'Ooh, pressure.', 'Thats a raise.', 'Getting spicy.', 'Somebody means business.'],
  yourTurn:['Action is on you.', 'Your move.', 'Up to you, friend.', 'Whats it gonna be?', 'Over to you.'],
  youWin:['Nice hand, friend.', 'Well played.', 'You take it.', 'Look at you go.', 'Big winner over here.', 'Damn. Nice hand.'],
  dealerChat:['Anyone want a drink?', 'Quiet table tonight.', 'I have been dealing for thirty years.', 'Keep your cards on the table, please.',
    'No splashing the pot.', 'Tips are appreciated.', 'Beautiful night for poker.', 'My feet hurt.', 'Who ordered the sandwich?', 'Lets keep it moving, folks.',
    'Hell of a table tonight.', 'Nobody touch my mustache.', 'Two more hours on this shift. Kill me.'],
  chide:['Language, please.', 'Hey. Watch the mouth.', 'Keep it clean, folks.', 'Easy with the cussing.', 'This is a classy joint. Sort of.'],
  check:['Check.', 'Check.', 'Check.', 'I check.', 'Knock knock.', 'Check it to you.', 'Tap tap.', 'Pass.', 'Check. Your move.', 'Checking.'],
  call:['Call.', 'Call.', 'I call.', "I'll see it.", 'Sure. I call.', 'Lets see one.', 'I am in.', 'Fine. Call.', 'Cant fold this.', 'Ugh. Fine. Call.', 'What the hell. Call.', 'I call your bullshit.'],
  raise:['Raise.', 'Raise.', 'Bump it up.', 'Raise it.', "Let's make it interesting.", 'More.', 'I raise.', 'Lets go bigger.', 'Up it goes.', 'Raise. Deal with it.', 'Lets make it hurt.'],
  bet:['Bet.', 'Bet.', 'I bet.', "I'll bet.", 'Lets put some money in.', 'Bet it.', 'Leading out.'],
  allin:['All in.', "I'm all in.", 'Shove it all in.', 'Everything. All in.', 'All of it.', 'Lets gamble.', 'I am all in, baby.', 'Screw it. All in.', 'Hell with it. All in.'],
  fold:['Fold.', "I'm out.", 'Too rich for me.', 'Nope.', 'I fold.', 'Not this time.', 'Garbage. Fold.', 'Muck it.', 'Screw it. Fold.', 'Hell no.', 'Shit. Fold.', 'These cards are crap.'],
  thinking:['Hmm.', 'Let me think.', 'Decisions, decisions.', 'What do you have?', 'I dont know about this.', 'Interesting.', 'Hmm. Tough spot.', 'Ugh. Damn it.'],
  tough:['Wow.', 'Thats a big bet.', 'Are you serious?', 'Oh come on.', 'Jesus.', 'Well, shit.'],
  toughAt:['{t}, you are full of shit.', 'Come on, {t}. Really?', 'Oh, {t} wants to play.', '{t} has it. Of course.', 'Damn it, {t}.', 'I think {t} is bluffing.',
    'Every damn hand, {t}.', 'You got it this time, {t}?', 'What are you doing, {t}?', 'Easy there, {t}.'],
  retort:['Call it then.', 'Put your money where your mouth is.', 'Try me.', 'Shut up and play.', 'Mind your own damn business.', 'Find out.', 'You scared?', 'Cry about it.'],
  comWin:['Thank you very much.', 'Ship it.', 'Come to papa.', 'Yes!', 'Lucky me.', 'I knew it.', 'Easy money.', 'Thats how its done.', 'Hell yes.', 'Damn right.', 'Thats my pot, baby.'],
  comLose:['Unbelievable.', 'Every time.', 'Nice hand.', 'Oh no.', 'I should have folded.', 'Rigged, I tell you.', 'Ouch.', 'Not again.',
    'Son of a bitch.', 'Are you kidding me?', 'God damn it.', 'Bullshit.', 'Shit.', 'Every damn time.', 'This deck hates me.'],
  loseTo:['{t}, you lucky bastard.', 'Nice hand, {t}. I hate you.', 'Really, {t}? With that?', 'Of course {t} hits.', 'Damn you, {t}.', 'Unbelievable, {t}.', 'Enjoy it, {t}. Wont last.'],
  gloat:['Sorry, {t}. Not sorry.', 'Thanks for the chips, {t}.', 'Better luck next time, {t}.', 'Read you like a book, {t}.', 'Thats what you get, {t}.', 'Dont cry, {t}.', 'Sit down, {t}.'],
  bust:['I am done.', 'Thats it for me.', 'Good game everyone.', 'Back to the bar.', 'Busted.', 'Well, shit.', 'Screw this game.', 'Somebody buy me a drink.'],
  praise:['Nice hand, {y}.', 'Well played, {y}.', 'Damn, {y}. Good call.', 'You got me, {y}.', 'Respect, {y}.', 'Alright {y}, I see you.', 'Good hand.'],
  salty:['Lucky river, {y}.', 'You called with that, {y}?', 'Must be nice, {y}.', 'Beginners luck.', 'Bullshit, {y}.', '{y}, you lucky son of a bitch.', 'Unreal. Un real.'],
  nudge:['Any day now, {y}.', 'Clocks ticking, {y}.', 'Hey {y}. You awake?', 'Take your time. Seriously. All night.', 'Come on, {y}.', 'Jesus Christ, {y}. Act.',
    'Uh oh. Somebody is thinking.', 'Whats it gonna be, {y}?', 'We are getting old here, {y}.'],
  atYouBet:['Oh, you got something, {y}?', 'Here we go.', 'You want it that bad, {y}?', 'Easy there, {y}.', 'I dont buy it, {y}.', 'Bullshit, {y}.', 'Well, damn.', 'Look who woke up.'],
  atYouAllin:['Whoa. All in, {y}?', 'Holy shit.', 'You sure about that, {y}?', 'Ballsy, {y}.', 'Somebody call a doctor.', 'Oh hell.'],
  atYouFold:['Smart move, {y}.', 'Chicken.', 'Thats what I thought.', 'Bye bye, {y}.', 'Coward.'],
  chatter:['Anyone see the game last night?', 'My wife thinks I am at the office.', 'This seat is cursed.', 'I am due for a good hand.',
    'Deal me something good.', 'Nice hat.', 'I love this game.', 'One more hand, then I go home.', 'Is it hot in here?', 'Who is winning?',
    'I play for fun. Mostly.', 'Never trust anyone who checks.', 'These cards are cold.', 'I could use a drink.', 'Feeling lucky tonight.',
    'These cards are shit tonight.', 'Who the hell shuffled this deck?', 'My ass hurts from this chair.', 'So {y}, you play much?', 'Nice to have fresh blood. Right, {y}?'],
  saloon:['Howdy, {y}.', 'I reckon so.', 'Mighty fine pot.', 'Watch yourself, {y}.', 'This town aint big enough.', 'Pass the whiskey.', 'Damn this dust.']
};
// little scenes between players (A B C = COMs, D = dealer). {a}{b}{c} = their names, {y} = what they call you
const CONVOS = [
  [['A', '{b}, you still owe me twenty bucks.'], ['B', 'I paid you last week.'], ['A', 'Like hell you did.']],
  [['A', 'Who taught you to play, {b}?'], ['B', 'Your mother.'], ['D', 'Folks. Please.']],
  [['A', '{b}, is that a new hat?'], ['B', 'Yep.'], ['A', 'Looks like shit.'], ['B', 'Thanks.']],
  [['A', 'I am up tonight.'], ['B', 'You are down three hundred, {a}.'], ['A', 'Up in spirit.']],
  [['A', 'Hey {y}. You any good?'], ['B', 'Leave the new player alone, {a}.'], ['A', 'Just asking.']],
  [['A', 'Dealer, any chance of a good card tonight?'], ['D', 'I just deal them.'], ['A', 'Then deal better.']],
  [['A', '{b}, you ever win a hand?'], ['B', 'I won one in nineteen ninety eight.'], ['A', 'Ha.']],
  [['A', 'I swear this deck is rigged.'], ['D', 'Every shuffle is verified. Check the receipt.'], ['A', 'Sure it is.']],
  [['A', 'Anybody hungry?'], ['B', 'Always.'], ['C', 'Get me a burger.'], ['D', 'No food on the felt.']],
  [['A', '{b}, quit staring at my chips.'], ['B', 'They used to be my chips.']],
  [['A', 'What time is it?'], ['B', 'Time for you to go broke.'], ['A', 'Funny.']],
  [['A', '{b}, that bluff earlier was garbage.'], ['B', 'It worked.'], ['A', 'Still garbage.']],
  [['A', 'I should have stayed home.'], ['B', 'We all wish you had, {a}.']],
  [['A', 'Damn, its cold in here.'], ['D', 'Thermostat is broken.'], ['B', 'Like your poker game, {a}.']],
  [['A', 'Awful quiet over there, {y}.'], ['B', 'The quiet ones are dangerous.'], ['A', 'Or just bad.']],
  [['A', 'You smell that?'], ['B', 'Thats {c}.'], ['C', 'Hey!']],
  [['A', 'I read a book on poker.'], ['B', 'Did it help?'], ['A', 'Hell no.']],
  [['A', '{b}, my grandma plays better than you.'], ['B', 'Your grandma took my money last week.'], ['A', 'Thats true, actually.']],
  [['A', 'Dealer, how long you been doing this?'], ['D', 'Too damn long.']],
  [['A', 'Next hand I am going all in.'], ['B', 'You say that every hand.'], ['A', 'And I mean it every time.']],
  [['A', 'Hey {y}, watch out for {b}. Total shark.'], ['B', 'Thank you, {a}.'], ['A', 'It was not a compliment.']],
  [['A', 'Who keeps farting?'], ['B', 'Not me.'], ['C', 'Definitely {b}.']],
  [['A', '{b}, you look tired.'], ['B', 'You look broke.']],
  [['A', 'I dreamed about pocket aces last night.'], ['B', 'Only place you will ever see them.']],
  [['A', 'Can we get some music in here?'], ['D', 'No.'], ['A', 'Damn.']],
  [['A', 'Hey {y}. Whats your secret?'], ['B', 'Luck.'], ['A', 'I was asking {y}, {b}.']],
  [['A', 'Sorry about earlier, {b}.'], ['B', 'No you are not.'], ['A', 'No. I am not.']],
  [['A', '{b}, you gonna tip the dealer ever?'], ['B', 'When he deals me a hand.'], ['D', 'Cheap bastard.']],
  [['A', 'I got a system.'], ['B', 'Does the system involve losing?'], ['A', 'Shut up, {b}.']],
  [['A', 'Hey {b}. Five bucks says the new player wins the next one.'], ['B', 'Deal.'], ['C', 'I want in on that.']],
  [['A', 'This chair squeaks.'], ['B', 'So does your voice, {a}.'], ['A', 'Wow.']],
  [['A', 'You guys ever think we are just in a computer?'], ['B', 'Shut up and play, {a}.']],
  [['A', 'I am on tilt.'], ['B', 'You were born on tilt.']],
  [['A', 'Who invited this one?'], ['D', 'Everybody is welcome here.'], ['A', 'Unfortunately.']]
];
const CONVOS_THEME = {
  saloon:[
    [['A', 'Somebody pour me a whiskey.'], ['B', 'Pour your own damn whiskey.'], ['D', 'Bar opens after this hand.']],
    [['A', 'This town aint big enough for the both of us, {b}.'], ['B', 'Then git.'], ['A', 'Hmm. Good point.']],
    [['A', 'My horse is smarter than you, {b}.'], ['B', 'Your horse plays better too.']],
    [['A', '{y}, you new in town?'], ['B', 'Leave the stranger be, {a}.']]
  ],
  atari:[
    [['A', 'Why is everything so blocky?'], ['B', 'Budget cuts.']],
    [['A', 'These graphics are incredible.'], ['B', 'What graphics?']],
    [['A', 'I feel like I am made of sprites.'], ['D', 'You do.']]
  ]
};
const NICKS = ['pal', 'buddy', 'kid', 'chief', 'hotshot', 'champ', 'friend', 'ace', 'sport'];
const NICKS_SALOON = ['partner', 'stranger', 'cowboy', 'friend'];
// SAM's text reader gets some words wrong ("rye-ver", "Sill-ass"); these get hand-written phonemes instead
const SAY_FIX = {
  river:'RIH4VER', scoops:'SKUW4PS', "here's":'/HIY4RZ', "let's":'LEH4TS', ante:'AE4NTIY', interesting:'IH4NTREHSTIHNX', with:'WIHDH',
  house:'/HAW4S', royal:'ROY4AXL', sixes:'SIH4KSIHZ', seven:'SEH4VAXN', sevens:'SEH4VAXNZ', aces:'EY4SIHZ',
  "don't":'DOW4NT', "won't":'WOW4NT', "isn't":'IH4ZAXNT', "wasn't":'WAH4ZAXNT', "doesn't":'DAH4ZAXNT', "didn't":'DIH4DAXNT', "i'll":'AY4L', "i'm":'AY4M', dont:'DOW4NT', wont:'WOW4NT',
  them:'DHEHM', hey:'/HEY4', yeah:'YAE4', folks:'FOW4KS', maybe:'MEY4BIY', about:'AXBAW4T', okay:'OW4KEY4', showdown:'SHOW4DAWN', town:'TAWN', cow:'KAW', brown:'BRAWN', wow:'WAW4', ow:'AW4', allowed:'AXLAW4D',
  polite:'PAXLAY4T', online:'AANLAY4N', unlike:'AHNLAY4K', inside:'IHNSAY4D', outside:'AWTSAY4D', divide:'DIHVAY4D', alive:'AXLAY4V', advice:'AEDVAY4S', invited:'IHNVAY4TIHD', excited:'IHKSAY4TIHD',
  spirit:'SPIH4RIHT', pixels:'PIH4KSULZ', mixed:'MIH4KST', mixing:'MIH4KSIHNX', tiny:'TAY4NIY', civil:'SIH4VIHL', steak:'STEY4K', sweat:'SWEH4T', sweating:'SWEH4TIHNX', heart:'/HAA4RT', heartbreak:'/HAA4RTBREYK',
  heavy:'/HEH4VIY', bear:'BEH4R', weather:'WEH4DHER', been:'BIH4N', modest:'MAA4DIHST', nephew:'NEH4FYUW', piano:'PIYAE4NOW', probably:'PRAA4BAXBLIY', problem:'PRAA4BLAXM', proper:'PRAA4PER', protect:'PRAXTEH4KT',
  regular:'REH4GYUHLER', robbed:'RAA4BD', robot:'ROW4BAAT', robots:'ROW4BAATS', rolled:'ROW4LD', rivers:'RIH4VERZ', second:'SEH4KAXND', spouse:'SPAW4S', statement:'STEY4TMAXNT', stagecoach:'STEY4JKOWCH',
  standard:'STAE4NDERD', sunglasses:'SAH4NGLAESIHZ', swollen:'SWOW4LAXN', taxi:'TAE4KSIY', toll:'TOW4L', touch:'TAH4CH', touche:'TUWSHEY4', tournament:'TER4NAXMAXNT', truth:'TRUW4TH', tumbleweeds:'TAH4MBULWIYDZ',
  tuesday:'TUW4ZDEY', valet:'VAELEY4', virtue:'VER4CHUW', wanted:'WAA4NTIHD', woman:'WUH4MAXN', whoa:'WOW4', zero:'ZIY4ROW', soul:'SOW4L', squirrel:'SKWER4AXL', scream:'SKRIY4M', screwed:'SKRUW4D',
  satan:'SEY4TAXN', salsa:'SAA4LSAH', sarsaparilla:'SAESPAXRIH4LAH', paradise:'PAE4RAXDAYS', parents:'PEH4RAXNTS', pistol:'PIH4STUL', pizza:'PIY4TSAH', pretzel:'PREH4TSUL', pretzels:'PREH4TSULZ', priest:'PRIY4ST',
  nachos:'NAA4CHOWZ', motor:'MOW4TER', mortgage:'MAO4RGIHJ', minors:'MAY4NERZ', menace:'MEH4NIHS', lunatic:'LUW4NAXTIHK', literally:'LIH4TERAXLIY', liar:'LAY4ER', lies:'LAY4Z', liver:'LIH4VER', living:'LIH4VIHNX',
  kerosene:'KEH4RAXSIYN', judgment:'JAH4JMAXNT', honest:'AA4NIHST', holy:'/HOW4LIY', hundred:'/HAH4NDRIHD', horoscope:'/HAO4RAXSKOWP', gimme:'GIH4MIY', goodbye:'GUHDBAY4', genius:'JIY4NYAHS', figures:'FIH4GYERZ',
  famous:'FEY4MAXS', dollar:'DAA4LER', dumbass:'DAH4MAES', dismissed:'DIHSMIH4ST', decent:'DIY4SAXNT', decade:'DEH4KEYD', decaf:'DIY4KAEF', cowardly:'KAW4ERDLIY', coyotes:'KAYOW4TIYZ', cousin:'KAH4ZIHN',
  conditioning:'KAXNDIH4SHAXNIHNX', congratulations:'KAXNGRAECHAXLEY4SHAXNZ', comeback:'KAH4MBAEK', cologne:'KAXLOW4N', chili:'CHIH4LIY', cheeseburger:'CHIY4ZBERGER', chickenshit:'CHIH4KIHNSHIHT', cigarette:'SIH4GAXREHT',
  casino:'KAXSIY4NOW', calculated:'KAE4LKYUHLEYTIHD', calculations:'KAELKYUHLEY4SHAXNZ', calculator:'KAE4LKYUHLEYTER', bonus:'BOW4NAXS', bowling:'BOW4LIHNX', beautiful:'BYUW4TIHFUHL', bastards:'BAE4STERDZ',
  barrel:'BAE4RAXL', ago:'AXGOW4', apiece:'AXPIY4S', anchovies:'AE4NCHOWVIYZ', allergies:'AE4LERJIYZ', accordingly:'AXKAO4RDIHNXLIY', account:'AXKAW4NT', accountant:'AXKAW4NTAXNT', ahead:'AX/HEH4D',
  alone:'AXLOW4N', another:'AXNAH4DHER', adult:'AXDAH4LT', opening:'OW4PAXNIHNX', open:'OW4PAXN', opens:'OW4PAXNZ', telegraph:'TEH4LAXGRAEF', reward:'RIHWAO4RD', relax:'RIHLAE4KS', putting:'PUH4TIHNX',
  push:'PUH4SH', pushed:'PUH4SHT', pushing:'PUH4SHIHNX', rattler:'RAE4TLER', papa:'PAA4PAH', mama:'MAA4MAH', grandma:'GRAE4NMAA', grandpa:'GRAE4NPAA', wager:'WEY4JER', wallet:'WAA4LIHT',
  damn:'DAE4M', goddamn:'GAA4DDAE4M', dammit:'DAE4MIHT', bastard:'BAE4STERD', christ:'KRAY4ST', jesus:'JIY4ZAHS', burger:'BER4GER', thermostat:'THER4MAHSTAET', mustache:'MAH4STAESH', nineteen:'NAY4NTIY4N', ninety:'NAY4NTIY', cowboy:'KAW4BOY', bullshit:'BUH4LSHIHT', asshole:'AE4SHOWL', bitch:'BIH4CH',
  coward:'KAW4ERD', receipt:'RIHSIY4T', rigged:'RIH4GD', unfortunately:'AHNFAO4RCHAXNAXTLIY', budget:'BAH4JIHT', sideways:'SAY4DWEYZ', ugh:'AH4G', chicken:'CHIH4KIHN',
  hattie:'/HAE4TIY', silas:'SAY4LAHS', mae:'MEY4', cyrus:'SAY4RAHS', wyatt:'WAY4AHT', rosa:'ROW4ZAH', eli:'IY4LAY', jeb:'JEH4B'
};
function toPhonemes(text){
  return text.split(/(\s+|[.,!?-])/).map(w => {
    if (!w || /^\s+$/.test(w)) return w ? ' ' : '';
    if (/^[.,!?]$/.test(w)) return w === '!' ? '.' : w;
    if (w === '-') return ' ';
    const k = w.toLowerCase().replace(/[^a-z']/g, '');
    if (SAY_FIX[k]) return SAY_FIX[k];
    const conv = x => { try { return (SamJs.convert(x) || '').trim(); } catch(e){ return ''; } };
    if (/[^p]ps$/.test(k) && k.length > 3) return conv(k.slice(0, -1)) + 'S';          // SAM drops the p in "chips", "keeps"
    if (k.length > 5 && /e[rn]ed$/.test(k)) return conv(k.slice(0, -2)) + 'D';      // "ordered", "happened"

    try { return (SamJs.convert(k.replace(/'/g, '')) || '').trim(); } catch(e){ return ''; }
  }).join('').replace(/\s+/g, ' ');
}
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
// Table talk: off · basic (just the actions and the dealer's calls) · normal · chatty
let TALK_MODE = store.get('talkmode') || (store.get('talk') === '0' ? 'off' : 'normal');
let TALK = TALK_MODE !== 'off';
const TALK_HINT = { off:'Silent table. Sound effects still play.', basic:'Just the actions and the dealer\'s calls. No chatter.',
  normal:'Actions, reactions and some small talk.', chatty:'Everyone talks. Constant trash talk and stories.' };
const TALK_FREQ = { off:0, basic:0, normal:.55, chatty:1.25 };
function setTalkMode(m){ TALK_MODE = m; TALK = m !== 'off'; store.set('talkmode', m); VQ.length = 0; }
// basic mode says only these, word for word
const BASIC = { check:['Check.'], call:['Call.'], bet:['Bet.'], raise:['Raise.'], allin:['All in.'], fold:['Fold.'],
  flop:['The flop.'], turn:['The turn.'], river:['The river.'], showdown:['Showdown.'], win:['{n} wins.'], winHand:['{n} wins with {h}.'], split:['Split pot.'] };
const MUST = new Set(['check', 'call', 'bet', 'raise', 'allin', 'fold', 'flop', 'turn', 'river', 'showdown', 'win', 'winHand', 'split']);
let CURSE = store.get('curse') !== '0';
const BAD = /\b(damn|damned|dammit|goddamn|god damn|hell|shit|bullshit|ass|asshole|bitch|bastard|crap|piss|pissed|balls|ballsy|jesus|christ|screw)\b/i;
const okLine = t => CURSE || !BAD.test(t);
const talking = {};                 // speaker key → { text, t0, until, wave }
const samCache = new Map();
// --- the voice queue: one speaker at a time, human-length pauses between lines ---
const VQ = [], spoken = new Set();
let vSeq = 0, lastEnd = 0, lastK = null, convoN = 0;
function liveSeat(k){ return k === 'D' || !!(G && G.players[k]); }
function say(k, text, prio = 1, o = {}){
  if (!TALK || !G || !text || !okLine(text)) return 0;
  if (TALK_MODE === 'basic' && !o.basic) return 0;
  if (!o.must && !o.basic && !o.after && TALK_MODE === 'normal' && Math.random() > .55) return 0;     // normal: about half the optional remarks
  const now = performance.now();
  if (prio >= 2 && !o.convo) cancelConvos();
  // a beat before people answer: quick for replies and actions, longer for remarks
  const pc = paceF();
  const gap = (o.gap ?? (o.convo ? 160 + Math.random()*520 : prio >= 2 ? 140 + Math.random()*220 : 300 + Math.random()*700))*Math.max(.45, pc);
  const lead = (o.lead || 0)*pc;
  const ttl = (o.ttl ?? (o.convo ? 30000 : prio >= 2 ? 8000 : prio >= 1.5 ? 5000 : 2600))*(o.convo ? 1 : pc);
  const it = { id:++vSeq, k, text, prio, gap, at:now + lead, exp:now + lead + ttl, after:o.after || 0, convo:o.convo || 0,
    act:VACT, street:H ? H.street : -1, hand:G.handNo, live:!!o.live || (!o.convo && prio < 2),
    tpl:o.tpl || null, emo:emoOf(o.set || '', text) };
  if (VOICE_PACK === 'studio') studioPrefetch(it);
  if (VOICE_PACK === 'neural') neuralPrefetch(it);
  VQ.push(it); pumpVoice();
  return it.id;
}
// the game moves on without waiting for the voices: lines about a moment that has passed are dropped
let VACT = 0;
function voiceTick(){ VACT++; }
const paceF = () => (G && PACE[G.cfg.speed]) || 1;
function stale(it){
  if (G && it.hand !== G.handNo && it.prio < 1.4) return true;
  if (it.prio >= 2 && it.k === 'D' && H && it.street >= 0 && H.street !== it.street && !H.done) return true;   // "here's the flop" once the turn is out
  if (!it.live) return false;
  return VACT - it.act > (paceF() < .8 ? 0 : 1);
}
let curSrc = null, curPrio = 0;
function cancelConvos(){ for (let i = VQ.length - 1; i >= 0; i--) if (VQ[i].convo) VQ.splice(i, 1); }
function pumpVoice(){
  if (!VQ.length) return;
  const now = performance.now();
  for (let i = VQ.length - 1; i >= 0; i--){
    const it = VQ[i];
    const orphan = it.after && !spoken.has(it.after) && !VQ.some(q => q.id === it.after);
    if (now > it.exp || orphan || !liveSeat(it.k) || stale(it)){
      VQ.splice(i, 1);
      if (it.convo) for (let j = VQ.length - 1; j >= 0; j--) if (VQ[j].convo === it.convo) VQ.splice(j, 1);
      i = Math.min(i, VQ.length);
    }
  }
  // a dealer call cuts off small talk instead of waiting behind it
  if (now < lastEnd && curSrc && curPrio < 1.4 && VQ.some(q => q.prio >= 2 && q.at <= now)){
    try { curSrc.stop(); } catch(e){}
    for (const k of Object.keys(talking)) if (talking[k].end > now){ talking[k].end = now; talking[k].until = now + 250; }
    lastEnd = now; curSrc = null;
  }
  if (now < lastEnd) return;
  let best = null;
  for (const it of VQ){
    if (it.at > now || (it.after && !spoken.has(it.after))) continue;
    if (!best || it.prio > best.prio || (it.prio === best.prio && it.id < best.id)) best = it;
  }
  if (!best || now < lastEnd + (best.k === lastK && !best.convo ? best.gap*.5 : best.gap)) return;
  if (VOICE_PACK === 'studio' && now - best.at < 900 && !studioReady(best)) return;     // give the recording a moment to load
  if (VOICE_PACK === 'neural' && NN.state === 'ready' && !neuralReady(best)){
    // the model is still rendering this line: wait a little, then say the plain action word or let the remark go
    const basicOk = best.set && BASIC[best.set] && NN.cache.has(neuralVoiceOf(best.k) + '|' + (NEURAL_SPEED[CAT_EMO[best.set]] || 1).toFixed(2) + '|' + BASIC[best.set][0]);
    if (now - best.at < (basicOk ? 700 : 2600)) return;
    if (!basicOk && !(best.prio >= 2)){ VQ.splice(VQ.indexOf(best), 1); return; }
  }
  VQ.splice(VQ.indexOf(best), 1);
  speak(best);
}
setInterval(pumpVoice, 50);
function speak(it){
  const { k, text } = it, now = performance.now();
  if (window.__onSpeak) window.__onSpeak(it, k === 'D' ? 'DEALER' : G.players[k].name);
  let r = null;
  if (VOICE_PACK === 'studio') r = studioSpeak(it);
  if (!r && VOICE_PACK === 'neural') r = neuralSpeak(it);
  if (!r && (VOICE_PACK === 'modern' || VOICE_PACK === 'studio')) r = modernSpeak(it);
  if (!r) r = samSpeak(it);
  talking[k] = { text:it.text, t0:now, until:now + r.dur + 900, end:now + r.dur, wave:r.wave, rate:r.rate };
  lastEnd = now + r.dur; lastK = k;
  spoken.add(it.id); if (spoken.size > 400) spoken.clear();
  // the dealer occasionally minds the language
  if (k !== 'D' && BAD.test(text) && Math.random() < .1) sayLine('D', 'chide', {}, 1, { gap:250 });
}
function samSpeak(it){
  const { k, text } = it;
  let dur = 500 + text.length*55, wave = null;
  const ac = sfx.ctx, out = sfx.out;
  if (ac && out && ac.state === 'running' && sfx.on && typeof SamJs === 'function'){
    const v0 = k === 'D' ? VOICE_D : VOICE_P[(G.players[k] ? G.players[k].id : 0) % VOICE_P.length];
    const quick = paceF() < .8, v = quick ? { ...v0, speed:Math.round(v0.speed*.8) } : v0;      // fast table: everyone talks quicker
    const key = k + '|' + text + (quick ? '|q' : '');
    let buf = samCache.get(key);
    if (!buf){
      try {
        const f = new SamJs(v).buf32(' ' + toPhonemes(text), true);
        if (f && f.length){ buf = ac.createBuffer(1, f.length, 22050); buf.getChannelData(0).set(f); buf._wave = f; if (samCache.size > 160) samCache.clear(); samCache.set(key, buf); }
      } catch(e){}
    }
    if (buf){
      const src = ac.createBufferSource(), gn = ac.createGain();
      src.buffer = buf; gn.gain.value = .6; src.connect(gn); gn.connect(out);
      src.start();
      curSrc = src; curPrio = it.prio;
      dur = buf.duration*1000; wave = buf._wave;
    }
  }
  return { dur, wave };
}
// what each COM calls you, kept for the session so it feels like a person
const NICK = {};
function nick(k){
  if (k === 'D') return 'friend';
  const key = TH.key + k;
  return NICK[key] || (NICK[key] = pick(TH.key === 'saloon' ? NICKS_SALOON : NICKS));
}
function nameOf(i, by){ return i === 0 ? nick(by) : (G.players[i] ? G.players[i].name : ''); }
function fill(text, k, v = {}){
  return text.replace('{n}', v.n || '').replace('{h}', v.h || '').replace(/\{t\}/g, v.t ?? '').replace(/\{y\}/g, () => nick(k))
    .replace(/\{a\}/g, v.a || '').replace(/\{b\}/g, v.b || '').replace(/\{c\}/g, v.c || '');
}
// pick a line nobody has heard recently
const usedLines = {};
function fresh(set, pool){
  const u = usedLines[set] || (usedLines[set] = []);
  let cand = pool.filter(t => !u.includes(t));
  if (!cand.length){ u.length = 0; cand = pool; }
  const t = pick(cand);
  u.push(t); if (u.length > Math.floor(pool.length*.7)) u.shift();
  return t;
}
const usedConvos = [];
function sayLine(k, set, vars = {}, prio = 1, o = {}){
  if (TALK_MODE === 'basic'){
    if (!BASIC[set]) return 0;
    return say(k, fill(BASIC[set][0], k, vars), Math.max(prio, 1.6), { ...o, basic:true, gap:60, set, tpl:{ t:BASIC[set][0], v:vars } });
  }
  let pool = (LINES[set] || []).filter(okLine);
  if (VOICE_PACK === 'studio' && STUDIO) pool = studioPool(k, set, pool);
  if (!pool.length) return 0;
  const tpl = fresh(set, pool);
  return say(k, fill(tpl, k, vars), prio, { ...(MUST.has(set) ? { ...o, must:true } : o), set, tpl:{ t:tpl, v:vars } });
}
// a line aimed at someone at the table (target index 0 = you)
function sayAt(k, set, target, prio = 1.5, o = {}){ return sayLine(k, set, { t:nameOf(target, k) }, prio, o); }
const comsSeated = () => G.players.map((p, i) => i).filter(i => i && G.players[i].chips > 0);
const comsLive = () => G.players.map((p, i) => i).filter(i => i && live(G.players[i]) && !G.players[i].allIn);
// a short exchange; each line waits for the one before it
function startConvo(script, cast){
  if (!script){
    let pool = CONVOS.concat(CONVOS_THEME[TH.key] || []).filter(sc => sc.every(([, t]) => okLine(t)));
    if (VOICE_PACK === 'studio' && STUDIO && STUDIO.casts){
      const seated = new Set(comsSeated().map(i => G.players[i].name));
      const ok = pool.filter(sc => { const c = STUDIO.casts[sc[0][1]]; return c && Object.entries(c).every(([r, n]) => r === 'D' || !sc.some(([rr]) => rr === r) || seated.has(n)); });
      if (ok.length) pool = ok;
    }
    let cand = pool.filter(sc => !usedConvos.includes(sc));
    if (!cand.length){ usedConvos.length = 0; cand = pool; }
    script = pick(cand); usedConvos.push(script); if (usedConvos.length > pool.length*.8) usedConvos.shift();
  }
  const roles = [...new Set(script.map(([r]) => r).filter(r => r !== 'D'))];
  if (!cast && VOICE_PACK === 'studio' && STUDIO && STUDIO.casts){
    const rec = STUDIO.casts[script[0][1]], seatOf = n => comsSeated().find(i => G.players[i].name === n);
    if (rec && roles.every(r => seatOf(rec[r]) != null)){ cast = {}; roles.forEach(r => cast[r] = seatOf(rec[r])); }
  }
  if (!cast){
    const seats = comsSeated().sort(() => Math.random() - .5);
    if (seats.length < roles.length) return false;
    cast = {}; roles.forEach((r, i) => cast[r] = seats[i]);
  }
  cast.D = 'D';
  const names = { a:cast.A ? G.players[cast.A].name : '', b:cast.B ? G.players[cast.B].name : '', c:cast.C ? G.players[cast.C].name : '' };
  const id = ++convoN; let prev = 0;
  for (const [r, t] of script){
    const k = cast[r]; prev = say(k, fill(t, k, names), 1.2, { convo:id, after:prev, must:true, set:'convo', tpl:{ t, v:names } });
    if (!prev){ for (let j = VQ.length - 1; j >= 0; j--) if (VQ[j].convo === id) VQ.splice(j, 1); return false; }   // a scene is all or nothing
  }
  return true;
}
// one player needles another, who may fire back
function jab(from, to, set = 'toughAt', back = .5){
  const id = ++convoN;
  const a = sayAt(from, set, to, 1.5, { convo:id, ttl:4000, live:true });
  if (a && to && Math.random() < back) sayLine(to, 'retort', {}, 1.5, { convo:id, after:a, ttl:6000, live:true });
}
// the table gets impatient when you take a while
let nudgeT = 0;
function yourTurnStart(){
  clearTimeout(nudgeT);
  const go = (ms, n) => { nudgeT = setTimeout(() => {
    if (!humanResolve || !TALK || TALK_MODE === 'basic') return;
    const c = comsSeated(); if (c.length) sayAt(pick(c), Math.random() < .4 ? 'roastYou' : 'nudge', 0, 1.3);
    if (n < 2) go(13000 + Math.random()*9000, n + 1);
  }, ms); };
  go(8000 + Math.random()*6000, 0);
}
function yourTurnEnd(){ clearTimeout(nudgeT); }
// how open a speaker's mouth is right now (0..1), following the voice's loudness
function mouthOpen(k, t){
  const s = talking[k]; if (!s || t < s.t0 || t > s.end) return 0;
  if (!s.wave) return .5 + .5*Math.sin((t - s.t0)/60);
  const rate = s.rate || 22050, n = Math.round(400*rate/22050), i0 = Math.floor((t - s.t0)/1000*rate), w = s.wave; let a = 0;
  for (let i = i0; i < i0 + n && i < w.length; i += 4) a += Math.abs(w[i]);
  return clamp(a/(n/4)*3, 0, 1);
}
// speech bubbles, drawn over the scene
function drawSpeech(g, t){
  for (const k of Object.keys(talking)){
    const s = talking[k];
    if (t > s.until){ delete talking[k]; continue; }
    if (t < s.t0) continue;
    let x, y, side = null, below = null;
    if (k === 'D'){
      const tq = proj({ x:TH.W/2, y:.5 }), kk = U*tq.s;
      x = tq.x + 22*kk; y = tq.y - (FP() ? 12 : TH.key === 'atari' ? 30 : 16)*kk;
      if (FP()) below = { x:tq.x, y:tq.y - 18*kk };
    } else {
      const lay = L[k]; if (!lay) continue;
      const hs = lay.headScreen || proj(lay.rail);
      x = hs.x; y = FP() ? hs.y + (lay.headR || 20)*1.4 + 22 : hs.y - 34;
      if (FP()) below = { x:hs.x, y:hs.y + (lay.headR || 20)*1.36 };
    }
    const pix = TH.key === 'atari', fs = pix ? 8 : 13;
    g.save();
    g.font = pix ? font(fs, F_UI) : font(fs, F_UI, '700');
    const tw = Math.min(CW*.6, g.measureText(s.text).width) + 16, th = fs + 12;
    const a = clamp((t - s.t0)/120, 0, 1)*clamp((s.until - t)/250, 0, 1);
    g.globalAlpha = a;
    g.fillStyle = TH.key === 'saloon' ? '#f6ecd6' : '#ffffff';
    g.strokeStyle = '#111'; g.lineWidth = pix ? 2 : 1.5;
    if (below){
      // first person: the bubble hangs under the speaker's chin, so faces and name tags stay clear
      const bx = clamp(below.x, tw/2 + 6, CW - tw/2 - 6), top = clamp(below.y + 9, 6, CH - th - 6), tx = clamp(below.x, bx - tw/2 + 8, bx + tw/2 - 8);
      g.beginPath(); g.rect(bx - tw/2, top, tw, th); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(tx - 5, top); g.lineTo(tx, top - 7); g.lineTo(tx + 5, top); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(tx - 5, top); g.lineTo(tx, top - 7); g.lineTo(tx + 5, top); g.stroke();
      g.fillRect(tx - 4, top - 1, 8, 3);
      g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(s.text, bx, top + th/2 + 1, tw - 10);
      g.restore();
      continue;
    }
    if (side){
      // first person: the bubble sits beside the speaker's face, toward the middle of the table, never over it
      // outward, away from the dealer, unless there is no room at the screen edge
      let dir = side.hx < CW/2 ? -1 : 1;
      if (side.hx + dir*(side.r + 12 + tw) < 6 || side.hx + dir*(side.r + 12 + tw) > CW - 6) dir = -dir;
      let bx = side.hx + dir*(side.r + 12) + dir*tw/2;
      bx = clamp(bx, tw/2 + 6, CW - tw/2 - 6);
      const by = clamp(side.hy, th/2 + 6, CH - th/2 - 6), edge = bx - dir*tw/2;
      g.beginPath(); g.rect(bx - tw/2, by - th/2, tw, th); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(edge, by - 5); g.lineTo(edge - dir*8, by); g.lineTo(edge, by + 5); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(edge, by - 5); g.lineTo(edge - dir*8, by); g.lineTo(edge, by + 5); g.stroke();
      g.fillRect(edge - (dir > 0 ? 0 : 2), by - 4, 2, 8);
      g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(s.text, bx, by + 1, tw - 10);
      g.restore();
      continue;
    }
    x = clamp(x, tw/2 + 6, CW - tw/2 - 6); y = clamp(y, th + 6, CH - 6);
    g.beginPath(); g.rect(x - tw/2, y - th, tw, th); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x, y + 7); g.lineTo(x + 5, y); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x, y + 7); g.lineTo(x + 5, y); g.stroke();
    g.fillStyle = TH.key === 'saloon' ? '#f6ecd6' : '#ffffff'; g.fillRect(x - 4, y - 2, 8, 3);
    g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(s.text, x, y - th/2 + 1, tw - 10);
    g.restore();
  }
}
// 8-bit dealer's mouth (his head lives in the static layer, so the moving part is drawn on top)
function drawDealerMouth(g, t){
  if (TH.key !== 'atari' && !FP()) return;
  const o = mouthOpen('D', t); if (o < .08) return;
  const tq = proj({ x:TH.W/2, y:.5 }), k = U*tq.s, hx = tq.x, hy = tq.y + 2*k - 26.6*k;
  g.fillStyle = '#3a0c0c'; g.beginPath(); g.ellipse(hx, hy + 4.7*k, 1.4*k, .3*k + o*1.3*k, 0, 0, Math.PI*2); g.fill();
}

// small talk when the table is quiet: single remarks, or little scenes between players
let nextChat = 0;
setInterval(() => {
  if (!TALK || !G || !H || dealing || document.hidden) return;
  const now = performance.now();
  if (!nextChat) nextChat = now + 6000 + Math.random()*8000;
  if (VQ.length || now < lastEnd + 2500){ nextChat = Math.max(nextChat, lastEnd + 3500 + Math.random()*5000); return; }
  if (now < nextChat) return;
  if (TALK_MODE === 'basic') return;
  nextChat = now + (11000 + Math.random()*15000)/Math.max(.3, TALK_FREQ[TALK_MODE]/.55)*(TALK_MODE === 'normal' ? 1.4 : 1);
  const r = Math.random();
  if (!humanResolve && r < (TALK_MODE === 'chatty' ? .7 : .5) && startConvo()) return;
  const coms = comsSeated();
  if (Math.random() < .45 && extraChatter()) return;
  if (Math.random() < .3 || !coms.length) sayLine('D', 'dealerChat');
  else sayLine(pick(coms), (TH.key === 'saloon' || TH.key === 'atari') && Math.random() < .4 ? TH.key : 'chatter');
}, 500);
function chance(p){ return Math.random() < p; }
