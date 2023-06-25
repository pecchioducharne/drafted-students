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

const Step2 = ({ setStep , nextStep, previousStep } ) => (
  <Formik
    initialValues={{ email: "" }}
    validationSchema={Yup.object({ university: Yup.string().required() })}
    onSubmit={() => setStep(3)}
  >
    <Form>
    <div>Step 2</div>

    <h2>Find your school</h2>
<p>Select your university below. This will help more employers targeting your school find you.</p>
      <label htmlFor="email">Email</label>
      <Field as="select" id="university" name="university" style={{ width: '95%' }}>
      <option value="">Select an option</option>
      <option value="Florida International University">Florida International University</option>
      <option value="University of Miami">University of Miami</option>
      <option value="Miami-Dade College">Miami-Dade College</option>
      <option value="Lynn University">Lynn University</option>
    </Field>      
    <ErrorMessage name="email" component="div" />
    <button type="button" onClick={() => setStep(previousStep)}>Back</button>
      <button type="submit" style={buttonStyles}>
        Continue to the next step
        </button>
    </Form>
  </Formik>
);

export default Step2;