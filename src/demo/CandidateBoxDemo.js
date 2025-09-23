import Keyboard from '../lib';
import './css/CandidateBoxDemo.css';

const setDOM = () => {
  document.querySelector('body').innerHTML = `
    <textarea class="input" placeholder="Tap on the virtual keyboard to start" cols="111" rows="10" wrap="soft" resize="none"></textarea>
    <div class="instructions">F8: Focus editor | F9: Focus keyboard</div>
    <div class="roving-instructions"><strong>Physical Keyboard instructions:</strong><br/>Use the physical keyboard to type.</div>
    <div class="simple-keyboard"></div>
  `;
};

class Demo {
  rovingInstructions;
  constructor() {
    setDOM();

    /**
     * Update simple-keyboard when input is changed directly
     */
    const inputEl = document.querySelector('.input');
    inputEl.style.borderRadius = '.5rem';
    inputEl.style.padding = '.5rem';
    inputEl.style.outline = '2px solid #0a1827ff';
    const keyboardEl = document.querySelector('.simple-keyboard');

    document.addEventListener('keydown', (e) => {
      if (e.key === 'F9') {
        this.keyboard.setOptions({ activeSurface: 'keyboard' });
        keyboardEl.style.outline = '2px solid #0a1827ff';
        inputEl.style.outline = 'none';
      }
      if (e.key === 'F8') {
        this.keyboard.setOptions({ activeSurface: 'editor' });
        inputEl.style.outline = '2px solid #0a1827ff';
        inputEl.style.outlineOffset = '-2px';
        inputEl.style.borderRadius = '.5rem';
        keyboardEl.style.outline = 'none';
      }
    });

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
      useLiveRegion: true,
      autoFocus: true,
      restoreFocusOnChange: 'content',
      activeSurface: 'editor',
      onRovingToggle: (isActive) => {
        this.setRovingInstructions();
      },
      newLineOnEnter: true,
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

  setRovingInstructions() {
    console.log('Roving tabindex is active:', this.keyboard.isRovingActive());
    this.rovingInstructions = document.querySelector('.roving-instructions');
    this.rovingInstructions.innerHTML = this.keyboard.isRovingActive()
      ? `
      <strong>Roving tabindex instructions:</strong><br/>
      Use the arrow keys to navigate between elements.
    `
      : '<strong>Physical Keyboard instructions:</strong><br/>Use the physical keyboard to type.';
  }

  onChange(input) {
    const inputElement = document.querySelector('.input');
    console.log('Input changed', input);
    /**
     * Updating input's value
     */
    inputElement.value = input;
    /**
     * Synchronizing input caret position
     */
    const caretPosition = this.keyboard.caretPosition;
    if (caretPosition !== null) this.setInputCaretPosition(inputElement, caretPosition);

    this.keyboard.setInput(input, '_focusRestore');
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
