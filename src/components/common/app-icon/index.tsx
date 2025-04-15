/**
 * App Icon Component
 * Displays the application logo
 */

import { Image } from "antd";
import React from "react";

/** Path to the application logo */
const LOGO_PATH = "/images/logo.png";

/**
 * App Icon Component
 * @returns {React.ReactElement} Application logo image
 */
export const AppIcon: React.FC = () => {
  return <Image src={LOGO_PATH} preview={false} alt="App Logo" />;
};
