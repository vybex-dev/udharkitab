import "dotenv/config";

export default {
  expo: {
    name: "UdharKitab",
    slug: "udharkitab",
    owner: "broke_founder",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#534AB7",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.udharkitab.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#534AB7",
      },
      package: "com.udharkitab.app",
      googleServicesFile: "./google-services.json",
    },
    plugins: [
      "expo-router",
      "expo-sqlite",
      "expo-font",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
    ],
    scheme: "udharkitab",
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      eas: {
        projectId: "e3d5f686-0757-44a4-b08c-64c38e893f93",
      },
    },
  },
};
