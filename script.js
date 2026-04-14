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

function scrollToSlide(index) {
  const servicesSlider = document.getElementById('services');
  const slides = document.querySelectorAll('.slide');
  if (!servicesSlider || index < 0 || index >= slides.length) return;
  
  const rect = servicesSlider.getBoundingClientRect();
  const startY = window.scrollY + rect.top;
  const height = servicesSlider.offsetHeight;
  const windowHeight = window.innerHeight;
  const maxScroll = height - windowHeight;
  
  const targetProgress = index / (slides.length - 1);
  const targetY = startY + (targetProgress * maxScroll);
  
  window.scrollTo({
    top: targetY,
    behavior: 'smooth'
  });
}

const nextBtn = document.getElementById('next-slide');
const prevBtn = document.getElementById('prev-slide');

if(nextBtn) {
    nextBtn.addEventListener('click', () => {
        const servicesSlider = document.getElementById('services');
        const slides = document.querySelectorAll('.slide');
        if (!servicesSlider || !slides.length) return;
        const rect = servicesSlider.getBoundingClientRect();
        const maxScroll = rect.height - window.innerHeight;
        let progress = Math.max(0, Math.min(1, -rect.top / maxScroll));
        let currentIndex = Math.round(progress * (slides.length - 1));
        scrollToSlide(currentIndex + 1);
    });
}

if(prevBtn) {
    prevBtn.addEventListener('click', () => {
        const servicesSlider = document.getElementById('services');
        const slides = document.querySelectorAll('.slide');
        if (!servicesSlider || !slides.length) return;
        const rect = servicesSlider.getBoundingClientRect();
        const maxScroll = rect.height - window.innerHeight;
        let progress = Math.max(0, Math.min(1, -rect.top / maxScroll));
        let currentIndex = Math.round(progress * (slides.length - 1));
        scrollToSlide(currentIndex - 1);
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
        if (sectionId === 'services') {
            const slides = section.querySelectorAll('.slide');
            if (slides.length > 0) {
                let newIndex = Math.min(slides.length - 1, Math.floor(progress * slides.length));
                
                // Set initial dataset safely
                if (container.dataset.currentIndex === undefined) container.dataset.currentIndex = 0;
                
                if (container.dataset.currentIndex != newIndex) {
                    const oldIndex = parseInt(container.dataset.currentIndex);
                    container.dataset.currentIndex = newIndex;
                    
                    if(slides[oldIndex]) slides[oldIndex].classList.remove('active');
                    if(slides[newIndex]) slides[newIndex].classList.add('active');
                }
            }
        } else if (maxTranslate > 0) {
            // Apply a slight offset compensation inside the client-scroll
            const isClient = container.classList.contains('client-scroll');
            const visualTranslate = progress * maxTranslate;
            container.style.transform = `translateX(-${visualTranslate}px)`;
        }
    }, { passive: true });
}

initStickyScroll('services', '.slider-container');
initStickyScroll('works', '.client-scroll');

// Desktop 1-Tick Scroll Hijacker strictly for Oblo logic
let wheelThrottle = false;
window.addEventListener('wheel', (e) => {
    const servicesSlider = document.getElementById('services');
    if (!servicesSlider) return;
    
    const rect = servicesSlider.getBoundingClientRect();
    const isInsideServices = rect.top <= 10 && rect.bottom >= window.innerHeight - 10;
    
    // Throttle block
    if (wheelThrottle && isInsideServices) {
       e.preventDefault();
       return;
    }
    
    if (isInsideServices && !e.shiftKey) {
        const slides = servicesSlider.querySelectorAll('.slide');
        const maxScroll = servicesSlider.clientHeight - window.innerHeight;
        const segmentSize = maxScroll / (slides.length - 1);
        
        const offsetTop = window.scrollY + rect.top;
        const currentLocalY = window.scrollY - offsetTop; 
        
        let currentIndex = Math.round(currentLocalY / segmentSize);
        
        // Escape boundaries cleanly
        if (currentIndex === slides.length - 1 && e.deltaY > 0) return; // Go out naturally down
        if (currentIndex === 0 && e.deltaY < 0) return; // Go out naturally up
        
        e.preventDefault(); // Lock scroll!
        wheelThrottle = true;
        
        if (e.deltaY > 0) currentIndex++;
        else currentIndex--;
        
        currentIndex = Math.max(0, Math.min(slides.length - 1, currentIndex));
        const targetY = offsetTop + (currentIndex * segmentSize);
        
        window.scrollTo({ top: targetY, behavior: 'smooth' });
        
        setTimeout(() => { wheelThrottle = false; }, 1200);
    }
}, { passive: false });

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

// Custom Cursor logic only, dragging removed
const clientScroll = document.querySelector('.client-scroll');
if (clientScroll) {
  const dragCursor = document.createElement('div');
  dragCursor.classList.add('drag-cursor');
  dragCursor.innerHTML = 'Scroll'; // Text changed as it's scroll now, not drag
  document.body.appendChild(dragCursor);

  clientScroll.addEventListener('mouseenter', () => {
    dragCursor.style.opacity = '1';
    dragCursor.style.transform = 'translate(-50%, -50%) scale(1)';
  });

  clientScroll.addEventListener('mousemove', (e) => {
    dragCursor.style.left = e.clientX + 'px';
    dragCursor.style.top = e.clientY + 'px';
  });

  clientScroll.addEventListener('mouseleave', () => {
    dragCursor.style.opacity = '0';
    dragCursor.style.transform = 'translate(-50%, -50%) scale(0.5)';
  });
}