const pages = document.querySelectorAll(".pagination a");
pages.forEach(page => {
  page.addEventListener("click", e => {
    e.preventDefault();
    pages.forEach(p => p.classList.remove("active"));
    page.classList.add("active");
    // ở đây bạn có thể gọi hàm loadBlogPage(page.textContent);
  });
});
