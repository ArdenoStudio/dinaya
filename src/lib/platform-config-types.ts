export type Announcement = {
  message: string;
  tone: "info" | "warning" | "critical";
  active: boolean;
  updatedAt: string;
  updatedBy: string;
};
