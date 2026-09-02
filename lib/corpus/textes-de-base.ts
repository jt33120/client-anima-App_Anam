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
 * ── 2026-08-31 : LA STRUCTURE DES 69 LECTURES NUMÉROLOGIQUES A ÉTÉ REVUE, SUR RETOUR DU FONDATEUR ──
 *
 * Les 69 textes `chemin_de_vie:N` … `annee_personnelle:N` ont été restructurés le 2026-09-02 sur
 * retour de Julian du 2026-08-31, verbatim : « rajoute le chiffre à côté de ce à quoi il correspond, exemple :
 * Chemin de vie (7). Ensuite les textes doivent se structurer avec une analyse factuelle au début :
 * le chemin de vie 7 symbolise…, puis décrire la personne ou ses défis potentiels. Utilise le
 * tutoiement pour créer de la proximité. » Et, pour toute l'app : bannir les tirets cadratins,
 * être beaucoup plus concis.
 *
 * Chaque texte suit donc la même charpente, en deux à quatre phrases et 360 caractères au plus :
 * une première phrase FACTUELLE qui nomme la famille et le nombre et dit ce qu'il symbolise
 * traditionnellement (« Ton chemin de vie 7 symbolise… », « Ton année personnelle 9 est
 * traditionnellement une année de… »), puis une ou deux phrases qui décrivent la personne ou ses
 * défis possibles, au présent et en tutoiement, jamais en verdict ni en annonce. Les nombres
 * maîtres disent en une phrase qu'ils se lisent aussi comme 2, 4 ou 6, sans mystique. Ceci REMPLACE
 * la consigne antérieure de la fiche d'écriture (« il ne les répète pas ») : c'est désormais gardé
 * dans `tests/corpus-architecture.test.ts` (bloc « [2026-08-31] »).
 *
 * La matière n'a pas changé, la forme si. Ce sont TOUJOURS des textes de départ, non signés, et
 * la relecture d'Anima reste due : elle reprend la main exactement comme avant, une clé, une valeur.
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
  "aspect:carre:soleil": "Une friction se pose sur ce qui grandit en toi. Deux choses tirent chacune de leur côté : l’élan, et quelque chose qui ne s’aligne pas avec lui. Ce n’est pas une menace, c’est une demande : un endroit réclame un choix plutôt qu’un arrangement.",
  "aspect:carre:lune": "Ce que tu ressens frotte contre ce qui se passe. L’émotion ne tombe pas juste : elle arrive de travers, un peu trop fort ou au mauvais moment. La friction n’est pas un défaut, elle signale un endroit qui demande de l’attention.",
  "aspect:carre:ascendant": "Il y a du frottement entre la façon dont tu arrives et ce qui se tient en face. Le ton ne prend pas, ou prend trop. Il arrive que cette gêne montre surtout un décalage entre l’image donnée et ce qui se passe à l’intérieur.",
  "aspect:trigone:soleil": "Cela coule dans le sens de ce qui grandit en toi. Rien à forcer : l’élan trouve son lit et avance de lui-même. La fluidité endort parfois, tant elle est facile, au point qu’on oublie d’en faire quelque chose.",
  "aspect:trigone:lune": "Ce que tu ressens passe sans obstacle. L’émotion est lisible, elle n’a besoin ni d’être traduite ni d’être défendue. Tu reconnais peut-être cet état où être d’accord avec soi ne coûte rien de particulier.",
  "aspect:trigone:ascendant": "La façon dont tu arrives et ce qui se présente vont dans le même sens. La présence passe, sans effort d’ajustement. Rien de spectaculaire : c’est plutôt l’absence de frottement qui se remarque, quand on y prête attention.",
  "aspect:opposition:soleil": "Quelque chose se tient exactement en face de ce qui grandit en toi. Ce n’est pas contre toi : c’est en vis-à-vis, assez loin pour être vu en entier. Il arrive que l’autre bout de la tension soit tenu par quelqu’un d’autre que soi.",
  "aspect:opposition:lune": "Ce que tu ressens se retrouve face à quelque chose qui ne bouge pas. Deux besoins tirent chacun de leur côté, et aucun des deux n’a tort. Le face-à-face donne de la distance : de loin, ce qui est en jeu se voit mieux.",
  "aspect:opposition:ascendant": "La façon dont tu arrives te revient en miroir, renvoyée par ce qui se tient en face. Les autres tiennent le bout opposé, et ce qu’ils montrent ressemble parfois à ce que tu portes. Rien à trancher là, il y a surtout à regarder.",

  // ── chemin_de_vie
  "chemin_de_vie:1": "Ton chemin de vie 1 symbolise l’élan de commencer et le goût de tracer ta propre route. Tu décides vite et tu préfères souvent faire toi-même plutôt qu’attendre. Ne rien déléguer finit par peser, et demander un coup de main n’enlève rien à ce que tu as lancé.",
  "chemin_de_vie:2": "Ton chemin de vie 2 symbolise le lien, l’écoute et la recherche d’équilibre entre les personnes. Tu sens l’ambiance d’une pièce avant même d’y entrer, et tu fais de la place aux autres. Le plus difficile est parfois de dire ce que tu veux sans le déguiser en question.",
  "chemin_de_vie:3": "Ton chemin de vie 3 symbolise l’expression, la parole et la joie de créer. Tu racontes, tu fais rire, tu mets des mots et des couleurs sur ce que d’autres taisent. La légèreté te protège parfois de ce qui pèse, et beaucoup de choses commencées restent en chemin.",
  "chemin_de_vie:4": "Ton chemin de vie 4 symbolise la construction patiente et le besoin de bases solides. Tu avances par étapes concrètes, sans chercher les applaudissements, et ce que tu poses tient. La solidité rassure, jusqu’au jour où elle se referme en rigidité et où le moindre imprévu ressemble à une menace.",
  "chemin_de_vie:5": "Ton chemin de vie 5 symbolise le mouvement, la liberté et la curiosité. Tu aimes changer d’angle, goûter, partir, et tu refuses vite ce qui enferme. Cet élan sert parfois à partir avant que les choses deviennent sérieuses : la question est moins de t’arrêter que de savoir ce que tu quittes.",
  "chemin_de_vie:6": "Ton chemin de vie 6 symbolise le lien qu’on répare, la maison qu’on tient et le sens des responsabilités. Tu es souvent la personne vers qui on se tourne quand quelque chose vacille. C’est précieux, et ça devient lourd quand aimer se confond avec se rendre indispensable.",
  "chemin_de_vie:7": "Ton chemin de vie 7 symbolise la recherche du sens et le besoin de comprendre avant d’agir. Tu observes, tu cherches le fond des choses, et tu te méfies de ce qui se dit trop vite. Le silence te nourrit, et il devient parfois un endroit d’où tu regardes ta vie au lieu d’y entrer.",
  "chemin_de_vie:8": "Ton chemin de vie 8 symbolise la puissance d’agir, la matière et le sens des enjeux. Tu décides, tu tiens, tu transformes une idée en quelque chose de concret et de mesurable. Le contrôle te protège, et il risque de devenir ta seule manière de tenir debout.",
  "chemin_de_vie:9": "Ton chemin de vie 9 symbolise l’ouverture au monde, la générosité et les cycles qui s’achèvent. Tu donnes sans compter, et ce qui dépasse ton cercle proche te concerne autant que le reste. Les fins reviennent souvent sur ta route, et recevoir te demande plus d’effort que donner.",
  "chemin_de_vie:11": "Ton chemin de vie 11 symbolise l’intuition, une sensibilité qui capte tout et des idées justes que rien ne prouve. Ce nombre maître se lit aussi comme un 2, avec le même besoin de lien. Le doute revient souvent juste derrière l’intuition, et la hauteur visée sert parfois surtout à te reprocher de ne pas y être.",
  "chemin_de_vie:22": "Ton chemin de vie 22 symbolise la vision large et le travail concret qui la rend possible. Ce nombre maître se lit aussi comme un 4, avec le même goût du solide. Tu vois grand et tu avances pierre après pierre, et l’écart entre le rêve et le fait use plus que le travail lui-même. Commencer petit donne un sol à ce que tu vises.",
  "chemin_de_vie:33": "Ton chemin de vie 33 symbolise la transmission et une présence tournée vers les autres. Ce nombre maître se lit aussi comme un 6, avec le même sens des responsabilités. Tu apaises, tu expliques, tu tiens une place pour des gens qui n’ont rien demandé, et ta propre fatigue compte rarement dans l’équation.",

  // ── expression
  "expression:1": "Ton nombre d’expression 1 symbolise la capacité à commencer et à trancher. Tu lances, tu décides, tu prends la première place quand personne ne la prend, et le reste s’organise autour. L’outil est net, presque tranchant, et il coupe parfois plus court que prévu.",
  "expression:2": "Ton nombre d’expression 2 symbolise le lien, l’ajustement et la diplomatie. Tu sens l’ambiance d’une pièce, tu ajustes un mot, tu fais tenir ensemble des gens qui ne s’accordaient pas. Ce savoir-faire agit souvent sans qu’on le remarque, et ta propre voix passe parfois en dernier.",
  "expression:3": "Ton nombre d’expression 3 symbolise la parole, l’image et la mise en forme. Tu racontes, tu fais rire, tu rends vivant ce qui était plat, et ça va vite. Le même outil sert parfois à occuper le devant de la scène pendant que quelque chose de plus lourd attend derrière.",
  "expression:4": "Ton nombre d’expression 4 symbolise la méthode, le cadre et ce qui dure. Tu poses une organisation, tu finis ce qui est commencé pendant que d’autres passent déjà à la suite, et on te confie ce qui doit tenir. Serré trop fort, le cadre devient parfois une muraille.",
  "expression:5": "Ton nombre d’expression 5 symbolise le mouvement, la curiosité et l’adaptation. Tu essaies, tu changes d’angle, tu apprends vite une chose que tu n’avais jamais faite. Le même élan sert parfois à partir avant que quoi que ce soit ait eu le temps de s’installer.",
  "expression:6": "Ton nombre d’expression 6 symbolise la responsabilité, le sens du juste et du beau. Tu veilles sur un lieu, sur des gens, tu rends un endroit habitable sans qu’on ait eu à le demander. Cet outil travaille pour tout le monde et oublie parfois de compter la personne qui le tient.",
  "expression:7": "Ton nombre d’expression 7 symbolise l’analyse et la précision. Tu observes, tu cherches le mécanisme, tu ne réponds pas avant d’avoir compris, et c’est souvent le geste le plus juste de la pièce. La même finesse sert parfois à rester en retrait, là où rien ne peut t’atteindre.",
  "expression:8": "Ton nombre d’expression 8 symbolise l’organisation, la négociation et la mise à l’échelle. L’argent, les structures et le rapport de force t’effraient rarement : tu les manies comme des outils. Tout risque alors de se mesurer en résultats, y compris ce qui n’avait pas à l’être.",
  "expression:9": "Ton nombre d’expression 9 symbolise l’ampleur, la générosité et l’ouverture à plusieurs mondes. Tu comprends des gens très différents, tu donnes sans compter, tu portes volontiers une cause plus grande que toi. À vouloir tout embrasser, le geste se disperse parfois et rien ne reçoit vraiment sa part.",
  "expression:11": "Ton nombre d’expression 11 symbolise l’intuition qui capte ce que personne n’a encore dit. Ce nombre maître se lit aussi comme un 2, avec le même sens du lien. Ton outil marche par éclairs plus que par méthode, et il capte parfois trop, au point de rendre bruyant un endroit calme pour tout le monde.",
  "expression:22": "Ton nombre d’expression 22 symbolise la vision qui descend jusque dans la matière. Ce nombre maître se lit aussi comme un 4, avec le même goût du concret. Tu vois très grand et tu poses quand même des pierres : un plan, un budget, un calendrier. C’est lent, et l’écart entre ce que tu vois et ce qui existe pèse parfois au quotidien.",
  "expression:33": "Ton nombre d’expression 33 symbolise la transmission et la présence qui apaise. Ce nombre maître se lit aussi comme un 6, avec la même attention aux autres. Tu expliques, tu rends disponible pour d’autres ce qui t’a coûté cher à comprendre, et il reste parfois bien peu, le soir, pour la personne qui a donné.",

  // ── intime
  "intime:1": "Ton nombre intime 1 symbolise le désir d’indépendance et de mener ta vie de ta propre main. Ce n’est pas de la froideur, plutôt l’envie discrète de tenir debout sans rien devoir à personne. Un conseil bien intentionné serre parfois un peu, parce qu’il touche ce désir avant de toucher le sujet.",
  "intime:2": "Ton nombre intime 2 symbolise le désir d’être avec, vraiment avec quelqu’un, et que le reste vienne ensuite. Ce désir se dit rarement, parce qu’il ressemble trop à une faiblesse. Il te donne pourtant une attention rare aux climats, aux silences, à ce qui se répare entre deux personnes.",
  "intime:3": "Ton nombre intime 3 symbolise le désir d’une écoute vraie, et pas seulement d’une politesse qui attend son tour. Sous la légèreté, faire rire ouvre la porte et te protège en même temps. Ce que tu cherches sans le dire, c’est qu’une parole donnée reste quelque part, dans quelqu’un, une fois la conversation finie.",
  "intime:4": "Ton nombre intime 4 symbolise le désir d’un sol qui ne bouge pas : un lieu, des habitudes, des gens qui restent. Ce désir passe souvent pour du sérieux, alors qu’il tient plutôt d’une demande de calme. Quand la base tient, beaucoup de choses te deviennent possibles sans bruit.",
  "intime:5": "Ton nombre intime 5 symbolise le désir d’air, de portes ouvertes et de jours qui ne se ressemblent pas. Ce n’est pas forcément la fuite, plutôt la crainte de sentir ta vie se refermer. En silence, tu cherches que quelque chose bouge encore.",
  "intime:6": "Ton nombre intime 6 symbolise le désir d’être le lieu où les autres se posent, et de compter vraiment pour eux. Cette envie se déguise volontiers en devoir, et c’est là qu’elle devient lourde. Une question se pose alors rarement : qui veille sur toi pendant que tu veilles sur tout le monde.",
  "intime:7": "Ton nombre intime 7 symbolise le désir de comprendre pour de bon, plutôt que d’obtenir une réponse rassurante. Ton retrait n’est pas toujours une distance : c’est souvent l’endroit où les choses redeviennent nettes. Tu cherches le vrai sous le convenu, même quand il dérange.",
  "intime:8": "Ton nombre intime 8 symbolise le désir d’avoir les moyens, que ce que tu veux existe pour de vrai et laisse une trace. On prend souvent ce désir pour de l’ambition, alors qu’il ressemble davantage à l’envie de peser sur ta propre vie. Il demande de la matière, pas des intentions.",
  "intime:9": "Ton nombre intime 9 symbolise le désir d’appartenir à plus grand que toi, et d’y donner quelque chose. Cette envie rend parfois le petit périmètre étroit, et la journée ordinaire semble mince à côté. Elle demande peu de mots, et beaucoup de gestes tournés vers le dehors.",
  "intime:11": "Ton nombre intime 11 symbolise le désir de sentir avant de comprendre, et que cette intensité serve à quelque chose. Ce nombre maître se lit aussi comme un 2, avec le même besoin de lien. Ce qui vient sans être appelé t’encombre parfois, surtout quand personne autour ne le perçoit, et ce désir demande une place, avec du repos entre deux.",
  "intime:22": "Ton nombre intime 22 symbolise le désir de bâtir une chose qui tienne après toi, et qui serve à d’autres. Ce nombre maître se lit aussi comme un 4, avec le même pas patient. Ce désir a l’échelle grande et le pas lent, ce qui décourage souvent en chemin. Il tient moins du rêve que d’une envie très concrète : poser une pierre, puis une autre, sans public.",
  "intime:33": "Ton nombre intime 33 symbolise le désir de donner sans compter, et de rester là quand les autres partent. Ce nombre maître se lit aussi comme un 6, avec le même élan vers les autres. Cette générosité se retourne facilement, et la place manque parfois pour ce qui t’appartient. Au fond, tu cherches une chaleur qui circule dans les deux sens.",

  // ── personnalite
  "personnalite:1": "Ton nombre de personnalité 1 symbolise la solidité et l’assurance perçues de l’extérieur. On te voit trancher vite, on te consulte, on te suit, et on pense rarement à demander comment tu tiens. Le dedans est parfois moins ferme que la façade, et cet écart, personne ne le devine tant que tu ne le nommes pas.",
  "personnalite:2": "Ton nombre de personnalité 2 symbolise la douceur d’approche et l’attention aux autres. On te trouve facile à aborder, et la conversation avec toi ne force jamais. Cette manière d’arrondir les angles se lit comme du calme, alors que le dedans n’est parfois pas d’accord du tout.",
  "personnalite:3": "Ton nombre de personnalité 3 symbolise une présence vive et le mot qui fait rire. On te range du côté des gens à l’aise, et on ne regarde pas plus loin. Ce brillant coûte parfois cher, et la fatigue juste derrière ne se remarque pas.",
  "personnalite:4": "Ton nombre de personnalité 4 symbolise le sérieux et la fiabilité. On te voit comme quelqu’un de posé, on compte sur toi sans vérifier, et on te confie volontiers ce qui pèse. Le doute existe pourtant, et il reste souvent à l’intérieur du cadre que tu tiens.",
  "personnalite:5": "Ton nombre de personnalité 5 symbolise le mouvement et une allure libre. On te perçoit difficile à fixer, toujours à un pas du départ, et on croit que rien ne t’attache vraiment. Le dedans dit parfois l’inverse : une envie d’ancrage que la vitesse recouvre plus qu’elle ne l’exprime.",
  "personnalite:6": "Ton nombre de personnalité 6 symbolise la chaleur et la porte ouverte. On voit d’abord une place à table, quelqu’un vers qui on revient quand ça tangue, et on te suppose disponible presque toujours. Le dedans est parfois à bout de ce rôle, et rien n’en paraît sur ton visage.",
  "personnalite:7": "Ton nombre de personnalité 7 symbolise la réserve et l’observation. De loin, on te voit parler peu, regarder beaucoup, et on n’arrive pas tout à fait à te situer. Certains lisent de la distance là où il y a surtout de l’attention, et ce qui se dit à l’intérieur reste sans témoin.",
  "personnalite:8": "Ton nombre de personnalité 8 symbolise l’assurance et l’ampleur. Ta présence se remarque avant tes mots, tu occupes l’espace sans le demander, et on hésite à te ménager. Cette première impression prend parfois toute la place, et la personne derrière reste dans l’ombre.",
  "personnalite:9": "Ton nombre de personnalité 9 symbolise une bienveillance large, un peu lointaine. On te prête de la hauteur, parfois de l’indifférence, comme si peu de choses pouvaient t’atteindre. Le dedans est souvent plus touché que la surface ne le montre, et cette différence surprend ceux qui approchent.",
  "personnalite:11": "Ton nombre de personnalité 11 symbolise une intensité qui se remarque avant même que tu parles. Ce nombre maître se lit aussi comme un 2, avec la même finesse de perception. On te prête une force que tu ne te reconnais pas toujours, et ce que les autres appellent éclat se vit parfois, du dedans, comme une peau en moins.",
  "personnalite:22": "Ton nombre de personnalité 22 symbolise une solidité qui a de l’envergure. Ce nombre maître se lit aussi comme un 4, avec la même fiabilité. On te voit construire et tenir, on te confie les choses grandes, et on suppose que la charge ne t’effraie pas. Le dedans trouve parfois ça immense, et rien de ce vertige ne franchit la surface.",
  "personnalite:33": "Ton nombre de personnalité 33 symbolise une patience et une chaleur qui semblent ne jamais manquer. Ce nombre maître se lit aussi comme un 6, avec le même accueil. On vient te parler avant même de te connaître, et cette impression te précède sans attendre ton accord. Le dedans est parfois vide de tout ça au même moment, sans que rien ne le montre.",

  // ── jour_de_naissance
  "jour_de_naissance:1": "Ton jour de naissance 1 symbolise le talent de commencer. Là où beaucoup attendent le bon moment, tu poses le premier geste sans même le remarquer. Cette facilité se voit surtout quand personne ne bouge autour.",
  "jour_de_naissance:2": "Ton jour de naissance 2 symbolise la finesse de perception entre les gens. Tu perçois vite ce qui circule, les silences, les demi-mots, souvent avant d’avoir mis des mots dessus. Cette attention te sert davantage dans un lien à deux qu’au milieu du bruit.",
  "jour_de_naissance:3": "Ton jour de naissance 3 symbolise le talent de dire et de rendre vivant. Tu tournes les choses autrement sans forcer, et il t’arrive d’alléger une pièce entière juste par ta manière de raconter. C’est une aisance, pas une performance.",
  "jour_de_naissance:4": "Ton jour de naissance 4 symbolise le talent de bâtir ce qui tient. Tu vois l’ordre des étapes là où d’autres voient un tas, et tu avances par gestes concrets plutôt que par grandes intentions. Cette solidité se remarque surtout quand quelque chose doit durer.",
  "jour_de_naissance:5": "Ton jour de naissance 5 symbolise la souplesse face au changement. L’imprévu ne te fait pas perdre pied, souvent il te réveille : tu t’adaptes vite et tu apprends en marchant. C’est une souplesse, plus qu’un goût du risque.",
  "jour_de_naissance:6": "Ton jour de naissance 6 symbolise le talent de voir ce qui manque, à un lieu, à une table, à quelqu’un. Tu le combles sans en faire une affaire, presque par réflexe, et cette attention t’est venue tôt. On te la demande souvent, parfois trop.",
  "jour_de_naissance:7": "Ton jour de naissance 7 symbolise le talent de passer sous la surface. Les évidences t’intéressent moins que ce qu’elles recouvrent, et ce recul donne du calme dans les moments confus. Il vient plus facilement dans le silence qu’en groupe.",
  "jour_de_naissance:8": "Ton jour de naissance 8 symbolise le sens de la valeur et de ce que les choses coûtent. Décider, organiser, remettre de l’ordre dans une situation embrouillée te demande souvent moins d’énergie qu’à d’autres. Rien de spectaculaire là-dedans, plutôt une force très concrète.",
  "jour_de_naissance:9": "Ton jour de naissance 9 symbolise une compréhension large des autres. Tu saisis des gens très différents de toi sans avoir à te forcer, et ton regard embrasse plus que l’instant. Ça se sent autant dans ce que tu fabriques que dans ce que tu écoutes.",
  "jour_de_naissance:11": "Ton jour de naissance 11 symbolise le talent de savoir avant de comprendre. Ce nombre maître se lit aussi comme un 2, avec la même finesse. Une impression nette arrive sans raison, et elle s’est déjà vérifiée plus d’une fois. Cette antenne est fine, et il lui faut du calme autour pour rester lisible.",
  "jour_de_naissance:22": "Ton jour de naissance 22 symbolise le talent de tenir ensemble la vision et le concret. Ce nombre maître se lit aussi comme un 4, avec le même sens de l’étape. Tu vois grand et tu sais par quoi commencer lundi matin, et ce que tu imagines a tendance à exister, pièce après pièce, sans grand geste.",
  "jour_de_naissance:33": "Ton jour de naissance 33 symbolise une présence qui apaise. Ce nombre maître se lit aussi comme un 6, avec la même attention aux autres. Tu poses le calme autour de toi sans rien faire de particulier, et les autres te confient des choses tôt, parfois avant de savoir pourquoi. Transmettre, expliquer, réconforter : ça te vient tout seul.",

  // ── annee_personnelle
  "annee_personnelle:1": "Ton année personnelle 1 est traditionnellement une année de commencement. Quelque chose recommence, sans faire beaucoup de bruit, et ce que tu poses maintenant a du poids même si rien n’est encore visible. Hésiter à s’avancer est fréquent en début de cycle, et le terrain, lui, est meuble.",
  "annee_personnelle:2": "Ton année personnelle 2 est traditionnellement une année de patience et de liens. Ce qui avance ici avance à deux, ou pas du tout : les accords, les alliances, ce que tu ne peux pas presser. Cette lenteur n’est pas un retard, et le silence y compte autant que l’élan.",
  "annee_personnelle:3": "Ton année personnelle 3 est traditionnellement une année d’expression. Il y a de la place pour dire, montrer, créer sans avoir à te justifier, et ce que tu gardais au fond demande une forme. Le revers possible, c’est la dispersion.",
  "annee_personnelle:4": "Ton année personnelle 4 est traditionnellement une année de construction. Le concret prend le dessus sur l’envolée : les papiers, les murs, les habitudes que tu tiens, et ce que tu poses, tu le poses pour durer. L’ennui qui vient parfois avec n’est pas un mauvais signe.",
  "annee_personnelle:5": "Ton année personnelle 5 est traditionnellement une année de mouvement. L’air circule, l’envie de partir revient sans prévenir, et dire oui à ce qui n’était pas prévu devient plus facile. La peur du changement ressemble souvent, de près, à de l’attirance.",
  "annee_personnelle:6": "Ton année personnelle 6 est traditionnellement une année de foyer et de responsabilités. Les proches pèsent plus lourd, en tendresse comme en fatigue, et la question de ce que tu donnes sans compter revient. La beauté y trouve aussi sa place.",
  "annee_personnelle:7": "Ton année personnelle 7 est traditionnellement une année de retrait et de réflexion. Le dedans devient plus audible que le dehors : lire, chercher, te taire, laisser tomber ce qui ne veut rien dire. Cette envie de recul s’installe souvent sans que tu l’aies choisie, et le reste peut patienter.",
  "annee_personnelle:8": "Ton année personnelle 8 est traditionnellement une année de bilan et de pouvoir d’agir. L’argent, la place que tu prends, ce que tu oses demander : tout cela a du poids cette année. Ce qui a été construit se mesure, sans complaisance et sans drame, et la justesse y compte davantage que la réussite.",
  "annee_personnelle:9": "Ton année personnelle 9 est traditionnellement une année de tri et d’achèvement. Quelque chose finit, et ça libère plus que ça n’enlève : ce qui a fait son temps, les liens usés, les décors devenus trop petits. On y range plus qu’on n’entreprend, et le vide qui reste n’est pas une perte.",

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
