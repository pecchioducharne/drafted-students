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

const Step3 = ({ setStep , nextStep, previousStep } ) => (
  <Formik
    initialValues={{ email: "" }}
    validationSchema={Yup.object().shape({ 
        password: Yup.string().required('Password is required'),
        confirmPassword: Yup.string()
          .oneOf([Yup.ref('password'), null], 'Passwords must match')
          .required('Confirm Password is required'),
    })}
    onSubmit={() => setStep(4)}
  >
    <Form>
    <div>Step 3</div>
      <h2>Create your password</h2>
      <div>
      <label htmlFor="password">Password</label>
    <Field type="password" id="password" name="password" style={{ width: '95%' }} />
    <ErrorMessage name="password" component="div" className="error" />
  </div>
  <div>
    <label htmlFor="confirmPassword">Re-enter Password</label>
    <Field type="password" id="confirmPassword" name="confirmPassword" style={{ width: '95%' }} />
    <ErrorMessage name="confirmPassword" component="div" className="error" />
  </div>
    <p>
    Once you create an account, you'll start to receive Drafted emails. You can unsubscribe at any time.
    </p>
    <button type="button" onClick={() => setStep(previousStep)}>Back</button>
    <button type="submit" style={buttonStyles}>Create Account</button>
    </Form>
  </Formik>
);

export default Step3;