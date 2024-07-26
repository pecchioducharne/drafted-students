import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MultiStepForm from "./components/MultiStepForm";
import { UserProvider } from "./components/UserContext";

const App = () => {
  return (
    <Router>
      <UserProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<MultiStepForm />} />
          </Routes>
        </div>
      </UserProvider>
    </Router>
  );
};

export default App;
