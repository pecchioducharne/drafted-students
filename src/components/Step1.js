import React from "react";
import {Formik, Form, Field, ErrorMessage} from "formik";
import * as Yup from "yup";

const buttonStyles = {
    borderRadius: '8px',
    backgroundColor: '#207a56',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    cursor: 'pointer'
};

const Step1 = ({setStep}, nextStep ) => (
    <Formik
        initialValues={{
        email: ""
    }}
        validationSchema={Yup.object({
        email: Yup
            .string()
            .email()
            .required()
    })}
        onSubmit={() => setStep(2)}>
        <Form>
            <div>
              <div>Step 1</div>
                <h2>Let's find your next job</h2>
                <h3>Join Drafted's community of job seekers</h3>
                <p>
                    The best place for college students, recent graduates, and early career
                    professionals to find jobs and internships.
                </p>
            </div>
            <label htmlFor="email">Email</label>
            <Field
                type="email"
                id="email"
                name="email"
                style={{
                width: '95%'
            }}/>
            <ErrorMessage name="email" component="div" className="error"/>
            <br></br>
            <button type="submit" style={buttonStyles}>Let's go pro</button>
        </Form>
    </Formik>
);

export default Step1;