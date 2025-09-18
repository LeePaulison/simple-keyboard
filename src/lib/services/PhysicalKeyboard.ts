import { KeyboardOptions, PhysicalKeyboardParams } from '../interfaces';
import Utilities from '../services/Utilities';
import { getDefaultLayout } from '../services/KeyboardLayout';

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
class PhysicalKeyboard {
  getOptions: () => KeyboardOptions;
  dispatch: any;
  layoutJSON: Record<string, LayoutKeyMapping> | null = null;
  lastLayout = '';
  shiftActive = false;
  capslockActive = false;
  activeKeys: Set<HTMLElement> = new Set();
  getNavEngaged: () => boolean;

  /**
   * Creates an instance of the PhysicalKeyboard service
   */
  constructor({ dispatch, getOptions, getNavEngaged }: PhysicalKeyboardParams) {
    /**
     * @type {object} A simple-keyboard instance
     */
    this.dispatch = dispatch;
    this.getOptions = getOptions;
    this.getNavEngaged = getNavEngaged;

    if (this.getOptions() && this.getOptions().layout) {
      this.lastLayout = this.getOptions()?.layout?.default?.[1] || '';
      const layout = this.getOptions().layout;
      if (layout) {
        this.layoutJSON = this.mapLayoutToEventCodes(this.extractAndPadLayout(layout));
      }
    } else {
      this.lastLayout = getDefaultLayout().default[1];
      this.layoutJSON = this.mapLayoutToEventCodes(this.extractAndPadLayout(getDefaultLayout()));
    }

    /**
     * Bindings
     */
    Utilities.bindMethods(PhysicalKeyboard, this);
  }

  handleHighlightKeyDown(e: KeyboardEvent) {
    const options = this.getOptions();

    if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !this.shiftActive) {
      this.shiftActive = !this.shiftActive;
    }

    if (e.code === 'CapsLock') {
      this.capslockActive = !this.capslockActive;
    }

    if (this.getNavEngaged() && options.activeSurface === 'keyboard') {
      // If navEngaged is true and activeSurface is keyboard, do not highlight keys or operate VK
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }

    const buttonPressed = this.getSimpleKeyboardLayoutKey(e);

    this.dispatch((instance: any) => {
      const standardButtonPressed = instance.getButtonElement(buttonPressed);
      const functionButtonPressed = instance.getButtonElement(`{${buttonPressed}}`);

      let buttonDOM;
      let buttonName: string;

      if (standardButtonPressed) {
        buttonDOM = standardButtonPressed;
        buttonName = buttonPressed;
      } else if (functionButtonPressed) {
        buttonDOM = functionButtonPressed;
        buttonName = `{${buttonPressed}}`;
      } else {
        return;
      }

      const applyButtonStyle = (buttonElement: HTMLElement) => {
        buttonElement.style.background = options.physicalKeyboardHighlightBgColor || '#dadce4';
        buttonElement.style.color = options.physicalKeyboardHighlightTextColor || 'black';
        this.activeKeys.add(buttonElement);
      };

      if (buttonDOM) {
        if (Array.isArray(buttonDOM)) {
          buttonDOM.forEach((buttonElement) => applyButtonStyle(buttonElement));

          // Even though we have an array of buttons, we just want to press one of them
          if (options.physicalKeyboardHighlightPress) {
            if (options.physicalKeyboardHighlightPressUsePointerEvents) {
              buttonDOM[0]?.onpointerdown?.(e);
            } else if (options.physicalKeyboardHighlightPressUseClick) {
              buttonDOM[0]?.click();
            } else {
              instance.handleButtonClicked(buttonName, e);
            }
          }
        } else {
          applyButtonStyle(buttonDOM);

          if (options.physicalKeyboardHighlightPress) {
            if (options.physicalKeyboardHighlightPressUsePointerEvents) {
              buttonDOM?.onpointerdown?.(e);
            } else if (options.physicalKeyboardHighlightPressUseClick) {
              buttonDOM.click();
            } else {
              instance.handleButtonClicked(buttonName, e);
            }
          }
        }
      }
    });
  }

  handleHighlightKeyUp(e: KeyboardEvent) {
    const options = this.getOptions();

    // if (options.physicalKeyboardHighlightPreventDefault && this.isModifierKey(e)) {
    //   e.preventDefault();
    //   e.stopImmediatePropagation();
    // }

    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.shiftActive = false;
    }

    const buttonPressed = this.getSimpleKeyboardLayoutKey(e);

    this.dispatch((instance: any) => {
      const buttonDOM = instance.getButtonElement(buttonPressed) || instance.getButtonElement(`{${buttonPressed}}`);

      const applyButtonStyle = (buttonElement: HTMLElement) => {
        if (buttonElement.removeAttribute) {
          buttonElement.removeAttribute('style');
        }
        this.activeKeys.delete(buttonElement);
      };

      if (buttonDOM) {
        if (Array.isArray(buttonDOM)) {
          buttonDOM.forEach((buttonElement) => applyButtonStyle(buttonElement));

          // Even though we have an array of buttons, we just want to press one of them
          if (options.physicalKeyboardHighlightPressUsePointerEvents) {
            buttonDOM[0]?.onpointerup?.(e);
          }
        } else {
          applyButtonStyle(buttonDOM);

          if (options.physicalKeyboardHighlightPressUsePointerEvents) {
            buttonDOM?.onpointerup?.(e);
          }
        }
      }
    });

    requestAnimationFrame(() => {
      if (this.activeKeys.size === 0) return;

      this.activeKeys.forEach((buttonElement) => {
        if (buttonElement.removeAttribute) {
          buttonElement.removeAttribute('style');
        }
      });
      this.activeKeys.clear();
    });
  }

  STANDARD_CODES = new Set([
    // Alphanumeric
    'Backquote',
    'Digit0',
    'Digit1',
    'Digit2',
    'Digit3',
    'Digit4',
    'Digit5',
    'Digit6',
    'Digit7',
    'Digit8',
    'Digit9',
    'KeyA',
    'KeyB',
    'KeyC',
    'KeyD',
    'KeyE',
    'KeyF',
    'KeyG',
    'KeyH',
    'KeyI',
    'KeyJ',
    'KeyK',
    'KeyL',
    'KeyM',
    'KeyN',
    'KeyO',
    'KeyP',
    'KeyQ',
    'KeyR',
    'KeyS',
    'KeyT',
    'KeyU',
    'KeyV',
    'KeyW',
    'KeyX',
    'KeyY',
    'KeyZ',

    // Control & nav
    'Enter',
    'Escape',
    'Backspace',
    'Tab',
    'Space',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Delete',
    'Insert',
    'Home',
    'End',
    'PageUp',
    'PageDown',

    // Modifier keys
    'ShiftLeft',
    'ShiftRight',
    'ControlLeft',
    'ControlRight',
    'AltLeft',
    'AltRight',
    'MetaLeft',
    'MetaRight',
    'CapsLock',

    // Symbols & punctuation
    'Minus',
    'Equal',
    'BracketLeft',
    'BracketRight',
    'Backslash',
    'Semicolon',
    'Quote',
    'Comma',
    'Period',
    'Slash',

    // Function keys
    'F1',
    'F2',
    'F3',
    'F4',
    'F5',
    'F6',
    'F7',
    'F8',
    'F9',
    'F10',
    'F11',
    'F12',

    // Numpad
    'NumLock',
    'Numpad0',
    'Numpad1',
    'Numpad2',
    'Numpad3',
    'Numpad4',
    'Numpad5',
    'Numpad6',
    'Numpad7',
    'Numpad8',
    'Numpad9',
    'NumpadAdd',
    'NumpadSubtract',
    'NumpadMultiply',
    'NumpadDivide',
    'NumpadDecimal',
    'NumpadEnter',

    // Misc
    'ScrollLock',
    'Pause',
    'PrintScreen',
    'ContextMenu',
  ]);

  /**
   * Normalize a code string to match the official `e.code` spec format.
   * Returns null if no match is found.
   */
  normalizeToStandardCode(input: string): string | null {
    if (!input || typeof input !== 'string') return null;

    if (this.STANDARD_CODES.has(input)) return input;

    const upper = input.trim();
    for (const code of this.STANDARD_CODES) {
      if (code.toLowerCase() === upper.toLowerCase()) {
        return code;
      }
    }

    return null;
  }

  normalizeOutput(rawKey: string): string {
    const normalizeKeyMap: Record<string, string> = {
      shiftleft: 'shift',
      shiftright: 'shift',
      controlleft: 'ctrl',
      controlright: 'ctrl',
      altleft: 'alt',
      altright: 'alt',
      metaleft: 'meta',
      metaright: 'meta',
      backspace: 'bksp',
      capslock: 'lock',
      enter: 'enter',
      tab: 'tab',
    };

    const key = rawKey.toLowerCase();
    return normalizeKeyMap[key] || (key.length > 1 ? key : rawKey);
  }

  /**
   * Transforms a KeyboardEvent's "key.code" string into a simple-keyboard layout format
   * @param  {object} e The KeyboardEvent
   * @returns {string} The simple-keyboard layout key
   */
  getSimpleKeyboardLayoutKey(e: KeyboardEvent): string {
    let output = '';

    const options = this.getOptions();
    const currentLayout = options?.layout?.default?.[1] ?? getDefaultLayout().default[1];
    if (this.lastLayout !== currentLayout) {
      this.lastLayout = currentLayout || '';
      const layout = options?.layout ?? getDefaultLayout();
      this.layoutJSON = this.mapLayoutToEventCodes(this.extractAndPadLayout(layout));
    }

    const eCode = this.normalizeToStandardCode(e.code);

    // if we have a valid code and it's in the layout, return early
    if (this.layoutJSON && eCode && this.layoutJSON[eCode]) {
      const layoutEntry = this.layoutJSON[eCode];
      output = this.shiftActive || this.capslockActive ? layoutEntry.shift.toString() : layoutEntry.normal.toString();

      const normalized = this.normalizeOutput(output);
      return normalized;
    }

    // fallback path for known safe keys
    const fallbackKeys = new Set(['backspace', 'enter', 'tab', 'escape']);
    const key = (e.key || '').toLowerCase();
    if (fallbackKeys.has(key)) {
      output = key;
      const normalized = this.normalizeOutput(output);
      return normalized;
    }

    // unmapped key — log it and return blank
    // console.warn('[simple-keyboard][Edge Case Triggered] Unmapped key event:', {
    //   code: e.code,
    //   key: e.key,
    //   keyCode: e.keyCode,
    //   layoutJSON: this.layoutJSON,
    //   userAgent: navigator.userAgent, // Browser + OS info
    //   platform: navigator.platform, // OS-level platform
    //   language: navigator.language, // Active input language (e.g., "ko-KR")
    //   imeMode:
    //     document.activeElement && 'inputMode' in document.activeElement
    //       ? (document.activeElement as HTMLInputElement | HTMLTextAreaElement).inputMode
    //       : 'unknown', // Input method
    //   isEditable: (document.activeElement as HTMLElement)?.isContentEditable || false, // Useful for composition
    //   time: new Date().toISOString(),
    // });

    return '';
  }

  /**
   * Retrieve key from keyCode
   */
  keyCodeToKey(keyCode: number): string {
    return (
      {
        8: 'Backspace',
        9: 'Tab',
        13: 'Enter',
        16: 'Shift',
        17: 'Ctrl',
        18: 'Alt',
        19: 'Pause',
        20: 'CapsLock',
        27: 'Esc',
        32: 'Space',
        33: 'PageUp',
        34: 'PageDown',
        35: 'End',
        36: 'Home',
        37: 'ArrowLeft',
        38: 'ArrowUp',
        39: 'ArrowRight',
        40: 'ArrowDown',
        45: 'Insert',
        46: 'Delete',
        48: '0',
        49: '1',
        50: '2',
        51: '3',
        52: '4',
        53: '5',
        54: '6',
        55: '7',
        56: '8',
        57: '9',
        65: 'A',
        66: 'B',
        67: 'C',
        68: 'D',
        69: 'E',
        70: 'F',
        71: 'G',
        72: 'H',
        73: 'I',
        74: 'J',
        75: 'K',
        76: 'L',
        77: 'M',
        78: 'N',
        79: 'O',
        80: 'P',
        81: 'Q',
        82: 'R',
        83: 'S',
        84: 'T',
        85: 'U',
        86: 'V',
        87: 'W',
        88: 'X',
        89: 'Y',
        90: 'Z',
        91: 'Meta',
        96: 'Numpad0',
        97: 'Numpad1',
        98: 'Numpad2',
        99: 'Numpad3',
        100: 'Numpad4',
        101: 'Numpad5',
        102: 'Numpad6',
        103: 'Numpad7',
        104: 'Numpad8',
        105: 'Numpad9',
        106: 'NumpadMultiply',
        107: 'NumpadAdd',
        109: 'NumpadSubtract',
        110: 'NumpadDecimal',
        111: 'NumpadDivide',
        112: 'F1',
        113: 'F2',
        114: 'F3',
        115: 'F4',
        116: 'F5',
        117: 'F6',
        118: 'F7',
        119: 'F8',
        120: 'F9',
        121: 'F10',
        122: 'F11',
        123: 'F12',
        144: 'NumLock',
        145: 'ScrollLock',
        186: ';',
        187: '=',
        188: ',',
        189: '-',
        190: '.',
        191: '/',
        192: '`',
        219: '[',
        220: '\\',
        221: ']',
        222: "'",
      }[keyCode] || ''
    );
  }

  /**
   * Extracts and pads a layout object
   * @param  {object} layout The layout object
   * @returns {object} The layout object with padding
   */
  extractAndPadLayout(layout: Record<string, string[]>): Record<string, (string | number)[][]> {
    const qwertyRowLengths = [14, 14, 13, 12, 3]; // Number of keys per QWERTY row

    const processedLayout: Record<string, (string | number)[][]> = { default: [], shift: [] };

    for (const type of ['default', 'shift']) {
      if (!layout[type]) continue; // Skip if layout type is missing

      const rows = layout[type].map((row) => row.split(' '));

      for (let i = 0; i < qwertyRowLengths.length; i++) {
        processedLayout[type][i] = rows[i] ? [...rows[i]] : [];
        while (processedLayout[type][i].length < qwertyRowLengths[i]) {
          processedLayout[type][i].push(-1); // Fill missing spots
        }
      }
    }

    return processedLayout;
  }

  /**
   * Maps a layout object to event codes
   * @param  {object} layout The layout object
   * @returns {object} The layout object with event codes
   */

  mapLayoutToEventCodes(layout: Record<string, (string | number)[][]>): Record<string, LayoutKeyMapping> {
    const mappedLayout: Record<string, LayoutKeyMapping> = {};

    const qwertyRows = [
      [
        'Backquote',
        'Digit1',
        'Digit2',
        'Digit3',
        'Digit4',
        'Digit5',
        'Digit6',
        'Digit7',
        'Digit8',
        'Digit9',
        'Digit0',
        'Minus',
        'Equal',
        'Backspace',
      ],
      [
        'Tab',
        'KeyQ',
        'KeyW',
        'KeyE',
        'KeyR',
        'KeyT',
        'KeyY',
        'KeyU',
        'KeyI',
        'KeyO',
        'KeyP',
        'BracketLeft',
        'BracketRight',
        'Backslash',
      ],
      [
        'CapsLock',
        'KeyA',
        'KeyS',
        'KeyD',
        'KeyF',
        'KeyG',
        'KeyH',
        'KeyJ',
        'KeyK',
        'KeyL',
        'Semicolon',
        'Quote',
        'Enter',
      ],
      ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'],
      ['ControlLeft', 'AltLeft', 'Space'],
    ];

    for (let rowIndex = 0; rowIndex < qwertyRows.length; rowIndex++) {
      for (let colIndex = 0; colIndex < qwertyRows[rowIndex].length; colIndex++) {
        const eventCode = qwertyRows[rowIndex][colIndex];
        const normalKey = layout.default[rowIndex][colIndex] ?? '';
        const shiftKey = layout.shift[rowIndex][colIndex] ?? '';

        mappedLayout[eventCode] = {
          normal: normalKey !== -1 ? normalKey : '',
          shift: shiftKey !== -1 ? shiftKey : '',
        };
      }
    }

    return mappedLayout;
  }

  isModifierKey = (e: KeyboardEvent): boolean => {
    return (
      e.altKey ||
      e.ctrlKey ||
      e.shiftKey ||
      ['Tab', 'CapsLock', 'Esc', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
        e.code || e.key || this.keyCodeToKey(e?.keyCode)
      )
    );
  };
}

export default PhysicalKeyboard;
