import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export const getUserSubscriptionStatus = async (userId) => {
  try {
    const userDoc = doc(db, "users", userId);
    const userSnapshot = await getDoc(userDoc);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      return userData.subscriptionStatus || "inactive";
    } else {
      console.log("No such document for user:", userId);
      return "inactive";
    }
  } catch (error) {
    console.error("Error getting subscription status:", error);
    throw error;
  }
};
