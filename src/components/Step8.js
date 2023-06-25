import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const Step8 = ({ setStep, previousStep }) => (
  <Formik
    initialValues={{ email: "" }}
    validationSchema={Yup.object({ email: Yup.string().email().required() })}
    onSubmit={() => setStep(8)}
  >
    <Form>
    <div>Step 8</div>
      <label htmlFor="email">Email</label>
      <Field type="email" id="email" name="email" />
      <ErrorMessage name="email" component="div" />
      <button type="submit">Next</button>
    </Form>
  </Formik>
);

export default Step8;