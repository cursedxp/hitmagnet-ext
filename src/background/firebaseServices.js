import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { v4 as uuidv4 } from "uuid";
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
      id: uuidv4(),
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
export async function updateInspirationCollection(
  userId,
  collectionId,
  thumbnails
) {
  const userDoc = doc(db, "users", userId);
  const userSnapshot = await getDoc(userDoc);
  if (userSnapshot.exists()) {
    const userData = userSnapshot.data();
    const collection = userData.inspirations.find((c) => c.id === collectionId);
    if (collection) {
      collection.thumbnails = [...collection.thumbnails, ...thumbnails];
      collection.updatedAt = new Date();
      await setDoc(userDoc, userData);
      return true;
    } else {
      console.log("Collection not found:", collectionId);
      return false;
    }
  }
}
