/**
 * FederComTur - GSAP Animations
 * =============================
 */

'use strict';

// Animation controller
const FederAnimations = {
    // Animation settings
    settings: {
        ease: "power2.out",
        duration: 0.6,
        stagger: 0.1
    },
    
    // Initialize all animations
    init() {
        console.log('🎨 Initializing GSAP animations...');
        
        // Wait for GSAP to load
        if (typeof gsap === 'undefined') {
            console.warn('GSAP not loaded, animations disabled');
            return;
        }
        
        // Register GSAP plugins - ScrollTrigger DISABILITATO per prevenire comportamenti di navbar sticky
        gsap.registerPlugin(TextPlugin); // ScrollTrigger rimosso
        
        // Initialize animations
        this.initHeroAnimations();
        this.initNewsletterAnimations();
        this.initScrollAnimations();
        this.initMicroInteractions();
        
        console.log('✅ GSAP animations initialized');
    },
    // Hero section animations
    initHeroAnimations() {
        const heroTitle = document.getElementById('hero-title');
        const heroIllustration = document.getElementById('hero-illustration');
        
        if (heroTitle) {
            // Split text animation for title
            const titleLines = heroTitle.querySelectorAll('.title-line');
            
            gsap.fromTo(titleLines, 
                {
                    opacity: 0,
                    y: 100,
                    rotationX: -90
                },
                {
                    opacity: 1,
                    y: 0,
                    rotationX: 0,
                    duration: 1.2,
                    ease: "back.out(1.7)",
                    stagger: 0.2,
                    delay: 0.3
                }
            );
        }
        
        // Hero subtitle animation
        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (heroSubtitle) {
            gsap.fromTo(heroSubtitle,
                {
                    opacity: 0,
                    y: 30
                },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: this.settings.ease,
                    delay: 0.8
                }
            );
        }
        
        // Hero CTA animation
        const heroCta = document.querySelector('.hero-cta');
        if (heroCta) {
            gsap.fromTo(heroCta,
                {
                    opacity: 0,
                    y: 30,
                    scale: 0.8
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    ease: "back.out(1.7)",
                    delay: 1.1
                }
            );
        }
        
        // Figure geometriche rimosse - animazioni eliminate
        if (heroIllustration) {
            // Le figure geometriche sono state rimosse dall'HTML
            // Manteniamo solo il contenitore hero-illustration
        }
        
        // Optimized parallax effect for hero illustration (desktop only)
        this.initParallaxEffect(heroIllustration);
    },
    
    // Separate parallax initialization with responsive handling
    initParallaxEffect(element) {
        if (!element) return;
        
        let parallaxTrigger = null;
        
        const  createParallax = () => {
            if (window.innerWidth > 1024 && !parallaxTrigger) {
                console.log('🖥️ Desktop detected - Enabling optimized parallax effect');
                // ScrollTrigger disabilitato - comportamento parallax rimosso
                /* parallaxTrigger = ScrollTrigger.create({
                    trigger: element,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 0.3, // Smoother scrubbing
                    invalidateOnRefresh: true, // Prevent cached positions
                    onUpdate: self => {
                        const progress = self.progress;
                        gsap.set(element, {
                            y: progress * -25, // Reduced movement to prevent ghosting
                            force3D: true,
                            ease: "none"
                        });
                    }
                }); */
            } else if (window.innerWidth <= 1024 && parallaxTrigger) {
                console.log('📱 Mobile/Tablet detected - Disabling parallax effect');
                // parallaxTrigger.kill(); - disabilitato
                parallaxTrigger = null;
                gsap.set(element, { clearProps: "y" }); // Reset position
            }
        };
        
        // Initialize
        createParallax();
        
        // Handle resize
        window.addEventListener('resize', this.debounce(() => {
            createParallax();
        }, 250));
    },
    
    // Add debounce utility if not already present
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Continue with other animations...
    
    // Newsletter section background transition
    initNewsletterAnimations() {
        const newsletterSection = document.getElementById('newsletter-section');
        if (!newsletterSection) return;
        
        // Background color morphing - ScrollTrigger disabilitato
        /* ScrollTrigger.create({
            trigger: newsletterSection,
            start: "top 70%",
            end: "bottom 30%",
            scrub: 1,
            onEnter: () => {
                gsap.to(newsletterSection, {
                    background: '#0F172A',
                    color: '#FFFFFF',
                    duration: 0.8,
                    ease: this.settings.ease
                });
                
                // Update text colors
                gsap.to(newsletterSection.querySelectorAll('h2, p, input, label'), {
                    color: '#FFFFFF',
                    duration: 0.8,
                    ease: this.settings.ease
                });
            },
            onLeaveBack: () => {
                gsap.to(newsletterSection, {
                    background: '#FFFFFF',
                    color: '#0F172A',
                    duration: 0.8,
                    ease: this.settings.ease
                });
                
                // Revert text colors
                gsap.to(newsletterSection.querySelectorAll('h2, p'), {
                    color: '#0F172A',
                    duration: 0.8,
                    ease: this.settings.ease
                });
            }
        }); */
        
        // Newsletter form animation
        const newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            const formElements = newsletterForm.querySelectorAll('.form-group, .gdpr-consent');
            
            // ScrollTrigger disabilitato
            /* ScrollTrigger.create({
                trigger: newsletterForm,
                start: "top 80%",
                once: true,
                onEnter: () => {
                    gsap.fromTo(formElements,
                        {
                            opacity: 0,
                            y: 50
                        },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.8,
                            ease: this.settings.ease,
                            stagger: 0.2
                        }
                    );
                }
            }); */
        }
    },
    
    // Scroll-triggered animations
    initScrollAnimations() {
        // News cards stagger animation - ScrollTrigger disabilitato
        const newsCards = document.querySelectorAll('.news-card');
        if (newsCards.length > 0) {
            // Imposta direttamente le card come visibili senza animazione scroll
            gsap.set(newsCards, { opacity: 1, y: 0, scale: 1 });
            /* ScrollTrigger.create({
                trigger: '#news-cards',
                start: "top 80%",
                once: true,
                onEnter: () => {
                    gsap.fromTo(newsCards,
                        {
                            opacity: 0,
                            y: 50,
                            scale: 0.9
                        },
                        {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.6,
                            ease: this.settings.ease,
                            stagger: this.settings.stagger
                        }
                    );
                }
            }); */
        }
        
        // Sidebar widgets animation - ScrollTrigger disabilitato
        const widgets = document.querySelectorAll('.widget');
        widgets.forEach((widget, index) => {
            // Imposta direttamente i widget come visibili senza animazione scroll
            gsap.set(widget, { opacity: 1, x: 0, rotationY: 0 });
            /* ScrollTrigger.create({
                trigger: widget,
                start: "top 85%",
                once: true,
                onEnter: () => {
                    gsap.fromTo(widget,
                        {
                            opacity: 0,
                            x: -30,
                            rotationY: -15
                        },
                        {
                            opacity: 1,
                            x: 0,
                            rotationY: 0,
                            duration: 0.8,
                            ease: this.settings.ease,
                            delay: index * 0.1
                        }
                    );
                }
            }); */
        });
        
        // Footer animation - ScrollTrigger disabilitato
        const footerColumns = document.querySelectorAll('.footer-column');
        if (footerColumns.length > 0) {
            // Imposta direttamente le colonne del footer come visibili senza animazione scroll
            gsap.set(footerColumns, { opacity: 1, y: 0 });
            /* ScrollTrigger.create({
                trigger: '.footer',
                start: "top 90%",
                once: true,
                onEnter: () => {
                    gsap.fromTo(footerColumns,
                        {
                            opacity: 0,
                            y: 30
                        },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.8,
                            ease: this.settings.ease,
                            stagger: 0.15
                        }
                    );
                }
            }); */
        }
    },
    
    // Micro-interactions and hover effects
    initMicroInteractions() {
        // Enhanced button hover effects
        const buttons = document.querySelectorAll('.btn-primary, .btn-newsletter');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                gsap.to(button, {
                    scale: 1.05,
                    y: -2,
                    duration: 0.3,
                    ease: "back.out(1.7)"
                });
                
                // Icon animation
                const icon = button.querySelector('.btn-icon');
                if (icon) {
                    gsap.to(icon, {
                        x: 4,
                        duration: 0.3,
                        ease: this.settings.ease
                    });
                }
            });
            
            button.addEventListener('mouseleave', () => {
                gsap.to(button, {
                    scale: 1,
                    y: 0,
                    duration: 0.3,
                    ease: this.settings.ease
                });
                
                const icon = button.querySelector('.btn-icon');
                if (icon) {
                    gsap.to(icon, {
                        x: 0,
                        duration: 0.3,
                        ease: this.settings.ease
                    });
                }
            });
        });
        
        // News cards hover effects
        const newsCards = document.querySelectorAll('.news-card');
        newsCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    y: -8,
                    scale: 1.02,
                    rotationY: 2,
                    duration: 0.4,
                    ease: this.settings.ease
                });
                
                gsap.to(card, {
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    duration: 0.4,
                    ease: this.settings.ease
                });
            });
            
            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    y: 0,
                    scale: 1,
                    rotationY: 0,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    duration: 0.4,
                    ease: this.settings.ease
                });
            });
        });
        
        // Logo hover effect - respects navbar state
        const logo = document.querySelector('.logo-text');
        const navbar = document.getElementById('navbar');
        if (logo && navbar) {
            logo.addEventListener('mouseenter', () => {
                gsap.to(logo, {
                    scale: 1.1,
                    duration: 0.3,
                    ease: this.settings.ease
                });
            });
            
            logo.addEventListener('mouseleave', () => {
                gsap.to(logo, {
                    scale: 1,
                    duration: 0.3,
                    ease: this.settings.ease
                });
            });
        }
        
        // Social links hover effects
        const socialLinks = document.querySelectorAll('.social-link');
        socialLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                gsap.to(link, {
                    scale: 1.15,
                    y: -3,
                    rotationZ: 5,
                    duration: 0.3,
                    ease: "back.out(1.7)"
                });
            });
            
            link.addEventListener('mouseleave', () => {
                gsap.to(link, {
                    scale: 1,
                    y: 0,
                    rotationZ: 0,
                    duration: 0.3,
                    ease: this.settings.ease
                });
            });
        });
    },
    
    // Magnetic cursor effect for specific elements
    initMagneticCursor() {
        const magneticElements = document.querySelectorAll('.magnetic');
        
        magneticElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            element.addEventListener('mousemove', (e) => {
                const deltaX = (e.clientX - centerX) * 0.3;
                const deltaY = (e.clientY - centerY) * 0.3;
                
                gsap.to(element, {
                    x: deltaX,
                    y: deltaY,
                    duration: 0.3,
                    ease: this.settings.ease
                });
            });
            
            element.addEventListener('mouseleave', () => {
                gsap.to(element, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: "elastic.out(1, 0.3)"
                });
            });
        });
    },
    
    // Form submission animation
    animateFormSubmission() {
        const form = document.getElementById('newsletter-form');
        const submitButton = document.getElementById('newsletter-submit');
        
        if (!form || !submitButton) return;
        
        // Loading animation
        const tl = gsap.timeline();
        
        tl.to(submitButton, {
            scale: 0.95,
            duration: 0.1,
            ease: "power2.inOut"
        })
        .to(submitButton, {
            scale: 1,
            duration: 0.2,
            ease: "elastic.out(1, 0.3)"
        })
        .to('.btn-text', {
            opacity: 0,
            duration: 0.2
        })
        .to('.btn-loading', {
            opacity: 1,
            duration: 0.2
        }, '-=0.1');
        
        return tl;
    },
    
    // Success animation for form
    animateFormSuccess() {
        const formStatus = document.getElementById('form-status');
        if (!formStatus) return;
        
        gsap.fromTo(formStatus, 
            {
                opacity: 0,
                scale: 0.8,
                y: 10
            },
            {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.5,
                ease: "back.out(1.7)"
            }
        );
    },
    
    // Error animation for form
    animateFormError() {
        const formStatus = document.getElementById('form-status');
        if (!formStatus) return;
        
        gsap.fromTo(formStatus,
            {
                opacity: 0,
                x: -10
            },
            {
                opacity: 1,
                x: 0,
                duration: 0.3,
                ease: this.settings.ease
            }
        );
        
        // Shake animation
        gsap.to(formStatus, {
            x: 3,
            duration: 0.1,
            repeat: 5,
            yoyo: true,
            ease: "power2.inOut"
        });
    },
    
    // Refresh animations (useful for dynamic content) - ScrollTrigger disabilitato
    refresh() {
        // ScrollTrigger.refresh(); - disabilitato
    },
    
    // Kill all animations (cleanup) - ScrollTrigger disabilitato
    kill() {
        // ScrollTrigger.killAll(); - disabilitato
        gsap.killTweensOf("*");
    }
};

// Initialize animations when GSAP is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if GSAP is loaded
    if (typeof gsap !== 'undefined') {
        FederAnimations.init();
    } else {
        console.warn('GSAP not found, animations will not work');
    }
});

// Handle window resize
window.addEventListener('resize', FederAnimations.debounce(() => {
    FederAnimations.refresh();
}, 300));

// Reduced motion support
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('Reduced motion detected, simplifying animations');
    
    // Override GSAP settings for reduced motion
    gsap.config({
        duration: 0.1,
        ease: "none"
    });
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FederAnimations;
}
