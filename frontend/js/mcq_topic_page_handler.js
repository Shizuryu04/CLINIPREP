// ... (Phần initializeCaseLibrary và dropdown user giữ nguyên) ...

// ===============================================
// LOGIC CHO TRANG MÔ PHỎNG CASE (case_simulation.html) - NÂNG CẤP
// ===============================================
function initializeCaseSimulation() {
  const caseSimTitleEl = document.getElementById("caseSimTitle");
  const initialCaseInfoEl = document.getElementById("initialCaseInfo");
  const caseInfoDisplayArea = document.getElementById("caseInfoDisplayArea");
  const interactionPanel = document.getElementById("interactionPanel"); // Panel mới
  const actionLogList = document.getElementById("actionLogList");

  // Các nút hành động chính giờ là các category, sự kiện sẽ gắn vào các nút con
  const caseActionsPanel = document.querySelector(".case-actions-panel");

  const openCanvasBtn = document.getElementById("openCanvasBtn");
  const canvasModal = document.getElementById("clinicalReasoningCanvasModal");
  const closeCanvasModalBtn = document.getElementById("closeCanvasModal");

  const viewMedicalRecordBtn = document.getElementById("viewMedicalRecordBtn");
  const medicalRecordModal = document.getElementById("medicalRecordModal");
  const closeMedicalRecordModalBtn = document.getElementById(
    "closeMedicalRecordModal"
  );
  const medicalRecordForm = document.getElementById("medicalRecordForm"); // Form bệnh án
  const extractTagsFromMRBtn = document.getElementById("extractTagsFromMRBtn");
  const canvasActiveTagsUl = document.getElementById("canvasActiveTags");

  // --- Dữ liệu Case Mẫu (Cấu trúc lại để hỗ trợ tương tác có cấu trúc) ---
  const sampleCaseData = {
    case001: {
      title: "Ca bệnh Tim mạch 01: Đau ngực cấp",
      type: "Nội khoa",
      topic: "Tim mạch",
      initialInfo:
        "Bệnh nhân nam, 65 tuổi, vào viện vì đau ngực trái dữ dội...", // Giữ nguyên
      // Thông tin hành chính để điền vào bệnh án
      administrative: {
        hoTen: "Nguyễn Văn A",
        tuoi: 65,
        gioiTinh: "nam",
        diaChi: "Hà Nội",
        ngheNghiep: "Về hưu",
      },
      // Các mục hỏi bệnh với câu hỏi gợi ý và câu trả lời của bệnh nhân ảo
      structuredHistory: {
        chief_complaint: {
          // Lý do vào viện
          prompt: "Bệnh nhân khai lý do chính đến khám là gì?",
          answer: "Đau ngực trái dữ dội.",
          fillsField: "mr_lyDoVaoVien", // ID của trường trong bệnh án
        },
        present_illness: [
          // Quá trình bệnh lý - có thể có nhiều câu hỏi/bước
          {
            type: "info", // Chỉ hiển thị thông tin (nếu cần)
            text: "Bệnh nhân mô tả chi tiết về cơn đau ngực.",
          },
          {
            type: "mcq",
            question: "Cơn đau khởi phát khi nào?",
            options: {
              a: "Đang nghỉ ngơi",
              b: "Sau gắng sức nhẹ",
              c: "Sau bữa ăn no",
            },
            answerKey: "a", // Đáp án "đúng" của bệnh nhân ảo
            patientResponse: "Tôi đang ngồi xem TV thì đột ngột đau.", // Câu trả lời đầy đủ của bệnh nhân
            fillsField: "mr_benhSu", // Nối thêm vào bệnh sử
            tag: {
              text: "Đau ngực khởi phát khi nghỉ",
              color: "#FFA07A",
              type: "symptom",
            },
          },
          {
            type: "selection", // Chọn từ danh sách các câu hỏi
            prompt: "Bạn muốn hỏi thêm gì về tính chất cơn đau?",
            questions: [
              {
                id: "pi_q1",
                text: "Hướng lan của cơn đau?",
                patientResponse: "Đau lan lên vai trái và cằm.",
                fillsField: "mr_benhSu",
              },
              {
                id: "pi_q2",
                text: "Cảm giác đau như thế nào?",
                patientResponse: "Cảm giác như bị bóp nghẹt, đè nặng.",
                fillsField: "mr_benhSu",
              },
              {
                id: "pi_q3",
                text: "Có triệu chứng nào khác kèm theo không?",
                patientResponse: "Có, tôi vã mồ hôi và thấy hơi khó thở.",
                fillsField: "mr_benhSu",
                tag: {
                  text: "Vã mồ hôi, khó thở nhẹ",
                  color: "#FFA07A",
                  type: "symptom",
                },
              },
            ],
          },
        ],
        past_history: {
          prompt: "Khai thác tiền sử bệnh tật của bệnh nhân.",
          patientResponse:
            "Tôi bị tăng huyết áp 10 năm, uống thuốc không đều. Đái tháo đường type 2 cách 5 năm, đang dùng Metformin. Rối loạn lipid máu.",
          fillsField: "mr_tienSuBanThan",
          tags: [
            {
              text: "Tiền sử Tăng huyết áp",
              color: "#FFD700",
              type: "history",
            },
            {
              text: "Tiền sử Đái tháo đường type 2",
              color: "#FFD700",
              type: "history",
            },
          ],
        },
        // ... Thêm family_history, social_history tương tự
      },
      // Khám lâm sàng với các mục và kết quả
      structuredExam: {
        general: {
          prompt: "Thực hiện khám toàn thân và đo dấu hiệu sinh tồn.",
          // Có thể có câu hỏi MCQ kiểm tra kiến thức trước khi cho kết quả
          // exam_mcq: { question: "...", options: {...}, correctAnswerKey: "..." },
          result:
            "Bệnh nhân tỉnh, tiếp xúc tốt. Da niêm mạc hồng. Vã mồ hôi. Mạch: 90 lần/phút, Huyết áp: 160/90 mmHg, Nhiệt độ: 37°C, Nhịp thở: 20 lần/phút, SpO2: 96% (khí trời).",
          fillsField: "mr_khamToanThan",
        },
        cardiovascular: {
          prompt: "Thực hiện khám tim mạch.",
          result:
            "Tim nhịp đều, T1 T2 rõ. Không nghe thấy tiếng thổi bệnh lý. Mạch ngoại vi bắt rõ.",
          fillsField: "mr_khamTuanHoan",
        },
        // ...
      },
      // Cận lâm sàng
      structuredLabs: {
        ecg: {
          prompt: "Bạn đề xuất ECG. Kết quả:",
          result:
            "ECG: Nhịp xoang, tần số 90 ck/p. ST chênh lên ở V1-V4, DII, DIII, aVF.",
          fillsField: "mr_ketQuaCLS",
          tag: {
            text: "ECG: ST chênh lên V1-V4, DII, DIII, aVF",
            color: "#87CEFA",
            type: "lab",
          },
        },
        troponin: {
          prompt: "Bạn đề xuất xét nghiệm Troponin T hs. Kết quả:",
          result: "Troponin T hs: 1500 ng/L (Bình thường < 14 ng/L).",
          fillsField: "mr_ketQuaCLS",
          tag: {
            text: "Troponin T hs tăng cao",
            color: "#87CEFA",
            type: "lab",
          },
        },
      },
      // Tags gợi ý ban đầu (có thể được bổ sung khi SV tương tác)
      initialSuggestedTags: [
        { text: "Nam 65 tuổi", color: "#FFD700", type: "demographics" },
        { text: "Tiền sử Tăng huyết áp", color: "#FFD700", type: "history" },
      ],
    },
    // ... (Thêm case002 với cấu trúc tương tự)
  };

  const urlParams = new URLSearchParams(window.location.search);
  const currentCaseId = urlParams.get("caseId") || "case001";
  const currentCase = sampleCaseData[currentCaseId];
  let collectedMedicalRecordData = {}; // Lưu dữ liệu bệnh án người dùng nhập/hệ thống điền

  // --- Hiển thị thông tin ban đầu và điền thông tin hành chính vào bệnh án ---
  if (currentCase) {
    if (caseSimTitleEl)
      caseSimTitleEl.textContent = `CASE ${currentCase.type.toUpperCase()} - ${currentCase.topic.toUpperCase()}`;
    if (initialCaseInfoEl)
      initialCaseInfoEl.textContent = currentCase.initialInfo;
    logAction("Case bắt đầu.");

    // Điền thông tin hành chính vào collectedMedicalRecordData và form bệnh án (nếu modal mở sẵn)
    if (currentCase.administrative) {
      for (const key in currentCase.administrative) {
        collectedMedicalRecordData[key] = currentCase.administrative[key];
        const field = medicalRecordForm.elements[`mr_${key}`]; // Giả sử ID form là mr_ + key
        if (field) field.value = currentCase.administrative[key];
      }
    }
    // Điền các thông tin ban đầu khác vào collectedMedicalRecordData
    if (currentCase.structuredHistory?.chief_complaint?.answer) {
      collectedMedicalRecordData["lyDoVaoVien"] =
        currentCase.structuredHistory.chief_complaint.answer;
    }
  } else {
    /* ... xử lý case không tìm thấy ... */
  }

  function logAction(message) {
    /* ... giữ nguyên ... */
  }

  function appendToMedicalRecordField(fieldId, textToAdd, isNewEntry = false) {
    const field = medicalRecordForm.elements[fieldId];
    if (field) {
      if (isNewEntry || field.value === "") {
        field.value = textToAdd;
      } else {
        field.value += `\n- ${textToAdd}`; // Thêm gạch đầu dòng cho các mục mới
      }
      // Cập nhật vào object collectedMedicalRecordData
      collectedMedicalRecordData[fieldId] = field.value;
    }
  }

  function displayInteraction(actionType, interactionData) {
    interactionPanel.innerHTML = ""; // Xóa tương tác cũ
    if (!interactionData) {
      interactionPanel.innerHTML =
        "<p>Không có tương tác nào cho mục này hoặc đã hoàn thành.</p>";
      return;
    }

    const title = document.createElement("h4");
    title.textContent = interactionData.prompt || "Vui lòng thực hiện:";
    interactionPanel.appendChild(title);

    if (interactionData.type === "info") {
      const infoP = document.createElement("p");
      infoP.textContent = interactionData.text;
      interactionPanel.appendChild(infoP);
    } else if (interactionData.type === "mcq") {
      const qText = document.createElement("p");
      qText.className = "interaction-question";
      qText.textContent = interactionData.question;
      interactionPanel.appendChild(qText);

      const optionsDiv = document.createElement("div");
      optionsDiv.className = "interaction-options";
      for (const key in interactionData.options) {
        const label = document.createElement("label");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "interaction_mcq";
        radio.value = key;
        label.appendChild(radio);
        label.appendChild(
          document.createTextNode(
            ` ${key.toUpperCase()}. ${interactionData.options[key]}`
          )
        );
        optionsDiv.appendChild(label);
      }
      interactionPanel.appendChild(optionsDiv);

      const submitMcqBtn = document.createElement("button");
      submitMcqBtn.textContent = "Xác nhận trả lời";
      submitMcqBtn.className = "btn btn-sm btn-primary";
      submitMcqBtn.onclick = () => {
        const selectedRadio = optionsDiv.querySelector(
          'input[name="interaction_mcq"]:checked'
        );
        if (selectedRadio) {
          // Hiển thị phản hồi của bệnh nhân ảo
          displayInfoInPanel(
            `Phản hồi cho "${interactionData.question}"`,
            `<p>Bệnh nhân: "${interactionData.patientResponse}"</p>`
          );
          if (interactionData.fillsField) {
            appendToMedicalRecordField(
              interactionData.fillsField,
              interactionData.patientResponse,
              true
            );
          }
          if (interactionData.tag) {
            // Tự động thêm tag này vào danh sách gợi ý nếu muốn
            addSuggestedTag(interactionData.tag);
          }
          logAction(
            `Trả lời MCQ: ${interactionData.question} - Chọn: ${selectedRadio.value}`
          );
          interactionPanel.innerHTML = "<p>Đã nhận được câu trả lời.</p>"; // Xóa MCQ sau khi trả lời
        } else {
          alert("Vui lòng chọn một đáp án.");
        }
      };
      interactionPanel.appendChild(submitMcqBtn);
    } else if (interactionData.type === "selection") {
      // Chọn câu hỏi từ danh sách
      const qList = document.createElement("ul");
      qList.className = "interaction-options"; // Tái sử dụng style
      interactionData.questions.forEach((q) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.textContent = q.text;
        btn.className = "btn btn-action-sub btn-block"; // Style như nút
        btn.style.marginBottom = "5px";
        btn.onclick = () => {
          displayInfoInPanel(
            `Phản hồi cho câu hỏi "${q.text}"`,
            `<p>Bệnh nhân: "${q.patientResponse}"</p>`
          );
          if (q.fillsField) {
            appendToMedicalRecordField(q.fillsField, q.patientResponse);
          }
          if (q.tag) addSuggestedTag(q.tag);
          logAction(`Hỏi: ${q.text}`);
          // Có thể xóa câu hỏi đã chọn khỏi danh sách để tránh hỏi lại
          btn.disabled = true;
          btn.style.opacity = "0.5";
        };
        li.appendChild(btn);
        qList.appendChild(li);
      });
      interactionPanel.appendChild(qList);
    } else {
      // Mặc định là hiển thị kết quả/thông tin trực tiếp
      displayInfoInPanel(
        interactionData.prompt || actionType,
        `<p>${
          interactionData.result ||
          interactionData.answer ||
          "Không có thông tin cụ thể."
        }</p>`
      );
      if (
        interactionData.fillsField &&
        (interactionData.result || interactionData.answer)
      ) {
        appendToMedicalRecordField(
          interactionData.fillsField,
          interactionData.result || interactionData.answer,
          true
        );
      }
      if (interactionData.tag) addSuggestedTag(interactionData.tag);
    }
  }

  let allCollectedTags = [...(currentCase?.initialSuggestedTags || [])]; // Mảng chứa tất cả tag thu thập được

  function addSuggestedTag(tagObject) {
    // Kiểm tra trùng lặp trước khi thêm
    if (!allCollectedTags.some((t) => t.text === tagObject.text)) {
      allCollectedTags.push(tagObject);
    }
  }

  // Gắn sự kiện cho các nút con trong panel hành động
  if (caseActionsPanel) {
    caseActionsPanel.addEventListener("click", (event) => {
      if (event.target.classList.contains("btn-action-sub")) {
        const action = event.target.dataset.action; // Ví dụ: "ask_chief_complaint"
        if (!currentCase) return;

        let interactionData;
        const actionParts = action.split("_"); // ["ask", "chief_complaint"]
        const category = actionParts[0]; // "ask", "exam", "order"
        const specificAction = actionParts.slice(1).join("_"); // "chief_complaint", "general", "ecg"

        if (
          category === "ask" &&
          currentCase.structuredHistory &&
          currentCase.structuredHistory[specificAction]
        ) {
          interactionData = currentCase.structuredHistory[specificAction];
          displayInteraction(
            `Hỏi bệnh: ${event.target.textContent}`,
            interactionData
          );
        } else if (
          category === "exam" &&
          currentCase.structuredExam &&
          currentCase.structuredExam[specificAction]
        ) {
          interactionData = currentCase.structuredExam[specificAction];
          displayInteraction(
            `Khám: ${event.target.textContent}`,
            interactionData
          );
        } else if (
          category === "order" &&
          currentCase.structuredLabs &&
          currentCase.structuredLabs[specificAction]
        ) {
          interactionData = currentCase.structuredLabs[specificAction];
          displayInteraction(
            `CLS: ${event.target.textContent}`,
            interactionData
          );
        } else {
          interactionPanel.innerHTML = `<p>Chức năng "${event.target.textContent}" chưa có dữ liệu hoặc đã hoàn thành.</p>`;
        }
        logAction(`Thực hiện: ${event.target.textContent}`);
      }
    });
  }

  function displayInfoInPanel(title, contentHtml) {
    /* ... giữ nguyên ... */
  }

  // --- Xử lý Modal Bệnh Án ---
  if (
    viewMedicalRecordBtn &&
    medicalRecordModal &&
    closeMedicalRecordModalBtn
  ) {
    viewMedicalRecordBtn.addEventListener("click", () => {
      // Trước khi mở, cập nhật các trường form từ collectedMedicalRecordData (nếu có thay đổi ngầm)
      for (const key in collectedMedicalRecordData) {
        const field = medicalRecordForm.elements[key]; // Giả sử ID form là key trực tiếp
        // Hoặc nếu ID form có tiền tố: medicalRecordForm.elements[`mr_${key}`]
        if (field && field.value !== collectedMedicalRecordData[key]) {
          field.value = collectedMedicalRecordData[key];
        }
      }
      medicalRecordModal.style.display = "block";
      logAction("Mở Bệnh án điện tử.");
    });
    closeMedicalRecordModalBtn.addEventListener("click", () => {
      medicalRecordModal.style.display = "none";
    });

    // Lưu lại thay đổi từ form vào collectedMedicalRecordData khi người dùng nhập
    if (medicalRecordForm) {
      medicalRecordForm.addEventListener("input", (e) => {
        if (e.target.name) {
          collectedMedicalRecordData[e.target.name] = e.target.value;
        }
      });
    }
  }

  // --- Xử lý Modal Clinical Reasoning Canvas ---
  if (openCanvasBtn && canvasModal && closeCanvasModalBtn) {
    /* ... giữ nguyên ... */
  }

  // Nút "Trích xuất Tags" từ Bệnh Án (nâng cấp)
  if (extractTagsFromMRBtn && canvasActiveTagsUl) {
    extractTagsFromMRBtn.addEventListener("click", () => {
      canvasActiveTagsUl.innerHTML = ""; // Xóa tag cũ

      // MVP: Hiện tại chỉ hiển thị các tag đã được thu thập (hardcode + từ tương tác)
      // Trong tương lai, đây là nơi gọi hàm phân tích collectedMedicalRecordData để gợi ý tag

      allCollectedTags.forEach((tag) => {
        const li = document.createElement("li");
        li.textContent = tag.text;
        li.style.backgroundColor = tag.color || "#eee";
        li.style.color = isColorDark(tag.color || "#eee") ? "#fff" : "#333";
        li.dataset.tagType = tag.type;
        li.draggable = true; // Cho phép kéo
        li.id = `tag-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`; // ID duy nhất cho kéo thả
        li.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", e.target.id);
          e.dataTransfer.setData("tagData", JSON.stringify(tag));
        });
        canvasActiveTagsUl.appendChild(li);
      });
      logAction("Đã cập nhật danh sách Tags trong Canvas.");
      if (canvasModal.style.display !== "block") {
        alert(
          "Danh sách Tags đã được cập nhật. Hãy mở Clinical Reasoning Canvas để xem."
        );
      }
    });
  }

  window.addEventListener("click", (event) => {
    /* ... đóng modal khi click ngoài ... */
  });
  function isColorDark(hexColor) {
    /* ... giữ nguyên ... */
  }

  // Các hàm cho Canvas (kéo thả, tạo khối - sẽ phức tạp và cần thư viện hoặc nhiều code hơn)
  // Ví dụ cơ bản cho phép thả tag vào main canvas area (chỉ để demo)
  const mainCanvasArea = document.getElementById("mainCanvasArea");
  if (mainCanvasArea) {
    mainCanvasArea.addEventListener("dragover", (e) => {
      e.preventDefault(); // Quan trọng để cho phép drop
    });
    mainCanvasArea.addEventListener("drop", (e) => {
      e.preventDefault();
      const droppedTagId = e.dataTransfer.getData("text/plain");
      const tagDataString = e.dataTransfer.getData("tagData");
      if (tagDataString) {
        const tagData = JSON.parse(tagDataString);
        const droppedTagElement = document.getElementById(droppedTagId); // Lấy element gốc nếu cần

        const infoBlock = document.createElement("div");
        infoBlock.className = "info-block-on-canvas"; // Cần style cho class này
        infoBlock.textContent = tagData.text;
        infoBlock.style.backgroundColor = tagData.color || "#fff";
        infoBlock.style.color = isColorDark(tagData.color || "#fff")
          ? "#fff"
          : "#333";
        infoBlock.style.position = "absolute";
        // Tính toán vị trí thả tương đối với mainCanvasArea
        const rect = mainCanvasArea.getBoundingClientRect();
        infoBlock.style.left = e.clientX - rect.left - 20 + "px"; // -20 là offset ví dụ
        infoBlock.style.top = e.clientY - rect.top - 10 + "px";
        infoBlock.style.padding = "5px 10px";
        infoBlock.style.border = "1px solid #ccc";
        infoBlock.style.borderRadius = "4px";
        infoBlock.style.cursor = "move";

        mainCanvasArea.appendChild(infoBlock);
        logAction(`Đã thả Tag "${tagData.text}" vào Canvas.`);
      }
    });
  }
}
