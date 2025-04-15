import React from "react";
import { Refine } from "@refinedev/core";
import { BrowserRouter } from "react-router-dom";

// Import providers and components
import { authProvider } from "./authProvider";
import dataProvider from "./dataProvider";
import { NotificationProvider } from "./context/notificationContext";
import AppRouter from "./Router";

// Import styles
import "./App.css";

/**
 * Main App component that sets up the application with necessary providers
 * and routing configuration.
 */
function App() {
  return (
    <Refine
      authProvider={authProvider} // Handles authentication and authorization
      dataProvider={dataProvider} // Handles data fetching and mutations
      resources={[]} // Define API resources here if needed
    >
      <NotificationProvider> {/* Provides notification context for the app */}
        <BrowserRouter> {/* Handles client-side routing */}
          <AppRouter /> {/* Defines the application routes */}
        </BrowserRouter>
      </NotificationProvider>
    </Refine>
  );
}

export default App;
