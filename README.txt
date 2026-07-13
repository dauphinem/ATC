ATC v0.1 — prototype fonctionnel

Fonctions présentes
- Import d’un planning .xls/.xlsx
- Reconnaissance des codes M, S, J, 12, C, STH
- Alias discrets pour les IDE
- Patients avec IDE référent, interne et statut « séparation »
- Contraintes pour le patient, l’interne et toi
- Recherche dans les deux sens :
  1) trouver un créneau pour un patient
  2) trouver les patients compatibles avec un créneau libre
- Créneaux autorisés :
  10:00–12:00 ; 13:30–16:00 ; 16:30–18:00 seulement en séparation

Installation
Cette archive est le code de l’application. Pour l’utiliser comme une app iPhone,
elle doit être placée sur une adresse web HTTPS, puis ouverte dans Safari et ajoutée
à l’écran d’accueil.

Important
Le fichier Excel choisi est analysé dans le navigateur. Les données applicatives
sont enregistrées dans le stockage local du navigateur.
Le module de lecture Excel est chargé depuis jsDelivr au premier lancement.
