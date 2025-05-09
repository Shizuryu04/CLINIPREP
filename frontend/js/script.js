/**
 * @file script.js
 * @description Contains common JavaScript functions and initializations used across multiple pages.
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- Common UI Elements & Logic ---

  // User Menu Dropdown Logic
  const userMenuButton = document.getElementById("userMenuButton");
  const userDropdownMenu = document.getElementById("userDropdownMenu");

  if (userMenuButton && userDropdownMenu) {
    userMenuButton.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent click from immediately closing menu
      userDropdownMenu.classList.toggle("show");
      userMenuButton.classList.toggle("active"); // Optional: for styling the button when menu is open
    });

    // Close dropdown if clicked outside
    document.addEventListener("click", (event) => {
      if (
        userDropdownMenu.classList.contains("show") &&
        !userMenuButton.contains(event.target) &&
        !userDropdownMenu.contains(event.target)
      ) {
        userDropdownMenu.classList.remove("show");
        if (userMenuButton.classList.contains("active")) {
          userMenuButton.classList.remove("active");
        }
      }
    });
  }

  // Logout Button Logic (if you have a common logout button ID in the dropdown)
  const logoutButton = document.getElementById("logoutButton"); // Assuming a common ID like 'logoutButton'
  if (logoutButton) {
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault();
      // Implement actual logout logic here
      // e.g., clear session/token, redirect to login page
      console.log("Logout action triggered.");
      alert("Chức năng Đăng xuất (cần được hiện thực hóa).");
      // window.location.href = '/login.html'; // Example redirect
    });
  }

  // Add any other common functions or initializations here
  // For example, a function to show global notifications, etc.
  console.log("Common script.js loaded and executed.");
});
