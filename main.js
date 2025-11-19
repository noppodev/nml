document.addEventListener('DOMContentLoaded', () => {
  // Initialize all static Lucide icons on the page
  lucide.createIcons();

  // --- Common Elements ---
  const header = document.getElementById('page-header');
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const currentYearSpan = document.getElementById('current-year');
  const copyButton = document.getElementById('copy-button');
  
  // --- Header Scroll Effect ---
  // On pages other than index.html, the header is always "scrolled"
  const isIndexPage = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html');
  if (header && isIndexPage) {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      const isMenuOpen = !mobileMenu.classList.contains('hidden');
      if (isScrolled || isMenuOpen) {
        header.classList.remove('bg-transparent', 'py-6');
        header.classList.add('bg-white/90', 'backdrop-blur-md', 'shadow-sm', 'py-4');
      } else {
        header.classList.add('bg-transparent', 'py-6');
        header.classList.remove('bg-white/90', 'backdrop-blur-md', 'shadow-sm', 'py-4');
      }
    };
    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
  }

  // --- Mobile Menu Toggle ---
  if (mobileMenuButton && mobileMenu) {
    const menuIcon = mobileMenuButton.querySelector('[data-lucide="menu"]');
    const xIcon = mobileMenuButton.querySelector('[data-lucide="x"]');
    
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      menuIcon.classList.toggle('hidden');
      xIcon.classList.toggle('hidden');
      // Also trigger header style change on index page
      if (isIndexPage) {
         const isScrolled = window.scrollY > 20;
         if (!isScrolled) {
            header.classList.toggle('bg-transparent');
            header.classList.toggle('py-6');
            header.classList.toggle('bg-white/90');
            header.classList.toggle('backdrop-blur-md');
            header.classList.toggle('shadow-sm');
            header.classList.toggle('py-4');
         }
      }
    });
  }

  // --- Footer: Current Year ---
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear().toString();
  }

  // --- QuickStart: Copy Button ---
  if (copyButton) {
    const installCmdText = document.getElementById('install-cmd-text')?.textContent;
    const copyIcon = copyButton.querySelector('[data-lucide="copy"]');
    const checkIcon = copyButton.querySelector('[data-lucide="check"]');

    copyButton.addEventListener('click', () => {
      if (!installCmdText) return;
      navigator.clipboard.writeText(installCmdText).then(() => {
        copyIcon.classList.add('hidden');
        checkIcon.classList.remove('hidden');
        setTimeout(() => {
          copyIcon.classList.remove('hidden');
          checkIcon.classList.add('hidden');
        }, 2000);
      });
    });
  }

  // --- Docs Page: Active Section Highlighting ---
  const docsSidebar = document.getElementById('docs-sidebar');
  if (docsSidebar) {
    const sections = docsSidebar.querySelectorAll('a');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          sections.forEach(link => {
            if (link.href.split('#')[1] === id) {
              link.classList.add('bg-nml-green/10', 'text-nml-green');
              link.classList.remove('text-slate-600');
            } else {
              link.classList.remove('bg-nml-green/10', 'text-nml-green');
              link.classList.add('text-slate-600');
            }
          });
        }
      });
    }, { rootMargin: "-50% 0px -50% 0px", threshold: 0 });

    document.querySelectorAll('main section').forEach(section => {
      observer.observe(section);
    });

    sections.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
            // Update URL hash without jumping
            history.pushState(null, null, targetId);
        });
    });
  }
});