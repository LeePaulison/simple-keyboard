import './css/CandidateBox.css';
import Utilities from '../services/Utilities';
import { CandidateBoxParams, CandidateBoxRenderParams, CandidateBoxShowParams, KeyboardOptions } from './../interfaces';

class CandidateBox {
  utilities: Utilities;
  options: KeyboardOptions;
  candidateBoxElement: HTMLDivElement | null = null;
  pageIndex = 0;
  pageSize: number;
  private activeIndex = 0;
  private candidateOptions: HTMLLIElement[] = [];
  private globalLiveRegionElement: HTMLElement | null = document.querySelector('.hg-live-region');
  static isOpen = false;
  private handleActiveIndexBound: (e: KeyboardEvent) => void;
  private firstLastNavBound: (e: KeyboardEvent) => void;
  private listenersAttached = false;

  constructor({ utilities, options }: CandidateBoxParams) {
    this.utilities = utilities;
    this.options = options;
    Utilities.bindMethods(CandidateBox, this);
    this.pageSize = this.utilities.getOptions().layoutCandidatesPageSize || 5;
    this.handleActiveIndexBound = this.handleActiveIndex.bind(this);
    this.firstLastNavBound = this.firstLastNav.bind(this);
  }

  private attachDocListeners() {
    if (this.listenersAttached) return;
    // IMPORTANT: add the bound functions directly, no wrapper
    document.addEventListener('keydown', this.handleActiveIndexBound, { capture: false });
    document.addEventListener('keydown', this.firstLastNavBound, { capture: false });
    this.listenersAttached = true;
  }

  private detachDocListeners() {
    if (!this.listenersAttached) return;
    document.removeEventListener('keydown', this.handleActiveIndexBound, { capture: false });
    document.removeEventListener('keydown', this.firstLastNavBound, { capture: false });
    this.listenersAttached = false;
  }

  destroy(): void {
    this.detachDocListeners();

    if (this.candidateBoxElement) {
      setTimeout(() => {
        if (this.candidateBoxElement) {
          this.candidateBoxElement.remove();
          this.candidateBoxElement = null;
        }
        CandidateBox.isOpen = false;
      }, 30);
    }

    this.activeIndex = 0;
    this.candidateOptions = [];

    // Ensure no keyboard nav leaks persist
    const oldListbox = document.querySelector('.hg-candidate-box-list');
    if (oldListbox) {
      oldListbox.replaceWith(oldListbox.cloneNode(true)); // remove all listeners
    }

    this.pageIndex = 0;
  }

  show({ candidateValue, targetElement, onSelect }: CandidateBoxShowParams): void {
    if (!candidateValue || !candidateValue.length) return;

    const candidateListPages = this.utilities.chunkArray(candidateValue.split(' '), this.pageSize);

    this.renderPage({
      candidateListPages,
      targetElement,
      pageIndex: this.pageIndex,
      nbPages: candidateListPages.length,
      onItemSelected: (selectedCandidate: string, e: MouseEvent) => {
        onSelect(selectedCandidate, e);
        this.destroy();
      },
    });

    CandidateBox.isOpen = true;
  }

  private firstLastNav(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !CandidateBox.isOpen) return;

    const focusable = this.candidateBoxElement?.querySelectorAll<HTMLElement>('.hg-candidate-box-list-item');

    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.querySelector<HTMLElement>('.hg-candidate-box-list-item.active') === first) {
      e.preventDefault();
      last.setAttribute('aria-selected', 'true');
    } else if (!e.shiftKey && document.querySelector<HTMLElement>('.hg-candidate-box-list-item.active') === last) {
      e.preventDefault();
      first.setAttribute('aria-selected', 'true');
    }
  }

  renderPage({ candidateListPages, targetElement, pageIndex, nbPages, onItemSelected }: CandidateBoxRenderParams) {
    this.attachDocListeners();
    this.candidateBoxElement?.remove();

    this.candidateBoxElement = document.createElement('div');
    this.candidateBoxElement.className = 'hg-candidate-box';
    this.candidateBoxElement.setAttribute('role', 'dialog');
    this.candidateBoxElement.setAttribute('aria-label', 'Character Suggestions');
    this.candidateBoxElement.setAttribute('aria-describedby', 'candidate-box-instructions');

    const instructionsElement = document.createElement('div');
    instructionsElement.id = 'candidate-box-instructions';
    instructionsElement.classList.add('hg-candidate-box-instructions', 'sr-only');
    instructionsElement.innerHTML = 'Use up and down arrow keys to navigate, Enter to select.';
    this.candidateBoxElement.appendChild(instructionsElement);

    const candidateListULElement = document.createElement('ul');
    candidateListULElement.className = 'hg-candidate-box-list';
    candidateListULElement.setAttribute('role', 'listbox');
    candidateListULElement.setAttribute('tabindex', '-1');

    candidateListPages[pageIndex].forEach((candidateListItem, i) => {
      const candidateListLIElement = document.createElement('li');
      candidateListLIElement.setAttribute('role', 'option');
      candidateListLIElement.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      candidateListLIElement.id = `key-candidate-${i}`;
      candidateListLIElement.className = 'hg-candidate-box-list-item';
      candidateListLIElement.innerHTML = this.options.display?.[candidateListItem] || candidateListItem;

      const getMouseEvent = () => {
        const mouseEvent = new (this.options.useTouchEvents ? TouchEvent : MouseEvent)('click');
        Object.defineProperty(mouseEvent, 'target', { value: candidateListLIElement });
        return mouseEvent;
      };

      candidateListLIElement.onclick = (e = getMouseEvent() as MouseEvent) => {
        if (this.globalLiveRegionElement) {
          const label = candidateListLIElement.textContent?.trim();
          this.globalLiveRegionElement.textContent = `Inserted: ${label}`;
        }
        onItemSelected(candidateListItem, e);
      };

      if (this.options.useTouchEvents) {
        candidateListLIElement.ontouchstart = (e: any) => {
          if (this.globalLiveRegionElement) {
            const label = candidateListLIElement.textContent?.trim();
            this.globalLiveRegionElement.textContent = `Inserted: ${label}`;
          }
          onItemSelected(candidateListItem, e || getMouseEvent());
        };
      }

      candidateListULElement.appendChild(candidateListLIElement);
    });

    const isPrevBtnElementActive = pageIndex > 0;
    const prevBtnElement = document.createElement('div');
    prevBtnElement.classList.add('hg-candidate-box-prev');
    if (isPrevBtnElementActive) prevBtnElement.classList.add('hg-candidate-box-btn-active');

    prevBtnElement.onclick = () => {
      if (!isPrevBtnElementActive) return;
      this.renderPage({ candidateListPages, targetElement, pageIndex: pageIndex - 1, nbPages, onItemSelected });
    };

    const isNextBtnElementActive = pageIndex < nbPages - 1;
    const nextBtnElement = document.createElement('div');
    nextBtnElement.classList.add('hg-candidate-box-next');
    if (isNextBtnElementActive) nextBtnElement.classList.add('hg-candidate-box-btn-active');

    nextBtnElement.onclick = () => {
      if (!isNextBtnElementActive) return;
      this.renderPage({ candidateListPages, targetElement, pageIndex: pageIndex + 1, nbPages, onItemSelected });
    };

    this.candidateBoxElement.appendChild(prevBtnElement);
    this.candidateBoxElement.appendChild(candidateListULElement);
    this.candidateBoxElement.appendChild(nextBtnElement);

    this.candidateBoxElement.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.destroy();
      }
    });

    targetElement.prepend(this.candidateBoxElement);

    this.setupKeyboardNav(candidateListULElement);
  }

  private handleActiveIndex(e: KeyboardEvent): void {
    if (!CandidateBox.isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.updateActiveIndex((this.activeIndex + 1) % this.candidateOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.updateActiveIndex((this.activeIndex - 1 + this.candidateOptions.length) % this.candidateOptions.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.activateSelectedOption();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.destroy();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
    }
  }

  private setupKeyboardNav(listbox: HTMLUListElement) {
    this.candidateOptions = Array.from(listbox.querySelectorAll('[role="option"]'));
    this.candidateOptions.forEach((option, i) => {
      if (!option.id) option.id = `candidate-${i}`;
    });

    this.setActiveOption(0);
  }

  private setActiveOption(index: number): void {
    this.activeIndex = index;
    this.updateActiveIndex(index);
  }

  private updateActiveIndex(newIndex: number): void {
    const prev = this.candidateOptions[this.activeIndex];
    const next = this.candidateOptions[newIndex];

    if (prev) {
      prev.setAttribute('aria-selected', 'false');
      prev.classList.remove('active');
    }

    this.activeIndex = newIndex;

    if (next) {
      next.setAttribute('aria-selected', 'true');
      next.classList.add('active');
      next.scrollIntoView({ block: 'nearest' });

      if (this.globalLiveRegionElement) {
        const total = this.candidateOptions.length;
        const label = next.textContent?.trim();
        this.globalLiveRegionElement.textContent = `${newIndex + 1} of ${total}: ${label}`;
      }

      if (!this.candidateBoxElement) return;

      const listbox = this.candidateBoxElement.querySelector('.hg-candidate-box-list');
      if (listbox) {
        listbox.setAttribute('aria-activedescendant', next.id);
      }
    }
  }

  private activateSelectedOption(): void {
    const activeOption = this.candidateOptions[this.activeIndex];
    if (!activeOption) return;

    // Update live region before triggering the click
    if (this.globalLiveRegionElement) {
      const label = activeOption.textContent?.trim();
      this.globalLiveRegionElement.textContent = `Inserted: ${label}`;
    }

    // Then trigger selection
    activeOption.click();
    activeOption.setAttribute('aria-selected', 'false');
  }
}

export default CandidateBox;
