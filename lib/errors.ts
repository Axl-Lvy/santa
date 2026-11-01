/** An error whose message can be shown to the user as is. */
export class UserError extends Error {}

export class ValidationError extends UserError {}

export class LockedError extends UserError {
  constructor() {
    super("Le tirage a eu lieu : les participants et les règles ne peuvent plus changer.");
  }
}

export class DuplicateNameError extends UserError {
  constructor() {
    super("Quelqu'un porte déjà ce prénom.");
  }
}

export class ImpossibleDrawError extends UserError {
  constructor() {
    super("Avec cette règle, aucun tirage n'est possible.");
  }
}

export class AlreadyDrawnError extends UserError {
  constructor() {
    super("Le tirage a déjà eu lieu.");
  }
}
