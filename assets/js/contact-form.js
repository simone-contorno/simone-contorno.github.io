/**
 * Contact Form JavaScript
 * Handles the submission of the contact form
 */

document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form values
      const name = document.getElementById('name-field').value;
      const email = document.getElementById('email-field').value;
      const subject = document.getElementById('subject-field').value;
      const message = document.getElementById('message-field').value;
      
      // Show loading indicator
      contactForm.querySelector('.loading').style.display = 'block';
      contactForm.querySelector('.error-message').style.display = 'none';
      contactForm.querySelector('.sent-message').style.display = 'none';
      
      // Compose email link with mailto protocol
      const mailtoLink = `mailto:simone.contorno@outlook.it?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('Name: ' + name + '\n\nEmail: ' + email + '\n\nMessage:\n' + message)}`;
      
      // Open default email client
      window.location.href = mailtoLink;
      
      // Show success message
      setTimeout(function() {
        contactForm.querySelector('.loading').style.display = 'none';
        contactForm.querySelector('.sent-message').style.display = 'block';
        
        // Reset form
        contactForm.reset();
      }, 1000);
    });
  }
});