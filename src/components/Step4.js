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

const Step4 = ({ setStep , nextStep, previousStep }) => (
    <Formik
        initialValues={{ email: "" }}
        validationSchema={Yup.object().shape({
            firstName: Yup.string().required('First Name is required'),
            lastName: Yup.string().required('Last Name is required'),
            major: Yup.string().required('Major is required'),
            graduationMonth: Yup.string().required('Graduation Month is required'),
            graduationYear: Yup.number().required('Graduation Year is required'),
          })}
        onSubmit={() => setStep(5)}
    >
        <Form>
            <div>
            <div>Step 4</div>

            <label htmlFor="firstName">* First Name</label>
            <Field type="text" id="firstName" name="firstName" style={{ width: '95%' }} />
            <ErrorMessage name="firstName" component="div" className="error" />
            </div>
            <div>
            <label htmlFor="lastName">* Last Name</label>
            <Field type="text" id="lastName" name="lastName" style={{ width: '95%' }} />
            <ErrorMessage name="lastName" component="div" className="error" />
            </div>
            <div>
            <label htmlFor="major">* Major</label>
            <Field type="text" id="major" name="major" style={{ width: '95%' }} />
            <ErrorMessage name="major" component="div" className="error" />
            </div>
            <div>
            <label htmlFor="graduationMonth">* Graduation Month</label>
            <Field as="select" id="graduationMonth" name="graduationMonth" style={{ width: '95%' }}>
                <option value="">Select an option</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                    {new Date(0, month - 1).toLocaleString('en-US', { month: 'long' })}
                </option>
                ))}
            </Field>
            <ErrorMessage name="graduationMonth" component="div" className="error" />
            </div>
            <div>
            <label htmlFor="graduationYear">* Graduation Year</label>
            <Field type="number" id="graduationYear" name="graduationYear" min="2022" max="2040" style={{ width: '95%' }} />
            <ErrorMessage name="graduationYear" component="div" className="error" />
            </div>
            <div>
            <label htmlFor="linkedInProfile">LinkedIn Profile</label>
            <Field type="text" id="linkedInProfile" name="linkedInProfile" style={{ width: '95%' }} />
            <ErrorMessage name="linkedInProfile" component="div" className="error" />
            </div>
            <div>
            <label htmlFor="resume">Attach Resume</label>
            <Field type="file" id="resume" name="resume" accept=".pdf" />
            <ErrorMessage name="resume" component="div" className="error" />
            {/* Attach resume upload image */}
            {/* <label htmlFor="resume2"><img 
                src={resumeAttachImage} 
                alt="Attach Resume"
                style={{
                    maxWidth: "20%",
                    maxHeight: "100%",
                    width: "auto",
                    height: "auto"
                }}
            /></label> */}
            <Field type="file" id="resume2" name="resume2" accept=".pdf" />
            <ErrorMessage name="resume2" component="div" className="error" />
            </div>
            <button type="button" onClick={() => setStep(previousStep)}>Back</button>
            <button 
                type="submit" 
                style={buttonStyles}
            >
            Next
            </button>
        </Form>
  </Formik>
);

export default Step4;