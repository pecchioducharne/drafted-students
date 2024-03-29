import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MultiStepForm from "./components/MultiStepForm";
import VideoRecorderPage from "./components/VideoRecorderPage";
import VideoRecorderPage2 from "./components/VideoRecorderPage2";
import VideoRecorderPage3 from "./components/VideoRecorderPage3";
import { UserProvider } from "./components/UserContext";

const App = () => {
  return (
    <Router>
      <UserProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<MultiStepForm />} />
            <Route path="/video-recorder" element={<VideoRecorderPage />} />
            <Route path="/video-recorder2" element={<VideoRecorderPage2 />} />
            <Route path="/video-recorder3" element={<VideoRecorderPage3 />} />
          </Routes>
        </div>
      </UserProvider>
    </Router>
  );
};

export default App;
