import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext, useFormik } from 'formik';

// import resumeAttachImage from './logo.svg';
import VideoRecorder from 'react-video-recorder/lib/video-recorder';
import * as Yup from 'yup';
import AWS from 'aws-sdk';
import useNextStep from './useNextStep';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import Step5 from './Step5';
import Step6 from './Step6';
import Step7 from './Step7';
import Step8 from './Step8';


const Onboarding = () => {
    // const { step } = formik.values;
    const [step, setStep] = React.useState(1);
  
    switch (step) {
      case 1:
        return <Step1 setStep={setStep} nextStep={1} />;
      case 2:
        return <Step2 setStep={setStep} nextStep={3} previousStep={1} />
      case 3:
        return <Step3 setStep={setStep} nextStep={4} previousStep={2} />;
      case 4:
        return <Step4 setStep={setStep} nextStep={5} previousStep={3} />;
      case 5:
        return <Step5 setStep={setStep} nextStep={6} previousStep={4} />;
      case 6:
        return <Step6 setStep={setStep} nextStep={7} previousStep={5} />;
      case 7:
        return <Step7 setStep={setStep} nextStep={8} previousStep={6} />;
      case 8:
        return <Step8 setStep={setStep} previousStep={1} />;
      default:
        return null;
    }
  };
  
export default Onboarding;