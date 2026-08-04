document.addEventListener('DOMContentLoaded', () => {

  // --- AUDIO SYNTHESIZER (Web Audio API) ---
  let audioCtx = null;
  let isSoundEnabled = false;

  const soundToggleBtn = document.getElementById('sound-toggle');
  const soundOnIcon = document.getElementById('sound-on-icon');
  const soundOffIcon = document.getElementById('sound-off-icon');

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  soundToggleBtn.addEventListener('click', () => {
    initAudio();
    isSoundEnabled = !isSoundEnabled;
    if (isSoundEnabled) {
      soundOnIcon.style.display = 'none';
      soundOffIcon.style.display = 'block';
      playChime(3); // Warm startup sweep
    } else {
      soundOnIcon.style.display = 'block';
      soundOffIcon.style.display = 'none';
    }
  });

  // Play a quick synth chime on hover
  function playHoverSound() {
    if (!isSoundEnabled || !audioCtx) return;
    initAudio();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  }

  // Play a rewarding chord sweep on success or main actions
  function playChime(type = 1) {
    if (!isSoundEnabled || !audioCtx) return;
    initAudio();
    
    const freqs = type === 1 ? [523.25, 659.25, 783.99, 1046.50] : // C Major chord
                  type === 2 ? [329.63, 440.00, 554.37, 659.25] : // A Major chord
                  [587.33, 739.99, 880.00, 1174.66];              // D Major chord

    freqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const timeOffset = idx * 0.06;
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + timeOffset);
      
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + timeOffset + 0.5);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(audioCtx.currentTime + timeOffset);
      osc.stop(audioCtx.currentTime + timeOffset + 0.5);
    });
  }

  // Highlight links and buttons on hover
  const hoverables = document.querySelectorAll('.hoverable, button, a, select, input, textarea');
  hoverables.forEach(item => {
    item.addEventListener('mouseenter', () => {
      document.body.classList.add('hovering-link');
      playHoverSound();
    });
    item.addEventListener('mouseleave', () => {
      document.body.classList.remove('hovering-link');
    });
  });

  // Mouse position tracking for particle canvas interaction
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // --- FLOATING CANVAS PARTICLES ---
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  
  let particles = [];
  const maxParticles = 65;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  class Particle {
    constructor() {
      this.reset();
    }
    
    reset() {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 100;
      this.size = Math.random() * 2 + 1;
      this.speedY = -(Math.random() * 0.8 + 0.3);
      this.speedX = Math.random() * 0.4 - 0.2;
      this.opacity = Math.random() * 0.6 + 0.2;
      this.glowColor = `rgba(255, ${150 + Math.floor(Math.random() * 105)}, 27, ${this.opacity})`;
    }
    
    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      
      // Responsive interactive displacement from user mouse
      let dx = mouseX - this.x;
      let dy = mouseY - this.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 180) {
        let force = (180 - dist) / 180;
        this.x -= (dx / dist) * force * 1.5;
        this.y -= (dy / dist) * force * 1.5;
      }
      
      if (this.y < -10 || this.x < -10 || this.x > width + 10) {
        this.reset();
      }
    }
    
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.glowColor;
      ctx.shadowBlur = this.size * 5;
      ctx.shadowColor = 'rgba(255, 126, 27, 0.4)';
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow for efficiency
    }
  }

  // Populate particles
  for (let i = 0; i < maxParticles; i++) {
    particles.push(new Particle());
  }

  function drawCanvas() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(drawCanvas);
  }
  drawCanvas();

  // --- STATS COUNTER ACTION (IntersectionObserver) ---
  const statsSection = document.getElementById('stats');
  const statNumbers = document.querySelectorAll('.stat-number');
  let hasCounted = false;

  const startCounting = () => {
    statNumbers.forEach(num => {
      const target = parseFloat(num.getAttribute('data-target'));
      const duration = 2000; // 2 seconds
      const startTime = performance.now();
      const isDecimal = target % 1 !== 0;

      const updateCount = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Easing function outQuad
        const easeProgress = progress * (2 - progress);
        const currentVal = easeProgress * target;

        if (isDecimal) {
          num.innerText = currentVal.toFixed(1) + 'M+';
        } else if (target === 74) {
          num.innerText = Math.floor(currentVal) + '%';
        } else {
          num.innerText = Math.floor(currentVal) + '+';
        }

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          if (isDecimal) {
            num.innerText = target.toFixed(1) + 'M+';
          } else if (target === 74) {
            num.innerText = target + '%';
          } else {
            num.innerText = target + '+';
          }
        }
      };
      
      requestAnimationFrame(updateCount);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasCounted) {
        startCounting();
        hasCounted = true;
        playChime(1); // Play stat chime
      }
    });
  }, { threshold: 0.3 });

  observer.observe(statsSection);

  // --- SCROLL NAVBAR CLASS ---
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // --- PORTFOLIO GALLERY TAB FILTER ---
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filterValue = btn.getAttribute('data-filter');
      
      portfolioItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
          if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
            item.classList.remove('hidden');
            setTimeout(() => {
              item.style.opacity = '1';
              item.style.transform = 'scale(1)';
            }, 50);
          } else {
            item.classList.add('hidden');
          }
        }, 300);
      });
    });
  });

  // --- VIDEO LIGHTBOX MODAL ---
  const lightbox = document.getElementById('lightbox');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxMedia = document.getElementById('lightbox-media');

  portfolioItems.forEach(item => {
    item.addEventListener('click', () => {
      const videoUrl = item.getAttribute('data-video');
      
      // Smooth fade open
      lightboxMedia.innerHTML = `<iframe src="${videoUrl}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
      lightbox.classList.add('active');
      playChime(2);
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    setTimeout(() => {
      lightboxMedia.innerHTML = '';
    }, 400);
  };

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  // --- TESTIMONIALS SLIDER ---
  const testWrapper = document.getElementById('testimonial-wrapper');
  const prevBtn = document.getElementById('prev-slide');
  const nextBtn = document.getElementById('next-slide');
  const testimonialCards = document.querySelectorAll('.testimonial-card');
  
  let currentSlide = 0;
  const slideCount = testimonialCards.length;

  const updateSlidePosition = () => {
    testWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
  };

  nextBtn.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % slideCount;
    updateSlidePosition();
  });

  prevBtn.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + slideCount) % slideCount;
    updateSlidePosition();
  });

  // Auto sliding every 8 seconds
  let autoSlideTimer = setInterval(() => {
    currentSlide = (currentSlide + 1) % slideCount;
    updateSlidePosition();
  }, 8000);

  // Pause sliding on interaction
  [prevBtn, nextBtn].forEach(btn => {
    btn.addEventListener('click', () => {
      clearInterval(autoSlideTimer);
    });
  });

  // --- BUDGET SLIDER CALCULATOR & GEAR SYNCS ---
  const budgetSlider = document.getElementById('budget');
  const budgetValue = document.getElementById('budget-value');
  const packageSelect = document.getElementById('package');

  budgetSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    budgetValue.innerText = `$${val.toLocaleString()}`;
    
    // Auto-update package dropdown based on budget limits (optional suggestions)
    if (val < 800) {
      packageSelect.value = 'Gear 2 - Short-Form Domination';
    } else if (val >= 800 && val < 2000) {
      packageSelect.value = 'Gear 3 - YouTube Growth Pack';
    } else {
      packageSelect.value = 'Gear 4 - Cinematic & VFX Elite';
    }
  });

  // Deploy button on package cards syncs with form dropdown & budget
  const deployBtns = document.querySelectorAll('.service-btn');
  deployBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedPack = btn.getAttribute('data-package');
      packageSelect.value = selectedPack;
      
      // Auto adjust slider to match package pricing
      let price = 1500;
      if (selectedPack.includes('Gear 2')) {
        price = 450;
      } else if (selectedPack.includes('Gear 3')) {
        price = 1200;
      } else if (selectedPack.includes('Gear 4')) {
        price = 2500;
      }
      
      budgetSlider.value = price;
      budgetValue.innerText = `$${price.toLocaleString()}`;
      
      playChime(1);
    });
  });

  // Sync package selection to budget slider
  packageSelect.addEventListener('change', (e) => {
    const selectedVal = e.target.value;
    let price = 1500;
    if (selectedVal.includes('Gear 2')) {
      price = 450;
    } else if (selectedVal.includes('Gear 3')) {
      price = 1200;
    } else if (selectedVal.includes('Gear 4')) {
      price = 2500;
    }
    
    budgetSlider.value = price;
    budgetValue.innerText = `$${price.toLocaleString()}`;
  });

  // --- BOUNTY FORM SUBMISSION & SUCCESS TOAST ---
  const form = document.getElementById('bounty-form');
  const submitToast = document.getElementById('submit-toast');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Animate submit button glow
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.style.transform = 'scale(0.95)';
    setTimeout(() => submitBtn.style.transform = 'scale(1)', 150);

    // Play successful submission sweep chime
    playChime(3);

    // Show Toast Alert
    submitToast.classList.add('show');
    
    // Reset Form
    form.reset();
    budgetSlider.value = 1500;
    budgetValue.innerText = '$1,500';

    // Hide Toast after 5 seconds
    setTimeout(() => {
      submitToast.classList.remove('show');
    }, 5000);
  });

  // --- MOBILE BURGER MENU (Toggle navigation) ---
  const menuBtn = document.getElementById('menu-btn');
  const navLinks = document.querySelector('.nav-links');

  menuBtn.addEventListener('click', () => {
    if (navLinks.style.display === 'flex') {
      navLinks.style.display = 'none';
    } else {
      navLinks.style.display = 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '100%';
      navLinks.style.left = '0';
      navLinks.style.width = '100%';
      navLinks.style.background = 'rgba(13, 6, 1, 0.95)';
      navLinks.style.padding = '2rem';
      navLinks.style.borderBottom = '1px solid var(--primary)';
      navLinks.style.gap = '1.5rem';
    }
  });

});
