import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import { ncertCurriculum } from "./ncertData.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error(
    "Missing JWT_SECRET. Set it in your .env file (use a long random string) before starting the server."
  );
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// In-memory mock user store — resets on every server restart.
// Replace with a real database (PostgreSQL/MongoDB/Supabase) before using this for real users.
const users = [];

// 1. Auth: Sign Up
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ error: "User already registered." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = { id: users.length + 1, name, email, passwordHash };
  users.push(newUser);
  res.json({ message: "Registration successful. Please log in." });
});

// 2. Auth: Log In
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = users.find((u) => u.email === email);

  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !passwordMatches) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: "24h",
  });
  res.json({ token, user: { name: user.name, email: user.email } });
});

// Middleware: Verify Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied. Token missing." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token is invalid or expired." });
    req.user = user;
    next();
  });
};

// 3. Quiz API: Fetch Taxonomy & Questions (Protected)
app.get("/api/classes", authenticateToken, (req, res) => {
  res.json(Object.keys(ncertCurriculum));
});

app.get("/api/subjects", authenticateToken, (req, res) => {
  const { className } = req.query;
  if (!ncertCurriculum[className]) return res.status(404).json({ error: "Class not found" });
  res.json(Object.keys(ncertCurriculum[className]));
});

app.get("/api/chapters", authenticateToken, (req, res) => {
  const { className, subject } = req.query;
  if (!ncertCurriculum[className]?.[subject]) return res.status(404).json({ error: "Subject not found" });
  res.json(Object.keys(ncertCurriculum[className][subject]));
});

app.get("/api/questions", authenticateToken, (req, res) => {
  const { className, subject, chapter } = req.query;
  const questions = ncertCurriculum[className]?.[subject]?.[chapter];
  if (!questions) return res.status(404).json({ error: "Questions not found" });

  // Return questions without disclosing answers directly to the client
  const sanitized = questions.map(({ id, question, options }) => ({ id, question, options }));
  res.json(sanitized);
});

// 4. Submit & Score
app.post("/api/submit", authenticateToken, (req, res) => {
  const { className, subject, chapter, responses } = req.body ?? {}; // responses: { [questionId]: selectedOptionIndex }
  const originalQuestions = ncertCurriculum[className]?.[subject]?.[chapter];

  if (!originalQuestions) return res.status(404).json({ error: "Exam data missing." });

  let score = 0;
  const results = originalQuestions.map((q) => {
    const isCorrect = responses?.[q.id] === q.answer;
    if (isCorrect) score++;
    return {
      id: q.id,
      question: q.question,
      userAnswer: responses?.[q.id] ?? null,
      correctAnswer: q.answer,
      explanation: q.explanation,
      isCorrect,
    };
  });

  res.json({ total: originalQuestions.length, score, results });
});

app.listen(PORT, () => console.log(`Quiz service live on port ${PORT}`));
