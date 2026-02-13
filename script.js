const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const backToTopBtn = document.getElementById("backToTop");
const contactForm = document.querySelector('.contact-form');

if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark-mode');
}

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
});

window.onscroll = function() {
  if (document.body.scrollTop > 400 || document.documentElement.scrollTop > 400) {
    backToTopBtn.style.opacity = "1";
    backToTopBtn.style.display = "block";
  } else {
    backToTopBtn.style.opacity = "0";
    setTimeout(() => { if(backToTopBtn.style.opacity === "0") backToTopBtn.style.display = "none"; }, 300);
  }
};

backToTopBtn.onclick = function() {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = contactForm.querySelector('button');
    const originalText = button.textContent;
    
    button.disabled = true;
    button.textContent = 'Sending...';

    const formData = new FormData(contactForm);
    const response = await fetch(contactForm.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      button.textContent = 'Message Sent!';
      button.style.backgroundColor = '#28a745';
      contactForm.reset();
      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalText;
        button.style.backgroundColor = '';
      }, 3000);
    } else {
      button.textContent = 'Error! Try again.';
      button.disabled = false;
    }
  });
}