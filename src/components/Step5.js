import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const buttonStyles = {
    borderRadius: '8px',
    backgroundColor: '#207a56',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    cursor: 'pointer'
};

const Step5 = ({ setStep, nextStep, previousStep }) => (
    <>
    <div>Step 5</div>
    <h2>Let's record your video resume</h2>
            <h3>The video resume is how Drafted changes the way you get hired.</h3>
            <p>With just one video resume you'll gain exposure to over 1,000 companies.</p>
            <p>We'll ask just 3 questions, and you'll have up to 1 minute to answer each question.</p>
            <p>Don't worry, you can restart until you're happy with it!</p>
    <button type="button" onClick={() => setStep(previousStep)}>Back</button>
      <button type="button" style={buttonStyles} onClick={() => setStep(nextStep)}>Continue</button>
      </>
);

export default Step5;