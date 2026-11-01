/** The French text the admin sends along with the link. */
export function loginMessage(appUrl: string): string {
  return [
    "Coucou ! Cette année, on fait un Père Noël secret en famille 🎄",
    `Voici le site : ${appUrl}`,
    "Pour entrer :",
    "1. Ouvre le lien",
    "2. Écris ton prénom",
    "Ensuite, tu peux déjà écrire ta liste d'envies ! Le tirage arrive bientôt : tu gratteras ton ticket sur le site.",
  ].join("\n");
}
