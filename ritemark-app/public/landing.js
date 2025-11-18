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
    ai: {
      title: 'AI-Powered Writing Assistant',
      description: 'Fix mistakes everywhere, rephrase paragraphs, improve clarity—all with natural language commands. Watch AI responses stream in real-time. Stop generation anytime. Your OpenAI API key stays private in your browser.',
      benefits: [
        'Find and replace anywhere—fix "color" to "colour" across entire document with one command',
        'Rephrase on demand—"make this professional" or "simplify for beginners"',
        'Real-time streaming—see AI think, watch changes appear word by word',
        'Cancel anytime—stop unwanted responses mid-generation with one click',
        'Bring your own key (BYOK)—your OpenAI API key never leaves your browser, maximum privacy'
      ]
    },
    wysiwyg: {
      title: 'Never See Markdown Until You Export',
      description: 'True WYSIWYG editing—format with buttons and shortcuts, see final output as you type. No split-screen preview, no syntax memorization. Export clean markdown only when you\'re ready—for ChatGPT custom instructions, Claude Code agents, or GitHub READMEs.',
      benefits: [
        'Format with toolbar buttons—bold, italic, headings, lists, tables, code blocks',
        'Drag images directly into documents—instant upload and embedding',
        'See exactly what you\'ll get—true WYSIWYG, no edit/preview switching',
        'Master keyboard shortcuts as you grow—Cmd+B for bold, Cmd+K for links, slash commands',
        'Zero learning curve—if you can format text in Google Docs, you can create markdown'
      ]
    },
    drive: {
      title: 'Your Files, Your Control',
      description: 'Auto-saves to YOUR Google Drive every 3 seconds—not our servers. We can\'t read your documents. Access anywhere, share with your team, revoke our access anytime. You own your data, period.',
      benefits: [
        'Saves every 3 seconds—never lose work from crashes, browser closures, or connection drops',
        'Access from any device—phone, tablet, desktop, all synced automatically via your Drive',
        'Uses your Google Drive storage—15GB free tier, or upgrade to Google One for more space',
        'Complete version history—restore any past version with one click, experiment fearlessly',
        'Works offline—edits sync automatically when your connection returns, seamless workflow'
      ]
    },
    export: {
      title: 'Optimized for AI Workflows',
      description: 'One-click markdown copy optimized for ChatGPT custom instructions, Claude Code agent configs, and GitHub documentation. Standard-compliant output—paste directly, zero conversion hassle.',
      benefits: [
        'Copy for ChatGPT—paste directly into custom instructions or knowledge base files',
        'Export to Claude Code—perfect for agent configurations and project documentation',
        'Download .md files—ready for GitHub READMEs, wikis, and version control',
        'Save as Word (.docx)—share polished documents with non-technical stakeholders',
        'CommonMark compliant—preserves all formatting (headings, bold, links, images, tables, code)'
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
