import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "" });
  const [isRegistering, setIsRegistering] = useState(false);

  // Filter selections
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");

  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  // Authentication
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? "/register" : "/login";
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authForm),
    });
    const data = await res.json();
    if (res.ok) {
      if (!isRegistering) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
      } else {
        alert("Registration complete! Please sign in.");
        setIsRegistering(false);
      }
    } else {
      alert(data.error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  // Load Classes
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/classes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setClasses);
  }, [token]);

  // Load Subjects on Class change
  useEffect(() => {
    if (!selectedClass) return;
    setSelectedSubject("");
    setSelectedChapter("");
    fetch(`${API_BASE}/subjects?className=${encodeURIComponent(selectedClass)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setSubjects);
  }, [selectedClass]);

  // Load Chapters on Subject change
  useEffect(() => {
    if (!selectedSubject) return;
    setSelectedChapter("");
    fetch(`${API_BASE}/chapters?className=${encodeURIComponent(selectedClass)}&subject=${encodeURIComponent(selectedSubject)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setChapters);
  }, [selectedSubject]);

  // Load Questions on Chapter change
  const startQuiz = () => {
    setResult(null);
    setAnswers({});
    fetch(
      `${API_BASE}/questions?className=${encodeURIComponent(selectedClass)}&subject=${encodeURIComponent(selectedSubject)}&chapter=${encodeURIComponent(selectedChapter)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => r.json())
      .then(setQuestions);
  };

  const submitQuiz = async () => {
    const res = await fetch(`${API_BASE}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        className: selectedClass,
        subject: selectedSubject,
        chapter: selectedChapter,
        responses: answers,
      }),
    });
    const data = await res.json();
    setResult(data);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <form onSubmit={handleAuth} className="bg-white p-8 rounded-xl shadow-md max-w-sm w-full space-y-4">
          <h2 className="text-xl font-bold text-slate-800">{isRegistering ? "Register Student" : "Sign In to NCERT Portal"}</h2>
          {isRegistering && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border p-2 rounded"
              onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            className="w-full border p-2 rounded"
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border p-2 rounded"
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            required
          />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition">
            {isRegistering ? "Sign Up" : "Log In"}
          </button>
          <p className="text-sm text-center text-slate-500 cursor-pointer" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? "Already have an account? Sign in" : "Need an account? Register"}
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="font-bold text-lg text-blue-600 tracking-wide">NCERT Interactive Quiz Bank</h1>
        <button onClick={logout} className="text-sm text-red-500 font-semibold hover:underline">Log Out</button>
      </nav>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Cascade Selectors */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 shadow-sm">
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="border p-2 rounded">
            <option value="">Select Class</option>
            {classes.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>

          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!selectedClass} className="border p-2 rounded disabled:opacity-50">
            <option value="">Select Subject</option>
            {subjects.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>

          <select value={selectedChapter} onChange={(e) => setSelectedChapter(e.target.value)} disabled={!selectedSubject} className="border p-2 rounded disabled:opacity-50">
            <option value="">Select Chapter</option>
            {chapters.map((ch) => (<option key={ch} value={ch}>{ch}</option>))}
          </select>

          <button onClick={startQuiz} disabled={!selectedChapter} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium rounded p-2 transition">
            Start Quiz
          </button>
        </section>

        {/* Quiz Flow */}
        {questions.length > 0 && !result && (
          <section className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
            <h3 className="font-semibold text-lg">{selectedChapter} - Questions</h3>
            {questions.map((q, idx) => (
              <div key={q.id} className="space-y-2 border-b pb-4 last:border-0">
                <p className="font-medium text-slate-900">{idx + 1}. {q.question}</p>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {q.options.map((opt, optIdx) => (
                    <label key={optIdx} className="flex items-center gap-2 text-sm bg-slate-50 p-2.5 rounded border border-slate-200 cursor-pointer hover:bg-blue-50">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[q.id] === optIdx}
                        onChange={() => setAnswers({ ...answers, [q.id]: optIdx })}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={submitQuiz} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded">
              Submit Answers
            </button>
          </section>
        )}

        {/* Scorecard */}
        {result && (
          <section className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-bold text-xl">Score Report</h3>
              <span className="text-2xl font-black text-blue-600">{result.score} / {result.total}</span>
            </div>
            <div className="space-y-4">
              {result.results.map((r, idx) => (
                <div key={r.id} className={`p-4 rounded-lg border ${r.isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                  <p className="font-semibold">{idx + 1}. {r.question}</p>
                  <p className="text-sm mt-1">Your Answer: <span className="font-medium">{r.userAnswer !== null ? questions[idx]?.options[r.userAnswer] : "Skipped"}</span></p>
                  {!r.isCorrect && (
                    <p className="text-sm text-emerald-700 mt-0.5">Correct Answer: <span className="font-medium">{questions[idx]?.options[r.correctAnswer]}</span></p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">Explanation: {r.explanation}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
