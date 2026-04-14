/* ------------------- CINEMATIC LOADER ------------------- */
window.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loader');
  const counter = document.getElementById('loader-counter');
  const progressLine = document.getElementById('loader-line-progress');
  
  const rollerInner = document.querySelector('.roller-inner');
  const rollerItemsCount = 5;

  if (loader && counter) {
    let count = 0;
    const duration = 3500; // 3.5 seconds to comfortably read the typing text
    const interval = duration / 100;

    let counterInterval = setInterval(() => {
      count++;
      counter.textContent = count.toString().padStart(3, '0');
      if(progressLine) {
        progressLine.style.width = count + '%';
      }
      
      // Roller synchronization
      if(rollerInner) {
         let snapIndex = Math.floor((count / 100) * rollerItemsCount);
         if(snapIndex >= rollerItemsCount) snapIndex = rollerItemsCount - 1;
         rollerInner.style.transform = `translateY(-${snapIndex * (100 / rollerItemsCount)}%)`;
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

/* SVG Liquid/Water Slider Effect */
const servicesSlider = document.getElementById('services');
const sliderContainer = document.getElementById('slider-container');
const displacementMap = document.getElementById('displacement-map');
const slides = document.querySelectorAll('.slide');

let targetScale = 0;
let currentScale = 0;

function updateFilter() {
  currentScale += (targetScale - currentScale) * 0.1;
  if(displacementMap) {
    displacementMap.setAttribute('scale', currentScale);
  }
  targetScale *= 0.85; // Decay
  requestAnimationFrame(updateFilter);
}
updateFilter();

// Use Intersection Observer for active slide and glitch
const slideObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      
      // Trigger glitch effect ONLY on desktop size
      if (window.innerWidth > 1024) {
        entry.target.classList.add('glitch-anim');
        if (displacementMap) {
          targetScale = 350;
          const turbulence = document.querySelector('feTurbulence');
          if (turbulence) {
            turbulence.setAttribute('baseFrequency', '0.05 0.08');
            setTimeout(() => turbulence.setAttribute('baseFrequency', '0.015'), 800);
          }
        }
        setTimeout(() => {
            entry.target.classList.remove('glitch-anim');
        }, 800);
      }
    } else {
      entry.target.classList.remove('active');
      entry.target.classList.remove('glitch-anim');
    }
  });
}, { threshold: 0.5 }); // Trigger when 50% visible

if (slides.length > 0) {
    slides.forEach(slide => slideObserver.observe(slide));
}

const nextBtn = document.getElementById('next-slide');
const prevBtn = document.getElementById('prev-slide');

function scrollToSlide(index) {
  if (index < 0 || index >= slides.length) return;
  if(sliderContainer && slides[index]) {
       sliderContainer.scrollTo({
           left: slides[index].offsetLeft,
           behavior: 'smooth'
       });
  }
}

if(nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (!sliderContainer || !slides.length) return;
        const currentScroll = sliderContainer.scrollLeft;
        const slideWidth = slides[0].offsetWidth;
        const nextIndex = Math.min(slides.length - 1, Math.floor(currentScroll / slideWidth) + 1);
        scrollToSlide(nextIndex);
    });
}

if(prevBtn) {
    prevBtn.addEventListener('click', () => {
        if (!sliderContainer || !slides.length) return;
        const currentScroll = sliderContainer.scrollLeft;
        const slideWidth = slides[0].offsetWidth;
        const prevIndex = Math.max(0, Math.ceil(currentScroll / slideWidth) - 1);
        scrollToSlide(prevIndex);
    });
}

// Vertical Wheel to Horizontal Scroll Logic
function setupHorizontalWheelSlide(element, slideSelector) {
  if (!element) return;
  
  let isAnimating = false;
  let wheelAccumulator = 0;
  let resetTimeout;
  
  element.addEventListener('wheel', (e) => {
    const maxScrollLeft = Math.round(element.scrollWidth - element.clientWidth);
    
    // Allow default vertical scroll if at the extreme boundaries
    if (e.deltaY > 0 && Math.ceil(element.scrollLeft) >= maxScrollLeft - 10) return;
    if (e.deltaY < 0 && Math.floor(element.scrollLeft) <= 10) return;

    if (e.deltaY !== 0 && !e.shiftKey) {
      e.preventDefault();
      
      if (isAnimating) return;
      
      wheelAccumulator += e.deltaY;
      
      clearTimeout(resetTimeout);
      resetTimeout = setTimeout(() => {
          wheelAccumulator = 0;
      }, 300);
      
      if (Math.abs(wheelAccumulator) > 40) {
        const slides = Array.from(element.querySelectorAll(slideSelector));
        if(!slides.length) return;
        
        let closestIndex = 0;
        let minDiff = Infinity;
        slides.forEach((s, idx) => {
          const diff = Math.abs(element.scrollLeft - s.offsetLeft);
          if (diff < minDiff) {
              minDiff = diff;
              closestIndex = idx;
          }
        });
        
        let targetIndex = closestIndex;
        if (wheelAccumulator > 0) {
          targetIndex = Math.min(slides.length - 1, closestIndex + 1);
        } else {
          targetIndex = Math.max(0, closestIndex - 1);
        }
        
        if (targetIndex !== closestIndex || element.scrollLeft !== slides[targetIndex].offsetLeft) {
            isAnimating = true;
            wheelAccumulator = 0;
            
            // disable snap during programmatic scroll
            element.style.scrollSnapType = 'none';
            element.scrollTo({
              left: slides[targetIndex].offsetLeft,
              behavior: 'smooth'
            });
            
            setTimeout(() => {
              isAnimating = false;
              element.style.scrollSnapType = '';
            }, 500);
        } else {
            // Already there
            wheelAccumulator = 0;
        }
      }
    }
  }, { passive: false });
}

setupHorizontalWheelSlide(document.getElementById('slider-container'), '.slide');
setupHorizontalWheelSlide(document.querySelector('.client-scroll'), '.client-card');

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

// ------------------- HORIZONTAL DRAG GALLERY FOR DESKTOP MICE -------------------
const clientScroll = document.querySelector('.client-scroll');

if (clientScroll) {
  // Fix for broken dragging: completely neutralize browser native drag actions on all images and links
  clientScroll.querySelectorAll('a, img').forEach(el => {
    el.addEventListener('dragstart', (e) => e.preventDefault());
  });

  // Custom Cursor Logic
  const dragCursor = document.createElement('div');
  dragCursor.classList.add('drag-cursor');
  dragCursor.innerHTML = '&lt; Drag &gt;';
  document.body.appendChild(dragCursor);

  clientScroll.addEventListener('mouseenter', () => {
    dragCursor.style.opacity = '1';
    dragCursor.style.transform = 'translate(-50%, -50%) scale(1)';
  });

  // Ensure cursor follows smoothly
  clientScroll.addEventListener('mousemove', (e) => {
    dragCursor.style.left = e.clientX + 'px';
    dragCursor.style.top = e.clientY + 'px';
  });

  let isDown = false;
  let isDragging = false;
  let startX;
  let scrollLeft;

  clientScroll.addEventListener('mousedown', (e) => {
    isDown = true;
    isDragging = false; // Reset drag state on fresh click
    clientScroll.classList.add('active');
    dragCursor.classList.add('grabbing'); // visual feedback
    startX = e.pageX - clientScroll.offsetLeft;
    scrollLeft = clientScroll.scrollLeft;
  });

  clientScroll.addEventListener('mouseleave', () => {
    isDown = false;
    clientScroll.classList.remove('active');
    dragCursor.classList.remove('grabbing');
    dragCursor.style.opacity = '0'; // hide custom cursor
    dragCursor.style.transform = 'translate(-50%, -50%) scale(0.5)';
  });

  clientScroll.addEventListener('mouseup', () => {
    isDown = false;
    clientScroll.classList.remove('active');
    dragCursor.classList.remove('grabbing');
  });

  clientScroll.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault(); 
    const x = e.pageX - clientScroll.offsetLeft;
    const walk = (x - startX) * 1.5; 
    
    // Only flag as a drag if the mouse moved more than a couple pixels
    if (Math.abs(walk) > 5) {
      isDragging = true;
    }
    
    clientScroll.scrollLeft = scrollLeft - walk;
  });

  clientScroll.addEventListener('click', (e) => {
    // If the user was dragging, stop the link from functioning!
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
}