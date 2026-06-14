/* ------------------- CINEMATIC LOADER ------------------- */
window.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loader');
  const counter = document.getElementById('loader-counter');
  const progressLine = document.getElementById('loader-line-progress');
  
  const rollerInner = document.querySelector('.roller-inner');
  const rollerItemsCount = 4;

  if (loader && counter) {
    let count = 0;
    const duration = 6500; // 6.5 seconds to comfortably read the typing text
    const interval = duration / 100;

    let counterInterval = setInterval(() => {
      count++;
      counter.textContent = count.toString().padStart(3, '0');
      if(progressLine) {
        progressLine.style.width = count + '%';
      }
      
      // Roller synchronization
      if(rollerInner) {
         const spans = rollerInner.querySelectorAll('span');
         let snapIndex = Math.floor((count / 100) * spans.length);
         if(snapIndex >= spans.length) snapIndex = spans.length - 1;
         
         rollerInner.style.transform = `translateY(-${snapIndex * (100 / spans.length)}%)`;
         
         // Set active class for opacity-based safety
         spans.forEach((span, idx) => {
           if(idx === snapIndex) span.classList.add('active');
           else span.classList.remove('active');
         });
      }
      
      if (count >= 100) {
        clearInterval(counterInterval);
        setTimeout(() => {
          loader.classList.add('hide');
        }, 400); // Small pause at 100% before sliding the curtains up
      }
    }, interval);
  }
});


/* Menu Toggle Logic */
const menuBtn = document.getElementById('menu-btn');
const fullscreenMenu = document.getElementById('fullscreen-menu');
const menuLinks = document.querySelectorAll('.menu-link');

menuBtn.addEventListener('click', () => {
  menuBtn.classList.toggle('open');
  fullscreenMenu.classList.toggle('active');
  
  if(fullscreenMenu.classList.contains('active')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

menuLinks.forEach(link => {
  link.addEventListener('click', () => {
    menuBtn.classList.remove('open');
    fullscreenMenu.classList.remove('active');
    document.body.style.overflow = '';
  });
});

// ------------------- PREMIUM SERVICES SLIDER CONTROLLER -------------------
const servicesSection = document.getElementById('services');
if (servicesSection) {
    const slides = servicesSection.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    let currentSlideIndex = 0;
    let isTransitioning = false;
    const cooldownDuration = 800; // Throttle to prevent immediate button spamming

    // Swipe/drag tracking state
    let touchStartX = 0;
    let touchStartY = 0;
    let wasSwiping = false;

    // Find the initial active slide
    slides.forEach((slide, idx) => {
        if (slide.classList.contains('active')) {
            currentSlideIndex = idx;
        }
    });

    // Dynamic click handler binding to prevent details page navigation while swiping/dragging
    slides.forEach(slide => {
        slide.addEventListener('click', (e) => {
            if (wasSwiping) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            const href = slide.getAttribute('data-href');
            if (href) {
                window.location.href = href;
            }
        });
    });

    function goToSlide(index) {
        if (index < 0 || index >= slides.length || isTransitioning) return;
        
        isTransitioning = true;
        
        // Remove active class from old slide
        slides[currentSlideIndex].classList.remove('active');
        
        // Update current index
        currentSlideIndex = index;
        
        // Add active class to new slide
        slides[currentSlideIndex].classList.add('active');
        
        // Cooldown to prevent fast button spamming
        setTimeout(() => {
            isTransitioning = false;
        }, cooldownDuration);
    }

    // Next/Prev Buttons
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentSlideIndex < slides.length - 1) {
                goToSlide(currentSlideIndex + 1);
            } else {
                // Scroll down to timeline/about section
                const pageContent = document.querySelector('.page-content');
                if (pageContent) {
                    window.scroll({
                        top: pageContent.offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentSlideIndex > 0) {
                goToSlide(currentSlideIndex - 1);
            }
        });
    }

    // Scroll momentum tracker to prevent scroll-up momentum from triggering immediate slide changes
    let lastPageScrollTime = 0;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 5) {
            lastPageScrollTime = Date.now();
        }
    }, { passive: true });

    // Wheel Event Scroll Hijacking (Gesture-based lock to prevent momentum/inertia skipping)
    let isWheelActive = false;
    let wheelDebounceTimeout = null;

    // Last slide hold: track when user first arrives on last slide to give it display time
    let lastSlideArrivalTime = 0;
    const lastSlideHoldDuration = 1200; // ms the last slide must be visible before scrolling away

    window.addEventListener('wheel', (e) => {
        const scrollY = window.scrollY;
        
        if (scrollY <= 5) {
            const isScrollingDown = e.deltaY > 0;
            const isScrollingUp = e.deltaY < 0;

            if (isScrollingDown && currentSlideIndex < slides.length - 1) {
                e.preventDefault();
                if (!isWheelActive && !isTransitioning) {
                    isWheelActive = true;
                    goToSlide(currentSlideIndex + 1);
                    // Record when the user lands on the last slide
                    if (currentSlideIndex === slides.length - 1) {
                        lastSlideArrivalTime = Date.now();
                    }
                }
            } else if (isScrollingDown && currentSlideIndex === slides.length - 1) {
                // On last slide: block scroll until it has been fully visible
                if (Date.now() - lastSlideArrivalTime < lastSlideHoldDuration) {
                    e.preventDefault();
                } else {
                    // Allow natural page scroll — don't preventDefault
                }
            } else if (isScrollingUp && currentSlideIndex > 0) {
                if (Date.now() - lastPageScrollTime < 500) {
                    return;
                }
                e.preventDefault();
                if (!isWheelActive && !isTransitioning) {
                    isWheelActive = true;
                    goToSlide(currentSlideIndex - 1);
                }
            }

            // Debounce to detect when the current wheel gesture/momentum has finished
            clearTimeout(wheelDebounceTimeout);
            wheelDebounceTimeout = setTimeout(() => {
                isWheelActive = false;
            }, 150); // 150ms of inactivity indicates gesture end
        }
    }, { passive: false });

    // Touch Swipe Event Hijacking (Swipe session lock + Early preventDefault on touchmove start)
    let hasSwipedInCurrentTouch = false;

    window.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        hasSwipedInCurrentTouch = false;
        wasSwiping = false;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        const scrollY = window.scrollY;
        const touchCurrentX = e.touches[0].clientX;
        const touchCurrentY = e.touches[0].clientY;
        const deltaX = touchStartX - touchCurrentX;
        const deltaY = touchStartY - touchCurrentY;

        // Set wasSwiping flag if drag distance is significant
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            wasSwiping = true;
        }

        if (scrollY <= 5) {
            // Check if movement is primarily vertical and not a horizontal swipe
            if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 2) {
                const isSwipingUp = deltaY > 0;
                const isSwipingDown = deltaY < 0;

                if (isSwipingUp && currentSlideIndex < slides.length - 1) {
                    if (e.cancelable) e.preventDefault();
                    if (deltaY > 30 && !hasSwipedInCurrentTouch && !isTransitioning) {
                        hasSwipedInCurrentTouch = true;
                        goToSlide(currentSlideIndex + 1);
                        // Record arrival on last slide
                        if (currentSlideIndex === slides.length - 1) {
                            lastSlideArrivalTime = Date.now();
                        }
                    }
                } else if (isSwipingUp && currentSlideIndex === slides.length - 1) {
                    // On last slide: hold it visible before allowing page scroll
                    if (Date.now() - lastSlideArrivalTime < lastSlideHoldDuration) {
                        if (e.cancelable) e.preventDefault();
                    }
                    // else: allow natural scroll down
                } else if (isSwipingDown && currentSlideIndex > 0) {
                    if (Date.now() - lastPageScrollTime < 500) {
                        return;
                    }
                    if (e.cancelable) e.preventDefault();
                    if (deltaY < -30 && !hasSwipedInCurrentTouch && !isTransitioning) {
                        hasSwipedInCurrentTouch = true;
                        goToSlide(currentSlideIndex - 1);
                    }
                }
            }
        }
    }, { passive: false });

    window.addEventListener('touchend', () => {
        hasSwipedInCurrentTouch = false;
    }, { passive: true });

    // Keyboard Arrow/Space Keys Hijacking (Repeat key block)
    let isKeyDownActive = false;
    window.addEventListener('keydown', (e) => {
        const scrollY = window.scrollY;
        if (scrollY <= 5) {
            if (['ArrowDown', 'PageDown', ' '].includes(e.key) && !e.shiftKey) {
                if (currentSlideIndex < slides.length - 1) {
                    e.preventDefault();
                    if (!isKeyDownActive && !isTransitioning) {
                        isKeyDownActive = true;
                        goToSlide(currentSlideIndex + 1);
                    }
                }
            } else if (['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey)) {
                if (currentSlideIndex > 0) {
                    e.preventDefault();
                    if (!isKeyDownActive && !isTransitioning) {
                        isKeyDownActive = true;
                        goToSlide(currentSlideIndex - 1);
                    }
                }
            }
        }
    });

    window.addEventListener('keyup', () => {
        isKeyDownActive = false;
    });
}


// ------------------- NATIVE STICKY MAPPER -------------------
function initStickyScroll(sectionId, containerSelector) {
    const section = document.getElementById(sectionId);
    const container = section ? section.querySelector(containerSelector) : null;
    if (!section || !container) return;

    window.addEventListener('scroll', () => {
        const rect = section.getBoundingClientRect();
        const top = rect.top;
        const height = rect.height;
        const windowHeight = window.innerHeight;
        
        const maxScroll = height - windowHeight;
        let progress = 0;
        
        if (top > 0) {
            progress = 0;
        } else if (-top > maxScroll) {
            progress = 1;
        } else {
            progress = -top / maxScroll;
        }
        
        const maxTranslate = container.scrollWidth - window.innerWidth;
        if (maxTranslate > 0) {
            const visualTranslate = progress * maxTranslate;
            container.style.transform = `translateX(-${visualTranslate}px)`;
        }
    }, { passive: true });
}

initStickyScroll('clients', '#clients-track');

// Intersection Observer for Timeline animations
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.2
};
const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    // Reveal elements when scrolling down
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.timeline-node').forEach(node => {
  observer.observe(node);
});

// Dynamic Loading Bar Follow-Scroll Logic
const journeySection = document.getElementById('journey');
const timelineProgress = document.getElementById('timeline-progress');

window.addEventListener('scroll', () => {
  if(!journeySection || !timelineProgress) return;
  
  const rect = journeySection.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  // Begin pushing down the bar as the very top of the section enters exactly middle of screen
  const startTarget = windowHeight / 2; 
  
  let scrollPercentage = 0;
  if(rect.top < startTarget) {
    const scrolledPast = startTarget - rect.top;
    // Map to the inner height minus some padding for perfection
    scrollPercentage = (scrolledPast / rect.height) * 100;
  }
  
  scrollPercentage = Math.max(0, Math.min(100, scrollPercentage));
  timelineProgress.style.height = scrollPercentage + '%';
}, {passive: true});

// ------------------- CLIENTS HORIZONTAL SCROLL -------------------
document.addEventListener('DOMContentLoaded', () => {
  const clientsTrack = document.getElementById('clients-track');
  if (clientsTrack && typeof PORTFOLIO_CLIENTS !== 'undefined') {
    Object.values(PORTFOLIO_CLIENTS).forEach(client => {
      const card = document.createElement('div');
      card.className = 'client-card';
      card.onclick = () => window.location.href = `client-portfolio.html?id=${encodeURIComponent(client.id)}`;
      
      const firstService = Object.keys(client.services)[0];
      const coverImg = client.services[firstService][0];
      
      card.innerHTML = `
        <img src="${coverImg}" alt="${client.name}">
        <div class="client-card-overlay">
          <h3 class="client-card-name">${client.name}</h3>
          <span class="client-card-service">${client.primary_service}</span>
        </div>
      `;
      clientsTrack.appendChild(card);
    });
    
    // Custom Click Cursor logic
    const clickCursor = document.getElementById('click-cursor');
    
    if (clickCursor) {
      window.addEventListener('mousemove', (e) => {
        clickCursor.style.left = e.clientX + 'px';
        clickCursor.style.top = e.clientY + 'px';
      });

      // Delegate hover events for dynamic cards
      clientsTrack.addEventListener('mouseover', (e) => {
        if (e.target.closest('.client-card')) {
          clickCursor.classList.add('active');
        }
      });

      clientsTrack.addEventListener('mouseout', (e) => {
        if (e.target.closest('.client-card')) {
          clickCursor.classList.remove('active');
        }
      });
    }
  }
});