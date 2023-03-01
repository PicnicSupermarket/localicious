// DO NOT EDIT. This file is auto-generated using Localicious (https://github.com/PicnicSupermarket/localicious).

import de from "./de/strings.json";
import nl from "./nl/strings.json";
import en from "./en/strings.json";
import fr from "./fr/strings.json";
import {at as lodashAt} from "lodash";

// type LanguageStrings = typeof de | typeof nl | typeof en | typeof fr;

type Language = "de" | "nl" | "en" | "fr";

const strings = {
  de: de,
  nl: nl,
  en: en,
  fr: fr,
} as const;

type AllLanguageStrings = typeof strings;

const format = (string: string, ...args: string[]) => {
  let result = string;
  for (let i = 0; i < args.length; i++) {
    const pos = i + 1;
    if (typeof args[i] === "string") {
      result = result.replace("%" + pos + "$s", args[i]);
    }
    if (typeof args[i] === "number") {
      result = result.replace("%" + pos + "$d", args[i]);
    }
  }
  return result;
};

export const translation = <L extends Language, T extends AllPossibleKeysForLanguage<L>>(
  language: L,
  key: T,
  ...args: string[]
): TranslationTypeFromPath<L, T> => {
  // Check if translation language exists.

  const translationNode = lodashAt(strings[language], key)[0] as TranslationTypeFromPath<L, T>;

  if (typeof translationNode === "string") {
    return format(translationNode, ...args) as TranslationTypeFromPath<L, T>;
  }

  return translationNode;
};

// TYPING FOR KEYS
type KeysUnion<T, Cache extends string = ""> = T extends PropertyKey
  ? Cache
  : {
      [P in keyof T]: P extends string
        ? Cache extends ""
          ? KeysUnion<T[P], `${P}`>
          : Cache | KeysUnion<T[P], `${Cache}.${P}`>
        : never;
    }[keyof T];

type AllPossibleKeysForLanguage<L extends Language> = KeysUnion<AllLanguageStrings[L]>;

// TYPE FOR VALUES
type Primitive = string | number | symbol;
type GenericObject = Record<Primitive, unknown>;

/**
 * TypeFromPath
 * Get the type of the element specified by the path
 * @example
 * type TypeOfAB = TypeFromPath<{ a: { b: { c: string } }, 'a.b'>
 * // { c: string }
 */
export type TypeFromPath<
  T extends GenericObject,
  Path extends string // Or, if you prefer, NestedPaths<T>
> = {
  [K in Path]: K extends keyof T
    ? T[K]
    : K extends `${infer P}.${infer S}`
    ? T[P] extends GenericObject
      ? TypeFromPath<T[P], S>
      : never
    : never;
}[Path];

export type TranslationTypeFromPath<
  L extends Language,
  Path extends AllPossibleKeysForLanguage<L>
> = TypeFromPath<AllLanguageStrings[L], Path>;

type A = TranslationTypeFromPath<"de", "Basket">;
const a = translation("en", "Basket.EditBasket.AddToDeliveryCurrentDeliverySection");
