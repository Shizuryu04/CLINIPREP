// frontend/js/case_library_handler.js
document.addEventListener("DOMContentLoaded", () => {
  const caseListingGrid = document.getElementById("caseListingGrid");
  const casesLoadingPlaceholder = document.getElementById(
    "casesLoadingPlaceholder"
  );
  const noCasesFoundMessage = document.getElementById("noCasesFoundMessage");

  const searchCaseInput = document.getElementById("searchCaseInput");
  const filterSpecialtySelect = document.getElementById("filterSpecialty");
  const filterDifficultySelect = document.getElementById("filterDifficulty");
  // const searchButton = document.querySelector('.btn-search-icon'); // Nếu cần nút search riêng

  let allFetchedCases = []; // Lưu trữ tất cả case lấy từ API

  function displayCases(casesToDisplay) {
    caseListingGrid.innerHTML = ""; // Xóa các card cũ hoặc placeholder
    noCasesFoundMessage.style.display = "none";

    if (!casesToDisplay || casesToDisplay.length === 0) {
      noCasesFoundMessage.style.display = "block";
      return;
    }

    casesToDisplay.forEach((caseData) => {
      const card = document.createElement("div");
      card.className = "case-item-card";

      // Độ khó class và text
      let difficultyClass = "";
      let difficultyText = "Không xác định";
      if (caseData.difficulty) {
        difficultyClass = `difficulty-${caseData.difficulty.toLowerCase()}`;
        difficultyText =
          caseData.difficulty.charAt(0).toUpperCase() +
          caseData.difficulty.slice(1);
      }

      card.innerHTML = `
              <div class="case-card-header">
                  <span class="case-card-specialty"><i class="fas fa-briefcase-medical"></i> ${
                    caseData.specialty_name || "Chưa rõ"
                  }</span>
                  <span class="case-card-difficulty ${difficultyClass}"><i class="fas fa-tachometer-alt"></i> ${difficultyText}</span>
              </div>
              <div class="case-card-body">
                  <h3 class="case-card-title">${
                    caseData.title || "Không có tiêu đề"
                  }</h3>
                  <p class="case-card-description">${
                    caseData.short_description || "Không có mô tả."
                  }</p>
              </div>
              <div class="case-card-footer">
                  <a href="case_simulation.html?caseId=${
                    caseData.id
                  }" class="btn btn-primary btn-sm">
                      <i class="fas fa-play"></i> Bắt đầu thực hành
                  </a>
              </div>
          `;
      caseListingGrid.appendChild(card);
    });
  }

  function applyFilters() {
    const searchTerm = searchCaseInput.value.toLowerCase();
    const selectedSpecialty = filterSpecialtySelect.value;
    const selectedDifficulty = filterDifficultySelect.value;

    const filteredCases = allFetchedCases.filter((caseItem) => {
      const titleMatch = caseItem.title.toLowerCase().includes(searchTerm);
      // Có thể mở rộng tìm kiếm trong description hoặc keywords nếu backend trả về
      // const descriptionMatch = caseItem.short_description.toLowerCase().includes(searchTerm);

      const specialtyMatch =
        !selectedSpecialty || caseItem.specialty_slug === selectedSpecialty;
      const difficultyMatch =
        !selectedDifficulty || caseItem.difficulty === selectedDifficulty;

      return (
        titleMatch /*|| descriptionMatch*/ && specialtyMatch && difficultyMatch
      );
    });
    displayCases(filteredCases);
  }

  async function populateSpecialtyFilter() {
    // TODO: Lý tưởng là lấy danh sách chuyên khoa từ một API riêng: GET /api/specialties
    // Tạm thời hardcode hoặc lấy từ dữ liệu case đã fetch
    const uniqueSpecialties = new Map();
    allFetchedCases.forEach((caseItem) => {
      if (caseItem.specialty_slug && caseItem.specialty_name) {
        if (!uniqueSpecialties.has(caseItem.specialty_slug)) {
          uniqueSpecialties.set(
            caseItem.specialty_slug,
            caseItem.specialty_name
          );
        }
      }
    });

    uniqueSpecialties.forEach((name, slug) => {
      const option = document.createElement("option");
      option.value = slug;
      option.textContent = name;
      filterSpecialtySelect.appendChild(option);
    });
  }

  async function fetchAndRenderCases() {
    casesLoadingPlaceholder.style.display = "block";
    noCasesFoundMessage.style.display = "none";
    caseListingGrid.innerHTML = ""; // Xóa card cũ

    try {
      const response = await fetch("http://localhost:3000/api/cases"); // Gọi API backend
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      allFetchedCases = await response.json();

      if (allFetchedCases && allFetchedCases.length > 0) {
        displayCases(allFetchedCases);
        await populateSpecialtyFilter(); // Populate sau khi có dữ liệu case
      } else {
        noCasesFoundMessage.style.display = "block";
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
      caseListingGrid.innerHTML = `<p class="error-message">Lỗi tải dữ liệu ca bệnh. Vui lòng thử lại sau.</p>`;
    } finally {
      casesLoadingPlaceholder.style.display = "none";
    }
  }

  // Gắn sự kiện
  if (searchCaseInput) {
    searchCaseInput.addEventListener("input", applyFilters);
  }
  // if (searchButton) { searchButton.addEventListener('click', applyFilters); } // Nếu có nút search riêng
  if (filterSpecialtySelect) {
    filterSpecialtySelect.addEventListener("change", applyFilters);
  }
  if (filterDifficultySelect) {
    filterDifficultySelect.addEventListener("change", applyFilters);
  }

  // Xử lý dropdown user menu (copy từ file script.js hoặc mcq_handler.js nếu cần)
  const userMenuButton = document.getElementById("userMenuButton");
  const userDropdownMenu = document.getElementById("userDropdownMenu");
  const logoutButton = document.getElementById("logoutButtonLibrary"); // ID mới cho nút logout ở trang này

  if (userMenuButton && userDropdownMenu) {
    userMenuButton.addEventListener("click", (event) => {
      event.stopPropagation(); // Ngăn sự kiện click lan ra window
      userDropdownMenu.classList.toggle("show");
    });
  }
  // Đóng dropdown khi click ra ngoài
  window.addEventListener("click", (event) => {
    if (userDropdownMenu && userDropdownMenu.classList.contains("show")) {
      if (
        !userMenuButton.contains(event.target) &&
        !userDropdownMenu.contains(event.target)
      ) {
        userDropdownMenu.classList.remove("show");
      }
    }
  });
  if (logoutButton) {
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      // TODO: Xử lý logic logout (xóa token, chuyển hướng về trang login)
      console.log("Logout clicked");
      alert("Chức năng đăng xuất sẽ được thực hiện ở đây.");
      // window.location.href = "login.html";
    });
  }

  // Tải dữ liệu lần đầu
  fetchAndRenderCases();
});
