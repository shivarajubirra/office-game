// src/App.js
import React, { useEffect, useRef, useState } from "react";
import "./index.css";
// add these near other imports
const SHEETDB_URL = "https://sheetdb.io/api/v1/y4j0ab8cgggc0"; 




/*
  GIS Quiz Contest - App.js
  - 5 levels x 6 questions
  - WebAudio for all sounds
  - Animated score, card flip, wrong X animation
  - Leaderboard in localStorage (hidden until finish)
  - Simple confetti, inline SVG logo & background
  - Two characters: Inspector Spatial, Captain Buffer
*/

const LEVEL_NAMES = [
  "Topology Ninja",
  "Raster Ranger",
  "Feature Class Fighter",
  "Geoprocessing Gladiator",
  "Spatial Sensei",
];

function shuffleQuestionOptions(question) {
  const optionList = question.opts.map((opt, index) => ({
    opt,
    index
  }));

  const shuffled = shuffleArray(optionList);

  const newCorrectIndex = shuffled.findIndex(o => o.index === question.a);

  return {
    ...question,
    opts: shuffled.map(o => o.opt),
    a: newCorrectIndex
  };
}

function shuffleArray(arr) {
  return arr
    .map(a => ({ sort: Math.random(), value: a }))
    .sort((a, b) => a.sort - b.sort)
    .map(a => a.value);
}
// Minimal sample question set (6 per level). Replace or extend as needed.
const QUESTIONS = {
  1: [
    { q: "What is a raster?", opts: ["Vector line", "Grid of cells", "Legend", "Projection"], a: 1 },
    { q: "Which software is open-source?", opts: ["ArcGIS Pro", "QGIS", "ERDAS", "MapInfo"], a: 1 },
    { q: "An attribute is:", opts: ["Map symbology", "CRS", "Non-spatial info", "Tile server"], a: 2 },
    { q: "Georeferencing does:", opts: ["Add metadata", "Link image to coords", "Styling", "Buffering"], a: 1 },
    { q: "Common vector file:", opts: [".tif", ".shp", ".jpg", ".mp4"], a: 1 },
    { q: "Coordinate degrees used in:", opts: ["Projected", "Geographic", "UTM", "StatePlane"], a: 1 },
  ],
  2: [
    { q: "Buffer operation creates:", opts: ["Cuts", "Polygons around", "Projection change", "Slope"], a: 1 },
    { q: "Geodatabase file type:", opts: [".tif", ".gdb", ".jpg", ".mpk"], a: 1 },
    { q: "Snapping helps with:", opts: ["Aligning vertices", "Rasterizing", "Symbology", "Tiles"], a: 0 },
    { q: "ArcGIS JS common widget:", opts: ["ScaleBar", "Search", "Grid", "Clip"], a: 1 },
    { q: "QGIS processing toolbox is similar to:", opts: ["ArcToolbox", "Layout", "FieldCalc", "DBManager"], a: 0 },
    { q: "Geocoding transforms:", opts: ["Address→coords", "Raster→vector", "Symbology", "CRS"], a: 0 },
  ],
  3: [
    { q: "Topology handles:", opts: ["Rendering", "Spatial relationships", "Raster math", "Styling"], a: 1 },
    { q: "Intersect tool keeps:", opts: ["Common area", "Union of all", "Difference", "Raster tiles"], a: 0 },
    { q: "Spatial index helps:", opts: ["Faster queries", "Color maps", "Export", "CRS"], a: 0 },
    { q: "Dissolve operation:", opts: ["Split", "Aggregate by attribute", "Buffer", "Reproject"], a: 1 },
    { q: "Feature service supports:", opts: ["Editing via REST", "Tiles only", "Images", "Desktop only"], a: 0 },
    { q: "Map container class in ArcGIS JS:", opts: ["Map", "MapView", "SceneView", "Graphic"], a: 0 },
  ],
  4: [
    { q: "Portal for ArcGIS is for:", opts: ["Hosting web maps", "Desktop editing", "Raster tiles", "Encoding"], a: 0 },
    { q: "ArcGIS Enterprise core:", opts: ["ArcGIS Server", "ArcGIS Pro", "ArcMap", "QGIS Server"], a: 0 },
    { q: "OAuth2 is used for:", opts: ["Auth tokens", "Rasterization", "Tile caching", "Symbology"], a: 0 },
    { q: "LayerList widget allows:", opts: ["Toggle layers", "Geocoding", "Editing", "Tile export"], a: 0 },
    { q: "REST stands for:", opts: ["Representational State Transfer", "Raster State", "Remote Tiles", "Render API"], a: 0 },
    { q: "Tile server commonly uses:", opts: ["Pre-rendered tiles", "Excel", "Photoshop", "Text files"], a: 0 },
  ],
  5: [
    { q: "watch/watchUtils used in:", opts: ["ArcGIS JS reactive", "CSS", "SQL", "ArcMap"], a: 0 },
    { q: "Hosted Feature Layer 'sync' enables:", opts: ["Offline replication", "Tiles only", "No edits", "Image exports"], a: 0 },
    { q: "Image Server handles:", opts: ["Large imagery", "Geocoding", "Feature edits", "Legends"], a: 0 },
    { q: "Arcade is for:", opts: ["Expressions in popups", "Routing", "Tile caching", "CRS conversion"], a: 0 },
    { q: "Vector tiles are good for:", opts: ["Styling & performance", "Slower rendering", "No interactivity", "Only rasters"], a: 0 },
    { q: "CORS enables:", opts: ["Cross-origin browser requests", "Faster tiles", "Rendering", "Auth removal"], a: 0 },
  ],
};

function makeAudioContext() {
  try { return new (window.AudioContext || window.AudioContext)(); } catch { return null; }
}

// small helper: play a simple tone (frequency, duration, type)
function playTone(ctx, freq = 440, duration = 0.15, type = "sine", gain = 0.08) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + duration);
}
function getMotivation(score) {
  if (score >= 28) 
    return "🗺️ You’re mapping at a level where even ArcGIS Pro stops crashing out of respect!";

  if (score >= 24) 
    return "🛰️ Your accuracy is so sharp that GPS satellites probably recalibrated themselves!";

  if (score >= 20) 
    return "💾 Fantastic! Even your geoprocessing tools would run without 'Not Responding' for you!";

  if (score >= 16) 
    return "📊 Nice work! Your answers are cleaner than a perfectly repaired geometry!";

  if (score >= 12) 
    return "🧭 Good job! With a bit more practice, your spatial join will stop producing NULLs!";

  if (score >= 8) 
    return "🌋 Not bad! You’re close — just avoid those 'empty outputs' like a failed buffer run!";

  if (score >= 4) 
    return "📉 Hmm… looks like your  map projection needs a quick transformation!";

  return "😂 Did you take the quiz while your brain was still loading shapefiles? Try again, champion!";
}



// simple click-like short noise (using noise buffer)
function playBuzzer(ctx, duration = 0.2) {
  if (!ctx) return;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const g = ctx.createGain();
  g.gain.value = 0.08;
  noise.connect(g);
  g.connect(ctx.destination);
  noise.start();
  noise.stop(ctx.currentTime + duration);
}

export default function App() {
  const [level, setLevel] = useState(1);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'correct'|'wrong'|null
  const [playerName, setPlayerName] = useState("");
  /* const [leaderboard, setLeaderboard] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gis_leaderboard")) || []; } catch { return []; }
  }); */
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false); // hidden until finish
  const [musicOn, setMusicOn] = useState(true);
  const [showHowTo, setShowHowTo] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  //const [character, setCharacter] = useState("Inspector Spatial"); // only two options
  const audioCtxRef = useRef(null);

  // track perfect streak per level
  const perfectTrackerRef = useRef(Array(6).fill(true)); // length 6 -> questions per level
  const [showStartPopup, setShowStartPopup] = useState(true);
  const [introName, setIntroName] = useState("");
  const [showLeaderboardButton, setShowLeaderboardButton] = useState(false);
  const [showFinalPopup, setShowFinalPopup] = useState(false);
  const shuffledQuestionsRef = useRef(null);
  const [quizFinished, setQuizFinished] = useState(false);


  if (!shuffledQuestionsRef.current) {
    shuffledQuestionsRef.current = {
      1: shuffleArray(QUESTIONS[1].map(q => shuffleQuestionOptions(q))),
      2: shuffleArray(QUESTIONS[2].map(q => shuffleQuestionOptions(q))),
      3: shuffleArray(QUESTIONS[3].map(q => shuffleQuestionOptions(q))),
      4: shuffleArray(QUESTIONS[4].map(q => shuffleQuestionOptions(q))),
      5: shuffleArray(QUESTIONS[5].map(q => shuffleQuestionOptions(q))),
    };
  }


  // initialize AudioContext lazily
  useEffect(() => {
    if (!audioCtxRef.current && typeof window !== "undefined") {
      audioCtxRef.current = makeAudioContext();
      
    }
    return () => stopBackgroundLoop();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
  loadLeaderboard();
}, []);

  // Background oscillator loop
  const bgLoopRef = useRef(null);
  function startBackgroundLoop() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    stopBackgroundLoop();
    const master = ctx.createGain();
    master.gain.value = 0.03;
    master.connect(ctx.destination);
    // simple 3-note loop
    const freqs = [220, 277.18, 329.63];
    let i = 0;
    bgLoopRef.current = setInterval(() => {
      const f = freqs[i % freqs.length];
      playTone(ctx, f, 0.4, "sine", 0.03);
      i++;
    }, 450);
  }
  function stopBackgroundLoop() {
    if (bgLoopRef.current) {
      clearInterval(bgLoopRef.current);
      bgLoopRef.current = null;
    }
  }
  

  function playFlip() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    // quick descending arpeggio
    playTone(ctx, 880, 0.06, "triangle", 0.04);
    setTimeout(() => playTone(ctx, 660, 0.06, "triangle", 0.04), 60);
  }
  function playCorrect() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    playTone(ctx, 880, 0.12, "sine", 0.08);
    setTimeout(() => playTone(ctx, 1100, 0.12, "sine", 0.07), 120);
  }
  function playWrong() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    playBuzzer(ctx, 0.18);
  }
  function playLevelComplete() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    playTone(ctx, 440, 0.25, "sine", 0.08);
    setTimeout(() => playTone(ctx, 660, 0.25, "sine", 0.08), 250);
  }
  function playGameFinish() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    playTone(ctx, 660, 0.2, "sine", 0.09);
    setTimeout(() => playTone(ctx, 880, 0.25, "sine", 0.09), 240);
    setTimeout(() => playTone(ctx, 1100, 0.25, "sine", 0.09), 500);
  }

  // Animated numeric score (increment by 1 with small tween)
  const animatedScoreRef = useRef(null);
  useEffect(() => {
    if (!animatedScoreRef.current) return;
    // animate by briefly scaling
    animatedScoreRef.current.classList.remove("score-burst");
    void animatedScoreRef.current.offsetWidth;
    animatedScoreRef.current.classList.add("score-burst");
  }, [score]);

  // question handler
  function handleOptionClick(i) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    playFlip();
    const q = shuffledQuestionsRef.current[level][qIdx];

    const correct = i === q.a;
    // mark perfect tracker for this question index in level
    perfectTrackerRef.current[qIdx] = correct;
    if (correct) {
      setFeedback("correct");
      playCorrect();
      // +1 per correct
      setScore((s) => s + 1);
    } else {
      setFeedback("wrong");
      playWrong();
    }

    // short delay then next question or level complete
    setTimeout(() => {
      setAnswered(false);
      setSelected(null);
      setFeedback(null);
      if (qIdx < 5) {
        setQIdx((x) => x + 1);
      } else {
        // level completed
        const perfect = perfectTrackerRef.current.every((v) => v === true);
        if (perfect) {
          // +5 bonus
          setScore((s) => s + 5);
        }
        // show confetti and play sound
        setConfettiActive(true);
        playLevelComplete();
        setTimeout(() => setConfettiActive(false), 2000);
        // reset perfect tracker for next level
        perfectTrackerRef.current = Array(6).fill(true);
        if (level < 5) {
          setLevel((l) => l + 1);
          setQIdx(0);
        } else {
           // === finished whole quiz ===
          playGameFinish();
          // Auto-save score once quiz completes
          saveScore(true);
          // show leaderboard panel
          setShowLeaderboard(false);
          // enable the “View Leaderboard” button
          setShowLeaderboardButton(true);
          setShowFinalPopup(true);
          setQuizFinished(true);

        }
      }
    }, 900);
  }

 
  /* function saveScore(auto = false) {
  if (!playerName) {
    if (!auto) alert("Enter your display name before saving your score.");
    return;
  }

  // ✅ Check if username already exists (only first score allowed)
  const exists = leaderboard.find(e => e.name.toLowerCase() === playerName.toLowerCase());
  if (exists) {
    if (!auto) alert("You have already played! Only your first score is kept.");
    return;
  }

  const entry = { name: playerName, score, date: Date.now() };
  const updated = [...leaderboard, entry];

  // ----------------------------------------------------
  // ✅ Sort by score descending
  updated.sort((a, b) => b.score - a.score);

  // ----------------------------------------------------
  // ✅ Get cutoff score for rank 15
  const top15 = updated.slice(0, 15);
  const cutoffScore = top15.length === 15 ? top15[14].score : null;

  // ----------------------------------------------------
  // ✅ Include ties at 15th position
  const finalList = updated.filter(e => cutoffScore === null || e.score >= cutoffScore);

  setLeaderboard(finalList);
  localStorage.setItem("gis_leaderboard", JSON.stringify(finalList));

  if (!auto) {
    alert("Score saved! 🎉");
  }
}  */
/* async function saveScore(auto = false) {
  if (!playerName) {
    if (!auto) alert("Enter your display name before saving your score.");
    return;
  }

  // Check only if not auto-save
  if (!auto) {
    const exists = leaderboard.find(e => e.Name?.toLowerCase() === playerName.toLowerCase());
    if (exists) {
      alert("You have already played! Only your first score is kept.");
      return;
    }
  }

  const payload = {
    data: {
      Name: playerName,
      Score: score,
      Timestamp: new Date().toISOString()
    }
  };

  try {
    await fetch(SHEETDB_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!auto) alert("Score saved to online leaderboard! 🎉");

    // Reload leaderboard after saving
    loadLeaderboard();

  } catch (err) {
    console.error("SheetDB save error:", err);
    alert("Failed to save score!");
  }
} */

async function saveScore(auto = false) {
  if (!playerName) {
    if (!auto) alert("Enter your display name before saving your score.");
    return;
  }
  try {

    // 🔍 1. Check existing entries from SheetDB
    const res = await fetch(SHEETDB_URL);
    const existing = await res.json();

    const nameExists = existing.some(
      e => e.Name.toLowerCase() === playerName.toLowerCase()
    );

    // ❌ If duplicate → do NOT save again
    if (nameExists) {
      if (!auto) alert("This name already exists! You already played. Only first score is saved.");
      return;
    }

    // Prevent duplicate names (do this only on manual save)
    if (!auto) {
      const exists = leaderboard.find(e => e.Name.toLowerCase() === playerName.toLowerCase());
      if (exists) {
        alert("You already played. Only first score is saved.");
        return;
      }
    }

    // Correct SheetDB format
    const payload = {
      data: [
        {
          Name: playerName,
          Score: score,
          Timestamp: new Date().toLocaleString()
        }
      ]
    };

      await fetch(SHEETDB_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!auto) alert("Score saved successfully!");

      // Refresh leaderboard after saving
      loadLeaderboard();

  } catch (err) {
    console.error("SheetDB save error:", err);
    alert("Error saving leaderboard score!");
  }
}


  // create inline funny SVG background and logo
  const LogoSVG = (
    <svg width="48" height="48" viewBox="0 0 64 64" aria-hidden>
      <rect rx="12" width="64" height="64" fill="#2b6cb0" />
      <g transform="translate(8 8)" fill="#fff">
        <circle cx="16" cy="12" r="6" fill="#9ae6b4" />
        <rect x="2" y="28" width="28" height="6" rx="2" fill="#fff" opacity="0.12" />
      </g>
    </svg>
  );

  // small UI render helpers
  //const currentQuestion = QUESTIONS[level][qIdx];
  const currentQuestion = shuffledQuestionsRef.current[level][qIdx];
  /* async function loadLeaderboard() {
  try {
    const res = await fetch(SHEETDB_URL);
    let data = await res.json();

    // Fix types
    data = data.map(e => ({
      ...e,
      Score: Number(e.Score || 0)
    }));

    // Sort by score desc
    data.sort((a, b) => b.Score - a.Score);

    setLeaderboard(data);
  } catch (err) {
    console.error("Load leaderboard error:", err);
  }
} */

async function loadLeaderboard() {
  try {
    const res = await fetch(SHEETDB_URL);
    let data = await res.json();

    // Convert Score to number
    data = data.map(e => ({
      ...e,
      Score: Number(e.Score || 0)
    }));

    // Sort highest → lowest
    data.sort((a, b) => b.Score - a.Score);

    setLeaderboard(data);
  } catch (err) {
    console.error("Load leaderboard error:", err);
  }
}


  return (
    <div className="app-root">

      {/* ================================ */}
      {showStartPopup && (
      <div className="start-popup">
        <div className="start-popup-content" style={{ 
         /*  backgroundImage: "url('/images/background.png')", */
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}>
          
          <h2 className="start-title">🗺️ Welcome to GIS Quest!</h2>

          <input
            className="start-input"
            type="text"
            placeholder="Enter your name"
            value={introName}
            onChange={(e) => setIntroName(e.target.value)}
          />

          <button
            className="start-btn"
            onClick={() => {
              if (!introName.trim()) {
                alert("Please enter your name to begin!");
                return;
              }
              setPlayerName(introName);
              setShowStartPopup(false);
              //resetQuiz();
            }}
          >
            Start Quiz 🚀
          </button>
        </div>
      </div>
    )}

      {/* ================================ */}
      <header className="topbar">
        <div className="logo-row">
          <div className="logo-wrap">{LogoSVG}</div>
          <div>
            <div className="title">Map Your Mind! — iSpatialTec</div>
            <div className="subtitle">Where only the sharpest minds get spatially verified!</div>
          </div>
        </div>
        {/* shiva */}
        <div className="save-block">
              <input placeholder="Your display name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
              {/* <div className="save-row">
                <button className="btn" onClick={saveScore}>Save Score</button>
                <button className="btn" onClick={() => { setLeaderboard([]); localStorage.removeItem("gis_leaderboard"); }}>Clear Scores</button>
              </div> */}
            </div>
        
      </header>

      <main className="content">
        {/* <aside className="left-panel">
          <div className="card">
            <div className="level-header">
              <div>
                <div className="level-title">Level {level} — {LEVEL_NAMES[level - 1]}</div>
                 <div className="level-caption">
                  {(() => {
                    switch (level) {
                      case 1:
                        return "Think of a Topology Ninja as someone who ensures your map geometry is perfectly connected and clean!";
                      case 2:
                        return "A Raster Ranger explores the pixel wilderness — decoding information hidden in every grid cell.";
                      case 3:
                        return "Think of a Feature Class Fighter as a vector warrior who organizes, defends, and manages every point, line, and polygon on the map battlefield!";
                      case 4:
                        return "Think of a Geoprocessing Gladiator as a GIS warrior who wields analytical tools like swords — slicing, merging, and transforming data to reveal spatial truths!";
                      case 5:
                        return "Think of a Spatial Sensei as the ultimate GIS master — calm, wise, and able to see the invisible patterns that shape our world!";
                      default:
                        return "";
                    }
                  })()}
                </div>

                <div className="qcount">Question {qIdx + 1} of 6</div>
              </div>
              <div className="score-circle" ref={animatedScoreRef}>{score}</div>
            </div>

            <div className="question-area">
              <div className={`question-card ${feedback === "correct" ? "correct" : ""} ${feedback === "wrong" ? "wrong" : ""}`}>
                <div className="question-text">{currentQuestion.q}</div>

                <div className="options">
                  {currentQuestion.opts.map((opt, i) => {
                    const isSelected = selected === i;
                    const isCorrect = i === currentQuestion.a;
                    return (
                      <button
                        key={i}
                        className={`option ${isSelected ? "selected" : ""} ${answered && isCorrect ? "reveal-correct" : ""}`}
                        onClick={() => handleOptionClick(i)}
                        disabled={answered}
                      >
                        <span className="opt-text">{opt}</span>
                        <span className="opt-mark">
                          {answered && isSelected ? (feedback === "correct" ? "✓" : "✕") : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="hint">Hint: Think about GIS basics.</div>
              </div>
            </div>

            ///////////// <div className="card-actions">
              <button className="btn" onClick={() => {  if (!answered) { setAnswered(false); setSelected(null); setFeedback(null); setQIdx(qIdx < 5 ? qIdx + 1 : qIdx); } }}>Skip</button>
              <button className="btn" onClick={() => {  if (!answered) { setAnswered(true); setFeedback("wrong"); setSelected(null); } }}>Reveal (no points)</button>
            </div> /////////////
          </div>
        </aside> */}
        <aside className="left-panel">
        {!quizFinished ? (
          <div className="card">
            {/* existing question UI */}
            ...
          </div>
        ) : (
          <div className="card end-card">
            <h2 style={{ textAlign: "center" }}>🎉 Happy GIS Day! 🎉</h2>
            <img 
              src="https://i.imgur.com/zYp6e0f.png" 
              alt="Happy GIS Day" 
              style={{ width: "100%", borderRadius: "12px", marginTop: "10px" }}
            />
            <p style={{ textAlign: "center", marginTop: "12px" }}>
              Thanks for playing and celebrating GIS Day with us! 🌍
            </p>
          </div>
        )}
      </aside>


        <aside className="right-panel">
          <div className="card">
            <h4>GIS Quest: Master the Map</h4>
            <ul className="controls-list">
              <li>🎮 Levels of GIS Mastery:</li>
                {/* {LEVEL_NAMES.map((n, i) => (<li key={i}>{i + 1} — {n}</li>))} */}
                <li> — Topology Ninja📐</li>
                <li> — Raster Ranger🗺️</li>
                <li> — Feature Class Fighter⚔️</li>
                <li> — Geoprocessing Gladiator🛠️</li>
                <li> — Spatial Sensei🌍</li>
              
            </ul>

            <div className="action-block">
              {!showLeaderboard ? (
                <div className="muted">Leaderboard will show after you finish the quiz.</div>
              ) : (
                // <div>
                //   <h5>Leaderboard</h5>
                //   {leaderboard.length === 0 && <div>No scores yet</div>}
                //   {/* <ol>
                //     {leaderboard.map((e, idx) => (
                //       <li key={idx}>{idx + 1}. {e.name} — {e.score}</li>
                //     ))}
                //   </ol> */}
                //   {/* <table className="leaderboard-table">
                //     <thead>
                //       <tr>
                //         <th>Rank</th>
                //         <th>Name</th>
                //         <th>Score</th>
                //         <th>Medal</th>
                //       </tr>
                //     </thead>
                //     <tbody>
                //       {leaderboard.map((e, idx) => {
                //         let medal = "";
                //         if (idx === 0) medal = "🥇";
                //         else if (idx === 1) medal = "🥈";
                //         else if (idx === 2) medal = "🥉";

                //         return (
                //           <tr key={idx}>
                //             <td>{idx + 1}</td>
                //             <td>{e.name}</td>
                //             <td>{e.score}</td>
                //             <td>{medal}</td>
                //           </tr>
                //         );
                //       })}
                //     </tbody>
                //   </table> */}

                // </div>
                console.log("Leaderboard is hidden")
              )}
            </div>

          </div>
          {/* {showLeaderboardButton && (
              <>
                <p className="unlock-text">
                  🏁 <strong>Mission accomplished!</strong><br />
                  See how your skills compare to other GIS warriors.
                </p>

                <button
                  className="btn"
                  
                  onClick={() => setShowLeaderboard(prev => !prev)}
                  style={{ marginTop: "12px" }}
                >
                  🏆 View Leaderboard
                </button>
              </>
          )} */}
          {showLeaderboardButton && (
          <>
            {/* Text is visible only when leaderboard is hidden */}
            {!showLeaderboard && (
              <p className="unlock-text">
                🏁 <strong>Mission accomplished!</strong><br />
                See how your skills compare to other GIS warriors.
              </p>
            )}

            <button
              className="btn"
              onClick={() => setShowLeaderboard(prev => !prev)}
              style={{ marginTop: "12px" }}
            >
              🏆 View Leaderboard
            </button>

            {/* Leaderboard table moved BELOW the button */}
            {showLeaderboard && (
              <div style={{ marginTop: "16px" }}>
                <h5>Leaderboard</h5>
                {leaderboard.length === 0 && <div>No scores yet</div>}

                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Name</th>
                      <th>Score</th>
                      <th>Medal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((e, idx) => {
                      let medal = "";
                      if (idx === 0) medal = "🥇";
                      else if (idx === 1) medal = "🥈";
                      else if (idx === 2) medal = "🥉";

                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{e.Name}</td>
                          <td>{e.Score}</td>
                          <td>{medal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}


        </aside>

      </main>

      {/* Confetti overlay */}
      {confettiActive && (
        <div className="confetti">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="confetti-piece" style={{ left: Math.random() * 100 + "%", background: `hsl(${Math.random() * 360} 80% 60%)`, transform: `rotate(${Math.random() * 360}deg)` }} />
          ))}
        </div>
      )}

      {/* How to play modal */}
      {showHowTo && (
        <div className="modal">
          <div className="modal-card">
            <h3>How to play</h3>
            <ul>
              <li>5 levels × 6 questions each.</li>
              <li>Correct answer = +1 points.</li>
              <li>Wrong answer = 0 points.</li>
              <li>Bonus +5 if you get all 6 right in a level.</li>
              <li>Leaderboard visible after finishing the quiz.</li>
              <li>---------------------------------------------------</li>
              <li>For each question, you’ll see 4 options</li>
              <li>Click or tap on one option that you think is correct.</li>
              <li>✅ If it’s Correct, the game shows “Correct!”</li>
              <li>❌ If it’s Wrong, the game shows “Wrong!”</li>
              <li>and highlights the right answer.</li>
              <li>Try to get the highest score possible!</li>
              <li>Have fun and good luck! 🍀</li>
              <li>---------------------------------------------------</li>
            </ul>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowHowTo(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Final Quiz Completion Popup */}
{showFinalPopup && (
  <div className="modal">
    <div className="modal-card final-popup">

      <h2>🎉 Congratulations, {playerName}! 🎉</h2>
      <p className="final-score">You scored: <strong>{score}</strong></p>

      <p className="motivation-text">{getMotivation(score)}</p>

      <p className="unlock-text">
        📜 <strong>Leaderboard unlocked!</strong> 🎯<br />
        You’ve completed your Quiz. Check your final rank on the Leaderboard!
      </p>

      {/* Celebration confetti */}
      <div className="confetti">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="confetti-piece" style={{
            left: Math.random() * 100 + "%",
            background: `hsl(${Math.random() * 360} 80% 60%)`,
            transform: `rotate(${Math.random() * 360}deg)`
          }} />
        ))}
      </div>

      <button
        className="btn"
        onClick={() => 
          { setShowFinalPopup(false)
            setShowLeaderboard(false);  // leaderboard stays hidden
            setShowLeaderboardButton(true); // show unlock text + button
          }}
        style={{ marginTop: "10px" }}
      >
        Done
      </button>
    </div>
  </div>
)}


      {/* small footer */}
      <footer className="footer">Made for GIS Day @ iSpatialTec — Remember to save your ArcGIS projects 😅</footer>
    </div>
  );
}
