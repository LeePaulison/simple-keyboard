import './css/CandidateBox.css';
import Utilities from '../services/Utilities';
import { CandidateBoxParams, CandidateBoxRenderParams, CandidateBoxShowParams, KeyboardOptions } from './../interfaces';
declare class CandidateBox {
    utilities: Utilities;
    options: KeyboardOptions;
    candidateBoxElement: HTMLDivElement | null;
    pageIndex: number;
    pageSize: number;
    private activeIndex;
    private candidateOptions;
    private globalLiveRegionElement;
    constructor({ utilities, options }: CandidateBoxParams);
    destroy(): void;
    show({ candidateValue, targetElement, onSelect }: CandidateBoxShowParams): void;
    renderPage({ candidateListPages, targetElement, pageIndex, nbPages, onItemSelected }: CandidateBoxRenderParams): void;
    private setupKeyboardNav;
    private setActiveOption;
    private updateActiveIndex;
    private activateSelectedOption;
}
export default CandidateBox;
