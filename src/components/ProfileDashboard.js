import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage, auth } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import banner from "./banner.png";
import recordTemplate from "./drafted-template.jpeg";
import ReactGA4 from "react-ga4";
import "./ProfileDashboard.css";
import { DoubleBubble } from "react-spinner-animated";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ProfileDashboard = ({
  firstName,
  lastName,
  university,
  major,
  graduationMonth,
  graduationYear,
  email,
  linkedInURL,
}) => {
  const resumes = [
    { id: 1, title: "What's your story?" },
    { id: 2, title: "What makes you stand out?" },
    { id: 3, title: "Tell us about a time when you overcame a challenge!" },
  ];

  const exampleVideos = [
    "https://firebasestorage.googleapis.com/v0/b/drafted-6c302.appspot.com/o/quinn-1.mov?alt=media&token=628534b2-01d4-4614-b50d-4a5f3cca9e5b",
    "https://firebasestorage.googleapis.com/v0/b/drafted-6c302.appspot.com/o/quinn-2.mp4?alt=media&token=aac9f8af-1561-4052-b9ab-d7ca75b82c3c",
    "https://firebasestorage.googleapis.com/v0/b/drafted-6c302.appspot.com/o/quinn-3-updated.mp4?alt=media&token=8fdd91b1-b327-4c7e-84d9-d51c37ea31eb",
  ];

  const exampleVideoTitles = [
    "Listen to Quinn's story",
    "What makes him stand out",
    "How Quinn overcame a challenge",
  ];

  const [resumeIndex, setResumeIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoUrl2, setVideoUrl2] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [videoUrl3, setVideoUrl3] = useState("");
  const [editMajor, setMajor] = useState(major);
  const [editEmail, setEmail] = useState(email);
  const [showVideoResumePopup, setShowVideoResumePopup] = useState(false);
  const [showTipPopup, setShowTipPopup] = useState(false);
  const [popupContent, setPopupContent] = useState("");
  const [bannerContent, setBannerContent] = useState(false);
  const [editLinkedInURL, setLinkedInURL] = useState(linkedInURL);
  const [editGraduationMonth, setGraduationMonth] = useState(graduationMonth); // State for graduationMonth
  const [editGraduationYear, setGraduationYear] = useState(graduationYear); // State for graduationYear
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const navigate = useNavigate();
  ReactGA4.initialize("G-3M4KL5NDYG");

  const [editMode, setEditMode] = useState({
    university: false,
    major: false,
    graduationYear: false,
    email: false,
    linkedInURL: false,
  });

  const toggleEditMode = (field) => {
    if (field === "graduationYear" && editGraduationYear !== graduationYear) {
      // Update Firebase graduationYear
      const userDocRef = doc(db, "drafted-accounts", email);
      updateDoc(userDocRef, { graduationYear: editGraduationYear });
    }

    setEditMode({ ...editMode, [field]: !editMode[field] });
  };

  const fetchVideoAsBlob = async (path) => {
    try {
      const response = await fetch(path);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error fetching video:", error);
      return "";
    }
  };

  const handleVideoResumeClick = () => {
    setPopupContent(`
      <div class="bannerContainer">
        <img src="${banner}" alt="Banner" class="bannerImage" />
      </div>
      <p>Video resumes are a way to leverage your personal voice to stand out to recruiters.</p>
    `);
    setShowVideoResumePopup(true);
  };

  const handleTipClick = (index) => {
    const content = (
      <div>
        <div className="video-container">
          <VideoPlayer url={exampleVideos[index]} />
        </div>
        <ul>
          {index === 0 && (
            <>
              <li>
                This is the typical "walk me through your resume" question. Talk
                about what you majored in and why. What internships or
                experiences you've had, and what have you learned from them?
                What skills will you bring to the hiring company?
              </li>
              <li>
                Show why you're the best candidate to get an opportunity, in
                terms of degree, internships, and experience as well as soft
                skills which truly set you apart. Talk about what you are
                passionate about, and what you hope to explore in your first
                role.
              </li>
              <li>
                Demonstrate that you can communicate clearly and effectively,
                present yourself professionally, and most importantly have fun
                and show your enthusiasm to go pro and put that degree to work!
              </li>
            </>
          )}
          {index === 1 && (
            <>
              <li>
                Don’t be modest — this is the time to be confident about your
                strengths and really sell yourself to employers. Focus on your
                unique skills and experiences, and explain why these make you
                the ideal candidate.
              </li>
              <li>
                Focus on your education, skills, and experiences that make you
                unique! Tell employers how your unique skills will help the
                company succeed.
              </li>
              <li>
                Employers ask this to identify reasons why hiring you is better
                than hiring a similarly qualified candidate. Use specific
                examples to demonstrate your skills and achievements, and relate
                them back to the requirements of the job.
              </li>
            </>
          )}
          {index === 2 && (
            <>
              <li>
                This is like your "highlight reel" moment. Show off! Share
                specific examples where you exhibited problem-solving skills and
                the ability to overcome obstacles.
              </li>
              <li>
                Pick one specific challenge in your studies, personal life, or
                work/internships. Tell a story with a positive outcome and/or
                positive lesson learned that you can contribute to the
                workplace.
              </li>
              <li>
                Emphasize key "soft skills". Examples of soft skills include
                creativity, leadership, resilience, adaptability, quick
                decision-making, etc. Relate these to the specific challenge and
                outcome you are discussing.
              </li>
            </>
          )}
        </ul>
      </div>
    );
    setPopupContent(content);
    setShowTipPopup(true);
  };

  // Update fields in Firebase and local state
  const updateField = async (field, newValue) => {
    if (field !== "email") {
      // Prevent updating email
      const userDocRef = doc(db, "drafted-accounts", email);
      await updateDoc(userDocRef, { [field]: newValue });

      // Update local state
      switch (field) {
        case "major":
          setMajor(newValue);
          break;
        case "linkedInURL":
          setLinkedInURL(newValue);
          break;
        case "graduationYear": // Update editGraduationYear state
          setGraduationYear(newValue);
          break;
        // ... handle other fields if necessary
      }

      toggleEditMode(field);
    }
  };

  const handleRecordClick = (id) => {
    console.log(id);
    ReactGA4.event({
      category: "Video Resume",
      action: `Clicked to Record Video ${id}`,
      label: `Record Video ${id}`,
    });
    navigate(`/video-recorder${id}`);
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const storageRef = ref(storage, `resumes/${email}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const userDocRef = doc(db, "drafted-accounts", email);
        await updateDoc(userDocRef, { resume: downloadURL });

        setResumeUrl(downloadURL); // Update state with new resume URL
        console.log("Resume uploaded and Firestore updated.");
      } catch (error) {
        console.error("Error uploading resume:", error);
      }
    }
  };

  const handleViewResumeClick = (event) => {
    if (!resumeUrl) {
      // If resumeUrl is empty, display the message and prevent the default behavior
      event.preventDefault();
      alert("Upload resume first to view");
    }
  };

  const handleSignOut = () => {
    setIsSigningOut(true);
    // Perform Firebase sign out logic
    signOut(auth)
      .then(() => {
        console.log("Signed out");
        // Redirect to the Login page
        navigate("/login");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
        // Handle any sign out errors here
        navigate("/login");
      });
  };

  useEffect(() => {
    const urls = [videoUrl, videoUrl2, videoUrl3];
    const count = urls.filter((url) => url).length;

    if (count === 3) {
      // Three URLs exist
      setResumeIndex(3);
    } else if (count === 2) {
      // Two URLs exist
      setResumeIndex(2);
    } else if (count === 1) {
      // Only one URL exists
      setResumeIndex(1);
    } else {
      // No URLs exist or all URLs exist
      setResumeIndex(0);
    }
  }, [videoUrl, videoUrl2, videoUrl3]);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "drafted-accounts", user.email);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setVideoUrl(userData.video1);
          setVideoUrl2(userData.video2);
          setVideoUrl3(userData.video3);
          if (userData.resume) {
            setResumeUrl(userData.resume);
          }
          if (userData.linkedInURL) {
            setLinkedInURL(userData.linkedInURL);
          }
          if (userData.major) {
            setMajor(userData.major); // Ensure this line is present
          }
        } else {
          console.log("No such document!");
        }
      } else {
        navigate("/login");
      }
    };

    checkAuthAndFetchData();
  }, [navigate, auth]);

  useEffect(() => {
    const fetchVideoUrls = async () => {
      try {
        const userDocRef = doc(db, "users", "userID"); // Adjust path as necessary
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const videoPaths = docSnap.data().videoPaths; // Adjust according to your data structure
          loadVideos(videoPaths);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    };

    fetchVideoUrls();
  }, []); // Dependency array might include user-specific info if dynamic

  const loadVideos = async (videoPaths) => {
    const urls = await Promise.all(
      videoPaths.map((path) => fetchVideoAsBlob(path))
    );
    setVideoUrl(urls[0]);
    setVideoUrl2(urls[1]);
    setVideoUrl3(urls[2]);
  };

  const VideoPlayer = ({ url }) => {
    const containerClass = url
      ? "video-container"
      : "video-container default-video";

    return (
      <div className={containerClass}>
        {url ? (
          <video
            src={url}
            controls
            crossOrigin="anonymous"
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "8px",
              objectFit: "contain", // Ensures the video is fully displayed
            }}
            onError={(e) => {
              console.error("Error playing video:", e);
            }}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={recordTemplate}
            alt="Default Record"
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "8px",
              objectFit: "contain", // Ensures the image is fully displayed
            }}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <div className="profileDashboard">
        <aside className="sideBar">
          <div>
            <a href="#">
              <DraftedLogo />
            </a>
          </div>
          <div className="sideBarList">
            {/* <ul className="sideBarListInner">
              {resumes.map(({ id }) => {
                const isActive = id === resumeIndex
                return (
                  <li key={id}>
                    <button
                      onClick={() => setResumeIndex(id)}
                      className={
                        isActive ? 'sideBarLink active' : 'sideBarLink'
                      }
                    >
                      <GridIcon />
                    </button>
                  </li>
                )
              })}
            </ul> */}
          </div>
        </aside>
        <main className="mainContent">
          <nav className="navbar">
            <div className="navbarProfile">
              {/* <button className="navbarNotifications">
                <NotificationIcon />
              </button> */}
              <div className="navbarProfileInner">
                {/* <div
                  className="navbarProfileAvatar"
                  style={{
                    backgroundImage:
                      'url(https://images.pexels.com/photos/4098343/pexels-photo-4098343.jpeg)',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                  }}
                ></div> */}
                <div className="navbarProfileInfo">
                  <button onClick={handleSignOut} className="navbarProfileName">
                    {isSigningOut ? (
                      <>
                        <DoubleBubble
                          text={"Signing out..."}
                          bgColor={"#000"}
                          center={true}
                          width={"18px"}
                          height={"18px"}
                        />
                        Signing out...
                      </>
                    ) : (
                      "Sign Out"
                    )}
                  </button>
                  {/*<h2 className="navbarProfileName">{`${firstName} ${lastName}`}</h2>
                   <p className="navbarProfileClass">
                    Class of {graduationYear}
                  </p> */}
                </div>
                {/* <button className="navbarProfileLinks">
                  <ChevronDownIcon />
                </button> */}
              </div>
            </div>
          </nav>
          {/* End Navbar */}
          {/* Start Profile Section */}
          <section className="profile">
            <div className="profileInfo">
              {/* <div
                className="profileInfoPicture"
                style={{
                  backgroundImage:
                    'url(https://images.pexels.com/photos/4098343/pexels-photo-4098343.jpeg)',
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                }}
              /> */}
              <div className="profileInfoInner">
                <p className="profileInfoClass">
                  Class of{" "}
                  {editMode.graduationYear ? (
                    <input
                      type="text"
                      value={editGraduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      onBlur={() =>
                        updateField("graduationYear", editGraduationYear)
                      }
                    />
                  ) : (
                    <>{editGraduationYear}</>
                  )}
                  <button
                    className="profileInfoEdit"
                    onClick={() => toggleEditMode("graduationYear")}
                  >
                    {editMode.graduationYear ? "Save" : <EditIcon />}
                  </button>
                </p>
                <h1 className="profileInfoName">
                  {`${firstName} ${lastName}`}
                  <span>
                    <VerificationIcon />
                  </span>
                </h1>
                <div className="editableHeader">
                  <a
                    href={editMode.email ? undefined : "mailto:#"}
                    className="profileInfoEmail"
                  >
                    {editMode.email ? (
                      <input
                        type="text"
                        value={editEmail}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => updateField("email", editEmail)}
                      />
                    ) : (
                      <>{email}</>
                    )}
                  </a>
                  {/* <button className="profileInfoEdit" onClick={() => toggleEditMode("email")}>
                    {editMode.email ? "Save" : <EditIcon />}
                  </button> */}
                </div>
              </div>
            </div>
            <div className="profileExper">
              <div className="profileExperEduc">
                {/* <div className="profileExperPicture" /> */}
                <div className="profileExperContent">
                  <div className="editableHeader">
                    <h4 className="profileExperTitle">Education</h4>
                    <button
                      className="profileInfoEdit"
                      onClick={() => toggleEditMode("major")}
                    >
                      {editMode.major ? "Save" : <EditIcon />}
                    </button>
                  </div>
                  <p className="profileExperSubtitle">{university}</p>
                  <p className="profileExperPara">
                    {editMode.major ? (
                      <input
                        type="text"
                        value={editMajor}
                        onChange={(e) => setMajor(e.target.value)}
                        onBlur={() => updateField("major", editMajor)}
                      />
                    ) : (
                      <>{editMajor}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="profileExperJobs">
                {/* <div className="profileExperPicture" /> */}
                <div className="profileExperContent">
                  <div className="header">
                    <h4 className="profileExperTitle">Resume</h4>
                  </div>
                  <button
                    onClick={() =>
                      document.getElementById("resume-upload").click()
                    }
                    className="edit-button"
                  >
                    {resumeUrl ? "Re-upload Resume" : "Upload Resume"}
                  </button>
                  <input
                    type="file"
                    id="resume-upload"
                    style={{ display: "none" }}
                    onChange={handleResumeUpload}
                  />
                  <a
                    href={resumeUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-resume-link"
                    onClick={handleViewResumeClick}
                  >
                    <strong>View Resume</strong>
                  </a>
                  <br></br>
                </div>
              </div>
              <div className="profileExperLinkedIn">
                <div className="profileExperContent">
                  <div className="editableHeader">
                    <h4 className="profileExperTitle">LinkedIn</h4>
                    <button
                      className="profileInfoEdit"
                      onClick={() => toggleEditMode("linkedInURL")}
                    >
                      {editMode.linkedInURL ? "Save" : <EditIcon />}
                    </button>
                  </div>
                  {editMode.linkedInURL ? (
                    <input
                      type="text"
                      value={editLinkedInURL}
                      onChange={(e) => setLinkedInURL(e.target.value)}
                      onBlur={() => updateField("linkedInURL", editLinkedInURL)}
                    />
                  ) : (
                    <a href={linkedInURL} className="profileExperPara">
                      {linkedInURL}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
          {/* End Profile Section */}
          {/* Start Progress Bar */}
          <section className="progressBarSection">
            {resumeIndex === 3 && (
              <div className="congratulationsBanner">
                <h1>You're ready to get drafted! 🤘</h1>
                <p>Keep an eye on your inbox.</p>
                <br></br>
              </div>
            )}
            {resumeIndex === 2 && (
              <div className="congratulationsBanner">
                <h1>Almost there... Ready to launch... 🚀</h1>
                <br></br>
              </div>
            )}
            {resumeIndex === 1 && (
              <div className="congratulationsBanner">
                <h1>Only 2 more to go... You got this! ✊</h1>
                <br></br>
              </div>
            )}
            {resumeIndex === 0 && (
              <div className="congratulationsBanner">
                <h1>3 videos away from getting drafted... Let's do this! 🔥</h1>
                <br></br>
              </div>
            )}
            <div className="progress">
              <span
                className="progressCompleted"
                style={{ width: (100 * resumeIndex) / resumes.length + "%" }}
              >
                {resumeIndex > 0 && (
                  <button className="progressStepBtn active">
                    <OkIcon />
                  </button>
                )}
              </span>
              <button className="progressStepBtn"></button>
              <button className="progressStepBtn"></button>
              <button className="progressStepBtn last"></button>
            </div>
            {/* <div className="progress info">
            </div> */}
          </section>
          {/* End Progress Bar */}
          {/* Start Recently Joined Section */}
          <section className="recently">
            <h3 className="profileInfoName video">
              Video Resume
              <button
                className="sectionTitleInfo"
                onClick={handleVideoResumeClick}
              >
                <QuestionMarkIcon />
              </button>
            </h3>
            <ul className="recentlyList">
              {[videoUrl, videoUrl2, videoUrl3].map((item, index) => (
                <li key={index} className="recentlyListItem">
                  <h4 className="recentlyListItemName">
                    {resumes[index].id}. {resumes[index].title}
                  </h4>
                  <div className="recentlyListItemPicture">
                    <VideoPlayer url={item} />
                  </div>
                  <div className="resumeInfoFooter">
                    <button
                      className="resumeInfoFooterBtn"
                      onClick={() => handleRecordClick(index + 1)}
                    >
                      Record
                    </button>
                    <button
                      className="resumeInfoFooterBtn"
                      onClick={() => handleTipClick(index)}
                    >
                      Example
                    </button>
                  </div>
                  {/* <div className="exampleVideo">
                    <h5>{exampleVideoTitles[index]}</h5>
                    <VideoPlayer url={exampleVideos[index]} />
                  </div> */}
                </li>
              ))}
            </ul>
          </section>

          {/* End Recently Joined Section */}
          {/* Start Resume Section */}
          {/* <ResumeRecord resume={resumes.find(r => r.id === resumeIndex)} /> */}
          {/* End Resume Section */}
        </main>

        {showVideoResumePopup && (
          <div className="popup">
            <div className="popup-content">
              <div dangerouslySetInnerHTML={{ __html: popupContent }}></div>
              <button
                className="close-btn"
                onClick={() => setShowVideoResumePopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {showTipPopup && (
          <div className="popup">
            <div className="popup-content">
              {popupContent}
              <button
                className="close-btn"
                onClick={() => setShowTipPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
// Svgs
function DraftedLogo() {
  return (
    <svg
      width="115"
      height="23"
      viewBox="0 0 115 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.784 14.16C0.784 12.5547 1.08267 11.1453 1.68 9.932C2.296 8.71867 3.12667 7.78533 4.172 7.132C5.21733 6.47867 6.384 6.152 7.672 6.152C8.69867 6.152 9.632 6.36667 10.472 6.796C11.3307 7.22533 12.0027 7.804 12.488 8.532V1.28H17.276V22H12.488V19.76C12.04 20.5067 11.396 21.104 10.556 21.552C9.73467 22 8.77333 22.224 7.672 22.224C6.384 22.224 5.21733 21.8973 4.172 21.244C3.12667 20.572 2.296 19.6293 1.68 18.416C1.08267 17.184 0.784 15.7653 0.784 14.16ZM12.488 14.188C12.488 12.9933 12.152 12.0507 11.48 11.36C10.8267 10.6693 10.024 10.324 9.072 10.324C8.12 10.324 7.308 10.6693 6.636 11.36C5.98267 12.032 5.656 12.9653 5.656 14.16C5.656 15.3547 5.98267 16.3067 6.636 17.016C7.308 17.7067 8.12 18.052 9.072 18.052C10.024 18.052 10.8267 17.7067 11.48 17.016C12.152 16.3253 12.488 15.3827 12.488 14.188ZM25.5279 8.98C26.0879 8.12133 26.7879 7.44933 27.6279 6.964C28.4679 6.46 29.4012 6.208 30.4279 6.208V11.276H29.1119C27.9172 11.276 27.0212 11.5373 26.4239 12.06C25.8266 12.564 25.5279 13.46 25.5279 14.748V22H20.7399V6.376H25.5279V8.98ZM31.7645 14.16C31.7645 12.5547 32.0631 11.1453 32.6605 9.932C33.2765 8.71867 34.1071 7.78533 35.1525 7.132C36.1978 6.47867 37.3645 6.152 38.6525 6.152C39.7538 6.152 40.7151 6.376 41.5365 6.824C42.3765 7.272 43.0205 7.86 43.4685 8.588V6.376H48.2565V22H43.4685V19.788C43.0018 20.516 42.3485 21.104 41.5085 21.552C40.6871 22 39.7258 22.224 38.6245 22.224C37.3551 22.224 36.1978 21.8973 35.1525 21.244C34.1071 20.572 33.2765 19.6293 32.6605 18.416C32.0631 17.184 31.7645 15.7653 31.7645 14.16ZM43.4685 14.188C43.4685 12.9933 43.1325 12.0507 42.4605 11.36C41.8071 10.6693 41.0045 10.324 40.0525 10.324C39.1005 10.324 38.2885 10.6693 37.6165 11.36C36.9631 12.032 36.6365 12.9653 36.6365 14.16C36.6365 15.3547 36.9631 16.3067 37.6165 17.016C38.2885 17.7067 39.1005 18.052 40.0525 18.052C41.0045 18.052 41.8071 17.7067 42.4605 17.016C43.1325 16.3253 43.4685 15.3827 43.4685 14.188ZM59.5604 10.352H56.9844V22H52.1964V10.352H50.4604V6.376H52.1964V5.928C52.1964 4.00533 52.747 2.54933 53.8484 1.56C54.9497 0.551999 56.5644 0.0479989 58.6924 0.0479989C59.047 0.0479989 59.3084 0.0573321 59.4764 0.0759985V4.136C58.5617 4.08 57.9177 4.21067 57.5444 4.528C57.171 4.84533 56.9844 5.41467 56.9844 6.236V6.376H59.5604V10.352ZM70.5182 17.94V22H68.0822C66.3462 22 64.9929 21.58 64.0222 20.74C63.0516 19.8813 62.5662 18.4907 62.5662 16.568V10.352H60.6622V6.376H62.5662V2.568H67.3542V6.376H70.4902V10.352H67.3542V16.624C67.3542 17.0907 67.4662 17.4267 67.6902 17.632C67.9142 17.8373 68.2876 17.94 68.8102 17.94H70.5182ZM87.9132 13.936C87.9132 14.384 87.8852 14.8507 87.8292 15.336H76.9932C77.0679 16.3067 77.3759 17.0533 77.9172 17.576C78.4772 18.08 79.1586 18.332 79.9612 18.332C81.1559 18.332 81.9866 17.828 82.4532 16.82H87.5492C87.2879 17.8467 86.8119 18.7707 86.1212 19.592C85.4492 20.4133 84.5999 21.0573 83.5732 21.524C82.5466 21.9907 81.3986 22.224 80.1292 22.224C78.5986 22.224 77.2359 21.8973 76.0412 21.244C74.8466 20.5907 73.9132 19.6573 73.2412 18.444C72.5692 17.2307 72.2332 15.812 72.2332 14.188C72.2332 12.564 72.5599 11.1453 73.2132 9.932C73.8852 8.71867 74.8186 7.78533 76.0132 7.132C77.2079 6.47867 78.5799 6.152 80.1292 6.152C81.6412 6.152 82.9852 6.46933 84.1612 7.104C85.3372 7.73867 86.2519 8.644 86.9052 9.82C87.5772 10.996 87.9132 12.368 87.9132 13.936ZM83.0132 12.676C83.0132 11.8547 82.7332 11.2013 82.1732 10.716C81.6132 10.2307 80.9132 9.988 80.0732 9.988C79.2706 9.988 78.5892 10.2213 78.0292 10.688C77.4879 11.1547 77.1519 11.8173 77.0212 12.676H83.0132ZM89.4871 14.16C89.4871 12.5547 89.7858 11.1453 90.3831 9.932C90.9991 8.71867 91.8298 7.78533 92.8751 7.132C93.9205 6.47867 95.0871 6.152 96.3751 6.152C97.4018 6.152 98.3351 6.36667 99.1751 6.796C100.034 7.22533 100.706 7.804 101.191 8.532V1.28H105.979V22H101.191V19.76C100.743 20.5067 100.099 21.104 99.2591 21.552C98.4378 22 97.4765 22.224 96.3751 22.224C95.0871 22.224 93.9205 21.8973 92.8751 21.244C91.8298 20.572 90.9991 19.6293 90.3831 18.416C89.7858 17.184 89.4871 15.7653 89.4871 14.16ZM101.191 14.188C101.191 12.9933 100.855 12.0507 100.183 11.36C99.5298 10.6693 98.7271 10.324 97.7751 10.324C96.8231 10.324 96.0111 10.6693 95.3391 11.36C94.6858 12.032 94.3591 12.9653 94.3591 14.16C94.3591 15.3547 94.6858 16.3067 95.3391 17.016C96.0111 17.7067 96.8231 18.052 97.7751 18.052C98.7271 18.052 99.5298 17.7067 100.183 17.016C100.855 16.3253 101.191 15.3827 101.191 14.188Z"
        fill="black"
      />
      <path
        d="M111.683 22.224C110.843 22.224 110.152 21.9813 109.611 21.496C109.088 20.992 108.827 20.376 108.827 19.648C108.827 18.9013 109.088 18.276 109.611 17.772C110.152 17.268 110.843 17.016 111.683 17.016C112.504 17.016 113.176 17.268 113.699 17.772C114.24 18.276 114.511 18.9013 114.511 19.648C114.511 20.376 114.24 20.992 113.699 21.496C113.176 21.9813 112.504 22.224 111.683 22.224Z"
        fill="#53AD7A"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8.5084 12.9223H4.21285C3.09594 12.9209 2.02517 12.4767 1.2354 11.6869C0.445632 10.8971 0.00134688 9.82635 0 8.70944L0 4.21285C0.00134688 3.09595 0.445632 2.02517 1.2354 1.2354C2.02517 0.445632 3.09594 0.00134689 4.21285 0L8.5084 0C9.62574 0.000673302 10.6972 0.444661 11.4875 1.23451C12.2778 2.02435 12.7224 3.09551 12.7238 4.21285V8.70944C12.7224 9.82635 12.2782 10.8971 11.4884 11.6869C10.6986 12.4767 9.62784 12.9209 8.51094 12.9223M4.21285 2.29792C3.70518 2.29859 3.2185 2.50056 2.85953 2.85953C2.50056 3.21851 2.29859 3.70519 2.29792 4.21285V8.70944C2.29859 9.21711 2.50056 9.70379 2.85953 10.0628C3.2185 10.4217 3.70518 10.6237 4.21285 10.6244H8.5084C9.01606 10.6237 9.50274 10.4217 9.86171 10.0628C10.2207 9.70379 10.4227 9.21711 10.4233 8.70944V4.21285C10.4227 3.70519 10.2207 3.21851 9.86171 2.85953C9.50274 2.50056 9.01606 2.29859 8.5084 2.29792H4.21285Z" />
      <path d="M23.7872 27.8981H19.4853C18.3688 27.8968 17.2985 27.4528 16.5088 26.6636C15.7191 25.8744 15.2745 24.8043 15.2725 23.6878V19.1887C15.2738 18.0718 15.7181 17.001 16.5079 16.2112C17.2976 15.4215 18.3684 14.9772 19.4853 14.9758H23.7872C24.9041 14.9772 25.9749 15.4215 26.7647 16.2112C27.5545 17.001 27.9987 18.0718 28.0001 19.1887V23.6878C27.9981 24.8043 27.5535 25.8744 26.7638 26.6636C25.9741 27.4528 24.9037 27.8968 23.7872 27.8981ZM19.4917 17.2737C18.984 17.2744 18.4973 17.4764 18.1384 17.8354C17.7794 18.1943 17.5774 18.681 17.5767 19.1887V23.6878C17.5791 24.1933 17.7809 24.6774 18.1383 25.0348C18.4958 25.3922 18.9798 25.594 19.4853 25.5964H23.7872C24.2927 25.594 24.7768 25.3922 25.1342 25.0348C25.4916 24.6774 25.6935 24.1933 25.6958 23.6878V19.1887C25.6951 18.6821 25.494 18.1964 25.1364 17.8376C24.7788 17.4788 24.2938 17.2761 23.7872 17.2737H19.4917Z" />
      <path d="M8.5084 27.8981H4.21285C3.09638 27.8968 2.026 27.4528 1.2363 26.6636C0.446602 25.8744 0.00201994 24.8043 0 23.6878L0 19.1887C0.00134688 18.0718 0.445632 17.001 1.2354 16.2112C2.02517 15.4215 3.09594 14.9772 4.21285 14.9758H8.5084C9.62574 14.9765 10.6972 15.4205 11.4875 16.2103C12.2778 17.0002 12.7224 18.0713 12.7238 19.1887V23.6878C12.7224 24.8047 12.2782 25.8755 11.4884 26.6653C10.6986 27.455 9.62784 27.8993 8.51094 27.9007M4.21539 17.2763C3.70773 17.277 3.22105 17.4789 2.86207 17.8379C2.5031 18.1969 2.30113 18.6836 2.30046 19.1912V23.6878C2.30281 24.1939 2.50517 24.6786 2.86341 25.0361C3.22165 25.3937 3.70672 25.595 4.21285 25.5964H8.5084C9.01496 25.5957 9.50068 25.3946 9.85947 25.037C10.2183 24.6794 10.421 24.1944 10.4233 23.6878V19.1887C10.4227 18.681 10.2207 18.1943 9.86171 17.8354C9.50274 17.4764 9.01606 17.2744 8.5084 17.2737L4.21539 17.2763Z" />
      <path d="M23.7872 12.9223H19.4853C18.3684 12.9209 17.2976 12.4767 16.5079 11.6869C15.7181 10.8971 15.2738 9.82635 15.2725 8.70944V4.21285C15.2738 3.09595 15.7181 2.02517 16.5079 1.2354C17.2976 0.445632 18.3684 0.00134689 19.4853 0L23.7872 0C24.9041 0.00134689 25.9749 0.445632 26.7647 1.2354C27.5545 2.02517 27.9987 3.09595 28.0001 4.21285V8.70944C27.9987 9.82635 27.5545 10.8971 26.7647 11.6869C25.9749 12.4767 24.9041 12.9209 23.7872 12.9223ZM19.4917 2.29792C18.984 2.29859 18.4973 2.50056 18.1384 2.85953C17.7794 3.21851 17.5774 3.70519 17.5767 4.21285V8.70944C17.5774 9.21601 17.7785 9.70173 18.1361 10.0605C18.4937 10.4193 18.9788 10.622 19.4853 10.6244H23.7872C24.2938 10.622 24.7788 10.4193 25.1364 10.0605C25.494 9.70173 25.6951 9.21601 25.6958 8.70944V4.21285C25.6951 3.70629 25.494 3.22056 25.1364 2.86177C24.7788 2.50298 24.2938 2.30027 23.7872 2.29792H19.4917Z" />
      <rect x="16.7954" y="1.59955" width="9.59737" height="9.59737" />
      <rect x="1.59961" y="1.59955" width="9.59737" height="9.59737" />
      <rect x="1.59961" y="16.7955" width="9.59737" height="9.59737" />
      <rect x="16.7954" y="16.7955" width="9.59737" height="9.59737" />
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg
      width="20"
      height="23"
      viewBox="0 0 20 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.95985 14.3081L2.17761 14.0887V13.7796V8.625C2.17761 6.53497 3.00293 4.53144 4.47058 3.05493C5.93807 1.57858 7.92745 0.75 10.0008 0.75C12.0742 0.75 14.0636 1.57858 15.5311 3.05493C16.9987 4.53144 17.8241 6.53497 17.8241 8.625V13.7796V14.0887L18.0418 14.3081L19.0505 15.324C19.0507 15.3242 19.0509 15.3245 19.0512 15.3247C19.1458 15.4206 19.2106 15.5431 19.2369 15.677C19.2633 15.8112 19.2496 15.9501 19.1977 16.0763C19.1458 16.2023 19.0583 16.3094 18.9469 16.3845C18.8358 16.4594 18.7057 16.4994 18.5729 16.5H1.42828C1.2951 16.4999 1.16458 16.4601 1.05316 16.3851C0.941689 16.3101 0.854136 16.2031 0.802251 16.077C0.750348 15.9509 0.736686 15.8119 0.76318 15.6777C0.789669 15.5436 0.854968 15.4209 0.950132 15.3251L1.95985 14.3081ZM10.0008 22.25C9.06433 22.25 8.16527 21.8758 7.50167 21.2082C7.01619 20.7198 6.68588 20.1035 6.54347 19.4375H13.4582C13.3158 20.1035 12.9855 20.7198 12.5 21.2082C11.8364 21.8758 10.9373 22.25 10.0008 22.25Z"
        stroke="#030303"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.90999 0.954912L4.95508 4.90982L1.00017 0.954912"
        stroke="black"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="15"
      height="16"
      viewBox="0 0 15 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.2728 0.5C12.8635 0.5 13.43 0.734631 13.8477 1.15228C14.2654 1.56998 14.5 2.13648 14.5 2.72717C14.5 3.31785 14.2654 3.88435 13.8477 4.30204C13.8477 4.30204 13.8477 4.30205 13.8477 4.30205L3.64974 14.5H0.5V11.3503L10.6979 1.15231C10.698 1.1523 10.698 1.1523 10.698 1.1523C11.1157 0.734636 11.6821 0.5 12.2728 0.5Z"
        stroke="#767675"
      />
      <path
        d="M6 15H12"
        stroke="#767675"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 6.5L8.5 3L0.5 11.5V14.5H4L12 6.5Z" fill="#767675" />
    </svg>
  );
}

function VerificationIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.2097 0.374357C13.6184 -0.124765 14.3816 -0.124766 14.7903 0.374357L16.4808 2.43918C16.7585 2.77843 17.2218 2.90256 17.632 2.74764L20.1284 1.80471C20.7319 1.57678 21.3929 1.95842 21.4972 2.59499L21.9289 5.22844C21.9998 5.66111 22.3389 6.00025 22.7716 6.07116L25.405 6.50278C26.0416 6.60711 26.4232 7.26813 26.1953 7.87159L25.2524 10.368C25.0975 10.7782 25.2216 11.2415 25.5608 11.5192L27.6257 13.2097C28.1248 13.6184 28.1248 14.3817 27.6257 14.7903L25.5608 16.4808C25.2216 16.7586 25.0975 17.2218 25.2524 17.632L26.1953 20.1284C26.4232 20.7319 26.0416 21.3929 25.405 21.4973L22.7716 21.9289C22.3389 21.9998 21.9998 22.3389 21.9289 22.7716L21.4972 25.405C21.3929 26.0416 20.7319 26.4233 20.1284 26.1953L17.632 25.2524C17.2218 25.0975 16.7585 25.2216 16.4808 25.5608L14.7903 27.6257C14.3816 28.1248 13.6184 28.1248 13.2097 27.6257L11.5192 25.5608C11.2415 25.2216 10.7782 25.0975 10.368 25.2524L7.87158 26.1953C7.26812 26.4233 6.6071 26.0416 6.50277 25.405L6.07115 22.7716C6.00023 22.3389 5.66109 21.9998 5.22843 21.9289L2.59498 21.4973C1.9584 21.3929 1.57676 20.7319 1.80469 20.1284L2.74762 17.632C2.90254 17.2218 2.77841 16.7586 2.43917 16.4808L0.374342 14.7903C-0.124781 14.3817 -0.124781 13.6184 0.374342 13.2097L2.43917 11.5192C2.77841 11.2415 2.90254 10.7782 2.74762 10.368L1.80469 7.87159C1.57676 7.26814 1.9584 6.60711 2.59498 6.50278L5.22843 6.07116C5.66109 6.00025 6.00023 5.66111 6.07115 5.22844L6.50277 2.59499C6.6071 1.95842 7.26812 1.57678 7.87158 1.80471L10.368 2.74764C10.7782 2.90256 11.2415 2.77843 11.5192 2.43918L13.2097 0.374357Z"
        fill="#4CA65A"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.3273 11.2808L12.0303 19.5778L7.67285 15.2204L9.52997 13.3633L12.0303 15.8636L18.4701 9.42372L20.3273 11.2808Z"
        fill="white"
      />
    </svg>
  );
}

function QuestionMarkIcon() {
  return (
    <svg
      width="12"
      height="18"
      viewBox="0 0 12 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.288 0.079999C7.92 0.079999 9.224 0.527999 10.2 1.424C11.192 2.32 11.688 3.544 11.688 5.096C11.688 6.712 11.176 7.928 10.152 8.744C9.128 9.56 7.768 9.968 6.072 9.968L5.976 11.864H3.6L3.48 8.096H4.272C5.824 8.096 7.008 7.888 7.824 7.472C8.656 7.056 9.072 6.264 9.072 5.096C9.072 4.248 8.824 3.584 8.328 3.104C7.848 2.624 7.176 2.384 6.312 2.384C5.448 2.384 4.768 2.616 4.272 3.08C3.776 3.544 3.528 4.192 3.528 5.024H0.96C0.96 4.064 1.176 3.208 1.608 2.456C2.04 1.704 2.656 1.12 3.456 0.704C4.272 0.287999 5.216 0.079999 6.288 0.079999ZM4.752 17.168C4.256 17.168 3.84 17 3.504 16.664C3.168 16.328 3 15.912 3 15.416C3 14.92 3.168 14.504 3.504 14.168C3.84 13.832 4.256 13.664 4.752 13.664C5.232 13.664 5.64 13.832 5.976 14.168C6.312 14.504 6.48 14.92 6.48 15.416C6.48 15.912 6.312 16.328 5.976 16.664C5.64 17 5.232 17.168 4.752 17.168Z"
        fill="#767675"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="10"
      height="14"
      viewBox="0 0 10 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.33334 10.1765V9.5508C6.33334 8.79444 7.20978 8.07979 7.77808 7.56924C8.57867 6.8507 9 5.88523 9 4.75402C9 2.66846 7.22993 1.00001 5.00001 1.00001C4.4743 0.99862 3.95349 1.09477 3.46752 1.28293C2.98155 1.47109 2.54 1.74756 2.16827 2.09643C1.79654 2.4453 1.50196 2.85969 1.30147 3.31578C1.10098 3.77186 0.99853 4.26065 1.00002 4.75402C1.00002 5.84463 1.43913 6.87573 2.22253 7.5698C2.78727 8.07033 3.66668 8.78721 3.66668 9.5508V10.1765"
        stroke="black"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.19995 13H5.79995"
        stroke="black"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.40015 11.5883H6.60015"
        stroke="black"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.00024 10.1765V6.64709"
        stroke="black"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.79995 6.64709C5.79995 6.64709 5.34717 6.64709 4.99995 6.64709C4.65273 6.64709 4.19995 6.64709 4.19995 6.64709"
        stroke="black"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      width="47"
      height="64"
      viewBox="0 0 47 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.7964 49.6585C14.3447 49.335 14.9453 49.0212 15.5948 48.7239C15.047 49.5445 14.4588 50.3374 13.8323 51.0996C12.7356 52.4231 11.8838 53.1257 11.3452 53.3446C11.3007 53.3631 11.2549 53.3784 11.2081 53.3904C11.1692 53.3359 11.1353 53.2779 11.107 53.2172C10.8883 52.7891 10.8948 52.3708 11.2636 51.8087C11.6782 51.1617 12.5137 50.4199 13.7964 49.6585ZM23.4118 43.2012C22.9484 43.2992 22.4849 43.3973 22.0181 43.5051C22.7101 42.1522 23.3629 40.7797 23.9765 39.3876C24.5966 40.5379 25.2625 41.6588 25.974 42.7535C25.1254 42.8777 24.267 43.028 23.4118 43.2012ZM33.3014 46.8808C32.693 46.3896 32.1234 45.852 31.5977 45.273C32.492 45.2926 33.2981 45.3612 33.9966 45.4854C35.2369 45.7109 35.8211 46.0638 36.0235 46.3057C36.0888 46.371 36.1247 46.4625 36.1279 46.5573C36.1141 46.8339 36.0335 47.103 35.8929 47.3416C35.8134 47.5318 35.6864 47.6983 35.5241 47.8252C35.4431 47.8751 35.3476 47.8959 35.2532 47.884C34.9007 47.8742 34.2414 47.6259 33.3014 46.8808ZM24.5868 28.2704C24.4302 29.2279 24.1625 30.3259 23.8035 31.5219C23.6716 31.0743 23.5562 30.6219 23.4575 30.1657C23.1572 28.7802 23.1148 27.6953 23.2747 26.9404C23.4249 26.2476 23.7056 25.9698 24.045 25.8293C24.2259 25.7508 24.4172 25.699 24.6129 25.6757C24.6979 25.925 24.7398 26.1869 24.737 26.4502C24.7475 27.0615 24.6972 27.6723 24.5868 28.2737V28.2704Z"
        fill="#F5F5F5"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.83333 0.93811H28.5656C29.604 0.939026 30.5995 1.35277 31.3333 2.08839L45.8511 16.6238C46.2153 16.988 46.5042 17.4205 46.7014 17.8965C46.8985 18.3726 47 18.8828 47 19.3982V55.838C47 57.918 46.1747 59.9129 44.7057 61.3837C43.2366 62.8545 41.2442 63.6808 39.1667 63.6808H7.83333C5.7558 63.6808 3.76336 62.8545 2.29433 61.3837C0.825294 59.9129 0 57.918 0 55.838V8.78095C0 6.7009 0.825294 4.70604 2.29433 3.23522C3.76336 1.76441 5.7558 0.93811 7.83333 0.93811ZM29.375 6.82024V14.6631C29.375 15.7031 29.7876 16.7005 30.5222 17.4359C31.2567 18.1714 32.2529 18.5845 33.2917 18.5845H41.125L29.375 6.82024ZM8.47958 54.5374C8.83208 55.2432 9.38042 55.8837 10.1931 56.1811C10.9379 56.4315 11.7498 56.3894 12.4648 56.0635C13.7116 55.5537 14.9519 54.3544 16.0942 52.9819C17.3998 51.4068 18.7706 49.3448 20.0925 47.0573C22.6479 46.2995 25.2647 45.767 27.9128 45.4658C29.0878 46.969 30.3019 48.2631 31.4769 49.1912C32.5736 50.0539 33.84 50.7728 35.1358 50.8251C35.8408 50.8611 36.5392 50.6748 37.1333 50.2859C37.7334 49.8768 38.2125 49.3135 38.5204 48.6553C38.8729 47.9461 39.0883 47.2043 39.059 46.4462C39.0337 45.7007 38.7576 44.9856 38.2756 44.4169C37.3944 43.3581 35.9419 42.8483 34.5156 42.5934C32.7862 42.3251 31.0315 42.2593 29.2869 42.3973C27.8137 40.3123 26.5292 38.0999 25.4485 35.7865C26.4277 33.1983 27.1621 30.7507 27.4852 28.7508C27.628 27.9563 27.6914 27.1495 27.6745 26.3424C27.6701 25.6103 27.5005 24.8886 27.1784 24.2313C26.9922 23.8688 26.7278 23.5523 26.4043 23.3048C26.0809 23.0572 25.7064 22.8848 25.3082 22.8C24.5183 22.6334 23.7024 22.8 22.9582 23.1039C21.4797 23.6921 20.6996 24.947 20.4058 26.3293C20.1186 27.6626 20.2492 29.2148 20.5853 30.7867C20.9313 32.3781 21.5188 34.1101 22.2695 35.8649C21.067 38.8596 19.6782 41.7759 18.1113 44.5966C16.0921 45.2322 14.1458 46.08 12.3049 47.1259C10.8557 47.9886 9.56646 49.0082 8.79292 50.2108C7.97042 51.4885 7.71583 53.0113 8.47958 54.5374Z"
        fill="#F5F5F5"
      />
    </svg>
  );
}

function CloseXIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 1L15.1421 15.1421"
        stroke="white"
        strokeOpacity="0.5"
        strokeWidth="2"
      />
      <path
        d="M15.2131 1L1.071 15.1421"
        stroke="white"
        strokeOpacity="0.5"
        strokeWidth="2"
      />
    </svg>
  );
}

function OkIcon() {
  return (
    <svg
      width="14"
      height="11"
      viewBox="0 0 14 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.9998 0.954866L4.95505 8.9997L1.00014 5.04478"
        stroke="#4CA65A"
        stroke-width="2"
      />
    </svg>
  );
}

export default ProfileDashboard;
