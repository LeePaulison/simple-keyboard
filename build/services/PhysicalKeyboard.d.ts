import { KeyboardOptions, PhysicalKeyboardParams } from '../interfaces';
/**
 * Layout Key Mapping Interface
 */
interface LayoutKeyMapping {
    normal: string | number;
    shift: string | number;
}
/**
 * Physical Keyboard Service
 */
declare class PhysicalKeyboard {
    getOptions: () => KeyboardOptions;
    dispatch: any;
    layoutJSON: Record<string, LayoutKeyMapping> | null;
    lastLayout: string;
    shiftActive: boolean;
    capslockActive: boolean;
    activeKeys: Set<HTMLElement>;
    getNavEngaged: () => boolean;
    /**
     * Creates an instance of the PhysicalKeyboard service
     */
    constructor({ dispatch, getOptions, getNavEngaged }: PhysicalKeyboardParams);
    handleHighlightKeyDown(e: KeyboardEvent): void;
    handleHighlightKeyUp(e: KeyboardEvent): void;
    STANDARD_CODES: Set<string>;
    /**
     * Normalize a code string to match the official `e.code` spec format.
     * Returns null if no match is found.
     */
    normalizeToStandardCode(input: string): string | null;
    normalizeOutput(rawKey: string): string;
    /**
     * Transforms a KeyboardEvent's "key.code" string into a simple-keyboard layout format
     * @param  {object} e The KeyboardEvent
     * @returns {string} The simple-keyboard layout key
     */
    getSimpleKeyboardLayoutKey(e: KeyboardEvent): string;
    /**
     * Retrieve key from keyCode
     */
    keyCodeToKey(keyCode: number): string;
    /**
     * Extracts and pads a layout object
     * @param  {object} layout The layout object
     * @returns {object} The layout object with padding
     */
    extractAndPadLayout(layout: Record<string, string[]>): Record<string, (string | number)[][]>;
    /**
     * Maps a layout object to event codes
     * @param  {object} layout The layout object
     * @returns {object} The layout object with event codes
     */
    mapLayoutToEventCodes(layout: Record<string, (string | number)[][]>): Record<string, LayoutKeyMapping>;
    isModifierKey: (e: KeyboardEvent) => boolean;
}
export default PhysicalKeyboard;
