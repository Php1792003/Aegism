import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins safely
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

/* -------------------------------------------------------------------------- */
/*  CORE HOOK                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Custom hook to execute GSAP animations inside a scoped container with auto-cleanup.
 * Guarantees zero memory leaks and proper ScrollTrigger refreshing.
 */
export function useGsapScope<T extends HTMLElement = HTMLDivElement>(
    animationCallback: (context: gsap.Context, container: T) => void,
    deps: React.DependencyList = []
) {
    const containerRef = useRef<T | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        let ctx: gsap.Context | null = null;
        try {
            ctx = gsap.context((self) => {
                try {
                    animationCallback(self, el);
                } catch (err) {
                    console.warn('[useGsapScope] Animation callback error:', err);
                }
            }, el);
        } catch (err) {
            console.warn('[useGsapScope] Context initialization error:', err);
        }

        return () => {
            if (ctx) {
                ctx.revert();
            }
        };
    }, deps);

    return containerRef;
}

/* -------------------------------------------------------------------------- */
/*  BASIC PRESETS (backward-compatible)                                       */
/* -------------------------------------------------------------------------- */

/**
 * Standard GSAP fade-in-up animation preset for hero sections.
 */
export function animateHero(container: HTMLElement) {
    const targets = container.querySelectorAll('[data-gsap="hero"]');
    if (!targets.length) return;

    gsap.fromTo(
        targets,
        { opacity: 0, y: 32 },
        {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out',
        }
    );
}

/**
 * ScrollTrigger fade-in preset for cards, features and content grids.
 */
export function animateOnScroll(container: HTMLElement, selector: string = '[data-gsap="fade-up"]', stagger: number = 0.1) {
    const elements = container.querySelectorAll(selector);
    if (!elements.length) return;

    elements.forEach((el) => {
        gsap.fromTo(
            el,
            { opacity: 0, y: 36 },
            {
                opacity: 1,
                y: 0,
                duration: 0.75,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });
}

/**
 * Stagger reveal for grouped items when scrolled into view.
 */
export function animateGroupOnScroll(groupTrigger: HTMLElement, itemSelector: string = '[data-gsap="item"]') {
    const items = groupTrigger.querySelectorAll(itemSelector);
    if (!items.length) return;

    gsap.fromTo(
        items,
        { opacity: 0, y: 28, scale: 0.97 },
        {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.65,
            stagger: 0.08,
            ease: 'back.out(1.2)',
            scrollTrigger: {
                trigger: groupTrigger,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
        }
    );
}

/* -------------------------------------------------------------------------- */
/*  ADVANCED PRESETS (Landing Page quality)                                    */
/* -------------------------------------------------------------------------- */

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Animate split-word headings: each word slides up with slight rotation.
 * Targets `[data-split] .split-word` elements.
 */
export function animateSplitWords(container: HTMLElement) {
    const headings = container.querySelectorAll('[data-split]');
    headings.forEach((h) => {
        const chars = h.querySelectorAll('.split-char');
        if (chars.length) {
            gsap.fromTo(
                chars,
                { opacity: 0 },
                {
                    opacity: 1,
                    duration: 0.2,
                    ease: 'none',
                    stagger: 0.03,
                    scrollTrigger: { trigger: h, start: 'top 85%', once: true },
                }
            );
        }
    });
}

/**
 * Batch fade-in-up for `[data-reveal="up"]` elements using ScrollTrigger.batch.
 */
export function animateRevealBatch(container: HTMLElement) {
    const upEls = container.querySelectorAll('[data-reveal="up"]');
    if (!upEls.length) return;

    gsap.set(upEls, { autoAlpha: 0, y: 48 });
    ScrollTrigger.batch(upEls, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) =>
            gsap.to(batch, {
                autoAlpha: 1,
                y: 0,
                duration: 0.9,
                ease: 'power3.out',
                stagger: 0.12,
                overwrite: true,
            }),
    });
}

/**
 * Directional reveals: left, right, and scale variants.
 */
export function animateRevealDirection(container: HTMLElement) {
    const qa = (s: string) => container.querySelectorAll<HTMLElement>(s);

    qa('[data-reveal="left"]').forEach((n) =>
        gsap.from(n, {
            x: -90,
            autoAlpha: 0,
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: n, start: 'top 85%', once: true },
        })
    );

    qa('[data-reveal="right"]').forEach((n) =>
        gsap.from(n, {
            x: 90,
            autoAlpha: 0,
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: n, start: 'top 85%', once: true },
        })
    );

    qa('[data-reveal="scale"]').forEach((n) =>
        gsap.from(n, {
            scale: 0.9,
            autoAlpha: 0,
            duration: 1.1,
            ease: 'expo.out',
            scrollTrigger: { trigger: n, start: 'top 85%', once: true },
        })
    );
}

/**
 * Scroll progress bar at top of page. Targets `[data-progress]`.
 */
export function animateProgressBar(container: HTMLElement) {
    const bars = container.querySelectorAll('[data-progress]');
    if (!bars.length) return;

    gsap.fromTo(
        bars,
        { scaleX: 0 },
        { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } }
    );
}

/**
 * Counter animation for `[data-count]` elements.
 */
export function animateCounter(container: HTMLElement) {
    container.querySelectorAll<HTMLElement>('[data-count]').forEach((node) => {
        const target = parseFloat(node.dataset.count || '0');
        const dec = parseInt(node.dataset.decimals || '0', 10);
        const suffix = node.dataset.suffix || '';
        if (!target) return;

        const fmt = (v: number) =>
            v.toLocaleString('vi-VN', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
        const obj = { v: 0 };
        node.textContent = fmt(0);

        gsap.to(obj, {
            v: target,
            duration: 2.2,
            ease: 'power2.out',
            scrollTrigger: { trigger: node, start: 'top 92%', once: true },
            onUpdate: () => {
                node.textContent = fmt(obj.v);
            },
        });
    });
}

/**
 * Stagger group reveal for `[data-stagger-group]` containers.
 * Children with `[data-stagger-item]` animate in sequence.
 */
export function animateStaggerGroup(container: HTMLElement) {
    container.querySelectorAll<HTMLElement>('[data-stagger-group]').forEach((group) => {
        const items = group.querySelectorAll('[data-stagger-item]');
        if (!items.length) return;

        gsap.from(items, {
            y: 40,
            autoAlpha: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: group, start: 'top 85%', once: true },
        });
    });
}

/**
 * Hero entrance: split-word title + staggered child elements.
 * Targets `[data-hero-entrance]` children in sequence.
 */
export function animateHeroEntrance(container: HTMLElement) {
    const heroEls = container.querySelectorAll('[data-hero-entrance]');
    if (!heroEls.length) return;

    // Animate hero entrance elements with stagger
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // First, animate the split-char title if present (typewriter effect)
    const titleChars = container.querySelectorAll('[data-hero-entrance="title"] .split-char');
    if (titleChars.length) {
        tl.fromTo(
            titleChars,
            { opacity: 0 },
            {
                opacity: 1,
                duration: 0.15,
                stagger: 0.015,
                ease: 'none'
            }
        );
    }

    // Then animate remaining hero elements
    heroEls.forEach((el) => {
        const role = (el as HTMLElement).dataset.heroEntrance;
        if (role === 'title') return; // already handled
        tl.fromTo(
            el,
            { y: 20, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.6, overwrite: 'auto' },
            role === 'badge' ? 0 : '-=0.4'
        );
    });
}

/**
 * Image clip-path reveal: image slides open from left.
 * Targets `[data-reveal="clip"]`.
 */
export function animateClipReveal(container: HTMLElement) {
    container.querySelectorAll<HTMLElement>('[data-reveal="clip"]').forEach((n) =>
        gsap.fromTo(
            n,
            { clipPath: 'inset(0 100% 0 0)', autoAlpha: 0 },
            {
                clipPath: 'inset(0 0% 0 0)',
                autoAlpha: 1,
                duration: 1.2,
                ease: 'expo.out',
                scrollTrigger: { trigger: n, start: 'top 85%', once: true },
            }
        )
    );
}

/* -------------------------------------------------------------------------- */
/*  PAGE-LEVEL ORCHESTRATOR                                                   */
/* -------------------------------------------------------------------------- */

/**
 * All-in-one page animation setup, wrapped in matchMedia for reduced-motion.
 * Call this in useLayoutEffect with a root ref.
 *
 * Returns a cleanup function.
 */
export function createPageAnimations(el: HTMLElement): () => void {
    const mm = gsap.matchMedia();

    mm.add(
        { ok: '(prefers-reduced-motion: no-preference)' },
        () => {
            // Progress bar
            animateProgressBar(el);

            // Hero entrance (split-word + stagger)
            animateHeroEntrance(el);

            // Split-word section headings
            animateSplitWords(el);

            // Batch reveal (up)
            animateRevealBatch(el);

            // Directional reveals (left, right, scale)
            animateRevealDirection(el);

            // Clip-path reveals
            animateClipReveal(el);

            // Stagger groups
            animateStaggerGroup(el);

            // Counters
            animateCounter(el);

            // Sort and refresh
            ScrollTrigger.sort();
            ScrollTrigger.refresh();

            const onLoad = () => ScrollTrigger.refresh();
            window.addEventListener('load', onLoad);
            return () => window.removeEventListener('load', onLoad);
        },
        el
    );

    return () => mm.revert();
}

/**
 * Hook version of createPageAnimations — use in page components.
 * Returns a ref to attach to the root element.
 */
export function usePageAnimations<T extends HTMLElement = HTMLDivElement>() {
    const root = useRef<T>(null);

    useLayoutEffect(() => {
        const el = root.current;
        if (!el) return;
        return createPageAnimations(el);
    }, []);

    return root;
}

export { gsap, ScrollTrigger };
