import React, { useCallback, useState, useEffect, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import axios from "axios";

// import resumeAttachImage from './logo.svg';
import VideoRecorder from "react-video-recorder/lib/video-recorder";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import * as Yup from "yup";
import AWS from "aws-sdk";
import Levenshtein from "fast-levenshtein";
import usfTampaGif from "./usf-tampa.gif";
import loadingGif from "./loader.gif";

const S3_BUCKET_NAME = "uploads-video-resumes";
const COLLEGE_API_KEY = "HVwaXJVdWqpqjayHBi6OMRGk5CDGybJtu8SN8M57";

const findUniversities = (inputValue) => {
  if (!inputValue || inputValue.length < 2) {
    return Promise.resolve([]);
  }

  return axios
    .get(
      `https://api.data.gov/ed/collegescorecard/v1/schools.json?school.name=${inputValue}&api_key=${COLLEGE_API_KEY}`
    )
    .then((response) => {
      const universities = response.data.results.map((university) => ({
        value: university.id,
        label: university.school.name,
      }));

      // Sort the universities by the closeness of the match.
      universities.sort((a, b) => {
        // Calculate the distance of each school name from the input value.
        const distanceA = Levenshtein.get(
          a.label.toLowerCase(),
          inputValue.toLowerCase()
        );
        const distanceB = Levenshtein.get(
          b.label.toLowerCase(),
          inputValue.toLowerCase()
        );

        // Sort by ascending distance (closer matches come first).
        return distanceA - distanceB;
      });

      return universities;
    })
    .catch((error) => {
      console.error("Error during fetching universities", error);
      return [];
    });
};

const MySelect = ({ field, form }) => {
  return (
    <AsyncSelect
      name={field.name}
      value={field.value}
      onChange={(option) => form.setFieldValue(field.name, option)}
      loadOptions={findUniversities}
    />
  );
};

AWS.config.update({
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-1:94a5ad1e-59ad-4c5c-9cb0-2cafb2b96a47",
  }),
  maxRetries: 3,
  httpOptions: {
    timeout: 30000,
    connectTimeout: 5000,
  },
  region: "us-east-1",
});

// us-east-1:d7a7df87-bbac-4b59-b1b3-6e48f40a0f48 locks S3 API version
AWS.config.apiVersions = {
  s3: "2006-03-01",
};

// S3 bucket holding video resumes to upload to S3
var s3 = new AWS.S3({
  params: {
    Bucket: "uploads-video-resumes",
  },
  region: "us-east-1",
});

const MultiStepForm = ({ submitHandler }) => {
  const [step, setStep] = useState(1);
  const [, /*formSubmitted*/ setFormSubmitted] = useState(false);
  const [, /*isVideoRecorded*/ setIsVideoRecorded] = useState(false);
  const [values /*setValues*/] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showText, setShowText] = useState(false);
  const [
    ,/*errorMessage*/
    /*setErrorMessage*/
  ] = useState("");
  const [name, setName] = useState(""); // Add this line
  const [draftedUniversity, setDraftedUniversity] = useState("");
  const [globalEmail, setGlobalEmail] = useState("");
  const [globalPassword, setGlobalPassword] = useState("");
  const [globalFirstName, setGlobalFirstName] = useState("");
  const [globalLastName, setGlobalLastName] = useState("");
  const [globalUniversity, setGlobalUniversity] = useState("");
  const [globalMajor, setGlobalMajor] = useState("");
  const [globalGraduationMonth, setGlobalGraduationMonth] = useState("");
  const [globalGraduationYear, setGlobalGraduationYear] = useState("");
  const [globalLinkedInProfileURL, setGlobalLinkedInProfileURL] = useState("");
  const [globalResume, setGlobalResume] = useState(null);
  const [globalVideo1, setGlobalVideo1] = useState(null);
  const [globalVideo2, setGlobalVideo2] = useState(null);
  const [globalVideo3, setGlobalVideo3] = useState(null);
  const [globalVideo1Link, setGlobalVideo1Link] = useState("");
  const [globalVideo2Link, setGlobalVideo2Link] = useState("");
  const [globalVideo3Link, setGlobalVideo3Link] = useState("");

  const handleNameChange = (event) => {
    setName(event.target.value); // Update the name state variable
  };

  // state variables to check video record
  const [isVideo1Recorded, setVideo1Recorded] = useState(false);
  const [isVideo2Recorded, setVideo2Recorded] = useState(false);
  const [isVideo3Recorded, setVideo3Recorded] = useState(false);

  const initialValues = {
    step: 1,
    email: "",
    university: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    major: "",
    graduationMonth: "",
    graduationYear: "",
    linkedInProfileURL: "",
    resume: "",
  };

  const handleUpload = (videoBlob, questionNumber) => {
    // video upload
    console.log("Handle upload is called");

    const videoParams = {
      Bucket: S3_BUCKET_NAME,
      Key: `${globalUniversity}/${globalFirstName} ${globalLastName}/${globalFirstName}-${globalLastName}-video-resume-${questionNumber}.mp4`,
      Body: videoBlob,
      ContentType: "video/mp4",
      ACL: "public-read",
    };

    return new Promise((resolve, reject) => {
      s3.putObject(videoParams, function (err, data) {
        if (err) {
          console.log("Error during upload: ", err);
          console.log(err, err.stack); // an error occurred
          reject(err);
        } else {
          console.log(data); // successful response
          console.log(
            "Video " +
              questionNumber +
              " was uploaded successfully at " +
              data.Location
          );
          // You no longer need to set the video recorded states here
          // as they are being set right after the recording is complete
          if (questionNumber === 1) {
            // globalVideo1 = videoBlob;
            setGlobalVideo1(videoBlob);
            setGlobalVideo1Link(
              "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key
            );
            // globalVideo1Link = "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key;
          } else if (questionNumber === 2) {
            /*
              globalVideo2 = videoBlob;
              globalVideo2Link = "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key;*/
            setGlobalVideo2(videoBlob);
            setGlobalVideo2Link(
              "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key
            );
          } else if (questionNumber === 3) {
            /*
              globalVideo3 = videoBlob;
              globalVideo3Link = "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key;*/
            setGlobalVideo3(videoBlob);
            setGlobalVideo3Link(
              "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key
            );
          }
          resolve(data);
        }
      });
    });
  };

  const handleNextVideoStep = async (step, videoBlob) => {
    if (step === 6 && !isVideo1Recorded) {
      alert("Please finish video recording to proceed and get Drafted!");
      return;
    } else if (step === 7 && !isVideo2Recorded) {
      alert("Please finish video recording to proceed and get Drafted!");
      return;
    } else if (step === 8 && !isVideo3Recorded) {
      alert("Please finish video recording to proceed and get Drafted!");
      return;
    }
    // success cases

    // question 1
    if (step === 6 && isVideo1Recorded && globalVideo1Link !== "") {
      console.log("Video 1 was recorded");
      setStep(7);
    } else if (step === 6 && isVideo1Recorded && globalVideo1Link === "") {
      alert("Uploading video resume! Give us a sec...");
      await handleUpload(videoBlob, 1);
      setStep(7);
    } else {
      alert("Please finish video recording to proceed and get Drafted!");
    }

    // question 2
    if (step === 7 && isVideo2Recorded && globalVideo2Link !== "") {
      console.log("Video 2 was recorded");
      setStep(8);
    } else if (step === 7 && isVideo2Recorded && globalVideo2Link === "") {
      alert("Uploading video resume! Give us a sec...");
      await handleUpload(videoBlob, 2);
      setStep(8);
    } else {
      alert("Please finish video recording to proceed and get Drafted!");
    }

    // question 3
    if (step === 8 && isVideo3Recorded && globalVideo3Link !== "") {
      console.log("Video 3 was recorded");
      setStep(9);
    } else if (step === 8 && isVideo3Recorded && globalVideo3Link === "") {
      alert("Uploading video resume! Give us a sec...");
      await handleUpload(videoBlob, 3);
      setStep(9);
    } else {
      alert("Please finish video recording to proceed and get Drafted!");
    }
  };

  const handleTextUpload = () => {
    console.log("handleTextUpload called with the fields:");
    console.log(globalFirstName);
    console.log(globalLastName);
    console.log(globalUniversity);
    console.log(globalMajor);
    console.log(globalGraduationMonth);
    console.log(globalGraduationYear);
    console.log(globalLinkedInProfileURL);
    console.log(globalVideo1Link);
    console.log(globalVideo2Link);
    console.log(globalFirstName);

    const formData = {
      firstName: globalFirstName,
      lastName: globalLastName,
      university: globalUniversity,
      major: globalMajor,
      graduationMonth: globalGraduationMonth,
      graduationYear: globalGraduationYear,
      linkedInURL: globalLinkedInProfileURL,
      video1: globalVideo1Link,
      video2: globalVideo2Link,
      video3: globalVideo3Link,
    };
    const formDataJsonString = JSON.stringify(formData);

    // Handle submission of form data
    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: `${globalUniversity}/${globalFirstName} ${globalLastName}/${globalFirstName}-${globalLastName}-information.json`,
      Body: formDataJsonString,
      ContentType: "application/json",
      ACL: "public-read",
    };

    s3.putObject(params, function (err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
      } else {
        console.log(data); // successful response
        console.log("JSON was uploaded successfully at " + data.Location);
      }
    });
  };

  const buttonStyles = {
    borderRadius: "8px",
    backgroundColor: "#207a56",
    textDecoration: "none",
    color: "white",
    padding: "10px 20px",
    border: "none",
    cursor: "pointer",
  };

  const previousButtonStyles = {
    borderRadius: "8px",
    backgroundColor: "#e5e5e5",
    color: "black",
    padding: "10px 20px",
    border: "none",
    cursor: "pointer",
  };

  const letsGoProButtonStyle = {
    borderRadius: "8px",
    backgroundColor: "#207a56",
    color: "white",
    padding: "10px 20px",
    border: "none",
    cursor: "pointer",
  };

  const handleKeyPress = (event, nextStep) => {
    if (event.key === "Enter") {
      setStep(nextStep);
    }
  };

  const months = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "Mayo",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
  };

  const onSubmit = (values) => {
    console.log(values);
  };

  //  let draftedUniversity = "";
  //  let globalEmail = "";
  //  let globalPassword = ""; // @TODO: Encrypt, attention to Drafted engineers: never, never, EVER log any password or critical customer information!
  //  let globalFirstName = "";
  //  let globalLastName = "";
  // //  let globalUniversity = "";
  //  let globalMajor = "";
  //  let globalGraduationMonth = "";
  //  let globalGraduationYear = "";
  //  let globalLinkedInProfileURL = "";
  //  let globalResume = null; // @TODO: Have to figure this out
  //  let globalVideo1 = null; // What file type is this?
  //  let globalVideo2 = null;
  //  let globalVideo3 = null;
  //  let globalVideo1Link = "";
  //  let globalVideo2Link = "";
  //  let globalVideo3Link = "";

  const [isLoading, setIsLoading] = useState(false);

  const RenderStepContent = ({
    step,
    setStep /* other props as necessary... */,
  }) => {
    const isMounted = useRef(false);

    const [showProTips, setShowProTips] = useState(false);

    const toggleProTips = () => {
      setShowProTips(!showProTips);
    };

    useEffect(() => {
      isMounted.current = true;

      return () => {
        isMounted.current = false;
      };
    }, []);

    useEffect(() => {
      console.log("Saved university: ", globalUniversity);
    }, [globalUniversity]);

    useEffect(() => {
      console.log("Saved email: ", globalEmail);
    }, [globalEmail]);

    useEffect(() => {
      console.log("Saved password");
    }, [globalPassword]);

    useEffect(() => {
      console.log("Saved first name: ", globalFirstName);
    }, [globalFirstName]);

    useEffect(() => {
      console.log("Saved last name: ", globalLastName);
    }, [globalLastName]);

    useEffect(() => {
      console.log("Saved major: ", globalMajor);
    }, [globalMajor]);

    useEffect(() => {
      console.log("Saved graduation month: ", globalGraduationMonth);
    }, [globalGraduationMonth]);

    useEffect(() => {
      console.log("Saved graduation year: ", globalGraduationYear);
    }, [globalGraduationYear]);

    useEffect(() => {
      console.log("Saved LinkedIn profile: ", globalLinkedInProfileURL);
    }, [globalLinkedInProfileURL]);

    useEffect(() => {
      console.log("Saved video1: ", globalVideo1);
    }, [globalVideo1]);
    useEffect(() => {
      console.log("Saved video2: ", globalVideo2);
    }, [globalVideo2]);
    useEffect(() => {
      console.log("Saved video3: ", globalVideo3);
    }, [globalVideo3]);
    useEffect(() => {
      console.log("Saved video 1 link: ", globalVideo1Link);
    }, [globalVideo1Link]);
    useEffect(() => {
      console.log("Saved video 2 link: ", globalVideo2Link);
    }, [globalUniversity]);
    useEffect(() => {
      console.log("Saved video 3 link: ", globalVideo3Link);
    }, [globalVideo3Link]);

    switch (step) {
      case 1:
        return (
          <>
            <Formik
              initialValues={{
                email: "",
              }}
              validationSchema={Yup.object({
                email: Yup.string()
                  .email("Invalid email address")
                  .required("Email is required"),
              })}
              onSubmit={(values) => {
                if (values.email.endsWith("fiu.edu")) {
                  // FIU
                  // draftedUniversity = "Florida International University";
                  setGlobalUniversity("Florida International University");
                  // globalEmail = values.email;
                  setGlobalEmail(values.email);
                  console.log("Saved university: ", globalUniversity);
                  setStep(3); // skips step
                } else if (values.email.endsWith("miami.edu")) {
                  // University of Miami
                  // draftedUniversity = "University of Miami";
                  setGlobalUniversity("University of Miami");
                  // globalEmail = values.email;
                  setGlobalEmail(values.email);
                  console.log("Saved university: ", globalUniversity);
                  setStep(3); // skips step
                } else if (values.email.endsWith("usf.edu")) {
                  // University of Southern Florida
                  // draftedUniversity = "University of South Florida";
                  setGlobalUniversity("University of South Florida");
                  // globalEmail = values.email;
                  setGlobalEmail(values.email);
                  console.log("Saved university: ", globalUniversity);
                  setStep(3); // skips step
                } else {
                  // Not a drafted uni, go to next
                  // globalEmail = values.email;
                  setGlobalEmail(values.email);
                  setStep(2);
                }
              }}
            >
              {(formik) => (
                <Form>
                  <h2>🎯 Let's find your next job</h2>
                  <h3>Join Drafted's community of job seekers</h3>
                  <p>
                    The best place for college students, recent graduates, and
                    early career professionals to find jobs and internships.
                  </p>
                  <div>
                    <label htmlFor="email">Email Address</label>
                    <Field
                      type="email"
                      id="email"
                      name="email"
                      style={{ width: "95%" }}
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="error"
                    />
                  </div>
                  {formik.values.email.endsWith("fiu.edu") && (
                    <>
                      <p style={{ fontWeight: "bold" }}>
                        Florida International University
                      </p>
                      <p>Welcome, Panther!</p>
                    </>
                  )}
                  {formik.values.email.endsWith("miami.edu") && (
                    <>
                      <p style={{ fontWeight: "bold" }}>University of Miami</p>
                      <p>Welcome, Cane!</p>
                    </>
                  )}
                  {formik.values.email.endsWith("usf.edu") && (
                    <>
                      <p style={{ fontWeight: "bold" }}>
                        University of South Florida
                      </p>
                      <p>Welcome, Bull!</p>
                      <img
                        src={usfTampaGif}
                        alt="USF Tampa"
                        style={{
                          width: "120px",
                          display: "block",
                          margin: "0 auto",
                          borderRadius: "8px",
                        }}
                      />
                    </>
                  )}
                  <br />
                  <br></br>
                  <div style={{ display: "flex" }}>
                    <button type="submit" style={letsGoProButtonStyle}>
                      Let's go pro
                    </button>
                  </div>
                  {/* Uncomment to go directly to video step */}
                  <button type="button" onClick={setStep(5)}>
                    Debug Video
                  </button>
                </Form>
              )}
            </Formik>
          </>
        );
      case 2:
        return (
          <>
            <Formik
              initialValues={{ university: null }}
              validationSchema={Yup.object({
                university: Yup.object().shape({
                  label: Yup.string().required("Please select your school"),
                  value: Yup.string().required("Please select your school"),
                }),
              })}
              onSubmit={(values) => {
                if (values.university !== "") {
                  console.log(values.university.label);
                  let chosenUniversity = values.university.label;
                  setGlobalUniversity(chosenUniversity);
                  setStep(3);
                }
              }}
            >
              {({ setFieldValue, values, errors, touched }) => (
                <Form>
                  <h2>🎓 Find your school</h2>
                  <p>
                    Select your university below. This will help more employers
                    targeting your school find you.
                  </p>
                  <div>
                    <label htmlFor="university">Search your university</label>
                    <Field
                      name="university"
                      component={MySelect}
                      onChange={setFieldValue}
                      value={values.university}
                      placeholder="Search your university..."
                    />
                    {touched.university && errors.university ? (
                      <div className="error">{errors.university}</div>
                    ) : null}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "10px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={previousButtonStyles}
                    >
                      Previous
                    </button>
                    <button
                      type="submit"
                      style={buttonStyles}
                      disabled={!values.university}
                    >
                      Continue to the next step
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </>
        );
      case 3:
        return (
          <Formik
            initialValues={{
              password: "",
              confirmPassword: "",
            }}
            validationSchema={Yup.object().shape({
              password: Yup.string().required("Password is required"),
              confirmPassword: Yup.string()
                .oneOf([Yup.ref("password"), null], "Passwords must match")
                .required("Confirm Password is required"),
            })}
            onSubmit={(values) => {
              if (
                values.password !== "" &&
                values.password === values.confirmPassword
              ) {
                // globalPassword = values.password;
                setGlobalPassword(values.password);
                console.log("Saved password...");
                setStep(4);
              }
            }}
          >
            <Form>
              <h2>🔑 Create your password</h2>
              <div>
                <label htmlFor="password">Password</label>
                <Field
                  type="password"
                  id="password"
                  name="password"
                  style={{ width: "95%" }}
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="error"
                />
              </div>
              <div>
                <br></br>
                <label htmlFor="confirmPassword">Re-enter Password</label>
                <Field
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  style={{ width: "95%" }}
                />
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="error"
                />
              </div>
              <p>
                Once you create an account, you'll start to receive Drafted
                emails. You can unsubscribe at any time.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (
                    globalEmail.endsWith("@fiu.edu") ||
                    globalEmail.endsWith("@usf.edu") ||
                    globalEmail.endsWith("@umiami.edu")
                  ) {
                    console.log("i know your uni");
                    setStep(1);
                  } else {
                    console.log("idk know your uni" + draftedUniversity);
                    setStep(2);
                  }
                }}
                style={previousButtonStyles}
              >
                Previous
              </button>
              <button type="submit" style={buttonStyles}>
                Create Account
              </button>
            </Form>
          </Formik>
        );
      case 4:
        return (
          <Formik
            initialValues={{
              firstName: "",
              lastName: "",
              major: "",
              graduationMonth: "",
              graduationYear: "",
            }}
            validationSchema={Yup.object().shape({
              firstName: Yup.string().required("First Name is required"),
              lastName: Yup.string().required("Last Name is required"),
              major: Yup.string().required("Major is required"),
              graduationMonth: Yup.number().required(
                "Graduation Month is required"
              ),
              graduationYear: Yup.number().required(
                "Graduation Year is required"
              ),
            })}
            onSubmit={(values) => {
              setName(values.firstName);
              if (
                values.firstName !== "" &&
                values.lastName !== "" &&
                values.major !== "" &&
                values.graduationMonth !== "" &&
                values.graduationYear !== ""
              ) {
                // globalFirstName = values.firstName;
                setGlobalFirstName(values.firstName);
                // globalLastName = values.lastName;
                setGlobalLastName(values.lastName);
                // globalMajor = values.major;
                setGlobalMajor(values.major);
                // globalGraduationMonth = months[values.graduationMonth];
                setGlobalGraduationMonth(months[values.graduationMonth]);
                // globalGraduationYear = values.graduationYear;
                setGlobalGraduationYear(values.graduationYear);

                // check for linkedin
                if (values.linkedInProfileURL !== "") {
                  // globalLinkedInProfileURL = values.linkedInProfileURL;
                  setGlobalLinkedInProfileURL(values.linkedInProfileURL);
                  console.log("Saved LinkedIn URL: ", globalLinkedInProfileURL);
                }

                /// Saving them
                console.log("Saved first name: ", globalFirstName);
                console.log("Saved last name: ", globalLastName);
                console.log("Saved major: ", globalMajor);
                console.log("Saved graduation month: ", globalGraduationMonth);
                console.log("Saved graduation year: ", globalGraduationYear);

                // Who is the candidate
                if (draftedUniversity !== "") {
                  console.log(
                    globalFirstName +
                      " " +
                      globalLastName +
                      " goes to " +
                      globalUniversity +
                      ", plans to graduate " +
                      globalGraduationMonth +
                      " " +
                      globalGraduationYear +
                      " and is currently studying " +
                      globalMajor +
                      ". You can reach " +
                      globalFirstName +
                      " through " +
                      globalEmail +
                      "!"
                  );
                } else {
                  console.log(
                    globalFirstName +
                      " " +
                      globalLastName +
                      " goes to " +
                      globalUniversity +
                      ", plans to graduate " +
                      globalGraduationMonth +
                      " " +
                      globalGraduationYear +
                      " and is currently studying " +
                      globalMajor +
                      ". You can reach " +
                      globalFirstName +
                      " through " +
                      globalEmail +
                      "!"
                  );
                }
                if (globalLinkedInProfileURL) {
                  console.log(
                    globalFirstName +
                      " is also on LinkedIn: " +
                      globalLinkedInProfileURL +
                      "."
                  );
                }

                setStep(5);
              } else {
                setFormSubmitted(false);
              }
            }}
          >
            <Form>
              <h2>🪪 Tell us about yourself</h2>
              {name && <p>🙋🏽 Hi, {name}!</p>}
              <div>
                <label htmlFor="firstName">* First Name</label>
                <Field
                  type="text"
                  id="firstName"
                  name="firstName"
                  style={{ width: "95%" }}
                />
                <ErrorMessage
                  name="firstName"
                  component="div"
                  className="error"
                />
              </div>
              <br></br>
              <div>
                <label htmlFor="lastName">* Last Name</label>
                <Field
                  type="text"
                  id="lastName"
                  name="lastName"
                  style={{ width: "95%" }}
                />
                <ErrorMessage
                  name="lastName"
                  component="div"
                  className="error"
                />
              </div>
              <br></br>
              <div>
                <label htmlFor="major">* Major</label>
                <Field
                  type="text"
                  id="major"
                  name="major"
                  style={{ width: "95%" }}
                />
                <ErrorMessage name="major" component="div" className="error" />
              </div>
              <br></br>
              <div>
                <label htmlFor="graduationYear">* Graduation Year</label>
                <Field
                  as="select"
                  id="graduationYear"
                  name="graduationYear"
                  style={{ width: "95%" }}
                >
                  <option value="">Select a year</option>
                  {[...Array(6)].map((_, i) => (
                    <option key={i} value={2022 + i}>
                      {2022 + i}
                    </option>
                  ))}
                </Field>
                <ErrorMessage
                  name="graduationYear"
                  component="div"
                  className="error"
                />
                <br></br>
              </div>
              <br></br>
              <div>
                <label htmlFor="graduationMonth">* Graduation Month</label>
                <Field
                  as="select"
                  id="graduationMonth"
                  name="graduationMonth"
                  style={{ width: "95%" }}
                >
                  <option value="">
                    What month do you expect to graduate?
                  </option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(0, month - 1).toLocaleString("en-US", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </Field>
                <ErrorMessage
                  name="graduationMonth"
                  component="div"
                  className="error"
                />
                <br></br>
              </div>
              <div>
                <br></br>
                <label htmlFor="linkedInProfile">LinkedIn Profile</label>
                <Field
                  type="text"
                  id="linkedInProfileURL"
                  name="linkedInProfileURL"
                  style={{ width: "95%" }}
                />
                <ErrorMessage
                  name="linkedInProfileURL"
                  component="div"
                  className="error"
                />
                <br></br>
              </div>
              <div>
                <br></br>
                {/* TODO: Add resume attach */}
                {/* <label htmlFor="resume">Attach Resume</label>
                <Field type="file" id="resume" name="resume" accept=".pdf" />
                <ErrorMessage name="resume" component="div" className="error" /> */}
                {/* TODO: Attach resume upload image */}
                {/* <label htmlFor="resume2"><img 
                    src={resumeAttachImage} 
                    alt="Attach Resume"
                    style={{
                        maxWidth: "20%",
                        maxHeight: "100%",
                        width: "auto",
                        height: "auto"
                    }}
                /></label>
                <Field type="file" id="resume2" name="resume2" accept=".pdf" />
                <ErrorMessage name="resume2" component="div" className="error" /> */}
              </div>
              <button
                type="button"
                onClick={() => setStep(3)}
                style={previousButtonStyles}
              >
                Previous
              </button>
              <button type="submit" style={buttonStyles}>
                Next
              </button>
            </Form>
          </Formik>
        );
      case 5:
        return (
          <>
            <Formik
              initialValues={{ file: null }}
              onSubmit={() => setStep(6)}
              onKeyPress={() => handleKeyPress(6)}
            >
              {({ values, setFieldValue }) => (
                <Form>
                  <h2>✨ Let's record your video resume</h2>
                  <h3>
                    The video resume is how Drafted changes the way you get
                    hired.
                  </h3>
                  <p>
                    With just one video resume you'll gain exposure to over
                    1,000 companies. We'll ask just 3 questions, and you'll have
                    up to 1 minute to answer each question. Don't worry, you can
                    restart until you're happy with it!
                  </p>
                  <p>
                    Or record video on your own and submit{" "}
                    <a
                      href={`mailto:appdrafted@gmail.com?subject=Ready to get Drafted&body=Hi!  I am ready to get Drafted. Here's my info:%0D%0A%0D%0AEmail:%0D%0AName:%0D%0AMajor:%0D%0AGraduation Year:%0D%0AGraduation Month:%0D%0ALinkedIn Profile:%0D%0A%0D%0APlease make sure to attach video resume (try and keep it under 5 minutes).`}
                      style={{ color: "#53AD7A", fontWeight: "bold" }}
                    >
                      via email
                    </a>{" "}
                    to <strong>appdrafted@gmail.com</strong> including all
                    candidate information and attaching video resume.
                  </p>
                  <p
                    onClick={() => setShowText(!showText)}
                    style={{
                      color: "#53AD7A",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Show all questions
                  </p>
                  {showText && (
                    <p>
                      {/* Questions in advance */}
                      <h4>🗺️ 1: Tell us your story</h4>
                      <span
                        onClick={toggleProTips}
                        style={{ cursor: "pointer", fontWeight: "bold" }}
                      >
                        (Click for pro tips)
                      </span>
                      {showProTips && (
                        <ul>
                          <li>
                            This is the typical "walk me through your resume"
                            question. Talk about what you majored in and why.
                            What internships or experiences you've had, and what
                            have you learned from them? What skills will you
                            bring to the hiring company?
                          </li>
                          <li>
                            Show why you're the best candidate to get an
                            opportunity, in terms of degree, internships, and
                            experience as well as soft skills which truly set
                            you apart. Talk about what you are passionate about,
                            and what you hope to explore in your first role.
                          </li>
                          <li>
                            Demonstrate that you can communicate clearly and
                            effectively, present yourself professionally, and
                            most importantly have fun and show your enthusiasm
                            to go pro and put that degree to work!
                          </li>
                        </ul>
                      )}
                      <h4>
                        🪄 2: What makes you stand out amongst other candidates?
                      </h4>
                      <span
                        onClick={toggleProTips}
                        style={{ cursor: "pointer", fontWeight: "bold" }}
                      >
                        (Click for pro tips)
                      </span>
                      {showProTips && (
                        <ul>
                          <li>
                            Don’t be modest — this is the time to be confident
                            about your strengths and really sell yourself to
                            employers.
                          </li>
                          <li>
                            Focus on your education, skills, and experiences
                            that make you unique! Tell employers how your unique
                            skills will help the company succeed.
                          </li>
                          <li>
                            Employers ask this to identify reasons why hiring
                            you is better than hiring a similarly qualified
                            candidate.
                          </li>
                          <li>
                            Avoid generic phrases like "I'm a hard worker".
                          </li>{" "}
                        </ul>
                      )}
                      <h4>
                        🧗 3: Tell us about a time when you overcame a challenge
                      </h4>
                      <span
                        onClick={toggleProTips}
                        style={{ cursor: "pointer", fontWeight: "bold" }}
                      >
                        (Click for pro tips)
                      </span>
                      {showProTips && (
                        <ul>
                          <li>
                            This is like your "highlight reel" moment. Show off!
                            Share specific examples where you exhibited
                            problem-solving skills and the ability to overcome
                            obstacles.
                          </li>
                          <li>
                            Pick one specific challenge in your studies,
                            personal life, or work/internships. Tell a story
                            with a positive outcome and/or positive lesson
                            learned that you can contribute to the workplace.
                          </li>
                          <li>
                            Emphasize key "soft skills". Examples of soft skills
                            include creativity, leadership, resilience,
                            adaptability, quick decision-making, etc. Relate
                            these to the specific challenge and outcome you are
                            discussing.
                          </li>
                        </ul>
                      )}
                    </p>
                  )}
                  {/* <div>
            <h3>Answer all questions in one video</h3>
            <p>Try and keep total video duration under 5 minutes</p>
            <label htmlFor="file" style={buttonStyles}>Upload Video Resume</label>                   
            <input
              id="file"
              name="file"
              type="file"
              accept="video/*"  // Accepts only video files
              onChange={(event) => {
                setFieldValue("file", event.currentTarget.files[0]);
              }}
            />
            {values.file && <span>{values.file.name}</span>}
          </div>
          <br></br> */}
                  {/* <h3>or</h3> */}
                  <h3>Record question by question</h3>
                  <p>Continue onboarding, answer 3 questions 1 minute each</p>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    style={previousButtonStyles}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Check if a file has been uploaded
                      if (values.file) {
                        setStep(9);
                      } else {
                        setStep(6);
                      }
                    }}
                    style={buttonStyles}
                  >
                    🎥 Continue to record
                  </button>
                </Form>
              )}
            </Formik>
          </>
        );

      case 6:
        const isMobile = window.innerWidth <= 768;

        const mobileForm = (
          <Formik
            initialValues={{ video1: null }}
            onSubmit={async (values, { setSubmitting }) => {
              if (values.video1) {
                console.log("video 1 recorded");
                try {
                  setIsLoading(true);
                  console.log("values.video1:", values.video1);
                  await handleUpload(values.video1, 1);
                  setStep(7);
                } catch (error) {
                  console.error("Video upload failed:", error);
                  // Optionally show error to user here
                } finally {
                  setIsLoading(false);
                  setSubmitting(false);
                }
              } else {
                alert("Please record a video before proceeding!");
                setSubmitting(false);
              }
            }}
          >
            {({ setFieldValue, handleSubmit, handleChange }) => (
              <Form
                style={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "20px",
                  width: "90%",
                  margin: "0 auto",
                }}
                onSubmit={handleSubmit}
              >
                <h2>Question 1 of 3</h2>
                <h3>🗺️ Tell us your story</h3>
                <p>
                  <span
                    onClick={toggleProTips}
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                  >
                    Click for pro tips
                  </span>
                  {showProTips && (
                    <ul>
                      <li>
                        This is the typical "walk me through your resume"
                        question. Talk about what you majored in and why. What
                        internships or experiences you've had, and what have you
                        learned from them? What skills will you bring to the
                        hiring company?
                      </li>
                      <li>
                        Show why you're the best candidate to get an
                        opportunity, in terms of degree, internships, and
                        experience as well as soft skills which truly set you
                        apart. Talk about what you are passionate about, and
                        what you hope to explore in your first role.
                      </li>
                      <li>
                        Demonstrate that you can communicate clearly and
                        effectively, present yourself professionally, and most
                        importantly have fun and show your enthusiasm to go pro
                        and put that degree to work!
                      </li>
                    </ul>
                  )}
                  <p>
                    <a
                      href="https://youtu.be/T9Dym8dDLzM?si=bfF-HDKHnuTAcRdq"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#53AD7A", fontWeight: "bold" }}
                    >
                      Question 1 Explained (Video)
                    </a>
                  </p>
                </p>
                <VideoRecorder
                  key={1}
                  isOnInitially
                  timeLimit={60000}
                  showReplayControls
                  onRecordingComplete={(videoBlob) => {
                    console.log("Video blob:", videoBlob);
                    setFieldValue("video1", videoBlob);
                  }}
                />
                <div className="video-frame"></div>
                <p className="video-info">Video Response: 1 min time limit</p>
                <p className="video-info">Unlimited retries</p>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  style={previousButtonStyles}
                >
                  Previous
                </button>
                <button type="submit" style={buttonStyles} disabled={isLoading}>
                  Submit and Next
                </button>
                {isLoading && (
                  <img
                    src={loadingGif}
                    alt="Loading..."
                    style={{
                      width: "24px",
                      height: "24px",
                      marginLeft: "10px",
                    }}
                  />
                )}
              </Form>
            )}
          </Formik>
        );

        const desktopForm = (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                marginTop: "-50px",
              }}
            >
              <div style={{ display: "flex", width: "800px" }}>
                <div style={{ flex: 1, marginRight: "10px" }}>
                  <Formik
                    onSubmit={async (values, { setSubmitting }) => {
                      // Submit logic for the text form
                      console.log("is this getting hit?");
                    }}
                  >
                    <Form
                      style={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        padding: "20px",
                      }}
                    >
                      <h2>Question 1 of 3</h2>
                      <h3>🗺️ Tell us your story</h3>
                      <p>
                        <ul>
                          <li>
                            <span
                              style={{ fontWeight: "bold", color: "#53AD7A" }}
                            >
                              This is the typical "walk me through your resume"
                              question.
                            </span>{" "}
                            Talk about what you majored in and why. What
                            internships or experiences you've had, and what have
                            you learned from them? What skills will you bring to
                            the hiring company?
                          </li>
                          <li>
                            <span
                              style={{ fontWeight: "bold", color: "#53AD7A" }}
                            >
                              Show why you're the best candidate to get an
                              opportunity,
                            </span>{" "}
                            in terms of degree, internships, and experience as
                            well as soft skills which truly set you apart. Talk
                            about what you are passionate about, and what you
                            hope to explore in your first role.
                          </li>
                          <li>
                            <span
                              style={{ fontWeight: "bold", color: "#53AD7A" }}
                            >
                              Demonstrate that you can communicate clearly and
                              effectively,
                            </span>{" "}
                            present yourself professionally, and most
                            importantly have fun and show your enthusiasm to go
                            pro and put that degree to work!
                          </li>
                        </ul>
                      </p>
                      <p>
                        <a
                          href="https://youtu.be/T9Dym8dDLzM?si=bfF-HDKHnuTAcRdq"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#53AD7A", fontWeight: "bold" }}
                        >
                          Question 1 Explained (Video)
                        </a>
                      </p>
                      <div style={{ marginBottom: "20px" }}></div>
                    </Form>
                  </Formik>
                </div>
                <div style={{ flex: 1, marginLeft: "10px" }}>
                  <Formik
                    initialValues={{ video1: null }}
                    onSubmit={async (values, { setSubmitting }) => {
                      if (values.video1) {
                        console.log("video 1 recorded");
                        try {
                          setIsLoading(true);
                          console.log("values.video1:", values.video1);
                          await handleUpload(values.video1, 1);
                          setStep(7);
                        } catch (error) {
                          console.error("Video upload failed:", error);
                          // Optionally show error to user here
                        } finally {
                          setIsLoading(false);
                          setSubmitting(false);
                        }
                      } else {
                        alert("Please record a video before proceeding!");
                        setSubmitting(false);
                      }
                    }}
                  >
                    {({ setFieldValue, handleSubmit }) => (
                      <Form
                        style={{
                          backgroundColor: "white",
                          borderRadius: "8px",
                          padding: "20px",
                        }}
                        onSubmit={handleSubmit}
                      >
                        <VideoRecorder
                          key={1}
                          isOnInitially
                          timeLimit={60000}
                          showReplayControls
                          onRecordingComplete={(videoBlob) => {
                            console.log("Video blob:", videoBlob);
                            setFieldValue("video1", videoBlob);
                          }}
                        />
                        <div className="video-frame"></div>
                        <p className="video-info">
                          Video Response: 1 min time limit
                        </p>
                        <p className="video-info">Unlimited retries</p>
                        <button
                          type="button"
                          onClick={() => setStep(5)}
                          style={previousButtonStyles}
                        >
                          Previous
                        </button>
                        <button type="submit" style={buttonStyles}>
                          Submit and Next
                        </button>
                        {isLoading && (
                          <img
                            src={loadingGif}
                            alt="Loading..."
                            style={{
                              width: "24px",
                              height: "24px",
                              marginLeft: "10px",
                            }}
                          />
                        )}
                      </Form>
                    )}
                  </Formik>
                </div>
              </div>
            </div>
          </>
        );

        return isMobile ? mobileForm : desktopForm;

      case 7:
        const isMobile2 = window.innerWidth <= 768;

        const mobileForm2 = (
          <Formik
            initialValues={{ video3: null }}
            onSubmit={async (values, { setSubmitting }) => {
              if (values.video2) {
                console.log("video 2 recorded");
                try {
                  setIsLoading(true);
                  console.log("values.video2:", values.video2);
                  await handleUpload(values.video2, 2);
                  setStep(8);
                } catch (error) {
                  console.error("Video upload failed:", error);
                  // Optionally show error to user here
                } finally {
                  setIsLoading(false);
                  setSubmitting(false);
                }
              } else {
                alert("Please record a video before proceeding!");
                setSubmitting(false);
              }
            }}
          >
            {({ setFieldValue, handleSubmit }) => (
              <Form
                style={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "20px",
                  width: "90%",
                  margin: "0 auto",
                }}
                onSubmit={handleSubmit}
              >
                <h2>Question 2 of 3</h2>
                <h3>🪄 What makes you stand out amongst other candidates?</h3>
                <p>
                  {/* Pro tips:
                    <br />
                    <ul>
                      <li>
                        Don’t be modest — this is the time to be confident about your strengths and really sell yourself to employers.
                      </li>
                      <li>
                        Focus on your education, skills, and experiences that make you unique! Tell employers how your unique skills will help the company succeed.
                      </li>
                      <li>
                        Employers ask this to identify reasons why hiring you is better than hiring a similarly qualified candidate.
                      </li>
                      <li>
                        Avoid generic phrases like "I'm a hard worker".
                      </li>
                    </ul>
                  </p>

                  <p> */}
                  <span
                    onClick={toggleProTips}
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                  >
                    Click for pro tips
                  </span>
                  {showProTips && (
                    <ul>
                      <li>
                        Don’t be modest — this is the time to be confident about
                        your strengths and really sell yourself to employers.
                      </li>
                      <li>
                        Focus on your education, skills, and experiences that
                        make you unique! Tell employers how your unique skills
                        will help the company succeed.
                      </li>
                      <li>
                        Employers ask this to identify reasons why hiring you is
                        better than hiring a similarly qualified candidate.
                      </li>
                      <li>Avoid generic phrases like "I'm a hard worker".</li>{" "}
                    </ul>
                  )}
                </p>
                <p>
                  <a
                    href="https://youtu.be/IshJHdFFtcg?si=1T8CrRqPFuVvM6kG"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#53AD7A", fontWeight: "bold" }}
                  >
                    Question 2 Explained (Video)
                  </a>
                </p>
                <VideoRecorder
                  key={2}
                  isOnInitially
                  timeLimit={60000}
                  showReplayControls
                  onRecordingComplete={(videoBlob) => {
                    console.log("Video blob:", videoBlob);
                    setFieldValue("video2", videoBlob);
                  }}
                />
                <div className="video-frame"></div>
                <p className="video-info">Video Response: 1 min time limit</p>
                <p className="video-info">Unlimited retries</p>
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  style={previousButtonStyles}
                >
                  Previous
                </button>
                <button type="submit" style={buttonStyles}>
                  Submit and Nex
                </button>
                {isLoading && (
                  <img
                    src={loadingGif}
                    alt="Loading..."
                    style={{
                      width: "24px",
                      height: "24px",
                      marginLeft: "10px",
                    }}
                  />
                )}
              </Form>
            )}
          </Formik>
        );

        const desktopForm2 = (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                marginTop: "-50px",
              }}
            >
              <div style={{ display: "flex", width: "800px" }}>
                <div style={{ flex: 1, marginRight: "10px" }}>
                  <Formik
                    onSubmit={async (values, { setSubmitting }) => {
                      // Submit logic for the text form
                    }}
                  >
                    <Form
                      style={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        padding: "20px",
                      }}
                    >
                      <h2>Question 2 of 3</h2>
                      <h3>
                        🪄 What makes you stand out amongst other candidates?
                      </h3>
                      <p>
                        <ul>
                          <li>
                            <span
                              style={{ fontWeight: "bold", color: "#53AD7A" }}
                            >
                              Don’t be modest — this is the time to be confident
                              about your strengths and really sell yourself to
                              employers.
                            </span>{" "}
                            Focus on your unique skills and experiences, and
                            explain why these make you the ideal candidate.
                          </li>
                          <li>
                            <span
                              style={{ fontWeight: "bold", color: "#53AD7A" }}
                            >
                              Focus on your education, skills, and experiences
                              that make you unique!
                            </span>{" "}
                            Tell employers how your unique skills will help the
                            company succeed.
                          </li>
                          <li>
                            <span
                              style={{ fontWeight: "bold", color: "#53AD7A" }}
                            >
                              Employers ask this to identify reasons why hiring
                              you is better than hiring a similarly qualified
                              candidate.
                            </span>{" "}
                            Use specific examples to demonstrate your skills and
                            achievements, and relate them back to the
                            requirements of the job.
                          </li>
                        </ul>
                      </p>
                      <p>
                        <a
                          href="https://youtu.be/IshJHdFFtcg?si=1T8CrRqPFuVvM6kG"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#53AD7A", fontWeight: "bold" }}
                        >
                          Question 2 Explained (Video)
                        </a>
                      </p>
                      <div style={{ marginBottom: "20px" }}></div>
                    </Form>
                  </Formik>
                </div>
                <div style={{ flex: 1, marginLeft: "10px" }}>
                  <Formik
                    initialValues={{ video2: null }}
                    onSubmit={async (values, { setSubmitting }) => {
                      if (values.video2) {
                        console.log("video 2 recorded");
                        try {
                          setIsLoading(true);
                          console.log("values.video2:", values.video2);
                          await handleUpload(values.video2, 2);
                          setStep(8);
                        } catch (error) {
                          console.error("Video upload failed:", error);
                          // Optionally show error to user here
                        } finally {
                          setIsLoading(false);
                          setSubmitting(false);
                        }
                      } else {
                        alert("Please record a video before proceeding!");
                        setSubmitting(false);
                      }
                    }}
                  >
                    {({ setFieldValue, handleSubmit }) => (
                      <Form
                        style={{
                          backgroundColor: "white",
                          borderRadius: "8px",
                          padding: "20px",
                        }}
                        onSubmit={handleSubmit}
                      >
                        <VideoRecorder
                          key={2}
                          isOnInitially
                          timeLimit={60000}
                          showReplayControls
                          onRecordingComplete={(videoBlob) => {
                            console.log("Video blob:", videoBlob);
                            setFieldValue("video2", videoBlob);
                          }}
                        />
                        <div className="video-frame"></div>
                        <p className="video-info">
                          Video Response: 1 min time limit
                        </p>
                        <p className="video-info">Unlimited retries</p>
                        <button
                          type="button"
                          onClick={() => setStep(6)}
                          style={previousButtonStyles}
                        >
                          Previous
                        </button>
                        <button type="submit" style={buttonStyles}>
                          Submit and Next
                        </button>
                        {isLoading && (
                          <img
                            src={loadingGif}
                            alt="Loading..."
                            style={{
                              width: "24px",
                              height: "24px",
                              marginLeft: "10px",
                            }}
                          />
                        )}
                      </Form>
                    )}
                  </Formik>
                </div>
              </div>
            </div>
          </>
        );
        return isMobile2 ? mobileForm2 : desktopForm2;

      case 8:
        const isMobile3 = window.innerWidth <= 768;

        const mobileForm3 = (
          <Formik
            initialValues={{ video3: null }}
            onSubmit={async (values, { setSubmitting }) => {
              if (values.video3) {
                console.log("video 3 recorded");
                try {
                  setIsLoading(true);
                  console.log("values.video3:", values.video3);
                  await handleUpload(values.video3, 3);
                  await handleTextUpload();
                  setStep(9);
                } catch (error) {
                  console.error("Video upload failed:", error);
                  // Optionally show error to user here
                } finally {
                  setIsLoading(false);
                  setSubmitting(false);
                }
              } else {
                alert("Please record a video before proceeding!");
                setSubmitting(false);
              }
            }}
          >
            {({ setFieldValue, handleSubmit }) => (
              <Form
                style={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "20px",
                  width: "90%",
                  margin: "0 auto",
                }}
                onSubmit={handleSubmit}
              >
                <h2>Question 3 of 3</h2>
                <h3>🧗 Tell us about a time when you overcame a challenge</h3>
                {/* <p>
                      Pro tips:
                      <br />
                      <ul>
                        <li>
                          Don’t be modest — this is the time to be confident about your strengths and really sell yourself to employers.
                        </li>
                        <li>
                          Focus on your education, skills, and experiences that make you unique! Tell employers how your unique skills will help the company succeed.
                        </li>
                        <li>
                          Employers ask this to identify reasons why hiring you is better than hiring a similarly qualified candidate.
                        </li>
                        <li>
                          Avoid generic phrases like "I'm a hard worker".
                        </li>
                      </ul>
                    </p> */}
                <p>
                  <span
                    onClick={toggleProTips}
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                  >
                    Click for pro tips
                  </span>
                  {showProTips && (
                    <ul>
                      <li>
                        This is like your "highlight reel" moment. Show off!
                        Share specific examples where you exhibited
                        problem-solving skills and the ability to overcome
                        obstacles.
                      </li>
                      <li>
                        Pick one specific challenge in your studies, personal
                        life, or work/internships. Tell a story with a positive
                        outcome and/or positive lesson learned that you can
                        contribute to the workplace.
                      </li>
                      <li>
                        Emphasize key "soft skills". Examples of soft skills
                        include creativity, leadership, resilience,
                        adaptability, quick decision-making, etc. Relate these
                        to the specific challenge and outcome you are
                        discussing.
                      </li>
                    </ul>
                  )}
                </p>
                <p>
                  <a
                    href="https://youtu.be/W1vP__7BAEY?si=VJph5kNvmRmTe4dV"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#53AD7A", fontWeight: "bold" }}
                  >
                    Question 3 Explained (Video)
                  </a>
                </p>
                <VideoRecorder
                  key={3}
                  isOnInitially
                  timeLimit={60000}
                  showReplayControls
                  onRecordingComplete={(videoBlob) => {
                    console.log("Video blob:", videoBlob);
                    setFieldValue("video3", videoBlob);
                  }}
                />
                <div className="video-frame"></div>
                <p className="video-info">Video Response: 1 min time limit</p>
                <p className="video-info">Unlimited retries</p>
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  style={previousButtonStyles}
                >
                  Previous
                </button>
                <button type="submit" style={buttonStyles}>
                  Submit and Next
                </button>
                {isLoading && (
                  <img
                    src={loadingGif}
                    alt="Loading..."
                    style={{
                      width: "24px",
                      height: "24px",
                      marginLeft: "10px",
                    }}
                  />
                )}
              </Form>
            )}
          </Formik>
        );

        const desktopForm3 = (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                marginTop: "-50px",
              }}
            >
              <div style={{ display: "flex", width: "800px" }}>
                <div style={{ flex: 1, marginRight: "10px" }}>
                  <Formik
                    onSubmit={async (values, { setSubmitting }) => {
                      // Submit logic for the text form
                    }}
                  >
                    <Form
                      style={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        padding: "20px",
                      }}
                    >
                      <h2>Question 3 of 3</h2>
                      <h3>
                        🧗 Tell us about a time when you overcame a challenge
                      </h3>
                      <p>
                        <ul>
                          <li>
                            <span
                              style={{ fontWeight: "bold", color: "#53AD7A" }}
                            >
                              This is like your "highlight reel" moment. Show
                              off!
                            </span>{" "}
                            Share specific examples where you exhibited
                            problem-solving skills and the ability to overcome
                            obstacles.
                          </li>
                          <li>
                            <span
                              style={{ fontWeight: "bold", color: "#53AD7A" }}
                            >
                              Pick one specific challenge in your studies,
                              personal life, or work/internships.
                            </span>{" "}
                            Tell a story with a positive outcome and/or positive
                            lesson learned that you can contribute to the
                            workplace.
                          </li>
                          <li>
                            <span
                              style={{ fontWeight: "bold", color: "#53AD7A" }}
                            >
                              Emphasize key "soft skills".
                            </span>{" "}
                            Examples of soft skills include creativity,
                            leadership, resilience, adaptability, quick
                            decision-making, etc. Relate these to the specific
                            challenge and outcome you are discussing.
                          </li>
                        </ul>
                      </p>
                      <p>
                        <a
                          href="https://youtu.be/W1vP__7BAEY?si=VJph5kNvmRmTe4dV"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#53AD7A", fontWeight: "bold" }}
                        >
                          Question 3 Explained (Video)
                        </a>
                      </p>
                      <div style={{ marginBottom: "20px" }}></div>
                    </Form>
                  </Formik>
                </div>
                <div style={{ flex: 1, marginLeft: "10px" }}>
                  <Formik
                    initialValues={{ video3: null }}
                    onSubmit={async (values, { setSubmitting }) => {
                      if (values.video3) {
                        console.log("video 3 recorded");
                        try {
                          setIsLoading(true);
                          console.log("values.video3:", values.video3);
                          await handleUpload(values.video3, 3);
                          await handleTextUpload();
                          setStep(9);
                        } catch (error) {
                          console.error("Video upload failed:", error);
                          // Optionally show error to user here
                        } finally {
                          setIsLoading(false);
                          setSubmitting(false);
                        }
                      } else {
                        alert("Please record a video before proceeding!");
                        setSubmitting(false);
                      }
                    }}
                  >
                    {({ setFieldValue, handleSubmit }) => (
                      <Form
                        style={{
                          backgroundColor: "white",
                          borderRadius: "8px",
                          padding: "20px",
                        }}
                        onSubmit={handleSubmit}
                      >
                        <VideoRecorder
                          key={3}
                          isOnInitially
                          timeLimit={60000}
                          showReplayControls
                          onRecordingComplete={(videoBlob) => {
                            console.log("Video blob:", videoBlob);
                            setFieldValue("video3", videoBlob);
                          }}
                        />
                        <div className="video-frame"></div>
                        <p className="video-info">
                          Video Response: 1 min time limit
                        </p>
                        <p className="video-info">Unlimited retries</p>
                        <button
                          type="button"
                          onClick={() => setStep(7)}
                          style={previousButtonStyles}
                        >
                          Previous
                        </button>
                        <button
                          type="submit"
                          style={buttonStyles}
                          // disabled={!isVideo3Recorded}
                        >
                          Submit
                        </button>
                        {isLoading && (
                          <img
                            src={loadingGif}
                            alt="Loading..."
                            style={{
                              width: "24px",
                              height: "24px",
                              marginLeft: "10px",
                            }}
                          />
                        )}
                      </Form>
                    )}
                  </Formik>
                </div>
              </div>
            </div>
          </>
        );

        return isMobile3 ? mobileForm3 : desktopForm3;

      case 9:
        return (
          <>
            <Form>
              <h2>🥳</h2>
              <h2>Congratulations, your profile is complete!</h2>
              <p>
                Keep an eye on your inbox as hiring companies and recruiters
                begin reaching out to you. Eventually, you will be able to
                access your Drafted profile to see more information like video
                views, companies viewing your video resume, and more.
              </p>
              <p>
                In the meantime, check out our blog site for helpful interview
                tips, recommendations, and know-hows to land your next full-time
                job!
              </p>

              <button
                type="button"
                onClick={() => setStep(8)}
                style={previousButtonStyles}
              >
                Previous
              </button>
              <a
                href="https://www.joindrafted.com/drafted-blog"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button
                  style={buttonStyles}
                  onClick={() => {
                    window.location.href =
                      "https://www.joindrafted.com/drafted-blog";
                  }}
                >
                  Drafted Blog
                </button>
              </a>
            </Form>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <h1
        style={{ fontWeight: "2500", paddingLeft: "50px", marginLeft: "10px" }}
      >
        drafted<span style={{ color: "#53ad7a" }}> beta</span>
        <span style={{ color: "black" }}>.</span>
      </h1>
      <Formik
        initialValues={initialValues}
        // validationSchema={validationSchema}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {() => <RenderStepContent step={step} setStep={setStep} />}
      </Formik>
    </div>
  );
};

setTimeout(() => {
  const alertContainer = document.querySelector(".alert");
  if (alertContainer) {
    alertContainer.style.display = "none";
  }
}, 3000);

export default MultiStepForm;
