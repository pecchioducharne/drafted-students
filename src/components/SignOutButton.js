import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase"; // Import Firebase auth from your firebase.js file
import "./SignOutButton.css"; // Create a CSS file for styling

const SignOutButton = () => {
  const handleSignOut = async () => {
    try {
      await signOut(auth); // Sign the user out
      // You can add any additional logic after signing out, such as redirecting to the login page
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <button className="sign-out-button" onClick={handleSignOut}>
      Sign Out
    </button>
  );
};

export default SignOutButton;
