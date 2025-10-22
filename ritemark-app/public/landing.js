/**
 * RiteMark Landing Page JavaScript
 * Handles smooth scrolling, mobile menu, button glow effects, and Lucide icons
 */

// Smooth scroll to sections with offset for fixed header
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Mouse-tracking glow effect for primary buttons
  const primaryButtons = document.querySelectorAll('.btn-primary');

  primaryButtons.forEach(button => {
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      button.style.setProperty('--mouse-x', `${x}px`);
      button.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // Get all anchor links that point to sections on the page
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');

      // Skip if it's just "#" or "#demo"
      if (!href || href === '#') return;

      const targetId = href.substring(1);
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        e.preventDefault();

        // Calculate offset for fixed header (64px header height + 24px padding)
        const headerOffset = 88;
        const elementPosition = targetSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        // Smooth scroll to target
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Add scroll shadow to header
  const header = document.querySelector('.header');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (mobileMenuToggle && mobileNav) {
    mobileMenuToggle.addEventListener('click', () => {
      const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
      const newState = !isExpanded;

      mobileMenuToggle.setAttribute('aria-expanded', newState);
      mobileNav.classList.toggle('active', newState);

      // Prevent body scroll when menu is open
      document.body.style.overflow = newState ? 'hidden' : '';
    });

    // Close mobile menu on link click
    const mobileNavLinks = mobileNav.querySelectorAll('a');
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Close mobile menu on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) {
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Feature modal functionality
  const featureModal = document.getElementById('feature-modal');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.querySelector('.modal-close');
  const featureButtons = document.querySelectorAll('.feature-action');

  // Feature details content
  const featureDetails = {
    wysiwyg: {
      title: 'Edit Like Google Docs',
      description: 'RiteMark provides a true WYSIWYG editing experience—what you see is what you get. No need to learn markdown syntax or toggle between edit and preview modes.',
      benefits: [
        'Visual formatting with toolbar buttons (bold, italic, headings)',
        'Drag-and-drop image uploads',
        'Real-time preview without mode switching',
        'Keyboard shortcuts for power users',
        'Zero learning curve for non-technical users'
      ]
    },
    drive: {
      title: 'Auto-Save to Google Drive',
      description: 'Your documents are automatically saved to your own Google Drive account. We never see your content—everything stays private and encrypted in your Drive.',
      benefits: [
        'Auto-save every few seconds',
        'Access files from any device',
        'Your Drive storage (15GB free, or upgrade to Google One)',
        'File versioning and revision history',
        'Works offline with sync when back online'
      ]
    },
    export: {
      title: 'Export Clean Markdown',
      description: 'RiteMark generates clean, standards-compliant markdown that works perfectly with AI tools, GitHub, and developer workflows. One-click export, no manual cleanup.',
      benefits: [
        'Copy to clipboard for ChatGPT, Claude, or other AI tools',
        'Download as .md file for GitHub README files',
        'CommonMark compliant formatting',
        'Preserves formatting, links, and images',
        'Export to PDF or HTML (coming soon)'
      ]
    },
    collab: {
      title: 'Work Together',
      description: 'Collaborate in real-time with your team—just like Google Docs. See edits instantly, add comments, and co-author documents together.',
      benefits: [
        'See teammates\' cursors and selections in real-time',
        'Add comments and suggestions',
        'Conflict-free editing—changes never clash',
        'Share via Google Drive link',
        'Permission controls (view, comment, edit)'
      ]
    },
    mobile: {
      title: 'Write Anywhere',
      description: 'RiteMark works seamlessly across all your devices. Start writing on your phone, continue on your tablet, finish on your desktop—all synced via Google Drive.',
      benefits: [
        'Responsive design optimized for mobile',
        'Touch-friendly editing on phones and tablets',
        'Automatic sync across all devices',
        'Works in any modern browser',
        'Progressive Web App (add to home screen)'
      ]
    }
  };

  // Open modal
  function openModal(featureKey) {
    const feature = featureDetails[featureKey];
    if (!feature) return;

    modalBody.innerHTML = `
      <h3 id="modal-title">${feature.title}</h3>
      <p>${feature.description}</p>
      <ul>
        ${feature.benefits.map(benefit => `
          <li>
            <i data-lucide="check"></i>
            <span>${benefit}</span>
          </li>
        `).join('')}
      </ul>
    `;

    // Reinitialize Lucide icons in modal
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    featureModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Close modal
  function closeModal() {
    featureModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Event listeners
  featureButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const featureKey = button.getAttribute('data-feature');
      openModal(featureKey);
    });
  });

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && featureModal.classList.contains('active')) {
      closeModal();
    }
  });

  // Swipe indicator - hide on scroll
  const swipeIndicator = document.getElementById('swipe-indicator');
  const featuresScrollContainer = document.getElementById('features-scroll-container');

  if (swipeIndicator && featuresScrollContainer) {
    let hasScrolled = false;

    featuresScrollContainer.addEventListener('scroll', () => {
      if (!hasScrolled && featuresScrollContainer.scrollLeft > 10) {
        hasScrolled = true;
        swipeIndicator.classList.add('hidden');

        // Remove from DOM after animation
        setTimeout(() => {
          swipeIndicator.style.display = 'none';
        }, 300);
      }
    });

    // Also hide on touch start
    featuresScrollContainer.addEventListener('touchstart', () => {
      if (!hasScrolled) {
        hasScrolled = true;
        swipeIndicator.classList.add('hidden');
        setTimeout(() => {
          swipeIndicator.style.display = 'none';
        }, 300);
      }
    }, { once: true });
  }
});
