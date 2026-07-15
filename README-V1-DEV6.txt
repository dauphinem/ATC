ATC v1.0-dev6
- Cases Bibliographie et Cas clinique.
- Ateliers fixes préchargés et modifiables.
- Catégories art-thérapie / corporel.
- Tableau de bord : patients avec 0 art-thérapie ou 0 corporel.
- Modification directe des créneaux depuis le planning patient.
- Suppression de l’onglet Contraintes.

Correctif de stabilité 1 :
- retrait des anciennes références à l’onglet Contraintes supprimé ;
- initialisation sûre de weekOptions, agendaDraft et des listes de données ;
- migration des anciennes données locales incomplètes ;
- mise à jour du cache de l’application.

Version 6.2 :
- Dauphine configurée comme utilisatrice ;
- Matthieu et Nada configurés comme internes ;
- suppression propre de l’onglet Équipe ;
- conservation des affectations existantes à Matthieu et Nada.

Version 7.1 :
- préparation hebdomadaire groupée depuis quatre fichiers ;
- import Excel de la liste des patients et de leurs référents ;
- rapprochement des IDE après lecture du planning ;
- interprétation Google Agenda : PsychoD, ECH, fin de séparation, Atelier 2D et Mouvement en soi ;
- remplacement des données importées de la semaine sans supprimer les ajouts manuels ;
- bilan des références non reconnues avant validation des événements Agenda.

Version 7.2 :
- choix explicite de la semaine à préparer ;
- anomalies détaillées, y compris les correspondances patient ambiguës ;
- événements concernant d’autres patients ignorés silencieusement ;
- règles Google Agenda modifiables ;
- Quotidien compact avec menu d’activités, navigation précédente/suivante et tri alphabétique ;
- bouton Tout décocher et avertissement non bloquant en cas de chevauchement ;
- origine de chaque activité ou rendez-vous dans le planning patient.

Version 7.3 :
- navigation inférieure sur iPhone et latérale sur ordinateur ;
- sélecteur d’activité maintenu en haut du Quotidien ;
- règles Google repliées par défaut et confirmations visuelles ;
- données réellement séparées par semaine ;
- archivage automatique des semaines précédentes ;
- sauvegarde automatique avant import et annulation du dernier import ;
- récapitulatif compact des données manquantes.
- lecteur Google Agenda inchangé dans cette première version.
ATC v7.4 — Nouvelle identité visuelle

- Palette bordeaux inspirée de la référence fournie
- Fonds blanc et gris perle à la place du beige crème
- Cartes translucides, ombres douces et angles plus arrondis
- Navigation adaptée sur Mac et iPhone
- Icône de l’application recolorée
- Aucune modification fonctionnelle par rapport à la v7.3
ATC v9 — Quotidien et navigation simplifiés

- Commandes du Quotidien réunies sur une seule ligne
- Bouton d’activité ponctuelle réduit au signe +
- Navigation entre activités avec deux flèches compactes
- Barre iPhone limitée à Quotidien, Semaine et Plus
- Pictogrammes vectoriels bordeaux à la place des émojis
- Patients et Recherche déplacés dans le menu Plus
- Libellés conservés dans la navigation sur ordinateur
ATC v9.1 — Direction graphique terre cuite

- Palette reprise de la maquette Canva de Dauphine
- En-tête terre cuite avec texte blanc
- Fond cuivré texturé en dégradé
- Cartes rose poudré et panneaux d’activité blancs
- « Activité du jour » aligné à gauche
- Croix compacte à la place de « Tout décocher »
- Fonction de la croix conservée et libellé accessible ajouté
- Icône de l’application adaptée à la nouvelle palette
ATC v9.2 — Page Semaine simplifiée

- Sélecteur de semaine compact sur une seule ligne
- Données, état des imports et options regroupés dans une seule carte
- Vérification Google Agenda repliée par défaut
- Semaines archivées et règles Google Agenda conservées repliées
- Suppression du bloc Règles de présence IDE
- Équilibre des activités déplacé dans Quotidien
ATC v10 — Événements d’équipe et impression

- EF + patient reconnu : bloque Dauphine, ses deux internes et ses deux IDE référents
- EF : bloque aussi le patient hors séparation, ou en séparation aménagée
- EF : ne bloque pas le patient en séparation complète
- Synthèse + patient reconnu : bloque toute l’équipe référente, jamais le patient
- Les contraintes des IDE sont désormais prises en compte dans la recherche de créneaux
- Ajout du statut Séparation aménagée dans la fiche patient et l’import Excel
- Nouveau planning imprimable de Dauphine
- Planning patient imprimable ou enregistrable en PDF
- Modèle Excel ATC v10 inclus

ATC v10.1 — Validation automatique de Google Agenda
- Les événements non ambigus sont ajoutés automatiquement aux plannings
- Les EF et synthèses apparaissent immédiatement dans le planning de Dauphine
- Seuls les événements ambigus restent à vérifier manuellement

ATC v10.2 — Calendriers Google récurrents
- Lecture des événements Google Agenda hebdomadaires pour la semaine sélectionnée
- Respect de l’intervalle, des jours BYDAY et de la date UNTIL
- Les événements ponctuels et récurrents non ambigus sont ajoutés automatiquement

ATC v11 — Semaine simplifiée
- Seul le planning IDE doit être réimporté chaque semaine
- Patients et calendrier habituel des ateliers conservés lors de la création d’une semaine
- Inscriptions quotidiennes aux ateliers remises à zéro
- Prises en charge récurrentes enregistrées dans ATC
- Ajout rapide des EF, synthèses et autres événements ponctuels
- Imports Patients, Google Agenda et Ateliers conservés dans Plus comme options facultatives
