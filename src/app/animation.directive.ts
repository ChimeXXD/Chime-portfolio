import {
  animate,
  AnimationBuilder,
  AnimationMetadata,
  style,
} from '@angular/animations';
import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  Inject,
  Input,
  OnInit,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[aray-animate]',
  standalone: true,
})
export class AnimationDirective implements OnInit {
  @Input('aray-animate') arayAnimate: 'fadeIn' | '' = '';
  @Input('aray-duration') duration!: string;
  @Input('aray-delay') delay!: string;
  @Input('aray-easing') easing!: string;
  @Input('aray-offsetX') offsetX!: string;
  @Input('aray-offsetY') offsetY!: string;
  @Input('aray-scale') scale!: number;
  @Input('aray-opacity') opacity!: number;

  hostEl!: HTMLElement;
  observer!: IntersectionObserver;

  constructor(
    elRef: ElementRef,
    private builder: AnimationBuilder,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.hostEl = elRef.nativeElement;

    this.styleElement();
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) this.onload();
  }

  styleElement() {
    this.renderer.setStyle(
      this.hostEl,
      'transform',
      `translate(${this.offsetX || '0'}, ${this.offsetY || '0'}) scale(${
        this.scale || 1
      })`
    );
    this.renderer.setStyle(this.hostEl, 'opacity', this.opacity || 0);
  }

  trigger() {
    let animation: AnimationMetadata[] = [];

    if (this.arayAnimate == 'fadeIn') animation = this.fadeIn();

    const factory = this.builder.build(animation);
    const player = factory.create(this.hostEl);

    // start animation
    player.play();

    if ('IntersectionObserver' in window) {
      // Unobserve elements above viewport
      this.observer.unobserve(this.hostEl);
    } else {
      // Remove Listeners
      window.removeEventListener('scroll', this.onscroll);
      window.removeEventListener('resize', this.onscroll);
      window.removeEventListener('orientationChange', this.onscroll);
    }
  }

  fadeIn(): AnimationMetadata[] {
    return [
      style({
        opacity: this.opacity || 0,
        transform: `translate(${this.offsetX || '0'}, ${
          this.offsetY || '0'
        }) scale(${this.scale || 1})`,
      }),
      animate(
        `${this.duration || '500ms'} ${this.delay || '100ms'} ${
          this.easing || 'ease-out'
        }`,
        style({ opacity: 1, transform: 'translate(0, 0) scale(1)' })
      ),
    ];
  }

  onload() {
    if ('IntersectionObserver' in window) {
      this.onIntersect();
    } else {
      setTimeout(() => {
        this.onscroll();
        if (this.hostEl.offsetTop - scrollY < 0) this.trigger();
      }, 1);
    }
  }

  onIntersect() {
    // Register Host Element to the observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // triggers when animation is in the viewport or enters
          if (entry.isIntersecting && entry.boundingClientRect.top >= 0) {
            this.trigger();
          }
        });
      },
      {
        threshold: [0.1],
      }
    );

    // observe only elments within or below viewport
    this.observer.observe(this.hostEl);

    // trigger all elements animation above
    setTimeout(() => {
      if (this.hostEl.getBoundingClientRect().top < 0) {
        this.trigger();
      }
    }, 1);

    // shorten animation delay of element below viewport
    if (this.hostEl.getBoundingClientRect().top >= innerHeight) {
      this.delay = '100ms';
    }
  }

  onscroll = () => {
    // Add Listeners
    window.addEventListener('scroll', this.onscroll);
    window.addEventListener('resize', this.onscroll);
    window.addEventListener('orientationChange', this.onscroll);

    const SCROLLED_INTO_VIEW = scrollY + innerHeight;
    const threshold: number = this.hostEl.clientHeight / 5;
    const offsetTop = this.hostEl.offsetTop + threshold;

    // trigger animation if 10%+ element height is within the viewport
    if (offsetTop >= scrollY && offsetTop <= SCROLLED_INTO_VIEW) this.trigger();

    //   // shorten animation delay of element below viewport
    if (offsetTop >= SCROLLED_INTO_VIEW) this.delay = '100ms';
  };
}
