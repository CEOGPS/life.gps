import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';


const firebaseConfig = {
    apiKey: "AIzaSyBZZtYxMJLwAqaxz3dUzeuYoCq8OJBucNU",
    authDomain: "sheetsgpt-50cfc.firebaseapp.com",
    projectId: "sheetsgpt-50cfc",
    storageBucket: "sheetsgpt-50cfc.appspot.com",
    messagingSenderId: "529615300855",
    appId: "1:529615300855:web:f7624fa5fd6dfe7ffccbf2",
    measurementId: "G-1WPB38KLHT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
if (app) {
    console.log("firebase started...");
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.greeting === "hello") {
        console.log("ENTER");

        // Correctly store userEmail and uid in local storage
        if (request.userEmail) chrome.storage.local.set({ userEmail: request.userEmail }, function () {
            console.log('User email is saved');
        });

        if (request.uid) chrome.storage.local.set({ uid: request.uid }, function () {
            console.log('UID is saved');
        });

        // Send response back to the sender
        sendResponse({ farewell: "goodbye", output: request.userEmail });
    }

    if (request.action === "getSubscriptionType") {
        chrome.storage.local.get(['uid'], function (result) {
            const uid = result.uid;
            if (uid) {
                getUserPlanType(uid).then(subscriptionPlan => {
                    sendResponse({ subscriptionType: subscriptionPlan });
                }).catch(error => {
                    console.error("Error fetching subscription plan:", error);
                    sendResponse({ error: "Error fetching subscription plan." });
                });
            } else {
                sendResponse({ error: "User ID not found." });
            }
        });
        return true; // Keep the message channel open for the async response
    }



});


function getUserPlanType(uid) {

    const priceIds = {
        'price_1P7n0lBVUvIPdGg34EGj36xP' : 'monthly', // Replace with your actual Stripe Price ID for monthly plan //limited time offer
        'price_1P7n0MBVUvIPdGg3bxCzn3Bc' : 'yearly', // Replace with your actual Stripe Price ID for yearly plan //limited time offer
        'price_1OxBFUBVUvIPdGg3rH62pPV3' : 'yearly', //old
        'price_1OxBESBVUvIPdGg3u6EWQCaB' : 'monthly,' //old
    };

    return new Promise((resolve, reject) => {
        const cacheKey = `subscription-${uid}`;
        const timestampKey = `${cacheKey}-timestamp`;
        const endPeriodKey = `${cacheKey}-endPeriod`;

        chrome.storage.local.get([cacheKey, timestampKey, endPeriodKey], (result) => {
            const now = new Date().getTime();
            const cachedData = result[cacheKey];
            const lastFetch = result[timestampKey];
            const endPeriod = result[endPeriodKey];

            // Determine if cache is still valid
            const isYearlySubscription = cachedData === 'yearly';
            const nextCheck = isYearlySubscription ? new Date(lastFetch).setMonth(new Date(lastFetch).getMonth() + 1) : endPeriod;
            console.log(nextCheck);
            
            if (cachedData && ((cachedData !== 'free' && now < nextCheck) || (cachedData === 'free' && lastFetch && now - lastFetch < 300000))) {
                console.log("Using cached data for plan");
                return resolve(cachedData);
            } else {
                // Fetch subscription from database
                const userSubscriptionsRef = collection(db, `users/${uid}/subscriptions`);
                const q = query(userSubscriptionsRef, where('status', 'in', ['trialing', 'active']));

                getDocs(q).then(snapshot => {
                    if (!snapshot.empty) {
                        const doc = snapshot.docs[0];
                        const subscriptionData = doc.data();
                        const planID = subscriptionData.items[0].plan.id;
                        const planType = priceIds[planID] || 'free';
                        const currentPeriodEndTimestamp = subscriptionData.current_period_end.toDate();
                        const currentPeriodEndDate = currentPeriodEndTimestamp.getTime();

                        // Adjust cache expiration based on subscription type
                        const cacheExpiration = planType === 'yearly' ? new Date().setMonth(new Date().getMonth() + 1) : currentPeriodEndDate;

                        chrome.storage.local.set({
                            [cacheKey]: planType,
                            [timestampKey]: now,
                            [endPeriodKey]: cacheExpiration
                        }, () => {
                            resolve(planType);
                        });
                    } else {
                        resolve('free'); // No active subscription found
                    }
                }).catch(error => {
                    reject(error); // Handle potential errors
                });
            }
        });
    });
}



let uid = null;
let userEmail = null;
chrome.storage.local.get(['uid', 'userEmail'], function (result) {
    uid = result.uid;
    userEmail = result.userEmail;
    //console.log(uid);
    //console.log(userEmail);

    if (uid != null) {
        getUserPlanType(uid).then(subscriptionPlan => {
            console.log(subscriptionPlan); // Correctly logs the subscription plan
        }).catch(error => {
            console.error("Error fetching subscription plan:", error);
        });
    }
});

