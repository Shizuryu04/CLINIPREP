// backend/routes/caseRoutes.js

const express = require("express");
const fs = require("fs"); // Module 'fs' (File System) để làm việc với file
const path = require("path"); // Module 'path' để làm việc với đường dẫn file/thư mục

// Tạo một Router mới của Express
const router = express.Router();

// --- Định nghĩa đường dẫn đến các file dữ liệu JSON ---
// __dirname là một biến toàn cục trong Node.js, trỏ đến thư mục chứa file hiện tại (tức là backend/routes)
const dataDirectory = path.join(__dirname, "..", "data"); // Trỏ ra thư mục backend/data
const casesFilePath = path.join(dataDirectory, "cases_data.json");
const questionsBankPath = path.join(dataDirectory, "questions_bank.json");
const skillsBankPath = path.join(dataDirectory, "skills_bank.json");
// const labsBankPath = path.join(dataDirectory, 'labs_bank.json'); // Sẽ dùng sau

// --- Hàm Helper để đọc và parse file JSON ---
// Hàm này trả về một Promise, giúp xử lý bất đồng bộ dễ dàng hơn
function readJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error(`Error reading file ${path.basename(filePath)}:`, err);
        // Gửi một lỗi cụ thể hơn cho client nếu cần, hoặc log nội bộ
        return reject(
          new Error(`Could not read data from ${path.basename(filePath)}.`)
        );
      }
      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (parseError) {
        console.error(
          `Error parsing JSON from ${path.basename(filePath)}:`,
          parseError
        );
        reject(new Error(`Invalid data format in ${path.basename(filePath)}.`));
      }
    });
  });
}

// --- ĐỊNH NGHĨA CÁC API ROUTES ---

// API 1: GET /api/cases - Lấy danh sách tóm tắt tất cả các case
router.get("/", async (req, res) => {
  try {
    const allCases = await readJsonFile(casesFilePath);
    // Chỉ trả về các thông tin cần thiết cho trang thư viện case
    const summaryCases = allCases.map((c) => ({
      id: c.id,
      title: c.title,
      short_description: c.short_description,
      specialty_slug: c.specialty_slug,
      specialty_name: c.specialty_name,
      difficulty: c.difficulty,
    }));
    res.status(200).json(summaryCases);
  } catch (error) {
    // Nếu có lỗi từ readJsonFile hoặc lỗi khác
    res.status(500).json({
      message: error.message || "Internal Server Error while fetching cases.",
    });
  }
});

// API 2: GET /api/cases/:caseId/start - Lấy thông tin ban đầu của một case cụ thể
router.get("/:caseId/start", async (req, res) => {
  const caseId = req.params.caseId; // Lấy caseId từ URL (ví dụ: /api/cases/case001/start -> caseId = "case001")
  try {
    const allCases = await readJsonFile(casesFilePath);
    const caseDetail = allCases.find((c) => c.id === caseId);

    if (caseDetail) {
      // Chỉ trả về các thông tin cần thiết để bắt đầu case trên frontend
      const initialCaseData = {
        id: caseDetail.id,
        title: caseDetail.title,
        initial_info: caseDetail.initial_info,
        administrative: caseDetail.administrative,
      };
      res.status(200).json(initialCaseData);
    } else {
      res.status(404).json({ message: `Case with ID '${caseId}' not found.` });
    }
  } catch (error) {
    res.status(500).json({
      message:
        error.message || `Internal Server Error while fetching case ${caseId}.`,
    });
  }
});

// API 3: GET /api/cases/:caseId/history-categories - Lấy các mục lớn để hỏi bệnh cho case
router.get("/:caseId/history-categories", async (req, res) => {
  const caseId = req.params.caseId;
  try {
    const allCases = await readJsonFile(casesFilePath);
    const caseDetail = allCases.find((c) => c.id === caseId);

    if (!caseDetail) {
      return res
        .status(404)
        .json({ message: `Case with ID '${caseId}' not found.` });
    }
    if (!caseDetail.history_taking || !caseDetail.history_taking.categories) {
      return res.status(404).json({
        message: `History taking categories not found for case '${caseId}'.`,
      });
    }

    // Trả về danh sách các mục hỏi cho case này (chỉ id và name)
    const historyCategories = caseDetail.history_taking.categories.map(
      (cat) => ({
        id: cat.id,
        name: cat.name,
      })
    );
    res.status(200).json(historyCategories);
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Internal Server Error." });
  }
});

// API 4: GET /api/cases/:caseId/history-questions/:categoryId - Lấy danh sách câu hỏi cho một mục cụ thể của case
router.get("/:caseId/history-questions/:categoryId", async (req, res) => {
  const { caseId, categoryId } = req.params;
  try {
    // Đọc song song cả file case và file ngân hàng câu hỏi
    const [allCases, questionsBank] = await Promise.all([
      readJsonFile(casesFilePath),
      readJsonFile(questionsBankPath),
    ]);

    const caseDetail = allCases.find((c) => c.id === caseId);
    if (!caseDetail) {
      return res
        .status(404)
        .json({ message: `Case with ID '${caseId}' not found.` });
    }

    // Tìm category cụ thể trong case
    const caseCategoryInfo = caseDetail.history_taking?.categories.find(
      (cat) => cat.id === categoryId
    );
    if (!caseCategoryInfo || !caseCategoryInfo.question_ids) {
      return res.status(404).json({
        message: `Category ID '${categoryId}' not found or has no questions for case '${caseId}'.`,
      });
    }

    // Lấy text của các câu hỏi từ questionsBank dựa trên question_ids đã định nghĩa cho case và category đó
    const questionsForCategory = caseCategoryInfo.question_ids
      .map((qId) => {
        const questionData = questionsBank.questions.find((q) => q.id === qId);
        // Chỉ trả về id và text của câu hỏi
        return questionData
          ? { id: questionData.id, text: questionData.text }
          : null;
      })
      .filter((q) => q !== null); // Lọc bỏ các qId không tìm thấy (đề phòng lỗi dữ liệu)

    res.status(200).json(questionsForCategory);
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Internal Server Error." });
  }
});

// --- API CHO NGÂN HÀNG KỸ NĂNG KHÁM (CHUNG, KHÔNG PHỤ THUỘC CASE CỤ THỂ) ---

// API 5: GET /api/exam-skill-categories - Lấy danh mục các hệ cơ quan/nhóm kỹ năng khám
router.get("/exam-skill-categories", async (req, res) => {
  // Chú ý: đường dẫn này không chứa :caseId
  try {
    const skillsBank = await readJsonFile(skillsBankPath);
    if (!skillsBank || !skillsBank.categories) {
      return res
        .status(404)
        .json({ message: "Examination skill categories not found." });
    }
    // Trả về {id, name} của các category từ skills_bank.json
    res.status(200).json(skillsBank.categories);
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Internal Server Error." });
  }
});

// API 6: GET /api/cases/exam-skills/:categoryId - Lấy danh sách các kỹ năng khám trong một category
// Đường dẫn này sẽ được frontend gọi khi bạn click vào một category khám bệnh
router.get("/exam-skills/:categoryId", async (req, res) => {
  const { categoryId } = req.params; // Lấy categoryId từ URL
  try {
    const skillsBank = await readJsonFile(skillsBankPath); // Đảm bảo skillsBankPath đúng
    if (!skillsBank || !skillsBank.skills) {
      return res
        .status(404)
        .json({ message: "Examination skills data not found." });
    }

    // Lọc các kỹ năng thuộc category này
    const skillsInCategory = skillsBank.skills.filter(
      (skill) => skill.category_id === categoryId
    );

    // Chuẩn bị dữ liệu trả về (chỉ id, name, has_mcqs)
    const resultSkills = skillsInCategory.map((skill) => ({
      id: skill.id,
      name: skill.name,
      // has_mcqs được xác định dựa trên việc mảng mcqs có tồn tại và có phần tử không
      has_mcqs: Array.isArray(skill.mcqs) && skill.mcqs.length > 0,
    }));

    if (
      resultSkills.length === 0 &&
      !skillsBank.categories.find((c) => c.id === categoryId)
    ) {
      // Nếu categoryId không tồn tại trong danh mục categories của skill bank
      return res
        .status(404)
        .json({ message: `Skill category with ID '${categoryId}' not found.` });
    }
    // Nếu category tồn tại nhưng không có skill nào, trả về mảng rỗng là đúng
    res.status(200).json(resultSkills);
  } catch (error) {
    console.error(`Error fetching skills for category ${categoryId}:`, error);
    res.status(500).json({
      message:
        error.message ||
        `Internal Server Error fetching skills for category ${categoryId}.`,
    });
  }
});

// API 6.1 (Hoặc đặt tên là API mới, ví dụ API 13): GET /api/cases/exam-skill/:skillId/mcqs
// Đường dẫn này sẽ được frontend gọi khi bạn click vào một kỹ năng cụ thể CÓ MCQ
router.get("/exam-skill/:skillId/mcqs", async (req, res) => {
  const { skillId } = req.params; // Lấy skillId từ URL
  try {
    const skillsBank = await readJsonFile(skillsBankPath); // Đảm bảo skillsBankPath đúng
    const skillDetail = skillsBank.skills.find((s) => s.id === skillId);

    if (!skillDetail) {
      return res.status(404).json({
        message: `Skill with ID '${skillId}' not found in skills bank.`,
      });
    }

    // Trả về các câu hỏi MCQ (chỉ question và options, không trả về đáp án đúng)
    // Frontend sẽ không cần biết đáp án đúng ở bước này
    const mcqsForStudent =
      skillDetail.mcqs && Array.isArray(skillDetail.mcqs)
        ? skillDetail.mcqs.map((mcq) => ({
            id: mcq.id, // ID của câu MCQ
            question: mcq.question,
            options: mcq.options,
          }))
        : []; // Nếu không có mcqs hoặc không phải mảng, trả về mảng rỗng

    res.status(200).json(mcqsForStudent);
  } catch (error) {
    console.error(`Error fetching MCQs for skill ${skillId}:`, error);
    res
      .status(500)
      .json({ message: error.message || "Internal Server Error." });
  }
});

// --- API XỬ LÝ TƯƠNG TÁC CỦA SINH VIÊN ---

// API 7: POST /api/cases/:caseId/ask-question - Sinh viên "hỏi" một câu, backend trả lời
router.post("/:caseId/ask-question", async (req, res) => {
  const { caseId } = req.params; // Lấy caseId từ URL
  const { questionId } = req.body; // Lấy questionId từ body của request JSON

  // Kiểm tra xem questionId có được gửi lên không
  if (!questionId) {
    return res
      .status(400)
      .json({ message: "Missing 'questionId' in request body." });
  }

  try {
    const allCases = await readJsonFile(casesFilePath);
    const caseDetail = allCases.find((c) => c.id === caseId);

    if (!caseDetail) {
      return res
        .status(404)
        .json({ message: `Case with ID '${caseId}' not found.` });
    }

    // Kiểm tra xem case này có cấu hình câu trả lời không
    if (
      !caseDetail.history_taking ||
      !caseDetail.history_taking.patient_answers
    ) {
      return res.status(404).json({
        message: `Patient answers not configured for case '${caseId}'.`,
      });
    }

    const answerData = caseDetail.history_taking.patient_answers[questionId];

    if (answerData) {
      // Tìm thấy câu trả lời cụ thể cho câu hỏi này trong case này
      res.status(200).json({
        question_id: questionId,
        answer_text: answerData.text,
        medical_record_field_target: answerData.medical_record_field, // Gợi ý trường bệnh án để frontend xử lý
      });
    } else {
      // Không tìm thấy câu trả lời cụ thể cho questionId này trong case_data.json
      // Đây có thể là câu hỏi "gây nhiễu" hoặc câu hỏi chung mà case không có phản hồi riêng.
      // Bạn có thể quyết định trả về lỗi 404 hoặc một câu trả lời mặc định.
      // Ví dụ: trả lời mặc định
      // Trước tiên, kiểm tra xem questionId có tồn tại trong questions_bank không
      const questionsBank = await readJsonFile(questionsBankPath);
      const questionExistsInBank = questionsBank.questions.some(
        (q) => q.id === questionId
      );

      if (questionExistsInBank) {
        res.status(200).json({
          question_id: questionId,
          answer_text:
            "Bệnh nhân: Tôi không có thông tin về vấn đề đó / Hiện tại tôi không có triệu chứng đó.",
          medical_record_field_target: null, // Không có gợi ý cụ thể cho trường bệnh án
        });
      } else {
        res.status(404).json({
          message: `Question with ID '${questionId}' not found in question bank or no specific answer for this case.`,
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      message:
        error.message ||
        `Internal Server Error while processing question for case ${caseId}.`,
    });
  }
});

// ... (code các API GET cho exam-skill-categories và exam-skills/:categoryId đã có) ...
// module.exports = router; // Dòng này vẫn ở cuối cùng
// backend/routes/caseRoutes.js
// ... (API 7 và các API GET khác đã có) ...

// API 8: POST /api/cases/:caseId/perform-exam/:skillId - Sinh viên thực hiện khám
router.post("/:caseId/perform-exam/:skillId", async (req, res) => {
  const { caseId, skillId } = req.params; // Lấy caseId và skillId từ URL
  const { mcqAnswers } = req.body; // Lấy câu trả lời MCQ từ body (có thể là undefined nếu không có MCQ)
  // mcqAnswers dự kiến là một object: { "mcq_id_1": "a", "mcq_id_2": "b" }

  try {
    // Đọc song song dữ liệu case và ngân hàng kỹ năng
    const [allCases, skillsBank] = await Promise.all([
      readJsonFile(casesFilePath),
      readJsonFile(skillsBankPath),
    ]);

    const caseDetail = allCases.find((c) => c.id === caseId);
    if (!caseDetail) {
      return res
        .status(404)
        .json({ message: `Case with ID '${caseId}' not found.` });
    }

    const skillBankDetail = skillsBank.skills.find((s) => s.id === skillId);
    if (!skillBankDetail) {
      return res.status(404).json({
        message: `Skill with ID '${skillId}' not found in skills bank.`,
      });
    }

    // --- Bước 1: Kiểm tra các câu trả lời MCQ (nếu kỹ năng này có MCQ) ---
    let allMcqsCorrect = true;
    const mcqFeedback = []; // Mảng để lưu phản hồi cho từng MCQ

    if (
      Array.isArray(skillBankDetail.mcqs) &&
      skillBankDetail.mcqs.length > 0
    ) {
      // Nếu kỹ năng này YÊU CẦU trả lời MCQ
      if (!mcqAnswers || typeof mcqAnswers !== "object") {
        // Sinh viên chưa gửi câu trả lời MCQ, hoặc gửi sai định dạng
        return res.status(400).json({
          message:
            "This skill requires MCQ answers. Please provide answers in the 'mcqAnswers' field.",
          requires_mcqs: true, // Cho frontend biết là cần MCQ
          mcqs_to_answer: skillBankDetail.mcqs.map((mcq) => ({
            id: mcq.id,
            question: mcq.question,
            options: mcq.options,
          })), // Gửi lại các câu hỏi MCQ
        });
      }

      for (const mcq of skillBankDetail.mcqs) {
        const studentAnswer = mcqAnswers[mcq.id]; // Lấy câu trả lời của SV cho MCQ hiện tại
        if (studentAnswer === undefined) {
          // SV không trả lời câu hỏi này
          allMcqsCorrect = false;
          mcqFeedback.push({
            mcq_id: mcq.id,
            question: mcq.question,
            status: "missing",
            message: "Answer not provided.",
          });
        } else if (studentAnswer !== mcq.correct_answer) {
          allMcqsCorrect = false;
          mcqFeedback.push({
            mcq_id: mcq.id,
            question: mcq.question,
            status: "incorrect",
            your_answer: studentAnswer,
            // Không nên gửi đáp án đúng ngay, trừ khi bạn muốn
            // correct_answer_key: mcq.correct_answer,
            // correct_answer_text: mcq.options[mcq.correct_answer]
            message: "Incorrect answer.",
          });
        } else {
          mcqFeedback.push({
            mcq_id: mcq.id,
            question: mcq.question,
            status: "correct",
            your_answer: studentAnswer,
          });
        }
      }
    }

    // Nếu có bất kỳ MCQ nào sai (hoặc thiếu), không cung cấp kết quả khám
    if (
      !allMcqsCorrect &&
      skillBankDetail.mcqs &&
      skillBankDetail.mcqs.length > 0
    ) {
      return res.status(422).json({
        // 422 Unprocessable Entity - Dữ liệu gửi lên có vấn đề logic
        message:
          "One or more MCQ answers are incorrect or missing. Please review.",
        mcq_feedback: mcqFeedback,
        exam_result_text: null, // Không có kết quả khám
      });
    }

    // --- Bước 2: Nếu MCQ đúng (hoặc không có MCQ), lấy kết quả khám cho CASE NÀY ---
    const examSkillForCase = caseDetail.physical_exam?.skills?.find(
      (ex) => ex.skill_id === skillId
    );

    if (examSkillForCase && examSkillForCase.result) {
      res.status(200).json({
        message: "Examination performed successfully.",
        mcq_feedback: mcqFeedback.length > 0 ? mcqFeedback : null, // Gửi lại feedback MCQ nếu có
        exam_result_text: examSkillForCase.result,
        medical_record_field_target: examSkillForCase.medical_record_field,
      });
    } else {
      // Kỹ năng có trong bank, MCQ đúng, nhưng case này không có kết quả khám cụ thể
      // Điều này có thể xảy ra nếu bạn thiết kế case mà một số kỹ năng khám không mang lại thông tin bệnh lý.
      res.status(200).json({
        message:
          "Examination performed. No specific abnormal findings for this skill in this case.",
        mcq_feedback: mcqFeedback.length > 0 ? mcqFeedback : null,
        exam_result_text:
          "Không phát hiện dấu hiệu bất thường đặc hiệu qua kỹ năng khám này.",
        medical_record_field_target:
          caseDetail.physical_exam?.skills?.find(
            (ex) => ex.skill_id === skillId
          )?.medical_record_field || null, // Vẫn cố gắng lấy field nếu có
      });
    }
  } catch (error) {
    res.status(500).json({
      message:
        error.message ||
        `Internal Server Error while performing exam for case ${caseId}, skill ${skillId}.`,
    });
  }
});
// backend/routes/caseRoutes.js
// ... (các API đã có từ Giai đoạn 2 và 3) ...

// --- API CHO ĐỀ XUẤT CẬN LÂM SÀNG (CLS) ---

// API 9: GET /api/labs/categories - Lấy danh mục các loại CLS (chung)
router.get("/lab-categories", async (req, res) => {
  // Chú ý: đường dẫn mới, không phụ thuộc /api/cases
  try {
    const labsBank = await readJsonFile(
      path.join(dataDirectory, "labs_bank.json")
    ); // Đọc trực tiếp từ labs_bank
    if (!labsBank || !labsBank.categories) {
      return res.status(404).json({ message: "Lab categories not found." });
    }
    res.status(200).json(labsBank.categories);
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Internal Server Error." });
  }
});

// API 10: GET /api/labs - Lấy danh sách tất cả CLS (có thể kèm tìm kiếm)
router.get("/labs", async (req, res) => {
  // Chú ý: đường dẫn mới
  const { category, search } = req.query; // Lấy query params: ?category=hematology&search=máu
  try {
    const labsBank = await readJsonFile(
      path.join(dataDirectory, "labs_bank.json")
    );
    if (!labsBank || !labsBank.labs) {
      return res.status(404).json({ message: "Labs data not found." });
    }

    let filteredLabs = labsBank.labs;

    // Lọc theo category nếu có
    if (category) {
      filteredLabs = filteredLabs.filter((lab) => lab.category_id === category);
    }

    // Lọc theo từ khóa tìm kiếm nếu có
    if (search) {
      const searchTerm = search.toLowerCase().trim();
      filteredLabs = filteredLabs.filter((lab) => {
        return (
          lab.name.toLowerCase().includes(searchTerm) ||
          (lab.keywords &&
            lab.keywords.some((kw) => kw.toLowerCase().includes(searchTerm)))
        );
      });
    }

    // Chỉ trả về id, name, category_id để danh sách không quá nặng
    const resultLabs = filteredLabs.map((lab) => ({
      id: lab.id,
      name: lab.name,
      category_id: lab.category_id,
    }));

    res.status(200).json(resultLabs);
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Internal Server Error." });
  }
});

// API 11: GET /api/cases/:caseId/lab-unlock-conditions - Lấy điều kiện mở khóa CLS cho case
router.get("/:caseId/lab-unlock-conditions", async (req, res) => {
  const { caseId } = req.params;
  try {
    const allCases = await readJsonFile(casesFilePath);
    const caseDetail = allCases.find((c) => c.id === caseId);

    if (!caseDetail) {
      return res
        .status(404)
        .json({ message: `Case with ID '${caseId}' not found.` });
    }
    if (
      !caseDetail.lab_investigations ||
      !caseDetail.lab_investigations.unlock_conditions
    ) {
      // Nếu case không có cấu hình unlock_conditions, mặc định là không có điều kiện (luôn mở)
      return res.status(200).json({
        message: `No specific unlock conditions set for CLS in case '${caseId}'. Assumed always unlocked.`,
        conditions: null, // Hoặc { min_history_items_collected: 0, min_exam_items_collected: 0 }
      });
    }
    res.status(200).json({
      message: "CLS unlock conditions retrieved.",
      conditions: caseDetail.lab_investigations.unlock_conditions,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Internal Server Error." });
  }
});

// API 12: POST /api/cases/:caseId/order-lab - Sinh viên "chỉ định" một CLS, backend trả kết quả
router.post("/:caseId/order-lab", async (req, res) => {
  const { caseId } = req.params;
  const { labId } = req.body; // Frontend gửi labId mà sinh viên chọn

  if (!labId) {
    return res
      .status(400)
      .json({ message: "Missing 'labId' in request body." });
  }

  try {
    const allCases = await readJsonFile(casesFilePath);
    const caseDetail = allCases.find((c) => c.id === caseId);

    if (!caseDetail) {
      return res
        .status(404)
        .json({ message: `Case with ID '${caseId}' not found.` });
    }
    if (
      !caseDetail.lab_investigations ||
      !caseDetail.lab_investigations.results_for_case
    ) {
      return res
        .status(404)
        .json({ message: `Lab results not configured for case '${caseId}'.` });
    }

    const labResultData = caseDetail.lab_investigations.results_for_case[labId];

    // Lấy thêm thông tin tên của lab từ labs_bank để hiển thị cho đẹp
    const labsBank = await readJsonFile(
      path.join(dataDirectory, "labs_bank.json")
    );
    const labInfoFromBank = labsBank.labs.find((l) => l.id === labId);

    if (labResultData) {
      // Tìm thấy kết quả cụ thể cho CLS này trong case này
      res.status(200).json({
        lab_id: labId,
        lab_name: labInfoFromBank ? labInfoFromBank.name : "Không rõ tên CLS",
        result_text: labResultData.result_text,
        image_url: labResultData.image_url || null,
        interpretation_notes: labResultData.interpretation_notes || null,
        medical_record_field_target: labResultData.medical_record_field_target,
      });
    } else {
      // Không có kết quả cụ thể cho labId này trong case_data.json
      // Có thể CLS này không liên quan đến case, hoặc là CLS bình thường không có gì đặc biệt
      if (labInfoFromBank) {
        // CLS này có tồn tại trong bank
        res.status(200).json({
          lab_id: labId,
          lab_name: labInfoFromBank.name,
          result_text: `Không có kết quả bất thường hoặc không có dữ liệu cụ thể cho xét nghiệm '${labInfoFromBank.name}' trong trường hợp này. Giả định các chỉ số trong giới hạn bình thường nếu không có chỉ định khác.`,
          image_url: null,
          interpretation_notes:
            "CLS không có kết quả nổi bật hoặc không thực sự cần thiết cho case này.",
          medical_record_field_target: "mr_ketQuaCLS", // Vẫn có thể thêm vào mục CLS chung
        });
      } else {
        // labId không tồn tại cả trong bank
        res
          .status(404)
          .json({ message: `Lab with ID '${labId}' not found in lab bank.` });
      }
    }
  } catch (error) {
    res.status(500).json({
      message:
        error.message ||
        `Internal Server Error while ordering lab for case ${caseId}.`,
    });
  }
});

router.post("/:caseId/extract-tags", async (req, res) => {
  const { caseId } = req.params;
  const medicalRecordData = req.body;

  // ... (kiểm tra medicalRecordData) ...
  console.log(
    `[API /extract-tags] Received medical record for case ${caseId}:`,
    medicalRecordData
  );

  // --- ĐỊNH NGHĨA HÀM HELPER CHO BACKEND ---
  function getFieldNameHintBackend(fieldKey) {
    // Sao chép hoặc điều chỉnh logic từ frontend
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
      // Bạn có thể thêm các key hành chính nếu muốn hiển thị tên trường của chúng
      hoTen: "Họ tên",
      tuoi: "Tuổi",
      gioiTinh: "Giới tính",
      diaChi: "Địa chỉ",
      ngheNghiep: "Nghề nghiệp",
      // Thêm các key khác nếu cần
    };
    return simpleHints[fieldKey] || fieldKey; // Trả về key nếu không có hint
  }

  // --- LOGIC TRÍCH XUẤT TAGS ĐƠN GIẢN (MVP) ---
  const extractedTags = [];
  const tagColors = {
    // Định nghĩa màu sắc cho các loại tag
    administrative: "#FFD700", // Vàng (Thông tin hành chính, Tiền sử, Yếu tố nguy cơ)
    symptom: "#FFA07A", // Cam (Triệu chứng Cơ năng - Bệnh sử)
    sign: "#90EE90", // Xanh lá (Triệu chứng Thực thể - Khám lâm sàng)
    lab: "#ADD8E6", // Xanh dương (Kết quả Cận lâm sàng)
    diagnosis: "#DA70D6", // Tím (Chẩn đoán)
    default: "#E0E0E0", // Xám (Mặc định)
  };

  // Sửa lại hàm này để gọi hàm helper của backend
  function getTagTypeAndColor(fieldKey, fieldValue) {
    let type = "default";
    if (
      fieldKey.includes("hoTen") ||
      fieldKey.includes("tuoi") ||
      fieldKey.includes("gioiTinh") ||
      fieldKey.includes("ngheNghiep") ||
      fieldKey.includes("diaChi") ||
      fieldKey.toLowerCase().includes("tiensu") ||
      fieldKey.toLowerCase().includes("dichte")
    ) {
      type = "administrative";
    } else if (
      fieldKey.toLowerCase().includes("benhsu") ||
      fieldKey.toLowerCase().includes("lydo")
    ) {
      type = "symptom";
    } else if (fieldKey.toLowerCase().includes("kham")) {
      type = "sign";
    } else if (
      fieldKey.toLowerCase().includes("cls") ||
      fieldKey.toLowerCase().includes("ketqua")
    ) {
      type = "lab";
    } else if (fieldKey.toLowerCase().includes("chandoan")) {
      type = "diagnosis";
    }
    // Gọi hàm helper của backend
    const fieldNameHint = getFieldNameHintBackend(fieldKey);

    return {
      type,
      color: tagColors[type] || tagColors.default,
      text: `${fieldNameHint}: ${String(fieldValue).substring(0, 50)}${
        String(fieldValue).length > 50 ? "..." : ""
      }`, // Thêm '...' nếu cắt ngắn
    };
  }

  for (const fieldKey in medicalRecordData) {
    const fieldValue = medicalRecordData[fieldKey];
    if (
      fieldValue &&
      String(fieldValue).trim() !== "" &&
      String(fieldValue).trim() !== "-"
    ) {
      // ... (logic tách dòng hoặc tạo tag đơn giữ nguyên) ...
      if (typeof fieldValue === "string" && fieldValue.includes("\n- ")) {
        const lines = fieldValue.split("\n- ");
        lines.forEach((line, index) => {
          if (line.trim() !== "") {
            const lineText = index === 0 ? line.trim() : `- ${line.trim()}`;
            if (lineText.length > 3) {
              // Gọi hàm getTagTypeAndColor đã sửa
              const { type, color, text } = getTagTypeAndColor(
                fieldKey,
                lineText
              );
              extractedTags.push({
                id: `tag_${fieldKey}_line${index}_${Date.now()}`,
                text: text, // text đã bao gồm fieldNameHint
                color: color,
                type: type,
                source_field: fieldKey,
              });
            }
          }
        });
      } else if (String(fieldValue).length > 3) {
        // Gọi hàm getTagTypeAndColor đã sửa
        const { type, color, text } = getTagTypeAndColor(fieldKey, fieldValue);
        extractedTags.push({
          id: `tag_${fieldKey}_${Date.now()}`,
          text: text, // text đã bao gồm fieldNameHint
          color: color,
          type: type,
          source_field: fieldKey,
        });
      }
    }
  }
  console.log(
    `[API /extract-tags] Extracted ${extractedTags.length} tags for case ${caseId}.`
  );
  res.status(200).json(extractedTags);
});

// API (MỚI NẾU CHƯA CÓ): GET /api/cases/:caseId/lab-unlock-conditions
router.get("/:caseId/lab-unlock-conditions", async (req, res) => {
  const { caseId } = req.params;
  try {
    const allCases = await readJsonFile(casesFilePath); // Đảm bảo casesFilePath đúng
    const caseDetail = allCases.find((c) => c.id === caseId);

    if (!caseDetail) {
      return res
        .status(404)
        .json({ message: `Case with ID '${caseId}' not found.` });
    }

    // Lấy điều kiện từ case_data.json (hoặc đặt mặc định nếu không có)
    const conditions = caseDetail.lab_investigations?.unlock_conditions || {
      min_history_items_collected: 3, // Mặc định nếu không có trong case data
      min_exam_items_collected: 2, // Mặc định nếu không có trong case data
    };

    console.log(
      `[API /lab-unlock-conditions] For case ${caseId}, conditions:`,
      conditions
    );
    res.status(200).json({ conditions });
  } catch (error) {
    console.error(
      `Error fetching lab unlock conditions for case ${caseId}:`,
      error
    );
    res.status(500).json({
      message: "Internal Server Error while fetching lab unlock conditions.",
    });
  }
});

module.exports = router;

// Xuất router để có thể sử dụng trong file server.js chính
//module.exports = router;
//Giải thích backend/routes/caseRoutes.js:
//  const router = express.Router();: Tạo một đối tượng router mới. Router giúp bạn nhóm các định nghĩa route liên quan lại với nhau.
// dataDirectory, casesFilePath, ...: Xác định đường dẫn tuyệt đối đến các file JSON dữ liệu của bạn. path.join giúp tạo đường dẫn đúng trên các hệ điều hành khác nhau.
// readJsonFile(filePath): Một hàm helper tự tạo để đọc file JSON. Nó sử dụng fs.readFile (bất đồng bộ) và trả về một Promise. Điều này giúp code của bạn sạch sẽ hơn khi làm việc với các thao tác bất đồng bộ.
// router.get('/', ...) (API 1):
// Xử lý request GET đến /api/cases (khi kết hợp với prefix trong server.js).
// Đọc cases_data.json.
// Sử dụng map để chỉ lấy các trường tóm tắt (id, title, short_description,...) cho mỗi case. Điều này giúp giảm lượng dữ liệu truyền đi khi chỉ cần hiển thị danh sách.
// Gửi lại danh sách tóm tắt dưới dạng JSON với status 200.
// Có try...catch để bắt lỗi (ví dụ: file không tồn tại, JSON không hợp lệ).
// router.get('/:caseId/start', ...) (API 2):
// /:caseId là một route parameter. Express sẽ lấy giá trị này từ URL và đưa vào req.params.caseId.
// Tìm case có id khớp trong allCases.
// Nếu tìm thấy, trả về các thông tin ban đầu của case (id, title, initial_info, administrative).
// Nếu không tìm thấy, trả về lỗi 404.
// router.get('/:caseId/history-categories', ...) (API 3):
// Lấy caseId từ URL.
// Tìm case tương ứng.
// Truy cập vào caseDetail.history_taking.categories.
// Map qua mảng này để chỉ lấy id và name của mỗi category.
// Trả về danh sách các category này.
// router.get('/:caseId/history-questions/:categoryId', ...) (API 4):
// Lấy caseId và categoryId từ URL.
// Đọc đồng thời cả cases_data.json và questions_bank.json bằng Promise.all.
// Tìm case, rồi tìm category trong case đó để lấy mảng question_ids.
// Duyệt qua question_ids, với mỗi id, tìm câu hỏi tương ứng trong questionsBank.questions để lấy text của câu hỏi.
// Trả về danh sách các câu hỏi (chỉ id và text).
// router.get('/exam-skill-categories', ...) (API 5):
// API này không phụ thuộc vào một caseId cụ thể vì danh mục kỹ năng là chung.
// Đọc skills_bank.json.
// Trả về mảng skillsBank.categories.
// router.get('/exam-skills/:categoryId', ...) (API 6):
// API này cũng chung, không phụ thuộc caseId.
// Lấy categoryId từ URL.
// Đọc skills_bank.json.
// Lọc ra các skill thuộc categoryId đó.
// Với mỗi skill, trả về id, name, và một cờ has_mcqs để frontend biết có cần hiển thị phần MCQ không.
//  module.exports = router;: Xuất đối tượng router để file server.js chính có thể import và sử dụng nó.
//  Giải thích API 7 (POST /:caseId/ask-question):
//router.post(...): Định nghĩa một route xử lý HTTP POST request. Chúng ta dùng POST vì frontend sẽ gửi dữ liệu (questionId) trong body của request.
//const { questionId } = req.body;: Lấy questionId từ req.body. Để điều này hoạt động, frontend cần gửi request với Content-Type: application/json và body là một JSON object, ví dụ: { "questionId": "q_cc_01" }. Middleware app.use(express.json()); trong server.js sẽ giúp parse JSON này.
//Kiểm tra đầu vào: Đảm bảo questionId được cung cấp.
//Tìm case: Tương tự như các API GET.
//Tìm câu trả lời:
// caseDetail.history_taking.patient_answers[questionId] : Truy cập vào object patient_answers của case, sử dụng questionId làm key để lấy thông tin câu trả lời.
// Nếu tìm thấy answerData, trả về answer_text và medical_record_field_target.
// Xử lý trường hợp không có câu trả lời cụ thể: Nếu answerData không tồn tại (ví dụ, sinh viên chọn một câu hỏi "gây nhiễu" mà case này không có câu trả lời riêng), chúng ta kiểm tra xem câu hỏi đó có trong questions_bank không. Nếu có, trả về một câu trả lời chung chung. Nếu không có cả trong bank, trả lỗi 404.
//   Giải thích API 8 (POST /:caseId/perform-exam/:skillId):
// const { mcqAnswers } = req.body;: Lấy mcqAnswers từ body. Frontend sẽ gửi một object { "mcq_id_1": "a", "mcq_id_2": "b", ... } nếu kỹ năng đó có MCQ. Nếu không có MCQ, mcqAnswers có thể là undefined.
// Kiểm tra MCQ (nếu skillBankDetail.mcqs tồn tại và có phần tử):
// Nếu kỹ năng yêu cầu MCQ nhưng frontend không gửi mcqAnswers: Trả lỗi 400, báo cho frontend biết là cần phải trả lời MCQ, và có thể gửi lại danh sách câu hỏi MCQ để frontend hiển thị.
// Duyệt qua từng MCQ trong skillBankDetail.mcqs:
// So sánh studentAnswer (lấy từ mcqAnswers[mcq.id]) với mcq.correct_answer.
// Tạo mcqFeedback cho từng câu, cho biết câu đó "missing", "incorrect", hay "correct".
// Nếu !allMcqsCorrect: Trả lỗi 422 (Unprocessable Entity - yêu cầu hợp lệ về cú pháp nhưng không thể xử lý về mặt logic), kèm theo mcq_feedback chi tiết và không cung cấp kết quả khám (exam_result_text: null).
// Lấy kết quả khám (nếu MCQ đúng hoặc không có MCQ):
// caseDetail.physical_exam?.skills?.find(ex => ex.skill_id === skillId): Tìm thông tin kỹ năng khám (skillId) trong dữ liệu của caseDetail (từ cases_data.json). Dấu ?. (optional chaining) giúp tránh lỗi nếu physical_exam hoặc skills không tồn tại.
// Nếu tìm thấy examSkillForCase và có result, trả về exam_result_text và medical_record_field_target.
// Nếu không tìm thấy kết quả cụ thể cho case (nhưng MCQ đã đúng), trả về một thông báo chung là "không phát hiện bất thường".
//Giải thích các API mới:
//API 9: GET /api/lab-categories:
//Chú ý: Đường dẫn này là /api/lab-categories (nếu bạn muốn tách riêng). Tuy nhiên, vì bạn đã đăng ký caseRoutes với prefix /api/cases, để truy cập API này qua caseRoutes, đường dẫn sẽ là /api/cases/lab-categories. Tôi đã sửa lại trong code trên để nó nằm trong caseRoutes cho nhất quán với các API khác.
//Đọc labs_bank.json và trả về mảng categories.
//  API 10: GET /api/labs:
// Tương tự, đường dẫn sẽ là /api/cases/labs.
//Lấy danh sách tất cả CLS từ labs_bank.json.
//Hỗ trợ filter:
//?category=hematology: Lọc CLS theo category_id.
//?search=máu: Tìm kiếm CLS dựa trên name hoặc keywords.
//Chỉ trả về các trường id, name, category_id để danh sách không quá nặng.
//API 11: GET /api/cases/:caseId/lab-unlock-conditions:
//Lấy caseId từ URL.
//Đọc cases_data.json và tìm caseDetail.
//Trả về object unlock_conditions từ caseDetail.lab_investigations.
//Nếu không có unlock_conditions được cấu hình cho case, nó trả về null (hoặc giá trị mặc định), nghĩa là frontend có thể hiểu là luôn mở khóa.
//API 12: POST /api/cases/:caseId/order-lab:
//Frontend gửi labId mà sinh viên đã chọn trong body.
//Backend tìm caseDetail và sau đó tìm kết quả cho labId đó trong caseDetail.lab_investigations.results_for_case.
//Đồng thời, lấy thông tin tên của labId từ labs_bank.json để hiển thị cho đẹp.
//Nếu tìm thấy kết quả, trả về result_text, image_url (nếu có), interpretation_notes (nếu có), và medical_record_field_target.
//Nếu không có kết quả cụ thể cho labId đó trong case (nhưng labId tồn tại trong labs_bank), trả về một thông báo chung (ví dụ: "kết quả bình thường" hoặc "không có dữ liệu").
//Nếu labId không tồn tại cả trong labs_bank, trả lỗi 404.
