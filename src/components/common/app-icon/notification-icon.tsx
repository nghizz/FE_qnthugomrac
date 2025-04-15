/**
 * Notification Icon Component
 * Displays a bell icon with a badge showing the number of notifications
 */

import React from "react";
import { Badge } from "antd";
import { BellOutlined } from "@ant-design/icons";

/** Maximum number to display in badge before showing "+" */
const MAX_BADGE_COUNT = 99;

interface NotificationIconProps {
  /** Number of notifications to display */
  count: number;
}

/**
 * Notification Icon Component
 * @param {NotificationIconProps} props - Component props
 * @returns {React.ReactElement} Notification icon with badge
 */
const NotificationIcon: React.FC<NotificationIconProps> = ({ count }) => (
  <Badge count={count} overflowCount={MAX_BADGE_COUNT}>
    <BellOutlined style={{ fontSize: '20px' }} />
  </Badge>
);

export default NotificationIcon;
