import Keyboard from '../lib';
import './css/CandidateBoxDemo.css';

const setDOM = () => {
  document.querySelector('body').innerHTML = `
    <input class="input" placeholder="Tap on the virtual keyboard to start" />
    <div class="simple-keyboard"></div>
  `;
};

class Demo {
  constructor() {
    setDOM();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'F9') {
        this.keyboard.setOptions({ activeSurface: 'keyboard' });
        console.log('[Demo] activeSurface set to keyboard');
      }
      if (e.key === 'F10') {
        this.keyboard.setOptions({ activeSurface: 'editor' });
        console.log('[Demo] activeSurface set to editor');
      }
    });

    /**
     * Update simple-keyboard when input is changed directly
     */
    const inputEl = document.querySelector('.input');

    /**
     * Demo Start
     */
    this.keyboard = new Keyboard({
      onChange: (input) => this.onChange(input),
      onKeyPress: (button) => this.onKeyPress(button),
      useMouseEvents: true,
      preventMouseDownDefault: true,
      layoutCandidatesPageSize: 15,
      layoutCandidates: {
        ni: '你 尼 你 尼 你 尼 你 尼 你 尼 你 尼 你 尼 你 尼 你 尼 你 尼',
        hao: '好 号',
      },
      physicalKeyboardHighlight: true,
      physicalKeyboardHighlightPress: true,
      physicalKeyboardHighlightPreventDefault: true,
      autoFocus: true,
      restoreFocusOnChange: 'content',
      activeSurface: 'editor',
      debug: true,
    });

    // Prevent physical spacebar inserting spaces
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
      }
    });

    // Keep input and keyboard in sync
    inputEl.addEventListener('input', (e) => {
      this.keyboard.setInput(e.target.value);
    });
  }

  hasFocus() {
    console.log('Who has focus?', document.activeElement);
  }

  onChange(input) {
    const inputElement = document.querySelector('.input');

    /**
     * Updating input's value
     */
    inputElement.value = input;
    // Replace space characters with ␣ for debugging
    const visible = input.replace(/ /g, '␣');
    /**
     * Synchronizing input caret position
     */
    const caretPosition = this.keyboard.caretPosition;
    if (caretPosition !== null) this.setInputCaretPosition(inputElement, caretPosition);

    this.keyboard.setInput(input, '_focusRestore');
    this.hasFocus();
  }

  setInputCaretPosition(elem, pos) {
    if (elem.setSelectionRange) {
      elem.focus();
      elem.setSelectionRange(pos, pos);
    }
  }

  onKeyPress(button) {
    console.log('Button pressed', button);

    /**
     * If you want to handle the shift and caps lock buttons
     */
    if (button === '{shift}' || button === '{lock}') this.handleShift();
  }

  handleShift() {
    const currentLayout = this.keyboard.options.layoutName;
    const shiftToggle = currentLayout === 'default' ? 'shift' : 'default';

    this.keyboard.setOptions({
      layoutName: shiftToggle,
    });
  }
}

export default Demo;
