/** The French text the admin sends along with the link. */
export function loginMessage(appUrl: string): string {
  return [
    "Coucou ! Cette année, on fait un Père Noël secret en famille 🎄",
    `Voici le site : ${appUrl}`,
    "Pour entrer la première fois :",
    "1. Ouvre le lien",
    "2. Écris ton adresse email",
    "3. Recopie le code à 6 chiffres que tu reçois par email",
    "Ensuite, tu peux déjà écrire ta liste d'envies !",
  ].join("\n");
}
