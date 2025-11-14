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
  const featureCards = document.querySelectorAll('.feature-card[role="button"]');

  // Feature details content
  const featureDetails = {
    wysiwyg: {
      title: 'Visual Markdown Editing',
      description: 'Format text visually, export clean markdown. Built for AI workflows, documentation, and content creation. Start writing in 30 seconds—no syntax training required.',
      benefits: [
        'Format with toolbar buttons—bold, italic, headings, lists, tables',
        'Drag images directly into your document—instant upload',
        'See final output as you type—what you see is what you export',
        'Master keyboard shortcuts as you grow—Cmd+B, Cmd+K, slash commands',
        'Zero barriers—if you can format text, you can create markdown'
      ]
    },
    drive: {
      title: 'Your Files, Your Control',
      description: 'Auto-saves to YOUR Google Drive every 3 seconds. We can\'t read your documents—they live in your Drive, encrypted and private. Revoke access anytime from Google.',
      benefits: [
        'Saves every 3 seconds—never lose work from crashes or connection drops',
        'Access from any device—phone, tablet, desktop, all synced via Drive',
        'Uses your Google Drive storage—15GB free, or upgrade to Google One for more',
        'Complete version history—restore any past version with one click',
        'Works offline—edits sync automatically when connection returns'
      ]
    },
    export: {
      title: 'Export to AI Tools & GitHub',
      description: 'One-click markdown export optimized for ChatGPT, Claude, GitHub, and developer workflows. Standard-compliant output—paste directly, no format conversion required.',
      benefits: [
        'Copy markdown to clipboard—paste into ChatGPT, Claude, or Gemini instantly',
        'Download .md files—perfect for GitHub READMEs, documentation, and wikis',
        'Export to Word (.docx)—share with non-technical stakeholders',
        'CommonMark standard—works everywhere markdown works',
        'Preserves all formatting—headings, bold, links, images, tables, code blocks'
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
      title: 'Edit From Any Device',
      description: 'Start on your phone during commute, finish on desktop at work. All settings and documents sync automatically via Google Drive. No app installation—works in any browser.',
      benefits: [
        'Mobile-optimized interface—thumb-friendly toolbar, responsive layout',
        'Touch gestures—swipe to format, long-press for context menu',
        'Cross-device sync—preferences, recent files, and editor settings follow you',
        'Browser-based—no App Store downloads, updates instant and automatic',
        'Add to home screen—launches like native app, full-screen editing'
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

  // Event listeners for clickable feature cards
  featureCards.forEach(card => {
    // Click handler
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const featureKey = card.getAttribute('data-feature');
      openModal(featureKey);
    });

    // Keyboard support (Enter and Space)
    card.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const featureKey = card.getAttribute('data-feature');
        openModal(featureKey);
      }
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
