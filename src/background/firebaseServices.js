import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export async function getUserSubscriptionStatus(userId) {
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
}

export async function getUserInspirations(userId) {
  try {
    const userDoc = doc(db, "users", userId);
    const userSnapshot = await getDoc(userDoc);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      return userData.inspirations || [];
    } else {
      console.log("No such document for user:", userId);
      return [];
    }
  } catch (error) {
    console.error("Error getting inspirations:", error);
    throw error;
  }
}
export async function createNewInspirationCollection(userId, collectionName) {
  const userDoc = doc(db, "users", userId);
  const userSnapshot = await getDoc(userDoc);
  if (userSnapshot.exists()) {
    const userData = userSnapshot.data();
    userData.inspirations.push({
      name: collectionName,
      thumbnails: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await setDoc(userDoc, userData);
    return userData.inspirations[userData.inspirations.length - 1];
  } else {
    console.log("No such document for user:", userId);
    return null;
  }
}
