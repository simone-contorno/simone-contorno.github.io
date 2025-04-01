/**
* Template Name: iPortfolio
* Template URL: https://bootstrapmade.com/iportfolio-bootstrap-portfolio-websites-template/
* Updated: Jun 29 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Header toggle
   */
  const headerToggleBtn = document.querySelector('.header-toggle');

  function headerToggle() {
    const header = document.querySelector('#header');
    header.classList.toggle('header-show');
    headerToggleBtn.classList.toggle('bi-list');
    headerToggleBtn.classList.toggle('bi-x');
    
    // Explicitly set the left position based on header-show class
    if (header.classList.contains('header-show')) {
      header.style.left = '0';
    } else {
      header.style.left = window.innerWidth >= 1200 ? '0' : '-100%';
    }
    
    // Adjust main content when menu is toggled
    const main = document.querySelector('.main');
    if (header.classList.contains('header-show')) {
      main.style.marginLeft = '300px';
    } else {
      main.style.marginLeft = window.innerWidth >= 1200 ? '300px' : '0';
    }
  }
  headerToggleBtn.addEventListener('click', headerToggle);
  
  // Initialize header state based on screen size
  function initializeHeaderState() {
    const header = document.querySelector('#header');
    const main = document.querySelector('.main');
    const headerToggleBtn = document.querySelector('.header-toggle');
    
    if (window.innerWidth >= 1200) {
      // On desktop, menu should be visible but without 'header-show' class
      header.style.left = '0';
      main.style.marginLeft = '300px';
      if (header.classList.contains('header-show')) {
        header.classList.remove('header-show');
      }
      // Ensure toggle button is hidden on desktop
      headerToggleBtn.style.display = 'none';
    } else {
      // On mobile, menu should be hidden unless 'header-show' class is present
      if (!header.classList.contains('header-show')) {
        header.style.left = '-100%';
        main.style.marginLeft = '0';
      }
      // Ensure toggle button is visible on mobile
      headerToggleBtn.style.display = 'flex';
    }
  }
  
  // Initialize on page load
  initializeHeaderState();
  
  // Adjust layout on window resize
  window.addEventListener('resize', function() {
    initializeHeaderState();
  });

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      const header = document.querySelector('#header');
      if (header.classList.contains('header-show')) {
        headerToggle();
      }
    });
  });
  
  /**
   * Close mobile nav when clicking outside
   */
  document.addEventListener('click', (e) => {
    const header = document.querySelector('#header');
    const headerToggleBtn = document.querySelector('.header-toggle');
    
    if (header.classList.contains('header-show') && 
        !header.contains(e.target) && 
        e.target !== headerToggleBtn) {
      headerToggle();
    }
  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Init typed.js
   */
  const selectTyped = document.querySelector('.typed');
  if (selectTyped) {
    let typed_strings = selectTyped.getAttribute('data-typed-items');
    typed_strings = typed_strings.split(',');
    new Typed('.typed', {
      strings: typed_strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

  /**
   * Initiate Pure Counter
   */
  new PureCounter();

  /**
   * Animate the skills items on reveal
   */
  let skillsAnimation = document.querySelectorAll('.skills-animation');
  skillsAnimation.forEach((item) => {
    new Waypoint({
      element: item,
      offset: '80%',
      handler: function(direction) {
        let skillLevels = item.querySelectorAll('.skill-level');
        skillLevels.forEach(el => {
          // Get the skill level value
          const value = parseInt(el.getAttribute('data-value'));
          
          // Find all dots in this skill item
          const parentDiv = el.closest('.skill-dots');
          const dots = parentDiv.querySelectorAll('.dot');
          
          // Reset all dots first (remove any active class)
          dots.forEach(dot => {
            dot.classList.remove('active');
          });
          
          // Activate dots based on skill level
          dots.forEach(dot => {
            const dotLevel = parseInt(dot.getAttribute('data-level'));
            // Check if this is a language dot with sublevel
            const isLanguage = parentDiv.closest('#languages') !== null;
            
            if (isLanguage) {
              // For languages, handle half-sphere coloring
              // Each level has two sublevels (A1/A2, B1/B2, C1/C2)
              // Level 4 is native and fully colored
              if (dotLevel < value) {
                // Full dot for complete levels
                dot.classList.add('active');
              } else if (dotLevel === value && value < 4) {
                // For the current level, check if it's the first or second sublevel
                const sublevel = parentDiv.getAttribute('data-sublevel') || '';
                if (sublevel === 'A2' || sublevel === 'B2' || sublevel === 'C2') {
                  // Second sublevel (A2, B2, C2) - full dot
                  dot.classList.add('active');
                } else if (sublevel === 'A1' || sublevel === 'B1' || sublevel === 'C1') {
                  // First sublevel (A1, B1, C1) - half dot
                  dot.classList.add('half-active');
                }
              } else if (dotLevel === value && value === 4) {
                // Native speaker (level 4) - full dot
                dot.classList.add('active');
              }
            } else {
              // Regular skills behavior
              if (dotLevel <= value) {
                dot.classList.add('active');
              }
            }
          });
        });
      }
    });
  });
  
  // Immediately activate skill dots on page load
  document.addEventListener('DOMContentLoaded', function() {
    let skillLevels = document.querySelectorAll('.skill-level');
    skillLevels.forEach(el => {
      const value = parseInt(el.getAttribute('data-value'));
      const parentDiv = el.closest('.skill-dots');
      const dots = parentDiv.querySelectorAll('.dot');
      
      dots.forEach(dot => {
        const dotLevel = parseInt(dot.getAttribute('data-level'));
        // Check if this is a language dot with sublevel
        const isLanguage = parentDiv.closest('#languages') !== null;
        
        if (isLanguage) {
          // For languages, handle half-sphere coloring
          // Each level has two sublevels (A1/A2, B1/B2, C1/C2)
          // Level 4 is native and fully colored
          if (dotLevel < value) {
            // Full dot for complete levels
            dot.classList.add('active');
          } else if (dotLevel === value && value < 4) {
            // For the current level, check if it's the first or second sublevel
            const sublevel = parentDiv.getAttribute('data-sublevel') || '';
            if (sublevel === 'A2' || sublevel === 'B2' || sublevel === 'C2') {
              // Second sublevel (A2, B2, C2) - full dot
              dot.classList.add('active');
            } else if (sublevel === 'A1' || sublevel === 'B1' || sublevel === 'C1') {
              // First sublevel (A1, B1, C1) - half dot
              dot.classList.add('half-active');
            }
          } else if (dotLevel === value && value === 4) {
            // Native speaker (level 4) - full dot
            dot.classList.add('active');
          }
        } else {
          // Regular skills behavior
          if (dotLevel <= value) {
            dot.classList.add('active');
          }
        }
      });
    });
  });

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Init isotope layout and filters
   */
  document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
    let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
    let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
    let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

    let initIsotope;
    imagesLoaded(isotopeItem.querySelector('.isotope-container'), function() {
      initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
        itemSelector: '.isotope-item',
        layoutMode: layout,
        filter: filter,
        sortBy: sort
      });
    });

    isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filters) {
      filters.addEventListener('click', function() {
        isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
        this.classList.add('filter-active');
        initIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        if (typeof aosInit === 'function') {
          aosInit();
        }
      }, false);
    });

  });

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy);

})();