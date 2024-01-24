import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { ErrorMessage, Field, Form, Formik } from "formik";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import { auth, db } from "./firebase";
import ReactGA4 from "react-ga4";

import axios from "axios";

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */

import AWS from "aws-sdk";
import Levenshtein from "fast-levenshtein";
import { Persist } from "formik-persist";
import AsyncSelect from "react-select/async";
import VideoRecorder from "react-video-recorder/lib/video-recorder";
import * as Yup from "yup";
import linkedInIcon from "./linkedin.svg";
import logoAmazon from "./logo-amazon.png";
import logoGotu from "./logo-gotu.png";
import logoJPMorgan from "./logo-jpmorgan.png";
import logoLula from "./logo-lula.png";
import getDraftedScreenshot from "./get-drafted.png";

import loadingGif from "./loader.gif";
import usfTampaGif from "./usf-tampa.gif";

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
  const navigate = useNavigate();
  const { setUserInfo } = useContext(UserContext);

  // Google Analytics
  ReactGA4.initialize("G-Y1YPK8NXCK"); // Replace with your Measurement ID

  const [step, setStep] = useState(1);
  const [isFormCompleted, setIsFormCompleted] = useState(false);
  const [, /*formSubmitted*/ setFormSubmitted] = useState(false);
  const [, /*isVideoRecorded*/ setIsVideoRecorded] = useState(false);
  const [values /*setValues*/] = useState({});
  const [selectedResume, setSelectedResume] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
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
  const [videoRecorded, setVideoRecorded] = useState(false);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [shouldUseEffect, setShouldUseEffect] = useState(true);
  const [resumeFile, setResumeFile] = useState(null);

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

  const handleUpload = (videoBlobOrFile, questionNumber) => {
    let filename;

    if (questionNumber === "combined") {
      filename = `${globalFirstName}-${globalLastName}-combined-video-resume.mp4`;
    } else if (questionNumber === "1") {
      filename = `${globalFirstName}-${globalLastName}-video-resume-1.mp4`;
    } else if (questionNumber === "2") {
      filename = `${globalFirstName}-${globalLastName}-video-resume-2.mp4`;
    } else if (questionNumber === "3") {
      filename = `${globalFirstName}-${globalLastName}-video-resume-3.mp4`;
    } else {
      filename = `${globalFirstName}-${globalLastName}-video-resume-${questionNumber}.mp4`;
    }

    const videoParams = {
      Bucket: S3_BUCKET_NAME,
      Key: `${globalUniversity}/${globalFirstName} ${globalLastName}/${filename}`,
      Body:
        videoBlobOrFile instanceof Blob
          ? videoBlobOrFile
          : new Blob([videoBlobOrFile], { type: "video/mp4" }),
      ContentType: "video/mp4",
      ACL: "public-read",
    };

    return new Promise((resolve, reject) => {
      s3.putObject(videoParams, function (err, data) {
        if (err) {
          reject(err);
        } else {
          // You no longer need to set the video recorded states here
          // as they are being set right after the recording is complete
          if (questionNumber === 1) {
            // globalVideo1 = videoBlobOrFile;
            setGlobalVideo1(videoBlobOrFile);
            setGlobalVideo1Link(
              "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key
            );
            // globalVideo1Link = "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key;
          } else if (questionNumber === 2) {
            /*
              globalVideo2 = videoBlobOrFile;
              globalVideo2Link = "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key;*/
            setGlobalVideo2(videoBlobOrFile);
            setGlobalVideo2Link(
              "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key
            );
          } else if (questionNumber === 3) {
            /*
              globalVideo3 = videoBlobOrFile;
              globalVideo3Link = "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key;*/
            setGlobalVideo3(videoBlobOrFile);
            setGlobalVideo3Link(
              "https://uploads-video-resumes.s3.amazonaws.com/" + data.Key
            );
          }
          setVideoUploaded(true); // Update the state here
          resolve(data);
          resolve(data);
        }
      });
    });
  };

  function setAndPersistStep(newStep) {
    setStep(newStep);
    localStorage.setItem("formCurrentStep", newStep);
  }

  const handleTextUpload = async (values, resumeFile) => {
    try {
      // Create a Firebase account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        globalEmail,
        globalPassword
      );

      // New Firebase account
      const user = userCredential.user;

      if (user) {
      }

      // To store resume
      let resumeURL = "";

      if (resumeFile) {
        const storage = getStorage();
        const resumeRef = ref(
          storage,
          `resumes/${user.email}/${resumeFile.name}`
        );

        // Upload the resume file
        const uploadResult = await uploadBytes(resumeRef, resumeFile);
        resumeURL = await getDownloadURL(uploadResult.ref);
      } else {
      }

      // Create an object with the form data, excluding linkedInURL if it's empty
      const formData = {
        firstName: values.firstName,
        lastName: values.lastName,
        university: globalUniversity,
        major: values.major,
        graduationMonth: values.graduationMonth,
        graduationYear: values.graduationYear,
        video1: "",
        video2: "",
        video3: "",
        resume: resumeURL,
      };

      // Conditionally add linkedInURL if it's not empty
      if (globalLinkedInProfileURL) {
        formData.linkedInURL = values.linkedInURL;
      }

      // Upload the form data to Firestore with the user's email as the document ID
      const userDataRef = doc(db, "drafted-accounts", user.email);
      await setDoc(userDataRef, {
        firstName: values.firstName,
        lastName: values.lastName,
        university: globalUniversity,
        major: values.major,
        graduationMonth: values.graduationMonth,
        graduationYear: values.graduationYear,
        email: user.email,
        video1: "",
        video2: "",
        video3: "",
        linkedInURL: values.linkedInURL || "",
        resume: resumeURL,
      });

      // Redirect to the Profile Dashboard or any other page.
      // You can use React Router for navigation.
    } catch (error) {
      // Handle the error appropriately
    }
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

  const inactiveButtonStyles = {
    borderRadius: "8px",
    backgroundColor: "black",
    textDecoration: "none",
    color: "white",
    padding: "10px 20px",
    border: "none",
    cursor: "pointer",
  };

  const uploadButtonStyles = {
    borderRadius: "8px",
    backgroundColor: "#207a56",
    textDecoration: "none",
    color: "white",
    padding: "10px 20px",
    border: "none",
    cursor: "pointer",
    width: "169px",
    fontWeight: "bold",
  };

  const uploadVideoButtonStyles = {
    borderRadius: "8px",
    backgroundColor: "#207a56",
    textDecoration: "none",
    color: "white",
    padding: "10px 20px",
    border: "none",
    cursor: "pointer",
    width: "215px",
    fontWeight: "bold",
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
      setAndPersistStep(nextStep);
    }
  };

  const redirectToLogin = () => {
    const encodedEmail = encodeURIComponent(globalEmail);
    const encodedPassword = encodeURIComponent(globalPassword);
    const loginUrl = `https://main--drafted-dashboard.netlify.app/login?email=${encodedEmail}&password=${encodedPassword}`;
    // const loginUrl = `http://localhost:3001/login?email=${encodedEmail}&password=${encodedPassword}`;
    window.location.href = loginUrl;
  };

  const onSubmit = (values) => {};

  const [isLoading, setIsLoading] = useState(false);

  function YouTubeEmbedQuestion2() {
    return (
      <div className="youtube-container">
        <iframe
          width="350"
          height="315"
          src="https://www.youtube.com/embed/IshJHdFFtcg?si=dOJl_w_f62enHHSN?autoplay=1&controls=0&modestbranding=1&rel=0"
          title="YouTube video player"
          frameborder="0"
          style={{ borderRadius: "14px" }} // Add border-radius here
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    );
  }

  function YouTubeEmbedQuestion3() {
    return (
      <div className="youtube-container">
        <iframe
          width="350"
          height="315"
          src="https://www.youtube.com/embed/W1vP__7BAEY?si=nktGyavw_DQlWOP7?autoplay=1&controls=0&modestbranding=1&rel=0"
          title="YouTube video player"
          frameborder="0"
          style={{ borderRadius: "14px" }} // Add border-radius here
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    );
  }

  const RenderStepContent = ({
    step,
    setStep /* other props as necessary... */,
  }) => {
    const isMounted = useRef(false);

    const [showProTips, setShowProTips] = useState(false);
    const [showVideo1, setShowVideo1] = useState(false);

    // This function is called when the link is clicked
    const toggleVideo1 = (event) => {
      // Prevent the default anchor behavior of going to the link
      event.preventDefault();

      // Set the showVideo1 state to true to show the YouTubeEmbedQuestion1 component
      setShowVideo1(!showVideo1);
    };

    const [showVideo2, setShowVideo2] = useState(false);

    // This function is called when the link is clicked
    const toggleVideo2 = (event) => {
      // Prevent the default anchor behavior of going to the link
      event.preventDefault();

      // Set the showVideo1 state to true to show the YouTubeEmbedQuestion1 component
      setShowVideo2(!showVideo2);
    };

    const [showVideo3, setShowVideo3] = useState(false);

    // This function is called when the link is clicked
    const toggleVideo3 = (event) => {
      // Prevent the default anchor behavior of going to the link
      event.preventDefault();

      // Set the showVideo1 state to true to show the YouTubeEmbedQuestion1 component
      setShowVideo3(!showVideo3);
    };

    const toggleProTips = () => {
      setShowProTips(!showProTips);
    };

    useEffect(() => {
      if (step === 6) {
        const fetchUserData = async () => {
          const user = auth.currentUser;
          if (user) {
            const userDocRef = doc(db, "drafted-accounts", user.email);
            try {
              const docSnap = await getDoc(userDocRef);
              if (docSnap.exists()) {
                setUserData(docSnap.data());
              } else {
              }
            } catch (error) {}
          }
        };

        fetchUserData();
      }
    }, [step]); // Dependency array includes 'step'

    useEffect(() => {
      isMounted.current = true;

      return () => {
        isMounted.current = false;
      };
    }, []);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [globalUniversity, shouldUseEffect]);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [globalEmail, shouldUseEffect]);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [shouldUseEffect]);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [globalFirstName, shouldUseEffect]);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [globalLastName, shouldUseEffect]);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [globalMajor, shouldUseEffect]);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [globalGraduationMonth, shouldUseEffect]);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [globalGraduationYear, shouldUseEffect]);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [globalLinkedInProfileURL, shouldUseEffect]);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [globalVideo1, shouldUseEffect]);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [globalVideo2, shouldUseEffect]);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [globalVideo3, shouldUseEffect]);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [globalVideo1Link, shouldUseEffect]);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [globalVideo2Link, shouldUseEffect]);

    useEffect(() => {
      if (shouldUseEffect) {
      }
    }, [globalVideo3Link, shouldUseEffect]);

    useEffect(() => {
      const persistedStep = localStorage.getItem("formCurrentStep");

      if (persistedStep) {
        setStep(Number(persistedStep));
      }
    }, []);

    // Clear local storage before new onboarding
    localStorage.clear();

    switch (step) {
      case 1:
        // GA4 Page Visit Tracking for Step 1
        ReactGA4.send({
          hitType: "pageview",
          page: "/onboarding-step-1-email",
        });

        return (
          <>
            <Formik
              initialValues={{
                email: globalEmail,
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

                  setAndPersistStep(3); // skips step
                } else if (values.email.endsWith("miami.edu")) {
                  // University of Miami
                  // draftedUniversity = "University of Miami";
                  setGlobalUniversity("University of Miami");
                  // globalEmail = values.email;
                  setGlobalEmail(values.email);
                  setAndPersistStep(3); // skips step
                } else if (values.email.endsWith("usf.edu")) {
                  // University of Southern Florida
                  // draftedUniversity = "University of South Florida";
                  setGlobalUniversity("University of South Florida");
                  // globalEmail = values.email;
                  setGlobalEmail(values.email);
                  setAndPersistStep(3); // skips step
                } else {
                  // Not a drafted uni, go to next
                  // globalEmail = values.email;]

                  setGlobalEmail(values.email);
                  setAndPersistStep(2);
                }

                ReactGA4.event({
                  category: "Form",
                  action: "Submitted Email",
                  label: values.email, // Tracks the email used
                });

                if (window.ttq) {
                  window.ttq.track("Download", {
                    content_id: "form_submission",
                    email: values.email, // You can pass any relevant information
                    // Add other relevant parameters here
                  });
                }
              }}
            >
              {(formik) => {
                return (
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
                        value={formik.values.email}
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
                        <p style={{ fontWeight: "bold" }}>
                          University of Miami
                        </p>
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

                    <Persist name="persistStep1" />
                  </Form>
                );
              }}
            </Formik>
          </>
        );
      case 2:
        ReactGA4.send({
          hitType: "pageview",
          page: "/onboarding-step-2-select-university",
        });

        return (
          <>
            <Formik
              initialValues={{ university: globalUniversity }}
              validationSchema={Yup.object({
                university: Yup.object().shape({
                  label: Yup.string().required("Please select your school"),
                  value: Yup.string().required("Please select your school"),
                }),
              })}
              onSubmit={(values) => {
                if (values.university !== "") {
                  let chosenUniversity = values.university.label;

                  setGlobalUniversity(chosenUniversity);
                  setAndPersistStep(3);

                  ReactGA4.event({
                    category: "Form",
                    action: "Selected University",
                    label: chosenUniversity, // Tracks the chosen university
                  });
                }
              }}
            >
              {({ setFieldValue, values, errors, touched }) => (
                <Form>
                  <h2>🎓 Find your school</h2>
                  <p>
                    Select your university below. Employers who prioritize your
                    school will see your profile right away.
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
                      onClick={() => setAndPersistStep(1)}
                      style={previousButtonStyles}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      style={buttonStyles}
                      disabled={!values.university}
                    >
                      Continue
                    </button>
                  </div>
                  <Persist name="persistStep2" />
                </Form>
              )}
            </Formik>
          </>
        );
      case 3:
        ReactGA4.send({ hitType: "pageview", page: "/onboarding-step-3" });

        return (
          <Formik
            initialValues={{
              password: globalPassword,
              confirmPassword: globalPassword,
            }}
            enableReinitialize={true}
            validationSchema={Yup.object().shape({
              password: Yup.string()
                .required("Password is required")
                .min(6, "Password needs to be at least six characters long"),
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
                setAndPersistStep(4);

                ReactGA4.event({
                  category: "Form",
                  action: "Submitted Password",
                  label: "Password Creation", // Custom label for tracking
                });
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
              <p style={{ color: "gray" }}>
                Once you create an account, you'll start to receive Drafted
                emails. You can unsubscribe at any time.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (
                    globalEmail.endsWith("@fiu.edu") ||
                    globalEmail.endsWith("@usf.edu") ||
                    globalEmail.endsWith("@miami.edu")
                  ) {
                    setAndPersistStep(1);
                  } else {
                    setAndPersistStep(2);
                  }
                }}
                style={previousButtonStyles}
              >
                Back
              </button>
              <button type="submit" style={buttonStyles}>
                Create Account
              </button>
              <Persist name="persistStep3" />
            </Form>
          </Formik>
        );
      case 4:
        ReactGA4.send({ hitType: "pageview", page: "/onboarding-step-4-form" });

        return (
          <Formik
            initialValues={{
              firstName: globalFirstName,
              lastName: globalLastName,
              major: globalMajor,
              graduationMonth: globalGraduationMonth,
              graduationYear: globalGraduationYear,
              linkedInURL: globalLinkedInProfileURL,
              resume: null, // Initial value set to null for the resume
            }}
            validationSchema={Yup.object().shape({
              firstName: Yup.string().required("First Name is required"),
              lastName: Yup.string().required("Last Name is required"),
              major: Yup.string().required("Major is required"),
              graduationYear: Yup.number().required(
                "Graduation Year is required"
              ),
            })}
            onSubmit={async (values) => {
              // Update state with form values
              setGlobalFirstName(values.firstName);
              setGlobalLastName(values.lastName);
              setGlobalMajor(values.major);
              setGlobalGraduationMonth(values.graduationMonth);
              setGlobalGraduationYear(values.graduationYear);
              setGlobalLinkedInProfileURL(values.linkedInURL);

              // Update form completion state
              setIsFormCompleted(true);

              // TikTok Pixel tracking event
              if (window.ttq) {
                window.ttq.track("SubmitForm", {
                  content_id: "form_submission",
                  firstName: values.firstName,
                  lastName: values.lastName,
                  major: values.major,
                  graduationYear: values.graduationYear,
                  university: globalUniversity,
                });
              }

              ReactGA4.event({
                category: "Form",
                action: "Submitted Personal Info",
                label: "Step 4 Form Submission", // Custom label for tracking
              });

              // Handle text upload to Firestore
              const resumeFile = values.resume;
              await handleTextUpload(values, resumeFile);
              setAndPersistStep(5);
            }}
          >
            {({ setFieldValue }) => (
              <Form>
                <h2>💬 Tell us about yourself</h2>
                {name && <p>🙋🏽 Hi, {name}!</p>}

                <div>
                  <label htmlFor="resume">Resume (Optional)</label>
                  <button
                    type="button"
                    onClick={() => document.getElementById("resume").click()}
                    disabled={resumeUploaded || values.resume}
                  >
                    {resumeUploaded ? "Resume Uploaded" : "Upload Resume"}
                  </button>
                  <input
                    type="file"
                    id="resume"
                    name="resume"
                    accept=".pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    style={{ display: "none" }}
                    onChange={(event) => {
                      const file = event.currentTarget.files[0];
                      if (file) {
                        setFieldValue("resume", file); // Update Formik state
                        setResumeUploaded(true); // Set resumeUploaded to true
                      }
                    }}
                  />
                  <ErrorMessage
                    name="resume"
                    component="div"
                    className="error"
                  />
                  {resumeUploading && (
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
                </div>
                <br></br>
                <div>
                  <label htmlFor="firstName">First Name * </label>
                  <Field
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="What's your name?"
                    style={{ width: "95%" }}
                  />
                  <ErrorMessage
                    name="firstName"
                    component="div"
                    className="error"
                  />
                </div>
                <br />
                <div>
                  <label htmlFor="lastName">Last Name *</label>
                  <Field
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="What's your last name?"
                    style={{ width: "95%" }}
                  />
                  <ErrorMessage
                    name="lastName"
                    component="div"
                    className="error"
                  />
                </div>
                <br />
                <div>
                  <label htmlFor="major">Major *</label>
                  <Field
                    type="text"
                    id="major"
                    name="major"
                    placeholder="What's your major?"
                    style={{ width: "95%" }}
                  />
                  <ErrorMessage
                    name="major"
                    component="div"
                    className="error"
                  />
                </div>
                <br />
                <div>
                  <label htmlFor="graduationYear">Graduation Year *</label>
                  <Field
                    as="select"
                    id="graduationYear"
                    name="graduationYear"
                    style={{ width: "95%" }}
                  >
                    <option value="">Select a year</option>
                    {[...Array(8)].map((_, i) => (
                      <option key={i} value={2020 + i}>
                        {2020 + i}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="graduationYear"
                    component="div"
                    className="error"
                  />
                  <br />
                </div>
                <br />
                <div>
                  <label htmlFor="graduationMonth">
                    Graduation Month (Optional)
                  </label>
                  <Field
                    as="select"
                    id="graduationMonth"
                    name="graduationMonth"
                    style={{ width: "95%" }}
                  >
                    <option value="">Select a month</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (month) => (
                        <option key={month} value={month}>
                          {new Date(0, month - 1).toLocaleString("en-US", {
                            month: "long",
                          })}
                        </option>
                      )
                    )}
                  </Field>
                  <ErrorMessage
                    name="graduationMonth"
                    component="div"
                    className="error"
                  />
                  <br />
                </div>
                <div>
                  <br />
                  <label htmlFor="linkedInProfile">LinkedIn Profile</label>
                  <Field
                    type="text"
                    id="linkedInURL"
                    name="linkedInURL"
                    placeholder="You can paste your URL here"
                    style={{ width: "95%" }}
                  />
                  <div className="label-icons-container">
                    <img
                      src={linkedInIcon}
                      style={{
                        width: "20px",
                        display: "inline-block",
                      }}
                    />
                  </div>
                  <ErrorMessage
                    name="linkedInURL"
                    component="div"
                    className="error"
                  />
                  <br />
                </div>
                {/* <div>
                  <br />
                  <label htmlFor="resume">Resume (Optional)</label>
                  <button
                    type="button"
                    onClick={() => document.getElementById("resume").click()}
                    disabled={selectedResume || values.resume}
                  >
                    {values.resume
                      ? "Resume Uploaded"
                      : selectedResume
                      ? "Resume Selected"
                      : "Upload Resume"}
                  </button>
                  <input
                    type="file"
                    id="resume"
                    name="resume"
                    accept=".pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    style={{ display: "none" }}
                    onChange={(event) => {
                      const file = event.currentTarget.files[0];
                      if (file) {
                        setFieldValue("resume", file); // Update Formik state
                      }
                    }}
                  />
                  <ErrorMessage
                    name="resume"
                    component="div"
                    className="error"
                  />
                  {resumeUploading && (
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
                </div> */}
                <br />
                <button
                  type="button"
                  onClick={() => setAndPersistStep(3)}
                  style={previousButtonStyles}
                >
                  Back
                </button>
                <button type="submit" style={buttonStyles}>
                  Continue
                </button>
                <p>* Required fields</p>
                <Persist name="persistStep4" />
              </Form>
            )}
          </Formik>
        );
      case 5:
        ReactGA4.send({
          hitType: "pageview",
          page: "/onboarding-step-5-continued-to-profile",
        });

        return (
          <>
            <Formik
              initialValues={{ file: null }}
              onSubmit={() => {
                setAndPersistStep(6);

                // GA4 Event Tracking for Form Submission
                ReactGA4.event({
                  category: "Form",
                  action: "Completed Profile, Navigated to Dashboard",
                  label: "Step 5 Submission", // Custom label for tracking
                });
              }}
              onKeyPress={() => handleKeyPress(6)}
            >
              {({ values, setFieldValue }) => (
                <Form>
                  <h2>✨ Let's complete your profile</h2>
                  <h3>
                    Create your video resume, get recruited by hundred of
                    startups & Fortune 500 companies instantly
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-evenly",
                      alignItems: "center",
                      marginBottom: "5px",
                    }}
                  >
                    {/* <img
                      src={logoLula}
                      alt="Lula"
                      style={{ maxWidth: "100px", height: "auto" }}
                    />
                    <img
                      src={logoAmazon}
                      alt="Amazon"
                      style={{ maxWidth: "40px", height: "auto" }}
                    />
                    <img
                      src={logoGotu}
                      alt="Gotu"
                      style={{ maxWidth: "100px", height: "auto" }}
                    />
                    <img
                      src={logoJPMorgan}
                      alt="JPMorgan"
                      style={{ maxWidth: "100px", height: "auto" }}
                    /> */}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <img
                      src={getDraftedScreenshot}
                      alt="Lula"
                      style={{ maxWidth: "400px", height: "auto" }}
                    />
                  </div>

                  <p>
                    In three quick questions, you can create your video resume
                    and grab the attention of employers.<br></br>
                    <br></br>
                    Each question gives you up to a minute to show off your
                    skills and personality.<br></br>
                    <br></br>
                    Don't fret about the pressure – you can redo each answer
                    until you feel confident in your responses.
                  </p>

                  <br />

                  <br></br>
                  <button
                    type="button"
                    onClick={() => setAndPersistStep(4)}
                    style={previousButtonStyles}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Check if a file has been uploaded
                      if (!values.file) {
                        setAndPersistStep(6);
                      }

                      setShouldUseEffect(false);
                    }}
                    style={buttonStyles}
                  >
                    Continue
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
                  <Persist name="persistStep5" />
                </Form>
              )}
            </Formik>
          </>
        );

      case 6:
        if (isFormCompleted) {
          // GA4 Event Tracking for Completion
          ReactGA4.event({
            category: "Form",
            action: "Form Completed",
            label: "Step 6 Completion - Loaded Dashboard", // Custom label for tracking
          });

          redirectToLogin();
        } else {
          // GA4 Event Tracking for Restart
          ReactGA4.event({
            category: "Form",
            action: "Form Restarted",
            label: "Step 6 Restart - Back to Step 1", // Custom label for tracking
          });

          localStorage.clear();
          setAndPersistStep(1);
        }
        return null;

      case 7:
        const isMobile2 = window.innerWidth <= 768;

        const mobileForm2 = (
          <Formik
            initialValues={{ video3: null }}
            onSubmit={async (values, { setSubmitting }) => {
              if (values.video2) {
                try {
                  setIsLoading(true);
                  await handleUpload(values.video2, 2);
                  setAndPersistStep(8);
                } catch (error) {
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
                <div>
                  <a
                    href="https://youtu.be/IshJHdFFtcg?si=1T8CrRqPFuVvM6kG"
                    onClick={toggleVideo2}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#53AD7A", fontWeight: "bold" }}
                  >
                    Click to watch Question 2 Explained
                  </a>
                  <br />
                  <br />
                  {showVideo2 && <YouTubeEmbedQuestion2 />}
                </div>
                <div
                  className="video-recorder-wrapper"
                  style={{ borderRadius: "14px", overflow: "hidden" }}
                >
                  <VideoRecorder
                    key={2}
                    isOnInitially
                    timeLimit={60000}
                    showReplayControls
                    onRecordingComplete={(videoBlobOrFile) => {
                      setFieldValue("video2", videoBlobOrFile);
                    }}
                  />
                </div>
                <div className="video-frame"></div>
                <p className="video-info">Video Response: 1 min time limit</p>
                <p className="video-info">Unlimited retries</p>
                <button
                  type="button"
                  onClick={() => setAndPersistStep(6)}
                  style={previousButtonStyles}
                >
                  Back
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
                <br></br>
                <br></br>
                <label htmlFor="file" style={uploadVideoButtonStyles}>
                  Upload Question 2 and Next
                </label>
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept="video/*" // Accepts only video files
                  onChange={async (event) => {
                    const file = event.currentTarget.files[0];
                    if (file) {
                      setIsLoading(true); // Start loading stage
                      setFieldValue("file", file.name); // Store the filename in Formik's state
                      try {
                        await handleUpload(file, "2");
                        await handleTextUpload();
                        // If upload is successful, move to the desired step
                        setAndPersistStep(8);
                      } catch (err) {
                      } finally {
                        setIsLoading(false); // End loading stage
                      }
                    }
                  }}
                />
                {values.file && <span>{values.file}</span>}
                <Persist name="persistStep7" />
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
                      <div>
                        <a
                          href="https://youtu.be/IshJHdFFtcg?si=1T8CrRqPFuVvM6kG"
                          onClick={toggleVideo2}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#53AD7A", fontWeight: "bold" }}
                        >
                          Click to watch Question 2 Explained
                        </a>
                        <br />
                        <br />
                        {showVideo2 && <YouTubeEmbedQuestion2 />}
                      </div>
                      <div style={{ marginBottom: "20px" }}></div>
                      <Persist name="persistStep7" />
                    </Form>
                  </Formik>
                </div>
                <div style={{ flex: 1, marginLeft: "10px" }}>
                  <Formik
                    initialValues={{ video2: null }}
                    onSubmit={async (values, { setSubmitting }) => {
                      if (values.video2) {
                        try {
                          setIsLoading(true);
                          await handleUpload(values.video2, 2);
                          setAndPersistStep(8);
                        } catch (error) {
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
                        <div
                          className="video-recorder-wrapper"
                          style={{ borderRadius: "14px", overflow: "hidden" }}
                        >
                          <VideoRecorder
                            key={2}
                            isOnInitially
                            timeLimit={60000}
                            showReplayControls
                            onRecordingComplete={(videoBlobOrFile) => {
                              setFieldValue("video2", videoBlobOrFile);
                            }}
                          />
                        </div>
                        <div className="video-frame"></div>
                        <p className="video-info">
                          Video Response: 1 min time limit
                        </p>
                        <p className="video-info">Unlimited retries</p>
                        <button
                          type="button"
                          onClick={() => setAndPersistStep(6)}
                          style={previousButtonStyles}
                        >
                          Back
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
                        <br></br>
                        <br></br>
                        <label htmlFor="file" style={uploadVideoButtonStyles}>
                          Upload Question 2 and Next
                        </label>
                        <input
                          id="file"
                          name="file"
                          type="file"
                          accept="video/*" // Accepts only video files
                          onChange={async (event) => {
                            const file = event.currentTarget.files[0];
                            if (file) {
                              setIsLoading(true); // Start loading stage
                              setFieldValue("file", file.name); // Store the filename in Formik's state
                              try {
                                await handleUpload(file, "2");
                                await handleTextUpload();
                                // If upload is successful, move to the desired step
                                setAndPersistStep(8);
                              } catch (err) {
                              } finally {
                                setIsLoading(false); // End loading stage
                              }
                            }
                          }}
                        />
                        {values.file && <span>{values.file}</span>}
                        <Persist name="persistStep7" />
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
                try {
                  setIsLoading(true);

                  await handleUpload(values.video3, 3);
                  // if (globalResume != null) { await handleResumeUpload(globalResume); }
                  await handleTextUpload();
                  setAndPersistStep(9);
                } catch (error) {
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
                        <span style={{ fontWeight: "bold", color: "#53AD7A" }}>
                          This is like your "highlight reel" moment. Show off!
                        </span>{" "}
                        Share specific examples where you exhibited
                        problem-solving skills and the ability to overcome
                        obstacles.
                      </li>
                      <li>
                        <span style={{ fontWeight: "bold", color: "#53AD7A" }}>
                          Pick one specific challenge in your studies, personal
                          life, or work/internships.
                        </span>{" "}
                        Tell a story with a positive outcome and/or positive
                        lesson learned that you can contribute to the workplace.
                      </li>
                      <li>
                        <span style={{ fontWeight: "bold", color: "#53AD7A" }}>
                          Emphasize key "soft skills".
                        </span>{" "}
                        Examples of soft skills include creativity, leadership,
                        resilience, adaptability, quick decision-making, etc.
                        Relate these to the specific challenge and outcome you
                        are discussing.
                      </li>
                    </ul>
                  )}
                </p>
                <div>
                  <a
                    href="https://youtu.be/W1vP__7BAEY?si=VJph5kNvmRmTe4dV"
                    onClick={toggleVideo3}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#53AD7A", fontWeight: "bold" }}
                  >
                    Click to watch Question 3 Explained
                  </a>
                  <br />
                  <br />
                  {showVideo3 && <YouTubeEmbedQuestion3 />}
                </div>
                <div
                  className="video-recorder-wrapper"
                  style={{ borderRadius: "14px", overflow: "hidden" }}
                >
                  <VideoRecorder
                    key={3}
                    isOnInitially
                    timeLimit={60000}
                    showReplayControls
                    onRecordingComplete={(videoBlobOrFile) => {
                      setFieldValue("video3", videoBlobOrFile);
                    }}
                  />
                </div>
                <div className="video-frame"></div>
                <p className="video-info">Video Response: 1 min time limit</p>
                <p className="video-info">Unlimited retries</p>
                <button
                  type="button"
                  onClick={() => setAndPersistStep(7)}
                  style={previousButtonStyles}
                >
                  Back
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
                <br></br>
                <br></br>
                <label htmlFor="file" style={uploadVideoButtonStyles}>
                  Upload Question 3 and Next
                </label>
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept="video/*" // Accepts only video files
                  onChange={async (event) => {
                    const file = event.currentTarget.files[0];
                    if (file) {
                      setIsLoading(true); // Start loading stage
                      setFieldValue("file", file.name); // Store the filename in Formik's state
                      try {
                        await handleUpload(file, "3");
                        await handleTextUpload();
                        // If upload is successful, move to the desired step
                        setAndPersistStep(9);
                      } catch (err) {
                      } finally {
                        setIsLoading(false); // End loading stage
                      }
                    }
                  }}
                />
                {values.file && <span>{values.file}</span>}
                <Persist name="persistStep8" />
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
                      <div>
                        <a
                          href="https://youtu.be/W1vP__7BAEY?si=VJph5kNvmRmTe4dV"
                          onClick={toggleVideo3}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#53AD7A", fontWeight: "bold" }}
                        >
                          Click to watch Question 3 Explained
                        </a>
                        <br />
                        <br />
                        {showVideo3 && <YouTubeEmbedQuestion3 />}
                      </div>
                      <div style={{ marginBottom: "20px" }}></div>
                      <Persist name="persistStep8" />
                    </Form>
                  </Formik>
                </div>
                <div style={{ flex: 1, marginLeft: "10px" }}>
                  <Formik
                    initialValues={{ video3: null }}
                    onSubmit={async (values, { setSubmitting }) => {
                      if (values.video3) {
                        try {
                          setIsLoading(true);
                          await handleUpload(values.video3, 3);
                          await handleTextUpload();
                          setAndPersistStep(9);
                        } catch (error) {
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
                        <div
                          className="video-recorder-wrapper"
                          style={{ borderRadius: "14px", overflow: "hidden" }}
                        >
                          <VideoRecorder
                            key={3}
                            isOnInitially
                            timeLimit={60000}
                            showReplayControls
                            onRecordingComplete={(videoBlobOrFile) => {
                              setFieldValue("video3", videoBlobOrFile);
                            }}
                          />
                        </div>
                        <div className="video-frame"></div>
                        <p className="video-info">
                          Video Response: 1 min time limit
                        </p>
                        <p className="video-info">Unlimited retries</p>
                        <button
                          type="button"
                          onClick={() => setAndPersistStep(7)}
                          style={previousButtonStyles}
                        >
                          Back
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
                        <br></br>
                        <br></br>
                        <label htmlFor="file" style={uploadVideoButtonStyles}>
                          Upload Question 3 and Next
                        </label>
                        <input
                          id="file"
                          name="file"
                          type="file"
                          accept="video/*" // Accepts only video files
                          onChange={async (event) => {
                            const file = event.currentTarget.files[0];
                            if (file) {
                              setIsLoading(true); // Start loading stage
                              setFieldValue("file", file.name); // Store the filename in Formik's state
                              try {
                                await handleUpload(file, "3");
                                await handleTextUpload();
                                // If upload is successful, move to the desired step
                                setAndPersistStep(9);
                              } catch (err) {
                              } finally {
                                setIsLoading(false); // End loading stage
                              }
                            }
                          }}
                        />
                        {values.file && <span>{values.file}</span>}
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
                onClick={() => setAndPersistStep(8)}
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
              <Persist name="persistStep9" />
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
        <RenderStepContent step={step} setStep={setStep} />
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
