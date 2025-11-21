import logo from './logo.svg';
import './App.css';
import { useState } from "react";

/* 
function App() {
  return (
    <div className="App">
      <h1>Phishing Email Game</h1>
      <header className="App-header">
        <p>Hello! This is our main homepage.</p>
        <button>Start Game</button>
      </header>
    </div>
  );
}
*/

function App() {
  const [started, setStarted] = useState(false);
  const [feedback, setFeedback] = useState("");

  const email = {
    from: "support@micros0ft.com",
    subject: "Account Suspended",
    body: "Your account will be suspended unless you verify it here: http://micros0ft-secure.com",
    correct: "phishing"
  };

  const handleChoice = (choice) => {
    if (choice === email.correct) {
      setFeedback("✅ Correct! This was a phishing email.");
    } else {
      setFeedback("❌ Wrong! This was a real email.");
    }
  };

  return (
    <div>
      {!started ? (
        <div>
          <h1>Phishing Email Game</h1>
          <p>Welcome! Click below to start.</p>
          <button onClick={() => setStarted(true)}>Start Game</button>
        </div>
      ) : (
        <div>
          <h2>{email.subject}</h2>
          <p><b>From:</b> {email.from}</p>
          <p>{email.body}</p>
          <button onClick={() => handleChoice("phishing")}>Phishing</button>
          <button onClick={() => handleChoice("legit")}>Legit</button>
          <p>{feedback}</p>
        </div>
      )}
    </div>
  );
}

export default App;