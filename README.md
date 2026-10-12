# MIXTE® — Site vitrine de studio digital

**Propriétaire : Ebubekir ARTI** — © 2026 Ebubekir ARTI. Tous droits réservés.

Un mélange de **landonorris.com** (énergie course : vert sombre, crème, lime, feux de départ, circuit, classement) et de **noomoagency.com** (structure d’agence premium : expertises, clients, témoignages, distinctions, 3D irisée).

Tout le contenu est **original** : aucune photo, aucun logo ni texte des deux sites n’a été réutilisé.

- **Site en ligne :** https://mixte-studio.vercel.app
- **Dépôt :** https://github.com/Anonyme-00152/mixte-studio

## Mettre à jour le site en ligne

Le projet Vercel est relié à ce dépôt : chaque `git push` sur `main` redéploie automatiquement le site.

```
git add -A
git commit -m "Ma modification"
git push
```

## Ouvrir le site

- **Le plus simple :** double-clic sur `index.html`.
- **Recommandé (comme en ligne) :** lancer un petit serveur dans ce dossier :
  ```
  python -m http.server 8000
  ```
  puis ouvrir http://localhost:8000

Il faut une connexion internet pour charger les polices Google et les bibliothèques GSAP et Lenis (CDN).

## Pages

| Fichier | Rôle |
|---|---|
| `index.html` | Page d’accueil complète (11 sections) |
| `projet.html?p=volta` | Étude de cas, générée selon `p` : `volta`, `aube`, `orbe`, `nebuleuse`, `kinetik`, `sable` |

## Structure

```
site-mixte/
├── index.html
├── projet.html
└── assets/
    ├── css/style.css     → design system + toutes les sections
    ├── css/case.css      → page étude de cas
    ├── js/main.js        → préloader, scroll fluide, animations, curseur, menu, formulaires
    ├── js/hero-gl.js     → blob 3D WebGL du hero (sans bibliothèque)
    ├── js/projects.js    → textes, chiffres et couleurs des 6 études de cas
    ├── js/case.js        → construit la page projet
    ├── fonts/MonaSans.woff2
    └── img/favicon.svg
```

## Personnaliser

- **Couleurs :** les variables en haut de `assets/css/style.css` (`--lime`, `--green`, `--plum`…).
- **Textes de l’accueil :** directement dans `index.html` (chaque section est commentée).
- **Études de cas :** dans `assets/js/projects.js` (titre, accroche, défi, approche, résultats, citation, couleurs).
- **Nom, e-mail, téléphone, adresse :** à remplacer dans `index.html`, `projet.html` et le pied de page.

> ⚠️ Les clients, chiffres, prix et témoignages sont des **exemples fictifs** : remplace-les par tes vraies informations avant de mettre le site en ligne.

## Formulaire de contact

Le formulaire valide les champs et affiche un message de confirmation, mais **n’envoie rien** pour l’instant (aucun serveur).
Pour le brancher, voir le commentaire `Pas de serveur ici` dans `assets/js/main.js` (fonction `initForms`). Un service comme Formspree, Basin ou ton propre back-end fera l’affaire.

## Points forts techniques

- Préloader « feux de départ F1 » (version courte aux visites suivantes)
- Blob 3D irisé en WebGL (raymarching) qui suit la souris, avec qualité adaptative
- Défilement fluide (Lenis) et animations au scroll (GSAP + ScrollTrigger)
- Travaux en défilement horizontal épinglé ; carrousel tactile sur mobile
- Process présenté comme un circuit qui se dessine au scroll
- Curseur personnalisé, boutons magnétiques, navigation qui s’adapte à la couleur de la section
- Responsive (mobile, tablette, desktop), `prefers-reduced-motion` respecté, navigation clavier, lien d’évitement
- Le contenu reste lisible si les bibliothèques ne se chargent pas

## Licences

Polices Unbounded, Mona Sans, JetBrains Mono et Caveat : SIL Open Font License. GSAP : licence standard GreenSock (gratuite). Lenis : MIT.
