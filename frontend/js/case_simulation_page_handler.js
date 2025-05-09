/**
 * @file case_simulation_page_handler.js
 * @description Handles client-side logic for the case simulation page, including interaction modals and the Clinical Reasoning Canvas.
 */

document.addEventListener("DOMContentLoaded", () => {
  // =======================================================================
  // I. DOM ELEMENT SELECTION
  // =======================================================================
  // --- Main Page Elements ---
  const caseSimTitleEl = document.getElementById("caseSimTitleLoading");
  const caseInitialInfoAreaEl = document.getElementById("caseInitialInfoArea");
  const studentActionLogListEl = document.getElementById(
    "studentActionLogList"
  );

  // --- Main Interaction Buttons ---
  const openAskHistoryModalBtnEl = document.getElementById(
    "openAskHistoryModalBtn"
  );
  const openPhysicalExamModalBtnEl = document.getElementById(
    "openPhysicalExamModalBtn"
  );
  const openOrderLabsModalBtnEl = document.getElementById(
    "openOrderLabsModalBtn"
  );
  const labsLockIndicatorEl = document.getElementById("labsLockIndicator");

  // --- Top Action Buttons ---
  const viewMedicalRecordBtnEl = document.getElementById(
    "viewMedicalRecordBtn"
  );
  const openClinicalCanvasBtnEl = document.getElementById(
    "openClinicalCanvasBtn"
  );

  // --- Modal 1: Ask History ---
  const askHistoryModalEl = document.getElementById("askHistoryModal");
  const historyCategoriesListEl = document.getElementById(
    "historyCategoriesList"
  );
  const historyQuestionsListEl = document.getElementById(
    "historyQuestionsList"
  );
  const historyCollectedItemsContainerEl = document.getElementById(
    "historyCollectedItemsContainer"
  );
  const addSelectedHistoryToMRBtnEl = document.getElementById(
    "addSelectedHistoryToMedicalRecordBtn"
  );

  // --- Modal 2: Physical Exam ---
  const physicalExamModalEl = document.getElementById("physicalExamModal");
  const examCategoriesListEl = document.getElementById("examCategoriesList");
  const examSkillInteractionAreaEl = document.getElementById(
    "examSkillInteractionArea"
  );
  const examCollectedItemsContainerEl = document.getElementById(
    "examCollectedItemsContainer"
  );
  const addSelectedExamToMRBtnEl = document.getElementById(
    "addSelectedExamToMedicalRecordBtn"
  );

  // --- Modal 3: Order Labs ---
  const orderLabsModalEl = document.getElementById("orderLabsModal");
  const searchLabInputEl = document.getElementById("searchLabInput");
  const labCategoriesListEl = document.getElementById("labCategoriesList");
  const labResultDisplayAreaEl = document.getElementById(
    "labResultDisplayArea"
  );
  const labCollectedItemsContainerEl = document.getElementById(
    "labCollectedItemsContainer"
  );
  const addSelectedLabsToMRBtnEl = document.getElementById(
    "addSelectedLabsToMedicalRecordBtn"
  );

  // --- Modal 4: Display Medical Record ---
  const medicalRecordDisplayModalEl = document.getElementById(
    "medicalRecordDisplayModal"
  );
  const triggerTagExtractionFromMRBtnEl = document.getElementById(
    "triggerTagExtractionFromMRBtn"
  );
  // Object mapping medical record fields to their display elements in the modal
  const mrDisplayFields = {
    hoTen: document.getElementById("mrDisplay_hoTen"),
    tuoi: document.getElementById("mrDisplay_tuoi"),
    gioiTinh: document.getElementById("mrDisplay_gioiTinh"),
    diaChi: document.getElementById("mrDisplay_diaChi"),
    ngheNghiep: document.getElementById("mrDisplay_ngheNghiep"),
    mrlyDoVaoVien: document.getElementById("mrDisplay_lyDoVaoVien"),
    mrbenhSu: document.getElementById("mrDisplay_benhSu"),
    mrtienSuBanThan: document.getElementById("mrDisplay_tienSuBanThan"),
    mrtienSuGiaDinh: document.getElementById("mrDisplay_tienSuGiaDinh"),
    mrdichTe: document.getElementById("mrDisplay_dichTe"),
    mrkhamToanThan: document.getElementById("mrDisplay_khamToanThan"),
    mrkhamTuanHoan: document.getElementById("mrDisplay_khamTuanHoan"),
    mrkhamHoHap: document.getElementById("mrDisplay_khamHoHap"),
    mrkhamTieuHoa: document.getElementById("mrDisplay_khamTieuHoa"),
    mrkhamThanTietNieu: document.getElementById("mrDisplay_khamThanTietNieu"),
    mrkhamCoXuongKhop: document.getElementById("mrDisplay_khamCoXuongKhop"),
    mrkhamThanKinh: document.getElementById("mrDisplay_khamThanKinh"),
    mrkhamCoQuanKhac: document.getElementById("mrDisplay_khamCoQuanKhac"),
    mrtomTatBenhAn: document.getElementById("mrDisplay_tomTatBenhAn"),
    mrchanDoanSoBo: document.getElementById("mrDisplay_chanDoanSoBo"),
    mrketQuaCLS: document.getElementById("mrDisplay_ketQuaCLS"),
    mrchanDoanXacDinh: document.getElementById("mrDisplay_chanDoanXacDinh"),
  };
  // --- Modal 5: Clinical Reasoning Canvas ---
  const clinicalReasoningCanvasModalEl = document.getElementById(
    "clinicalReasoningCanvasModal"
  );
  const canvasToolbarEl = document.getElementById("canvasToolbar");
  const actualCanvasAreaEl = document.getElementById("actualCanvasArea"); // Khu vực chứa blocks và arrows
  const canvasAvailableTagsListEl = document.getElementById(
    "canvasAvailableTagsList"
  ); // Panel tags bên trái
  const canvasSvgLayerEl = createSvgLayer(actualCanvasAreaEl);
  const saveCanvasProgressBtn = document.getElementById(
    "saveCanvasProgressBtn"
  ); // Nút lưu nháp

  // --- Dynamic Popups/Context Menus (Sẽ tạo khi cần) ---
  let blockContextMenuEl = null;
  let selectTagsPopupEl = null;
  let editPopupEl = null; // Popup chung cho edit text/note
  // --- II. STATE VARIABLES ---
  // Variables to hold the current state of the simulation.

  let currentCaseId = null; // ID of the currently active case
  let currentCaseData = null; // Full data for the current case (from /start API)
  let currentMedicalRecord = {}; // Client-side object representing the EMR being built

  // Temporary arrays to hold items collected in each modal before adding to the EMR
  let tempCollectedHistoryItems = [];
  let tempCollectedExamItems = [];
  let tempCollectedLabItems = [];

  // Counters for items added to the EMR, used for unlocking labs
  let historyItemsAddedToMRCount = 0; // Đếm số item Hỏi Bệnh đã vào Bệnh Án
  let examItemsAddedToMRCount = 0; // Đếm số item Khám LS đã vào Bệnh Án
  let labUnlockConditions = {
    min_history_items_collected: 3, // VÍ DỤ: Cần ít nhất 3 item hỏi bệnh
    min_exam_items_collected: 2, // VÍ DỤ: Cần ít nhất 2 item khám
  };

  // State for UI interactions
  let currentSelectedHistoryCategoryBtn = null;
  let currentSelectedExamCategoryBtn = null;
  let currentSkillMcqs = []; // Holds MCQs for the currently selected exam skill
  let allLabsFromBank = []; // Stores all labs fetched from the lab bank for client-side filtering

  // Base URL for API calls (configurable if needed)
  const API_BASE_URL = "https://cliniprep.onrender.com/cases";
  let currentExtractedTags = [];

  /// --- Canvas Specific State ---

  let canvasState = {
    blocks: {}, // { blockId: { id, type, x, y, title, content:[...] }, ... }
    connections: {}, // { connId: { id, from, to, note:"" }, ... }
  };
  let nextBlockIdCounter = 0;
  let nextConnectionIdCounter = 0;
  let selectedCanvasObjectId = null; // ID của block hoặc connection đang được chọn
  let isDraggingBlock = false; // Cờ cho biết có đang kéo một block không
  let draggedBlockElement = null; // DOM element của block đang được kéo
  let dragOffsetX = 0; // Độ lệch X giữa chuột và góc trên trái block khi bắt đầu kéo
  let dragOffsetY = 0; // Độ lệch Y
  let activeContextMenuBlockId = null; // ID của block đang có context menu mở
  const LOCAL_STORAGE_CANVAS_KEY_PREFIX = "cliniprep_canvas_";

  // --- III. HELPER FUNCTIONS ---
  // Utility functions used throughout the script.

  /**
   * Logs an action performed by the student to the action log UI.
   * @param {string} actionText - The text describing the action.
   */
  function logStudentAction(actionText) {
    if (!studentActionLogListEl) return;
    const listItem = document.createElement("li");
    const timestamp = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    listItem.innerHTML = `<span>[${timestamp}]</span> ${actionText}`;
    studentActionLogListEl.prepend(listItem); // Add new logs to the top
  }

  /**
   * Opens a specified modal dialog.
   * @param {HTMLElement} modalElement - The modal element to open.
   */
  function openModal(modalElement) {
    if (modalElement) modalElement.style.display = "block";
    document.body.classList.add("modal-open");
  }

  /**
   * Closes a specified modal dialog.
   * @param {HTMLElement} modalElement - The modal element to close.
   */
  function closeModal(modalElement) {
    if (modalElement) modalElement.style.display = "none";
    const anyModalOpen = Array.from(document.querySelectorAll(".modal")).some(
      (m) => m.style.display === "block"
    );
    if (!anyModalOpen) {
      document.body.classList.remove("modal-open");
    }
  }

  /**
   * Displays a loading message within a given element.
   * @param {HTMLElement} element - The element to display the loading message in.
   * @param {string} [message="Đang tải..."] - The loading message.
   */
  function showLoading(element, message = "Đang tải...") {
    if (element)
      element.innerHTML = `<p class="column-loading-text"><i class="fas fa-spinner fa-spin"></i> ${message}</p>`;
  }

  /**
   * Displays a placeholder message (e.g., "No data") within a given element.
   * @param {HTMLElement} element - The element to display the placeholder in.
   * @param {string} [message="Không có dữ liệu."] - The placeholder message.
   */
  function showPlaceholder(element, message = "Không có dữ liệu.") {
    if (element)
      element.innerHTML = `<p class="column-placeholder-text">${message}</p>`;
  }

  /**
   * Displays an error message within a given element.
   * @param {HTMLElement} element - The element to display the error in.
   * @param {string} [message="Lỗi tải dữ liệu."] - The error message.
   */
  function showError(element, message = "Lỗi tải dữ liệu.") {
    if (element)
      element.innerHTML = `<p class="error-message"><i class="fas fa-exclamation-triangle"></i> ${message}</p>`;
  }

  /**
   * Initializes the client-side medical record object.
   * Populates administrative data if provided.
   * @param {object} [adminData={}] - Administrative data for the patient.
   */
  function initializeMedicalRecord(adminData = {}) {
    currentMedicalRecord = {};
    // Các trường hành chính (key không có 'mr' trong adminData từ backend)
    const adminFields = ["hoTen", "tuoi", "gioiTinh", "diaChi", "ngheNghiep"];
    adminFields.forEach((field) => {
      currentMedicalRecord[field] =
        adminData[field] !== undefined ? String(adminData[field]) : "";
    });

    // Các trường bệnh án chính (key có 'mr' và camelCase, khớp với cases_data.json mới)
    // và sẽ được điền từ tương tác
    const mainRecordFields = [
      "mrlyDoVaoVien",
      "mrbenhSu",
      "mrtienSuBanThan",
      "mrtienSuGiaDinh",
      "mrdichTe",
      "mrkhamToanThan",
      "mrkhamTuanHoan",
      "mrkhamHoHap",
      "mrkhamTieuHoa",
      "mrkhamThanTietNieu",
      "mrkhamCoXuongKhop",
      "mrkhamThanKinh",
      "mrkhamCoQuanKhac",
      "mrtomTatBenhAn",
      "mrchanDoanSoBo",
      "mrketQuaCLS",
      "mrchanDoanXacDinh",
    ];
    mainRecordFields.forEach((field) => {
      currentMedicalRecord[field] = ""; // Khởi tạo rỗng
    });
    updateMedicalRecordDisplay();
  }
  /**
   * Updates the UI of the Medical Record Display Modal with data from `currentMedicalRecord`.
   */
  function updateMedicalRecordDisplay() {
    // LOG 7 (for debugging)
    console.log(
      "[updateMedicalRecordDisplay] Updating. currentMedicalRecord:",
      JSON.parse(JSON.stringify(currentMedicalRecord))
    );
    // LOG 8 (for debugging)
    console.log(
      "[updateMedicalRecordDisplay] mrDisplayFields object (keys should match currentMedicalRecord and HTML IDs):",
      mrDisplayFields
    );

    for (const keyInDisplayFields in mrDisplayFields) {
      // Lặp qua các key của mrDisplayFields
      const displayElement = mrDisplayFields[keyInDisplayFields];
      if (displayElement) {
        // Key để truy cập currentMedicalRecord sẽ giống với keyInDisplayFields
        const valueFromRecord = currentMedicalRecord[keyInDisplayFields];
        // LOG 9 (for debugging)
        console.log(
          `[updateMRDisplay] Key: "${keyInDisplayFields}", Value: "${valueFromRecord}", Element:`,
          displayElement
        );

        const valueToDisplay =
          valueFromRecord !== undefined &&
          valueFromRecord !== null &&
          String(valueFromRecord).trim() !== ""
            ? String(valueFromRecord)
            : displayElement.tagName === "TEXTAREA"
            ? ""
            : "-";

        if (displayElement.tagName === "TEXTAREA") {
          displayElement.value = valueToDisplay;
        } else {
          displayElement.textContent = valueToDisplay;
        }
      } else {
        console.warn(
          `[updateMRDisplay] No display element found for key: "${keyInDisplayFields}". Check mrDisplayFields and HTML ID "mrDisplay_${keyInDisplayFields.replace(
            "mr",
            ""
          )}".`
        );
      }
    }
    // Enable/disable tag extraction and canvas buttons based on EMR content
    const meaningfulFields = [
      "mrlyDoVaoVien",
      "mrbenhSu",
      "mrkhamToanThan",
      "mrketQuaCLS",
    ]; // Key mới
    const hasContent = meaningfulFields.some(
      (field) =>
        currentMedicalRecord[field] &&
        String(currentMedicalRecord[field]).trim() !== ""
    );
    if (triggerTagExtractionFromMRBtnEl)
      triggerTagExtractionFromMRBtnEl.disabled = !hasContent;
    if (openClinicalCanvasBtnEl) openClinicalCanvasBtnEl.disabled = !hasContent;
  }

  /**
   * Provides a user-friendly name for a medical record field key.
   * @param {string} fieldKey - The internal key of the medical record field (e.g., "mrlyDoVaoVien").
   * @returns {string} A more readable name.
   */
  function getFieldNameHint(fieldKey) {
    // Cập nhật hints để khớp với các key mới nếu cần, hoặc đơn giản hóa
    const simpleHints = {
      mrlyDoVaoVien: "Lý do vào viện",
      mrbenhSu: "Bệnh sử",
      mrtienSuBanThan: "Tiền sử bản thân",
      mrtienSuGiaDinh: "Tiền sử gia đình",
      mrdichTe: "Dịch tễ",
      mrkhamToanThan: "Khám toàn thân",
      mrkhamTuanHoan: "Khám tuần hoàn",
      mrkhamHoHap: "Khám hô hấp",
      mrkhamTieuHoa: "Khám tiêu hóa",
      mrkhamThanTietNieu: "Khám thận tiết niệu",
      mrkhamCoXuongKhop: "Khám cơ xương khớp",
      mrkhamThanKinh: "Khám thần kinh",
      mrkhamCoQuanKhac: "Khám cơ quan khác",
      mrketQuaCLS: "Kết quả CLS",
    };
    return simpleHints[fieldKey] || fieldKey; // Trả về key nếu không có hint
  }
  /** Creates an SVG layer on top of the canvas area for drawing arrows. */
  function createSvgLayer(canvasArea) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%"; // Sẽ cần cập nhật nếu canvas có thể scroll rộng/cao hơn
    svg.style.height = "100%";
    svg.style.pointerEvents = "none"; // Để click xuyên qua SVG vào các block
    svg.style.zIndex = "5"; // Dưới context menu nhưng trên block? (có thể cần điều chỉnh)

    // Định nghĩa marker mũi tên
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker"
    );
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "0"); // Vị trí gắn vào đường line
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    const polygon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    polygon.setAttribute("points", "0 0, 10 3.5, 0 7"); // Hình tam giác
    polygon.setAttribute("fill", "#555"); // Màu mũi tên
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    canvasArea.appendChild(svg);
    return svg;
  }
  // --- IV. API CALL FUNCTIONS ---
  // Functions dedicated to making requests to the backend.

  /**
   * Generic function to fetch data from the backend.
   * @param {string} url - The API endpoint URL.
   * @param {object} [options={}] - Options for the fetch request (e.g., method, headers, body).
   * @returns {Promise<object>} A promise that resolves with the JSON response.
   */
  async function fetchData(url, options = {}) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP error ${response.status}: ${response.statusText}`,
        }));
        console.error(
          `API Error for ${url}: Status ${response.status}`,
          errorData
        );
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error(`Fetch Error for ${url}:`, error);
      throw error; // Re-throw to be caught by calling function
    }
  }

  /**
   * Fetches the initial data for a given case ID.
   * @param {string} caseId - The ID of the case to fetch.
   */
  async function fetchCaseInitialData(caseId) {
    showLoading(caseInitialInfoAreaEl, "Đang tải tình huống ban đầu...");
    if (caseSimTitleEl) caseSimTitleEl.textContent = "Đang tải ca bệnh...";
    try {
      const data = await fetchData(`${API_BASE_URL}/${caseId}/start`);
      currentCaseData = data;
      if (caseSimTitleEl)
        caseSimTitleEl.textContent = currentCaseData.title || "Ca Lâm Sàng";
      if (caseInitialInfoAreaEl) {
        caseInitialInfoAreaEl.innerHTML = `<p>${
          currentCaseData.initial_info || "Không có thông tin ban đầu."
        }</p>`;
      }
      initializeMedicalRecord(currentCaseData.administrative);
      logStudentAction(`Bắt đầu ca: ${currentCaseData.title}`);
      await fetchLabUnlockConditions(caseId); // Fetch unlock conditions after case data is loaded
    } catch (error) {
      if (caseSimTitleEl) caseSimTitleEl.textContent = "Lỗi Tải Case";
      showError(
        caseInitialInfoAreaEl,
        `Không thể tải thông tin ca bệnh. ${error.message}`
      );
    }
  }

  /**
   * Fetches the conditions required to unlock the lab ordering feature for the current case.
   * @param {string} caseId - The ID of the current case.
   */
  async function fetchLabUnlockConditions(caseId) {
    try {
      const data = await fetchData(
        `${API_BASE_URL}/${caseId}/lab-unlock-conditions`
      );
      if (data && data.conditions) {
        labUnlockConditions = data.conditions;
        console.log("Lab unlock conditions loaded:", labUnlockConditions);
      } else {
        console.warn(
          "No specific lab unlock conditions received, using defaults."
        );
        // Giữ nguyên default đã khai báo nếu API không trả về gì hoặc không có 'conditions'
      }
    } catch (error) {
      console.error(
        "Error fetching lab unlock conditions, using defaults:",
        error.message
      );
      // Giữ nguyên default đã khai báo nếu có lỗi
    }
    checkAndUnlockLabs(); // Check immediately after fetching/defaulting
  }

  /**
   * Checks if lab ordering should be unlocked based on collected items and updates UI.
   */
  function checkAndUnlockLabs() {
    if (
      !labUnlockConditions ||
      !openOrderLabsModalBtnEl ||
      !labsLockIndicatorEl
    ) {
      console.warn(
        "Cannot check lab unlock: missing conditions or DOM elements."
      );
      return;
    }

    const historyMet =
      historyItemsAddedToMRCount >=
      labUnlockConditions.min_history_items_collected;
    const examMet =
      examItemsAddedToMRCount >= labUnlockConditions.min_exam_items_collected;
    const unlocked = historyMet && examMet;

    console.log(
      `Checking lab unlock: History items ${historyItemsAddedToMRCount}/${labUnlockConditions.min_history_items_collected} (Met: ${historyMet}). Exam items ${examItemsAddedToMRCount}/${labUnlockConditions.min_exam_items_collected} (Met: ${examMet}). Unlocked: ${unlocked}`
    );

    openOrderLabsModalBtnEl.disabled = !unlocked;
    labsLockIndicatorEl.style.display = unlocked ? "none" : "inline-block";

    if (unlocked && !openOrderLabsModalBtnEl.dataset.unlockedOnceFlag) {
      logStudentAction("Mục Đề xuất CLS đã được mở khóa.");
      openOrderLabsModalBtnEl.dataset.unlockedOnceFlag = "true"; // Gắn cờ để chỉ log 1 lần
    }
  }

  // =======================================================================
  // V. EMR BUILDING LOGIC (Modals 1, 2, 3)
  // =======================================================================

  /**
   * Renders items (history, exam, lab results) into the "collected information" column of a modal.
   * @param {HTMLElement} containerEl - The DOM element to render items into.
   * @param {Array<object>} itemsArray - The array of item objects to render.
   * @param {HTMLElement} addBtnEl - The "Add to Medical Record" button for this section.
   * @param {'history'|'exam'|'lab'} type - The type of items being rendered.
   */
  function renderCollectedItems(containerEl, itemsArray, addBtnEl, type) {
    // Clear placeholder if items exist, or if it's the first render (to remove initial placeholder)
    if (
      (containerEl.querySelector(".column-placeholder-text") &&
        itemsArray.some((item) => !item.addedToMR)) ||
      itemsArray.length === 0
    ) {
      containerEl.innerHTML = ""; // Clear if there's a placeholder and new items, OR if no items to show placeholder later
    }

    // Only render items that haven't been added to the MR yet
    const itemsToRender = itemsArray.filter((item) => !item.addedToMR);

    itemsToRender.forEach((item) => {
      // Only create a new DOM element if it doesn't already exist for this item
      if (!document.getElementById(item.domId)) {
        const itemEl = document.createElement("div");
        itemEl.className = "collected-item";
        itemEl.id = item.domId;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `chk_${item.domId}`;
        checkbox.checked = item.selected; // Persist selection state
        checkbox.addEventListener("change", () => {
          item.selected = checkbox.checked;
          const anySelected = itemsArray.some(
            (i) => i.selected && !i.addedToMR
          );
          if (addBtnEl) addBtnEl.disabled = !anySelected;
        });

        const label = document.createElement("label");
        label.htmlFor = `chk_${item.domId}`;
        let labelHTML = "";
        if (type === "history") {
          labelHTML = `<strong>Hỏi:</strong> ${
            item.question_text_asked || "N/A"
          }<br><strong>Trả lời:</strong> ${item.text_result || "N/A"}`;
        } else if (type === "exam") {
          labelHTML = `<strong>Khám:</strong> ${
            item.skill_name || "N/A"
          }<br><strong>Kết quả:</strong> ${item.text_result || "N/A"}`;
        } else if (type === "lab") {
          labelHTML = `<strong>CLS:</strong> ${
            item.lab_name || "N/A"
          }<br><strong>Kết quả:</strong> ${item.text_result || "N/A"}`;
          if (item.image_url)
            labelHTML += `<br><img src="${item.image_url}" alt="Hình ảnh ${
              item.lab_name || ""
            }" class="lab-result-image">`;
        }
        label.innerHTML = labelHTML;

        itemEl.appendChild(checkbox);
        itemEl.appendChild(label);
        containerEl.prepend(itemEl); // Prepend to show newest items at the top
      }
    });

    // Show placeholder if no items are left to be shown in the collected column
    if (itemsToRender.length === 0) {
      const placeholderMessage =
        type === "history"
          ? "Thông tin sẽ xuất hiện ở đây sau khi bạn hỏi."
          : type === "exam"
          ? "Kết quả khám sẽ xuất hiện ở đây."
          : "Kết quả CLS đã chọn sẽ xuất hiện ở đây.";
      showPlaceholder(containerEl, placeholderMessage);
    }
    // Update "Add to MR" button state
    const anySelected = itemsArray.some((i) => i.selected && !i.addedToMR);
    if (addBtnEl) addBtnEl.disabled = !anySelected;
  }

  // --- Sửa đổi handleAddItemsToMedicalRecord để sử dụng key đã đồng nhất ---
  /**
   * Handles adding selected items from a temporary collection to the main currentMedicalRecord.
   * @param {Array<object>} itemsArray - The array of items (e.g., tempCollectedHistoryItems).
   * @param {'history'|'exam'|'lab'} type - The type of items being rendered (đổi tên biến cho rõ).
   * @returns {boolean} True if items were added, false otherwise.
   */
  function handleAddItemsToMedicalRecord(itemsArray, itemType) {
    // Đổi tên biến 'type' thành 'itemType'
    let itemsAddedCountThisTime = 0;
    // console.log(`[AddItemsToMR] For ${itemType}. Items:`, JSON.parse(JSON.stringify(itemsArray)));

    itemsArray.forEach((item) => {
      if (item.selected && item.field_target && !item.addedToMR) {
        // ... (logic tạo entryText và cập nhật currentMedicalRecord - giữ nguyên) ...
        const targetFieldKey = item.field_target;
        const currentFieldValue = currentMedicalRecord[targetFieldKey];
        const prefix =
          currentFieldValue === undefined ||
          currentFieldValue === null ||
          String(currentFieldValue).trim() === ""
            ? ""
            : "\n- ";
        let entryText = item.text_result || "";
        if (itemType === "history" && item.question_text_asked) {
          entryText = `(Hỏi: ${item.question_text_asked}) ${
            item.text_result || "N/A"
          }`;
        } else if (itemType === "exam" && item.skill_name) {
          entryText = `(Khám ${item.skill_name}): ${item.text_result || "N/A"}`;
        } else if (itemType === "lab" && item.lab_name) {
          entryText = `(CLS ${item.lab_name}): ${item.text_result || "N/A"}`;
        }
        currentMedicalRecord[targetFieldKey] =
          (currentFieldValue || "") + prefix + entryText;
        // console.log(`[AddItemsToMR] Updated MR.${targetFieldKey} to:`, currentMedicalRecord[targetFieldKey]);

        logStudentAction(
          `Thêm vào Bệnh Án (${getFieldNameHint(targetFieldKey)}): "${(
            item.text_result || ""
          ).substring(0, 50)}..."`
        );
        itemsAddedCountThisTime++;
        item.addedToMR = true;
        item.selected = false; // Bỏ chọn sau khi thêm

        // CẬP NHẬT COUNTERS ĐỂ MỞ KHÓA CLS
        if (itemType === "history") {
          historyItemsAddedToMRCount++;
        } else if (itemType === "exam") {
          examItemsAddedToMRCount++;
        }
      }
    });

    if (itemsAddedCountThisTime > 0) {
      updateMedicalRecordDisplay();
      checkAndUnlockLabs(); // <-- GỌI KIỂM TRA MỞ KHÓA Ở ĐÂY
      alert(`${itemsAddedCountThisTime} thông tin đã được thêm vào bệnh án.`);
      return true;
    } else {
      alert(
        "Vui lòng chọn ít nhất một thông tin có mục tiêu bệnh án rõ ràng để thêm."
      );
      return false;
    }
  }

  // --- A. Ask History Modal Logic ---
  /** Loads history categories for the current case into the UI. */
  async function loadHistoryCategories() {
    showLoading(historyCategoriesListEl);
    showPlaceholder(historyQuestionsListEl, "Chọn một mục hỏi để xem câu hỏi.");
    renderCollectedItems(
      historyCollectedItemsContainerEl,
      tempCollectedHistoryItems,
      addSelectedHistoryToMRBtnEl,
      "history"
    ); // Re-render to clear old selections if any
    if (addSelectedHistoryToMRBtnEl)
      addSelectedHistoryToMRBtnEl.disabled = true;

    if (!currentCaseId) return;
    try {
      const categories = await fetchData(
        `${API_BASE_URL}/${currentCaseId}/history-categories`
      );
      historyCategoriesListEl.innerHTML = "";
      if (categories && categories.length > 0) {
        categories.forEach((cat) => {
          const btn = document.createElement("button");
          btn.className = "list-item-button";
          btn.textContent = cat.name;
          btn.dataset.categoryId = cat.id;
          btn.addEventListener("click", () => {
            if (currentSelectedHistoryCategoryBtn)
              currentSelectedHistoryCategoryBtn.classList.remove("active");
            btn.classList.add("active");
            currentSelectedHistoryCategoryBtn = btn;
            loadHistoryQuestions(cat.id);
          });
          historyCategoriesListEl.appendChild(btn);
        });
      } else {
        showPlaceholder(
          historyCategoriesListEl,
          "Không có mục hỏi nào cho ca này."
        );
      }
    } catch (error) {
      showError(
        historyCategoriesListEl,
        `Lỗi tải danh mục hỏi bệnh: ${error.message}`
      );
    }
  }

  /**
   * Loads suggested history questions for a specific category into the UI.
   * @param {string} categoryId - The ID of the history category.
   */
  async function loadHistoryQuestions(categoryId) {
    showLoading(historyQuestionsListEl);
    if (!currentCaseId || !categoryId) return;
    try {
      const questions = await fetchData(
        `${API_BASE_URL}/${currentCaseId}/history-questions/${categoryId}`
      );
      historyQuestionsListEl.innerHTML = "";
      if (questions && questions.length > 0) {
        questions.forEach((q) => {
          const itemBtn = document.createElement("button");
          itemBtn.className = "list-item-button";
          itemBtn.textContent = q.text;
          itemBtn.dataset.questionId = q.id;
          // Check if this question has already been asked and is in temp items (and not added to MR)
          const existingTempItem = tempCollectedHistoryItems.find(
            (it) => it.question_id === q.id && !it.addedToMR
          );
          if (existingTempItem) {
            itemBtn.classList.add("question-asked-temp"); // Style differently if already asked (in temp)
            itemBtn.title =
              "Câu hỏi này đã được hỏi, kết quả đang ở cột thu thập.";
          }
          itemBtn.addEventListener("click", async () => {
            itemBtn.disabled = true;
            itemBtn.classList.add("processing");
            await handleAskQuestion(q.id, q.text);
            itemBtn.disabled = false;
            itemBtn.classList.remove("processing");
            itemBtn.classList.add("question-asked-temp"); // Mark as asked
          });
          historyQuestionsListEl.appendChild(itemBtn);
        });
      } else {
        showPlaceholder(
          historyQuestionsListEl,
          "Không có câu hỏi gợi ý cho mục này."
        );
      }
    } catch (error) {
      showError(historyQuestionsListEl, `Lỗi tải câu hỏi: ${error.message}`);
    }
  }

  /**
   * Handles the action of a student asking a specific history question.
   * Fetches the answer and adds it to the temporary collected items.
   * @param {string} questionId - The ID of the question being asked.
   * @param {string} questionText - The text of the question (for logging and UI).
   */
  async function handleAskQuestion(questionId, questionText) {
    logStudentAction(`Hỏi: "${questionText}"`);
    try {
      const answerData = await fetchData(
        `${API_BASE_URL}/${currentCaseId}/ask-question`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId }),
        }
      );
      // LOG 1
      console.log(
        "[AskQuestion] Backend Answer:",
        JSON.parse(JSON.stringify(answerData))
      );

      // Avoid duplicate entries in the temporary list if user clicks multiple times on the same question
      // before adding to MR. If it exists, we assume it's already rendered.
      const existingItemIndex = tempCollectedHistoryItems.findIndex(
        (item) => item.question_id === questionId && !item.addedToMR
      );

      if (existingItemIndex === -1) {
        // If not found, add new
        const newItem = {
          domId: `histItem_${Date.now()}_${Math.random()
            .toString(16)
            .slice(2)}`,
          question_id: questionId,
          question_text_asked: questionText,
          text_result: answerData.answer_text,
          field_target: answerData.medical_record_field_target,
          selected: true,
          addedToMR: false, // Auto-select when first asked
        };
        tempCollectedHistoryItems.push(newItem);
        // LOG 2
        console.log(
          "[AskQuestion] New item added to temp:",
          JSON.parse(JSON.stringify(newItem))
        );
      } else {
        // If found, ensure it's marked as selected so the "Add to MR" button enables
        tempCollectedHistoryItems[existingItemIndex].selected = true;
        // console.log("[AskQuestion] Existing item in temp, re-selected:", JSON.parse(JSON.stringify(tempCollectedHistoryItems[existingItemIndex])));
      }

      renderCollectedItems(
        historyCollectedItemsContainerEl,
        tempCollectedHistoryItems,
        addSelectedHistoryToMRBtnEl,
        "history"
      );
      logStudentAction(
        `Bệnh nhân: "${(answerData.answer_text || "").substring(0, 70)}..."`
      );
    } catch (error) {
      logStudentAction(`Lỗi khi hỏi "${questionText}": ${error.message}`);
      const errorDiv = document.createElement("div");
      errorDiv.className = "collected-item error-display";
      errorDiv.textContent = `Lỗi: ${error.message} khi hỏi "${questionText}"`;
      if (historyCollectedItemsContainerEl)
        historyCollectedItemsContainerEl.prepend(errorDiv);
      console.error(`[handleAskQuestion] Catch Error:`, error);
    }
  }
  // Attach event listener for "Add to Medical Record" button in History Modal
  if (addSelectedHistoryToMRBtnEl) {
    addSelectedHistoryToMRBtnEl.addEventListener("click", () => {
      if (handleAddItemsToMedicalRecord(tempCollectedHistoryItems, "history")) {
        // After successfully adding, re-render the collected items list.
        // This will remove items marked as 'addedToMR'.
        renderCollectedItems(
          historyCollectedItemsContainerEl,
          tempCollectedHistoryItems,
          addSelectedHistoryToMRBtnEl,
          "history"
        );
      }
    });
  }

  // --- B. Physical Exam Modal Logic ---
  // (Similar structure to Ask History: loadCategories, loadSkills, handleSkillSelection, renderMcqs, performExam)
  // Variables specific to exam modal are defined within this section or globally if shared.

  /** Loads exam skill categories (e.g., Cardiovascular, Respiratory) into the UI. */
  async function loadExamCategories() {
    showLoading(examCategoriesListEl);
    showPlaceholder(
      examSkillInteractionAreaEl,
      "Chọn một hệ cơ quan/nhóm kỹ năng."
    );
    renderCollectedItems(
      examCollectedItemsContainerEl,
      tempCollectedExamItems,
      addSelectedExamToMRBtnEl,
      "exam"
    );
    if (addSelectedExamToMRBtnEl) addSelectedExamToMRBtnEl.disabled = true;

    try {
      const categories = await fetchData(
        `${API_BASE_URL}/exam-skill-categories`
      ); // Note: common API, not case-specific path
      examCategoriesListEl.innerHTML = "";
      if (categories && categories.length > 0) {
        categories.forEach((cat) => {
          const btn = document.createElement("button");
          btn.className = "list-item-button";
          btn.textContent = cat.name;
          btn.dataset.categoryId = cat.id;
          btn.addEventListener("click", () => {
            if (currentSelectedExamCategoryBtn)
              currentSelectedExamCategoryBtn.classList.remove("active");
            btn.classList.add("active");
            currentSelectedExamCategoryBtn = btn;
            loadSkillsForCategory(cat.id);
          });
          examCategoriesListEl.appendChild(btn);
        });
      } else {
        showPlaceholder(
          examCategoriesListEl,
          "Không có danh mục kỹ năng khám."
        );
      }
    } catch (error) {
      showError(
        examCategoriesListEl,
        `Lỗi tải danh mục khám: ${error.message}`
      );
    }
  }

  /**
   * Loads specific examination skills for a selected category.
   * @param {string} categoryId - The ID of the skill category.
   */
  async function loadSkillsForCategory(categoryId) {
    showLoading(examSkillInteractionAreaEl);
    try {
      const skills = await fetchData(
        `${API_BASE_URL}/exam-skills/${categoryId}`
      ); // Common API
      examSkillInteractionAreaEl.innerHTML = "";
      if (skills && skills.length > 0) {
        skills.forEach((skill) => {
          const skillBtn = document.createElement("button");
          skillBtn.className = "list-item-button";
          skillBtn.textContent = skill.name;
          skillBtn.dataset.skillId = skill.id;
          // Check if this skill has already been performed and is in temp items
          const existingTempItem = tempCollectedExamItems.find(
            (it) => it.skill_id === skill.id && !it.addedToMR
          );
          if (existingTempItem) {
            skillBtn.classList.add("skill-performed-temp");
            skillBtn.title =
              "Kỹ năng này đã được thực hiện, kết quả đang ở cột thu thập.";
          }
          skillBtn.addEventListener("click", () => {
            skillBtn.disabled = true;
            skillBtn.classList.add("processing");
            handleSkillSelection(skill.id, skill.name, skill.has_mcqs).finally(
              () => {
                // Ensure button is re-enabled
                skillBtn.disabled = false;
                skillBtn.classList.remove("processing");
                skillBtn.classList.add("skill-performed-temp");
              }
            );
          });
          examSkillInteractionAreaEl.appendChild(skillBtn);
        });
      } else {
        showPlaceholder(
          examSkillInteractionAreaEl,
          "Không có kỹ năng nào cho mục này."
        );
      }
    } catch (error) {
      showError(
        examSkillInteractionAreaEl,
        `Lỗi tải kỹ năng khám: ${error.message}`
      );
    }
  }

  /**
   * Handles selection of an examination skill.
   * Fetches MCQs if required, or proceeds to perform the exam.
   * @param {string} skillId - The ID of the selected skill.
   * @param {string} skillName - The name of the skill.
   * @param {boolean} hasMcqs - Indicates if the skill has associated MCQs.
   */
  async function handleSkillSelection(skillId, skillName, hasMcqs) {
    logStudentAction(`Chọn khám kỹ năng: "${skillName}"`);
    currentSkillMcqs = []; // Reset
    // console.log("Handling Skill:", skillId, skillName, "Has MCQs:", hasMcqs);

    if (hasMcqs) {
      showLoading(
        examSkillInteractionAreaEl,
        `Đang tải MCQ cho "${skillName}"...`
      );
      try {
        const mcqs = await fetchData(
          `${API_BASE_URL}/exam-skill/${skillId}/mcqs`
        ); // Common API
        currentSkillMcqs = mcqs;
        renderMcqForSkill(skillId, skillName, mcqs);
      } catch (error) {
        showError(examSkillInteractionAreaEl, `Lỗi tải MCQ: ${error.message}`);
      }
    } else {
      examSkillInteractionAreaEl.innerHTML = `<p>Đang thực hiện khám "${skillName}"...</p>`;
      await performExam(skillId, skillName, null); // No MCQs, so mcqAnswers is null
    }
  }

  /**
   * Renders MCQ questions for a skill in the UI.
   * @param {string} skillId - The ID of the skill.
   * @param {string} skillName - The name of the skill.
   * @param {Array<object>} mcqs - Array of MCQ objects.
   */
  function renderMcqForSkill(skillId, skillName, mcqs) {
    if (!mcqs || mcqs.length === 0) {
      showPlaceholder(
        examSkillInteractionAreaEl,
        `Không có MCQ cho kỹ năng "${skillName}". Thực hiện khám trực tiếp.`
      );
      performExam(skillId, skillName, null);
      return;
    }
    examSkillInteractionAreaEl.innerHTML = `<h4>MCQ cho kỹ năng: ${skillName}</h4>`;
    const form = document.createElement("form");
    form.id = `mcqForm_${skillId}`;
    mcqs.forEach((mcq, index) => {
      /* ... (code render MCQ giống phiên bản trước) ... */
    }); // Giữ code render MCQ

    // --- Code render MCQ (giống phiên bản trước, rút gọn ở đây) ---
    mcqs.forEach((mcq, index) => {
      const mcqDiv = document.createElement("div");
      mcqDiv.className = "mcq-item-in-modal";
      mcqDiv.innerHTML = `<p class="mcq-question-text"><strong>Câu ${
        index + 1
      }:</strong> ${mcq.question}</p>`;
      const optionsDiv = document.createElement("div");
      optionsDiv.className = "mcq-options-in-modal";
      for (const key in mcq.options) {
        const label = document.createElement("label");
        label.innerHTML = `<input type="radio" name="mcq_${
          mcq.id
        }" value="${key}"> <span>${key.toUpperCase()}. ${
          mcq.options[key]
        }</span>`;
        optionsDiv.appendChild(label);
      }
      mcqDiv.appendChild(optionsDiv);
      form.appendChild(mcqDiv);
    });
    // --- Hết code render MCQ ---

    const submitMcqBtn = document.createElement("button");
    submitMcqBtn.type = "button";
    submitMcqBtn.className = "btn btn-primary btn-sm";
    submitMcqBtn.textContent = "Xác nhận trả lời & Khám";
    submitMcqBtn.addEventListener("click", async () => {
      const formData = new FormData(form);
      const mcqAnswers = {};
      currentSkillMcqs.forEach((mcq) => {
        // Dùng currentSkillMcqs để đảm bảo ID đúng
        const answer = formData.get(`mcq_${mcq.id}`);
        if (answer) mcqAnswers[mcq.id] = answer;
      });
      showLoading(
        examSkillInteractionAreaEl,
        `Đang xử lý MCQ và khám "${skillName}"...`
      );
      await performExam(skillId, skillName, mcqAnswers);
    });
    form.appendChild(submitMcqBtn);
    examSkillInteractionAreaEl.appendChild(form);
  }

  /**
   * Handles performing an examination skill, including MCQ validation.
   * @param {string} skillId - The ID of the skill.
   * @param {string} skillName - The name of the skill.
   * @param {object|null} mcqAnswers - Student's answers to MCQs, or null if no MCQs.
   */
  async function performExam(skillId, skillName, mcqAnswers) {
    try {
      const examData = await fetchData(
        `${API_BASE_URL}/${currentCaseId}/perform-exam/${skillId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mcqAnswers }),
        }
      );

      if (
        examData.mcq_feedback &&
        examData.mcq_feedback.some((f) => f.status !== "correct")
      ) {
        logStudentAction(`Trả lời MCQ cho "${skillName}" chưa chính xác.`);
        examSkillInteractionAreaEl.innerHTML = `<h4>MCQ cho kỹ năng: ${skillName} (Xem lại)</h4>
                                                  <p style="color:red;">Một số câu trả lời chưa đúng hoặc còn thiếu. Vui lòng xem lại.</p>`;
        renderMcqForSkill(skillId, skillName, currentSkillMcqs); // Re-render MCQs
        // Highlight incorrect answers (optional advanced feature)
        examData.mcq_feedback.forEach((fb) => {
          if (fb.status !== "correct") {
            const mcqItemDiv = examSkillInteractionAreaEl
              .querySelector(`input[name="mcq_${fb.mcq_id}"]`)
              ?.closest(".mcq-item-in-modal");
            if (mcqItemDiv) {
              const feedbackP =
                mcqItemDiv.querySelector(".mcq-feedback-text") ||
                document.createElement("p");
              feedbackP.className = "mcq-feedback-text";
              feedbackP.style.color = "red";
              feedbackP.style.fontSize = "0.9em";
              feedbackP.textContent = `* ${
                fb.message ||
                (fb.status === "incorrect" ? "Sai đáp án" : "Chưa trả lời")
              }`;
              if (!mcqItemDiv.querySelector(".mcq-feedback-text"))
                mcqItemDiv.appendChild(feedbackP);
            }
          }
        });
        return;
      }

      logStudentAction(
        `Khám "${skillName}". Kết quả: "${(
          examData.exam_result_text || ""
        ).substring(0, 70)}..."`
      );
      const existingItemIndex = tempCollectedExamItems.findIndex(
        (item) => item.skill_id === skillId && !item.addedToMR
      );
      if (existingItemIndex === -1) {
        tempCollectedExamItems.push({
          domId: `examItem_${Date.now()}_${Math.random()
            .toString(16)
            .slice(2)}`,
          skill_id: skillId,
          skill_name: skillName,
          text_result: examData.exam_result_text,
          field_target: examData.medical_record_field_target,
          selected: true,
          addedToMR: false,
        });
      } else {
        tempCollectedExamItems[existingItemIndex].text_result =
          examData.exam_result_text;
        tempCollectedExamItems[existingItemIndex].field_target =
          examData.medical_record_field_target;
        tempCollectedExamItems[existingItemIndex].selected = true; // Re-select if performed again
      }
      renderCollectedItems(
        examCollectedItemsContainerEl,
        tempCollectedExamItems,
        addSelectedExamToMRBtnEl,
        "exam"
      );
      if (currentSelectedExamCategoryBtn)
        loadSkillsForCategory(
          currentSelectedExamCategoryBtn.dataset.categoryId
        ); // Go back to skill list
    } catch (error) {
      logStudentAction(`Lỗi khi khám "${skillName}": ${error.message}`);
      showError(examSkillInteractionAreaEl, `Lỗi: ${error.message}`);
    }
  }
  // Attach event listener for "Add to Medical Record" button in Exam Modal
  if (addSelectedExamToMRBtnEl) {
    addSelectedExamToMRBtnEl.addEventListener("click", () => {
      if (handleAddItemsToMedicalRecord(tempCollectedExamItems, "exam")) {
        renderCollectedItems(
          examCollectedItemsContainerEl,
          tempCollectedExamItems,
          addSelectedExamToMRBtnEl,
          "exam"
        );
      }
    });
  }

  // --- C. Order Labs Modal Logic ---
  // (Similar structure: loadLabList, handleLabSelection)

  /** Loads the list of available labs, potentially filtered, into the UI. */
  async function loadLabList() {
    // Renamed from loadLabCategoriesAndAllLabs for clarity
    showLoading(labCategoriesListEl); // Using labCategoriesListEl to display the list of labs
    showPlaceholder(labResultDisplayAreaEl, "Chọn một CLS để xem kết quả.");
    renderCollectedItems(
      labCollectedItemsContainerEl,
      tempCollectedLabItems,
      addSelectedLabsToMRBtnEl,
      "lab"
    );
    if (addSelectedLabsToMRBtnEl) addSelectedLabsToMRBtnEl.disabled = true;

    try {
      allLabsFromBank = await fetchData(`${API_BASE_URL}/labs`); // Common API to get all labs
      renderFilteredLabList(allLabsFromBank); // Initial render of all labs
    } catch (error) {
      showError(labCategoriesListEl, `Lỗi tải danh sách CLS: ${error.message}`);
    }
  }

  /**
   * Renders a filtered list of labs based on search term.
   * @param {Array<object>} labsToRender - The array of lab objects to display.
   */
  function renderFilteredLabList(labsToRender) {
    labCategoriesListEl.innerHTML = ""; // Clear previous list
    if (labsToRender && labsToRender.length > 0) {
      labsToRender.forEach((lab) => {
        const labBtn = document.createElement("button");
        labBtn.className = "list-item-button";
        labBtn.textContent = lab.name;
        labBtn.dataset.labId = lab.id;
        const existingTempItem = tempCollectedLabItems.find(
          (it) => it.lab_id === lab.id && !it.addedToMR
        );
        if (existingTempItem) {
          labBtn.classList.add("lab-ordered-temp");
          labBtn.title =
            "CLS này đã được chỉ định, kết quả đang ở cột thu thập.";
        }
        labBtn.addEventListener("click", () => {
          labBtn.disabled = true;
          labBtn.classList.add("processing");
          handleLabSelection(lab.id, lab.name).finally(() => {
            labBtn.disabled = false;
            labBtn.classList.remove("processing");
            labBtn.classList.add("lab-ordered-temp");
          });
        });
        labCategoriesListEl.appendChild(labBtn);
      });
    } else {
      showPlaceholder(labCategoriesListEl, "Không tìm thấy CLS nào khớp.");
    }
  }
  // Event listener for lab search input
  if (searchLabInputEl) {
    searchLabInputEl.addEventListener("input", () => {
      const searchTerm = searchLabInputEl.value.toLowerCase().trim();
      const filteredLabs = searchTerm
        ? allLabsFromBank.filter((lab) =>
            lab.name.toLowerCase().includes(searchTerm)
          )
        : allLabsFromBank; // Show all if search is empty
      renderFilteredLabList(filteredLabs);
    });
  }

  /**
   * Handles selection of a lab test. Fetches and displays its result for the current case.
   * @param {string} labId - The ID of the selected lab.
   * @param {string} labName - The name of the lab (for logging).
   */
  async function handleLabSelection(labId, labName) {
    logStudentAction(`Chỉ định CLS: "${labName}"`);
    showLoading(labResultDisplayAreaEl, `Đang lấy kết quả cho "${labName}"...`);
    try {
      const labResultData = await fetchData(
        `${API_BASE_URL}/${currentCaseId}/order-lab`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ labId }),
        }
      );

      labResultDisplayAreaEl.innerHTML = `<h4>Kết quả cho: ${
        labResultData.lab_name || labName
      }</h4>
                                            <p>${
                                              labResultData.result_text || "N/A"
                                            }</p>
                                            ${
                                              labResultData.image_url
                                                ? `<img src="${
                                                    labResultData.image_url
                                                  }" alt="Hình ảnh ${
                                                    labResultData.lab_name ||
                                                    labName
                                                  }" class="lab-result-image">`
                                                : ""
                                            }
                                            ${
                                              labResultData.interpretation_notes
                                                ? `<p><em>Diễn giải: ${labResultData.interpretation_notes}</em></p>`
                                                : ""
                                            }`;

      const existingItemIndex = tempCollectedLabItems.findIndex(
        (item) => item.lab_id === labId && !item.addedToMR
      );
      if (existingItemIndex === -1) {
        tempCollectedLabItems.push({
          domId: `labItem_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          lab_id: labId,
          lab_name: labResultData.lab_name || labName,
          text_result: labResultData.result_text,
          image_url: labResultData.image_url,
          field_target: labResultData.medical_record_field_target,
          selected: true,
          addedToMR: false,
        });
      } else {
        tempCollectedLabItems[existingItemIndex].text_result =
          labResultData.result_text;
        tempCollectedLabItems[existingItemIndex].image_url =
          labResultData.image_url;
        tempCollectedLabItems[existingItemIndex].field_target =
          labResultData.medical_record_field_target;
        tempCollectedLabItems[existingItemIndex].selected = true;
      }
      renderCollectedItems(
        labCollectedItemsContainerEl,
        tempCollectedLabItems,
        addSelectedLabsToMRBtnEl,
        "lab"
      );
    } catch (error) {
      logStudentAction(
        `Lỗi khi lấy kết quả CLS "${labName}": ${error.message}`
      );
      showError(labResultDisplayAreaEl, `Lỗi: ${error.message}`);
    }
  }
  // Attach event listener for "Add to Medical Record" button in Labs Modal
  if (addSelectedLabsToMRBtnEl) {
    addSelectedLabsToMRBtnEl.addEventListener("click", () => {
      if (handleAddItemsToMedicalRecord(tempCollectedLabItems, "lab")) {
        renderCollectedItems(
          labCollectedItemsContainerEl,
          tempCollectedLabItems,
          addSelectedLabsToMRBtnEl,
          "lab"
        );
      }
    });
  }
  /**
   * Populates the tag list in the Clinical Reasoning Canvas modal.
   * @param {Array<object>} tags - Array of tag objects received from the backend.
   *        Each tag object should have at least: id, text, color, type.
   */
  function populateCanvasTagList(tags) {
    if (!canvasAvailableTagsListEl) {
      // Sử dụng biến đã khai báo
      console.error(
        "LỖI NGHIÊM TRỌNG: canvasAvailableTagsListEl là null/undefined khi gọi populateCanvasTagList!"
      );
      return;
    }
    canvasAvailableTagsListEl.innerHTML = ""; // Clear existing tags or placeholder

    canvasAvailableTagsListEl.innerHTML = ""; // Clear existing tags or placeholder

    if (!tags || tags.length === 0) {
      canvasAvailableTagsListEl.innerHTML =
        '<li class="canvas-tag-placeholder">Không có tags nào được trích xuất.</li>';
      return;
    }

    tags.forEach((tag) => {
      const li = document.createElement("li");
      li.textContent = tag.text || "Tag không có nội dung";
      li.style.backgroundColor = tag.color || "#E0E0E0"; // Màu nền từ tag hoặc mặc định
      li.style.color = isColorDark(tag.color || "#E0E0E0") ? "#fff" : "#333"; // Chọn màu chữ tương phản
      li.draggable = true; // Cho phép kéo thả
      li.id =
        tag.id || `tag_${Date.now()}_${Math.random().toString(16).slice(2)}`; // Đảm bảo có ID
      li.dataset.tagType = tag.type || "default"; // Lưu loại tag
      li.dataset.sourceField = tag.source_field || ""; // Lưu trường gốc (nếu có)

      // Event listener cho kéo thả (cần cho logic Canvas sau này)
      li.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", e.target.id); // Truyền ID của tag được kéo
        e.dataTransfer.setData("application/json", JSON.stringify(tag)); // Truyền toàn bộ dữ liệu tag
        e.dataTransfer.effectAllowed = "move";
        // console.log('Dragging tag:', tag.id); // Debug kéo
      });

      canvasAvailableTagsListEl.appendChild(li);
    });
  }

  /**
   * Helper function to determine if a hex color is dark or light.
   * Used to set contrasting text color (white or black).
   * @param {string} hexColor - The hex color string (e.g., "#FFD700").
   * @returns {boolean} True if the color is considered dark, false otherwise.
   */
  function isColorDark(hexColor) {
    if (!hexColor || hexColor.length < 4) return false; // Handle invalid input
    hexColor = hexColor.toUpperCase().replace("#", "");
    if (hexColor.length === 3) {
      hexColor = hexColor
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (hexColor.length !== 6) return false;

    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    // Formula for perceived brightness (adjust threshold if needed)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128; // Threshold for dark colors
  }

  // =======================================================================
  // VI. CLINICAL REASONING CANVAS LOGIC
  // =======================================================================
  /**
   * Populates the tag list in the Clinical Reasoning Canvas modal (LEFT PANEL).
   * @param {Array<object>} tags - Array of tag objects received from the backend.
   */
  function populateCanvasTagList(tags) {
    if (!canvasAvailableTagsListEl) {
      console.error(
        "Canvas tag list element (canvasAvailableTagsListEl) is not found!"
      );
      return; // Thoát nếu không tìm thấy element
    }

    canvasAvailableTagsListEl.innerHTML = ""; // Clear existing

    if (!tags || tags.length === 0) {
      canvasAvailableTagsListEl.innerHTML =
        '<li class="canvas-tag-placeholder">Không có tags nào được trích xuất.</li>';
      return;
    }

    tags.forEach((tag) => {
      const li = document.createElement("li");
      li.textContent = tag.text || "Tag không có nội dung";
      li.style.backgroundColor = tag.color || "#E0E0E0";
      li.style.color = isColorDark(tag.color || "#E0E0E0") ? "#fff" : "#333";
      li.draggable = true;
      li.id =
        tag.id || `tag_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      li.dataset.tagType = tag.type || "default";
      li.dataset.sourceField = tag.source_field || "";

      li.addEventListener("dragstart", (e) => {
        try {
          const tagDataString = JSON.stringify(tag); // Đảm bảo tag là object hợp lệ
          e.dataTransfer.setData("text/plain", e.target.id);
          e.dataTransfer.setData("application/json", tagDataString);
          e.dataTransfer.effectAllowed = "move";
        } catch (jsonError) {
          console.error(
            "Error stringifying tag data for dragstart:",
            jsonError,
            tag
          );
          e.preventDefault(); // Ngăn kéo thả nếu dữ liệu lỗi
        }
      });
      canvasAvailableTagsListEl.appendChild(li);
    });
  }
  // --- A. State Management ---
  function getNextBlockId() {
    return `block_${nextBlockIdCounter++}`;
  }
  function getNextConnectionId() {
    return `conn_${nextConnectionIdCounter++}`;
  }

  function addBlockToState(type, x, y, title, content = null) {
    const newId = getNextBlockId();
    canvasState.blocks[newId] = {
      id: newId,
      type,
      x,
      y,
      title,
      // Khởi tạo content: mảng rỗng cho info, object {suggestion:'', result:''} cho investigation, string rỗng cho còn lại
      content:
        content !== null
          ? content
          : type === "info"
          ? []
          : type === "investigation"
          ? { suggestion: "", result: "" }
          : "",
    };
    console.log("Added block to state:", canvasState.blocks[newId]);
    return canvasState.blocks[newId];
  }

  function updateBlockPositionInState(blockId, x, y) {
    if (canvasState.blocks[blockId]) {
      canvasState.blocks[blockId].x = x;
      canvasState.blocks[blockId].y = y;
      renderAllConnections(); // Re-render connections when block moves
    }
  }

  function updateBlockContentInState(blockId, content) {
    if (canvasState.blocks[blockId]) {
      canvasState.blocks[blockId].content = content;
      // No need to re-render the whole canvas, just the block content
      const blockEl = document.getElementById(blockId);
      if (blockEl) renderBlockContent(blockEl, canvasState.blocks[blockId]);
    }
  }

  function addConnectionToState(fromId, toId) {
    const newId = getNextConnectionId();
    if (canvasState.blocks[fromId] && canvasState.blocks[toId]) {
      canvasState.connections[newId] = {
        id: newId,
        from: fromId,
        to: toId,
        note: "",
      };
      console.log("Added connection to state:", canvasState.connections[newId]);
      return canvasState.connections[newId];
    }
    return null;
  }

  function updateConnectionNoteInState(connId, note) {
    if (canvasState.connections[connId]) {
      canvasState.connections[connId].note = note;
      // TODO: Update visual representation of note if displayed directly on arrow
    }
  }

  function removeBlockFromState(blockId) {
    if (canvasState.blocks[blockId]) {
      delete canvasState.blocks[blockId];
      // Remove connections associated with this block
      Object.keys(canvasState.connections).forEach((connId) => {
        if (
          canvasState.connections[connId].from === blockId ||
          canvasState.connections[connId].to === blockId
        ) {
          removeConnectionFromState(connId);
        }
      });
    }
  }

  function removeConnectionFromState(connId) {
    if (canvasState.connections[connId]) {
      // Remove visual representation first
      const lineEl = canvasSvgLayerEl.querySelector(
        `[data-conn-id="${connId}"]`
      );
      if (lineEl) lineEl.remove();
      const noteEl = document.getElementById(`note_${connId}`); // If notes are separate divs
      if (noteEl) noteEl.remove();

      delete canvasState.connections[connId];
    }
  }

  // --- B. Rendering Blocks and Connections ---

  /** Renders or updates the content area of a block based on its data */
  function renderBlockContent(blockElement, blockData) {
    const contentDiv = blockElement.querySelector(".block-content");
    if (!contentDiv) return;

    contentDiv.innerHTML = ""; // Clear previous content

    // XỬ LÝ CHUNG CHO INFO BLOCK VÀ INVESTIGATION BLOCK (HIỂN THỊ TAGS)
    if (blockData.type === "info" || blockData.type === "investigation") {
      if (
        blockData.content &&
        Array.isArray(blockData.content) &&
        blockData.content.length > 0
      ) {
        blockData.content.forEach((tagData) => {
          // Giả định content là mảng các object tag đầy đủ
          if (tagData && tagData.text) {
            // Kiểm tra tagData có hợp lệ không
            const tagSpan = document.createElement("span");
            tagSpan.className = "tag-in-block"; // Dùng chung class style
            tagSpan.textContent = tagData.text;
            tagSpan.style.backgroundColor =
              tagData.color ||
              (blockData.type === "investigation" ? "#ADD8E6" : "#E0E0E0"); // Màu CLS cho investigation
            tagSpan.style.color = isColorDark(tagSpan.style.backgroundColor)
              ? "#fff"
              : "#333";
            tagSpan.title = tagData.text;
            contentDiv.appendChild(tagSpan);
          } else {
            console.warn(
              "Invalid tag data in block content:",
              tagData,
              "Block:",
              blockData.id
            );
          }
        });
      } else {
        contentDiv.innerHTML = `<i>Chưa có ${
          blockData.type === "info" ? "tags" : "kết quả CLS"
        }...</i>`;
      }

      // Nút "Thêm/Sửa" cho cả Info và Investigation block
      let editBtn = blockElement.querySelector(".edit-content-btn"); // Đổi tên class cho nhất quán
      if (!editBtn) {
        editBtn = document.createElement("button");
        editBtn.innerHTML =
          blockData.type === "info"
            ? '<i class="fas fa-tags"></i>'
            : '<i class="fas fa-vial"></i>';
        editBtn.className = "btn btn-xs btn-light edit-content-btn"; // Class chung
        editBtn.title =
          blockData.type === "info" ? "Thêm/Sửa Tags" : "Thêm/Sửa Kết quả CLS";
        editBtn.style.position = "absolute";
        editBtn.style.top = "5px";
        editBtn.style.right = "5px";
        editBtn.onclick = (e) => {
          e.stopPropagation();
          if (blockData.type === "info") {
            openSelectTagsPopup(blockData.id, "general"); // 'general' để lấy từ currentExtractedTags
          } else if (blockData.type === "investigation") {
            openSelectTagsPopup(blockData.id, "lab_results"); // 'lab_results' để lấy từ kết quả CLS
          }
        };
        // Chèn vào header thay vì blockElement để tránh bị contentDiv.innerHTML = "" xóa mất
        const headerDiv = blockElement.querySelector(".block-header");
        if (headerDiv) headerDiv.appendChild(editBtn);
        // Hoặc tạo một div riêng cho các nút trên header
        else blockElement.appendChild(editBtn);
      }
    } else {
      // Cho DDx, DiffDx (vẫn dùng textarea)
      const textarea = document.createElement("textarea");
      textarea.rows = blockData.type === "diff-diag" ? 3 : 2;
      textarea.placeholder = `Nhập ${blockData.title}...`;
      textarea.value = blockData.content || "";
      textarea.oninput = (e) => {
        updateBlockContentInState(blockData.id, e.target.value);
      };
      textarea.onclick = (e) => e.stopPropagation();
      textarea.onmousedown = (e) => e.stopPropagation();
      contentDiv.appendChild(textarea);
    }
  }
  /** Creates or updates the DOM element for a single block */
  function renderBlock(blockData) {
    let blockEl = document.getElementById(blockData.id);
    const isNew = !blockEl;

    if (isNew) {
      blockEl = document.createElement("div");
      blockEl.id = blockData.id;
      blockEl.innerHTML = `<div class="block-header">${blockData.title}</div><div class="block-content"></div>`;
      actualCanvasAreaEl.appendChild(blockEl);
      // Add click listener ONLY when creating the block
      blockEl.addEventListener("click", (e) => {
        e.stopPropagation();
        handleBlockClick(blockEl, e); // Open context menu or specific action
      });
    }

    // Update common properties
    blockEl.className = `canvas-block ${blockData.type}-block`; // Set base and type class
    blockEl.style.left = `${blockData.x}px`;
    blockEl.style.top = `${blockData.y}px`;
    blockEl.querySelector(".block-header").textContent = blockData.title; // Update title if changed

    // Add/remove 'selected' class
    if (selectedCanvasObjectId === blockData.id) {
      blockEl.classList.add("selected");
    } else {
      blockEl.classList.remove("selected");
    }

    // --- Draggability ---
    // Only make non-Info blocks draggable
    if (blockData.type !== "info") {
      // Check if draggable functionality is already attached to avoid duplicates
      if (!blockEl.dataset.draggableAttached) {
        makeBlockDraggable(
          blockEl,
          blockEl.querySelector(".block-header") || blockEl
        ); // Drag by header or whole block
        blockEl.dataset.draggableAttached = "true";
      }
    } else {
      blockEl.style.cursor = "pointer"; // Change cursor for non-draggable info blocks
    }

    // Update content (tags or textarea)
    renderBlockContent(blockEl, blockData);

    return blockEl; // Return the element
  }
  /** Renders all blocks based on the current canvasState */
  function renderAllBlocks() {
    const currentBlockIds = Object.keys(canvasState.blocks);
    // Render or update blocks in the state
    currentBlockIds.forEach((blockId) =>
      renderBlock(canvasState.blocks[blockId])
    );

    // Remove any block elements from DOM that are no longer in the state
    actualCanvasAreaEl.querySelectorAll(".canvas-block").forEach((el) => {
      if (!canvasState.blocks[el.id]) {
        el.remove();
      }
    });
  }

  /** Renders a single connection (arrow) using SVG - MVP: Straight Line */
  function renderConnection(connData) {
    // Check if SVG layer exists, if not, maybe skip rendering connections
    if (!canvasSvgLayerEl) {
      console.warn(
        "SVG Layer for connections not found. Cannot render arrows."
      );
      return;
    }

    const fromBlock = canvasState.blocks[connData.from];
    const toBlock = canvasState.blocks[connData.to];
    if (!fromBlock || !toBlock) {
      console.warn(
        `Cannot render connection ${connData.id}: source or target block missing.`
      );
      return;
    }

    const lineId = `line_${connData.id}`;
    let lineEl = canvasSvgLayerEl.querySelector(`#${lineId}`);

    const fromEl = document.getElementById(fromBlock.id);
    const toEl = document.getElementById(toBlock.id);
    if (!fromEl || !toEl) {
      console.warn(
        `Cannot render connection ${connData.id}: source or target DOM element missing.`
      );
      return; // Blocks not rendered yet
    }

    // Calculate center points (relative to the canvas area)
    const fromCenterX = fromEl.offsetLeft + fromEl.offsetWidth / 2;
    const fromCenterY = fromEl.offsetTop + fromEl.offsetHeight / 2;
    const toCenterX = toEl.offsetLeft + toEl.offsetWidth / 2;
    const toCenterY = toEl.offsetTop + toEl.offsetHeight / 2;

    if (!lineEl) {
      lineEl = document.createElementNS("http://www.w3.org/2000/svg", "line");
      lineEl.setAttribute("id", lineId);
      lineEl.setAttribute("data-conn-id", connData.id);
      lineEl.setAttribute("stroke", "#555");
      lineEl.setAttribute("stroke-width", "2");
      lineEl.setAttribute("marker-end", "url(#arrowhead)");
      lineEl.style.pointerEvents = "stroke"; // Allow clicks only on the line itself
      lineEl.style.cursor = "pointer";
      lineEl.onclick = (e) => {
        e.stopPropagation();
        selectCanvasObject(connData.id); // Select the connection
        openEditArrowNotePopup(connData.id);
      };
      canvasSvgLayerEl.appendChild(lineEl);
    }

    // Update line coordinates
    lineEl.setAttribute("x1", fromCenterX);
    lineEl.setAttribute("y1", fromCenterY);
    lineEl.setAttribute("x2", toCenterX);
    lineEl.setAttribute("y2", toCenterY);

    // Add/Update/Remove Note Label
    const noteId = `note_${connData.id}`;
    let noteEl = document.getElementById(noteId);
    if (connData.note && connData.note.trim() !== "") {
      if (!noteEl) {
        noteEl = document.createElement("div");
        noteEl.id = noteId;
        noteEl.className = "canvas-arrow-note"; // Add CSS for styling
        noteEl.style.position = "absolute";
        noteEl.style.zIndex = "6";
        noteEl.style.cursor = "pointer";
        noteEl.onclick = (e) => {
          e.stopPropagation();
          selectCanvasObject(connData.id);
          openEditArrowNotePopup(connData.id);
        };
        actualCanvasAreaEl.appendChild(noteEl); // Append note to main canvas area
      }
      noteEl.textContent = connData.note;
      // Position the note near the midpoint
      const midX = (fromCenterX + toCenterX) / 2;
      const midY = (fromCenterY + toCenterY) / 2;
      noteEl.style.left = `${midX}px`;
      noteEl.style.top = `${midY}px`;
      noteEl.style.transform = "translate(-50%, -120%)"; // Adjust position
    } else if (noteEl) {
      noteEl.remove(); // Remove note element if the note is empty
    }

    // Add/remove 'selected' class for the line
    if (lineEl) {
      if (selectedCanvasObjectId === connData.id) {
        lineEl.classList.add("selected"); // Need CSS for .selected line
      } else {
        lineEl.classList.remove("selected");
      }
    }
  }
  /** Renders all connections based on the current canvasState */
  function renderAllConnections() {
    if (!canvasSvgLayerEl) return; // Don't proceed if no SVG layer

    const currentConnIds = Object.keys(canvasState.connections);
    // Remove lines/notes from DOM that are no longer in state
    canvasSvgLayerEl.querySelectorAll("line[data-conn-id]").forEach((line) => {
      if (!canvasState.connections[line.dataset.connId]) {
        line.remove();
      }
    });
    actualCanvasAreaEl
      .querySelectorAll(".canvas-arrow-note")
      .forEach((note) => {
        const connId = note.id.replace("note_", "");
        if (
          !canvasState.connections[connId] ||
          !canvasState.connections[connId].note
        ) {
          note.remove();
        }
      });

    // Render or update connections in the state
    currentConnIds.forEach((connId) =>
      renderConnection(canvasState.connections[connId])
    );
  }

  // =======================================================================
  // C. BLOCK INTERACTION & CONTEXT MENU
  // =======================================================================

  /**
   * Handles click events on a canvas block.
   * Selects the block and shows its context menu.
   * @param {HTMLElement} blockElement - The DOM element of the clicked block.
   * @param {MouseEvent} event - The click event.
   */
  function handleBlockClick(blockElement, event) {
    // Prevent context menu if clicking on an interactive element inside the block itself
    // (e.g., textarea, input, or a button that is NOT the block itself)
    if (event.target.closest("textarea, input, button:not(.canvas-block)")) {
      // If the click was on an internal button (like "Edit Tags"), let that button's handler work.
      // If it was on a textarea/input, we just want to focus it, not open a context menu.
      if (
        event.target.tagName === "TEXTAREA" ||
        event.target.tagName === "INPUT"
      ) {
        event.target.focus(); // Ensure focus for text input
      }
      return; // Don't open context menu for these internal interactions
    }

    selectCanvasObject(blockElement.id); // Select the clicked block
    showBlockContextMenu(blockElement, event.clientX, event.clientY); // Show context menu at click position
  }

  /**
   * Displays the context menu for a given block at specified screen coordinates.
   * @param {HTMLElement} blockElement - The block element for which to show the menu.
   * @param {number} x - The clientX coordinate of the click.
   * @param {number} y - The clientY coordinate of the click.
   */
  function showBlockContextMenu(blockElement, x, y) {
    hideBlockContextMenu(); // Close any existing menu first

    activeContextMenuBlockId = blockElement.id;
    const blockData = canvasState.blocks[activeContextMenuBlockId];

    if (!blockData) {
      console.error(
        "Cannot show context menu: Block data not found for ID",
        activeContextMenuBlockId
      );
      return;
    }

    blockContextMenuEl = document.createElement("div");
    blockContextMenuEl.id = "blockContextMenu";
    blockContextMenuEl.className = "canvas-context-menu";

    // Define available actions based on the type of the block
    const actions = [];
    if (blockData.type === "info") {
      actions.push({
        label: "Thêm/Sửa Tags",
        action: "edit-tags",
        icon: "fas fa-tags",
      });
      actions.push({
        label: "Tạo Chẩn đoán Sơ bộ",
        action: "create-ddx",
        icon: "fas fa-lightbulb",
      });
      actions.push({
        label: "Tạo Xét nghiệm Đề xuất",
        action: "create-lab",
        icon: "fas fa-flask",
      });
      // Info blocks (ở cột trái) thường không bị xóa trực tiếp từ context menu, mà có thể từ toolbar chung.
    } else if (blockData.type === "ddx") {
      actions.push({
        label: "Chỉnh sửa Nội dung",
        action: "edit-content",
        icon: "fas fa-edit",
      });
      actions.push({
        label: "Tạo Xét nghiệm Đề xuất",
        action: "create-lab",
        icon: "fas fa-flask",
      });
      actions.push({
        label: "Tạo Chẩn đoán Phân biệt",
        action: "create-diffdx",
        icon: "fas fa-balance-scale",
      });
      actions.push({
        label: "Xóa Khối",
        action: "delete-block",
        icon: "fas fa-trash-alt",
      });
    } else if (blockData.type === "investigation") {
      actions.push({
        label: "Chỉnh sửa Đề xuất CLS",
        action: "edit-content",
        icon: "fas fa-edit",
      }); // Edits 'suggestion' field
      actions.push({
        label: "Tạo Chẩn đoán (từ KQ)",
        action: "create-ddx",
        icon: "fas fa-lightbulb",
      });
      actions.push({
        label: "Xóa Khối",
        action: "delete-block",
        icon: "fas fa-trash-alt",
      });
    } else if (blockData.type === "diff-diag") {
      actions.push({
        label: "Chỉnh sửa Nội dung",
        action: "edit-content",
        icon: "fas fa-edit",
      });
      actions.push({
        label: "Xóa Khối",
        action: "delete-block",
        icon: "fas fa-trash-alt",
      });
    }

    if (actions.length === 0) {
      activeContextMenuBlockId = null; // No actions, so no menu to keep track of
      return; // Don't show an empty menu
    }

    actions.forEach((item) => {
      const btn = document.createElement("button");
      btn.innerHTML = `<i class="${item.icon || "fas fa-caret-right"}"></i> ${
        item.label
      }`; // Add icon
      btn.onclick = (e) => {
        e.stopPropagation(); // Important: Prevent this click from being caught by handleClickOutsideContextMenu
        handleContextMenuAction(item.action, activeContextMenuBlockId);
      };
      blockContextMenuEl.appendChild(btn);
    });

    document.body.appendChild(blockContextMenuEl); // Append to body for proper layering

    // Position the menu carefully
    const menuRect = blockContextMenuEl.getBoundingClientRect();
    const bodyWidth = document.body.clientWidth;
    const bodyHeight = document.body.clientHeight;

    let menuX = x + 5; // Default to right of cursor
    let menuY = y + 5; // Default to below cursor

    // Adjust if it goes off-screen
    if (x + menuRect.width + 5 > bodyWidth) {
      menuX = x - menuRect.width - 5; // Move to the left of cursor
    }
    if (y + menuRect.height + 5 > bodyHeight) {
      menuY = y - menuRect.height - 5; // Move above cursor
    }
    // Ensure it doesn't go off-screen at the top/left edges
    menuX = Math.max(5, menuX);
    menuY = Math.max(5, menuY);

    blockContextMenuEl.style.left = `${menuX}px`;
    blockContextMenuEl.style.top = `${menuY}px`;
    blockContextMenuEl.style.display = "flex"; // Use flex for column layout of buttons

    // Add a one-time event listener to the document to close the menu when clicking outside
    // Use a timeout to ensure this listener is added after the current click event bubble phase is complete
    setTimeout(() => {
      document.addEventListener("click", handleClickOutsideContextMenu, {
        capture: true,
        once: true,
      });
    }, 0);
  }

  /**
   * Hides the currently visible block context menu and cleans up associated state.
   */
  function hideBlockContextMenu() {
    if (blockContextMenuEl) {
      blockContextMenuEl.remove(); // Remove the menu element from the DOM
      blockContextMenuEl = null; // Clear the global reference
    }
    activeContextMenuBlockId = null; // Clear which block's menu was active
    // Explicitly remove the listener if it might not have been 'once: true' or if added multiple times
    document.removeEventListener("click", handleClickOutsideContextMenu, {
      capture: true,
    });
    // console.log("Context menu hidden.");
  }

  /**
   * Event handler for clicks on the document.
   * If a context menu is open and the click is outside of it, the menu is closed.
   * This listener is added with `once: true` by `showBlockContextMenu`.
   * @param {MouseEvent} event - The click event.
   */
  function handleClickOutsideContextMenu(event) {
    // If a context menu exists and the click target is NOT the menu itself or any of its children
    if (blockContextMenuEl && !blockContextMenuEl.contains(event.target)) {
      // console.log("Clicked outside context menu. Hiding.", event.target);
      hideBlockContextMenu();
    }
    // If the click was inside the menu, the button's own click handler (which calls hideBlockContextMenu)
    // should have already handled it. The `once: true` ensures this listener is removed anyway.
  }

  /**
   * Handles the execution of an action selected from the context menu.
   * @param {string} action - The action to perform (e.g., "edit-tags", "create-ddx").
   * @param {string} sourceBlockId - The ID of the block that the context menu was opened for.
   */
  function handleContextMenuAction(action, sourceBlockId) {
    hideBlockContextMenu(); // Always hide the menu after an action is chosen

    const sourceBlockData = canvasState.blocks[sourceBlockId];
    if (!sourceBlockData) {
      console.error(
        "Source block data not found for action:",
        action,
        "on block ID:",
        sourceBlockId
      );
      return;
    }

    logStudentAction(
      `Context Menu: Action "${action}" on block "${
        sourceBlockData.title || sourceBlockId
      }"`
    );

    switch (action) {
      case "edit-tags":
        if (sourceBlockData.type === "info") {
          openSelectTagsPopup(sourceBlockId);
        } else {
          console.warn("Edit tags action is only for Info blocks.");
        }
        break;
      case "edit-content":
        // For investigation block, edit the suggestion field
        const currentContentForEdit =
          sourceBlockData.type === "investigation"
            ? sourceBlockData.content?.suggestion
            : sourceBlockData.content;
        openEditTextPopup(
          sourceBlockId,
          currentContentForEdit,
          sourceBlockData.type === "investigation" ? "suggestion" : null
        );
        break;
      case "create-ddx":
      case "create-lab":
      case "create-diffdx":
        const blockTypeMap = {
          "create-ddx": "ddx",
          "create-lab": "investigation",
          "create-diffdx": "diff-diag",
        };
        const blockTitleMap = {
          "create-ddx": "Chẩn đoán Sơ bộ",
          "create-lab": "Xét nghiệm Đề xuất",
          "create-diffdx": "Chẩn đoán Phân biệt",
        };
        createAndConnectNewBlock(
          sourceBlockId,
          blockTypeMap[action],
          blockTitleMap[action]
        );
        break;
      case "edit-lab-results": // Hoặc một tên action khác
        if (sourceBlockData.type === "investigation") {
          openSelectTagsPopup(sourceBlockId, "lab_results");
        }
        break;
      case "delete-block":
        if (sourceBlockData.type === "info") {
          // Prevent deleting Info blocks this way
          alert(
            "Không thể xóa Khối Thông Tin từ menu này. Sử dụng Toolbar nếu cần xóa hết."
          );
          return;
        }
        if (
          confirm(
            `Bạn có chắc muốn xóa khối "${
              sourceBlockData.title || sourceBlockId
            }"?`
          )
        ) {
          removeBlockFromState(sourceBlockId); // Logic to remove from state and associated connections
          const blockEl = document.getElementById(sourceBlockId);
          if (blockEl) blockEl.remove(); // Remove DOM element
          renderAllConnections(); // Update visual connections
          logStudentAction(
            `Xóa khối: ${sourceBlockData.title || sourceBlockId}`
          );
          if (selectedCanvasObjectId === sourceBlockId)
            selectedCanvasObjectId = null; // Deselect
        }
        break;
      default:
        console.warn("Unknown context menu action:", action);
    }
  }

  /**
   * Creates a new block on the canvas and a connection (arrow) to it from a source block.
   * @param {string} sourceBlockId - The ID of the block from which the connection originates.
   * @param {string} newBlockType - The type of the new block to create (e.g., "ddx", "investigation").
   * @param {string} newBlockTitle - The title for the new block.
   */
  function createAndConnectNewBlock(
    sourceBlockId,
    newBlockType,
    newBlockTitle
  ) {
    const sourceBlockData = canvasState.blocks[sourceBlockId];
    if (!sourceBlockData) {
      console.error(
        "Cannot create connected block: Source block not found.",
        sourceBlockId
      );
      return;
    }

    const sourceEl = document.getElementById(sourceBlockId);
    if (!sourceEl) {
      console.error(
        "Cannot create connected block: Source DOM element not found.",
        sourceBlockId
      );
      return;
    }

    // Calculate default position for the new block
    let newX, newY;
    const sourceRect = sourceEl.getBoundingClientRect(); // Use this for width/height if available
    const sourceCanvasX =
      parseInt(sourceEl.style.left, 10) || sourceBlockData.x; // Use style if set, else state
    const sourceCanvasY = parseInt(sourceEl.style.top, 10) || sourceBlockData.y;
    const sourceWidth = sourceEl.offsetWidth || 150; // Fallback width
    const sourceHeight = sourceEl.offsetHeight || 80; // Fallback height

    // Default placement to the right for Info blocks, below for others
    if (sourceBlockData.type === "info") {
      newX = sourceCanvasX + sourceWidth + 60; // 60px gap
      newY = sourceCanvasY;
    } else {
      newX = sourceCanvasX;
      newY = sourceCanvasY + sourceHeight + 40; // 40px gap below
    }

    // Basic boundary check to keep new blocks roughly within the initial view (can be improved)
    const canvasAreaWidth = actualCanvasAreaEl.clientWidth;
    if (newX + 150 > canvasAreaWidth)
      newX = Math.max(10, canvasAreaWidth - 160);
    newX = Math.max(10, newX); // Min X boundary
    newY = Math.max(10, newY); // Min Y boundary

    // Add the new block to the state
    const newBlockData = addBlockToState(
      newBlockType,
      newX,
      newY,
      newBlockTitle
    );
    if (!newBlockData) return;

    // Add the connection to the state
    const newConnectionData = addConnectionToState(
      sourceBlockId,
      newBlockData.id
    );

    // Render the new block and connection
    renderBlock(newBlockData);
    if (newConnectionData) {
      renderConnection(newConnectionData);
    }

    logStudentAction(
      `Tạo "${newBlockTitle}" và nối từ "${
        sourceBlockData.title || sourceBlockId
      }".`
    );
  }

  // =======================================================================
  // D. POPUPS FOR TAG SELECTION, TEXT EDIT, ARROW NOTE EDIT
  // =======================================================================
  // ... (openSelectTagsPopup, openEditTextPopup, openEditArrowNotePopup, hidePopups - GIỮ NGUYÊN từ phiên bản trước) ...
  // Đảm bảo hàm openEditTextPopup xử lý được fieldToUpdate='suggestion' cho Khối Investigation

  // =======================================================================
  // E. GENERAL CANVAS ACTIONS IMPLEMENTATION
  // =======================================================================
  // ... (deleteSelectedCanvasObject, clearCanvas, selectCanvasObject - GIỮ NGUYÊN từ phiên bản trước) ...
  // Sửa deleteSelectedCanvasObject để nó gọi removeBlockFromState và removeConnectionFromState
  function deleteSelectedCanvasObject() {
    if (!selectedCanvasObjectId) {
      alert("Vui lòng chọn một đối tượng trên canvas để xóa.");
      return;
    }

    const isBlock = !!canvasState.blocks[selectedCanvasObjectId];
    const objectData = isBlock
      ? canvasState.blocks[selectedCanvasObjectId]
      : canvasState.connections[selectedCanvasObjectId];

    const name = objectData
      ? isBlock
        ? objectData.title || selectedCanvasObjectId
        : `Mũi tên ${selectedCanvasObjectId}`
      : selectedCanvasObjectId;

    if (
      isBlock &&
      canvasState.blocks[selectedCanvasObjectId]?.type === "info"
    ) {
      alert(
        "Không thể xóa Khối Thông Tin chính. Sử dụng 'Clear All' nếu muốn xóa toàn bộ."
      );
      return;
    }

    if (confirm(`Bạn có chắc muốn xóa "${name}"?`)) {
      if (isBlock) {
        removeBlockFromState(selectedCanvasObjectId); // Handles removing connections too
        const blockEl = document.getElementById(selectedCanvasObjectId);
        if (blockEl) blockEl.remove();
        renderAllConnections(); // Re-render connections as some might be removed
      } else {
        // Is connection
        removeConnectionFromState(selectedCanvasObjectId); // Removes visual line and note
      }
      logStudentAction(`Xóa: ${name}`);
      selectedCanvasObjectId = null; // Deselect after deletion
    }
  }
  // --- D. Popups for Tag Selection, Text Edit, Arrow Note Edit ---

  function openSelectTagsPopup(blockId) {
    hidePopups(); // Close other popups
    const blockData = canvasState.blocks[blockId];
    if (!blockData || blockData.type !== "info") return;

    selectTagsPopupEl = document.createElement("div");
    selectTagsPopupEl.id = "selectTagsPopup";
    selectTagsPopupEl.className = "canvas-popup"; // Add CSS

    let tagCheckboxesHtml = "";
    if (currentExtractedTags.length === 0) {
      tagCheckboxesHtml =
        "<p>Không có tags nào được trích xuất từ bệnh án.</p>";
    } else {
      tagCheckboxesHtml = currentExtractedTags
        .map((tag) => {
          // Check if this tag is already in the block's content
          const isChecked = blockData.content.some(
            (existingTag) => existingTag.id === tag.id
          ); // Assuming content stores tag objects
          // const isChecked = blockData.content.includes(tag.id); // If content stores only IDs
          return `
                    <div class="tag-checkbox-item" style="border-left: 4px solid ${
                      tag.color
                    };">
                        <input type="checkbox" id="popupTag_${tag.id}" value="${
            tag.id
          }" ${isChecked ? "checked" : ""}>
                        <label for="popupTag_${tag.id}">${tag.text}</label>
                    </div>`;
        })
        .join("");
    }

    selectTagsPopupEl.innerHTML = `
            <div class="popup-header">Chọn Tags cho "${blockData.title}" <button class="popup-close-btn">×</button></div>
            <div class="popup-content scrollable">${tagCheckboxesHtml}</div>
            <div class="popup-footer">
                <button class="btn btn-sm btn-primary" id="confirmTagSelectionBtn">Xác nhận</button>
                <button class="btn btn-sm btn-secondary" id="cancelTagSelectionBtn">Hủy</button>
            </div>
        `;

    document.body.appendChild(selectTagsPopupEl);
    // Add listeners for buttons
    selectTagsPopupEl.querySelector(".popup-close-btn").onclick = hidePopups;
    selectTagsPopupEl.querySelector("#cancelTagSelectionBtn").onclick =
      hidePopups;
    selectTagsPopupEl.querySelector("#confirmTagSelectionBtn").onclick = () => {
      const selectedTagIds = Array.from(
        selectTagsPopupEl.querySelectorAll('input[type="checkbox"]:checked')
      ).map((chk) => chk.value);
      // Find full tag objects based on selected IDs
      const selectedTags = currentExtractedTags.filter((tag) =>
        selectedTagIds.includes(tag.id)
      );
      updateBlockContentInState(blockId, selectedTags); // Store full tag objects
      hidePopups();
      logStudentAction(`Cập nhật tags cho ${blockData.title}.`);
    };
    selectTagsPopupEl.style.display = "block"; // Show it
    // Center the popup?
  }

  function openEditTextPopup(objectId, currentText) {
    hidePopups();
    const isBlock = !!canvasState.blocks[objectId];
    const objectData = isBlock
      ? canvasState.blocks[objectId]
      : canvasState.connections[objectId];
    if (!objectData) return;

    const title = isBlock
      ? `Sửa nội dung: ${objectData.title}`
      : `Sửa ghi chú mũi tên`;

    editPopupEl = document.createElement("div");
    editPopupEl.id = "editPopup";
    editPopupEl.className = "canvas-popup small-popup"; // Smaller popup

    editPopupEl.innerHTML = `
            <div class="popup-header">${title} <button class="popup-close-btn">×</button></div>
            <div class="popup-content">
                <textarea id="editTextarea" rows="4">${
                  currentText || ""
                }</textarea>
            </div>
            <div class="popup-footer">
                <button class="btn btn-sm btn-primary" id="confirmEditBtn">Lưu</button>
                <button class="btn btn-sm btn-secondary" id="cancelEditBtn">Hủy</button>
            </div>
        `;
    document.body.appendChild(editPopupEl);
    const textarea = editPopupEl.querySelector("#editTextarea");
    textarea.focus();

    editPopupEl.querySelector(".popup-close-btn").onclick = hidePopups;
    editPopupEl.querySelector("#cancelEditBtn").onclick = hidePopups;
    editPopupEl.querySelector("#confirmEditBtn").onclick = () => {
      const newText = textarea.value;
      if (isBlock) {
        updateBlockContentInState(objectId, newText);
        logStudentAction(`Sửa nội dung ${objectData.title}.`);
      } else {
        // Is connection
        updateConnectionNoteInState(objectId, newText);
        renderConnection(objectData); // Re-render connection to show/update note
        logStudentAction(`Sửa ghi chú mũi tên.`);
      }
      hidePopups();
    };
    editPopupEl.style.display = "block";
  }

  function openEditArrowNotePopup(connectionId) {
    const connData = canvasState.connections[connectionId];
    if (connData) {
      openEditTextPopup(connectionId, connData.note);
    }
  }

  function hidePopups() {
    if (selectTagsPopupEl) {
      selectTagsPopupEl.remove();
      selectTagsPopupEl = null;
    }
    if (editPopupEl) {
      editPopupEl.remove();
      editPopupEl = null;
    }
    hideBlockContextMenu(); // Also hide context menu if any popup opens
  }

  // --- E. General Canvas Actions Implementation ---
  function deleteSelectedCanvasObject() {
    const objectId = selectedCanvasObjectId; // Get selected ID before confirmation potentially deselects
    if (objectId) {
      const isBlock = !!canvasState.blocks[objectId];
      const objData = isBlock
        ? canvasState.blocks[objectId]
        : canvasState.connections[objectId];
      const name = objData
        ? isBlock
          ? objData.title || objectId
          : `Mũi tên ${objectId}`
        : objectId;

      if (confirm(`Bạn có chắc muốn xóa "${name}"?`)) {
        if (isBlock) {
          removeBlockFromState(objectId); // Remove from state (also removes related connections)
          const blockEl = document.getElementById(objectId);
          if (blockEl) blockEl.remove(); // Remove from DOM
          renderAllConnections(); // Update potentially affected connections
        } else {
          removeConnectionFromState(objectId); // Remove from state and DOM
        }
        logStudentAction(`Xóa: ${name}`);
        selectCanvasObject(null); // Deselect after deletion
      }
    } else {
      alert("Vui lòng chọn một khối hoặc mũi tên để xóa.");
    }
  }

  function clearCanvas() {
    if (
      confirm(
        "Bạn có chắc muốn xóa toàn bộ nội dung trên Canvas không? Hành động này không thể hoàn tác."
      )
    ) {
      canvasState = { blocks: {}, connections: {} };
      actualCanvasAreaEl
        .querySelectorAll(".canvas-block")
        .forEach((el) => el.remove());
      canvasSvgLayerEl.querySelectorAll("line").forEach((el) => el.remove()); // Clear SVG lines
      actualCanvasAreaEl
        .querySelectorAll(".canvas-arrow-note")
        .forEach((el) => el.remove()); // Clear notes
      selectedCanvasObjectId = null;
      logStudentAction("Xóa toàn bộ Canvas.");
      // Add placeholder back?
      if (!actualCanvasAreaEl.querySelector(".canvas-placeholder-text")) {
        const p = document.createElement("p");
        p.className = "canvas-placeholder-text";
        p.innerHTML = "Kéo thả Tags hoặc dùng Toolbar..."; // Update placeholder text
        actualCanvasAreaEl.appendChild(p);
      }
    }
  }

  /** Selects or deselects a canvas object (block or connection) */
  function selectCanvasObject(objectId = null) {
    // Deselect previous
    if (selectedCanvasObjectId) {
      const prevSelectedEl = document.getElementById(selectedCanvasObjectId);
      if (prevSelectedEl) prevSelectedEl.classList.remove("selected");
      const prevSelectedLine = canvasSvgLayerEl.querySelector(
        `[data-conn-id="${selectedCanvasObjectId}"]`
      );
      if (prevSelectedLine) prevSelectedLine.classList.remove("selected"); // Add CSS for selected line
    }

    selectedCanvasObjectId = objectId;

    // Select new
    if (selectedCanvasObjectId) {
      const newSelectedEl = document.getElementById(selectedCanvasObjectId);
      if (newSelectedEl) newSelectedEl.classList.add("selected");
      const newSelectedLine = canvasSvgLayerEl.querySelector(
        `[data-conn-id="${selectedCanvasObjectId}"]`
      );
      if (newSelectedLine) newSelectedLine.classList.add("selected");
    }
    // Hide context menu when selection changes
    hideBlockContextMenu();
  }

  // --- F. Canvas Save & Load (LocalStorage) ---
  function saveCanvasStateToLocalStorage() {
    if (currentCaseId && canvasState) {
      try {
        localStorage.setItem(
          `${LOCAL_STORAGE_CANVAS_KEY_PREFIX}${currentCaseId}`,
          JSON.stringify(canvasState)
        );
        logStudentAction("Lưu nháp Canvas thành công vào localStorage.");
        alert("Đã lưu nháp Canvas!");
      } catch (e) {
        console.error("Error saving canvas state to localStorage:", e);
        alert("Lỗi khi lưu nháp Canvas. Console có thể có thêm chi tiết.");
      }
    } else {
      console.warn("Cannot save canvas: Missing caseId or canvasState.");
    }
  }

  function loadCanvasStateFromLocalStorage() {
    if (currentCaseId) {
      const savedStateString = localStorage.getItem(
        `${LOCAL_STORAGE_CANVAS_KEY_PREFIX}${currentCaseId}`
      );
      if (savedStateString) {
        try {
          const loadedState = JSON.parse(savedStateString);
          if (loadedState && loadedState.blocks) {
            // Kiểm tra cấu trúc cơ bản
            canvasState = loadedState;
            // Cập nhật lại counters nếu cần (để tránh ID trùng lặp nếu state cũ có ID cao)
            nextBlockIdCounter =
              Object.keys(canvasState.blocks).reduce(
                (max, id) => Math.max(max, parseInt(id.split("_")[1] || 0)),
                0
              ) + 1;
            nextConnectionIdCounter =
              Object.keys(canvasState.connections || {}).reduce(
                (max, id) => Math.max(max, parseInt(id.split("_")[1] || 0)),
                0
              ) + 1;
            logStudentAction("Tải nháp Canvas thành công từ localStorage.");
            return true; // Báo hiệu đã tải
          }
        } catch (e) {
          console.error("Error loading canvas state from localStorage:", e);
          localStorage.removeItem(
            `${LOCAL_STORAGE_CANVAS_KEY_PREFIX}${currentCaseId}`
          ); // Xóa state lỗi
        }
      }
    }
    return false; // Không có gì để tải hoặc lỗi
  }

  // --- G. Initialize Canvas ---
  /** Initializes the canvas when the modal is opened. */
  function initializeClinicalCanvas() {
    if (!currentCaseData) {
      console.error("Cannot initialize canvas without case data.");
      return;
    }

    // Tải trạng thái từ localStorage TRƯỚC KHI làm gì khác
    const loadedFromStorage = loadCanvasStateFromLocalStorage();
    if (loadedFromStorage) {
      const placeholder = actualCanvasAreaEl.querySelector(
        ".canvas-placeholder-text"
      );
      if (placeholder && Object.keys(canvasState.blocks).length > 0)
        placeholder.remove();
    } else {
      // Nếu không tải được từ storage, reset về trạng thái rỗng
      canvasState = { blocks: {}, connections: {} };
      nextBlockIdCounter = 0;
      nextConnectionIdCounter = 0;
    }

    populateCanvasTagList(currentExtractedTags);
    setupCanvasEventListeners(); // Gọi MỘT LẦN
    renderAllBlocks();
    // renderAllConnections(); // Tạm comment nếu SVG chưa sẵn sàng

    logStudentAction(
      `Clinical Reasoning Canvas được ${
        loadedFromStorage ? "tải từ nháp và" : ""
      } khởi tạo/mở.`
    );
  }

  // --- G. Setup Canvas Event Listeners ---
  function setupCanvasEventListeners() {
    if (actualCanvasAreaEl.dataset.listenersAttached === "true") return;

    // 1. Toolbar Actions
    if (canvasToolbarEl) {
      canvasToolbarEl.onclick = (e) => {
        // Use onclick for simplicity here
        const button = e.target.closest(".btn-canvas-tool");
        if (!button) return;
        const tool = button.dataset.tool;
        hidePopups();

        switch (tool) {
          case "info-block":
            createNewInfoBlock(); // Use dedicated function
            break;
          case "delete-selected":
            deleteSelectedCanvasObject();
            break;
          case "clear-canvas":
            clearCanvas();
            break;
          // Disable direct creation of other blocks from toolbar in this model
          case "ddx-block":
          case "investigation-block":
          case "diff-diag-block":
            alert(
              "Vui lòng chọn một khối nguồn và dùng menu ngữ cảnh để tạo khối này."
            );
            break;
          case "draw-arrow":
            alert("Chức năng vẽ mũi tên chưa được hỗ trợ.");
            break;
        }
      };
    }

    // 2. Click on Canvas Area (to deselect)
    if (actualCanvasAreaEl) {
      actualCanvasAreaEl.onclick = (e) => {
        if (e.target === actualCanvasAreaEl) {
          selectCanvasObject(null);
          hidePopups();
        }
      };
      actualCanvasAreaEl.ondragover = (e) => e.preventDefault();
    }

    // Block/Arrow click listeners are added dynamically in render functions

    actualCanvasAreaEl.dataset.listenersAttached = "true";
    console.log("Canvas event listeners attached.");
  }

  /** Helper function specifically for creating Info Blocks in the left column */
  function createNewInfoBlock() {
    // Determine position for the new info block
    const infoBlockArea = actualCanvasAreaEl; // Using main area for now
    const existingInfoBlocks = Array.from(
      infoBlockArea.querySelectorAll(".info-block")
    );
    let nextY = 15;
    if (existingInfoBlocks.length > 0) {
      const lastBlock = existingInfoBlocks[existingInfoBlocks.length - 1];
      nextY = lastBlock.offsetTop + lastBlock.offsetHeight + 15;
    }
    const initialX = 15; // Fixed X

    // Add to state and render
    const newBlockData = addBlockToState(
      "info",
      initialX,
      nextY,
      "Khối Thông Tin"
    );
    renderBlock(newBlockData); // Render it

    // Remove placeholder if it exists
    const placeholder = actualCanvasAreaEl.querySelector(
      ".canvas-placeholder-text"
    );
    if (placeholder) placeholder.remove();

    logStudentAction(`Tạo Khối Thông Tin.`);
  }

  // --- H. Investigation Block Specific Logic ---
  let investigationDebounceTimer;
  /** Handles input changes in the Investigation Block's suggestion field */
  function handleInvestigationBlockInput(blockId, fieldType, value) {
    clearTimeout(investigationDebounceTimer);
    investigationDebounceTimer = setTimeout(() => {
      if (canvasState.blocks[blockId] && fieldType === "suggestion") {
        // Ensure content is an object
        if (
          typeof canvasState.blocks[blockId].content !== "object" ||
          canvasState.blocks[blockId].content === null
        ) {
          canvasState.blocks[blockId].content = { suggestion: "", result: "" };
        }
        canvasState.blocks[blockId].content.suggestion = value;
        console.log(`Debounced Suggestion update for ${blockId}: ${value}`);
        checkAndUnlockLabs(); // Check unlock status after suggestion changes
      }
    }, 300); // Update state after 300ms debounce
  }
  // =======================================================================
  // --- I. MAKING BLOCKS DRAGGABLE (Renamed Section - Đặt trong Section VI hoặc là một section riêng)
  // =======================================================================

  /**
   * Makes a DOM element draggable within the canvas area.
   * @param {HTMLElement} blockElement - The block element to make draggable.
   * @param {HTMLElement} dragHandleElement - The element that initiates dragging (e.g., the header or the block itself).
   */
  function makeBlockDraggable(blockElement, dragHandleElement) {
    // Ngăn chặn việc gắn listener kéo thả nhiều lần cho cùng một element
    if (blockElement.dataset.draggableAttached === "true") {
      // console.warn(`Draggable listener already attached to ${blockElement.id}`);
      return;
    }

    function onDragStart(event) {
      // Chỉ kéo bằng chuột trái và nếu không phải đang click vào input/textarea
      if (
        event.button !== 0 ||
        event.target.tagName === "TEXTAREA" ||
        event.target.tagName === "INPUT" ||
        event.target.closest(".edit-tags-btn") // Không kéo khi click nút edit tags
      ) {
        return;
      }

      isDraggingBlock = true;
      draggedBlockElement = blockElement; // DOM element của block

      // Lấy vị trí hiện tại của block (từ style hoặc getComputedStyle nếu mới tạo)
      const currentLeft = parseInt(blockElement.style.left, 10) || 0;
      const currentTop = parseInt(blockElement.style.top, 10) || 0;

      // Tính toán offset: Vị trí chuột tương đối so với góc trên trái của element
      // clientX/Y là vị trí chuột so với viewport
      // actualCanvasAreaEl.getBoundingClientRect().left/top là vị trí của canvas so với viewport
      // actualCanvasAreaEl.scrollLeft/Top là lượng canvas đã cuộn
      dragOffsetX =
        event.clientX -
        (currentLeft -
          actualCanvasAreaEl.scrollLeft +
          actualCanvasAreaEl.getBoundingClientRect().left);
      dragOffsetY =
        event.clientY -
        (currentTop -
          actualCanvasAreaEl.scrollTop +
          actualCanvasAreaEl.getBoundingClientRect().top);

      blockElement.classList.add("dragging"); // Thêm class để thay đổi style (vd: opacity, z-index)
      blockElement.style.zIndex = "1001"; // Mang lên trên cùng khi kéo

      document.addEventListener("mousemove", onDragMove);
      document.addEventListener("mouseup", onDragEnd);

      event.preventDefault(); // Ngăn các hành vi mặc định (như chọn text)
    }

    function onDragMove(event) {
      if (!isDraggingBlock || !draggedBlockElement) return;

      // Tính vị trí mới của góc trên trái block dựa trên vị trí chuột và offset ban đầu
      // Phải tính toán vị trí mới so với actualCanvasAreaEl đã cuộn
      let newX =
        event.clientX -
        dragOffsetX -
        actualCanvasAreaEl.getBoundingClientRect().left +
        actualCanvasAreaEl.scrollLeft;
      let newY =
        event.clientY -
        dragOffsetY -
        actualCanvasAreaEl.getBoundingClientRect().top +
        actualCanvasAreaEl.scrollTop;

      // Giới hạn block trong phạm vi canvas (tùy chọn)
      const canvasWidth = actualCanvasAreaEl.scrollWidth; // Tổng chiều rộng có thể cuộn
      const canvasHeight = actualCanvasAreaEl.scrollHeight; // Tổng chiều cao có thể cuộn
      const blockWidth = draggedBlockElement.offsetWidth;
      const blockHeight = draggedBlockElement.offsetHeight;

      newX = Math.max(0, Math.min(newX, canvasWidth - blockWidth));
      newY = Math.max(0, Math.min(newY, canvasHeight - blockHeight));

      draggedBlockElement.style.left = `${newX}px`;
      draggedBlockElement.style.top = `${newY}px`;

      // QUAN TRỌNG: Vẽ lại các mũi tên nối với block này
      renderAllConnections(); // Hoặc một hàm tối ưu hơn chỉ vẽ lại các mũi tên liên quan
    }

    function onDragEnd(event) {
      if (!isDraggingBlock || !draggedBlockElement) return;

      draggedBlockElement.classList.remove("dragging");
      draggedBlockElement.style.zIndex = ""; // Trả lại z-index mặc định

      // Lấy vị trí cuối cùng và cập nhật vào state
      const finalX = parseInt(draggedBlockElement.style.left, 10) || 0;
      const finalY = parseInt(draggedBlockElement.style.top, 10) || 0;
      updateBlockPositionInState(draggedBlockElement.id, finalX, finalY);

      // console.log(`Block ${draggedBlockElement.id} dropped at (${finalX}px, ${finalY}px)`);

      isDraggingBlock = false;
      draggedBlockElement = null;
      document.removeEventListener("mousemove", onDragMove);
      document.removeEventListener("mouseup", onDragEnd);
    }

    dragHandleElement.addEventListener("mousedown", onDragStart);
    blockElement.dataset.draggableAttached = "true"; // Đánh dấu đã gắn listener
    // console.log(`Draggable listener attached to ${blockElement.id}`);
  }

  // =======================================================================
  // VIII. MAIN PAGE EVENT LISTENERS SETUP
  // =======================================================================
  /** Sets up all main event listeners for the page. */
  function setupEventListeners() {
    console.log("Setting up main event listeners..."); // Log để kiểm tra

    // --- Modal Triggers ---
    if (openAskHistoryModalBtnEl) {
      openAskHistoryModalBtnEl.onclick = () => {
        // Dùng onclick cho đơn giản nếu không cần remove listener
        if (currentCaseId) {
          openModal(askHistoryModalEl);
          loadHistoryCategories(); // Load categories when modal opens
          logStudentAction("Mở modal Hỏi Bệnh.");
        }
      };
    }
    if (openPhysicalExamModalBtnEl) {
      openPhysicalExamModalBtnEl.onclick = () => {
        if (currentCaseId) {
          openModal(physicalExamModalEl);
          loadExamCategories(); // Load categories when modal opens
          logStudentAction("Mở modal Khám Lâm Sàng.");
        }
      };
    }
    if (openOrderLabsModalBtnEl) {
      openOrderLabsModalBtnEl.onclick = () => {
        if (!openOrderLabsModalBtnEl.disabled) {
          openModal(orderLabsModalEl);
          loadLabList(); // Load labs when modal opens
          logStudentAction("Mở modal Đề xuất CLS.");
        } else {
          alert("Cần thêm thông tin Bệnh án để mở khóa CLS.");
          logStudentAction("Cố gắng mở modal CLS khi đang khóa.");
        }
      };
    }
    if (viewMedicalRecordBtnEl) {
      viewMedicalRecordBtnEl.onclick = () => {
        updateMedicalRecordDisplay(); // Ensure display is up-to-date
        openModal(medicalRecordDisplayModalEl);
        logStudentAction("Xem Bệnh Án Điện Tử.");
      };
    }

    // --- Modal Close Buttons ---
    document.querySelectorAll(".close-modal-btn").forEach((btn) => {
      const modalId = btn.dataset.modalId;
      const modalToClose = document.getElementById(modalId);
      if (modalToClose) {
        btn.onclick = () => closeModal(modalToClose);
      }
    });
    // Close modal on outside click
    window.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal")) {
        closeModal(event.target);
      }
    });

    // --- Tag Extraction Button ---
    if (triggerTagExtractionFromMRBtnEl) {
      // Dùng addEventListener để có thể quản lý việc disable/enable tốt hơn trong async
      triggerTagExtractionFromMRBtnEl.addEventListener("click", async () => {
        if (!triggerTagExtractionFromMRBtnEl.disabled) {
          logStudentAction("Yêu cầu trích xuất Tags từ Bệnh Án Điện Tử.");
          triggerTagExtractionFromMRBtnEl.disabled = true;
          triggerTagExtractionFromMRBtnEl.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Đang trích xuất...';
          try {
            const extractedTags = await fetchData(
              `${API_BASE_URL}/${currentCaseId}/extract-tags`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentMedicalRecord),
              }
            );
            console.log("Extracted Tags:", extractedTags);
            if (extractedTags && Array.isArray(extractedTags)) {
              currentExtractedTags = extractedTags; // Store tags
              initializeClinicalCanvas(); // Initialize Canvas (populates tags, sets up canvas listeners)
              openModal(clinicalReasoningCanvasModalEl); // Open Canvas modal
              logStudentAction(
                `Trích xuất thành công ${currentExtractedTags.length} tags. Mở Canvas.`
              );
            } else {
              alert(
                "Trích xuất thành công nhưng không nhận được danh sách tags hợp lệ."
              );
              logStudentAction(
                "Trích xuất tags thành công nhưng không có dữ liệu tags."
              );
              currentExtractedTags = [];
            }
          } catch (error) {
            alert(`Lỗi trích xuất tags: ${error.message}`);
            console.error("Error extracting tags:", error);
            logStudentAction(`Lỗi trích xuất tags: ${error.message}`);
            currentExtractedTags = [];
          } finally {
            // Re-enable button only if there's content in the EMR
            triggerTagExtractionFromMRBtnEl.disabled =
              !currentMedicalRecord ||
              Object.keys(currentMedicalRecord).filter(
                (k) =>
                  ![
                    "hoTen",
                    "tuoi",
                    "gioiTinh",
                    "diaChi",
                    "ngheNghiep",
                  ].includes(k) && currentMedicalRecord[k]
              ).length === 0;
            triggerTagExtractionFromMRBtnEl.innerHTML =
              '<i class="fas fa-tags"></i> Trích xuất Tags (cho Canvas)';
          }
        }
      });
    }

    // --- Open Canvas Button ---
    if (openClinicalCanvasBtnEl) {
      openClinicalCanvasBtnEl.addEventListener("click", () => {
        if (!openClinicalCanvasBtnEl.disabled) {
          // Check state variable directly
          if (currentExtractedTags && currentExtractedTags.length > 0) {
            initializeClinicalCanvas(); // Ensure canvas is ready (listeners, state rendering)
            openModal(clinicalReasoningCanvasModalEl);
            logStudentAction("Mở lại Clinical Reasoning Canvas.");
          } else {
            alert(
              "Bạn cần 'Trích xuất Tags' từ Bệnh Án Điện Tử trước khi mở Canvas."
            );
            logStudentAction("Cố gắng mở Canvas nhưng chưa trích xuất tags.");
          }
        }
      });
    }
    // --- Listener cho nút Lưu nháp Canvas ---
    if (saveCanvasProgressBtn) {
      saveCanvasProgressBtn.addEventListener("click", () => {
        saveCanvasStateToLocalStorage();
      });
    }

    // --- Canvas Save/Submit Buttons (Placeholders) ---
    const saveCanvasBtn = document.getElementById("saveCanvasProgressBtn");
    const submitCanvasBtn = document.getElementById(
      "submitCanvasForAnalysisBtn"
    );
    if (saveCanvasBtn)
      saveCanvasBtn.addEventListener("click", () => {
        alert("Lưu nháp Canvas chưa cài đặt.");
        logStudentAction("Yêu cầu lưu nháp Canvas."); /* TODO */
      });
    if (submitCanvasBtn)
      submitCanvasBtn.addEventListener("click", () => {
        alert("Nộp Canvas phân tích chưa cài đặt.");
        logStudentAction("Nộp Canvas phân tích."); /* TODO */
      });

    // --- Add to MR buttons (listeners attached in their respective load functions) ---
    // Example: History Modal's Add button listener setup:
    if (addSelectedHistoryToMRBtnEl) {
      addSelectedHistoryToMRBtnEl.onclick = () => {
        // Use onclick here for simplicity
        if (
          handleAddItemsToMedicalRecord(tempCollectedHistoryItems, "history")
        ) {
          renderCollectedItems(
            historyCollectedItemsContainerEl,
            tempCollectedHistoryItems,
            addSelectedHistoryToMRBtnEl,
            "history"
          );
        }
      };
    }
    // Example: Exam Modal's Add button listener setup:
    if (addSelectedExamToMRBtnEl) {
      addSelectedExamToMRBtnEl.onclick = () => {
        if (handleAddItemsToMedicalRecord(tempCollectedExamItems, "exam")) {
          renderCollectedItems(
            examCollectedItemsContainerEl,
            tempCollectedExamItems,
            addSelectedExamToMRBtnEl,
            "exam"
          );
        }
      };
    }
    // Example: Lab Modal's Add button listener setup:
    if (addSelectedLabsToMRBtnEl) {
      addSelectedLabsToMRBtnEl.onclick = () => {
        if (handleAddItemsToMedicalRecord(tempCollectedLabItems, "lab")) {
          renderCollectedItems(
            labCollectedItemsContainerEl,
            tempCollectedLabItems,
            addSelectedLabsToMRBtnEl,
            "lab"
          );
        }
      };
    }

    // --- Lab Search Input ---
    if (searchLabInputEl) {
      searchLabInputEl.addEventListener("input", () => {
        const searchTerm = searchLabInputEl.value.toLowerCase().trim();
        const filteredLabs = searchTerm
          ? allLabsFromBank.filter((lab) =>
              lab.name.toLowerCase().includes(searchTerm)
            )
          : allLabsFromBank;
        renderFilteredLabList(filteredLabs);
      });
    }

    // --- User Menu (Moved to script.js, but keep this check for safety) ---
    const userMenuButton = document.getElementById("userMenuButton");
    if (!userMenuButton?.dataset?.listenerAttached) {
      console.warn("User menu logic might be missing (should be in script.js)");
    }
  } // --- End of setupEventListeners ---

  // =======================================================================
  // IX. INITIALIZATION
  // =======================================================================
  /** Initializes the case simulation page. */
  function initCaseSimulationPage() {
    console.log("Initializing Case Simulation Page...");
    const urlParams = new URLSearchParams(window.location.search);
    currentCaseId = urlParams.get("caseId");

    // Initial setup of event listeners that don't depend on case data
    setupEventListeners(); // Call this ONCE here

    if (currentCaseId) {
      fetchCaseInitialData(currentCaseId); // Fetch data and update UI
    } else {
      // Handle error: No Case ID provided
      console.error("No caseId found in URL.");
      if (caseSimTitleEl) caseSimTitleEl.textContent = "Không tìm thấy Case ID";
      showError(
        caseInitialInfoAreaEl,
        "Vui lòng chọn một ca bệnh từ thư viện để bắt đầu."
      );
      // Disable buttons that require a case
      [
        openAskHistoryModalBtnEl,
        openPhysicalExamModalBtnEl,
        openOrderLabsModalBtnEl,
        viewMedicalRecordBtnEl,
        openClinicalCanvasBtnEl,
        triggerTagExtractionFromMRBtnEl,
      ].forEach((btn) => {
        if (btn) btn.disabled = true;
      });
      if (openOrderLabsModalBtnEl)
        labsLockIndicatorEl.style.display = "inline-block"; // Show lock if disabled initially
    }
  }

  // Start the simulation page logic
  initCaseSimulationPage();
}); // End DOMContentLoaded
