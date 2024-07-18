// Add dynamic functionality to the navigation bar
document.addEventListener("DOMContentLoaded", function() {
    const navLinks = document.querySelectorAll('.navbar a');
    const sections = document.querySelectorAll('section');

    function changeActiveLink() {
        let index = sections.length;

        while(--index && window.scrollY + 50 < sections[index].offsetTop) {}

        navLinks.forEach((link) => link.classList.remove('active'));
        navLinks[index].classList.add('active');
    }

    changeActiveLink();
    window.addEventListener('scroll', changeActiveLink);
});
