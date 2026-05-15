import { Component, Input, OnChanges, OnDestroy, SimpleChanges, HostListener } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { IDictionaryPair } from '../model/name_value.model';

@Component({
  selector: 'app-test-mode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test-mode.component.html',
  styleUrls: ['./test-mode.component.scss']
})
export class TestModeComponent implements OnChanges, OnDestroy {
  @Input() cards: IDictionaryPair[] = [];
  @Input() perQuestionSeconds = 10;

  index = 0;
  score = 0;
  fails = 0;
  timeLeft = 0;
  finished = false;
  options: string[] = [];
    feedback: 'correct' | 'incorrect' | null = null;
    selectedOption: string | null = null;
  private timerRef: any = null;
  ariaMessage = '';

  constructor(private translate: TranslateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cards']) {
      this.reset();
    }
  }

  ngOnDestroy(): void {
    if (this.timerRef) { clearInterval(this.timerRef); this.timerRef = null; }
  }

  reset(): void {
    this.index = 0; this.score = 0; this.fails = 0; this.finished = false; this.options = [];
    this.prepareQuestion();
  }

  // Public wrapper for template retry button
  onRetry(): void {
    this.reset();
  }

  get currentCard(): IDictionaryPair | null {
    return this.cards && this.cards.length > 0 ? this.cards[this.index] : null;
  }

  private prepareQuestion(): void {
    if (!this.currentCard) { this.finished = true; return; }
    this.timeLeft = this.perQuestionSeconds;
    this.feedback = null;
    this.selectedOption = null;
    this.options = this.buildOptionsForCard(this.currentCard);
    if (this.timerRef) { clearInterval(this.timerRef); this.timerRef = null; }
    this.timerRef = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) this.onTimeout();
    }, 1000);
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
    if (this.finished || !this.currentCard) return;
    this.selectedOption = opt;
    const correct = this.currentCard.value ? this.currentCard.value.toString() : '';
    const ok = opt === correct;
    if (ok) this.score++; else this.fails++;
    this.ariaMessage = ok ? this.translate.instant('home.learn.aria.correct') : this.translate.instant('home.learn.aria.incorrect', { answer: correct });
    this.feedback = ok ? 'correct' : 'incorrect';
    if (this.fails > 3) { this.end(); return; }
    setTimeout(() => {
      this.nextQuestion();
    }, 600);
  }

  private onTimeout(): void {
    this.fails++;
    this.ariaMessage = this.translate.instant('home.learn.aria.timeup');
    if (this.fails > 3) { this.end(); return; }
    setTimeout(() => {
      this.nextQuestion();
    }, 600);
  }

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

  private nextQuestion(): void {
    if (this.timerRef) { clearInterval(this.timerRef); this.timerRef = null; }
    this.index++;
    if (this.index >= this.cards.length) { this.end(); return; }
    this.prepareQuestion();
  }

  private end(): void {
    if (this.timerRef) { clearInterval(this.timerRef); this.timerRef = null; }
    this.finished = true;
    this.ariaMessage = this.translate.instant('home.learn.aria.finished.test', { score: this.score, fails: this.fails });
  }
}

