#### PARTIE DE MATHIS ####

# CYBERSECURITY

## JWT Tokens -
### Les JWT, c'est quoi ?

JWT signifie **Json Web Token**, ce sont des token qui permettent de faciliter l'acces/l'authorisation et de garantir l'integrite des donnees.

Le token se divise en 3 parties :

-	**Le Header**
	Il nous permet de specifier son type (ex : JWT) ou encore l'algorithme utilise pour le signer.

-	**Le Payload**
	il contient les informations sur l'entite (generalement l'user), comme son identite (username...), sa date d'expiration, ou encore ses authorisations (admin/pas admin), ou le sujet (sub) pour identifie de quoi traite le token. Le payload n'est pas chiffre, il est en Base64, donc il est important de ne pas y mettre des informations sensibles comme le mot de passe etc..

-	**La signature**
	La signature du token nous permet de voir si le token a change en cours de route ou non, on creer la signature avec le header, le payload, et un secret. Si a un moment le token indique une signature invalide, c'est que quelqu'un ou quelque chose a change les informations du token, et donc le fait que la signature soit invalide est un moyen de le savoir.

Lors du login de l'utilisateur, un JWT lui sera retourne, un access token d'une duree de 15min lui permettant de se log in, mais egalement un refresh token, qui permettra a l'utilisateur de rester connecte au dela de ces 15 min.
Au dela de ces 15 minutes, le serveur verifiera le refresh token stocker dans les cookies HttpOnly navigateur.
Si le refresh token n'a pas expire, alors le serveur creera un nouveau access token de 15min, permettant a l'user de rester connecte tant qu'il ne s'est pas delog.
Le refresh token dure 7 jours, au dela de ca il ne creera pas d'autres access token, et l'user sera delog.

Le JWT rajoute une couche de securite grace a sa signature, si la signature est intact alors on peut etre sur que le token n'est pas modifie.

# REMOTE AUTHENTIFICATION (OAuth)

## OAuth, c’est quoi ?

OAuth signifie **Open Authorization**.
C’est un protocole standard qui permet a une application d’autoriser un utilisateur a se connecter via un service tiers, sans jamais partager son mot de passe avec l’application.

Dans un systeme OAuth, l’application delegue l’authentification a un fournisseur externe (*OAuth provider*), comme Google, GitHub, ou dans ce cas precis, **l’intra 42**.

### Principe de fonctionnement

1. L’utilisateur choisit de se connecter via un service tiers (ici, Sign in with 42).
2. Il est redirige vers la page de connexion du tiers.
3. Apres authentification, ce tiers service renvoie un **code d’authorisation** a notre app.
4. Ce code est echange côte serveur contre un **access token**.
5. Ce token permet a notre app de recuperer les informations de l’utilisateur (identite, email, etc...).

a aucun moment le mot de passe de l’utilisateur n’est transmis ou stocke par/dans notre application.

### OAuth avec l’intra 42

L’intra agit comme fournisseur OAuth et fournit les informations necessaires pour identifier l’utilisateur et creer ou connecter son compte local.

OAuth permet ainsi :
- Une connexion securisee sans gestion directe des mots de passe,
- Une reduction des risques lies au vol de credentials,
- Une experience utilisateur simplifiee.

Meme si les donnees locales de l’application sont effacees (cookies, localStorage, etc...), l’intra 42 se souvient que l’utilisateur a dejà donne son consentement.
Lorsqu’il revient se connecter, le flux OAuth peut :
- Soit utiliser le refresh token côte serveur pour generer un nouvel access token,
- Soit reconnaître l’utilisateur via sa session active chez l’intra 42.

C'est pour ca que l'utilisateur n'a pas besoin de redonner l'authorisation a chaque nouvelle connexion.

Donc, OAuth ajoute une couche de securite en separant l’authentification de l’application, tout en garantissant que l’utilisateur est bien authentifie par un service de confiance.

