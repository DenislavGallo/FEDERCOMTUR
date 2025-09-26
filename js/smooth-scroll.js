/**
 * FederComTur - Enhanced Smooth Scroll
 * ====================================
 * Custom smooth scroll implementation with advanced easing
 */

'use strict';

class SmoothScroll {
    constructor() {
        this.isScrolling = false;
        this.scrollDuration = 800; // ms
        this.easingFunction = this.easeInOutCubic;
        
        this.init();
    }
    
    init() {
        // Override default anchor link behavior
        this.bindAnchorLinks();
        
        // Add scroll-to-top functionality
        this.addScrollToTop();
        
        console.log('✅ SmoothScroll initialized');
    }
    
    bindAnchorLinks() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;
            
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                this.scrollToElement(targetElement);
            }
        });
    }
    
    scrollToElement(element) {
        if (this.isScrolling) return;
        
        const startPosition = window.pageYOffset;
        const targetPosition = element.offsetTop - 100; // Account for fixed header
        const distance = targetPosition - startPosition;
        
        this.isScrolling = true;
        
        const startTime = performance.now();
        
        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.scrollDuration, 1);
            
            const easedProgress = this.easingFunction(progress);
            const currentPosition = startPosition + (distance * easedProgress);
            
            window.scrollTo(0, currentPosition);
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            } else {
                this.isScrolling = false;
            }
        };
        
        requestAnimationFrame(animateScroll);
    }
    
    addScrollToTop() {
        // Create scroll-to-top button
        const scrollButton = document.createElement('button');
        scrollButton.innerHTML = '↑';
        scrollButton.className = 'scroll-to-top';
        scrollButton.setAttribute('aria-label', 'Torna in cima');
        
        // Style the button
        Object.assign(scrollButton.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-navy)',
            color: 'white',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            opacity: '0',
            visibility: 'hidden',
            transition: 'all 0.3s ease',
            zIndex: '1000',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        });
        
        document.body.appendChild(scrollButton);
        
        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollButton.style.opacity = '1';
                scrollButton.style.visibility = 'visible';
            } else {
                scrollButton.style.opacity = '0';
                scrollButton.style.visibility = 'hidden';
            }
        });
        
        // Scroll to top on click
        scrollButton.addEventListener('click', () => {
            this.scrollToTop();
        });
    }
    
    scrollToTop() {
        if (this.isScrolling) return;
        
        const startPosition = window.pageYOffset;
        const distance = -startPosition;
        
        this.isScrolling = true;
        const startTime = performance.now();
        
        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.scrollDuration, 1);
            
            const easedProgress = this.easingFunction(progress);
            const currentPosition = startPosition + (distance * easedProgress);
            
            window.scrollTo(0, currentPosition);
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            } else {
                this.isScrolling = false;
            }
        };
        
        requestAnimationFrame(animateScroll);
    }
    
    // Easing functions
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    
    easeOutQuart(t) {
        return 1 - (--t) * t * t * t;
    }
    
    easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SmoothScroll();
});
