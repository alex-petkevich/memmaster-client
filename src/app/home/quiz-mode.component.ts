import { Component, Input, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { IDictionaryPair } from '../model/name_value.model';

@Component({
  selector: 'app-quiz-mode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-mode.component.html',
  styleUrls: ['./quiz-mode.component.scss']
})
export class QuizModeComponent implements OnChanges {
  @Input() cards: IDictionaryPair[] = [];

  index = 0;
  score = 0;
  feedback: 'correct' | 'incorrect' | null = null;
  options: string[] = [];
  locked = false;
  selectedOption: string | null = null;
  finished = false;
  ariaMessage = '';

  constructor(private translate: TranslateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cards']) {
      this.reset();
    }
  }

  reset(): void {
    this.index = 0;
    this.score = 0;
    this.feedback = null;
    this.options = [];
    this.locked = false;
    this.finished = false;
    this.prepareQuestion();
  }

  // Public wrapper for template retry button (avoids template type-check visibility issues)
  onRetry(): void {
    this.reset();
  }

  get currentCard(): IDictionaryPair | null {
    return this.cards && this.cards.length > 0 ? this.cards[this.index] : null;
  }

  private prepareQuestion(): void {
    this.feedback = null;
    this.locked = false;
    this.selectedOption = null;
    if (!this.currentCard) {
      this.finished = true;
      this.ariaMessage = this.translate.instant('home.learn.aria.finished.quiz', { score: this.score, total: this.cards.length });
      return;
    }
    this.options = this.buildOptionsForCard(this.currentCard);
    // announce question
    this.ariaMessage = this.translate.instant('home.learn.aria.question', { index: this.index + 1, total: this.cards.length });
  }

  private buildOptionsForCard(card: IDictionaryPair | null): string[] {
    if (!card) return [];
    const correct = card.value ? card.value.toString() : '';
    const distractors: string[] = [];
    for (const c of this.cards) {
      if (!c || !c.value) continue;
      const v = c.value.toString();
      if (v === correct) continue;
      if (!distractors.includes(v)) distractors.push(v);
      if (distractors.length >= 3) break;
    }
    // ensure at least 3 distractors by sampling allCards
    while (distractors.length < 3 && this.cards.length > 0) {
      const sample = this.cards[Math.floor(Math.random() * this.cards.length)];
      const v = sample?.value ? sample.value.toString() : '';
      if (v && v !== correct && !distractors.includes(v)) distractors.push(v);
    }
    const opts = [correct, ...distractors.slice(0, 3)];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }

  onChoose(opt: string): void {
    if (this.locked || !this.currentCard) return;
    this.locked = true;
    this.selectedOption = opt;
    const correct = this.currentCard.value ? this.currentCard.value.toString() : '';
    const ok = opt === correct;
    if (ok) this.score++;
    this.feedback = ok ? 'correct' : 'incorrect';
    this.ariaMessage = ok ? this.translate.instant('home.learn.aria.correct') : this.translate.instant('home.learn.aria.incorrect', { answer: correct });
    setTimeout(() => {
      this.index++;
      if (this.index >= this.cards.length) {
        this.finished = true;
      } else {
        this.prepareQuestion();
      }
    }, 600);
  }

  // Keyboard shortcuts: 1-4 to choose option, Enter to retry when finished
  @HostListener('window:keydown', ['$event'])
  handleKeydown(ev: KeyboardEvent) {
    const tag = (ev.target && (ev.target as HTMLElement).tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (ev.target as HTMLElement)?.isContentEditable) return;

    if (this.finished) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        this.reset();
      }
      return;
    }

    if (ev.key >= '1' && ev.key <= '4') {
      const idx = parseInt(ev.key, 10) - 1;
      if (this.options && this.options[idx]) {
        ev.preventDefault();
        this.onChoose(this.options[idx]);
      }
    }
  }
}

