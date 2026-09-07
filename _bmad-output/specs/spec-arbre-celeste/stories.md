# Stories — arbre de vie céleste

## AC-1 — matière naturelle et progression fidèle

**Capacités :** CAP-1, CAP-2, CAP-6.

Réaliser la nouvelle silhouette, le bois, les racines, les feuilles et la lumière à partir des
projections existantes. Graine et première pousse doivent être aussi soignées que l’arbre dense.

**Acceptation :** les scénarios du mapping présentent des silhouettes crédibles ; aucun score,
branche, historique ou stade métier supplémentaire. Feuillaison pleine distincte du rayonnement,
état mixte fidèle, même géométrie pour le dessin et les accroches. API et données inchangées.
L’explication de l’évolution permet de choisir quatre illustrations avec le même moteur ; les
exemples sont explicitement fictifs, sans effet sur l’arbre réel et sans étapes obligatoires.

## AC-2 — exploration accessible et rendu économe

**Capacités :** CAP-3, CAP-4.

Conserver la liste équivalente, les fiches et leur focus. Adapter les cibles et le contraste à
la nouvelle matière ; borner et mettre en cache les couches graphiques.

**Acceptation :** cibles 44 px, sélection perceptible sans couleur seule, commandes clavier et
restauration du focus validées à 390/768/1440 ; pas de débordement. Nuit/Papier/contraste et
mouvement réduit conservés. Une période immobile ne repeint pas l’arbre ; les ressources sont
nettoyées à la fermeture et les détails ne multiplient pas sans borne la mémoire graphique.

## AC-3 — preuves visuelles et livraison réversible

**Capacités :** CAP-1 à CAP-6.

Produire des captures des stades réels sur données fictives, une revue indépendante du mapping
et du diff, puis publier la branche par le pipeline production normal.

**Acceptation :** contrôles adaptés au diff réussis, captures représentatives et limites de
validation consignées, backend/configuration métier inchangés. Le SHA publié correspond à une
production READY sur https://anima-app-swart.vercel.app. Référence de retour conservée :
7c8c2d21255f04d8e3e75b97637d36b146ebd58c / dpl_7wkZgRtjNVkgC4tNiWjfNSSj7YE8.
Commande de retour : `vercel rollback dpl_7wkZgRtjNVkgC4tNiWjfNSSj7YE8 --yes`.
Ne pas inclure opencode.json ni modifier les migrations ou contrôles de promotion.
