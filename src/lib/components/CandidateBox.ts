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

  constructor({ utilities, options }: CandidateBoxParams) {
    this.utilities = utilities;
    this.options = options;
    Utilities.bindMethods(CandidateBox, this);
    this.pageSize = this.utilities.getOptions().layoutCandidatesPageSize || 5;
  }

  destroy(): void {
    if (this.candidateBoxElement) {
      this.candidateBoxElement.remove();
      this.candidateBoxElement = null;
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
  }

  renderPage({ candidateListPages, targetElement, pageIndex, nbPages, onItemSelected }: CandidateBoxRenderParams) {
    this.candidateBoxElement?.remove();

    this.candidateBoxElement = document.createElement('div');
    this.candidateBoxElement.className = 'hg-candidate-box';

    const candidateListULElement = document.createElement('ul');
    candidateListULElement.className = 'hg-candidate-box-list';
    candidateListULElement.setAttribute('role', 'listbox');
    candidateListULElement.setAttribute('tabindex', '0');

    candidateListPages[pageIndex].forEach((candidateListItem, i) => {
      const candidateListLIElement = document.createElement('li');
      candidateListLIElement.setAttribute('role', 'option');
      candidateListLIElement.setAttribute('tabindex', '-1');
      candidateListLIElement.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      candidateListLIElement.id = `candidate-${i}`;
      candidateListLIElement.className = 'hg-candidate-box-list-item';
      candidateListLIElement.innerHTML = this.options.display?.[candidateListItem] || candidateListItem;

      const getMouseEvent = () => {
        const mouseEvent = new (this.options.useTouchEvents ? TouchEvent : MouseEvent)('click');
        Object.defineProperty(mouseEvent, 'target', { value: candidateListLIElement });
        return mouseEvent;
      };

      if (this.options.useTouchEvents) {
        candidateListLIElement.ontouchstart = (e: any) => onItemSelected(candidateListItem, e || getMouseEvent());
      } else {
        candidateListLIElement.onclick = (e = getMouseEvent() as MouseEvent) => onItemSelected(candidateListItem, e);
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

    candidateListULElement.focus();
    this.setupKeyboardNav(candidateListULElement);
  }

  private setupKeyboardNav(listbox: HTMLUListElement) {
    this.candidateOptions = Array.from(listbox.querySelectorAll('[role="option"]'));
    this.candidateOptions.forEach((option, i) => {
      if (!option.id) option.id = `candidate-${i}`;
    });

    this.setActiveOption(0);

    listbox.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.updateActiveIndex((this.activeIndex + 1) % this.candidateOptions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.updateActiveIndex((this.activeIndex - 1 + this.candidateOptions.length) % this.candidateOptions.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.activateSelectedOption();
      }
    });
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

    // Trigger the click handler manually
    activeOption.click();
  }
}

export default CandidateBox;
