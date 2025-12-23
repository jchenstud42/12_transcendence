import jwt from "jsonwebtoken";
// A METTRE DANS LE FASTIFY DE JULIE POUR PROTEGER LES ROUTES QUI ONT BESOIN D"UNE AUTH
// A METTRE DANS LE USER MANAGEMENT DE RORO POUR GERER LOGIN/REGISTER
/*
 - Ce fichier c'est pour les contions de creations et verifications des Json Web Token.
 - Les Json Web token c'est quoi ?
  - C'est un systeme d'authentification par token qui permet de s'assurer que l'user est bien celui qu'il dit etre, sans avoir a stocker de session cote serveur.
  - On cree un token avec des infos dedans (payload)(comme l'id de l'user) et on le signe avec une cle secrete presente dans .env (JWT_SECRET).
  - Quand l'user fait une requete, par exemple se login, il cree deux token avec son id et la cle secrete, et l'envoie au serveur.
  - Il y a deux types de token, et les deux sont crees : les access, et les refresh, les access ne durent que 15 minutes mais circulent partout, c'est pour ca qu'ils expirent vite.
  - Les refresh durent 7 jours, et son utilises pour obtenir de nouveaux access token quand ils expirent
  - (Pendant 7 jours, toutes les 15 minutes l'user peut avoir un nouveau access token sans se relog grace au refresh)
  - Ensuite le serveur ira verifier le token recu avec la meme cle secrete, si ca correspond, l'user pourra se log ou acceder a la ressource.

  bisous
*/
export const JWT_SECRET = (process.env.JWT_SECRET ?? "default_secret_change_me_hihi");
const ACCESS_EXPIRES_SEC = Number(process.env.JWT_ACCESS_EXPIRES ?? 900);
const REFRESH_EXPIRES_SEC = Number(process.env.JWT_REFRESH_EXPIRES ?? 604800);
/* On cree un token signe, la c'est un access donc il dure 15 min (ACCESS_EXPIRES_SEC), on donne aussi le secret
    on precise l'algorithme de signature du token, et on met le userId dans sub du payload
*/
export function signAccessToken(userId, twoFA = false) {
    return jwt.sign({ sub: userId, tokenType: "access", twoFA }, JWT_SECRET, { algorithm: "HS256", expiresIn: ACCESS_EXPIRES_SEC });
}
/*Pareil, creer un token Refresh qui dure 7 jours*/
export function signRefreshToken(userId) {
    return jwt.sign({
        sub: userId, tokenType: "refresh",
    }, JWT_SECRET, {
        algorithm: "HS256", expiresIn: REFRESH_EXPIRES_SEC
    });
}
/* On verifie si le token est egal au secret, jwt.verify peut retourner une string ou undefined donc on protege, car on veut pas de ca
   Ensuite on normalise sub pour etre sur que c'est un number, sinon on retourne null
   (Pour etre plus clair, on traite sub comme un objet qui peut etre de n'importe quel type (record<string, any>), on recupere sub dans subRaw,
   puis on verifie son type, si c'est number c'est bon, sinon si c'est une string on essaye de le parser en number)
   Ensuite on refait un objet Payload avec un sub de type number et on le return
*/
export function verifyToken(token) {
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (typeof payload === "string")
            return null;
        if (!payload || typeof payload !== "object")
            return null;
        const p = payload;
        const subRaw = p.sub;
        let subNum;
        if (typeof subRaw === "number")
            subNum = subRaw;
        else if (typeof subRaw === "string") {
            const parsed = Number(subRaw);
            if (!Number.isNaN(parsed))
                subNum = parsed;
        }
        if (typeof subNum !== "number")
            return null;
        const result = {
            ...p,
            sub: subNum,
        };
        return result;
    }
    catch (err) {
        return null;
    }
}
// C MOCHE MAIS PEUT ETRE UTILE DONC A VOIR
// export function signAccessToken(userId: number): string {
// 	return jwt.sign({ sub: userId }, JWT_SECRET, { algorithm: "HS256", expiresIn: ACCESS_EXPIRES });
// }
// export function createAccessToken(userID: number, twoFA = false): string {
// 	const options: SignOptions = { algorithm: "HS256", expiresIn: ACCESS_EXPIRES as unknown as NonNullable<SignOptions["expiresIn"]> };
// 	return jwt.sign(
// 		{ sub: userID, twoFA },
// 		JWT_SECRET,
// 		options
// 	);
// }
//# sourceMappingURL=jwtUtils.js.map