// backend/server.js

// 1. Import các module cần thiết
const express = require("express");
const cors = require("cors");
const path = require("path");

// Import caseRoutes
const caseRoutes = require("./routes/caseRoutes");

// 2. Khởi tạo một ứng dụng Express
const app = express();

// 3. Định nghĩa cổng
const PORT = process.env.PORT || 3000;

// 4. Sử dụng Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ĐĂNG KÝ CÁC ROUTES ---
app.use("/api/cases", caseRoutes); // Tất cả các API trong caseRoutes sẽ có prefix này

// 5. Route kiểm tra sức khỏe
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Cliniprep Backend is running and healthy!",
  });
});

// 6. Khởi động server
app.listen(PORT, () => {
  console.log("====================================================");
  console.log(`🚀 Cliniprep Backend server is listening on port ${PORT}`);
  console.log("====================================================");
  console.log("API Endpoints available (examples):");
  console.log("----------------------------------------------------");
  console.log(`GENERAL:`);
  console.log(`  Health Check (GET):     http://localhost:${PORT}/api/health`);
  console.log("----------------------------------------------------");
  console.log(`CASES & INTERACTIONS (prefixed with /api/cases):`);
  console.log(`  Get All Cases (GET):         /api/cases`);
  console.log(`  Start Case (GET):          /api/cases/:caseId/start`);
  console.log(
    `  History Categories (GET):  /api/cases/:caseId/history-categories`
  );
  console.log(
    `  History Questions (GET):   /api/cases/:caseId/history-questions/:categoryId`
  );
  console.log(`  Ask Question (POST):       /api/cases/:caseId/ask-question`);
  console.log(`    -> Body: { "questionId": "..." }`);
  console.log("----------------------------------------------------");
  console.log(`EXAMINATION SKILLS (prefixed with /api/cases, but general):`);
  console.log(
    `  Exam Skill Categories (GET): /api/cases/exam-skill-categories`
  );
  console.log(
    `  Exam Skills by Cat (GET):  /api/cases/exam-skills/:categoryId`
  );
  console.log(
    `  Exam Skill MCQs (GET):     /api/cases/exam-skill/:skillId/mcqs`
  );
  console.log(
    `  Perform Exam (POST):       /api/cases/:caseId/perform-exam/:skillId`
  );
  console.log(`    -> Body: { "mcqAnswers": { ... } } (if skill has MCQs)`);
  console.log("----------------------------------------------------");
  console.log("Access example URLs by prepending http://localhost:3000");
  console.log("For POST requests, use a tool like Postman or Insomnia.");
  console.log("====================================================");
  console.log("----------------------------------------------------");
  console.log(`LAB INVESTIGATIONS (prefixed with /api/cases):`);
  console.log(`  Lab Categories (GET):        /api/cases/lab-categories`);
  console.log(
    `  Get All Labs (GET):          /api/cases/labs (support ?category=...&search=...)`
  );
  console.log(
    `  Lab Unlock Conditions (GET): /api/cases/:caseId/lab-unlock-conditions`
  );
  console.log(`  Order Lab (POST):            /api/cases/:caseId/order-lab`);
  console.log(`    -> Body: { "labId": "..." }`);
});
