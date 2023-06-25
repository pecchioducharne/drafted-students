import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const Step7 = ({ setStep, nextStep, previousStep }) => (
  <Formik
    initialValues={{ email: "" }}
    validationSchema={Yup.object({ email: Yup.string().email().required() })}
    onSubmit={() => setStep(8)}
  >
    <Form>
    <div>Step 7</div>
      <label htmlFor="email">Email</label>
      <Field type="email" id="email" name="email" />
      <ErrorMessage name="email" component="div" />
      <button type="button" onClick={() => setStep(previousStep)}>Back</button>
      <button type="submit">Next</button>
    </Form>
  </Formik>
);

export default Step7;