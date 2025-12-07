export const DIR_PACKS_SOURCE = "packs";
export const DIR_PACKS = "dist/packs";

const _MACRO_KEY_ID = "!macros!";

export const isMacroKey = key => key.startsWith(_MACRO_KEY_ID);

export const getMacroKey = id => `${_MACRO_KEY_ID}${id}`;
