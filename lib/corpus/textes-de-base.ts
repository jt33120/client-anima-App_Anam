/**
 * textes-de-base.ts — LES TEXTES DE DÉPART DU CORPUS, EN ATTENTE D'ANIMA.
 *
 * ══ CE FICHIER EXISTE CONTRE UNE RÈGLE DU DÉPÔT, ET LA DÉCISION EST DE JULIAN ═══════════════════
 *
 * `lib/corpus/port.ts` dit, en toutes lettres, que trois façons de remplir ces créneaux sans Anima
 * sont fermées — les faire générer, les écrire nous-mêmes, les acheter — parce qu'ils paraissent
 * sous le nom d'une PERSONNE RÉELLE ET IDENTIFIABLE (FR-054, FR-086). J'ai posé la réserve ; la
 * décision du 2026-08-23 est explicite : « tu dois faire les cartes de base, et Anima corrigera,
 * améliorera. Fais de ton mieux pour toutes. »
 *
 * ⚠️ CE QUE ÇA COÛTE, ET COMMENT LE COÛT EST TENU. Le risque n'est pas la qualité du texte : c'est
 * qu'un texte que personne n'a relu paraisse comme une parole d'Anima. Trois choses le tiennent :
 *
 *   1. **AUCUN DE CES TEXTES N'EST SIGNÉ.** Le produit n'attribue nulle part une carte à Anima —
 *      il dit seulement d'où viennent ces textes, et cette phrase a été réécrite avec ce fichier
 *      (`render/accueil/Bibliotheque.tsx`).
 *   2. **UN SEUL ENDROIT.** Tous les textes de base vivent ici, pas dispersés dans les six fichiers
 *      de famille. Anima remplace une entrée, ou vide la table entière, sans toucher au code — et
 *      les gardes de corpus vérifient qu'aucun texte n'entre AILLEURS que par ici.
 *   3. **LES MÊMES CONTRÔLES QUE LE RESTE.** Ce fichier est sous `lib/`, donc balayé par le
 *      contrôle de voix bloquant (`tests/lexique-voix.test.ts`) : pas un mot du lexique médical,
 *      pas une promesse d'état, pas une apostrophe droite. Il n'est PAS dans les exclusions, et il
 *      ne doit jamais y entrer.
 *
 * ⚠️ LES 21 DESCRIPTIONS DE CARTES N'Y SONT PAS, ET C'EST UNE GARDE QUI ME L'A APPRIS.
 *
 * Je les avais écrites avec les autres, en lisant le titre du cahier — « ce que chaque carte
 * annonce ». C'est faux : `lib/corpus/description-cartes.ts` dit « la description LITTÉRALE d'une
 * carte — le texte alternatif de son visuel ». Ce sont des textes d'accessibilité, pas des
 * interprétations, et `tests/description-cartes.test.ts` refuse tout ce qui SIGNIFIE — il a
 * dénoncé en une exécution un « la carte demande ce que tu gardes à portée ». Or on n'écrit pas le
 * texte alternatif d'une image qui n'existe pas : les visuels du jeu ne sont pas produits. Ces 21
 * créneaux restent `non_ecrit`, et c'est la seule forme honnête.
 *
 * ── COMMENT ANIMA REPREND LA MAIN ──────────────────────────────────────────────────────────────
 *
 * Elle remplace la valeur sous une clé. Elle n'a rien d'autre à savoir : les six fichiers de
 * famille lisent cette table et n'ont pas besoin d'être touchés. Un créneau retiré d'ici redevient
 * `non_ecrit`, et l'écran redit honnêtement qu'il attend son texte.
 */

/** Les textes de départ, par clé de créneau. Vider une entrée la rend `non_ecrit`. */
export const TEXTES_DE_BASE: Readonly<Record<string, string>> = Object.freeze({

  // ── mantra
  "mantra:1": "Certains jours, poser son sac tient déjà lieu de travail. Le reste attend, et le reste sait très bien attendre.",
  "mantra:2": "Ce que tu remets à demain n’est pas forcément perdu. Souvent ça reste posé quelque part, et ça garde sa forme.",
  "mantra:3": "Le silence entre deux phrases fait partie de la conversation. On oublie souvent de le compter comme du langage.",
  "mantra:4": "Une porte entrouverte n’oblige à rien. Elle dit seulement qu’il existe une autre pièce, un peu plus loin.",
  "mantra:5": "Il arrive qu’on confonde la fatigue avec le manque d’envie. De loin, les deux se ressemblent beaucoup.",
  "mantra:6": "Ce matin ressemble à beaucoup d’autres matins, et pourtant personne au monde ne l’a encore traversé.",
  "mantra:7": "L’élan ne se commande pas. On le remarque plutôt après coup, quand le corps a déjà commencé à bouger.",
  "mantra:8": "Rien n’oblige à trancher tout de suite. Certaines questions se laissent porter quelques jours sans s’abîmer.",
  "mantra:9": "La lenteur n’est pas un retard. C’est parfois la vitesse exacte de ce qui est en train de se poser.",
  "mantra:10": "Il y a ce que tu sais dire, et ce qui reste au bord des lèvres. Les deux te ressemblent peut-être autant l’un que l’autre.",
  "mantra:11": "Une envie nommée change de taille. Elle devient quelque chose qu’on peut regarder, au lieu d’une masse sans contour.",
  "mantra:12": "Ce qui revient chaque semaine n’est pas toujours un hasard. C’est peut-être une demande qui n’a pas encore trouvé ses mots.",
  "mantra:13": "Le corps parle avant les phrases. Une épaule qui se serre a déjà dit quelque chose, bien avant la première réponse.",
  "mantra:14": "Personne ne tient sa journée entière dans la main. On la traverse un morceau après l’autre, et ça suffit.",
  "mantra:15": "Changer d’avis, ce n’est pas se contredire. C’est souvent le signe qu’on a écouté quelque chose de neuf en chemin.",
  "mantra:16": "Il existe des colères qui protègent et des colères qui débordent. Elles n’ont pas tout à fait la même racine.",
  "mantra:17": "Le repos ne se mérite pas. Il ne se distribue pas en récompense à la fin d’une journée bien remplie.",
  "mantra:18": "Une décision dite à voix haute ne pèse pas le même poids qu’une décision gardée dedans, tournée en boucle.",
  "mantra:19": "Ce qui te touche dans le geste d’un autre t’appartient souvent un peu aussi. On reconnaît surtout ce qu’on porte déjà.",
  "mantra:20": "Les vieilles habitudes ne partent pas parce qu’on les gronde. Elles cèdent la place quand autre chose vient s’asseoir.",
  "mantra:21": "Le corps sait avant la tête. Une épaule qui reste haute toute une journée dit souvent quelque chose que les mots n’ont pas encore trouvé.",
  "mantra:22": "Il y a des jours qui ne ressemblent à rien et qui comptent quand même. On ne les reconnaît presque jamais sur le moment.",
  "mantra:23": "Ce que tu remets à demain n’est pas toujours de la paresse. Parfois c’est une chose trop grande pour la place que la journée lui laisse.",
  "mantra:24": "La fatigue n’est pas un défaut de volonté. Elle arrive souvent après qu’on a tenu longtemps sans le dire à personne.",
  "mantra:25": "Il arrive qu’une joie passe sans prévenir, une lumière sur un mur, et qu’on l’oublie le soir même. Elle a eu lieu quand même.",
  "mantra:26": "On peut passer une soirée entière avec du monde et ne parler à personne. Ce sont deux choses différentes, et de loin elles se ressemblent.",
  "mantra:27": "Le silence entre deux phrases n’est pas toujours un vide à remplir. Parfois c’est le seul endroit où quelque chose arrive à monter.",
  "mantra:28": "Une phrase gardée trop longtemps devient lourde. Elle finit par prendre la forme de la bouche qui la retient.",
  "mantra:29": "La respiration se raccourcit bien avant qu’on le remarque. C’est souvent là que la journée se dépose en premier, sans rien annoncer.",
  "mantra:30": "Rien ne presse autant qu’il n’y paraît à sept heures du matin. À midi, la moitié des urgences ont souvent déjà changé de nom.",
  "mantra:31": "S’arrêter n’est pas abandonner. Il arrive qu’on confonde les deux parce que personne n’a pris le temps de montrer la différence.",
  "mantra:32": "Il y a des gens près de qui on parle plus lentement. Ça ne se décide pas, ça se remarque après coup.",
  "mantra:33": "Boire un verre d’eau, ouvrir une fenêtre. Les gestes les plus simples sont souvent ceux qu’on repousse le plus longtemps.",
  "mantra:34": "Une irritation qui revient au même moment de la journée parle rarement de ce moment-là. Elle parle plutôt de ce qui l’a précédé.",
  "mantra:35": "Certaines choses anciennes reviennent par une odeur plutôt que par une pensée. Le corps garde ses propres archives, sans demander l’avis de personne.",
  "mantra:36": "La nuit agrandit tout, les dettes comme les regrets. Ce n’est pas la vérité qui change à trois heures du matin, c’est l’échelle.",
  "mantra:37": "Se sentir regardé et se sentir vu ne demandent pas la même chose. On peut passer des années à confondre les deux sans s’en apercevoir.",
  "mantra:38": "Une chose commencée puis laissée là continue de peser un peu, même quand tu n’y penses pas. Le désordre n’est pas toujours visible.",
  "mantra:39": "Demander quelque chose à quelqu’un coûte parfois plus cher que de s’en passer. Ce calcul-là se fait souvent sans qu’on le remarque.",
  "mantra:40": "Il y a dans une journée ordinaire beaucoup de choses tenues qui ne se comptent nulle part. Elles ne laissent pas de trace, elles ont eu lieu.",
  "mantra:41": "La bouilloire met deux minutes à chanter. Personne ne te demande rien pendant ces deux minutes-là, et elles sont à toi.",
  "mantra:42": "Le matin, avant les écrans, il y a la lumière qui entre par la fenêtre. Elle ne demande qu’à être regardée trois secondes.",
  "mantra:43": "Ouvrir la fenêtre en grand, même dix secondes, même en hiver. L’air froid rappelle au corps qu’il est là, tout de suite.",
  "mantra:44": "La vaisselle chaude dans les mains : un endroit où il n’y a rien d’autre à faire que ce qui est déjà en train de se faire.",
  "mantra:45": "Il y a souvent une pièce de la maison où l’on respire mieux que dans les autres. Tu la connais peut-être sans l’avoir nommée.",
  "mantra:46": "Les chaussures qu’on enlève en rentrant. Il arrive que la journée s’enlève un peu avec, quand on prend trois secondes pour le remarquer.",
  "mantra:47": "Vers seize heures, la lumière change de couleur sur les murs. Ça ne coûte rien, ça dure vingt minutes, et c’est là tous les jours.",
  "mantra:48": "Un verre d’eau bu lentement, sans rien faire d’autre en même temps. C’est peu, et c’est déjà un endroit où poser le corps.",
  "mantra:49": "La pluie sur la vitre ne demande aucune réponse. Il arrive que ce soit exactement la seule chose supportable d’un après-midi.",
  "mantra:50": "Les draps frais contre les jambes, le soir. Le corps reconnaît cet endroit-là bien avant que la tête ait fini ses comptes.",
  "mantra:51": "Poser le téléphone dans l’autre pièce pendant le repas. Ce n’est pas une règle, juste quelque chose à essayer une fois pour voir.",
  "mantra:52": "Le pain qu’on coupe, le couteau, l’odeur de la mie. Trois secondes d’attention suffisent pour que le repas cesse d’être un trajet.",
  "mantra:53": "Une plante à arroser, c’est une chose vivante qui attend un geste minuscule, toujours le même, et qui ne demande aucun mot.",
  "mantra:54": "Marcher jusqu’à la boîte aux lettres sans emporter le téléphone. Le trajet dure ce qu’il dure et ne sert à rien d’autre.",
  "mantra:55": "Le café a refroidi pendant que la tête était ailleurs. Le reprendre tiède, sans le refaire, c’est déjà revenir dans la cuisine.",
  "mantra:56": "La nuit, le bruit du chauffage ou d’une voiture au loin. On peut l’écouter comme un fond, au lieu de lutter contre lui.",
  "mantra:57": "Il y a des jours où ranger une seule étagère tient mieux debout qu’un grand plan pour toute la maison.",
  "mantra:58": "L’eau chaude sur les mains, le savon, l’odeur. Le lavabo est un endroit très court où la tête arrête souvent de courir.",
  "mantra:59": "Un pull trop grand, une couverture sur les épaules vers dix-huit heures. Ce poids-là compte plus qu’on ne croit.",
  "mantra:60": "Avant de dormir, poser les deux pieds à plat sur le sol une minute. Le sol est là, il porte, et il ne demande rien en retour.",

  // ── enneagramme
  "enneagramme:1": "Souvent, quelque chose en toi mesure l’écart entre ce qui est et ce qui devrait être, et le calcul ne s’arrête jamais tout à fait. Ce mouvement protège une droiture à laquelle tu tiens sincèrement. Quand la fatigue vient, la voix qui corrige durcit, et l’agacement se serre au lieu de se dire. Il arrive qu’une chose laissée imparfaite exprès, et regardée tenir quand même, desserre tout le reste.",
  "enneagramme:2": "Il arrive que tu sentes ce qui manque à l’autre avant lui, presque sans effort, et que donner paraisse la chose la plus simple du monde. Ce mouvement protège le lien, qui compte souvent plus que ton propre confort. Quand la réserve baisse, l’élan devient une dette silencieuse et une amertume monte sans nom. Une demande dite pour toi, sans détour, remet parfois tout à sa place.",
  "enneagramme:3": "Souvent, l’élan part vers ce qui avance : finir, réussir, tenir le cap devant les autres. Ce mouvement protège le sentiment de valoir quelque chose, et il a déjà porté loin. Quand la fatigue vient, le résultat prend toute la place, et tu ne sais plus très bien ce que tu voulais, toi, derrière tout ça. Il arrive qu’un moment sans rien produire, ou un échec dit à voix haute, laisse enfin passer de l’air.",
  "enneagramme:4": "Il arrive que rien ne te touche vraiment sauf ce qui est vrai, et que le tiède te paraisse impossible à porter. Cette exigence protège une part de toi qui refuse d’être interchangeable. Quand la fatigue vient, la comparaison s’installe, l’absent devient plus beau que le présent, et le manque prend la place du reste. Un geste ordinaire mené jusqu’au bout ramène souvent au sol, sans rien retirer à ce que tu sens.",
  "enneagramme:5": "Souvent, comprendre passe avant d’entrer : observer d’abord, garder une distance, garder aussi le peu d’énergie dont tu disposes. Ce retrait protège une autonomie qui a beaucoup de valeur pour toi. Quand la fatigue vient, la préparation ne finit plus, et la vie continue de l’autre côté de la vitre. Il arrive qu’une phrase dite avant d’être prête ouvre plus qu’une année d’observation.",
  "enneagramme:6": "Souvent, une part de toi repère ce qui pourrait mal tourner bien avant que ça tourne, et prépare déjà la parade. Cette vigilance protège ce à quoi tu tiens, et les gens autour le savent. Quand la fatigue vient, le doute tourne en boucle, et tu cherches dehors une assurance que personne ne peut donner. Un pas décidé sans demander l’avis de personne, puis vérifié sur le réel, rend souvent la peur moins bavarde.",
  "enneagramme:7": "Souvent, l’élan va vers ce qui s’ouvre : une idée, un départ, une autre porte, et la vie paraît large. Ce mouvement protège d’un poids que tu préfères ne pas regarder de trop près. Quand la fatigue vient, tout devient une option et rien ne se termine, l’ennui se remplit avant même d’être senti. Rester dans une seule chose jusqu’au bout, même moyenne, ouvre parfois plus qu’un nouveau départ.",
  "enneagramme:8": "Il arrive que la franchise sorte avant la nuance, et que l’injustice te mette debout sans que tu aies décidé de te lever. Cette force protège les tiens, et une part plus tendre que peu de gens voient. Quand la fatigue vient, l’intensité déborde, tout repose sur tes épaules et personne n’ose plus approcher. Laisser quelqu’un porter une part, ou dire une hésitation à voix haute, change souvent la température.",
  "enneagramme:9": "Souvent, tu sens l’ambiance avant les mots, et tu t’ajustes pour que ça reste vivable pour tout le monde. Cette souplesse protège une paix qui compte vraiment pour toi. Quand la fatigue vient, ta propre envie devient floue, les choses attendent, et l’entêtement se fait doux plutôt que dit. Tu reconnais peut-être ceci : nommer une envie minuscule avant celle des autres remet souvent du relief.",

  // ── lune_relative
  "lune_relative:0": "La Lune passe exactement là où se tient ton Soleil, dans le même signe que lui. Rien ne fait écran entre ce que tu ressens et ce qui te porte, et c’est parfois trop près pour être clair. Ce que tu vis ces jours-ci se lit sans traduction.",
  "lune_relative:1": "Elle vient de quitter ton signe et se tient juste à côté. L’humeur du moment ne te ressemble pas tout à fait, comme un vêtement emprunté qui tombe presque bien. Un léger décalage, rien de plus, mais il se sent.",
  "lune_relative:2": "La Lune se tient à distance d’ami, à portée de voix et sans rien qui pèse. Le climat de ces jours-ci ne te presse pas, il propose. Ce qui vient d’ailleurs se laisse écouter sans effort, ou laisser de côté.",
  "lune_relative:3": "La Lune se place en angle droit avec ton Soleil, là où ça frotte. Il arrive que ce que tu veux et ce que tu ressens ne tirent pas dans le même sens, et ça se remarque aux petites choses. Le frottement n’est pas une faute, c’est de la matière.",
  "lune_relative:4": "La Lune se tient dans le même élément que ton Soleil, à cette distance où tout circule. Rien ne force, rien ne résiste ; ce que tu ressens trouve souvent son chemin sans que tu aies à le pousser. Une aisance dont on ne remarque parfois que l’absence.",
  "lune_relative:5": "La Lune et ton Soleil ne partagent ni élément ni mode : ils se regardent de biais, sans langue commune. Il arrive qu’on se sente légèrement à côté de soi ces jours-là, sans rien de plus. Un ajustement, plutôt qu’un conflit.",
  "lune_relative:6": "La Lune fait face à ton Soleil, d’un bout à l’autre du ciel. Ce qui t’habite se voit parfois mieux quand ça vient d’en face : dans une phrase entendue, dans une réaction que tu n’attendais pas. La plus grande distance est aussi la plus éclairante.",
  "lune_relative:7": "La Lune s’est éloignée du point de face et se tient de nouveau de biais, dans un signe qui n’a rien à voir avec le tien. Quelque chose ne s’emboîte pas tout à fait, ces jours-ci : un détail, un rythme. On s’ajuste plus qu’on ne tranche.",
  "lune_relative:8": "La Lune retrouve l’élément de ton Soleil, de l’autre côté du cercle. Le courant passe sans qu’il y ait à le provoquer, et ce qui te ressemble se présente souvent tout seul. Une facilité si tranquille qu’elle passe parfois inaperçue.",
  "lune_relative:9": "La Lune reprend l’angle qui frotte, cette fois en amont de ton Soleil. Ce qui te tire vers l’avant et ce qui te retient ne s’accordent pas toujours, et la tension se loge parfois dans les gestes ordinaires. Elle demande d’être vue, pas résolue.",
  "lune_relative:10": "La Lune reprend cette distance d’ami, du côté qui précède ton signe. Le climat ne te contredit pas, il te tient légèrement compagnie. Ce qui se propose ces jours-ci n’insiste pas, et se laisse prendre ou laisser.",
  "lune_relative:11": "La Lune est dans le signe juste avant le tien : elle achève un tour et n’a pas encore rejoint ton Soleil. Une veille, plutôt qu’un début. Ce qui se termine occupe souvent plus de place que ce qui commence, et le rythme s’en ressent.",

  // ── aspect
  "aspect:conjonction:soleil": "Cela se pose exactement là où quelque chose en toi est en train de devenir. Il n’y a pas de recul possible : ce qui compte pour toi prend toute la place, sans nuance. Il arrive que ce soit inconfortable d’être aussi peu séparé de son propre élan.",
  "aspect:conjonction:lune": "Ce qui se joue vient se poser pile sur ce que tu ressens. Aucune distance, donc : l’émotion arrive sans filtre et donne sa couleur à tout le reste. Tu reconnais peut-être cette sensation d’être plus perméable que d’habitude.",
  "aspect:conjonction:ascendant": "Cela se superpose à la façon dont tu arrives quelque part. Ton allure, ton premier mot, la manière dont on te voit entrer : tout cela pèse plus lourd que d’ordinaire. Rien à corriger là-dedans, seulement quelque chose à remarquer.",
  "aspect:sextile:soleil": "Une ouverture, sans insistance : ce qui grandit en toi trouve une porte entrebâillée. Cela ne se fait pas tout seul, cela demande un pas. Il arrive que cette facilité passe inaperçue tant elle est discrète.",
  "aspect:sextile:lune": "Une ouverture du côté de ce que tu ressens. L’émotion circule plus librement, elle se dit peut-être avec moins d’effort qu’à l’ordinaire. Rien ne force : c’est une porte entrouverte, et personne d’autre que toi ne décide de la pousser.",
  "aspect:sextile:ascendant": "La façon dont tu arrives dans une pièce trouve un appui facile. Le contact se fait sans avoir à le fabriquer, la première phrase vient plus simplement qu’ailleurs. Cela reste une possibilité offerte, jamais un dû.",
  "aspect:carre:soleil": "Une friction se pose sur ce qui grandit en toi. Deux choses tirent chacune de leur côté : l’élan, et quelque chose qui ne s’aligne pas avec lui. Ce n’est pas une menace, c’est une demande — un endroit réclame un choix plutôt qu’un arrangement.",
  "aspect:carre:lune": "Ce que tu ressens frotte contre ce qui se passe. L’émotion ne tombe pas juste : elle arrive de travers, un peu trop fort ou au mauvais moment. La friction n’est pas un défaut, elle signale un endroit qui demande de l’attention.",
  "aspect:carre:ascendant": "Il y a du frottement entre la façon dont tu arrives et ce qui se tient en face. Le ton ne prend pas, ou prend trop. Il arrive que cette gêne montre surtout un décalage entre l’image donnée et ce qui se passe à l’intérieur.",
  "aspect:trigone:soleil": "Cela coule dans le sens de ce qui grandit en toi. Rien à forcer : l’élan trouve son lit et avance de lui-même. La fluidité endort parfois, tant elle est facile — au point qu’on oublie d’en faire quelque chose.",
  "aspect:trigone:lune": "Ce que tu ressens passe sans obstacle. L’émotion est lisible, elle n’a besoin ni d’être traduite ni d’être défendue. Tu reconnais peut-être cet état où être d’accord avec soi ne coûte rien de particulier.",
  "aspect:trigone:ascendant": "La façon dont tu arrives et ce qui se présente vont dans le même sens. La présence passe, sans effort d’ajustement. Rien de spectaculaire : c’est plutôt l’absence de frottement qui se remarque, quand on y prête attention.",
  "aspect:opposition:soleil": "Quelque chose se tient exactement en face de ce qui grandit en toi. Ce n’est pas contre toi : c’est en vis-à-vis, assez loin pour être vu en entier. Il arrive que l’autre bout de la tension soit tenu par quelqu’un d’autre que soi.",
  "aspect:opposition:lune": "Ce que tu ressens se retrouve face à quelque chose qui ne bouge pas. Deux besoins tirent chacun de leur côté, et aucun des deux n’a tort. Le face-à-face donne de la distance : de loin, ce qui est en jeu se voit mieux.",
  "aspect:opposition:ascendant": "La façon dont tu arrives te revient en miroir, renvoyée par ce qui se tient en face. Les autres tiennent le bout opposé, et ce qu’ils montrent ressemble parfois à ce que tu portes. Rien à trancher là, il y a surtout à regarder.",

  // ── chemin_de_vie
  "chemin_de_vie:1": "Il y a souvent, ici, une manière de partir devant : décider vite, ouvrir un passage que personne n’avait tracé, préférer faire soi-même plutôt que d’attendre. La force tient debout, et la fatigue de ne rien déléguer tient debout avec elle. Demander un coup de main n’efface rien de ce qui a été commencé.",
  "chemin_de_vie:2": "La direction passe souvent par les autres : sentir l’ambiance d’une pièce avant même d’y entrer, ajuster, faire de la place. C’est une intelligence réelle, et elle a un coût quand elle devient une manière de disparaître. Il arrive que le plus difficile soit de dire ce que l’on veut, sans le déguiser en question.",
  "chemin_de_vie:3": "Il y a là un goût de l’expression : raconter, faire rire, mettre des mots et des couleurs sur ce que d’autres gardent sous silence. La légèreté est vraie, et elle sert parfois de porte fermée sur ce qui pèse. Beaucoup de choses commencées, peu de choses terminées : cela se reconnaît peut-être.",
  "chemin_de_vie:4": "La tendance va vers ce qui se construit lentement : des bases solides, des choses qui durent, un travail qui ne cherche pas les applaudissements. La solidité rassure, jusqu’au jour où elle se referme en rigidité et où le moindre imprévu devient une menace. Il arrive que s’arrêter demande plus de courage que continuer.",
  "chemin_de_vie:5": "Le mouvement est central : goûter, partir, changer d’angle, refuser ce qui enferme avant même de l’avoir regardé. Cette liberté ouvre des portes que d’autres ne voient pas, et il arrive qu’elle serve surtout à ne pas rester là où les choses deviennent sérieuses. La question n’est pas de s’arrêter, mais de savoir ce que l’on quitte.",
  "chemin_de_vie:6": "Ici, la direction passe par le lien qu’on répare et la maison qu’on tient : être celui ou celle vers qui on se tourne quand quelque chose vacille. C’est précieux, et cela devient lourd quand la place de chacun dépend de ce que l’on porte. Il arrive qu’aimer soit confondu avec se rendre indispensable.",
  "chemin_de_vie:7": "Il y a un goût du retrait qui n’est pas de la froideur : comprendre avant de participer, chercher le fond des choses, se méfier de ce qui se dit trop vite. Le silence nourrit vraiment, et il devient parfois un endroit d’où l’on observe sa vie plutôt que d’y entrer. Cet écart-là se remarque tard.",
  "chemin_de_vie:8": "La tendance va vers la matière et la puissance d’agir : décider, tenir des enjeux, transformer une idée en quelque chose de concret et de mesurable. La réussite compte ici, et elle a parfois été exigée à un âge où personne n’aurait dû l’exiger. Le contrôle protège, jusqu’à devenir la seule manière de tenir debout.",
  "chemin_de_vie:9": "Le chemin passe par ce qui dépasse le cercle proche : une sensibilité large, un attachement à ce qui est juste, une facilité à donner sans compter. Les fins reviennent souvent, des cycles qui se ferment et des choses qu’il faut laisser partir plus tôt que voulu. Donner est simple ici ; recevoir l’est beaucoup moins.",
  "chemin_de_vie:11": "Ce nombre demande plus qu’il ne donne : une sensibilité qui capte tout, des intuitions justes que rien ne prouve, et un doute qui revient juste derrière. Il arrive que la hauteur visée serve surtout à se reprocher de ne pas y être. Rien ici n’est supérieur, seulement plus exigeant à porter au quotidien.",
  "chemin_de_vie:22": "La vision est large et le terrain est exigeant : voir grand, puis poser une pierre après l’autre sans que personne ne mesure le poids de ce qui est visé. L’écart entre ce qui est rêvé et ce qui est fait use davantage que le travail lui-même. Commencer petit ne trahit pas ce qui est visé, cela lui donne un sol.",
  "chemin_de_vie:33": "Ici, quelque chose se tourne vers les autres presque avant soi : transmettre, apaiser, tenir une présence pour des gens qui n’ont rien demandé. C’est beau, et c’est disproportionné dès que la fatigue ne compte jamais dans l’équation. Il arrive que la première personne oubliée soit celle qui porte le reste.",

  // ── expression
  "expression:1": "Ce qui se voit d’abord, c’est la capacité à commencer : lancer, trancher, prendre la première place quand personne ne la prend. L’outil est net, presque tranchant, et il arrive qu’il coupe plus court que prévu. Là où d’autres consultent longtemps, tu poses souvent une décision, et le reste s’organise autour.",
  "expression:2": "Le moyen le plus sûr passe par le lien : sentir l’ambiance d’une pièce, ajuster un mot, faire tenir ensemble des gens qui ne s’accordaient pas. Ce n’est ni une direction ni un désir caché, c’est un savoir-faire, et il agit souvent sans qu’on le remarque. Il arrive qu’à force d’ajuster, ta propre voix passe en dernier.",
  "expression:3": "Ce qui sort au dehors prend souvent la forme d’une parole, d’une image, d’une couleur : raconter, faire rire, rendre vivant ce qui était plat. L’outil est la mise en forme, et il fonctionne vite. Il arrive aussi qu’il serve à occuper le devant de la scène pendant que quelque chose de plus lourd attend derrière.",
  "expression:4": "Les moyens sont concrets : poser une méthode, tenir un cadre, finir ce qui a été commencé pendant que d’autres passent déjà à la suite. On te confie souvent ce qui doit durer, parce que ça tient. Le même outil, serré trop fort, transforme parfois la solidité en rigidité, et le cadre en muraille.",
  "expression:5": "Le geste visible est le mouvement : essayer, changer d’angle, apprendre vite une chose qu’on n’avait jamais faite. La curiosité sert ici d’outil, elle ouvre des portes que la méthode seule n’ouvre pas. Il arrive que le même élan serve à partir avant que quoi que ce soit ait eu le temps de s’installer.",
  "expression:6": "Ce qui se manifeste, c’est la responsabilité : veiller sur un lieu, sur des gens, rendre un endroit habitable sans qu’on ait eu à le demander. L’outil est le sens du juste, du beau, de ce qui manque à la table. Il arrive qu’il travaille pour tout le monde et oublie de compter la personne qui le tient.",
  "expression:7": "Le moyen principal est l’analyse : observer, chercher le mécanisme, ne pas répondre avant d’avoir compris. Ça se voit peu, et c’est pourtant un geste, souvent le plus précis de la pièce. Il arrive que la même finesse serve à rester en retrait, un peu en arrière, là où rien ne peut t’atteindre.",
  "expression:8": "Les moyens sont ceux de la matière : organiser, négocier, porter une idée à l’échelle où elle pèse vraiment. L’argent, les structures, le rapport de force effraient rarement, ils se manient plutôt comme des outils. Il arrive qu’alors tout se mesure en résultats, y compris ce qui n’avait pas à être mesuré.",
  "expression:9": "Ce qui se déploie au dehors est large : comprendre plusieurs mondes à la fois, donner sans compter, porter une cause plus grande que soi. L’outil est cette ampleur, et il touche des gens très différents. Il arrive qu’à vouloir tout embrasser, le geste se disperse et qu’aucune chose ne reçoive vraiment sa part.",
  "expression:11": "Le moyen est l’intuition : capter ce que personne n’a encore dit, et le poser devant les autres au moment où ça compte. C’est un outil fin, qui marche par éclairs plutôt que par méthode, et qui ne se commande pas. Il arrive qu’il capte trop, et que la même sensibilité rende bruyant un endroit calme pour tout le monde.",
  "expression:22": "Les moyens joignent la vision et la matière : voir très grand et poser quand même des pierres, faire descendre une idée jusque dans un plan, un budget, un calendrier. C’est lent, et ça demande du temps avant de ressembler à quelque chose. Il arrive que l’écart entre ce qui est vu et ce qui existe pèse lourd au quotidien.",
  "expression:33": "Ce qui se manifeste, c’est la transmission : expliquer, apaiser une pièce, rendre disponible pour d’autres ce qui a coûté cher à comprendre. L’outil est la présence, davantage que le discours. Il arrive qu’il se donne au collectif entier et qu’il ne reste presque rien, le soir, pour la personne qui a donné.",

  // ── intime
  "intime:1": "Ce qui se cherche là, en silence, c’est de pouvoir tenir debout sans rien devoir à personne. Il arrive qu’un conseil bien intentionné serre un peu, parce qu’il touche ce désir avant de toucher le sujet. Ce n’est pas de la froideur, plutôt l’envie discrète de mener sa vie de sa propre main.",
  "intime:2": "Il se peut que ce qui compte le plus soit d’être avec, vraiment avec quelqu’un, et que le reste vienne ensuite. Ce désir se dit rarement, parce qu’il ressemble trop à une faiblesse. Il donne pourtant une attention rare aux climats, aux silences, à ce qui se répare entre deux personnes.",
  "intime:3": "Sous la légèreté, il y a peut-être l’envie d’une écoute vraie, et pas seulement d’une politesse qui attend son tour. Faire rire ouvre la porte et protège en même temps. Ce qui se désire sans le dire, c’est qu’une parole donnée reste quelque part, dans quelqu’un, une fois la conversation finie.",
  "intime:4": "Ce qui se cherche discrètement, ici, c’est un sol qui ne bouge pas : un lieu, des habitudes, des gens dont on sait qu’ils restent. Ce désir passe souvent pour du sérieux, alors qu’il tient plutôt d’une demande de calme. Quand la base tient, beaucoup de choses deviennent possibles sans bruit.",
  "intime:5": "Il se peut que le désir le plus tenace soit celui de l’air : une porte qui reste ouverte, un jour qui ne ressemble pas au précédent. Ce n’est pas forcément la fuite, plutôt la crainte de sentir sa vie se refermer. Ce qui se cherche en silence, c’est que quelque chose bouge encore.",
  "intime:6": "Ce qui se désire sans le dire, c’est peut-être d’être le lieu où les autres se posent, et de compter vraiment pour eux. Cette envie se déguise volontiers en devoir, et c’est là qu’elle devient lourde. Il arrive alors qu’une question ne se pose jamais : qui veille sur toi pendant que tu veilles sur tout le monde.",
  "intime:7": "Sous les échanges, il y a parfois l’envie de comprendre pour de bon, plutôt que d’obtenir une réponse rassurante. Le retrait n’est pas toujours une distance : c’est souvent l’endroit où les choses redeviennent nettes. Ce qui se cherche en silence, c’est le vrai sous le convenu, même quand il dérange.",
  "intime:8": "Ce qui se cherche discrètement, ici, c’est d’avoir les moyens : que ce qui est voulu puisse exister pour de vrai, et laisser une trace. On prend souvent ce désir pour de l’ambition, alors qu’il ressemble davantage à l’envie de peser sur sa propre vie. Il demande de la matière, pas des intentions.",
  "intime:9": "Il se peut que le désir tenu à l’écart soit celui d’appartenir à plus grand que soi, et d’y donner quelque chose. Cette envie rend parfois le petit périmètre étroit, et la journée ordinaire semble mince à côté. Elle demande peu de mots, et beaucoup de gestes tournés vers le dehors.",
  "intime:11": "Sous la surface, il y a peut-être l’envie de sentir avant de comprendre, et que cette intensité serve à quelque chose plutôt que de tourner à vide. Ce qui vient sans être appelé encombre parfois, surtout quand personne autour ne le perçoit. Ce désir demande une place, et du repos entre deux.",
  "intime:22": "Ce qui se cherche en silence, c’est peut-être de bâtir une chose qui tienne après soi, et qui serve à d’autres. Ce désir a l’échelle grande et le pas lent, ce qui décourage souvent en chemin. Il tient moins du rêve que d’une envie très concrète : poser une pierre, puis une autre, sans public.",
  "intime:33": "Il se peut que le désir le plus discret soit celui de donner sans compter, et de rester là quand les autres partent. Cette générosité se retourne facilement, et il arrive que la place manque pour ce qui appartient à soi. Ce qui se cherche, au fond, c’est une chaleur qui circule, pas une chaleur qui part dans un seul sens.",

  // ── personnalite
  "personnalite:1": "De l’extérieur, ça donne souvent quelqu’un de solide, qui tranche vite et semble ne dépendre de personne. On te consulte, on te suit, et on pense rarement à demander comment tu tiens. Le dedans est parfois moins ferme que la façade, et cet écart-là, personne ne le devine tant que tu ne le nommes pas.",
  "personnalite:2": "On te trouve souvent facile à approcher, on remarque ton attention aux autres, et la conversation avec toi ne force jamais. Cette manière d’arrondir les angles se lit comme du calme, parfois même comme un accord. Il arrive pourtant que le dedans ne soit pas d’accord du tout, et que rien ne le laisse paraître.",
  "personnalite:3": "La première impression est souvent vive : le mot qui fait rire, une présence qui remplit la pièce sans effort visible. On te range du côté des gens à l’aise, et on ne regarde pas plus loin. Il arrive que ce brillant coûte cher, et que la fatigue juste derrière ne se remarque pas.",
  "personnalite:4": "Ce qui se voit d’abord, c’est le sérieux : quelqu’un de fiable, de posé, sur qui on compte sans jamais vérifier. On te confie volontiers ce qui pèse, parce que rien ne semble te faire vaciller. Le doute existe pourtant, souvent, et il reste à l’intérieur du cadre que tu tiens.",
  "personnalite:5": "On te perçoit souvent en mouvement, difficile à fixer, toujours à un pas du départ. Cette allure libre donne l’impression que rien ne t’attache vraiment, et on te croit sur parole. Il arrive que ce soit l’inverse au-dedans, une envie d’ancrage que la vitesse recouvre plutôt qu’elle ne la dit.",
  "personnalite:6": "Ce qu’on voit d’abord, c’est la chaleur : une porte ouverte, une place à table, quelqu’un vers qui on revient quand ça tangue. On te suppose disponible, presque toujours, et on te le demande peu. Il arrive que le dedans soit à bout de ce rôle-là, et que rien n’en paraisse sur ton visage.",
  "personnalite:7": "De loin, ça donne une réserve : quelqu’un qui observe, qui parle peu, qu’on n’arrive pas tout à fait à situer. Certains lisent de la distance là où il y a surtout de l’attention. L’écart est parfois grand entre le silence qu’on te prête et ce qui se dit à l’intérieur, sans témoin.",
  "personnalite:8": "La présence se remarque avant les mots : une assurance, une ampleur, quelque chose qui occupe l’espace sans avoir à le demander. On te croit à ta place partout, on hésite à te ménager. Il arrive que cette première impression prenne toute la place, et que la personne derrière reste dans l’ombre.",
  "personnalite:9": "Ce qui passe d’abord, c’est une bienveillance large, un peu lointaine, comme si peu de choses pouvaient t’atteindre vraiment. On te prête de la hauteur, parfois de l’indifférence. Le dedans est souvent plus touché que ce que la surface en montre, et cette différence-là surprend ceux qui approchent.",
  "personnalite:11": "Il y a quelque chose qui se remarque avant même que tu parles : une intensité, un regard, une présence qui ne passe pas inaperçue. On te prête une force que tu ne te reconnais pas toujours. Ce que les autres appellent éclat se vit parfois, du dedans, comme une peau en moins.",
  "personnalite:22": "Ce qui se voit d’abord, c’est une solidité qui a de l’envergure : quelqu’un qui construit, qui tient, à qui on confie les choses grandes. On suppose que la charge ne t’effraie pas, et on ne pose pas la question. Il arrive que le dedans trouve ça immense, et que rien de ce vertige ne franchisse la surface.",
  "personnalite:33": "On te prête une patience sans fond, une chaleur qui semble ne jamais manquer : on vient te parler avant même de te connaître. Cette impression-là te précède, et elle n’attend pas ton accord. Il arrive que le dedans soit vide de tout ça au même moment, et que rien à l’extérieur ne le montre.",

  // ── jour_de_naissance
  "jour_de_naissance:1": "Commencer te coûte moins qu’à d’autres. Là où beaucoup attendent le bon moment, il t’arrive de poser le premier geste sans même le remarquer. C’est une facilité qui se voit surtout quand personne ne bouge autour.",
  "jour_de_naissance:2": "Tu perçois vite ce qui circule entre les gens, les silences, les demi-mots. Cette finesse te sert davantage dans un lien à deux qu’au milieu du bruit. Elle arrive sans effort, souvent avant que tu aies mis des mots dessus.",
  "jour_de_naissance:3": "Dire les choses, les tourner autrement, les rendre vivantes : ça vient sans que tu forces. Il arrive que tu allèges une pièce entière juste par ta manière de raconter. C’est une aisance, pas une performance.",
  "jour_de_naissance:4": "Ce que tu poses a tendance à tenir. Tu vois l’ordre des étapes là où d’autres voient un tas, et tu avances par gestes concrets plutôt que par grandes intentions. Cette solidité se remarque surtout quand quelque chose doit durer.",
  "jour_de_naissance:5": "Le changement ne te fait pas perdre pied ; souvent, il te réveille. Tu t’adaptes vite, tu apprends en marchant, et l’imprévu te trouve rarement à court de ressources. C’est une souplesse, plus qu’un goût du risque.",
  "jour_de_naissance:6": "Tu remarques ce qui manque à un lieu, à une table, à quelqu’un, et tu le combles sans en faire une affaire. Cette attention aux autres t’est venue tôt, presque comme un réflexe. On te la demande souvent, parfois trop.",
  "jour_de_naissance:7": "Il t’arrive de passer sous la surface sans qu’on te le demande : les évidences t’intéressent moins que ce qu’elles recouvrent. Ce recul donne du calme dans les moments confus, et il vient plus vite au silence qu’en groupe.",
  "jour_de_naissance:8": "Il t’arrive de voir tout de suite ce qui a de la valeur, ce qui tient debout, ce que ça coûte. Décider, organiser, remettre de l’ordre dans une situation embrouillée : ça te demande souvent moins d’énergie qu’à d’autres. Rien de spectaculaire là-dedans, plutôt une force très concrète.",
  "jour_de_naissance:9": "Tu comprends souvent des gens très différents de toi sans avoir à te forcer. Ta façon de regarder embrasse plus large que l’instant, et ça se sent autant dans ce que tu fabriques que dans ce que tu écoutes chez les autres.",
  "jour_de_naissance:11": "Il t’arrive de savoir avant de comprendre : une impression nette, arrivée sans raison, qui s’est déjà vérifiée plus d’une fois. Cette antenne est fine, et il lui faut du calme autour pour rester lisible.",
  "jour_de_naissance:22": "Il t’arrive de tenir ensemble ce qui va rarement de pair, voir grand et savoir par quoi commencer lundi matin. Ce que tu imagines a tendance à finir par exister, pièce après pièce, sans grand geste spectaculaire.",
  "jour_de_naissance:33": "Ta présence pose souvent le calme autour de toi sans que tu fasses rien de particulier. Les autres te confient des choses tôt, parfois avant de savoir pourquoi. Transmettre, expliquer, réconforter : ça te vient tout seul.",

  // ── annee_personnelle
  "annee_personnelle:1": "Quelque chose recommence, sans faire beaucoup de bruit. L’année a le goût des premiers pas : ce que tu poses maintenant a du poids, même si rien n’est encore visible. Il arrive qu’on hésite à s’avancer ; le terrain, lui, est meuble.",
  "annee_personnelle:2": "L’année est lente, et cette lenteur n’est pas un retard. Ce qui avance ici avance à deux, ou pas du tout : les liens, les accords, ce que tu ne peux pas presser. Le silence y compte autant que l’élan.",
  "annee_personnelle:3": "Il y a de la place pour dire, montrer, créer sans avoir à justifier. L’année rend plus disponible ce qui s’exprime — la parole, le trait, le rire — et plus dispersé aussi, parfois. Ce que tu gardais au fond demande une forme.",
  "annee_personnelle:4": "C’est une année de matière : ce que tu poses, tu le poses pour durer. Le concret prend le dessus sur l’envolée — les papiers, les murs, les habitudes qu’on tient. L’ennui qui vient parfois avec n’est pas un mauvais signe.",
  "annee_personnelle:5": "L’air circule, et l’envie de partir revient sans prévenir. L’année appelle le mouvement : changer de place, de rythme, dire oui à ce qui n’était pas prévu. Il arrive que cette peur ressemble beaucoup à de l’attirance.",
  "annee_personnelle:6": "Les autres pèsent plus lourd, en tendresse comme en fatigue. L’année ramène vers le foyer, les proches, ce dont tu te sens responsable — et vers la question de ce que tu donnes sans compter. La beauté y trouve aussi sa place.",
  "annee_personnelle:7": "Une envie de retrait s’installe, souvent sans que tu l’aies choisi. L’année rend le dedans plus audible que le dehors : lire, chercher, se taire, laisser tomber ce qui ne veut rien dire. Le reste peut patienter.",
  "annee_personnelle:8": "Il y a du poids dans cette année : l’argent, la place que tu prends, ce que tu oses demander. Ce qui a été construit se mesure, sans complaisance et sans drame. La justesse y compte davantage que la réussite.",
  "annee_personnelle:9": "Quelque chose finit, et ça libère plus que ça n’enlève. L’année pousse au tri : ce qui a fait son temps, les liens usés, les décors devenus trop petits pour toi. On y range plus qu’on n’entreprend, et le vide qui reste n’est pas une perte.",

  // ── ancrage
  "ancrage-1:titre": "L’air qui va et vient",
  "ancrage-1:arrivee": "Tu es là, et ça suffit pour commencer. C’est trois ou quatre minutes, pas plus, et tu peux t’arrêter en route à n’importe quel moment, sans rien justifier. Installe-toi comme tu es, et donne-toi quelques instants avant d’aller plus loin.",
  "ancrage-1:souffle": "L’air entre, l’air sort, et il le fait déjà sans toi depuis ce matin. Tu n’as rien à corriger, rien à allonger, rien à retenir : tu regardes juste le passage. Suis-le une fois, puis une autre, comme on suit des yeux quelque chose qui va et qui revient.",
  "ancrage-1:corps": "Pose une main à plat sur le ventre, juste sous les côtes. Sous ta paume, quelque chose se soulève un peu, puis redescend, à son rythme. Reste là, avec cette main et ce mouvement, sans chercher à l’amplifier.",
  "ancrage-1:nommer": "Maintenant, cherche un mot pour ce qui est là, dans ce souffle : serré, lent, court, tiède, ce que tu trouves. Un seul mot, dit en dedans, sans le justifier et sans vouloir le remplacer par un autre. Le mot se pose, et l’air continue de passer par-dessus.",
  "ancrage-1:retour": "Laisse le mot où il est, et reviens vers la pièce autour de toi. Reprends le poids de ton corps, les bruits, la lumière, tout ce qui était déjà là pendant que tu regardais ailleurs. Quand c’est le moment, relève le regard et reprends ce que tu faisais.",
  "ancrage-2:titre": "Ce qui te porte",
  "ancrage-2:arrivee": "Installe-toi comme tu es, sur une chaise, au sol ou debout. Pendant trois minutes environ, on va simplement regarder ce qui te porte en ce moment, sans rien changer. Si tu as besoin de t’arrêter en route, arrête-toi, ça compte quand même.",
  "ancrage-2:souffle": "Laisse le souffle aller et venir à son rythme, sans le corriger. Remarque plutôt comment il s’appuie quelque part : le ventre qui pousse un peu, les côtes qui s’ouvrent, le dos qui se soulève et redescend derrière elles.",
  "ancrage-2:corps": "Descends l’attention dans tes pieds. Sens la plante, le talon, la pression du sol qui remonte et te tient sans que tu aies à le demander. Le sol était déjà là avant que tu y penses, il continue pendant que tu le sens.",
  "ancrage-2:nommer": "Un mot, un seul, pour ce qui est là maintenant. Lourd, tiède, serré, tranquille, ce qui vient vient. Tu le poses comme tu poserais une main sur une table, sans le pousser plus loin, sans chercher d’où il sort.",
  "ancrage-2:retour": "Reprends contact avec la pièce autour de toi, les sons, la lumière qui arrive. Bouge une main, tourne la tête, laisse le regard reprendre de la distance. Et repars vers ce que tu faisais, à ton rythme.",
  "ancrage-3:titre": "Les sons autour de toi",
  "ancrage-3:arrivee": "Installe-toi comme tu es, et laisse tes oreilles faire le travail à ta place. Ça dure trois ou quatre minutes, pas davantage, et tu peux t’arrêter en route, même au milieu d’une phrase. Il n’y a rien à réussir ici, seulement des sons qui passent.",
  "ancrage-3:souffle": "Respire comme tu respires déjà, sans rien corriger. Écoute si ton souffle fait un bruit, un frottement dans la gorge, un léger sifflement quand l’air ressort, ou s’il reste presque muet. C’est le son le plus proche de tous ceux qui t’entourent.",
  "ancrage-3:corps": "Pose ton attention sur tes mâchoires, juste devant les oreilles. C’est souvent là que ça se serre quand un bruit dérange. Sans forcer, laisse-les se desserrer d’un millimètre, et remarque si le dehors change de texture quand tu relâches.",
  "ancrage-3:nommer": "Choisis un seul son, proche ou lointain, et pose un mot dessus. Continu, métallique, sourd, creux, le premier qui vient. Tu ne regardes pas si c’est agréable ou pas, tu le nommes et tu le laisses là, exactement comme il est.",
  "ancrage-3:retour": "Élargis, reprends tout ce qui arrive, le proche, le lointain, et les creux de silence entre les deux. Bouge les doigts, ouvre les yeux si tu les avais fermés. Les sons continuent sans toi, et tu repars avec eux.",
  "ancrage-4:titre": "Ce que la main tient",
  "ancrage-4:arrivee": "Prends un objet à portée de main, un stylo, une clé, un galet, et garde-le au creux de la paume. Ce qui suit dure trois minutes environ, cinq temps courts. Si tu veux poser l’objet et t’arrêter en route, tu poses et tu t’arrêtes.",
  "ancrage-4:souffle": "L’objet est toujours là, contre ta peau. Laisse le souffle venir comme il vient, sans rien corriger, et remarque la main qui bouge un peu chaque fois que l’air entre. Elle se soulève, elle redescend, et l’objet fait le trajet avec elle.",
  "ancrage-4:corps": "Descends l’attention dans la paume, juste là où l’objet appuie. Il est tiède ou froid, lisse ou rugueux, plus lourd peut-être que tu ne croyais. Reste là, sur ce petit carré de peau, et laisse le corps tranquille autour, pour l’instant.",
  "ancrage-4:nommer": "Serre un peu les doigts autour de l’objet, puis cherche un mot pour ce qui est là en toi maintenant. Un seul, même approximatif. Tu le dis tout bas ou tu le gardes en pensée, et tu le laisses tenir là, dans la main fermée, sans l’expliquer.",
  "ancrage-4:retour": "Desserre les doigts, laisse l’objet reposer dans la paume ouverte, puis remets-le où il était. La pièce est encore là, et toi aussi. Tu reprends ce que tu faisais, et la main garde encore un moment la chaleur de l’objet.",
});

/**
 * Le texte de base d'un créneau, ou `undefined`.
 *
 * ⚠️ `Object.hasOwn`, JAMAIS l'indexation nue — même piège que `lireTexte` dans `port.ts` :
 * l'indexation traverse la chaîne de prototypes, et `texteDeBase("constructor")` rendrait une
 * fonction. Sur une table dont les clés viennent de constantes de domaine, c'est théorique ; sur
 * une table que quelqu'un remplira à la main pendant des mois, ça ne l'est pas.
 */
export function texteDeBase(cle: string): string | undefined {
  return Object.hasOwn(TEXTES_DE_BASE, cle) ? TEXTES_DE_BASE[cle] : undefined;
}
