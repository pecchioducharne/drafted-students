import React, { useState } from 'react';
import * as Yup from 'yup';
import { useFormikContext } from 'formik';

const useNextStep = () => {
    const formik = useFormikContext();
    const [step, setStep] = useState(1);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [isVideoRecorded, setIsVideoRecorded] = useState(false);
    const [values, setValues] = useState({});
    const [errorMessage, setErrorMessage] = useState('');
  
    const validationSchema = Yup.object().shape({
      email: Yup.string().email('Invalid email').required('Email is required'),
      university: Yup.string().required('University is required'),
      password: Yup.string().required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm Password is required'),
      firstName: Yup.string().required('First Name is required'),
      lastName: Yup.string().required('Last Name is required'),
      major: Yup.string().required('Major is required'),
      graduationMonth: Yup.string().required('Graduation Month is required'),
      graduationYear: Yup.number()
        .required('Graduation Year is required')
        .min(2022, 'Graduation Year must be at least 2022')
        .max(2040, 'Graduation Year cannot exceed 2040'),
    });
  
    const step1ValidationSchema = Yup.object().shape({
      email: Yup.string().email('Invalid email').required('Email is required'),
    });
  
    const step2ValidationSchema = Yup.object().shape({
      university: Yup.string().required('University is required'),
    });
  
    const step3ValidationSchema = Yup.object().shape({
      password: Yup.string().required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm Password is required'),
    });
  
    const step4ValidationSchema = Yup.object().shape({
      firstName: Yup.string().required('First Name is required'),
      lastName: Yup.string().required('Last Name is required'),
      major: Yup.string().required('Major is required'),
      graduationMonth: Yup.string().required('Graduation Month is required'),
      graduationYear: Yup.number()
        .required('Graduation Year is required')
        .min(2022, 'Graduation Year must be at least 2022')
        .max(2040, 'Graduation Year cannot exceed 2040'),
    });
  
    const step5ValidationSchema = Yup.object().shape({
    });

  
  
  
    const initialValues = {
      email: '',
      university: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      major: '',
      graduationMonth: '',
      graduationYear: '',
      linkedInProfile: '',
      resume: '',
    };
  
    const isFormComplete = (values, step) => {
      switch (step) {
        case 1:
          return step1ValidationSchema.isValidSync(values);
        case 2:
          return step2ValidationSchema.isValidSync(values);
        case 3:
          return step3ValidationSchema.isValidSync(values);
        case 4:
          return step4ValidationSchema.isValidSync(values);
        default:
          return false;
      }
    };

  const handleNextStep = () => {
    const isValid = isFormComplete(formik.values, step);
    if (!isValid) {
      formik.setTouched({}, false);
      setErrorMessage('Please enter required forms to continue');
      return;
    }

    setStep((prevStep) => prevStep + 1);
  };

  return handleNextStep;
};

export default useNextStep;
