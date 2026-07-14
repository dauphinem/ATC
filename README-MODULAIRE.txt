ATC — base modulaire

Cette version part exactement du fichier index.html fourni, avec :
- CSS déplacé dans style.css
- JavaScript déplacé dans js/app.js
- initialisation robuste des données locales
- correction défensive de weekOptions
- protection des anciennes références acPerson / contraintes
- Dauphine, Matthieu et Nada préconfigurés

Test local :
1. Remplacer le contenu du dossier ATC par ces fichiers en conservant manifest.webmanifest et les icônes existantes.
2. Lancer : python3 -m http.server 8000
3. Ouvrir : http://localhost:8000
4. Tester les onglets avant tout commit.
